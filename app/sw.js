/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
 * Çevrimdışı çalışma: uygulama dosyaları önbelleğe alınır. Yeni sürüm yayımlarken VERSION'ı artır. */
const VERSION = 'dersozetim-3.0.1';
const CORE = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/config.js', 'js/core.js', 'js/motivation.js', 'js/ai.js', 'js/pdf.js', 'js/cloud.js', 'js/app.js', 'js/mascot.js', 'js/school.js', 'js/rooms.js', 'js/main.js', 'data/library.json',
  'vendor/supabase.min.js', 'vendor/fflate.min.js', 'vendor/html2canvas.min.js', 'vendor/jspdf.umd.min.js',
  'fonts/fonts.css', 'fonts/nunito-latin-wght-normal.woff2', 'fonts/nunito-latin-ext-wght-normal.woff2', 'fonts/bricolage-grotesque-latin-wght-normal.woff2', 'fonts/bricolage-grotesque-latin-ext-wght-normal.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/favicon.png', 'icons/apple-touch-icon.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k.startsWith('dersozetim-')).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== self.location.origin && !fonts) return; // sunucu, hava durumu, yapay zekâ ve Ollama istekleri doğrudan ağa gider
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: url.origin === self.location.origin });
    const net = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; }).catch(() => null);
    if (hit){ e.waitUntil(net); return hit; }
    const res = await net;
    if (res) return res;
    if (req.mode === 'navigate') return (await cache.match('index.html')) || Response.error();
    return Response.error();
  }));
});
