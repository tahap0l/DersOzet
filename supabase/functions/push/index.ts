// Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
//
// push: telefon bildirimlerini gönderir.
//  - mode "cron" (zamanlayıcı, x-cron anahtarıyla): hocanın yeni programlarını ilgili öğrencilere
//    bildirir; günlük hatırlatma saati gelen aboneliklere kalan görev / tekrar bekleyen yanlış /
//    seri hatırlatması yollar. Saatler Türkiye saatine göredir (UTC+3).
//  - mode "test" (giriş yapmış kullanıcı): kendi cihazlarına deneme bildirimi.
// Anahtarlar Vault'tan push_config() ile okunur.
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2.49.4';

const URL_ = Deno.env.get('SUPABASE_URL')!;
const SRK = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(URL_, SRK, { auth: { persistSession: false } });
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type', 'access-control-allow-methods': 'POST, OPTIONS' };
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', ...cors } });

let cfg: Record<string, string> | null = null;
async function config(){
  if (cfg) return cfg;
  const { data, error } = await db.rpc('push_config');
  if (error || !data) throw new Error('config');
  cfg = data as Record<string, string>;
  webpush.setVapidDetails('https://dersozet.pages.dev', cfg.vapid_public, cfg.vapid_private);
  return cfg;
}

type Sub = { endpoint: string; user_id: string; p256dh: string; auth: string; remind_at: string | null; programs: boolean; last_daily: string | null; fails: number };
type Msg = { title: string; body: string; url?: string; tag?: string };

async function send(s: Sub, m: Msg){
  try {
    await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(m), { TTL: 6 * 3600, urgency: 'normal' });
    if (s.fails) await db.from('push_subs').update({ fails: 0 }).eq('endpoint', s.endpoint);
    return true;
  } catch(e){
    const code = (e as { statusCode?: number }).statusCode || 0;
    console.error('push gönderilemedi', code, String((e as Error).message || e).slice(0, 160), s.endpoint.slice(0, 40));
    if (code === 404 || code === 410 || s.fails >= 5) await db.from('push_subs').delete().eq('endpoint', s.endpoint);
    else await db.from('push_subs').update({ fails: s.fails + 1 }).eq('endpoint', s.endpoint);
    return false;
  }
}

/* Türkiye saati */
function trNow(){
  const d = new Date(Date.now() + 3 * 3600e3);
  const p = (n: number) => String(n).padStart(2, '0');
  const key = (x: Date) => x.getUTCFullYear() + '-' + p(x.getUTCMonth() + 1) + '-' + p(x.getUTCDate());
  const di = (d.getUTCDay() + 6) % 7, mon = new Date(d.getTime() - di * 864e5);
  return { hm: p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()), min: d.getUTCHours() * 60 + d.getUTCMinutes(), today: key(d), di, monday: key(mon),
    dayKey: (back: number) => key(new Date(d.getTime() - back * 864e5)) };
}
const toMin = (hm: string) => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };

/* hocanın yeni programları */
async function programs(){
  const since = new Date(Date.now() - 2 * 3600e3).toISOString();
  const { data: progs } = await db.from('programs').select('id, title, class_id, student_id, institution_id').is('notified_at', null).gte('created_at', since).limit(200);
  let sent = 0;
  for (const p of progs || []){
    let users: string[] = [];
    if (p.student_id) users = [p.student_id];
    else if (p.class_id){ const { data } = await db.from('memberships').select('user_id').eq('class_id', p.class_id).eq('role', 'student'); users = (data || []).map(r => r.user_id); }
    await db.from('programs').update({ notified_at: new Date().toISOString() }).eq('id', p.id);
    if (!users.length) continue;
    const { data: subs } = await db.from('push_subs').select('*').in('user_id', users).eq('programs', true);
    for (const s of (subs || []) as Sub[]) if (await send(s, { title: 'Yeni program geldi', body: `Hocan ${p.title ? '"' + p.title + '" programını' : 'yeni bir program'} gönderdi. Haftana bir bak.`, url: './#/program', tag: 'prog-' + p.id })) sent++;
  }
  return sent;
}

/* günlük hatırlatma */
async function daily(){
  const t = trNow();
  const { data } = await db.from('push_subs').select('*').not('remind_at', 'is', null).or(`last_daily.is.null,last_daily.lt.${t.today}`).limit(1000);
  const due = ((data || []) as Sub[]).filter(s => { const m = toMin(s.remind_at!); return m <= t.min && t.min - m < 60; });
  if (!due.length) return 0;
  const users = Array.from(new Set(due.map(s => s.user_id)));
  const { data: states } = await db.from('user_state').select('user_id, data').in('user_id', users);
  const { data: wrongs } = await db.from('notes').select('user_id').in('user_id', users).eq('kind', 'wrong').eq('status', 'open').lte('review_at', t.today);
  const byUser: Record<string, Msg | null> = {};
  for (const u of users){
    const st = (states || []).find(x => x.user_id === u), d = (st && st.data) || {};
    const tasks = (((d.weeks || {})[t.monday] || {}).tasks || []).filter((x: { day: number }) => x.day === t.di);
    const open = tasks.filter((x: { done?: boolean }) => !x.done);
    const days = (d.stats && d.stats.days) || {};
    const active = (k: string) => { const x = days[k]; return !!x && (x.tasks > 0 || x.focus >= 10); };
    let streak = 0; for (let i = active(t.today) ? 0 : 1; i < 400 && active(t.dayKey(i)); i++) streak++;
    const nw = (wrongs || []).filter(x => x.user_id === u).length;
    const name = String((d.profile && d.profile.name) || '').trim().split(/\s+/)[0];
    if (open.length){
      const list = open.slice(0, 2).map((x: { label?: string; text?: string }) => String(x.label || x.text || '').slice(0, 40)).join(', ');
      byUser[u] = { title: `Bugün ${open.length} görevin kaldı${name ? ', ' + name : ''}`, body: list + (open.length > 2 ? ' ve diğerleri' : '') + (nw ? ` · ${nw} yanlış tekrar bekliyor` : ''), url: './#/bugun', tag: 'daily' };
    } else if (nw){
      byUser[u] = { title: 'Yanlışların seni bekliyor', body: `${nw} soruyu 5 dakikada tekrar et; kalıcı olsun.`, url: './#/tekrar', tag: 'daily' };
    } else if (!active(t.today) && streak > 0){
      byUser[u] = { title: `${streak} günlük serin bozulmasın`, body: '10 dakikalık bir odak turu yeter.', url: './#/odak', tag: 'daily' };
    } else if (!active(t.today)){
      byUser[u] = { title: 'Bugün biraz çalışalım mı?', body: 'Bir odak turu başlat ya da Mürek\'e bugünün konularını sor.', url: './#/odak', tag: 'daily' };
    } else byUser[u] = null;
  }
  let sent = 0;
  for (const s of due){
    await db.from('push_subs').update({ last_daily: t.today }).eq('endpoint', s.endpoint);
    const m = byUser[s.user_id]; if (m && await send(s, m)) sent++;
  }
  return sent;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let body: { mode?: string } = {};
  try { body = await req.json(); } catch(_){}
  try {
    const c = await config();
    if (body.mode === 'cron'){
      if (req.headers.get('x-cron') !== c.push_cron) return json({ error: 'forbidden' }, 403);
      const p = await programs(), d = await daily();
      return json({ ok: true, programs: p, daily: d });
    }
    if (body.mode === 'test'){
      const tok = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
      const { data: u } = await db.auth.getUser(tok);
      if (!u || !u.user) return json({ error: 'not_signed_in' }, 401);
      const { data: subs } = await db.from('push_subs').select('*').eq('user_id', u.user.id);
      let sent = 0;
      for (const s of (subs || []) as Sub[]) if (await send(s, { title: 'Bildirimler çalışıyor', body: 'Mürek buradan haber verecek: görevlerin, yanlışların ve hocanın programları.', url: './#/bugun', tag: 'test' })) sent++;
      return json({ ok: true, sent });
    }
    return json({ error: 'mode' }, 400);
  } catch(e){
    return json({ error: 'server', detail: String((e as Error).message || e).slice(0, 200) }, 500);
  }
});
