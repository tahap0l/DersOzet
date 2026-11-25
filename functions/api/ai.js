/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
 *
 * /api/ai: uygulamanın kendi yapay zekâsı. Cloudflare Workers AI üzerinde çalışır; öğrencinin
 * API anahtarı girmesine ya da model indirmesine gerek yoktur. Yalnızca giriş yapmış öğrenciler
 * kullanabilir: her istekte Supabase'deki ai_left() oturumu ve günlük hakkı denetler; model yanıt
 * verince ai_take() hakkı düşer. Model hata verirse hak gitmez.
 * Workers AI bağlantısı (AI) kök dizindeki wrangler.toml dosyasında tanımlıdır.
 */
const SUPA = 'https://gwmetoexnklzdyzrvgdv.supabase.co';
const KEY = 'sb_publishable_jwY5M8lzep4mvJoqUQQbzQ_scsnOrDK';
const MODEL = '@cf/google/gemma-4-26b-a4b-it';
const MAX_IMG = 3_000_000; // base64 karakter

const json = (o, status = 200, extra) => new Response(JSON.stringify(o), { status, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, extra || {}) });

async function rpc(fn, args, auth){
  const r = await fetch(`${SUPA}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: KEY, Authorization: auth, 'content-type': 'application/json' }, body: JSON.stringify(args || {}) });
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch(e){}
  return { status: r.status, data: j };
}

function cleanMessages(list){
  if (!Array.isArray(list) || !list.length || list.length > 40) return null;
  let chars = 0, img = 0;
  const out = [];
  for (const m of list){
    if (!m || !['system', 'user', 'assistant'].includes(m.role)) return null;
    if (typeof m.content === 'string'){ chars += m.content.length; out.push({ role: m.role, content: m.content }); continue; }
    if (!Array.isArray(m.content) || m.role !== 'user') return null;
    const parts = [];
    for (const p of m.content){
      if (p && p.type === 'text' && typeof p.text === 'string'){ chars += p.text.length; parts.push({ type: 'text', text: p.text }); }
      else if (p && p.type === 'image_url' && p.image_url && typeof p.image_url.url === 'string' && /^data:image\/(png|jpe?g|webp);base64,/.test(p.image_url.url)){ img += p.image_url.url.length; parts.push({ type: 'image_url', image_url: { url: p.image_url.url } }); }
      else return null;
    }
    out.push({ role: 'user', content: parts });
  }
  if (chars > 60000 || img > MAX_IMG) return null;
  return { messages: out, hasImg: img > 0 };
}

const textOf = r => {
  if (!r) return '';
  if (typeof r.response === 'string') return r.response;
  if (r.response && typeof r.response === 'object') return JSON.stringify(r.response);
  const c = r.choices && r.choices[0];
  return (c && c.message && c.message.content) || '';
};

export async function onRequestGet({ env }){
  return json({ ok: true, ai: !!(env && env.AI), model: MODEL });
}

export async function onRequestPost({ request, env }){
  if (!env.AI) return json({ error: 'no_ai' }, 503);
  const auth = request.headers.get('Authorization') || '';
  if (!/^Bearer \S+/.test(auth)) return json({ error: 'not_signed_in' }, 401);
  let body; try { body = await request.json(); } catch(e){ return json({ error: 'bad_request' }, 400); }
  const m = cleanMessages(body && body.messages);
  if (!m) return json({ error: 'bad_request' }, 400);
  const think = !!body.think;
  const maxTokens = Math.max(64, Math.min(Number(body.maxTokens) || 1500, think ? 8000 : 4000));
  const cost = 1 + (m.hasImg ? 1 : 0) + (think ? 1 : 0) + (maxTokens > 2500 ? 1 : 0);

  const left = await rpc('ai_left', {}, auth);
  if (left.status === 401 || left.status === 403) return json({ error: 'not_signed_in' }, 401);
  if (left.status !== 200 || !left.data) return json({ error: 'quota_check' }, 502);
  const lim = Number(left.data.limit) || 0, used = Number(left.data.used) || 0;
  if (used + cost > lim) return json({ error: 'quota', used, limit: lim }, 429);
  const quota = { 'x-ai-used': String(used + cost), 'x-ai-limit': String(lim) };
  const charge = () => rpc('ai_take', { cost }, auth).catch(() => null);

  const input = { messages: m.messages, max_tokens: maxTokens, temperature: think ? 0.6 : 0.4, chat_template_kwargs: { enable_thinking: think } };
  try {
    if (body.stream){
      const stream = await env.AI.run(MODEL, Object.assign({ stream: true }, input));
      await charge();
      return new Response(stream, { headers: Object.assign({ 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store' }, quota) });
    }
    const r = await env.AI.run(MODEL, input);
    await charge();
    return json({ text: textOf(r), used: used + cost, limit: lim }, 200, quota);
  } catch(e){
    const msg = String((e && e.message) || e);
    const code = /3036|free allocation/i.test(msg) ? 'busy_day' : /3040|capacity|429/i.test(msg) ? 'busy' : 'model';
    return json({ error: code, detail: msg.slice(0, 300) }, 502);
  }
}
