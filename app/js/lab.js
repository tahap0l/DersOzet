/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
 *
 * lab.js: Laboratuvar. Konulara bağlı, dokunup değiştirilebilen deneyler ve animasyonlu anlatımlar.
 * Her deney defSim({...}) ile tanımlanır (sims-*.js). Çizim 1000 birim genişliğinde sanal bir
 * tuvalde yapılır; ekran boyutuna göre ölçeklenir, telefon ve tablette aynı görünür.
 */
'use strict';

const LAB = { sims: [], stop: null };
function defSim(o){ LAB.sims.push(o); }
function simsFor(slug){ return LAB.sims.filter(s => (s.topics || []).includes(slug)); }
const LAB_SUBJ = ['Fizik', 'Kimya', 'Biyoloji', 'Matematik', 'Geometri'];
const LAB_IC = {
  Fizik: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5c3 4 5.5 7 5.5 10a5.5 5.5 0 0 1-11 0c0-3 2.5-6 5.5-10Z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/></svg>',
  Kimya: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="1.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)"/></svg>',
  Biyoloji: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5c0 5 10 6 10 11s-10 2-10 6M17 3.5c0 5-10 6-10 11"/><path d="M8.5 7h7M8.5 17h7M10 12h4"/></svg>',
  Matematik: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h5M7.5 4.5v5M14 7h5M5.5 15.5l4 4M9.5 15.5l-4 4M14 16h5M14 19h5"/></svg>',
  Geometri: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 20.5 19h-17Z"/><path d="M7.5 19a4.5 4.5 0 0 0-1.8-3.6"/></svg>'
};
const nf = (x, d) => (Number.isFinite(x) ? x : 0).toLocaleString('tr-TR', { maximumFractionDigits: d == null ? 1 : d, minimumFractionDigits: 0 });
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;

function labView(){
  if (route.arg) return simView();
  const groups = LAB_SUBJ.map(sub => [sub, LAB.sims.filter(s => s.subject === sub)]).filter(g => g[1].length);
  const narrow = typeof defterSeg === 'function' && Cloud.uid && !matchMedia('(min-width: 900px)').matches;
  return `${narrow ? defterHead() + defterSeg('lab') : '<header class="page-head"><h1>Laboratuvar</h1></header>'}
    <p class="sub">Konuları dokunarak öğren: kaydırıcıyla değiştir, sürükle, ne olduğunu izle. ${LAB.sims.length} deney ve animasyon.</p>
    ${groups.map(([sub, list]) => `<section class="block"><h2 class="f-h">${esc(sub)}</h2><ul class="lab-grid">${list.map(s => `<li><a class="lab-card" href="#/lab/${s.id}" style="--c:${subjColor(s.subject)}">
      <span class="lc-ic" aria-hidden="true">${LAB_IC[s.subject] || I.flask}</span><span class="lc-b"><strong>${esc(s.title)}</strong><span>${esc(s.blurb)}</span></span></a></li>`).join('')}</ul></section>`).join('')}`;
}

function simView(){
  const s = LAB.sims.find(x => x.id === route.arg);
  if (!s) return `<header class="page-head slim"><a class="back" href="#/lab">${I.back}Laboratuvar</a></header>` + emptyBlock('Deney bulunamadı', '', '<a class="btn" href="#/lab">Laboratuvara dön</a>');
  const topic = (s.topics || []).find(t => sumFor(t));
  const sd = topic && sumFor(topic);
  return `<header class="page-head slim"><a class="back" href="#/lab">${I.back}Laboratuvar</a></header>
    <div class="sim-page">
      <p class="sim-chip">${chip(s.subject)}</p>
      <h1 class="page-title">${esc(s.title)}</h1>
      <p class="sub">${esc(s.lead || s.blurb)}</p>
      <div class="sim-stage"><canvas id="sim-cv" aria-label="${esc(s.title)} animasyonu" role="img"></canvas></div>
      <div class="sim-read" id="sim-read" aria-live="polite"></div>
      <div class="sim-ctl" id="sim-ctl"></div>
      ${s.tries && s.tries.length ? `<section class="block sim-try"><h2 class="f-h">Bunu dene</h2><ol>${s.tries.map(t => `<li>${esc(t)}</li>`).join('')}</ol></section>` : ''}
      ${s.note ? `<section class="block"><h2 class="f-h">Akılda kalsın</h2><p>${s.note}</p></section>` : ''}
      ${sd ? `<a class="focus-cta" href="#/konu/${encodeURIComponent(topic)}"><span class="fc-ic">${I.book}</span><span><strong>Konu özeti: ${esc(sd.topic || s.title)}</strong><span>Formüller, kavramlar ve çözümlü sorular</span></span><span class="fc-go">${I.next}</span></a>` : ''}
    </div>`;
}
function simLinksHTML(slug){
  const list = simsFor(slug); if (!list.length) return '';
  return `<div class="sim-links">${list.map(s => `<a class="focus-cta" href="#/lab/${s.id}" style="--c:${subjColor(s.subject)}"><span class="fc-ic">${I.flask}</span><span><strong>Deney: ${esc(s.title)}</strong><span>${esc(s.blurb)}</span></span><span class="fc-go">${I.next}</span></a>`).join('')}</div>`;
}
labView.after = () => { if (route.arg) simView.after(); };
simView.after = () => { const s = LAB.sims.find(x => x.id === route.arg); if (s) runSim(s); };

function stopSim(){ if (LAB.stop){ LAB.stop(); LAB.stop = null; } }

function runSim(def){
  stopSim();
  const cv = $('#sim-cv'); if (!cv) return;
  const stage = cv.parentElement, ctl = $('#sim-ctl'), read = $('#sim-read');
  const VW = 1000, VH = Math.round(1000 * (def.aspect || 0.62));
  const g = cv.getContext('2d');
  const S = { W: VW, H: VH, g, vals: {}, t: 0, k: 1, ts: 1, changed: null };
  const palette = () => {
    const cs = getComputedStyle(document.documentElement), v = n => cs.getPropertyValue(n).trim();
    const dark = matchMedia('(prefers-color-scheme: dark)').matches && document.documentElement.dataset.theme !== 'light' || document.documentElement.dataset.theme === 'dark';
    S.c = { ink: v('--ink') || '#221A3A', ink2: v('--ink-2') || '#6B6385', line: v('--line') || '#E4DEF2', bg: v('--surface') || '#fff', bg2: v('--surface-2') || '#F3EFFB', brand: v('--brand') || '#7C5CE6', ok: v('--ok') || '#1E9E5A', danger: v('--danger') || '#D7263D', dark,
      water: dark ? 'rgba(80,150,255,.42)' : 'rgba(64,140,255,.30)', waterTop: dark ? 'rgba(140,190,255,.8)' : 'rgba(40,110,230,.55)', hot: '#F05A47', cold: '#3B82F6', warn: '#F59E0B' };
  };
  palette();
  const fit = () => { const w = stage.clientWidth || 340, dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(w * dpr); cv.height = Math.round(w * VH / VW * dpr); cv.style.height = Math.round(w * VH / VW) + 'px'; S.k = cv.width / VW; S.ts = clamp(560 / w, 1, 1.45); };
  fit();

  /* --- kontroller --- */
  ctl.innerHTML = '';
  const add = html => { const d = document.createElement('div'); d.innerHTML = html; const el = d.firstElementChild; ctl.appendChild(el); return el; };
  S.slider = (id, label, min, max, step, val, fmt) => {
    S.vals[id] = val; fmt = fmt || (x => nf(x, 2));
    const el = add(`<label class="sl"><span class="sl-h"><span>${esc(label)}</span><b>${esc(fmt(val))}</b></span><input type="range" min="${min}" max="${max}" step="${step}" value="${val}"></label>`);
    const inp = el.querySelector('input'), b = el.querySelector('b');
    inp.addEventListener('input', () => { S.vals[id] = Number(inp.value); b.textContent = fmt(S.vals[id]); if (S.changed) S.changed(id); });
    S['set_' + id] = v => { S.vals[id] = v; inp.value = v; b.textContent = fmt(v); };
    return el;
  };
  S.choice = (id, label, opts, val) => {
    S.vals[id] = val;
    const el = add(`<div class="sc"><span class="sl-h"><span>${esc(label)}</span></span><div class="chips">${opts.map(([v, l]) => `<button type="button" class="fchip${v === val ? ' on' : ''}" data-v="${esc(String(v))}">${esc(l)}</button>`).join('')}</div></div>`);
    el.addEventListener('click', e => {
      const bt = e.target.closest('[data-v]'); if (!bt) return;
      const o = opts.find(x => String(x[0]) === bt.dataset.v); S.vals[id] = o[0];
      el.querySelectorAll('[data-v]').forEach(x => x.classList.toggle('on', x === bt));
      if (S.changed) S.changed(id);
    });
    return el;
  };
  S.toggle = (id, label, val) => {
    S.vals[id] = val;
    const el = add(`<label class="st"><input type="checkbox"${val ? ' checked' : ''}><span>${esc(label)}</span></label>`);
    el.querySelector('input').addEventListener('change', e => { S.vals[id] = e.target.checked; if (S.changed) S.changed(id); });
    return el;
  };
  S.button = (label, fn, primary) => {
    let row = ctl.querySelector('.sb-row'); if (!row){ row = document.createElement('div'); row.className = 'row sb-row'; ctl.appendChild(row); }
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn' + (primary ? ' primary' : ''); b.textContent = label;
    b.addEventListener('click', () => fn(b)); row.appendChild(b); return b;
  };
  let lastRead = '';
  S.read = html => { if (html !== lastRead){ lastRead = html; read.innerHTML = html; } };
  S.kv = pairs => S.read(`<dl class="kv">${pairs.filter(Boolean).map(([k, v, cls]) => `<div${cls ? ` class="${cls}"` : ''}><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`);

  /* --- çizim yardımcıları --- */
  S.font = (size, weight) => { g.font = `${weight || 700} ${size}px Nunito, "Segoe UI", system-ui, sans-serif`; };
  S.text = (str, x, y, o) => {
    o = o || {}; const fs = (o.size || 30) * (o.fixed ? 1 : S.ts); S.font(fs, o.weight); g.fillStyle = o.color || S.c.ink; g.textAlign = o.align || 'left'; g.textBaseline = o.base || 'alphabetic';
    if (o.bg){ const w = g.measureText(str).width, h = fs * 1.25, ax = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x; g.save(); g.fillStyle = o.bg; S.rr(ax - 8, y - h * .8, w + 16, h, 8); g.fill(); g.restore(); g.fillStyle = o.color || S.c.ink; }
    g.fillText(str, x, y);
  };
  S.rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  S.line = (x1, y1, x2, y2, color, w, dash) => { g.save(); g.strokeStyle = color || S.c.ink; g.lineWidth = w || 3; if (dash) g.setLineDash(dash); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.restore(); };
  S.circle = (x, y, r, fill, stroke, w) => { g.beginPath(); g.arc(x, y, Math.max(0, r), 0, Math.PI * 2); if (fill){ g.fillStyle = fill; g.fill(); } if (stroke){ g.strokeStyle = stroke; g.lineWidth = w || 3; g.stroke(); } };
  S.arrow = (x1, y1, x2, y2, color, w, label, lo) => {
    const len = Math.hypot(x2 - x1, y2 - y1); if (len < 2) return;
    const a = Math.atan2(y2 - y1, x2 - x1), hw = (w || 6) * 2.6;
    g.save(); g.strokeStyle = g.fillStyle = color; g.lineWidth = w || 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2 - Math.cos(a) * hw * .8, y2 - Math.sin(a) * hw * .8); g.stroke();
    g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - Math.cos(a - .45) * hw, y2 - Math.sin(a - .45) * hw); g.lineTo(x2 - Math.cos(a + .45) * hw, y2 - Math.sin(a + .45) * hw); g.closePath(); g.fill();
    g.restore();
    if (label){ lo = lo || {}; S.text(label, (lo.x != null ? lo.x : x2 + (lo.dx || 14)), (lo.y != null ? lo.y : y2 + (lo.dy || 0)), { size: lo.size || 28, color, base: 'middle', align: lo.align, weight: 800 }); }
  };
  S.tempColor = t => { t = clamp(t, 0, 1); const r = Math.round(lerp(59, 240, t)), gg = Math.round(lerp(130, 90, t)), b = Math.round(lerp(246, 71, t)); return `rgb(${r},${gg},${b})`; };

  const inst = def.init(S) || {};

  /* --- dokunma --- */
  const toV = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * VW / r.width, (e.clientY - r.top) * VH / r.height]; };
  let dragging = false;
  if (inst.down){
    cv.style.touchAction = 'none'; cv.classList.add('draggable');
    cv.addEventListener('pointerdown', e => { const [x, y] = toV(e); if (inst.down(x, y) !== false){ dragging = true; cv.setPointerCapture(e.pointerId); e.preventDefault(); } });
    cv.addEventListener('pointermove', e => { if (!dragging || !inst.move) return; const [x, y] = toV(e); inst.move(x, y); });
    const up = () => { if (dragging){ dragging = false; if (inst.up) inst.up(); } };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  }

  /* --- döngü --- */
  let raf = 0, last = performance.now(), alive = true;
  const frame = now => {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!document.hidden){
      S.t += dt;
      g.setTransform(S.k, 0, 0, S.k, 0, 0);
      g.clearRect(0, 0, VW, VH);
      g.fillStyle = S.c.bg; g.fillRect(0, 0, VW, VH);
      try { if (inst.draw) inst.draw(dt, S.t); } catch(err){ console.error(err); alive = false; }
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  const ro = new ResizeObserver(fit); ro.observe(stage);
  const mq = matchMedia('(prefers-color-scheme: dark)'), onMq = () => palette(); mq.addEventListener('change', onMq);
  LAB.stop = () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); mq.removeEventListener('change', onMq); };
  LAB.S = S;
}

window.addEventListener('hashchange', () => { if (route.page !== 'lab' || !route.arg) stopSim(); });
VIEWS.lab = labView;
