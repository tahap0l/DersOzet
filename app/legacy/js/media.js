/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0. Eski tarayıcılar için çevrilmiş kopya; kaynak app/js, üreten tools/build-legacy.sh */
"use strict";
const MEDIA_SUGGEST = [
  { url: "https://www.youtube.com/watch?v=jfKfPfyJRdk", title: "Lofi Girl: ders çalışırken lofi (canlı yayın)", kind: "yt" },
  { url: "https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ", title: "Deep Focus (Spotify)", kind: "sp" },
  { url: "https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn", title: "Lofi Beats (Spotify)", kind: "sp" },
  { url: "https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO", title: "Peaceful Piano (Spotify)", kind: "sp" }
];
const MD = () => {
  if (!DB.d.media || !Array.isArray(DB.d.media.list)) DB.d.media = { list: [] };
  return DB.d.media;
};
function parseMedia(raw) {
  const u = String(raw || "").trim();
  let m;
  if (m = u.match(/(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|live\/|embed\/)|youtu\.be\/|m\.youtube\.com\/watch\?(?:[^#]*&)?v=)([\w-]{11})/)) {
    const t = (u.match(/[?&](?:t|start)=(\d+)/) || [])[1];
    return { kind: "yt", key: "yt:" + m[1], embed: "https://www.youtube-nocookie.com/embed/".concat(m[1], "?playsinline=1&rel=0&modestbranding=1").concat(t ? "&start=" + t : ""), url: "https://www.youtube.com/watch?v=" + m[1] };
  }
  if (m = u.match(/youtube\.com\/(?:playlist|watch)\?(?:[^#]*&)?list=([\w-]+)/))
    return { kind: "yt", key: "ytl:" + m[1], embed: "https://www.youtube-nocookie.com/embed/videoseries?list=".concat(m[1], "&playsinline=1&rel=0"), url: "https://www.youtube.com/playlist?list=" + m[1] };
  if ((m = u.match(/open\.spotify\.com\/(?:intl-[\w-]+\/)?(?:embed\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/)) || (m = u.match(/^spotify:(track|album|playlist|episode|show|artist):([A-Za-z0-9]+)/)))
    return { kind: "sp", key: "sp:" + m[1] + ":" + m[2], type: m[1], embed: "https://open.spotify.com/embed/".concat(m[1], "/").concat(m[2], "?utm_source=generator"), url: "https://open.spotify.com/".concat(m[1], "/").concat(m[2]) };
  return null;
}
async function mediaTitle(p) {
  try {
    const api = p.kind === "sp" ? "https://open.spotify.com/oembed?url=" : "https://www.youtube.com/oembed?format=json&url=";
    const r = await fetch(api + encodeURIComponent(p.url));
    if (r.ok) {
      const j = await r.json();
      if (j && j.title) return String(j.title).slice(0, 120);
    }
  } catch (e) {
  }
  return p.kind === "sp" ? "Spotify" : "YouTube videosu";
}
const Player = {
  cur: null,
  size: "mini",
  el() {
    return document.getElementById("mplayer");
  },
  play(item) {
    const p = parseMedia(item.url);
    if (!p) return false;
    const el = this.el();
    if (!el) return false;
    this.cur = Object.assign({}, item, p);
    const frame = '<iframe src="'.concat(esc(p.embed), '" title="').concat(esc(item.title || "Oynatıcı"), '" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowfullscreen loading="eager" referrerpolicy="strict-origin-when-cross-origin"></iframe>');
    el.innerHTML = '<div class="mp-bar"><span class="mp-k '.concat(p.kind, '">').concat(p.kind === "sp" ? "Spotify" : "YouTube", '</span><p class="mp-t">').concat(esc(item.title || ""), '</p>\n      <button class="icon-btn ghost sm" data-act="mp-size" aria-label="Büyüt ya da küçült">').concat(I.expand, '</button><button class="icon-btn ghost sm" data-act="mp-close" aria-label="Oynatıcıyı kapat">').concat(I.close, '</button></div>\n      <div class="mp-frame ').concat(p.kind).concat(p.kind === "sp" && /track|episode/.test(p.type || "") ? " short" : "", '">').concat(frame, "</div>");
    el.hidden = false;
    el.dataset.size = this.size;
    document.body.classList.add("has-player");
    const m = MD();
    m.last = { url: p.url, title: item.title || "" };
    DB.save();
    if (typeof Room !== "undefined" && Room.id) Room.retrack();
    return true;
  },
  close() {
    const el = this.el();
    if (el) {
      el.innerHTML = "";
      el.hidden = true;
    }
    this.cur = null;
    document.body.classList.remove("has-player");
    if (typeof Room !== "undefined" && Room.id) Room.retrack();
  },
  toggle() {
    this.size = this.size === "mini" ? "big" : this.size === "big" ? "hide" : "mini";
    const el = this.el();
    if (el) el.dataset.size = this.size;
  }
};
function mediaView() {
  const m = MD(), now = Player.cur;
  const vt = (() => {
    const w = DB.week(thisWeek());
    const t = w && w.tasks.find((x) => x.day === todayIdx() && !x.done && x.type === "video");
    return t ? t.topic || t.label || t.text : "";
  })();
  const item = (x, i, saved) => {
    const p = parseMedia(x.url);
    const on = now && p && now.key === p.key;
    return '<li class="media-row'.concat(on ? " on" : "", '"><button class="mr-play" data-act="mp-play" data-u="').concat(esc(x.url), '" data-t="').concat(esc(x.title || ""), '"><span class="mp-k ').concat(p ? p.kind : "", '">').concat(p && p.kind === "sp" ? "Spotify" : "YouTube", '</span><span class="mr-t">').concat(esc(x.title || x.url), "</span>").concat(on ? '<span class="mr-now">çalıyor</span>' : "", "</button>\n      ").concat(saved ? '<button class="icon-btn ghost sm" data-act="mp-del" data-i="'.concat(i, '" aria-label="Listeden çıkar">').concat(I.close, "</button>") : '<button class="link sm" data-act="mp-save" data-u="'.concat(esc(x.url), '" data-t="').concat(esc(x.title || ""), '">Kaydet</button>'), "</li>");
  };
  return '<header class="page-head"><h1>Müzik ve video</h1></header>\n    <p class="sub">YouTube\'daki ders videosunu ya da Spotify listeni burada aç. Sayfa değiştirsen de, odaya girsen de altta çalmaya devam eder.</p>\n    '.concat(typeof spSection === "function" ? spSection() : "", '\n    <form class="m-form" id="mp-f"><input id="mp-u" class="input" inputmode="url" placeholder="YouTube ya da Spotify bağlantısını yapıştır" autocomplete="off"><button class="btn primary">Aç</button></form>\n    <p class="err" id="mp-e" role="alert"></p>\n    <section class="block"><h2 class="f-h">Ders videosu bul</h2>\n      <form class="m-form" id="mp-s"><input id="mp-q" class="input" placeholder="Örn. kaldırma kuvveti konu anlatımı" value="').concat(esc(vt), '" autocomplete="off"><button class="btn">YouTube\'da ara</button></form>\n      <p class="hint">Arama YouTube\'da açılır. Beğendiğin videonun bağlantısını kopyala (Paylaş > Bağlantıyı kopyala), buraya yapıştır.</p></section>\n    ').concat(m.list.length ? '<section class="block"><h2 class="f-h">Kaydettiklerin</h2><ul class="media-list">'.concat(m.list.map((x, i) => item(x, i, true)).join(""), "</ul></section>") : "", '\n    <section class="block"><h2 class="f-h">Çalışırken dinlemek için</h2><ul class="media-list">').concat(MEDIA_SUGGEST.filter((s) => !m.list.some((x) => x.url === s.url)).map((x) => item(x, 0, false)).join(""), '</ul>\n      <p class="hint">Spotify\'da şarkıların tamamı için tarayıcıda Spotify hesabına giriş yapmış olman gerekir; yoksa 30 saniyelik önizleme çalar.</p></section>');
}
async function mediaOpen(url, title, save) {
  const p = parseMedia(url);
  if (!p) {
    const e = $("#mp-e");
    if (e) e.textContent = "Bu bir YouTube ya da Spotify bağlantısı değil.";
    return;
  }
  const t = title || await mediaTitle(p);
  const keep = /youtu/.test(url) && /[?&](?:t|start)=\d+/.test(url) ? url.trim() : p.url;
  Player.play({ url: keep, title: t });
  if (save) {
    const m = MD();
    if (!m.list.some((x) => parseMedia(x.url) && parseMedia(x.url).key === p.key)) {
      m.list.unshift({ url: keep, title: t });
      m.list = m.list.slice(0, 40);
      DB.save();
    }
  }
  if (route.page === "medya") render();
}
Object.assign(ACT, {
  "mp-play": (el) => mediaOpen(el.dataset.u, el.dataset.t, false),
  "mp-save": (el) => {
    const m = MD();
    m.list.unshift({ url: el.dataset.u, title: el.dataset.t });
    DB.save();
    render();
    toast("Kaydedildi");
  },
  "mp-del": (el) => {
    const m = MD();
    m.list.splice(Number(el.dataset.i), 1);
    DB.save();
    render();
  },
  "mp-close": () => Player.close(),
  "mp-size": () => Player.toggle()
});
document.addEventListener("submit", (e) => {
  if (e.target.id === "mp-f") {
    e.preventDefault();
    const v = $("#mp-u").value;
    if (v.trim()) mediaOpen(v, "", true);
  }
  if (e.target.id === "mp-s") {
    e.preventDefault();
    const q = $("#mp-q").value.trim();
    if (q) window.open("https://www.youtube.com/results?search_query=" + encodeURIComponent(q + " YKS"), "_blank", "noopener");
  }
});
document.addEventListener("paste", (e) => {
  if (route.page !== "medya" || e.target && e.target.id !== "mp-u") return;
  setTimeout(() => {
    const v = $("#mp-u") && $("#mp-u").value;
    if (v && parseMedia(v)) mediaOpen(v, "", true);
  }, 0);
});
mediaView.after = () => {
  if (typeof SP !== "undefined" && SP.on) {
    SP.refresh();
    SP.sdk();
  }
};
VIEWS.medya = mediaView;
