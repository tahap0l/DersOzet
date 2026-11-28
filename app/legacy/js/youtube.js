/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0. Eski tarayıcılar için çevrilmiş kopya; kaynak app/js, üreten tools/build-legacy.sh */
"use strict";
const YT_SEED = {
  Matematik: ["Rehber Matematik", "Bıyıklı Matematik", "Mert Hoca"],
  Fizik: ["Altuğ Güneş FİZİK", "Fizikle Barış", "VIP FİZİK"]
};
const ytNorm = (s) => String(s || "").toLocaleLowerCase("tr").replace(/[çğıöşüâîû]/g, (c) => ASCII_TR[c] || c).replace(/[^a-z0-9]+/g, "");
const YT = {
  busy: {},
  store() {
    if (!DB.d.vids || typeof DB.d.vids !== "object") DB.d.vids = {};
    return DB.d.vids;
  },
  chans() {
    if (!DB.d.ytCh || typeof DB.d.ytCh !== "object") DB.d.ytCh = {};
    return DB.d.ytCh;
  },
  teachers(subject) {
    const t = DB.d.profile.teachers || {};
    return Array.isArray(t[subject]) ? t[subject] : [];
  },
  setTeachers(subject, list) {
    DB.d.profile.teachers = Object.assign({}, DB.d.profile.teachers || {}, { [subject]: list.slice(0, 3) });
    DB.save();
  },
  key(t) {
    const base = t.topic || String(t.label || t.text || "").replace(/\b(izle|dinle|konu (çalış|anlatımı)|video)\b/gi, "");
    return ytNorm(t.subject) + "|" + ytNorm(base).slice(0, 60);
  },
  query(t) {
    return (t.topic || String(t.label || t.text || "").replace(/^[^:]{2,20}:\s*/, "").replace(/\b(izle|dinle|konu çalış|video(su)?|tekrar et)\b/gi, "")).replace(/\s+/g, " ").trim().slice(0, 100);
  },
  /* bu göreve video uyar mı: konu çalışması ya da izleme görevi; soru, deneme, tekrar değil */
  wants(t) {
    if (!t || t.src === "focus") return false;
    const ty = t.type || guessTask(t.text || "").type;
    if (ty === "video") return true;
    if (ty === "soru" || /deneme|yanlış defter/i.test(t.text || "")) return false;
    if (t.topic) return true;
    return !!t.subject && /konu|anlat/i.test((t.text || "") + " " + (t.label || ""));
  },
  of(t) {
    if (t.vid) return { id: t.vid, title: t.vt || "", ch: t.vc || "" };
    const e = this.store()[this.key(t)];
    return e && e.v ? e.v : null;
  },
  async find(t, force) {
    const k = this.key(t), st = this.store(), e = st[k];
    if (!force && e && e.v && Date.now() - e.at < 30 * 864e5) return e.v;
    if (this.busy[k]) return this.busy[k];
    const q = this.query(t);
    if (q.length < 2) return null;
    const tea = this.teachers(t.subject);
    const url = "/api/yt?q=" + encodeURIComponent(q) + (t.subject ? "&s=" + encodeURIComponent(t.subject) : "") + (tea.length ? "&t=" + encodeURIComponent(tea.join("|")) : "");
    this.busy[k] = (async () => {
      try {
        const r = await fetch(new URL(url, location.origin));
        if (!r.ok) return null;
        const j = await r.json();
        const list = j.videos || [];
        this.learn(t.subject, list);
        const v = list[0];
        if (!v) return null;
        st[k] = {
          at: Date.now(),
          v: { id: v.id, title: v.title, ch: v.ch, len: v.len, age: v.age },
          l: list.slice(0, 8).map((x) => ({ id: x.id, title: x.title, ch: x.ch, len: x.len, age: x.age, views: x.views, mine: !!x.mine }))
        };
        const ks = Object.keys(st);
        if (ks.length > 300) ks.sort((a, b) => st[a].at - st[b].at).slice(0, ks.length - 300).forEach((x) => delete st[x]);
        DB.save();
        return st[k].v;
      } catch (e2) {
        return null;
      } finally {
        delete this.busy[k];
      }
    })();
    return this.busy[k];
  },
  /* ders ve konuya göre video listesi (en fazla 8) */
  async list(t, force) {
    const k = this.key(t), e = this.store()[k];
    if (!force && e && e.l && Date.now() - e.at < 30 * 864e5) return e.l;
    await this.find(t, true);
    const e2 = this.store()[k];
    return e2 && e2.l ? e2.l : [];
  },
  searchUrl(t) {
    return "https://www.youtube.com/results?search_query=" + encodeURIComponent([this.query(t), t.subject || "", "konu anlatımı"].join(" ").replace(/\s+/g, " ").trim());
  },
  /* aramalarda görülen kanallar hoca önerisi olur */
  learn(subject, list) {
    if (!subject || !list.length) return;
    const c = this.chans(), m = c[subject] = c[subject] || {};
    list.forEach((v) => {
      if (v.ch) m[v.ch.trim()] = (m[v.ch.trim()] || 0) + 1;
    });
    const top = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 12);
    c[subject] = Object.fromEntries(top);
  },
  suggestions(subject) {
    const mine = this.teachers(subject).map(ytNorm);
    const seen = Object.entries(this.chans()[subject] || {}).sort((a, b) => b[1] - a[1]).map((x) => x[0]);
    const all = Array.from(new Set(seen.concat(YT_SEED[subject] || [])));
    return all.filter((n) => !mine.includes(ytNorm(n))).slice(0, 6);
  },
  /* taslaktaki konulara video bul: aynı anda 3 istek */
  async fill(list, onEach) {
    const todo = [];
    const seen = /* @__PURE__ */ new Set();
    list.forEach((t) => {
      if (this.wants(t)) {
        const k = this.key(t);
        if (!seen.has(k)) {
          seen.add(k);
          todo.push(t);
        }
      }
    });
    let i = 0;
    const worker = async () => {
      while (i < todo.length) {
        const t = todo[i++];
        await this.find(t);
        if (onEach) onEach();
      }
    };
    await Promise.all([worker(), worker(), worker()]);
  }
};
const ytUrl = (id) => "https://www.youtube.com/watch?v=" + encodeURIComponent(id);
function taskVideoHTML(wk, t) {
  if (ENV === "artifact" || !YT.wants(t)) return "";
  const v = YT.of(t);
  const more = '<button class="tlink soft" data-act="yt-list" data-k="'.concat(wk, "|").concat(esc(t.id), '">Diğer videolar</button>');
  if (v) return '<a class="tlink yt" href="'.concat(ytUrl(v.id), '" target="_blank" rel="noopener" title="').concat(esc(v.title + (v.ch ? " · " + v.ch : "")), '">').concat(YT_IC, "YouTube'da izle</a>").concat(more);
  return '<button class="tlink yt soft" data-act="yt-open" data-k="'.concat(wk, "|").concat(esc(t.id), '">').concat(YT_IC, "YouTube'da aç</button>").concat(more);
}
const YT_IC = '<svg viewBox="0 0 24 24" aria-hidden="true" class="yt-ic"><path d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8Z" fill="currentColor" stroke="none"/><path d="m10 15 5.2-3L10 9Z" fill="#fff" stroke="none"/></svg>';
const ytViews = (n) => !n ? "" : n >= 1e6 ? (n / 1e6).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) + " Mn izlenme" : n >= 1e3 ? Math.round(n / 1e3) + " B izlenme" : n + " izlenme";
function ytListSheet(wk, t) {
  const title = (t.topic || YT.query(t) || "Konu videoları") + (t.subject ? " · " + t.subject : "");
  const box = openSheet(title, '<div id="ytl"><div class="progress"><span class="spinner" aria-hidden="true"></span><span>Videolar aranıyor…</span></div></div>');
  const paint = (list) => {
    const el = $("#ytl", box);
    if (!el) return;
    const cur = YT.of(t), tea = YT.teachers(t.subject);
    el.innerHTML = (list.length ? '<p class="hint">Yeni ve çok izlenen konu anlatımları'.concat(tea.length ? "; seçtiğin hocaların videoları önce" : "", '. Dokununca YouTube\'da açılır ve bu göreve kaydedilir.</p>\n      <ul class="yt-list">').concat(list.map((v) => '<li><a class="ytl'.concat(cur && cur.id === v.id ? " on" : "", '" href="').concat(ytUrl(v.id), '" target="_blank" rel="noopener" data-id="').concat(esc(v.id), '">\n        <img src="https://i.ytimg.com/vi/').concat(encodeURIComponent(v.id), '/mqdefault.jpg" alt="" loading="lazy" width="120" height="68">\n        <span class="ytl-b"><strong>').concat(esc(v.title), "</strong><span>").concat(esc([v.ch, v.len, v.age, ytViews(v.views)].filter(Boolean).join(" · ")), "</span>\n        ").concat(v.mine || cur && cur.id === v.id ? '<span class="ytl-tags">'.concat(v.mine ? '<span class="tag">Senin hocan</span>' : "").concat(cur && cur.id === v.id ? '<span class="tag t">Görevdeki video</span>' : "", "</span>") : "", "</span></a></li>")).join(""), "</ul>") : '<p class="hint">Bu konu için video bulunamadı. Aşağıdan YouTube\'da arayabilirsin.</p>') + '<div class="row"><a class="btn" href="'.concat(YT.searchUrl(t), '" target="_blank" rel="noopener">').concat(YT_IC, 'YouTube\'da ara</a><button class="btn" data-act="yt-teach">Hocalarını seç</button></div>');
    el.querySelectorAll("a.ytl").forEach((a) => a.addEventListener("click", () => {
      const v = list.find((x) => x.id === a.dataset.id);
      if (!v) return;
      t.vid = v.id;
      t.vt = v.title;
      t.vc = v.ch;
      DB.save();
      setTimeout(() => {
        closeSheet();
        render();
      }, 300);
    }));
  };
  YT.list(t).then(paint, () => paint([]));
}
function teachersHTML(subjects) {
  return '<div class="yt-teach">'.concat(subjects.map((s) => {
    const mine = YT.teachers(s), sug = YT.suggestions(s);
    return '<div class="yt-row" style="--c:'.concat(subjColor(s), '"><p class="yt-s">').concat(esc(s), '</p>\n      <div class="chips-row wrap">').concat(mine.map((n) => '<span class="fchip on">'.concat(esc(n), '<button class="x" data-act="yt-t-rm" data-s="').concat(esc(s), '" data-n="').concat(esc(n), '" aria-label="').concat(esc(n), ' hocasını çıkar">×</button></span>')).join(""), "\n      ").concat(mine.length < 3 ? sug.map((n) => '<button class="fchip" data-act="yt-t-add" data-s="'.concat(esc(s), '" data-n="').concat(esc(n), '">+ ').concat(esc(n), "</button>")).join("") + '<button class="fchip ghost" data-act="yt-t-new" data-s="'.concat(esc(s), '">+ Başka kanal</button>') : "", "</div></div>");
  }).join(""), "</div>");
}
async function ytDiscover(subjects) {
  const need = subjects.filter((s) => !Object.keys(YT.chans()[s] || {}).length && !(YT_SEED[s] || []).length);
  for (const s of need.slice(0, 4)) {
    try {
      const r = await fetch(new URL("/api/yt?q=" + encodeURIComponent("TYT AYT " + s) + "&s=" + encodeURIComponent(s), location.origin));
      if (r.ok) {
        const j = await r.json();
        YT.learn(s, j.videos || []);
      }
    } catch (e) {
    }
  }
  if (need.length) DB.save();
  return need.length > 0;
}
function teachersSheet() {
  const subs = ui.plan && ui.plan.subjects && ui.plan.subjects.length ? ui.plan.subjects : TRACKS[DB.d.profile.track].subjects;
  const box = openSheet("YouTube hocaların", '<p class="hint">Programına konu videosu eklenirken bu kanalların videoları önce gelir. Her ders için en fazla 3 kanal seçebilirsin.</p><div id="yt-tb">'.concat(teachersHTML(subs), "</div>"));
  ytDiscover(subs).then((ch) => {
    if (ch && sheetEl) {
      const b = $("#yt-tb");
      if (b) b.innerHTML = teachersHTML(subs);
    }
  });
  return box;
}
const ytRepaint = () => {
  const b = $("#yt-tb");
  if (b) {
    const subs = ui.plan && ui.plan.subjects && ui.plan.subjects.length ? ui.plan.subjects : TRACKS[DB.d.profile.track].subjects;
    b.innerHTML = teachersHTML(subs);
  } else render();
};
Object.assign(ACT, {
  "yt-teach": () => teachersSheet(),
  "yt-t-add": (el) => {
    const s = el.dataset.s;
    YT.setTeachers(s, YT.teachers(s).concat([el.dataset.n]));
    ytRepaint();
  },
  "yt-t-rm": (el) => {
    const s = el.dataset.s;
    YT.setTeachers(s, YT.teachers(s).filter((n) => n !== el.dataset.n));
    ytRepaint();
  },
  "yt-t-new": (el) => {
    const s = el.dataset.s, row = el.closest(".chips-row");
    if (!row || row.querySelector("input")) return;
    el.insertAdjacentHTML("beforebegin", '<span class="yt-new"><input class="input sm" maxlength="40" placeholder="Kanal ya da hoca adı" aria-label="'.concat(esc(s), ' için kanal adı"><button class="btn sm primary">Ekle</button></span>'));
    const inp = row.querySelector(".yt-new input"), go = () => {
      const n = inp.value.trim();
      if (n) {
        YT.setTeachers(s, YT.teachers(s).concat([n]));
        ytRepaint();
      }
    };
    inp.focus();
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        go();
      }
    });
    row.querySelector(".yt-new .btn").addEventListener("click", go);
  },
  "yt-list": (el) => {
    const [wk, id] = el.dataset.k.split("|"), w = DB.week(wk), t = w && w.tasks.find((x) => x.id === id);
    if (t) ytListSheet(wk, t);
  },
  /* videosu henüz bulunmamış görev: pencereyi hemen aç, video bulununca oraya yönlendir */
  "yt-open": async (el) => {
    const [wk, id] = el.dataset.k.split("|"), w = DB.week(wk), t = w && w.tasks.find((x) => x.id === id);
    if (!t) return;
    let win = null;
    try {
      win = window.open("about:blank", "_blank");
    } catch (e) {
    }
    el.disabled = true;
    el.innerHTML = YT_IC + "Video aranıyor…";
    const v = await YT.find(t);
    if (v) {
      t.vid = v.id;
      t.vt = v.title;
      t.vc = v.ch;
      DB.save();
    }
    const url = v ? ytUrl(v.id) : YT.searchUrl(t);
    if (win && !win.closed) win.location.href = url;
    else location.href = url;
    render();
  }
});
