/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
 * Çevrimdışı çalışma: uygulama dosyaları önbelleğe alınır. Yeni sürüm yayımlarken VERSION'ı artır. */
const VERSION = 'dersozetim-3.7.0';
const CORE = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/config.js', 'js/core.js', 'js/motivation.js', 'js/ai.js', 'js/pdf.js', 'js/cloud.js', 'js/app.js', 'js/mascot.js', 'js/school.js', 'js/rooms.js', 'js/spotify.js', 'js/media.js', 'js/admin.js', 'js/notes.js', 'js/install.js', 'js/lab.js', 'js/sims-fizik.js', 'js/sims-kimya.js', 'js/sims-mat.js', 'js/main.js', 'data/library.json',
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
// Uygulama dosyaları (sayfa, betikler, stiller, kitaplık) önce ağdan alınır ki güncellemeler hemen gelsin;
// ağ yoksa ya da 4 saniyede cevap gelmezse önbellekteki sürüm açılır. Yazı tipleri ve simgeler önbellekten gelir.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== self.location.origin && !fonts) return; // sunucu, hava durumu, yapay zekâ ve Ollama istekleri doğrudan ağa gider
  const fresh = url.origin === self.location.origin && (req.mode === 'navigate' || /\.(html|js|css|json|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/'));
  e.respondWith(caches.open(VERSION).then(async cache => {
    const key = url.origin === self.location.origin ? new Request(url.origin + url.pathname) : req;
    const hit = await cache.match(key);
    const net = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) cache.put(key, res.clone()); return res; }).catch(() => null);
    if (fresh){
      const res = await Promise.race([net, new Promise(r => setTimeout(() => r(null), hit ? 4000 : 15000))]);
      if (res && res.ok) return res;
      if (hit) return hit;
      const late = await net; if (late) return late;
    } else {
      if (hit){ e.waitUntil(net); return hit; }
      const res = await net; if (res) return res;
    }
    if (req.mode === 'navigate') return (await cache.match(new Request(self.location.origin + self.location.pathname.replace(/sw\.js$/, 'index.html')))) || Response.error();
    return Response.error();
  }));
});
