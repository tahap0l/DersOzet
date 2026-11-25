/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
 *
 * /api/yt: programdaki konu için YouTube'da ders videosu bulur. API anahtarı kullanmaz;
 * YouTube'un arama sayfasını okur. Kısa videoları (Shorts) ve çok eski videoları eler,
 * yeni ve çok izlenen videoları öne alır. Öğrencinin seçtiği hocaların kanalları önce gelir.
 *   GET /api/yt?q=Mutlak Değer&s=Matematik&t=Rehber Matematik|Şenol Hoca
 */
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const json = (o, status = 200, cache) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cache || 'no-store', 'access-control-allow-origin': '*' } });

const norm = s => String(s || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/[^a-z0-9]+/g, '');
const text = o => !o ? '' : typeof o === 'string' ? o : o.simpleText || (Array.isArray(o.runs) ? o.runs.map(r => r.text).join('') : '') || o.content || '';

function ageDays(t){
  const m = String(t || '').toLocaleLowerCase('tr').match(/(\d+)\s*(saniye|dakika|saat|gün|hafta|ay|yıl|second|minute|hour|day|week|month|year)/);
  if (!m) return null;
  const n = Number(m[1]), u = m[2];
  const k = /saniye|dakika|saat|second|minute|hour/.test(u) ? 0 : /gün|day/.test(u) ? 1 : /hafta|week/.test(u) ? 7 : /ay|month/.test(u) ? 30 : 365;
  return n * k;
}
function views(t){
  const s = String(t || '').toLocaleLowerCase('tr');
  const m = s.match(/([\d.,]+)\s*(b|bin|mn|milyon|k|m)?\b/);
  if (!m) return 0;
  let n = Number(m[1].replace(/\./g, '').replace(',', '.'));
  if (/^(b|bin|k)$/.test(m[2] || '')) n *= 1e3; else if (/^(mn|milyon|m)$/.test(m[2] || '')) n *= 1e6;
  return Math.round(n) || 0;
}
function secs(t){ const p = String(t || '').split(':').map(Number); if (p.some(isNaN) || !p.length) return 0; return p.reduce((a, b) => a * 60 + b, 0); }

function parse(html){
  const i = html.indexOf('ytInitialData');
  if (i < 0) return [];
  const s = html.indexOf('{', i);
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let k = s; k < html.length; k++){
    const c = html[k];
    if (inStr){ if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true; else if (c === '{') depth++; else if (c === '}'){ depth--; if (!depth){ end = k + 1; break; } }
  }
  if (end < 0) return [];
  let data; try { data = JSON.parse(html.slice(s, end)); } catch(e){ return []; }
  const out = [], seen = new Set();
  const walk = (o, d) => {
    if (!o || typeof o !== 'object' || d > 40) return;
    if (Array.isArray(o)){ o.forEach(x => walk(x, d + 1)); return; }
    const v = o.videoRenderer;
    if (v && v.videoId && !seen.has(v.videoId)){
      seen.add(v.videoId);
      const own = (v.ownerText || v.longBylineText || {}).runs || [];
      const be = own[0] && own[0].navigationEndpoint && own[0].navigationEndpoint.browseEndpoint || {};
      out.push({ id: v.videoId, title: text(v.title).slice(0, 140), ch: own[0] ? own[0].text : '', chUrl: be.canonicalBaseUrl || '',
        age: text(v.publishedTimeText), days: ageDays(text(v.publishedTimeText)), views: views(text(v.viewCountText) || text(v.shortViewCountText)),
        len: text(v.lengthText), sec: secs(text(v.lengthText)), live: !!(v.badges || []).find(b => /canl|live/i.test(JSON.stringify(b))) });
    }
    for (const k in o) if (k !== 'videoRenderer') walk(o[k], d + 1);
  };
  walk(data, 0);
  return out;
}

async function search(q){
  const url = 'https://www.youtube.com/results?hl=tr&gl=TR&search_query=' + encodeURIComponent(q);
  const r = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'tr-TR,tr;q=0.9', cookie: 'CONSENT=YES+cb; SOCS=CAI' }, cf: { cacheTtl: 21600, cacheEverything: true } });
  if (!r.ok) throw new Error('yt ' + r.status);
  return parse(await r.text());
}

function score(v, teachers){
  let s = Math.log10(v.views + 10) * 2;
  const d = v.days == null ? 900 : v.days;
  s -= d / 365 * 1.6;                       // yeni videolar öne
  if (d > 365 * 6) s -= 6;                  // çok eski
  if (v.sec < 240) s -= 8;                  // Shorts ve çok kısa
  if (v.sec > 4 * 3600) s -= 3;
  if (v.live) s -= 4;
  if (/konu anlat|ders|tyt|ayt|yks/i.test(v.title)) s += 1;
  if (teachers.some(t => norm(v.ch).includes(t) || norm(v.chUrl).includes(t))) s += 8;
  return s;
}

export async function onRequestGet({ request }){
  const u = new URL(request.url);
  const q = (u.searchParams.get('q') || '').trim().slice(0, 120);
  const subj = (u.searchParams.get('s') || '').trim().slice(0, 40);
  const teachers = (u.searchParams.get('t') || '').split('|').map(x => x.trim()).filter(Boolean).slice(0, 3);
  if (q.length < 2) return json({ error: 'bad_request' }, 400);
  const tn = teachers.map(norm).filter(x => x.length >= 3);
  try {
    const base = `${q} ${subj} konu anlatımı`.replace(/\s+/g, ' ').trim();
    const jobs = [search(base + ' YKS')].concat(teachers.map(t => search(`${q} ${t}`)));
    const lists = await Promise.all(jobs.map(p => p.catch(() => [])));
    const all = new Map();
    lists.flat().forEach(v => { if (!all.has(v.id)) all.set(v.id, v); });
    const list = Array.from(all.values()).map(v => Object.assign(v, { score: score(v, tn), mine: tn.some(t => norm(v.ch).includes(t) || norm(v.chUrl).includes(t)) }))
      .filter(v => v.sec >= 240 && !v.live).sort((a, b) => b.score - a.score).slice(0, 8)
      .map(({ id, title, ch, chUrl, age, days, views, len, mine }) => ({ id, title, ch, chUrl, age, days, views, len, mine }));
    return json({ q, videos: list }, 200, list.length ? 'public, max-age=21600' : 'no-store');
  } catch(e){
    return json({ error: 'yt', detail: String(e && e.message || e).slice(0, 200) }, 502);
  }
}
