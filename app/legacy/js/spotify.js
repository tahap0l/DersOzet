/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0. Eski tarayıcılar için çevrilmiş kopya; kaynak app/js, üreten tools/build-legacy.sh */
"use strict";
const SP = {
  scopes: "user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private playlist-read-collaborative streaming user-read-email user-read-private",
  tok: null,
  me: null,
  now: null,
  devices: [],
  lists: null,
  results: null,
  err: "",
  busy: false,
  deviceId: null,
  player: null,
  sdkErr: "",
  pollT: null,
  q: "",
  KEY: "dersozetim.spotify",
  get cid() {
    return (window.DO_CONFIG || {}).spotifyClientId || "";
  },
  get on() {
    return !!(this.tok && this.tok.refresh);
  },
  redirect() {
    return location.origin + location.pathname.replace(/index\.html$/, "");
  },
  load() {
    try {
      this.tok = JSON.parse(localStorage.getItem(this.KEY) || "null");
    } catch (e) {
      this.tok = null;
    }
  },
  save() {
    try {
      if (this.tok) localStorage.setItem(this.KEY, JSON.stringify(this.tok));
      else localStorage.removeItem(this.KEY);
    } catch (e) {
    }
  },
  async connect() {
    const rnd = (n) => {
      const a = new Uint8Array(n);
      crypto.getRandomValues(a);
      return Array.from(a, (b) => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"[b % 66]).join("");
    };
    const verifier = rnd(64), state = rnd(16);
    const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
    const challenge = btoa(String.fromCharCode.apply(null, hash)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    try {
      localStorage.setItem(this.KEY + ".pkce", JSON.stringify({ verifier, state, back: location.hash || "#/medya" }));
    } catch (e) {
    }
    const u = new URL("https://accounts.spotify.com/authorize");
    Object.entries({ client_id: this.cid, response_type: "code", redirect_uri: this.redirect(), code_challenge_method: "S256", code_challenge: challenge, state, scope: this.scopes }).forEach(([k, v]) => u.searchParams.set(k, v));
    location.href = u.toString();
  },
  async handleRedirect() {
    const p = new URLSearchParams(location.search);
    if (!p.has("state") || !(p.has("code") || p.has("error"))) return false;
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(this.KEY + ".pkce") || "null");
    } catch (e) {
    }
    if (!saved || saved.state !== p.get("state")) return false;
    localStorage.removeItem(this.KEY + ".pkce");
    history.replaceState(null, "", location.pathname + (saved.back || "#/medya"));
    if (p.has("error")) {
      this.err = p.get("error") === "access_denied" ? "Spotify bağlantısını onaylamadın." : "Spotify bağlanamadı.";
      return true;
    }
    try {
      const r = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "authorization_code", code: p.get("code"), redirect_uri: this.redirect(), client_id: this.cid, code_verifier: saved.verifier })
      });
      const j = await r.json();
      if (!r.ok || !j.access_token) throw new Error(j.error_description || "token");
      this.tok = { access: j.access_token, refresh: j.refresh_token, exp: Date.now() + j.expires_in * 1e3 };
      this.save();
      setTimeout(() => toast("Spotify bağlandı"), 400);
    } catch (e) {
      this.err = "Spotify bağlanamadı. Tekrar dene.";
    }
    return true;
  },
  async token() {
    if (!this.tok) throw { status: 401 };
    if (this.tok.exp - 6e4 > Date.now()) return this.tok.access;
    const r = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: this.tok.refresh, client_id: this.cid })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.access_token) {
      if (r.status === 400) {
        this.tok = null;
        this.save();
      }
      throw { status: 401 };
    }
    this.tok = { access: j.access_token, refresh: j.refresh_token || this.tok.refresh, exp: Date.now() + j.expires_in * 1e3 };
    this.save();
    return this.tok.access;
  },
  async api(method, path, body, retry) {
    const t = await this.token();
    const r = await fetch("https://api.spotify.com/v1" + path, { method, headers: Object.assign({ Authorization: "Bearer " + t }, body ? { "Content-Type": "application/json" } : {}), body: body ? JSON.stringify(body) : void 0 });
    if (r.status === 401 && !retry) {
      this.tok.exp = 0;
      return this.api(method, path, body, true);
    }
    if (r.status === 204 || r.status === 202) return null;
    const txt = await r.text();
    let j = null;
    try {
      j = txt ? JSON.parse(txt) : null;
    } catch (e) {
    }
    if (!r.ok) throw { status: r.status, reason: j && j.error && (j.error.reason || j.error.message) || txt || "" };
    return j;
  },
  msg(e) {
    const s = e && e.status, why = String(e && e.reason || "");
    if (s === 401) return "Spotify oturumu kapanmış. Yeniden bağlan.";
    if (/PREMIUM/i.test(why) || s === 403 && /premium/i.test(why)) return "Çalmayı buradan yönetmek için Spotify Premium gerekiyor.";
    if (s === 403 && /regist|developer dashboard/i.test(why)) return "Bu Spotify hesabı Ders Özetim'e eklenmemiş. Spotify kuralı gereği en fazla 5 kişi bağlanabiliyor; Esat'tan seni eklemesini iste.";
    if (s === 404 || /NO_ACTIVE_DEVICE/i.test(why)) return "Açık bir Spotify cihazı yok. Telefonunda ya da bilgisayarında Spotify'ı aç, sonra buradan cihazı seç.";
    if (s === 429) return "Spotify çok sık istek aldı; biraz bekle.";
    return "Spotify şu an cevap vermedi.";
  },
  async refresh() {
    if (!this.on) return;
    try {
      const [now, dev] = await Promise.all([this.api("GET", "/me/player?additional_types=episode"), this.api("GET", "/me/player/devices")]);
      this.now = now;
      this.devices = dev && dev.devices || [];
      this.err = "";
      if (!this.me) this.me = await this.api("GET", "/me");
    } catch (e) {
      this.err = this.msg(e);
      if (e && e.status === 401) {
        this.tok = null;
        this.save();
      }
    }
    spPaint();
  },
  async lists_() {
    try {
      const j = await this.api("GET", "/me/playlists?limit=50");
      this.lists = (j && j.items || []).filter(Boolean);
    } catch (e) {
      this.lists = [];
      this.err = this.msg(e);
    }
    if (route.page === "medya") render();
  },
  async search(q) {
    this.q = q;
    try {
      const j = await this.api("GET", "/search?type=track,playlist&limit=10&market=from_token&q=" + encodeURIComponent(q));
      this.results = { tracks: (j.tracks && j.tracks.items || []).filter(Boolean), lists: (j.playlists && j.playlists.items || []).filter(Boolean) };
    } catch (e) {
      this.results = { tracks: [], lists: [] };
      this.err = this.msg(e);
    }
    if (route.page === "medya") render();
  },
  target() {
    const a = this.devices.find((d) => d.is_active);
    return a ? a.id : this.deviceId || this.devices[0] && this.devices[0].id || null;
  },
  async cmd(fn) {
    try {
      await fn();
      this.err = "";
    } catch (e) {
      this.err = this.msg(e);
      toast(this.err);
    }
    setTimeout(() => this.refresh(), 450);
  },
  play(body) {
    const d = this.target();
    return this.cmd(() => this.api("PUT", "/me/player/play" + (d ? "?device_id=" + encodeURIComponent(d) : ""), body || void 0));
  },
  pause() {
    return this.cmd(() => this.api("PUT", "/me/player/pause"));
  },
  next() {
    return this.cmd(() => this.api("POST", "/me/player/next"));
  },
  prev() {
    return this.cmd(() => this.api("POST", "/me/player/previous"));
  },
  volume(v) {
    return this.cmd(() => this.api("PUT", "/me/player/volume?volume_percent=" + Math.round(v)));
  },
  shuffle() {
    const s = !(this.now && this.now.shuffle_state);
    return this.cmd(() => this.api("PUT", "/me/player/shuffle?state=" + s));
  },
  transfer(id) {
    return this.cmd(() => this.api("PUT", "/me/player", { device_ids: [id], play: true }));
  },
  disconnect() {
    if (this.player) {
      try {
        this.player.disconnect();
      } catch (e) {
      }
      this.player = null;
    }
    this.tok = null;
    this.me = null;
    this.now = null;
    this.devices = [];
    this.lists = null;
    this.results = null;
    this.deviceId = null;
    this.save();
  },
  /* bilgisayarda uygulamanın içinde çalma */
  sdk() {
    if (this.player || this.sdkTried || !this.on) return;
    if (/Android|iPhone|iPad|iPod/.test(navigator.userAgent) || navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent)) return;
    this.sdkTried = true;
    window.onSpotifyWebPlaybackSDKReady = () => {
      const pl = new window.Spotify.Player({ name: "Ders Özetim", getOAuthToken: (cb) => this.token().then(cb).catch(() => {
      }), volume: 0.6 });
      pl.addListener("ready", ({ device_id }) => {
        this.deviceId = device_id;
        this.refresh();
      });
      pl.addListener("not_ready", () => {
        this.deviceId = null;
      });
      pl.addListener("player_state_changed", () => {
        clearTimeout(this.stT);
        this.stT = setTimeout(() => this.refresh(), 300);
      });
      pl.addListener("account_error", () => {
        this.sdkErr = "Uygulamanın içinde çalmak için Spotify Premium gerekiyor.";
        spPaint();
      });
      pl.addListener("initialization_error", () => {
        this.sdkErr = "Bu tarayıcı uygulamanın içinde çalmayı desteklemiyor; Spotify uygulamasını buradan yönetebilirsin.";
      });
      pl.connect();
      this.player = pl;
    };
    const s = document.createElement("script");
    s.src = "https://sdk.scdn.co/spotify-player.js";
    s.async = true;
    document.head.appendChild(s);
  },
  startPoll() {
    clearInterval(this.pollT);
    if (!this.on) return;
    this.pollT = setInterval(() => {
      if (!document.hidden && (route.page === "medya" || route.page === "odak" || this.now && this.now.is_playing)) this.refresh();
    }, 5e3);
  }
};
SP.load();
const spFmt = (ms) => {
  const s = Math.floor((ms || 0) / 1e3);
  return Math.floor(s / 60) + ":" + pad(s % 60);
};
const spImg = (imgs, size) => {
  const a = (imgs || []).slice().sort((x, y) => (x.width || 0) - (y.width || 0));
  const i = a.find((x) => (x.width || 0) >= size) || a[a.length - 1];
  return i ? i.url : "";
};
const SP_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" style="fill:#1DB954;stroke:none"><circle cx="12" cy="12" r="11"/><path d="M6.5 9.3c3.8-1.1 7.9-.8 11 1M7.2 12.4c3.1-.9 6.4-.6 9 .9M7.8 15.3c2.4-.6 4.9-.4 7 .7" style="fill:none;stroke:#fff;stroke-width:1.6;stroke-linecap:round"/></svg>';
const IC_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true" style="fill:currentColor;stroke:none"><path d="M8 5.5v13l11-6.5Z"/></svg>';
const IC_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true" style="fill:currentColor;stroke:none"><rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/></svg>';
const IC_NEXT = '<svg viewBox="0 0 24 24" aria-hidden="true" style="fill:currentColor;stroke:none"><path d="M6 6v12l9-6Z"/><rect x="16" y="6" width="2.5" height="12" rx="1"/></svg>';
const IC_PREV = '<svg viewBox="0 0 24 24" aria-hidden="true" style="fill:currentColor;stroke:none"><path d="M18 6v12l-9-6Z"/><rect x="5.5" y="6" width="2.5" height="12" rx="1"/></svg>';
const IC_SHUF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h3.5c2 0 3 1 4.2 2.8l2.6 4.4C14.5 16 15.5 17 17.5 17H21M18 14l3 3-3 3M3 17h3.5c1.4 0 2.3-.5 3.1-1.4M21 7h-3.5c-1.4 0-2.3.5-3.1 1.4M18 4l3 3-3 3"/></svg>';
function spNowHTML(compact) {
  const n = SP.now, it = n && n.item;
  if (!it) return '<div class="sp-now empty"><p class="hint">'.concat(SP.devices.length ? "Şu an bir şey çalmıyor. Aşağıdan bir liste seç." : "Spotify bir cihazda açık değil. Telefonunda ya da bilgisayarında Spotify'ı aç" + (SP.deviceId ? ' ya da "Ders Özetim" cihazını seç.' : "."), "</p></div>");
  const img = spImg(it.album ? it.album.images : it.images, 120), who = it.artists ? it.artists.map((a) => a.name).join(", ") : it.show ? it.show.name : "";
  const pct = it.duration_ms ? Math.min(100, (n.progress_ms || 0) / it.duration_ms * 100) : 0;
  return '<div class="sp-now'.concat(compact ? " compact" : "", '">\n    ').concat(img ? '<img class="sp-art" src="'.concat(esc(img), '" alt="" loading="lazy">') : '<span class="sp-art">'.concat(SP_ICON, "</span>"), '\n    <div class="sp-info"><p class="sp-t">').concat(esc(it.name || ""), '</p><p class="sp-a">').concat(esc(who), "</p>\n      ").concat(compact ? "" : '<div class="sp-bar"><span style="width:'.concat(pct, '%"></span></div><p class="sp-time"><span>').concat(spFmt(n.progress_ms), "</span><span>").concat(n.device ? esc(n.device.name) : "", "</span><span>").concat(spFmt(it.duration_ms), "</span></p>"), '</div>\n    <div class="sp-ctl">\n      ').concat(compact ? "" : '<button class="sp-b'.concat(n.shuffle_state ? " on" : "", '" data-act="sp-shuf" aria-label="Karıştır">').concat(IC_SHUF, "</button>"), '\n      <button class="sp-b" data-act="sp-prev" aria-label="Önceki">').concat(IC_PREV, '</button>\n      <button class="sp-b big" data-act="sp-toggle" aria-label="').concat(n.is_playing ? "Durdur" : "Çal", '">').concat(n.is_playing ? IC_PAUSE : IC_PLAY, '</button>\n      <button class="sp-b" data-act="sp-next" aria-label="Sonraki">').concat(IC_NEXT, "</button>\n    </div>\n    ").concat(compact ? "" : '<label class="sp-vol"><span class="hint">Ses</span><input type="range" min="0" max="100" value="'.concat(n.device && n.device.volume_percent != null ? n.device.volume_percent : 60, '" id="sp-vol" aria-label="Ses"></label>'), "\n  </div>");
}
function spDevsHTML() {
  const devs = SP.devices.slice();
  if (SP.deviceId && !devs.some((d) => d.id === SP.deviceId)) devs.push({ id: SP.deviceId, name: "Ders Özetim", type: "Computer", is_active: false });
  return devs.length ? '<p class="f-h">Nerede çalsın?</p><div class="chips">'.concat(devs.map((d) => '<button class="fchip'.concat(d.is_active ? " on" : "", '" data-act="sp-dev" data-id="').concat(esc(d.id), '">').concat(esc(d.id === SP.deviceId ? "Bu cihaz (Ders Özetim)" : d.name), "</button>")).join(""), "</div>") : "";
}
function spSection() {
  if (!SP.cid) return "";
  if (!SP.on) return '<section class="block sp-card"><div class="sp-head">'.concat(SP_ICON, '<div><h2>Spotify hesabın</h2><p class="hint">Bağlan; listelerini aç, şarkı ara, çalmayı buradan yönet. Spotify Premium gerekir.</p></div></div>\n      ').concat(SP.err ? '<p class="err">'.concat(esc(SP.err), "</p>") : "", '<div class="row"><button class="btn primary" data-act="sp-connect">Spotify\'a bağlan</button></div></section>');
  if (!SP.lists) SP.lists_();
  const res = SP.results;
  return '<section class="block sp-card">\n    <div class="sp-head">'.concat(SP_ICON, '<div><h2>Spotify</h2><p class="hint">').concat(SP.me ? esc(SP.me.display_name || SP.me.id) + (SP.me.product && SP.me.product !== "premium" ? " · Premium değil, yalnızca listeler görünür" : "") : "Bağlı", '</p></div><button class="link sm" data-act="sp-off">Bağlantıyı kes</button></div>\n    ').concat(SP.err ? '<p class="err" id="sp-err">'.concat(esc(SP.err), "</p>") : '<p class="err" id="sp-err" hidden></p>', '\n    <div id="sp-now">').concat(spNowHTML(false), '</div>\n    <div id="sp-devs">').concat(spDevsHTML(), "</div>\n    ").concat(SP.sdkErr ? '<p class="hint">'.concat(esc(SP.sdkErr), "</p>") : "", '\n    <form class="m-form" id="sp-s"><input id="sp-q" class="input" placeholder="Şarkı, sanatçı ya da liste ara" value="').concat(esc(SP.q), '" autocomplete="off"><button class="btn">Ara</button></form>\n    ').concat(res ? '<div class="sp-res">'.concat(res.tracks.length ? '<p class="f-h">Şarkılar</p><ul class="sp-list">'.concat(res.tracks.map((t) => '<li><button data-act="sp-play" data-uri="'.concat(esc(t.uri), '"><img src="').concat(esc(spImg(t.album && t.album.images, 64)), '" alt="" loading="lazy"><span><strong>').concat(esc(t.name), '</strong><span class="hint">').concat(esc(t.artists.map((a) => a.name).join(", ")), "</span></span></button></li>")).join(""), "</ul>") : "", "\n      ").concat(res.lists.length ? '<p class="f-h">Listeler</p><ul class="sp-grid">'.concat(res.lists.map((l) => '<li><button data-act="sp-play" data-ctx="'.concat(esc(l.uri), '"><img src="').concat(esc(spImg(l.images, 200)), '" alt="" loading="lazy"><span>').concat(esc(l.name), "</span></button></li>")).join(""), "</ul>") : "", "\n      ").concat(!res.tracks.length && !res.lists.length ? '<p class="hint">Sonuç yok.</p>' : "", '<button class="link sm" data-act="sp-clear">Aramayı kapat</button></div>') : "", '\n    <p class="f-h">Listelerin</p>\n    ').concat(!SP.lists ? '<p class="hint">Yükleniyor…</p>' : SP.lists.length ? '<ul class="sp-grid">'.concat(SP.lists.map((l) => '<li><button data-act="sp-play" data-ctx="'.concat(esc(l.uri), '"><img src="').concat(esc(spImg(l.images, 200)), '" alt="" loading="lazy"><span>').concat(esc(l.name), "</span></button></li>")).join(""), "</ul>") : '<p class="hint">Hiç çalma listen yok.</p>', "\n  </section>");
}
function spPaint() {
  const el = $("#sp-now");
  if (el) el.innerHTML = spNowHTML(false);
  const dv = $("#sp-devs");
  if (dv) dv.innerHTML = spDevsHTML();
  const hd = $(".sp-card .sp-head .hint");
  if (hd && SP.me) hd.textContent = (SP.me.display_name || SP.me.id) + (SP.me.product && SP.me.product !== "premium" ? " · Premium değil, yalnızca listeler görünür" : "");
  const e = $("#sp-err");
  if (e) {
    e.textContent = SP.err;
    e.hidden = !SP.err;
  }
  const m = $("#sp-mini");
  if (m) m.innerHTML = spNowHTML(true);
}
Object.assign(ACT, {
  "sp-connect": () => SP.connect(),
  "sp-off": () => {
    SP.disconnect();
    render();
    toast("Spotify bağlantısı kesildi");
  },
  "sp-toggle": () => SP.now && SP.now.is_playing ? SP.pause() : SP.play(),
  "sp-next": () => SP.next(),
  "sp-prev": () => SP.prev(),
  "sp-shuf": () => SP.shuffle(),
  "sp-dev": (el) => SP.transfer(el.dataset.id),
  "sp-play": (el) => SP.play(el.dataset.ctx ? { context_uri: el.dataset.ctx } : { uris: [el.dataset.uri] }),
  "sp-clear": () => {
    SP.results = null;
    SP.q = "";
    render();
  }
});
document.addEventListener("submit", (e) => {
  if (e.target.id === "sp-s") {
    e.preventDefault();
    const q = $("#sp-q").value.trim();
    if (q) SP.search(q);
  }
});
document.addEventListener("change", (e) => {
  if (e.target.id === "sp-vol") SP.volume(e.target.value);
});
