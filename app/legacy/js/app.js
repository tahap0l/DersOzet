/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0. Eski tarayıcılar için çevrilmiş kopya; kaynak app/js, üreten tools/build-legacy.sh */
"use strict";
/*!
 * Ders Özetim — YKS / YDS çalışma arkadaşı
 * Copyright (C) 2026 Esat Taha Polat — https://github.com/tahap0l/DersOzet
 * GNU Affero General Public License v3.0. Bu dosyayı değiştirip yayımlarsan kaynak kodunu
 * aynı lisansla paylaşman ve bu telif satırını koruman gerekir.
 *
 * app.js: arayüz, sayfalar ve etkileşimler.
 */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const I = {
  sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg>',
  cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6.5C10 5 7 4.5 3.5 5v13.5C7 18 10 18.5 12 20c2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5Z"/><path d="M12 6.5V20"/></svg>',
  timer: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5M9.5 2.5h5M18.5 6.5l1.2-1.2"/></svg>',
  user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.5" r="4"/><path d="M4 20.5c1.2-3.8 4.4-5.5 8-5.5s6.8 1.7 8 5.5"/></svg>',
  dots: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5.5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18.5" cy="12" r="1.6"/></svg>',
  flame: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.2 2.2-5.2 3.6-7.4.4 1.9 1.4 3 2.4 3.5C11.4 7 12.6 4.3 15 3c-.3 2.5.7 4.4 2 6.1 1 1.4 1.5 2.9 1.5 4.7C18.5 18.3 15.9 21 12 21Z"/></svg>',
  gear: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.5-2-3.4-2.4 1a7.4 7.4 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.6A7.4 7.4 0 0 0 7 6.6l-2.4-1-2 3.4 2 1.5a7.6 7.6 0 0 0 0 3l-2 1.5 2 3.4 2.4-1a7.4 7.4 0 0 0 2.6 1.5l.4 2.6h4l.4-2.6a7.4 7.4 0 0 0 2.6-1.5l2.4 1 2-3.4Z"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  target: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/></svg>',
  medal: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="14.5" r="5.5"/><path d="M8.5 10 6 3.5h4l2 4M15.5 10 18 3.5h-4l-2 4"/><path d="m12 12.3.8 1.6 1.7.3-1.2 1.2.3 1.7-1.6-.8-1.6.8.3-1.7-1.2-1.2 1.7-.3Z"/></svg>',
  school: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9.5 12 5l9 4.5-9 4.5Z"/><path d="M7 11.5v4.5c1.5 1.3 3.2 2 5 2s3.5-.7 5-2v-4.5M21 9.5v5"/></svg>',
  rooms: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8.5" cy="9" r="3"/><circle cx="16.5" cy="9.5" r="2.5"/><path d="M3 19c.8-3 3-4.5 5.5-4.5S13.2 16 14 19M14.5 14.6c.6-.2 1.3-.3 2-.3 2.2 0 4 1.3 4.5 4.2"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4"/></svg>',
  mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>',
  micOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 9.5V6a3 3 0 0 0-5.8-1M9 9v2a3 3 0 0 0 4.6 2.5M5.5 11a6.5 6.5 0 0 0 10.4 5.2M18.4 12.5c.1-.5.1-1 .1-1.5M12 17.5V21M4 4l16 16"/></svg>',
  cam: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6.5" width="12.5" height="11" rx="2.5"/><path d="m15.5 10.5 5-3v9l-5-3"/></svg>',
  camOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 13.5v1.5a2.5 2.5 0 0 1-2.5 2.5H5.5A2.5 2.5 0 0 1 3 15V9a2.5 2.5 0 0 1 2.5-2.5M9 6.5h4a2.5 2.5 0 0 1 2.5 2.5v1.5l5-3v9M3 3l18 18"/></svg>',
  chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16v10H9l-5 4Z"/></svg>',
  send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12 20 4l-6 16-3-7Z"/></svg>',
  leave: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14M10 8l-4 4 4 4M6 12h10"/></svg>',
  eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
  watch: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5l3-3M10 2.5h4"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  expand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>',
  music: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/></svg>',
  shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6Z"/><path d="m9 12 2 2 4-4"/></svg>',
  pen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10Z"/><path d="M14 7l3 3"/></svg>',
  marker: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 15 7.5-7.5a2 2 0 0 1 3 3L12 18l-4 1Z"/><path d="M8 19H4l2.5-2.5M4 21h16"/></svg>',
  eraser: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.5 4.5 21 9l-9.5 9.5H7L3 14.5Z"/><path d="M9.5 8.5l6 6M7 18.5h13"/></svg>',
  undo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>',
  redo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/></svg>',
  hand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11V4.5a1.5 1.5 0 0 1 3 0V12M14 11.5V6a1.5 1.5 0 0 1 3 0v7c0 4-2.5 7-6.5 7-2.6 0-4.2-1.3-5.4-3.5L3.5 13a1.5 1.5 0 0 1 2.6-1.4L8 14"/></svg>',
  text: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M5 11h14M5 16h9"/></svg>',
  notebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18M3 7h4M3 12h4M3 17h4M12 8h4M12 12h4"/></svg>',
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3Z" style="fill:currentColor"/></svg>',
  flask: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 3.5h5M10.5 3.5v5.2L5.3 17.6A2 2 0 0 0 7 20.5h10a2 2 0 0 0 1.7-2.9l-5.2-8.9V3.5"/><path d="M7.6 14.5h8.8"/></svg>',
  spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8Z"/><path d="M18.5 16l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7Z"/></svg>'
};
const TABS = [
  { id: "bugun", label: "Bugün", icon: I.sun },
  { id: "program", label: "Program", icon: I.cal },
  { id: "odalar", label: "Odalar", icon: I.rooms },
  { id: "odak", label: "Odak", icon: I.timer },
  { id: "defter", label: "Defter", icon: I.notebook },
  { id: "kitaplik", label: "Kitaplık", icon: I.book, rail: true },
  { id: "asistan", label: "Asistan", icon: I.spark, rail: true },
  { id: "lab", label: "Laboratuvar", icon: I.flask, rail: true },
  { id: "dershane", label: "Dershane", icon: I.school, rail: true },
  { id: "medya", label: "Müzik ve video", icon: I.music, rail: true },
  { id: "admin", label: "Yönetici", icon: I.shield, rail: true, admin: true },
  { id: "profil", label: "Profil", icon: I.user }
];
const TEACHER_ORDER = ["bugun", "dershane", "odalar", "odak", "lab", "kitaplik", "asistan", "program", "defter", "medya", "admin", "profil"];
const TEACHER_BAR = ["bugun", "dershane", "odalar", "odak", "lab", "profil"];
function tabsFor() {
  if (!isTeacher()) return TABS;
  return TEACHER_ORDER.map((id) => TABS.find((t) => t.id === id)).filter(Boolean).map((t) => Object.assign({}, t, { rail: !TEACHER_BAR.includes(t.id) }, t.id === "lab" ? { label: matchMedia("(min-width: 900px)").matches ? "Laboratuvar" : "Araçlar" } : {}));
}
let route = { page: "bugun", arg: "" };
const ui = { week: thisWeek(), day: null, libQ: "", libS: "", plan: null, planDraft: null, busy: false, busyText: "" };
function parseRoute() {
  if (/access_token=|error_description=|[#&]error=/.test(location.hash)) {
    route = { page: "bugun", arg: "" };
    return;
  }
  const h = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
  const i = h.indexOf("/");
  route = i < 0 ? { page: h || "bugun", arg: "" } : { page: h.slice(0, i), arg: h.slice(i + 1) };
}
function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}
let toastT = null;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove("show"), 3600);
}
window.toast = toast;
let sheetEl = null, sheetReturn = null;
function openSheet(title, body, opts) {
  closeSheet();
  sheetReturn = document.activeElement;
  const wrap = document.createElement("div");
  wrap.className = "sheet-wrap";
  wrap.innerHTML = '<div class="sheet" role="dialog" aria-modal="true" aria-label="'.concat(esc(title), '" tabindex="-1">\n    <div class="sheet-grip" aria-hidden="true"></div>\n    <div class="sheet-head"><h2>').concat(esc(title), '</h2><button class="icon-btn" data-act="sheet-close" aria-label="Kapat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>\n    <div class="sheet-body">').concat(body, "</div></div>");
  wrap.addEventListener("mousedown", (e) => {
    if (e.target === wrap && !(opts && opts.sticky)) closeSheet();
  });
  document.body.appendChild(wrap);
  document.body.classList.add("locked");
  sheetEl = wrap;
  syncRadios(wrap);
  requestAnimationFrame(() => wrap.classList.add("open"));
  const box = wrap.querySelector(".sheet");
  const f = box.querySelector("[autofocus]");
  (f || box).focus({ preventScroll: true });
  return box;
}
const NO_HAS = !(window.CSS && CSS.supports && CSS.supports("selector(:has(a))"));
function syncRadios(root) {
  if (!NO_HAS) return;
  (root || document).querySelectorAll("label.fchip.radio, label.kind").forEach((l) => {
    const i = l.querySelector("input");
    if (i) l.classList.toggle("on", i.checked);
  });
}
document.addEventListener("change", (e) => {
  if (NO_HAS && e.target && e.target.type === "radio") syncRadios();
});
function closeSheet() {
  if (!sheetEl) return;
  sheetEl.remove();
  sheetEl = null;
  document.body.classList.remove("locked");
  if (sheetReturn && document.contains(sheetReturn)) sheetReturn.focus({ preventScroll: true });
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && sheetEl) closeSheet();
});
const chip = (s) => s ? '<span class="chip" style="--c:'.concat(subjColor(s), '">').concat(esc(s), "</span>") : "";
function taskRow(wk, t) {
  const slug = t.topic ? topicSlug(t.subject, t.topic) : "";
  const has = slug && sumFor(slug);
  const link = !t.topic ? "" : has ? '<a class="tlink" href="#/konu/'.concat(encodeURIComponent(slug), '">Özeti aç</a>') : '<a class="tlink soft" href="#/asistan/ozet/'.concat(encodeURIComponent((t.subject || "") + "|" + t.topic), '">Özet çıkar</a>');
  return '<li class="task'.concat(t.done ? " done" : "", '" style="--c:').concat(subjColor(t.subject), '">\n    <label class="check"><input type="checkbox" data-done="').concat(wk, "|").concat(esc(t.id), '"').concat(t.done ? " checked" : "", ' aria-label="').concat(esc(t.label || t.text), ' tamamlandı"><span class="box" aria-hidden="true"></span></label>\n    <div class="task-b"><p class="task-t">').concat(esc(t.label || sentence(t.text)), "</p>").concat((() => {
    const vid = typeof taskVideoHTML === "function" ? taskVideoHTML(wk, t) : "";
    return t.subject || link || vid || t.src === "dershane" ? '<div class="task-m">'.concat(chip(t.subject)).concat(t.src === "dershane" ? '<span class="from-sc" title="'.concat(esc(t.school || "Dershane"), '">').concat(I.school, "Dershane</span>") : "").concat(link).concat(vid, "</div>") : "";
  })(), '</div>\n    <button class="icon-btn ghost" data-act="edit" data-k="').concat(wk, "|").concat(esc(t.id), '" aria-label="Görevi düzenle">').concat(I.dots, "</button>\n  </li>");
}
const DAY_NOTES = ["En zor dersi günün ilk çalışma saatine koy; enerjin en yüksekken bitir.", "Telefonu başka odaya bırakıp bir odak turu dene.", "Yanlış yaptığın soruları bir kenara yaz; hafta sonu tekrar et.", "Su iç, kısa bir yürüyüş yap; beynin de mola ister.", "Bugün bitirdiğin tek görev bile serine bir gün ekler.", "Konu çalıştıktan hemen sonra aynı konudan soru çöz.", "Uyku da çalışmanın parçası; geç saate bırakma."];
function weatherNote() {
  if (ENV === "artifact") {
    const doy2 = Math.floor((Date.now() - new Date((/* @__PURE__ */ new Date()).getFullYear(), 0, 0)) / 864e5);
    return '<aside class="note" aria-label="Günün notu"><p class="note-top"><span>Günün notu</span></p><p class="note-line">'.concat(esc(DAY_NOTES[doy2 % DAY_NOTES.length]), "</p></aside>");
  }
  const c = DB.d.profile.city;
  if (!c) return '<button class="note note-empty" data-act="city"><span>Şehrini seç; her gün havaya göre küçük bir not bırakayım.</span></button>';
  const w = WX.data;
  if (!w || w.lat !== c.lat) return '<aside class="note"><p class="note-top">'.concat(esc(c.name), '</p><p class="note-line">').concat(WX.loading || !WX.error ? "Hava durumuna bakılıyor…" : "Hava durumu şu an alınamadı.", "</p></aside>");
  const k = wxKind(w.code, w.temp), info = WX_TEXT[k];
  const doy = Math.floor((Date.now() - new Date((/* @__PURE__ */ new Date()).getFullYear(), 0, 0)) / 864e5);
  return '<aside class="note" aria-label="Günün havası">\n    <p class="note-top"><span>'.concat(esc(c.name), ", ").concat(w.temp, "° ").concat(esc(info.name.toLocaleLowerCase("tr")), '</span><span class="note-sub">').concat(w.min, "° / ").concat(w.max, "°").concat(w.rain != null ? ", yağış %" + w.rain : "", '</span></p>\n    <p class="note-line">').concat(esc(info.lines[doy % info.lines.length]), "</p></aside>");
}
function emptyBlock(title, text, actions) {
  return '<div class="empty"><h2>'.concat(title, "</h2><p>").concat(text, "</p>").concat(actions ? '<div class="row">'.concat(actions, "</div>") : "", "</div>");
}
function todayView() {
  if (isTeacher()) return teacherToday();
  const p = DB.d.profile, di = todayIdx(), wk = thisWeek(), w = DB.week(wk);
  const ts = w ? w.tasks.filter((t) => t.day === di) : [];
  const done = ts.filter((t) => t.done).length;
  const st = streakInfo(), fm = (DB.d.stats.days[dayKey()] || {}).focus || 0;
  const h = (/* @__PURE__ */ new Date()).getHours();
  const hi = h < 5 ? "İyi geceler" : h < 12 ? "Günaydın" : h < 18 ? "İyi günler" : "İyi akşamlar";
  const left = daysLeft();
  const taskLine = ts.length ? done === ts.length ? "Bugünkü ".concat(ts.length, " görevin hepsi bitti.") : "Bugün ".concat(ts.length, " görevin var").concat(done ? ", " + done + " tanesi bitti" : "", ".") : w && w.tasks.length ? "Bugüne görev yazılmamış." : "";
  const allDone = ts.length > 0 && done === ts.length;
  const noProg = !(w && w.tasks.length), motto = mottoFor({ allDone, streak: st.cur, left });
  const ins = Cloud.enabled ? installBanner() : "";
  const goalMin = p.dailyFocus || 120, wp = weekProgress(wk), g = p.goal || {};
  return '\n  <header class="top"><p class="top-date">'.concat(DAYS[di], ", ").concat(fmtDay(/* @__PURE__ */ new Date()), '</p><a class="avatar" href="#/profil" aria-label="Profil">').concat(esc((p.name || "?").charAt(0).toLocaleUpperCase("tr")), '</a></header>\n  <section class="hero').concat(allDone ? " all-done" : "", '">\n    <h1 class="greet">').concat(hi).concat(p.name ? ", " + esc(firstName(p.name)) : "", '.</h1>\n    <p class="lede">YKS\'ye <strong class="count">').concat(left, " gün</strong> kaldı. ").concat(taskLine, "</p>\n    ").concat(g.dept ? '<p class="goal-line">'.concat(I.target, "<span>Hedefin: <strong>").concat(g.school ? esc(g.school) + ", " : "").concat(esc(g.dept), "</strong></span></p>") : "", '\n    <div class="pills">\n      <span class="pill').concat(st.today ? " on" : "", '">').concat(I.flame, "<span><strong>").concat(st.cur, '</strong> günlük seri</span></span>\n      <span class="pill').concat(fm >= goalMin ? " on" : "", '">').concat(I.timer, "<span><strong>").concat(fm, "</strong>/").concat(goalMin, " dk odak</span></span>\n      ").concat(wp ? '<a class="pill" href="#/program" data-act="to-overview">'.concat(I.cal, "<span>Hafta <strong>%").concat(wp.pct, "</strong></span></a>") : "", "\n    </div>\n    ").concat(noProg ? "" : '<p class="motto">'.concat(motto, "</p>"), "\n  </section>\n  ").concat(mascotCard(noProg ? [Object.assign(document.createElement("textarea"), { innerHTML: motto }).value] : null), "\n  ").concat(ins, "\n  ").concat(p.why ? '<aside class="why"><p class="why-h">Neden çalışıyorum?</p><p class="why-t">'.concat(esc(p.why), "</p></aside>") : "", "\n  ").concat(ins && !DB.d.profile.city ? "" : weatherNote(), '\n  <section class="block">\n    <div class="block-head"><h2>Bugünkü görevler</h2>').concat(ts.length ? '<a href="#/program">Tüm hafta</a>' : "", "</div>\n    ").concat(ts.length ? '<ul class="tasks">'.concat(ts.map((t) => taskRow(wk, t)).join(""), "</ul>") : w && w.tasks.length ? '<p class="hint">Bugün dinlenme günü olabilir. İstersen bir görev ekle.</p><div class="row"><button class="btn" data-act="add">Görev ekle</button></div>' : emptyBlock(
    "Haftanı birlikte kuralım",
    "Koçunun gönderdiği Excel programını yükle, kendi görevlerini yaz ya da sana göre bir plan oluşturalım.",
    '<button class="btn primary" data-act="upload">Excel yükle</button><a class="btn" href="#/asistan/plan">Plan oluştur</a><button class="btn" data-act="add">Görev yaz</button>'
  ), '\n  </section>\n  <a class="focus-cta" href="#/odak"><span class="fc-ic">').concat(I.timer, "</span><span><strong>").concat(DB.d.timer.running ? "Odak sürüyor: " + pmFmt(pmLeft()) : "Odaklanmaya hazır mısın?", "</strong><span>").concat(DB.d.focus.focus, " dakika çalış, ").concat(DB.d.focus.brk, ' dakika mola.</span></span><span class="fc-go">').concat(I.next, "</span></a>");
}
function programView() {
  const wk = ui.week, w = DB.week(wk), isThis = wk === thisWeek(), mon = fromKey(wk);
  if (ui.day == null) ui.day = isThis ? todayIdx() : 0;
  const tasks = w ? w.tasks : [];
  const dayTasks = tasks.filter((t) => t.day === ui.day);
  const chips = DAYS_S.map((d, i) => {
    const n = tasks.filter((t) => t.day === i).length, dn = tasks.filter((t) => t.day === i && t.done).length;
    const today = isThis && i === todayIdx();
    return '<button class="dchip'.concat(i === ui.day ? " on" : "").concat(today ? " today" : "", '" data-act="day" data-i="').concat(i, '" role="tab" aria-selected="').concat(i === ui.day, '">\n      <span class="dc-d">').concat(d, '</span><span class="dc-n">').concat(addDays(mon, i).getDate(), '</span><span class="dc-c" aria-label="').concat(n, ' görev">').concat(n ? dn === n ? "✓" : n : "", "</span></button>");
  }).join("");
  const ready = tasks.filter((t) => t.topic && sumFor(topicSlug(t.subject, t.topic))).length;
  return '\n  <header class="page-head"><h1>Program</h1></header>\n  <div class="weeknav">\n    <button class="icon-btn" data-act="wk" data-d="-1" aria-label="Önceki hafta">'.concat(I.back, '</button>\n    <div class="wk-mid"><p class="wk-r">').concat(weekRange(wk), '</p><p class="wk-l">').concat(isThis ? "Bu hafta" : '<button class="link" data-act="wk-now">Bu haftaya dön</button>').concat(w && w.label ? ", " + esc(w.label) : "", '</p></div>\n    <button class="icon-btn" data-act="wk" data-d="1" aria-label="Sonraki hafta">').concat(I.next, "</button>\n  </div>\n  ").concat((() => {
    const wp = weekProgress(wk);
    return wp ? '<div class="wprog" aria-label="Haftanın yüzde '.concat(wp.pct, '\'i tamam"><div class="wprog-bar"><div style="width:').concat(wp.pct, '%"></div></div><span>%').concat(wp.pct, "</span></div>") : "";
  })(), '\n  <div class="days" role="tablist" aria-label="Günler">').concat(chips, '</div>\n  <section class="block">\n    <div class="block-head"><h2>').concat(DAYS[ui.day], ", ").concat(fmtDay(addDays(mon, ui.day)), "</h2>").concat(dayTasks.length ? '<span class="hint">'.concat(dayTasks.filter((t) => t.done).length, "/").concat(dayTasks.length, "</span>") : "", "</div>\n    ").concat(dayTasks.length ? '<ul class="tasks">'.concat(dayTasks.map((t) => taskRow(wk, t)).join(""), "</ul>") : '<p class="hint">'.concat(tasks.length ? "Bu gün boş." : "Bu hafta için program yok. Excel yükle, görev yaz ya da plan oluştur.", "</p>"), '\n  </section>\n  <div class="actions">\n    <button class="btn primary" data-act="add">Görev ekle</button>\n    <button class="btn" data-act="upload">Excel yükle</button>\n    <a class="btn" href="#/asistan/plan">').concat(I.spark, "Plan oluştur</a>\n  </div>\n  ").concat(tasks.length ? '<p class="hint">'.concat(tasks.length, " görev, ").concat(tasks.filter((t) => t.done).length, " tamamlandı, ").concat(ready, ' görevin konu özeti hazır.</p>\n  <div class="row links"><button class="link" data-act="week-pdf">Haftalık PDF indir</button><button class="link danger" data-act="week-clear">Haftayı temizle</button></div>\n  ').concat(weekOverviewHTML(wk, w)) : "");
}
function weekOverviewHTML(wk, w) {
  const auto = weekAuto(wk);
  if (!auto) return "";
  const ai = w.overview && w.overview.sig === weekSig(w) ? w.overview : null;
  const stale = w.overview && !ai;
  const notes = {};
  if (ai) ai.subjects.forEach((x) => {
    notes[x.subject] = x.note;
  });
  const busy = ui.busy && ui.busyFor === "week" ? '<div class="progress"><span class="spinner" aria-hidden="true"></span><span id="ai-prog">'.concat(esc(ui.busyText || "Hazırlanıyor…"), "</span></div>") : "";
  return '<section class="block wk-ov" id="haftaya-bakis">\n    <div class="block-head"><h2>Haftaya bakış</h2>'.concat(ai ? '<span class="tag">Yapay zekâ</span>' : "", "</div>\n    ").concat(ai && ai.headline ? '<p class="ov-head">'.concat(esc(ai.headline), "</p>") : "", '\n    <p class="ov-sum">').concat(esc(ai && ai.summary ? ai.summary : auto.summary), "</p>\n    ").concat(stale ? '<p class="hint">Program değişti; yapay zekâ özetini güncellemek için aşağıdaki düğmeye bas.</p>' : "", '\n    <h3 class="ov-h">Öncelikler</h3>\n    <ul class="ov-list">').concat((ai && ai.priorities.length ? ai.priorities : auto.priorities).map((x) => "<li>".concat(esc(x), "</li>")).join(""), '</ul>\n    <h3 class="ov-h">Derslere göre</h3>\n    <ul class="ov-subj">').concat(auto.subjects.map((s) => '<li style="--c:'.concat(subjColor(s.subject), '">\n      <div class="ov-s-top">').concat(chip(s.subject || "Diğer"), '<span class="hint">').concat(s.tasks, " görev").concat(s.videos ? ", " + s.videos + " video" : "").concat(s.done ? ", " + s.done + " bitti" : "", "</span></div>\n      ").concat(notes[s.subject] ? '<p class="ov-note">'.concat(esc(notes[s.subject]), "</p>") : "", "\n      ").concat(Object.values(s.topics).length ? '<p class="ov-topics">'.concat(Object.values(s.topics).map((t) => t.ready ? '<a href="#/konu/'.concat(encodeURIComponent(t.slug), '">').concat(esc(t.name), "</a>") : "<span>".concat(esc(t.name), "</span>")).join(""), "</p>") : "", "\n    </li>")).join(""), "</ul>\n    ").concat(ai && ai.tip ? '<p class="d-tip"><strong>İpucu:</strong> '.concat(esc(ai.tip), "</p>") : "", '\n    <div class="row"><button class="btn sm" data-act="wk-ai"').concat(ui.busy ? " disabled" : "", ">").concat(I.spark).concat(ai ? "Yapay zekâ özetini yenile" : "Yapay zekâyla özetle", '</button><button class="link" data-act="wk-ext">Başka bir yapay zekâda</button></div>\n    ').concat(busy, "\n  </section>");
}
function libraryList() {
  const q = stemWords(ui.libQ);
  const items = allTopics().filter((t) => (!ui.libS || t.subject === ui.libS) && (!q.length || (() => {
    const hay = stemWords(t.name + " " + t.subject);
    return q.every((x) => hay.some((h) => h.startsWith(x.slice(0, 5))));
  })()));
  if (!items.length) {
    const name = ui.libQ.trim();
    return emptyBlock(
      name ? "“" + esc(name) + "” için özet yok" : "Bu derste özet yok",
      "Kendi özetini yapay zekâyla hazırlayabilirsin. Özet bu cihazda saklanır.",
      '<a class="btn primary" href="#/asistan/ozet/'.concat(encodeURIComponent((ui.libS || "") + "|" + name), '">').concat(I.spark, "Özet çıkar</a>")
    );
  }
  const groups = {};
  items.forEach((t) => {
    (groups[t.subject] = groups[t.subject] || []).push(t);
  });
  return Object.keys(groups).map((sj) => '<section class="lgroup"><h2 class="lg-h">'.concat(chip(sj || "Genel"), '<span class="hint">').concat(groups[sj].length, '</span></h2>\n    <ul class="tlist">').concat(groups[sj].map((t) => '<li><a class="trow" href="#/konu/'.concat(encodeURIComponent(t.slug), '" style="--c:').concat(subjColor(t.subject), '"><span class="tdot" aria-hidden="true"></span><span class="tname">').concat(esc(t.name), "</span>").concat(t.mine ? '<span class="tag">Senin</span>' : "").concat(I.next, "</a></li>")).join(""), "</ul></section>")).join("");
}
function mySumsHTML() {
  const mine = Object.values(DB.d.userSums).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  if (!mine.length) return '<div class="my-sums empty-mini"><p>Kitaplıkta olmayan bir konu mu var? Yapay zekâ senin için özet çıkarsın.</p><a class="btn sm primary" href="#/asistan/ozet">'.concat(I.spark, "Özet çıkar</a></div>");
  return '<section class="block my-sums"><div class="block-head"><h2>Senin özetlerin</h2><a class="btn sm" href="#/asistan/ozet">'.concat(I.spark, 'Yeni özet</a></div>\n    <ul class="tlist">').concat(mine.slice(0, ui.allMine ? 200 : 5).map((t) => '<li><a class="trow" href="#/konu/'.concat(encodeURIComponent(t.slug), '" style="--c:').concat(subjColor(t.subject), '"><span class="tdot" aria-hidden="true"></span><span class="tname">').concat(esc(t.name)).concat(t.subject ? ' <span class="hint">'.concat(esc(t.subject), "</span>") : "", "</span>").concat(I.next, "</a></li>")).join(""), "</ul>\n    ").concat(mine.length > 5 && !ui.allMine ? '<button class="link sm" data-act="all-mine">Hepsini göster ('.concat(mine.length, ")</button>") : "", "</section>");
}
function libraryView() {
  const all = allTopics();
  const subs = SUBJ_ORDER.filter((s) => all.some((t) => t.subject === s));
  return "\n  ".concat(Cloud.uid && !matchMedia("(min-width: 900px)").matches ? defterHead() + defterSeg("kitaplik") + '<p class="sub">'.concat(all.length, " konu özeti</p>") : '<header class="page-head"><h1>Kitaplık</h1><p class="sub">'.concat(all.length, " konu özeti</p></header>"), "\n  ").concat(ENV === "artifact" ? "" : mySumsHTML(), '\n  <div class="search"><input id="lib-q" type="search" inputmode="search" placeholder="Konu ara: basınç, paragraf, hücre" value="').concat(esc(ui.libQ), '" aria-label="Konu ara" autocomplete="off"></div>\n  <div class="chips-row" role="group" aria-label="Ders filtresi">\n    <button class="fchip').concat(!ui.libS ? " on" : "", '" data-act="lib-s" data-s="">Tümü</button>\n    ').concat(subs.map((s) => '<button class="fchip'.concat(ui.libS === s ? " on" : "", '" data-act="lib-s" data-s="').concat(esc(s), '" style="--c:').concat(subjColor(s), '">').concat(esc(s), "</button>")).join(""), '\n  </div>\n  <div id="lib-list">').concat(libraryList(), "</div>");
}
function topicView() {
  const slug = route.arg, sd = sumFor(slug);
  if (!sd) return '<header class="page-head slim"><button class="back" data-act="back">'.concat(I.back, "Kitaplık</button></header>") + emptyBlock("Bu özet bulunamadı", "Silinmiş ya da henüz hazırlanmamış olabilir.", '<a class="btn" href="#/kitaplik">Kitaplığa dön</a>');
  const mine = !!DB.d.userSums[slug];
  const w = DB.week(thisWeek());
  const tasks = w ? w.tasks.filter((t) => t.topic && topicSlug(t.subject, t.topic) === slug) : [];
  const tp = { slug, subject: sd.subject, name: sd.name, tasks };
  return '<header class="page-head slim"><button class="back" data-act="back">'.concat(I.back, 'Geri</button>\n    <div class="row"><button class="btn sm" data-act="topic-pdf">PDF indir</button>').concat(mine ? '<button class="btn sm danger" data-act="topic-del">Sil</button>' : "", "</div></header>\n    ").concat(typeof simLinksHTML === "function" ? simLinksHTML(slug) : "", '\n    <div class="ask-topic"><button class="btn sm" data-act="ask-topic" data-n="').concat(esc(sd.name || ""), '">').concat(I.chat, 'Bu konuda takıldığın yeri Mürek\'e sor</button></div>\n    <div class="reader">').concat(topicDocHTML(tp, Object.assign({ mine }, sd), false), "</div>");
}
const T = () => DB.d.timer;
const modeMins = (m) => m === "focus" ? DB.d.focus.focus : m === "brk" ? DB.d.focus.brk : DB.d.focus.long;
const MODE_NAME = { focus: "Odak", brk: "Kısa mola", long: "Uzun mola" };
const pmFmt = (s) => {
  s = Math.max(0, Math.round(s));
  return pad(Math.floor(s / 60)) + ":" + pad(s % 60);
};
const pmLeft = () => T().running ? (T().endAt - Date.now()) / 1e3 : T().left;
let pmTimer = null, audioCtx = null;
function pmSetMode(m) {
  const t = T();
  t.mode = m;
  t.left = modeMins(m) * 60;
  t.running = false;
  t.endAt = 0;
  DB.save(true);
}
function pmStart() {
  const t = T();
  t.running = true;
  t.endAt = Date.now() + t.left * 1e3;
  DB.save(true);
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch (e) {
  }
  pmLoop();
}
function pmPause() {
  const t = T();
  t.left = Math.max(0, Math.round((t.endAt - Date.now()) / 1e3));
  t.running = false;
  DB.save(true);
  pmLoop();
}
function pmLoop() {
  clearInterval(pmTimer);
  pmTimer = null;
  if (T().running) pmTimer = setInterval(pmTick, 500);
  pmPaint();
}
function beep() {
  if (DB.d.profile.sound !== false && audioCtx) {
    try {
      [0, 0.3, 0.6].forEach((s) => {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.connect(g);
        g.connect(audioCtx.destination);
        o.frequency.value = 784;
        g.gain.setValueAtTime(0.18, audioCtx.currentTime + s);
        g.gain.exponentialRampToValueAtTime(1e-3, audioCtx.currentTime + s + 0.25);
        o.start(audioCtx.currentTime + s);
        o.stop(audioCtx.currentTime + s + 0.26);
      });
    } catch (e) {
    }
  }
  try {
    if (navigator.vibrate) navigator.vibrate([180, 90, 180]);
  } catch (e) {
  }
}
function pmTick() {
  const t = T();
  if (!t.running) return pmLoop();
  if (t.endAt - Date.now() <= 0) {
    const was = t.mode;
    t.running = false;
    if (was === "focus") {
      const before = (DB.d.stats.days[dayKey()] || {}).focus || 0;
      bump(dayKey(), "focus", modeMins("focus"));
      const goalMin = DB.d.profile.dailyFocus || 120;
      if (before < goalMin && before + modeMins("focus") >= goalMin) setTimeout(() => toast("Günlük odak hedefine ulaştın: " + goalMin + " dakika. Harika!"), 1800);
      if (t.roundsDay !== dayKey()) {
        t.roundsDay = dayKey();
        t.rounds = 0;
      }
      t.rounds++;
      pmSetMode(t.rounds % 4 === 0 ? "long" : "brk");
      toast("Odak turu bitti. Şimdi mola.");
    } else {
      pmSetMode("focus");
      toast("Mola bitti. Hazırsan devam.");
    }
    beep();
    DB.save(true);
    if (route.page === "odak" || route.page === "bugun") render();
    return pmLoop();
  }
  pmPaint();
}
function pmPaint() {
  const t = T(), left = pmLeft(), total = modeMins(t.mode) * 60;
  const el = $("#pm-time");
  if (el) el.textContent = pmFmt(left);
  const ring = $("#pm-ring");
  if (ring) {
    const c = 2 * Math.PI * 104;
    ring.style.strokeDasharray = c;
    ring.style.strokeDashoffset = c * (1 - Math.max(0, Math.min(1, left / total)));
  }
  const b = $("#pm-go");
  if (b) b.textContent = t.running ? "Duraklat" : left < total ? "Devam et" : "Başlat";
  const badge = $("#tab-odak-b");
  if (badge) {
    badge.textContent = t.running ? pmFmt(left) : "";
    badge.hidden = !t.running;
  }
  document.title = t.running ? pmFmt(left) + " · " + MODE_NAME[t.mode] : APP.name;
}
const SW = () => DB.d.sw;
const swMs = () => SW().acc + (SW().running ? Date.now() - SW().startAt : 0);
const swFmt = (ms) => {
  const s = Math.floor(ms / 1e3), h = Math.floor(s / 3600);
  return (h ? h + ":" : "") + pad(Math.floor(s / 60) % 60) + ":" + pad(s % 60);
};
let swTimer = null;
function swLoop() {
  clearInterval(swTimer);
  swTimer = SW().running ? setInterval(swPaint, 500) : null;
  swPaint();
}
function swPaint() {
  const el = $("#sw-time");
  if (el) el.textContent = swFmt(swMs());
  const b = $("#sw-go");
  if (b) b.textContent = SW().running ? "Duraklat" : SW().acc ? "Devam et" : "Başlat";
  const badge = $("#tab-odak-b");
  if (badge && !T().running) {
    badge.textContent = SW().running ? swFmt(swMs()) : "";
    badge.hidden = !SW().running;
  }
}
function swSave() {
  const min = Math.floor(swMs() / 6e4);
  const w = SW();
  w.running = false;
  w.acc = 0;
  w.startAt = 0;
  if (min >= 1) {
    bump(dayKey(), "focus", min);
    toast(min + " dakika çalışma kaydedildi.");
  } else toast("1 dakikadan kısa olduğu için kaydedilmedi.");
  DB.save(true);
  swLoop();
  render();
}
function focusView() {
  const t = T();
  if (t.roundsDay !== dayKey()) {
    t.roundsDay = dayKey();
    t.rounds = 0;
  }
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(/* @__PURE__ */ new Date(), -i);
    days.push({ d, m: (DB.d.stats.days[dayKey(d)] || {}).focus || 0 });
  }
  const mx = Math.max(60, ...days.map((x) => x.m)), total = days.reduce((a, x) => a + x.m, 0);
  const swMode = ui.fmode === "sw";
  return '\n  <header class="page-head"><h1>Odak</h1>'.concat(swMode ? "" : '<button class="icon-btn" data-act="focus-set" aria-label="Süreleri ayarla">'.concat(I.gear, "</button>"), '</header>\n  <div class="seg" role="tablist" aria-label="Sayaç ya da kronometre"><button class="seg-b').concat(!swMode ? " on" : "", '" data-act="f-mode" data-m="pm" role="tab" aria-selected="').concat(!swMode, '">').concat(I.timer, 'Odak sayacı</button><button class="seg-b').concat(swMode ? " on" : "", '" data-act="f-mode" data-m="sw" role="tab" aria-selected="').concat(swMode, '">').concat(I.watch, "Kronometre</button></div>\n  ").concat(swMode ? '<div class="sw-wrap"><p class="sw-time" id="sw-time" role="timer">'.concat(swFmt(swMs()), '</p><p class="pm-mode">Ne kadar çalıştığını ölç; bitince kaydet, günlük odağına eklensin.</p></div>\n  <div class="pm-ctl"><button class="btn primary lg" data-act="sw-go" id="sw-go">Başlat</button>').concat(SW().acc || SW().running ? '<button class="btn lg" data-act="sw-save">Bitir ve kaydet</button><button class="btn lg ghost" data-act="sw-reset">Sıfırla</button>' : "", "</div>") : '<div class="seg small" role="tablist" aria-label="Sayaç türü">'.concat(["focus", "brk", "long"].map((m) => '<button class="seg-b'.concat(t.mode === m ? " on" : "", '" data-act="pm-mode" data-m="').concat(m, '" role="tab" aria-selected="').concat(t.mode === m, '"').concat(t.running ? " disabled" : "", ">").concat(MODE_NAME[m], "</button>")).join(""), '</div>\n  <div class="ring-wrap mode-').concat(t.mode, '">\n    <svg class="ring" viewBox="0 0 240 240" aria-hidden="true"><circle class="ring-bg" cx="120" cy="120" r="104"/><circle class="ring-fg" id="pm-ring" cx="120" cy="120" r="104"/></svg>\n    <div class="ring-c"><p class="pm-time" id="pm-time" role="timer" aria-live="off">').concat(pmFmt(pmLeft()), '</p><p class="pm-mode">').concat(MODE_NAME[t.mode], ", ").concat(modeMins(t.mode), ' dk</p></div>\n  </div>\n  <div class="pm-ctl"><button class="btn primary lg" data-act="pm-go" id="pm-go">Başlat</button><button class="btn lg" data-act="pm-reset">Sıfırla</button></div>'), "\n  ").concat(typeof SP !== "undefined" && SP.on ? '<section class="block sp-card mini"><div class="sp-head">'.concat(SP_ICON, '<div><h2>Spotify</h2></div><a class="link sm" href="#/medya">Listeler</a></div><div id="sp-mini">').concat(spNowHTML(true), "</div></section>") : "", '\n  <a class="focus-cta" href="#/medya"><span class="fc-ic">').concat(I.music, "</span><span><strong>").concat(Player.cur ? "Çalıyor: " + esc(Player.cur.title || "") : "Müzik ve video", "</strong><span>YouTube'da ders videosu, Spotify'da çalışma listesi.</span></span><span class=\"fc-go\">").concat(I.next, "</span></a>\n  ").concat(Cloud.enabled ? '<a class="focus-cta" href="#/odalar"><span class="fc-ic">'.concat(I.rooms, '</span><span><strong>Arkadaşlarınla çalış</strong><span>Ortak sayaçlı bir odaya gir; kamera isteğe bağlı.</span></span><span class="fc-go">').concat(I.next, "</span></a>") : "", '\n  <p class="hint center">Bugün ').concat(t.rounds, " odak turu, ").concat((DB.d.stats.days[dayKey()] || {}).focus || 0, "/").concat(DB.d.profile.dailyFocus || 120, " dakika. En az 10 dakikalık odak günlük serine sayılır.</p>\n  ").concat(DB.d.profile.why ? '<aside class="why small"><p class="why-t">'.concat(esc(DB.d.profile.why), "</p></aside>") : "", '\n  <section class="block">\n    <div class="block-head"><h2>Son 7 gün</h2><span class="hint">').concat(total, ' dk</span></div>\n    <div class="bars">').concat(days.map((x) => '<div class="bar-c"><div class="bar" style="height:'.concat(Math.round(x.m / mx * 100), '%" title="').concat(x.m, ' dk"></div><span>').concat(DAYS_S[(x.d.getDay() + 6) % 7], "</span></div>")).join(""), '</div>\n  </section>\n  <p class="hint">Molada ekrandan uzaklaş: su iç, gözlerini dinlendir, kısa bir yürüyüş yap.</p>');
}
function profileView() {
  const p = DB.d.profile, c = p.city;
  const theme = { auto: "Sistemle aynı", light: "Açık", dark: "Koyu" }[p.theme || "auto"];
  const g = p.goal || {}, got = DB.d.stats.badges || {};
  const yd = fromKey(yksDate()), teach = isTeacher();
  const schoolMenu = Cloud.uid ? '<h2 class="menu-h">Dershane</h2>\n  <ul class="menu">\n    '.concat(Cloud.school.map((m) => '<li><a href="#/dershane/'.concat(m.institution_id, '"><span>').concat(esc(m.inst ? m.inst.name : "Dershane"), '</span><span class="mv">').concat(ROLE_NAME[m.role]).concat(m.cls ? ", " + esc(m.cls.name) : "", "</span></a></li>")).join(""), '\n    <li><button data-act="sc-join"><span>Kodla dershaneye katıl</span></button></li>\n    ').concat(teach || Cloud.anyStaff() ? '<li><a href="#/dershane"><span>Dershane paneli</span><span class="mv">Sınıflar ve programlar</span></a></li>' : "", "\n  </ul>") : "";
  const nb = Object.keys(got).length;
  return '\n  <header class="prof"><div class="avatar lg">'.concat(esc((p.name || "?").charAt(0).toLocaleUpperCase("tr")), "</div><div><h1>").concat(esc(p.name || "Adını ekle"), '</h1><p class="sub">').concat(teach ? [whoTag(p)].concat(Cloud.school.filter((m) => m.role !== "student").map((m) => m.inst ? m.inst.name : "")).filter(Boolean).map(esc).join(" · ") : [gradeName(p.grade), TRACKS[p.track] ? TRACKS[p.track].name : ""].filter(Boolean).map(esc).join(" · ") + (g.dept ? "<br>" + esc((g.school ? g.school + ", " : "") + g.dept) + " hedefliyor" : ""), "</p></div></header>\n  ").concat(Cloud.isAdmin ? '<a class="focus-cta admin-cta" href="#/admin"><span class="fc-ic">'.concat(I.shield, '</span><span><strong>Yönetici paneli</strong><span>Kullanıcılar, dershaneler, odalar ve şikâyetler. Sadece sen görürsün.</span></span><span class="fc-go">').concat(I.next, "</span></a>") : "", "\n  ").concat(Cloud.uid ? '<h2 class="menu-h">Hesabın</h2>\n  <ul class="menu">\n    <li><div class="mi"><span>E-posta</span><span class="mv">'.concat(esc(Cloud.user.email || ""), '</span></div></li>\n    <li><button data-act="pw-set"><span>').concat(Cloud.hasPassword() ? "Şifreni değiştir" : "Şifre belirle", '</span><span class="mv">').concat(Cloud.hasPassword() ? "••••••" : "Diğer cihazlarda e-posta ve şifreyle gir", "</span></button></li>\n  </ul>\n  ").concat(teach ? schoolMenu : "", '\n  <h2 class="menu-h">Bilgilerin</h2>') : "", '\n  <ul class="menu">\n    <li><button data-act="p-info"><span>').concat(teach ? "Ad ve branş" : "Ad, sınıf ve alan", '</span><span class="mv">').concat(esc(p.name || "-")).concat(teach ? p.branch ? ", " + esc(p.branch) : "" : (p.grade ? ", " + esc(gradeName(p.grade)) : "") + ", " + esc(TRACKS[p.track] ? TRACKS[p.track].name : ""), "</span></button></li>\n    ").concat(teach ? "" : '\n    <li><button data-act="p-goal"><span>Hedefin</span><span class="mv">'.concat(g.dept ? esc((g.school ? g.school + ", " : "") + g.dept) : "Ekle", '</span></button></li>\n    <li><button data-act="p-why"><span>Neden çalışıyorum?</span><span class="mv">').concat(p.why ? esc(p.why) : "Kendine bir not yaz", '</span></button></li>\n    <li><button data-act="p-date"><span>YKS tarihi</span><span class="mv">').concat(yd.getDate(), " ").concat(MONTHS[yd.getMonth()], " ").concat(yd.getFullYear()).concat(p.yks ? "" : " (tahmini)", "</span></button></li>\n    "), "\n    ").concat(ENV === "artifact" ? "" : '<li><button data-act="city"><span>Şehir</span><span class="mv">'.concat(c ? esc(c.name) : "Seçilmedi", "</span></button></li>"), "\n    ").concat(ENV === "artifact" || teach ? "" : '<li><button data-act="yt-teach"><span>YouTube hocaların</span><span class="mv">'.concat((() => {
    const n = Object.values(p.teachers || {}).flat().length;
    return n ? n + " kanal" : "Seçilmedi";
  })(), "</span></button></li>"), '\n  </ul>\n  <h2 class="menu-h">Ayarlar</h2>\n  <ul class="menu">\n    <li><button data-act="p-palette"><span>Tema rengi</span><span class="mv"><span class="sw-mini" style="--a:').concat(paletteOf(p.palette).sw[0], '"></span>').concat(esc(paletteOf(p.palette).name), '</span></button></li>\n    <li><button data-act="p-theme"><span>Açık ya da koyu</span><span class="mv">').concat(theme, '</span></button></li>\n    <li><button data-act="p-sound"><span>Sayaç sesi</span><span class="mv">').concat(p.sound === false ? "Kapalı" : "Açık", '</span></button></li>\n    <li><a href="#/asistan/ayar"><span>Yapay zekâ</span><span class="mv">').concat(esc(AI.label()), '</span></a></li>\n    <li><a href="#/medya"><span>Müzik ve video</span><span class="mv">YouTube, Spotify</span></a></li>\n    <li><a href="#/kur"><span>Ana ekrana ekle</span><span class="mv">iPhone, Android, bilgisayar</span></a></li>\n  </ul>\n  ').concat(teach ? "" : schoolMenu, "\n  ").concat(teach ? "" : '<h2 class="menu-h">Rozetlerin</h2>\n  <button class="badge-strip" data-act="badges"><span class="bs-icons">'.concat(BADGES.filter((b) => got[b.id]).slice(-5).map(() => '<span class="bs-i on">'.concat(I.medal, "</span>")).join("") || '<span class="bs-i">'.concat(I.medal, "</span>"), '</span>\n    <span class="bs-t"><strong>').concat(nb, "/").concat(BADGES.length, " rozet</strong><span>").concat(nb ? "Son kazandığın: " + esc((BADGES.filter((b) => got[b.id]).sort((a, b2) => String(got[b2.id]).localeCompare(String(got[a.id])))[0] || {}).name || "") : "İlk görevini bitirince ilk rozetin gelir", "</span></span>").concat(I.next, "</button>"), '\n  <h2 class="menu-h">Verilerin</h2>\n  <ul class="menu">\n    <li><button data-act="backup"><span>Yedeği indir</span><span class="mv">JSON dosyası</span></button></li>\n    <li><button data-act="restore"><span>Yedekten geri yükle</span></button></li>\n    ').concat(Cloud.uid ? "" : '<li><button data-act="reset" class="danger"><span>Tüm verileri sil</span></button></li>', "\n  </ul>\n  ").concat(Cloud.uid ? '<h2 class="menu-h">Hesap</h2>\n  <ul class="menu">\n    <li><button data-act="sign-out"><span>Çıkış yap</span></button></li>\n    <li><button data-act="acct-del" class="danger"><span>Hesabımı sil</span></button></li>\n  </ul>\n  <p class="hint">Programın, işaretlerin ve özetlerin hesabına kaydedilir; telefonda, tablette ve bilgisayarda aynısını görürsün. İnternet yokken de çalışır, bağlanınca eşitlenir. Sınıf arkadaşların ve hocaların yalnızca adını, hedefini ve dershane programındaki ilerlemeni görür.</p>' : '<p class="hint">'.concat(ENV === "artifact" ? Sync.col ? "Verilerin Claude hesabında, yalnızca sana görünür şekilde saklanıyor; telefonda ve tablette aynı programı görürsün." : "Verilerin bu cihazın tarayıcısında saklanıyor. Yedeği arada bir indir." : "Programın, işaretlerin ve özetlerin yalnızca bu cihazda saklanır; hiçbir sunucuya gönderilmez. Başka bir cihaza geçerken yedeği indirip orada geri yükle.", "</p>"), '\n  <section class="about">\n    <h2>Hakkında</h2>\n    <p><strong>Ders Özetim</strong>, Esat Taha Polat tarafından geliştirilen açık kaynaklı bir çalışma uygulamasıdır.</p>\n    <p>Sürüm ').concat(APP.version, '. AGPL-3.0 lisanslı; kaynak kodu <a href="').concat(APP.repo, '" target="_blank" rel="noopener">GitHub\'da</a>.</p>\n    <p class="hint">Hava durumu verisi <a href="https://open-meteo.com" target="_blank" rel="noopener">Open-Meteo</a>\'dan gelir (CC BY 4.0). Konu özetleri genel YKS kapsamına göre hazırlanmıştır; önemli bilgileri ders kitabınla karşılaştır.</p>\n  </section>');
}
function assistantView() {
  const [tab, rest] = (() => {
    const a = route.arg || "sor";
    const i = a.indexOf("/");
    return i < 0 ? [a, ""] : [a.slice(0, i), a.slice(i + 1)];
  })();
  const seg = '<div class="seg" role="tablist">'.concat([["sor", "Soru sor"], ["plan", "Program"], ["ozet", "Özet"], ["ayar", "Ayarlar"]].map(([k, n]) => '<a class="seg-b'.concat(tab === k ? " on" : "", '" href="#/asistan/').concat(k, '" role="tab" aria-selected="').concat(tab === k, '">').concat(n, "</a>")).join(""), "</div>");
  const eng = tab === "sor" || DB.d.ai.engine === "bulut" && tab !== "ayar" ? "" : '<div class="engine"><span class="eng-dot'.concat(AI.ready() ? " on" : "", '" aria-hidden="true"></span><span>Yapay zekâ: <strong>').concat(esc(AI.label()), "</strong></span>").concat(tab !== "ayar" ? '<a href="#/asistan/ayar">Değiştir</a>' : "", "</div>");
  let body = "";
  if (tab === "ayar") body = aiSettingsHTML();
  else if (tab === "ozet") body = summaryFormHTML(rest);
  else if (tab === "plan") body = planFormHTML();
  else body = askHTML();
  return '<header class="page-head slim"><button class="back" data-act="back">'.concat(I.back, 'Geri</button></header>\n    <h1 class="page-title">').concat(I.spark, "Asistan</h1>").concat(seg).concat(eng).concat(body);
}
assistantView.after = () => {
  const a = route.arg || "sor";
  if (a === "sor" || a.startsWith("sor/")) askAfter();
  if (a === "plan" && Cloud.uid && typeof NT !== "undefined" && !NT.list && !ui.ntTried) {
    ui.ntTried = true;
    ntLoad().then(() => {
      if (route.page === "asistan" && (route.arg || "") === "plan" && !ui.busy) {
        ui.plan = null;
        render();
      }
    });
  }
};
function summaryFormHTML(rest) {
  let subj = "", name = "";
  if (rest) {
    const i = rest.indexOf("|");
    if (i >= 0) {
      subj = rest.slice(0, i);
      name = rest.slice(i + 1);
    } else name = rest;
  } else if (ui.smDraft) {
    subj = ui.smDraft.subj;
    name = ui.smDraft.name;
  }
  const busy = ui.busy ? '<div class="progress"><span class="spinner" aria-hidden="true"></span><span id="ai-prog">'.concat(esc(ui.busyText || "Hazırlanıyor…"), "</span></div>") : "";
  return '<section class="block">\n    <p class="hint">Bir dersin herhangi bir konusu için yapay zekâ sana özet çıkarsın: konu anlatımı, formüller, kavramlar, sık yapılan hatalar ve örnek sorular.</p>\n    <label class="f-h" for="sm-s">Ders</label>\n    <select id="sm-s"><option value="">Seç</option>'.concat(SUBJ_ORDER.map((s) => "<option".concat(s === subj ? " selected" : "", ">").concat(esc(s), "</option>")).join(""), '</select>\n    <label class="f-h" for="sm-n">Konu</label>\n    <input id="sm-n" class="input" value="').concat(esc(name), '" placeholder="Örn. Kaldırma Kuvveti" maxlength="80" autocomplete="off">\n    <div class="row stack">\n      <button class="btn primary" data-act="sm-ai"').concat(ui.busy ? " disabled" : "", ">").concat(I.spark, 'Yapay zekâyla özet çıkar</button>\n      <button class="link" data-act="sm-ext">Başka bir yapay zekâda hazırla</button>\n    </div>\n    <p class="hint">Hazırlanması 20-40 saniye sürer. Özet hesabına kaydedilir; Defter > Özetler\'in en üstünde, “Senin özetlerin” bölümünde bulursun.</p>\n    ').concat(busy, "\n  </section>\n  ").concat(Object.keys(DB.d.userSums).length ? mySumsHTML() : "");
}
function aiSettingsHTML() {
  const c = DB.d.ai, gpu = AI.hasWebGPU();
  const radio = (v, title, text) => '<label class="opt'.concat(c.engine === v ? " on" : "", '"><input type="radio" name="eng" value="').concat(v, '"').concat(c.engine === v ? " checked" : "", ' data-act="ai-eng"><span><strong>').concat(title, "</strong><span>").concat(text, "</span></span></label>");
  if (ENV === "artifact") return '<section class="block">\n    <h2 class="f-h">Yapay zekâ</h2>\n    <div class="opts">\n      '.concat(radio("off", "Kapalı", "Hızlı plan ve hazır özetler yine çalışır."), "\n      ").concat(radio("claude", "Claude", CAP.sample ? "Kendi Claude hesabınla çalışır; ilk kullanımda izin ister. Ücretsiz planda günlük kullanım sınırı vardır." : "Bu görünümde kullanılamıyor. Sayfayı claude.ai içinde, giriş yapmışken aç."), '\n    </div>\n    <p class="hint">Tarayıcıda çalışan model ve Ollama, sitenin Cloudflare\'daki sürümünde kullanılabilir. Burada ayrıca hazır metni kopyalayıp başka bir yapay zekâya yapıştırabilirsin.</p>\n  </section>');
  return '<section class="block">\n    <h2 class="f-h">Yapay zekâyı nerede çalıştıralım?</h2>\n    <div class="opts">\n      '.concat(radio("bulut", "Ders Özetim yapay zekâsı (önerilen)", "Sitenin kendi sunucusunda çalışır. İndirme, kurulum ve API anahtarı yok; telefonda, tablette ve bilgisayarda çalışır. Fotoğraflı soru da sorabilirsin." + (AI.quota ? " " + AI.quotaText() + "." : " Her öğrencinin günlük bir kullanım hakkı vardır.")), '\n    </div>\n    <details class="adv"').concat(c.engine === "webllm" || c.engine === "ollama" || c.engine === "off" ? " open" : "", '><summary>Gelişmiş seçenekler</summary>\n    <div class="opts">\n      ').concat(radio("off", "Kapalı", "Hızlı plan ve hazır özetler yine çalışır. Dilersen hazır metni başka bir yapay zekâya yapıştırabilirsin."), "\n      ").concat(radio("webllm", "Bu cihazda, tarayıcının içinde", gpu ? "Kurulum ve API anahtarı yok. Model ilk seferde indirilir, sonra internetsiz de çalışır." : "Bu tarayıcı WebGPU desteklemiyor. Chrome, Edge ya da iOS 26 ve sonrası Safari gerekir."), "\n      ").concat(radio("ollama", "Ollama ile bilgisayarımda", "Bilgisayarına ücretsiz Ollama kurduysan onun modellerini kullanır. Telefonda çalışmaz."), '\n    </div>\n    <p class="hint">Bu seçenekler güçlü bilgisayarlar içindir. Tarayıcıdaki model birkaç GB indirir ve çoğu telefonda çalışmaz.</p>\n    </details>\n  </section>\n  ').concat(c.engine === "webllm" ? '<section class="block">\n    <h2 class="f-h">Model</h2>\n    <div class="opts">'.concat(AI_MODELS.map((m) => '<label class="opt'.concat(c.model === m.id ? " on" : "", '"><input type="radio" name="mdl" value="').concat(m.id, '"').concat(c.model === m.id ? " checked" : "", ' data-act="ai-model"><span><strong>').concat(m.name, "</strong><span>").concat(m.note, "</span></span></label>")).join(""), '</div>\n    <div class="row"><button class="btn primary" data-act="ai-load"').concat(!gpu || ui.busy ? " disabled" : "", ">").concat(AI.loadedModel === c.model ? "Model hazır" : "Modeli indir ve hazırla", '</button></div>\n    <div class="meter" ').concat(ui.busy ? "" : "hidden", '><div class="meter-fill" id="ai-meter"></div></div><p class="hint" id="ai-prog">').concat(esc(ui.busy ? ui.busyText : ""), '</p>\n    <p class="hint">İlk indirme birkaç GB tutabilir; Wi-Fi\'de yap. Model tarayıcı önbelleğinde kalır. Küçük modeller Türkçede hata yapabilir; özetleri ders kitabınla karşılaştır.</p>\n  </section>') : "", "\n  ").concat(c.engine === "ollama" ? '<section class="block">\n    <label class="f-h" for="ol-url">Ollama adresi</label>\n    <div class="row nowrap"><input id="ol-url" class="input" value="'.concat(esc(c.ollamaUrl), '" autocomplete="off"><button class="btn" data-act="ol-test">Bağlan</button></div>\n    <div id="ol-models">').concat(c.ollamaModel ? '<p class="hint">Seçili model: <strong>'.concat(esc(c.ollamaModel), "</strong></p>") : "", '</div>\n    <h2 class="f-h">Bağlanamıyorsan</h2>\n    <p class="hint">Ollama, tarayıcıdan gelen istekleri varsayılan olarak engeller. Bu siteye izin vermek için Ollama\'yı kapatıp şu komutla başlat:</p>\n    <pre class="code" id="ol-cmd">OLLAMA_ORIGINS="').concat(esc(location.origin), '" ollama serve</pre>\n    <p class="hint">Windows\'ta: <code>setx OLLAMA_ORIGINS "').concat(esc(location.origin), "\"</code> yaz, sonra Ollama'yı yeniden aç. Türkçe için <code>ollama pull qwen3:4b</code> gibi bir model iyi bir başlangıçtır.</p>\n  </section>") : "");
}
const login = { mode: "in", email: "", err: "", info: "", busy: false };
const AUTH_ERR = (e) => {
  const m = e && e.message || "";
  if (/invalid login credentials/i.test(m)) return "E-posta ya da şifre yanlış.";
  if (/already registered|already been registered|exists/i.test(m)) return "Bu e-postayla zaten bir hesap var. Giriş yap sekmesinden gir.";
  if (/password should be|at least/i.test(m)) return "Şifre en az 6 karakter olmalı.";
  if (/email not confirmed/i.test(m)) return "E-posta adresin henüz onaylanmamış.";
  if (/rate|limit|seconds/i.test(m)) return "Çok sık denendi. Bir dakika bekleyip tekrar dene.";
  if (/provider is not enabled|unsupported provider/i.test(m)) return "Google ile giriş henüz açılmadı. Şimdilik e-posta ve şifreyle devam et.";
  return "Olmadı. İnternet bağlantını kontrol edip tekrar dene.";
};
function loginView() {
  const L = login, up = L.mode === "up";
  return '<main class="welcome login">\n    <div class="w-mascot">'.concat(mascotSVG(L.busy ? "think" : "ok", 96), '</div>\n    <h1>Ders Özetim</h1>\n    <p class="w-lede">Programın, konu özetlerin, odak sayacın ve ders arkadaşların tek yerde. Telefonda, tablette ve dershanede aynı hesap.</p>\n    <div class="w-form">\n      <div class="seg" role="tablist" aria-label="Giriş ya da hesap açma"><button class="seg-b').concat(up ? "" : " on", '" data-act="l-mode" data-m="in" role="tab" aria-selected="').concat(!up, '">Giriş yap</button><button class="seg-b').concat(up ? " on" : "", '" data-act="l-mode" data-m="up" role="tab" aria-selected="').concat(up, '">Hesap aç</button></div>\n      <form id="l-form" novalidate>\n        <label class="f-h" for="l-e">E-posta</label>\n        <input id="l-e" class="input" type="email" autocomplete="email" inputmode="email" placeholder="ornek@gmail.com" value="').concat(esc(L.email), '" required>\n        <label class="f-h" for="l-p">Şifre</label>\n        <div class="pw"><input id="l-p" class="input" type="password" autocomplete="').concat(up ? "new-password" : "current-password", '" minlength="6" placeholder="').concat(up ? "En az 6 karakter" : "Şifren", '" required><button type="button" class="pw-eye" data-act="l-eye" aria-label="Şifreyi göster">').concat(I.eye || "Göster", "</button></div>\n        ").concat(up ? '<label class="f-h" for="l-p2">Şifre tekrar</label><input id="l-p2" class="input" type="password" autocomplete="new-password" minlength="6" required>' : "", '\n        <p class="err" role="alert">').concat(esc(L.err), "</p>\n        ").concat(L.info ? '<p class="ok-note" role="status">'.concat(esc(L.info), "</p>") : "", '\n        <button class="btn primary lg" type="submit"').concat(L.busy ? " disabled" : "", ">").concat(L.busy ? "Bekle…" : up ? "Hesap aç" : "Giriş yap", "</button>\n        ").concat(up ? "" : '<button class="link" type="button" data-act="l-forgot">Şifremi unuttum</button>', "\n      </form>\n      ").concat((window.DO_CONFIG || {}).googleLogin ? '<p class="or"><span>ya da</span></p>\n      <button class="btn lg google" data-act="l-google"'.concat(L.busy ? " disabled" : "", '><svg viewBox="0 0 24 24" aria-hidden="true" style="stroke:none"><path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8Z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.2-2.7l-3.5-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.2v2.8A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.2a11 11 0 0 0 0 9.9l3.6-2.8Z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.2 1.6l3.1-3.1A11 11 0 0 0 2.2 7.1l3.6 2.8C6.7 7.3 9.1 5.4 12 5.4Z"/></svg>Google ile devam et</button>\n      <p class="hint">Google ile girdiysen Profil sayfasından bir şifre belirle; diğer cihazlarda e-posta ve şifrenle girebilirsin.</p>') : '<p class="hint">Hesabın yoksa yukarıdan <strong>Hesap aç</strong>\'ı seç: e-posta ve şifre yeterli.</p>', '\n    </div>\n    <p class="w-credit">Esat Taha Polat tarafından geliştirildi. Açık kaynak, ücretsiz, reklamsız.</p>\n  </main>');
}
function bindLogin() {
  const f = $("#l-form");
  if (!f) return;
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#l-e").value.trim().toLowerCase(), pw = $("#l-p").value, up = login.mode === "up";
    login.email = email;
    login.info = "";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      login.err = "Geçerli bir e-posta yaz.";
      render();
      return;
    }
    if (pw.length < 6) {
      login.err = "Şifre en az 6 karakter olmalı.";
      render();
      return;
    }
    if (up && $("#l-p2").value !== pw) {
      login.err = "İki şifre aynı değil.";
      render();
      return;
    }
    login.busy = true;
    login.err = "";
    render();
    Cloud.inLogin = true;
    try {
      const r = up ? await Cloud.signUp(email, pw) : await Cloud.signIn(email, pw);
      login.busy = false;
      if (up && r && !r.session) {
        Cloud.inLogin = false;
        login.mode = "in";
        login.info = "Hesabın açıldı. E-postana gelen onay bağlantısına dokunduktan sonra buradan giriş yap.";
        render();
        return;
      }
      if (!Cloud.uid && r && r.user) Cloud.user = r.user;
      DB.d.profile.pwSet = true;
      await Cloud.afterLogin();
      Cloud.inLogin = false;
      render();
    } catch (err) {
      Cloud.inLogin = false;
      login.busy = false;
      login.err = AUTH_ERR(err);
      render();
    }
  });
}
function pwSheet(after) {
  const has = Cloud.hasPassword() && !Cloud.recovery;
  const box = openSheet(has ? "Şifreni değiştir" : "Şifre belirle", '<p class="hint">Bu şifreyle başka bir telefonda, tablette ya da bilgisayarda <strong>'.concat(esc(Cloud.user && Cloud.user.email || ""), "</strong> adresi ve şifrenle girebilirsin.</p>\n    ").concat(has ? '<label class="f-h" for="pw-0">Şu anki şifren</label><div class="pw"><input id="pw-0" class="input" type="password" autocomplete="current-password" autofocus><button type="button" class="pw-eye" data-act="pw-eye" aria-label="Şifreleri göster">'.concat(I.eye, "</button></div>") : "", '\n    <label class="f-h" for="pw-1">Yeni şifre</label><input id="pw-1" class="input" type="password" autocomplete="new-password" minlength="6" placeholder="En az 6 karakter"').concat(has ? "" : " autofocus", '>\n    <label class="f-h" for="pw-2">Şifre tekrar</label><input id="pw-2" class="input" type="password" autocomplete="new-password" minlength="6">\n    <p class="err" id="pw-e" role="alert"></p><div class="row"><button class="btn primary" id="pw-go">Kaydet</button></div>'));
  $("#pw-go", box).addEventListener("click", async () => {
    const a = $("#pw-1", box).value, b = $("#pw-2", box).value;
    if (a.length < 6) {
      $("#pw-e", box).textContent = "Şifre en az 6 karakter olmalı.";
      return;
    }
    if (a !== b) {
      $("#pw-e", box).textContent = "İki şifre aynı değil.";
      return;
    }
    $("#pw-go", box).disabled = true;
    if (has) {
      const cur = $("#pw-0", box).value;
      if (!cur) {
        $("#pw-go", box).disabled = false;
        $("#pw-e", box).textContent = "Şu anki şifreni yaz.";
        return;
      }
      try {
        await Cloud.checkPassword(cur);
      } catch (err) {
        $("#pw-go", box).disabled = false;
        $("#pw-e", box).textContent = "Şu anki şifren yanlış. Hatırlamıyorsan çıkış yapıp giriş ekranında Şifremi unuttum'a bas.";
        return;
      }
    }
    try {
      await Cloud.setPassword(a);
      Cloud.recovery = false;
      DB.d.profile.pwSet = true;
      DB.save();
      closeSheet();
      toast("Şifren kaydedildi. Diğer cihazlarda e-posta ve şifrenle girebilirsin.");
      if (after) after();
      else render();
    } catch (err) {
      $("#pw-go", box).disabled = false;
      $("#pw-e", box).textContent = /same|different/i.test(err.message || "") ? "Yeni şifre eskisinden farklı olmalı." : AUTH_ERR(err);
    }
  });
}
const KIND_ICON = {
  student: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19.5V6a2 2 0 0 1 2-2h12v13H6a2 2 0 0 0-2 2.5Zm0 0A2 2 0 0 0 6 22h12v-5"/><path d="M8 8h6"/></svg>',
  teacher: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v11H3z"/><path d="M7 20l2-4m8 4-2-4M7 9h6m-6 3h4"/></svg>'
};
const kindPick = (name, cur) => '<div class="kind-pick" role="radiogroup" aria-label="Hoca mısın, öğrenci misin?">\n  <label class="kind"><input type="radio" name="'.concat(name, '" value="student"').concat(cur === "student" ? " checked" : "", ">").concat(KIND_ICON.student, '<span><strong>Öğrenciyim</strong><span>Program, özet, odak ve odalar</span></span></label>\n  <label class="kind"><input type="radio" name="').concat(name, '" value="teacher"').concat(cur === "teacher" ? " checked" : "", ">").concat(KIND_ICON.teacher, "<span><strong>Hocayım</strong><span>Sınıf, öğrenci ve program yönetimi</span></span></label></div>");
const branchInput = (id, v) => '<input id="'.concat(id, '" class="input" maxlength="30" list="').concat(id, '-l" placeholder="Örn. Matematik" value="').concat(esc(v || ""), '" autocomplete="off"><datalist id="').concat(id, '-l">').concat(BRANCHES.map((b) => '<option value="'.concat(b, '">')).join(""), "</datalist>");
const gradeChips = (name, cur) => '<div class="chips-row wrap" role="radiogroup" aria-label="Sınıfın">'.concat(GRADES.map(([k, n]) => '<label class="fchip radio"><input type="radio" name="'.concat(name, '" value="').concat(k, '"').concat(cur === k ? " checked" : "", ">").concat(n, "</label>")).join(""), "</div>");
const trackChips = (name, cur) => '<div class="chips-row wrap" role="radiogroup" aria-label="Alanın">'.concat(Object.keys(TRACKS).map((k) => '<label class="fchip radio"><input type="radio" name="'.concat(name, '" value="').concat(k, '"').concat(cur === k ? " checked" : "", ">").concat(TRACKS[k].name, "</label>")).join(""), "</div>");
function bindKind(root, name) {
  const sync = () => {
    const k = (root.querySelector('input[name="'.concat(name, '"]:checked')) || {}).value || "";
    root.querySelectorAll("[data-for]").forEach((el) => {
      el.hidden = !k || !el.dataset.for.split(" ").includes(k);
    });
  };
  root.querySelectorAll('input[name="'.concat(name, '"]')).forEach((i) => i.addEventListener("change", sync));
  sync();
}
function welcomeView() {
  const gn = Cloud.uid ? Cloud.googleName() || Cloud.profile && Cloud.profile.name || "" : "";
  const code = Cloud.uid && !Cloud.school.length, staffNow = Cloud.anyStaff();
  return '<main class="welcome">\n    <div class="w-mascot">'.concat(mascotSVG("happy", 80), '</div>\n    <h1>Hoş geldin!</h1>\n    <p class="w-lede">Ben ').concat(MASCOT.name, '. Önce seni tanıyayım.</p>\n    <form id="w-form" class="w-form">\n      ').concat(kindPick("w-kind", staffNow ? "teacher" : ""), "\n      ").concat(staffNow ? '<p class="hint">Dershanede hoca olarak kayıtlısın. Öğrenciysen "Öğrenciyim"i seçip hocanın verdiği sınıf kodunu yaz.</p>' : "", '\n      <div data-for="student teacher" class="w-rest">\n      <label class="f-h" for="w-name">Adın ve soyadın</label>\n      <input id="w-name" class="input" maxlength="40" placeholder="Örn. Ayşe Yılmaz" autocomplete="name" value="').concat(esc(titleCase(gn)), '">\n      <div data-for="student">\n        <p class="f-h">Kaçıncı sınıftasın?</p>').concat(gradeChips("w-grade", ""), '\n        <p class="f-h">Alanın</p>').concat(trackChips("w-track", "SAY"), '\n        <label class="f-h" for="w-goal">Hedef bölümün <span class="f-opt">isteğe bağlı</span></label>\n        <input id="w-goal" class="input" maxlength="60" placeholder="Örn. Bilgisayar Mühendisliği" autocomplete="off">\n        ').concat(code || staffNow ? '<label class="f-h" for="w-code">'.concat(staffNow ? "Sınıf kodun" : 'Dershane kodun <span class="f-opt">varsa</span>', '</label>\n        <input id="w-code" class="input code-in" maxlength="10" placeholder="Hocanın verdiği 6 haneli kod" autocomplete="off" autocapitalize="characters">') : "", '\n      </div>\n      <div data-for="teacher">\n        <label class="f-h" for="w-branch">Branşın <span class="f-opt">isteğe bağlı</span></label>').concat(branchInput("w-branch", ""), "\n        ").concat(code ? '<label class="f-h" for="w-tcode">Hoca davet kodu <span class="f-opt">varsa</span></label>\n        <input id="w-tcode" class="input code-in" maxlength="10" placeholder="Dershane kurucusunun verdiği kod" autocomplete="off" autocapitalize="characters">\n        <p class="hint">Dershaneyi sen kuracaksan boş bırak; sonra Dershane sayfasından kurarsın.</p>' : "", "\n      </div>\n      ").concat(Cloud.uid && Cloud.needsPassword() ? '<label class="f-h" for="w-pw">Şifre belirle <span class="f-opt">isteğe bağlı</span></label>\n      <input id="w-pw" class="input" type="password" autocomplete="new-password" minlength="6" placeholder="En az 6 karakter">\n      <p class="hint">Diğer cihazlarda '.concat(esc(Cloud.user.email || ""), " ve bu şifreyle girersin.</p>") : "", '\n      <p class="err" id="w-e" role="alert"></p>\n      <button class="btn primary lg" type="submit">Başla</button>\n      </div>\n    </form>\n    <p class="w-credit">Esat Taha Polat tarafından geliştirildi. Açık kaynak, ücretsiz.</p>\n  </main>');
}
function renderNav(show) {
  const nav = $("#tabbar");
  document.body.classList.toggle("has-nav", !!show);
  if (!show) {
    nav.hidden = true;
    return;
  }
  nav.hidden = false;
  const active = route.page === "konu" ? "kitaplik" : route.page === "oda" ? "odalar" : /^(yanlis|not|tekrar)$/.test(route.page) ? "defter" : route.page === "kur" ? "profil" : route.page;
  const wide = matchMedia("(min-width: 900px)").matches;
  const tabs = tabsFor().filter((t) => (t.id !== "odalar" && t.id !== "dershane" || Cloud.enabled) && (!t.admin || Cloud.isAdmin));
  nav.innerHTML = '<a class="rail-brand" href="#/bugun" aria-label="Ders Özetim">'.concat(mascotSVG("ok", 34), "<span>Ders Özetim</span></a>") + tabs.map((t) => '<a class="tab'.concat(t.rail ? " rail-only" : "").concat(active === t.id || !wide && (isTeacher() ? t.id === "lab" && (active === "kitaplik" || active === "defter") : t.id === "defter" && (active === "kitaplik" || active === "lab")) ? " on" : "", '" href="#/').concat(t.id, '"').concat(active === t.id ? ' aria-current="page"' : "", ">").concat(t.icon, "<span>").concat(t.label, "</span>").concat(t.id === "odak" ? '<span class="tab-b" id="tab-odak-b" hidden></span>' : "", "</a>")).join("");
}
function infoForm(id) {
  const p = DB.d.profile, k = p.kind || (p.grade ? "student" : ""), staff = Cloud.anyStaff();
  return "".concat(staff ? "" : kindPick(id + "-k", k), '\n    <label class="f-h" for="').concat(id, '-n">Adın ve soyadın</label><input id="').concat(id, '-n" class="input" value="').concat(esc(p.name || ""), '" maxlength="40" autocomplete="name" placeholder="Örn. Ayşe Yılmaz">\n    <div data-for="student"><p class="f-h">Kaçıncı sınıftasın?</p>').concat(gradeChips(id + "-g", p.grade), '<p class="f-h">Alanın</p>').concat(trackChips(id + "-t", p.track), '</div>\n    <div data-for="teacher"><label class="f-h" for="').concat(id, '-b">Branşın <span class="f-opt">isteğe bağlı</span></label>').concat(branchInput(id + "-b", p.branch)).concat(staff ? '<p class="hint">Dershanede hoca olduğun için hesabın hoca hesabı.</p>' : "", '</div>\n    <p class="err" id="').concat(id, '-e" role="alert"></p><div class="row"><button class="btn primary" id="').concat(id, '-go">Kaydet</button></div>');
}
function bindInfoForm(box, id, done) {
  const staff = Cloud.anyStaff();
  const kindOf = () => staff ? "teacher" : ($('input[name="'.concat(id, '-k"]:checked'), box) || {}).value || "";
  const sync = () => {
    const k = kindOf();
    box.querySelectorAll("[data-for]").forEach((el) => {
      el.hidden = el.dataset.for !== k;
    });
  };
  box.querySelectorAll('input[name="'.concat(id, '-k"]')).forEach((i) => i.addEventListener("change", sync));
  sync();
  $("#".concat(id, "-go"), box).addEventListener("click", () => {
    const e = $("#".concat(id, "-e"), box), k = kindOf(), p = DB.d.profile;
    const n = titleCase($("#".concat(id, "-n"), box).value.trim().replace(/\s+/g, " ")).slice(0, 40);
    if (!k) {
      e.textContent = "Hoca mı öğrenci mi olduğunu seç.";
      return;
    }
    if (!fullNameOk(n)) {
      e.textContent = "Adını ve soyadını yaz.";
      return;
    }
    const gr = $('input[name="'.concat(id, '-g"]:checked'), box);
    if (k === "student" && !gr) {
      e.textContent = "Kaçıncı sınıfta olduğunu seç.";
      return;
    }
    p.name = n;
    p.kind = k;
    if (k === "teacher") {
      p.grade = "";
      p.branch = titleCase($("#".concat(id, "-b"), box).value.trim()).slice(0, 30);
    } else {
      p.grade = gr.value;
      const t = $('input[name="'.concat(id, '-t"]:checked'), box);
      if (t) p.track = t.value;
    }
    ui.plan = null;
    DB.save();
    closeSheet();
    render();
    if (done) done();
  });
}
const profileDone = (p) => fullNameOk(p.name) && (p.kind === "teacher" || (p.kind === "student" || !p.kind) && p.grade);
function profileNudge() {
  const p = DB.d.profile;
  if (!Cloud.uid || ui.nudged || sheetEl || route.page === "oda" || profileDone(p)) return;
  ui.nudged = true;
  setTimeout(() => {
    if (sheetEl || route.page === "oda") return;
    const box = openSheet("Profilini tamamla", '<p class="hint">Dershanedeki hocaların, öğrencilerin ve oda arkadaşların seni tanısın.</p>'.concat(infoForm("pn")), { sticky: true });
    bindInfoForm(box, "pn", () => toast("Profilin güncellendi"));
  }, 700);
}
const VIEWS = {};
function render() {
  const app = $("#app");
  document.body.classList.toggle("in-room", route.page === "oda");
  if (Cloud.enabled && Cloud.booting) {
    app.innerHTML = '<div class="boot">'.concat(mascotSVG("ok", 72), '<p class="hint">Yükleniyor…</p></div>');
    renderNav(false);
    return;
  }
  if (!window.__DO_READY) {
    window.__DO_READY = true;
    window.__diag && __diag.mark("ready");
  }
  if (Cloud.enabled && !Cloud.uid) {
    app.innerHTML = loginView();
    renderNav(false);
    bindLogin();
    return;
  }
  if (!DB.d.onboarded) {
    app.innerHTML = welcomeView();
    renderNav(false);
    bindWelcome();
    syncRadios(app);
    return;
  }
  if (route.page === "oda" && Room.id === route.arg && Room.room && $("#room")) {
    Room.paintGrid();
    Room.paintCtl();
    return;
  }
  Object.assign(VIEWS, { bugun: todayView, program: programView, kitaplik: libraryView, konu: topicView, odak: focusView, profil: profileView, asistan: assistantView });
  const v = VIEWS[route.page] || todayView;
  app.innerHTML = v();
  renderNav(route.page !== "oda");
  if (v.after) v.after();
  if (typeof roomMiniPaint === "function") roomMiniPaint();
  syncRadios(app);
  profileNudge();
  checkBadges();
  pmPaint();
  swPaint();
  if (route.page === "bugun" && DB.d.profile.city && (!WX.data || Date.now() - WX.data.at > 30 * 60 * 1e3) && !WX.loading) {
    loadWeather().then(() => {
      if (route.page === "bugun" && !sheetEl) render();
    });
  }
}
function bindWelcome() {
  const f = $("#w-form");
  const sync = () => {
    const k = ($('input[name="w-kind"]:checked') || {}).value || "";
    f.querySelectorAll("[data-for]").forEach((el) => {
      el.hidden = !k || !el.dataset.for.split(" ").includes(k);
    });
    if (k && !sync.done) {
      sync.done = true;
      setTimeout(() => {
        const n = $("#w-name");
        if (n && !n.value) n.focus();
      }, 50);
    }
  };
  f.querySelectorAll('input[name="w-kind"]').forEach((i) => i.addEventListener("change", sync));
  sync();
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = (t) => {
      const el = $("#w-e");
      if (el) el.textContent = t;
      else toast(t);
    };
    const kind = ($('input[name="w-kind"]:checked') || {}).value;
    if (!kind) {
      err("Hoca mı öğrenci mi olduğunu seç.");
      return;
    }
    const teacher = kind === "teacher";
    const name = titleCase($("#w-name").value.trim().replace(/\s+/g, " ")).slice(0, 40);
    if (!fullNameOk(name)) {
      err("Adını ve soyadını yaz.");
      $("#w-name").focus();
      return;
    }
    const gr = $('input[name="w-grade"]:checked');
    if (!teacher && !gr) {
      err("Kaçıncı sınıfta olduğunu seç.");
      return;
    }
    const val = (sel) => {
      const el = $(sel);
      return el ? el.value.trim() : "";
    };
    const grade = gr ? gr.value : "", track = val('input[name="w-track"]:checked') || "SAY", goal = val("#w-goal"), branch = val("#w-branch");
    const pw = $("#w-pw") ? $("#w-pw").value : "";
    if (pw) {
      if (pw.length < 6) {
        err("Şifre en az 6 karakter olmalı ya da boş bırak.");
        return;
      }
      try {
        await Cloud.setPassword(pw);
        DB.d.profile.pwSet = true;
      } catch (e2) {
        err(AUTH_ERR(e2));
        return;
      }
    }
    const code = val(teacher ? "#w-tcode" : "#w-code");
    if (!teacher && Cloud.anyStaff() && !code) {
      err("Dershanede hoca olarak kayıtlısın. Öğrenciysen hocanın verdiği sınıf kodunu yaz ya da kurucudan seni öğrenci yapmasını iste.");
      return;
    }
    if (code) {
      try {
        await Cloud.joinCode(code);
      } catch (e2) {
        err((e2.message || "Kod geçerli değil.") + " Kodu boş bırakıp sonra Dershane sayfasından da katılabilirsin.");
        return;
      }
    }
    const p = DB.d.profile;
    p.name = name;
    p.kind = Cloud.anyStaff() ? "teacher" : kind;
    if (teacher) {
      p.grade = "";
      p.branch = titleCase(branch).slice(0, 30);
    } else {
      p.grade = grade;
      p.track = track;
      if (goal) p.goal = { school: "", dept: titleCase(goal).slice(0, 60) };
    }
    DB.d.onboarded = true;
    DB.save();
    go(teacher && Cloud.school.length ? "#/dershane/" + Cloud.school[0].institution_id : "#/bugun");
  });
}
function applyTheme() {
  const th = DB.d.profile.theme || "auto", root = document.documentElement;
  if (th !== "auto") root.dataset.theme = th;
  else if (ENV !== "artifact" || root.dataset.doTheme) delete root.dataset.theme;
  if (th !== "auto") root.dataset.doTheme = "1";
  else delete root.dataset.doTheme;
  const pal = paletteOf(DB.d.profile.palette);
  if (pal.id === "lavanta") delete root.dataset.palette;
  else root.dataset.palette = pal.id;
  const dark = root.dataset.theme === "dark" || root.dataset.theme !== "light" && matchMedia("(prefers-color-scheme: dark)").matches;
  const m = $('meta[name="theme-color"]');
  if (m) m.content = dark ? pal.dark : pal.theme;
}
function taskSheet(wk, t) {
  const isNew = !t;
  t = t || { day: route.page === "program" ? ui.day : todayIdx(), text: "", subject: "", topic: "" };
  const mon = fromKey(wk);
  const topicOpts = (s) => {
    const list = s ? topicsOfSubject(s) : [];
    return '<option value="">'.concat(s ? "Konu yok ya da otomatik bul" : "Önce ders seç", "</option>") + list.map((n) => "<option".concat(n === t.topic ? " selected" : "", ">").concat(esc(n), "</option>")).join("");
  };
  const box = openSheet(isNew ? "Görev ekle" : "Görevi düzenle", '\n    <label class="f-h" for="ts-t">Görev</label>\n    <input id="ts-t" class="input" value="'.concat(esc(t.label || t.text), '" maxlength="140" placeholder="Örn. Mutlak değer 20 soru çöz" autocomplete="off" autofocus>\n    <label class="f-h" for="ts-d">Gün</label>\n    <select id="ts-d">').concat(DAYS.map((d, i) => '<option value="'.concat(i, '"').concat(i === t.day ? " selected" : "", ">").concat(d, ", ").concat(fmtDay(addDays(mon, i)), "</option>")).join(""), '</select>\n    <div class="two">\n      <div><label class="f-h" for="ts-s">Ders</label><select id="ts-s"><option value="">Belirtilmemiş</option>').concat(SUBJ_ORDER.map((s) => "<option".concat(s === t.subject ? " selected" : "", ">").concat(esc(s), "</option>")).join(""), '</select></div>\n      <div><label class="f-h" for="ts-k">Konu</label><select id="ts-k">').concat(topicOpts(t.subject), '</select></div>\n    </div>\n    <p class="err" id="ts-e" role="alert"></p>\n    <div class="row"><button class="btn primary" id="ts-save">').concat(isNew ? "Ekle" : "Kaydet", "</button>").concat(isNew ? "" : '<button class="btn danger" id="ts-del">Sil</button>', "</div>"));
  $("#ts-s", box).addEventListener("change", (e) => {
    t.topic = "";
    $("#ts-k", box).innerHTML = topicOpts(e.target.value);
  });
  $("#ts-save", box).addEventListener("click", () => {
    const text = $("#ts-t", box).value.trim();
    if (!text) {
      $("#ts-e", box).textContent = "Görevi yaz.";
      return;
    }
    const g = guessTask(text);
    let n = { text, label: text, day: Number($("#ts-d", box).value), subject: $("#ts-s", box).value || g.subject, topic: $("#ts-k", box).value, type: g.type };
    if (!n.topic) n = libraryMatch([n], libIndex()).tasks[0];
    const w = DB.ensureWeek(wk);
    if (isNew) w.tasks.push(Object.assign({ id: "m" + uid(), done: false, src: "el" }, n));
    else Object.assign(DB.task(wk, t.id), n);
    DB.save();
    closeSheet();
    ui.day = n.day;
    render();
    toast(isNew ? "Görev eklendi" : "Görev kaydedildi");
  });
  const del = $("#ts-del", box);
  if (del) del.addEventListener("click", () => {
    if (del.dataset.armed !== "1") {
      del.dataset.armed = "1";
      del.textContent = "Silmek için tekrar bas";
      return;
    }
    const w = DB.week(wk);
    const old = DB.task(wk, t.id);
    if (old && old.done) bump(old.doneOn || dayKey(), "tasks", -1);
    w.tasks = w.tasks.filter((x) => x.id !== t.id);
    DB.save();
    closeSheet();
    render();
    toast("Görev silindi");
  });
}
async function onExcelFiles(files) {
  const found = [], bad = [];
  for (const f of files) {
    try {
      const sheets = readXlsx(await f.arrayBuffer());
      let p = null;
      for (const rows of sheets) {
        p = parseProgram(rows);
        if (p) break;
      }
      if (!p) {
        bad.push(f.name);
        continue;
      }
      if (!p.label) {
        const m = f.name.match(/(\d+)[\s_.-]*hafta/i);
        if (m) p.label = m[1] + ". Hafta";
      }
      found.push({ name: f.name, p, wk: p.monday || ui.week });
    } catch (e) {
      bad.push(f.name);
    }
  }
  if (!found.length) {
    toast(bad.length ? "Dosyada gün adlarını (Pazartesi, Salı…) bulamadım. Haftalık program içeren .xlsx dosyası seç." : "Dosya seçilmedi.");
    return;
  }
  const box = openSheet(found.length > 1 ? found.length + " program bulundu" : "Program bulundu", "\n    ".concat(bad.length ? '<p class="note-err">Okunamayan dosya: '.concat(bad.map(esc).join(", "), "</p>") : "", '\n    <div id="im-list">').concat(found.map((x, i) => '<div class="im" data-i="'.concat(i, '">\n      <p class="im-n">').concat(esc(x.name), '</p>\n      <p class="hint">').concat(esc(x.p.label || "Haftalık program"), ": ").concat(x.p.tasks.length, ' görev</p>\n      <div class="weeknav small"><button class="icon-btn" data-step="-1" aria-label="Önceki hafta">').concat(I.back, '</button><p class="wk-r im-r">').concat(weekRange(x.wk), '</p><button class="icon-btn" data-step="1" aria-label="Sonraki hafta">').concat(I.next, '</button></div>\n      <p class="hint im-ex"').concat(DB.week(x.wk) && DB.week(x.wk).tasks.some((t) => t.src === "excel") ? "" : " hidden", ">Bu haftanın Excel görevleri yenisiyle değişecek; kendi eklediğin görevler kalır.</p>\n    </div>")).join(""), '</div>\n    <p class="hint">').concat(found.some((x) => x.p.monday) ? "Tarih dosyadan okundu; yanlışsa oklarla düzelt." : "Dosyada tarih bulamadım; programın ait olduğu haftayı seç.", '</p>\n    <div class="row"><button class="btn primary" id="im-go">İçe aktar</button></div>'));
  $("#im-list", box).addEventListener("click", (e) => {
    const b = e.target.closest("[data-step]");
    if (!b) return;
    const el = b.closest(".im"), x = found[Number(el.dataset.i)];
    x.wk = wkKey(addDays(fromKey(x.wk), 7 * Number(b.dataset.step)));
    el.querySelector(".im-r").textContent = weekRange(x.wk);
    el.querySelector(".im-ex").hidden = !(DB.week(x.wk) && DB.week(x.wk).tasks.some((t) => t.src === "excel"));
  });
  $("#im-go", box).addEventListener("click", () => {
    let total = 0, ready = 0;
    found.forEach((x) => {
      const w = DB.ensureWeek(x.wk);
      const prev = {};
      w.tasks.filter((t) => t.src === "excel" && t.done).forEach((t) => {
        prev[t.day + "|" + t.text] = t.doneOn || dayKey();
      });
      const keep = w.tasks.filter((t) => t.src !== "excel");
      let tasks = x.p.tasks.map((t, i) => {
        const g = guessTask(t.text);
        return { id: "x" + i + uid(), day: t.day, text: t.text, label: sentence(t.text), type: g.type, subject: g.subject, topic: "", done: !!prev[t.day + "|" + t.text], doneOn: prev[t.day + "|" + t.text], src: "excel" };
      });
      tasks = libraryMatch(tasks, libIndex()).tasks;
      w.tasks = tasks.concat(keep);
      w.label = x.p.label || w.label;
      w.fileName = x.name;
      w.importedAt = Date.now();
      DB.d.stats.imports = (DB.d.stats.imports || 0) + 1;
      total += tasks.length;
      ready += tasks.filter((t) => t.topic && sumFor(topicSlug(t.subject, t.topic))).length;
    });
    DB.save();
    closeSheet();
    ui.week = found[0].wk;
    ui.day = ui.week === thisWeek() ? todayIdx() : 0;
    go("#/program");
    toast("".concat(total, " görev eklendi; ").concat(ready, " görevin konu özeti hazır."));
  });
}
function citySheet() {
  const box = openSheet("Şehrin", '\n    <p class="hint">Bugün sayfasında havaya göre küçük bir not görünür. Konumun kaydedilmez, sadece seçtiğin şehrin koordinatları bu cihazda tutulur.</p>\n    <div class="row nowrap"><input id="cs-q" class="input" placeholder="Şehir ya da ilçe adı" autocomplete="off" autofocus><button class="btn" id="cs-go">Ara</button></div>\n    <ul class="menu" id="cs-r"></ul>\n    '.concat(DB.d.profile.city ? '<button class="link danger" id="cs-x">Şehri kaldır</button>' : ""));
  let results = [];
  const run = async () => {
    const q = $("#cs-q", box).value.trim();
    if (q.length < 2) return;
    $("#cs-r", box).innerHTML = '<li><p class="hint">Aranıyor…</p></li>';
    try {
      results = await searchCity(q);
    } catch (e) {
      results = null;
    }
    $("#cs-r", box).innerHTML = results === null ? '<li><p class="hint">Bağlantı kurulamadı. İnternetini kontrol et.</p></li>' : results.length ? results.map((r, i) => '<li><button data-i="'.concat(i, '"><span>').concat(esc(r.name), '</span><span class="mv">').concat(esc(r.region), "</span></button></li>")).join("") : '<li><p class="hint">Sonuç yok. Farklı yaz.</p></li>';
  };
  $("#cs-go", box).addEventListener("click", run);
  $("#cs-q", box).addEventListener("keydown", (e) => {
    if (e.key === "Enter") run();
  });
  $("#cs-r", box).addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]");
    if (!b) return;
    const r = results[Number(b.dataset.i)];
    DB.d.profile.city = { name: r.name, lat: r.lat, lon: r.lon };
    DB.save();
    WX.data = null;
    closeSheet();
    render();
    loadWeather(true).then(() => render());
  });
  const x = $("#cs-x", box);
  if (x) x.addEventListener("click", () => {
    DB.d.profile.city = null;
    DB.save();
    closeSheet();
    render();
  });
}
function setBusy(on, text) {
  ui.busy = on;
  ui.busyText = text || "";
  const el = $("#ai-prog");
  if (el && on) el.textContent = ui.busyText;
}
function progressCb(p) {
  const t = p.text ? p.text.replace(/Fetching param cache/i, "Model indiriliyor").replace(/Loading model from cache/i, "Model yükleniyor") : "";
  setBusy(true, t || "Model hazırlanıyor…");
  const m = $("#ai-meter");
  if (m && typeof p.progress === "number") m.style.width = Math.round(p.progress * 100) + "%";
}
async function aiRun(prompt, onDone, opts) {
  opts = opts || {};
  if (!AI.ready()) {
    toast(DB.d.ai.engine === "bulut" ? "Yapay zekâyı kullanmak için hesabına giriş yap." : "Önce yapay zekâyı seç: Asistan > Ayarlar.");
    if (DB.d.ai.engine !== "bulut") go("#/asistan/ayar");
    return;
  }
  setBusy(true, DB.d.ai.engine === "webllm" && !AI.loadedModel ? "Model hazırlanıyor; ilk seferde indirme sürebilir…" : "Yapay zekâ düşünüyor…");
  render();
  try {
    const txt = await AI.chat([{ role: "user", content: prompt }], {
      json: true,
      think: !!opts.think,
      maxTokens: opts.maxTokens || 3500,
      onProgress: progressCb,
      onText: (s, th) => setBusy(true, s.length ? "Yazıyor… (" + s.length + " karakter)" : th ? "Düşünüyor…" : "Yapay zekâ düşünüyor…")
    });
    setBusy(false);
    ui.busyFor = "";
    const j = parseJSONLoose(txt);
    onDone(j, txt);
  } catch (e) {
    setBusy(false);
    ui.busyFor = "";
    render();
    toast(aiErrText(e));
  }
}
function extSheet(title, prompt, onImport) {
  const box = openSheet(title, '\n    <ol class="steps"><li>Aşağıdaki metni kopyala.</li><li>ChatGPT, Gemini, Copilot ya da Claude gibi bir yapay zekânın ücretsiz sürümüne yapıştır.</li><li>Gelen yanıtın tamamını kopyalayıp en alttaki kutuya yapıştır.</li></ol>\n    <textarea id="ex-p" rows="6" readonly>'.concat(esc(prompt), '</textarea>\n    <div class="row"><button class="btn" id="ex-copy">Metni kopyala</button></div>\n    <label class="f-h" for="ex-a">Yapay zekânın yanıtı</label>\n    <textarea id="ex-a" rows="5" placeholder="Yanıtı buraya yapıştır"></textarea>\n    <p class="err" id="ex-e" role="alert"></p>\n    <div class="row"><button class="btn primary" id="ex-go">İçe aktar</button></div>'));
  $("#ex-copy", box).addEventListener("click", async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(prompt);
      ok = true;
    } catch (e) {
    }
    if (!ok) {
      const ta = $("#ex-p", box);
      ta.focus();
      ta.select();
      try {
        ok = document.execCommand("copy");
      } catch (e) {
      }
    }
    toast(ok ? "Kopyalandı" : "Metin seçildi; kopyala.");
  });
  $("#ex-go", box).addEventListener("click", () => {
    const j = parseJSONLoose($("#ex-a", box).value);
    if (!j || !onImport(j)) {
      $("#ex-e", box).textContent = "Yanıtta beklenen yapıyı bulamadım. Yanıtın tamamını, süslü parantezlerle birlikte yapıştır.";
      return;
    }
    closeSheet();
  });
}
function acceptPlan(list) {
  const idx = libIndex();
  ui.planDraft = list.map((t) => {
    let x = { day: t.day, text: t.text, subject: t.subject || guessTask(t.text).subject, topic: "" };
    if (t.topic) {
      const hit = Object.values(idx).find((i) => normName(i.name) === normName(t.topic) && (!x.subject || i.subject === x.subject));
      if (hit) {
        x.topic = hit.name;
        x.subject = hit.subject;
      }
    }
    if (!x.topic) x = libraryMatch([x], idx).tasks[0];
    return x;
  });
  render();
  setTimeout(() => {
    const d = $(".draft");
    if (d) d.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 50);
}
function saveSummary(subject, name, sum, source) {
  const slug = topicSlug(subject, name);
  DB.d.userSums[slug] = { slug, subject, name, source, createdAt: Date.now(), summary: sum };
  DB.save();
  return slug;
}
function backup() {
  const blob = new Blob([JSON.stringify(DB.d, null, 1)], { type: "application/json" });
  saveBlob(blob, "dersozetim-yedek-" + dayKey() + ".json");
  toast("Yedek indirildi");
}
function restore(file) {
  const r = new FileReader();
  r.onload = () => {
    let d = null;
    try {
      d = JSON.parse(r.result);
    } catch (e) {
    }
    if (!d || d.v !== 4 || typeof d.weeks !== "object") {
      toast("Bu dosya bir Ders Özetim yedeği değil.");
      return;
    }
    const box = openSheet("Yedeği geri yükle", "<p>Bu cihazdaki verilerin yerine yedekteki veriler gelecek: ".concat(Object.keys(d.weeks).length, " hafta, ").concat(Object.keys(d.userSums || {}).length, ' kendi özetin.</p><div class="row"><button class="btn primary" id="rs-go">Geri yükle</button></div>'));
    $("#rs-go", box).addEventListener("click", () => {
      localStorage.setItem(DB.KEY, JSON.stringify(d));
      DB.load();
      DB.save();
      applyTheme();
      closeSheet();
      go("#/bugun");
      toast("Yedek geri yüklendi");
    });
  };
  r.readAsText(file);
}
const ACT = {
  "sheet-close": () => closeSheet(),
  back: () => {
    if (history.length > 1) history.back();
    else go("#/kitaplik");
  },
  add: () => taskSheet(route.page === "program" ? ui.week : thisWeek(), null),
  edit: (el) => {
    const [wk, id] = el.dataset.k.split("|");
    const t = DB.task(wk, id);
    if (!t) return;
    if (t.src === "dershane") {
      openSheet("Dershane görevi", '<p class="task-t big">'.concat(esc(t.label || sentence(t.text)), '</p><p class="hint">').concat(esc(t.school || "Dershanen"), ' tarafından gönderildi; değiştirilemez. Bitirdiğinde işaretle, hocan ilerlemeni görür.</p>\n        <div class="row">').concat(t.topic && sumFor(topicSlug(t.subject, t.topic)) ? '<a class="btn primary" href="#/konu/'.concat(encodeURIComponent(topicSlug(t.subject, t.topic)), '">Konu özetini aç</a>') : "", '<button class="btn" data-act="sheet-close">Kapat</button></div>'));
      return;
    }
    taskSheet(wk, t);
  },
  upload: () => {
    $("#file-xlsx").click();
  },
  day: (el) => {
    ui.day = Number(el.dataset.i);
    render();
  },
  wk: (el) => {
    ui.week = wkKey(addDays(fromKey(ui.week), 7 * Number(el.dataset.d)));
    ui.day = ui.week === thisWeek() ? todayIdx() : 0;
    render();
  },
  "wk-now": () => {
    ui.week = thisWeek();
    ui.day = todayIdx();
    render();
  },
  "week-pdf": () => {
    const w = DB.week(ui.week);
    if (!w || !w.tasks.length) return;
    const parts = [programDocHTML(ui.week, w)], seen = /* @__PURE__ */ new Set();
    w.tasks.forEach((t) => {
      if (!t.topic) return;
      const sl = topicSlug(t.subject, t.topic);
      const sd = sumFor(sl);
      if (sd && !seen.has(sl)) {
        seen.add(sl);
        parts.push(topicDocHTML({ slug: sl, subject: sd.subject, name: sd.name, tasks: w.tasks.filter((x) => x.topic && topicSlug(x.subject, x.topic) === sl) }, sd, true));
      }
    });
    exportPdf(parts, safeName((DB.d.profile.name ? DB.d.profile.name + " - " : "") + (w.label || "Program") + " " + weekRange(ui.week)) + ".pdf", seen.size + " konu özetiyle birlikte PDF indirildi");
  },
  "week-clear": (el) => {
    if (el.dataset.armed !== "1") {
      el.dataset.armed = "1";
      el.textContent = "Emin misin? Tekrar bas";
      setTimeout(() => {
        if (document.contains(el)) {
          el.dataset.armed = "";
          el.textContent = "Haftayı temizle";
        }
      }, 4e3);
      return;
    }
    delete DB.d.weeks[ui.week];
    DB.save();
    render();
    toast("Hafta temizlendi");
  },
  "lib-s": (el) => {
    ui.libS = el.dataset.s;
    render();
  },
  "topic-pdf": () => {
    const sd = sumFor(route.arg);
    if (!sd) return;
    const w = DB.week(thisWeek());
    exportPdf([topicDocHTML({ slug: route.arg, subject: sd.subject, name: sd.name, tasks: w ? w.tasks.filter((t) => t.topic && topicSlug(t.subject, t.topic) === route.arg) : [] }, sd, true)], safeName((sd.subject ? sd.subject + " - " : "") + sd.name) + ".pdf");
  },
  "topic-del": (el) => {
    if (el.dataset.armed !== "1") {
      el.dataset.armed = "1";
      el.textContent = "Tekrar bas";
      return;
    }
    delete DB.d.userSums[route.arg];
    DB.save();
    go("#/kitaplik");
    toast("Özet silindi");
  },
  "pm-go": () => {
    T().running ? pmPause() : pmStart();
  },
  "f-mode": (el) => {
    ui.fmode = el.dataset.m;
    render();
  },
  "sw-go": () => {
    const w = SW();
    if (w.running) {
      w.acc += Date.now() - w.startAt;
      w.running = false;
    } else {
      w.running = true;
      w.startAt = Date.now();
    }
    DB.save(true);
    swLoop();
    render();
  },
  "sw-save": () => swSave(),
  "sw-reset": (el) => {
    if (el.dataset.armed !== "1") {
      el.dataset.armed = "1";
      el.textContent = "Kaydetmeden sıfırla?";
      return;
    }
    const w = SW();
    w.running = false;
    w.acc = 0;
    w.startAt = 0;
    DB.save(true);
    swLoop();
    render();
  },
  "l-google": async () => {
    login.busy = true;
    render();
    try {
      await Cloud.google();
    } catch (e) {
      login.busy = false;
      login.err = AUTH_ERR(e);
      render();
    }
  },
  "l-mode": (el) => {
    login.mode = el.dataset.m;
    login.err = "";
    login.info = "";
    const e = $("#l-e");
    if (e) login.email = e.value.trim();
    render();
  },
  "l-eye": () => {
    $$("#l-p, #l-p2").forEach((i) => {
      i.type = i.type === "password" ? "text" : "password";
    });
  },
  "l-forgot": async () => {
    const e = $("#l-e"), email = e ? e.value.trim().toLowerCase() : login.email;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      login.err = "Önce e-posta adresini yaz, sonra Şifremi unuttum'a bas.";
      render();
      return;
    }
    login.email = email;
    try {
      await Cloud.resetPassword(email);
      login.err = "";
      login.info = "Şifre yenileme bağlantısı e-postana gönderildi. Bağlantıya dokununca yeni şifreni belirleyebileceksin.";
    } catch (err) {
      login.err = AUTH_ERR(err);
    }
    render();
  },
  "pw-set": () => pwSheet(),
  "pw-eye": () => {
    $$("#pw-0, #pw-1, #pw-2").forEach((i) => {
      i.type = i.type === "password" ? "text" : "password";
    });
  },
  "sign-out": async (el) => {
    if (el.dataset.armed !== "1") {
      el.dataset.armed = "1";
      el.querySelector("span").textContent = "Çıkış yapılsın mı? Tekrar bas";
      return;
    }
    if (Room.id) await Room.leave();
    await Cloud.signOut();
    login.mode = "in";
    go("#/bugun");
    render();
  },
  "acct-del": (el) => {
    const box = openSheet("Hesabını sil", '<p>Hesabın, programın, özetlerin, dershane üyeliklerin ve yazdığın mesajlar kalıcı olarak silinir. Bu geri alınamaz.</p>\n      <p class="hint">Emin olmak için aşağıya <strong>SİL</strong> yaz.</p><input id="ad-t" class="input" autocomplete="off">\n      <div class="row"><button class="btn danger" id="ad-go">Hesabımı sil</button></div>');
    $("#ad-go", box).addEventListener("click", async () => {
      if ($("#ad-t", box).value.trim().toLocaleUpperCase("tr") !== "SİL") {
        toast("Onay için SİL yaz.");
        return;
      }
      try {
        if (Room.id) await Room.leave();
        await Cloud.deleteAccount();
        closeSheet();
        login.mode = "in";
        go("#/bugun");
        render();
        toast("Hesabın silindi.");
      } catch (e) {
        toast("Silinemedi: " + e.message);
      }
    });
  },
  "pm-reset": () => {
    pmSetMode(T().mode);
    pmLoop();
    render();
  },
  "pm-mode": (el) => {
    if (T().running) return;
    pmSetMode(el.dataset.m);
    render();
  },
  "focus-set": () => {
    const f = DB.d.focus;
    const box = openSheet("Süreler", '<div class="three">\n      <div><label class="f-h" for="fs-f">Odak (dk)</label><input id="fs-f" class="input" type="number" min="5" max="120" value="'.concat(f.focus, '"></div>\n      <div><label class="f-h" for="fs-b">Kısa mola</label><input id="fs-b" class="input" type="number" min="1" max="30" value="').concat(f.brk, '"></div>\n      <div><label class="f-h" for="fs-l">Uzun mola</label><input id="fs-l" class="input" type="number" min="5" max="60" value="').concat(f.long, '"></div></div>\n      <label class="f-h" for="fs-g">Günlük odak hedefi (dakika)</label><input id="fs-g" class="input" type="number" min="15" max="720" step="15" value="').concat(DB.d.profile.dailyFocus || 120, '">\n      <p class="hint">Her 4 odak turundan sonra uzun mola gelir. 50/10 da sık kullanılan bir düzendir.</p>\n      <div class="row"><button class="btn primary" id="fs-go">Kaydet</button><button class="btn" id="fs-50">50 / 10 / 20</button></div>'));
    const clamp = (v, a, b) => Math.max(a, Math.min(b, Math.round(Number(v) || a)));
    const saveF = (a, b, c) => {
      DB.d.profile.dailyFocus = clamp($("#fs-g", box).value, 15, 720);
      DB.d.focus = { focus: clamp(a, 5, 120), brk: clamp(b, 1, 30), long: clamp(c, 5, 60) };
      if (!T().running) pmSetMode(T().mode);
      DB.save();
      closeSheet();
      render();
    };
    $("#fs-go", box).addEventListener("click", () => saveF($("#fs-f", box).value, $("#fs-b", box).value, $("#fs-l", box).value));
    $("#fs-50", box).addEventListener("click", () => saveF(50, 10, 20));
  },
  city: () => citySheet(),
  badges: () => {
    const got = DB.d.stats.badges || {};
    openSheet("Rozetlerin", '<p class="hint">'.concat(Object.keys(got).length, "/").concat(BADGES.length, ' rozet kazandın.</p><ul class="badges">').concat(BADGES.map((b) => {
      const d = got[b.id];
      return '<li class="badge'.concat(d ? " on" : "", '"><span class="bd-ic" aria-hidden="true">').concat(I.medal, '</span><span class="bd-n">').concat(esc(b.name), '</span><span class="bd-h">').concat(d ? fmtDay(fromKey(d)) : esc(b.how), "</span></li>");
    }).join(""), "</ul>"));
  },
  "p-info": () => {
    const box = openSheet(isTeacher() ? "Ad ve branş" : "Ad, sınıf ve alan", infoForm("pi"));
    bindInfoForm(box, "pi");
  },
  "p-date": () => {
    const box = openSheet("YKS tarihi", '<p class="hint">ÖSYM 2027 YKS tarihini henüz açıklamadı; 19 Haziran 2027 tahmini bir tarihtir. Açıklanınca buradan güncelle.</p>\n      <input id="pd-d" class="input" type="date" value="'.concat(yksDate(), '"><div class="row"><button class="btn primary" id="pd-go">Kaydet</button>').concat(DB.d.profile.yks ? '<button class="btn" id="pd-x">Tahmine dön</button>' : "", "</div>"));
    $("#pd-go", box).addEventListener("click", () => {
      const v = $("#pd-d", box).value;
      if (v) {
        DB.d.profile.yks = v;
        DB.save();
        closeSheet();
        render();
      }
    });
    const x = $("#pd-x", box);
    if (x) x.addEventListener("click", () => {
      DB.d.profile.yks = "";
      DB.save();
      closeSheet();
      render();
    });
  },
  "p-theme": () => {
    const cur = DB.d.profile.theme || "auto";
    const box = openSheet("Görünüm", '<div class="opts">'.concat([["auto", "Sistemle aynı"], ["light", "Açık"], ["dark", "Koyu"]].map(([v, n]) => '<label class="opt'.concat(cur === v ? " on" : "", '"><input type="radio" name="th" value="').concat(v, '"').concat(cur === v ? " checked" : "", "><span><strong>").concat(n, "</strong></span></label>")).join(""), "</div>"));
    box.addEventListener("change", (e) => {
      if (e.target.name === "th") {
        DB.d.profile.theme = e.target.value;
        DB.save();
        applyTheme();
        closeSheet();
        render();
      }
    });
  },
  "p-goal": () => {
    const g = DB.d.profile.goal || {};
    const box = openSheet("Hedefin", '<p class="hint">Hedefini yazınca Bugün sayfasında görünür ve sana göre motive edici notlar çıkar.</p>\n      <label class="f-h" for="pg-s">Üniversite (isteğe bağlı)</label><input id="pg-s" class="input" maxlength="60" value="'.concat(esc(g.school || ""), '" placeholder="Örn. Ankara Üniversitesi" autocomplete="off">\n      <label class="f-h" for="pg-d">Bölüm</label><input id="pg-d" class="input" maxlength="60" value="').concat(esc(g.dept || ""), '" placeholder="Örn. Tıp" autocomplete="off" autofocus>\n      <div class="row"><button class="btn primary" id="pg-go">Kaydet</button>').concat(g.dept ? '<button class="btn" id="pg-x">Kaldır</button>' : "", "</div>"));
    $("#pg-go", box).addEventListener("click", () => {
      DB.d.profile.goal = { school: titleCase($("#pg-s", box).value.trim()).slice(0, 60), dept: titleCase($("#pg-d", box).value.trim()).slice(0, 60) };
      DB.save();
      closeSheet();
      render();
    });
    const x = $("#pg-x", box);
    if (x) x.addEventListener("click", () => {
      DB.d.profile.goal = { school: "", dept: "" };
      DB.save();
      closeSheet();
      render();
    });
  },
  "p-why": () => {
    const box = openSheet("Neden çalışıyorum?", '<p class="hint">Kendine kısa bir not yaz. Bugün sayfasında ve odak sayacında görünür; zor günlerde hatırlatır.</p>\n      <textarea id="pw-t" rows="3" maxlength="160" placeholder="Örn. Ailemi gururlandırmak ve sevdiğim işi yapmak için." autofocus>'.concat(esc(DB.d.profile.why || ""), '</textarea>\n      <div class="row"><button class="btn primary" id="pw-go">Kaydet</button></div>'));
    $("#pw-go", box).addEventListener("click", () => {
      DB.d.profile.why = $("#pw-t", box).value.trim().slice(0, 160);
      DB.save();
      closeSheet();
      render();
    });
  },
  "p-palette": () => {
    const cur = paletteOf(DB.d.profile.palette).id;
    const box = openSheet("Tema rengi", '<div class="palettes">'.concat(PALETTES.map((pl) => '<label class="pal'.concat(cur === pl.id ? " on" : "", '"><input type="radio" name="pal" value="').concat(pl.id, '"').concat(cur === pl.id ? " checked" : "", '><span class="pal-sw" style="--a:').concat(pl.sw[0], ";--b:").concat(pl.sw[1], '" aria-hidden="true"></span><span><strong>').concat(pl.name, "</strong><span>").concat(pl.note, "</span></span></label>")).join(""), '</div>\n      <p class="hint">Renk telefonda ve bilgisayarda aynı kalır. Açık ya da koyu görünümü ayrıca seçebilirsin.</p>'));
    box.addEventListener("change", (e) => {
      if (e.target.name === "pal") {
        DB.d.profile.palette = e.target.value;
        DB.save();
        applyTheme();
        $$(".pal", box).forEach((l) => l.classList.toggle("on", l.querySelector("input").checked));
        render();
      }
    });
  },
  "p-sound": () => {
    DB.d.profile.sound = DB.d.profile.sound === false;
    DB.save();
    render();
  },
  backup: () => backup(),
  restore: () => $("#file-json").click(),
  reset: (el) => {
    if (el.dataset.armed !== "1") {
      el.dataset.armed = "1";
      el.querySelector("span").textContent = "Her şey silinecek. Emin misin? Tekrar bas";
      return;
    }
    localStorage.removeItem(DB.KEY);
    localStorage.removeItem("dersozetim.wx");
    DB.load();
    DB.save();
    applyTheme();
    go("#/bugun");
    toast("Tüm veriler silindi");
  },
  "ask-topic": (el) => {
    ui.askDraft = el.dataset.n + " konusunda anlamadığım yer: ";
    go("#/asistan/sor");
  },
  "all-mine": () => {
    ui.allMine = true;
    render();
  },
  "pl-rm": (el) => {
    ui.planDraft.splice(Number(el.dataset.i), 1);
    if (!ui.planDraft.length) ui.planDraft = null;
    render();
  },
  "pl-clear": () => {
    ui.planDraft = null;
    ui.planWhy = "";
    render();
  },
  "pl-add": () => {
    const wk = ui.plan.next ? wkKey(addDays(fromKey(thisWeek()), 7)) : thisWeek();
    const w = DB.ensureWeek(wk);
    ui.planDraft.forEach((t) => {
      const x = { id: "p" + uid(), day: t.day, text: t.text, label: t.text, type: guessTask(t.text).type, subject: t.subject, topic: t.topic, done: false, src: "plan" };
      const v = typeof YT !== "undefined" && ui.plan.videos !== false && YT.wants(x) ? YT.of(x) : null;
      if (v) {
        x.vid = v.id;
        x.vt = v.title;
        x.vc = v.ch;
      }
      w.tasks.push(x);
    });
    const n = ui.planDraft.length;
    ui.planDraft = null;
    ui.planWhy = "";
    DB.d.stats.plans = (DB.d.stats.plans || 0) + 1;
    DB.save();
    ui.week = wk;
    ui.day = wk === thisWeek() ? todayIdx() : 0;
    go("#/program");
    toast(n + " görev programa eklendi");
  },
  "sm-ai": () => {
    const subj = $("#sm-s").value, name = titleCase($("#sm-n").value.trim());
    if (!name) {
      toast("Konu adını yaz.");
      return;
    }
    ui.smDraft = { subj, name };
    aiRun(summaryPrompt(subj, name), (j) => {
      const s = normalizeSummary(j);
      if (!s) {
        render();
        toast("Yapay zekâ geçerli bir özet yazamadı. Tekrar dene.");
        return;
      }
      go("#/konu/" + encodeURIComponent(saveSummary(subj, name, s, DB.d.ai.engine === "bulut" ? "bulut-yz" : "yerel-yz")));
      toast("Özet hazır. Defter > Özetler'de “Senin özetlerin” altında duruyor.");
    });
  },
  "wk-ai": () => {
    const wk = ui.week, w = DB.week(wk);
    if (!w) return;
    ui.busyFor = "week";
    aiRun(weekPrompt(wk, w), (j) => {
      ui.busyFor = "";
      const o = weekFromJSON(j);
      if (!o) {
        render();
        toast("Yapay zekâ geçerli bir özet yazamadı. Tekrar dene.");
        return;
      }
      w.overview = Object.assign(o, { sig: weekSig(w), at: Date.now() });
      DB.save();
      render();
      setTimeout(() => {
        const el = $("#haftaya-bakis");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
      toast("Haftaya bakış hazır");
    });
  },
  "wk-ext": () => {
    const wk = ui.week, w = DB.week(wk);
    if (!w) return;
    extSheet("Başka bir yapay zekâda özetle", weekPrompt(wk, w), (j) => {
      const o = weekFromJSON(j);
      if (!o) return false;
      w.overview = Object.assign(o, { sig: weekSig(w), at: Date.now() });
      DB.save();
      render();
      toast("Haftaya bakış eklendi");
      return true;
    });
  },
  "to-overview": () => {
    ui.week = thisWeek();
    ui.day = todayIdx();
    go("#/program");
    setTimeout(() => {
      const el = $("#haftaya-bakis");
      if (el) el.scrollIntoView({ block: "start" });
    }, 80);
  },
  "sm-ext": () => {
    const subj = $("#sm-s").value, name = titleCase($("#sm-n").value.trim());
    if (!name) {
      toast("Konu adını yaz.");
      return;
    }
    extSheet("Başka bir yapay zekâda hazırla", summaryPrompt(subj, name), (j) => {
      const s = normalizeSummary(j);
      if (!s) return false;
      go("#/konu/" + encodeURIComponent(saveSummary(subj, name, s, "dis-yz")));
      toast("Özet Kitaplık'a eklendi");
      return true;
    });
  },
  "ai-eng": (el) => {
    DB.d.ai.engine = el.value;
    DB.d.ai.chosen = true;
    DB.save();
    if (el.value === "bulut") AI.refreshQuota().then(() => render());
    render();
  },
  "ai-model": (el) => {
    DB.d.ai.model = el.value;
    DB.save();
    render();
  },
  "ai-load": async () => {
    setBusy(true, "Model hazırlanıyor…");
    render();
    try {
      await AI.loadWebLLM(progressCb);
      setBusy(false);
      render();
      toast("Model hazır. Artık internetsiz de kullanabilirsin.");
    } catch (e) {
      setBusy(false);
      render();
      toast(String(e && e.message) === "nogpu" ? "Bu tarayıcı WebGPU desteklemiyor." : "Model yüklenemedi. Cihazın belleği yetmiyor olabilir; Hafif modeli dene.");
    }
  },
  "ol-test": async () => {
    const url = $("#ol-url").value.trim().replace(/\/+$/, "") || "http://localhost:11434";
    DB.d.ai.ollamaUrl = url;
    DB.save();
    const box = $("#ol-models");
    box.innerHTML = '<p class="hint">Bağlanılıyor…</p>';
    try {
      const ms = await AI.ollamaModels(url);
      box.innerHTML = ms.length ? '<label class="f-h" for="ol-m">Model</label><select id="ol-m">'.concat(ms.map((m) => "<option".concat(m === DB.d.ai.ollamaModel ? " selected" : "", ">").concat(esc(m), "</option>")).join(""), "</select>") : '<p class="hint">Bağlandı ama hiç model yok. Terminalde <code>ollama pull qwen3:4b</code> çalıştır.</p>';
      const sel = $("#ol-m");
      if (sel) {
        DB.d.ai.ollamaModel = sel.value;
        DB.save();
        sel.addEventListener("change", () => {
          DB.d.ai.ollamaModel = sel.value;
          DB.save();
        });
        toast("Ollama bağlandı");
      }
    } catch (e) {
      box.innerHTML = '<p class="err">Bağlanılamadı. Ollama açık mı? Aşağıdaki komutla başlatmayı dene.</p>';
    }
  }
};
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]");
  if (!el || el.tagName === "INPUT") return;
  const fn = ACT[el.dataset.act];
  if (fn) {
    e.preventDefault();
    fn(el, e);
  }
});
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.matches("input[data-done]")) {
    const [wk, id] = t.dataset.done.split("|");
    const task = DB.task(wk, id);
    if (!task) return;
    task.done = t.checked;
    if (t.checked) {
      task.doneOn = dayKey();
      bump(task.doneOn, "tasks", 1);
    } else {
      bump(task.doneOn || dayKey(), "tasks", -1);
      delete task.doneOn;
    }
    if (task.src === "dershane" && task.pid) Cloud.queueProgress(task.pid);
    if (t.checked && wk === thisWeek() && task.day === todayIdx()) {
      const ts = DB.week(wk).tasks.filter((x) => x.day === todayIdx());
      const full = DB.d.stats.full = DB.d.stats.full || {};
      if (ts.every((x) => x.done) && !full[dayKey()]) {
        full[dayKey()] = 1;
        setTimeout(() => toast("Bugünkü bütün görevlerin bitti" + (DB.d.profile.name ? ", " + firstName(DB.d.profile.name) : "") + ". Helal olsun!"), 200);
      }
    }
    DB.save();
    render();
    return;
  }
  if (t.matches('input[data-act="ai-eng"], input[data-act="ai-model"]')) {
    ACT[t.dataset.act](t);
    return;
  }
  if (t.id === "file-xlsx") {
    const fs = Array.from(t.files || []);
    t.value = "";
    if (fs.length) onExcelFiles(fs);
    return;
  }
  if (t.id === "file-json") {
    const f = t.files && t.files[0];
    t.value = "";
    if (f) restore(f);
  }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "lib-q") {
    ui.libQ = e.target.value;
    const l = $("#lib-list");
    if (l) l.innerHTML = libraryList();
  }
});
window.addEventListener("hashchange", () => {
  parseRoute();
  closeSheet();
  if (route.page === "odalar") RL.list = null;
  render();
  window.scrollTo(0, 0);
});
let lastRefresh = 0;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (Cloud.uid) Cloud.flushPush();
    return;
  }
  if (T().running) pmTick();
  if (route.page === "bugun") render();
  if (Cloud.uid && Date.now() - lastRefresh > 3e3) {
    lastRefresh = Date.now();
    Cloud.refresh().then((ch) => {
      if (ch && !sheetEl && route.page !== "oda" && route.page !== "not") render();
    });
  }
});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);
async function boot() {
  if (!window.DO_LIBRARY) {
    try {
      const r = await fetch(ENV === "artifact" ? "library.json" : "data/library.json");
      window.DO_LIBRARY = await r.json();
    } catch (e) {
      window.DO_LIBRARY = { summaries: {}, topics: {} };
    }
  }
  LIB = window.DO_LIBRARY;
  window.__diag && __diag.mark("lib");
  DB.load();
  if (typeof SP !== "undefined") await SP.handleRedirect();
  applyTheme();
  parseRoute();
  if (T().running && T().endAt <= Date.now()) pmTick();
  render();
  window.__DO_OK = true;
  window.__diag && __diag.mark("render1");
  if (Cloud.enabled) {
    await Cloud.start();
    if (/access_token=/.test(location.hash)) history.replaceState(null, "", location.pathname + "#/bugun");
    parseRoute();
    applyTheme();
    render();
  }
  pmLoop();
  swLoop();
  if (typeof SP !== "undefined" && SP.on) {
    SP.refresh();
    SP.sdk();
    SP.startPoll();
  }
  if (ENV === "web" && "serviceWorker" in navigator && /^https?:$/.test(location.protocol) && !/[?&]nosw/.test(location.search)) {
    const hadSW = !!navigator.serviceWorker.controller;
    let reloaded = false, fresh = false, touched = false;
    ["pointerdown", "keydown"].forEach((ev) => addEventListener(ev, () => {
      touched = true;
    }, { once: true, capture: true }));
    const reloadNow = () => {
      if (reloaded || Room.id || sheetEl) return;
      reloaded = true;
      Promise.resolve(Cloud.uid ? Cloud.flushPush() : null).finally(() => location.reload());
    };
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hadSW) return;
      fresh = true;
      if (!touched && performance.now() < 6e3) reloadNow();
    });
    document.addEventListener("visibilitychange", () => {
      if (fresh && document.hidden) setTimeout(() => {
        fresh && document.hidden && reloadNow();
      }, 0);
    });
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then((r) => {
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) r.update().catch(() => {
        });
      });
    }).catch(() => {
    });
  }
  if (ENV === "artifact" && window.claude && typeof window.claude.use === "function") {
    window.claude.use("sample").then((x) => {
      CAP.sample = x;
      if (x && DB.d.ai.engine === "off" && !DB.d.ai.chosen) {
        DB.d.ai.engine = "claude";
      }
      if (route.page === "asistan" || route.page === "profil") render();
    });
    window.claude.use("downloads").then((x) => {
      CAP.downloads = x;
    });
    try {
      const docs = await Sync.init();
      if (docs && docs.state) {
        const local = DB.d;
        DB.d = DB.normalize(Sync.join(docs));
        Sync.remember(DB.d);
        if (!DB.d.onboarded && local.onboarded) {
          DB.d = local;
          Sync.flush();
        }
        try {
          localStorage.setItem(DB.KEY, JSON.stringify(DB.d));
        } catch (e) {
        }
        applyTheme();
        render();
      } else if (docs && DB.d.onboarded) {
        Sync.flush();
      }
    } catch (e) {
    }
  }
}
async function pullRemote() {
  if (!Sync.col || Sync.busy || Sync.timer) return;
  try {
    const snap = await Sync.col.get();
    const docs = {};
    snap.docs.forEach((x) => {
      if (x.exists) docs[x.id] = x.data();
    });
    if (!docs.state) return;
    const parts = Sync.split(DB.d);
    const same = Object.keys(docs).length === Object.keys(parts).length && Object.keys(docs).every((k) => JSON.stringify(docs[k]) === JSON.stringify(parts[k]));
    if (same || Sync.busy) return;
    DB.d = DB.normalize(Sync.join(docs));
    Sync.remember(DB.d);
    try {
      localStorage.setItem(DB.KEY, JSON.stringify(DB.d));
    } catch (e) {
    }
    if (!sheetEl) render();
  } catch (e) {
  }
}
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && ENV === "artifact") pullRemote();
});
