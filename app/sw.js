/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
 * Çevrimdışı çalışma ve hızlı açılış. Uygulama dosyaları kurulumda bir kez indirilir ve sonra
 * doğrudan telefondan açılır; ağ beklenmez. Yeni sürüm yayımlarken VERSION'ı artır: yeni çalışan
 * dosyaları arka planda indirir, hazır olunca sayfa bir kez yenilenir. */
const VERSION = 'dersozetim-3.12.1';
const CORE = [
  './', 'manifest.webmanifest', 'css/app.css',
  'js/config.js', 'js/core.js', 'js/motivation.js', 'js/ai.js', 'js/pdf.js', 'js/cloud.js', 'js/app.js', 'js/mascot.js', 'js/school.js', 'js/rooms.js', 'js/spotify.js', 'js/media.js', 'js/admin.js', 'js/notes.js', 'js/install.js', 'js/chat.js', 'js/youtube.js', 'js/plan.js', 'js/lab.js', 'js/sims-fizik.js', 'js/sims-kimya.js', 'js/sims-mat.js', 'js/main.js', 'data/library.json',
  'vendor/supabase.min.js', 'vendor/fflate.min.js',
  'fonts/fonts.css', 'fonts/nunito-latin-wght-normal.woff2', 'fonts/nunito-latin-ext-wght-normal.woff2', 'fonts/bricolage-grotesque-latin-wght-normal.woff2', 'fonts/bricolage-grotesque-latin-ext-wght-normal.woff2',
  'icons/icon-192.png', 'icons/favicon.png'
];
// PDF kütüphaneleri (600 KB) ilk açılışı yavaşlatmasın: ilk PDF'te indirilir, sonra önbellekten gelir.
const base = self.location.href.replace(/sw\.js.*$/, '');
const CORE_URLS = new Set(CORE.map(p => new URL(p, base).href));

self.addEventListener('install', e => {
  // cache: 'no-cache' sunucuya sorar: dosya değişmediyse yeniden indirmez (304), değiştiyse yenisini alır
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(CORE.map(p => fetch(new Request(p, { cache: 'no-cache' })).then(r => {
    if (!r.ok) throw new Error(p + ' ' + r.status);
    return c.put(new URL(p, base).href, r);
  })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k.startsWith('dersozetim-')).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const timeout = (p, ms) => Promise.race([p, new Promise(r => setTimeout(() => r(null), ms))]);
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;            // Supabase, YouTube, hava durumu vb. doğrudan ağa
  if (!url.pathname.startsWith(new URL(base).pathname)) return; // /api/ ve tanıtım sayfası çalışanın dışında
  const key = req.mode === 'navigate' ? base : url.origin + url.pathname;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(key);
    // Uygulama dosyası: telefondan hemen aç
    if (hit && CORE_URLS.has(key)) return hit;
    const net = fetch(req).then(res => { if (res && res.ok && res.type === 'basic') cache.put(key, res.clone()); return res; }).catch(() => null);
    if (hit){ const res = await timeout(net, 3000); return res && res.ok ? res : hit; }
    const res = await net; if (res) return res;
    if (req.mode === 'navigate'){ const shell = await cache.match(base); if (shell) return shell; }
    return Response.error();
  }));
});
