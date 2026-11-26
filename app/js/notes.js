/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
 *
 * notes.js: not defteri ve yanlış defteri.
 *  - Not: başlık, yazı ve kalemle çizim sayfaları (çizgili, kareli, noktalı ya da düz kâğıt).
 *  - Yanlış: sorunun fotoğrafı, ders/konu, neden yanlış yapıldığı, üstüne çizilen çözüm ve
 *    aralıklı tekrar (1, 3, 7, 14, 30 gün sonra yeniden sorulur).
 * Çizimler vektör olarak saklanır (kalem basıncıyla). Hepsi hesaba kaydedilir; internet yokken
 * yazılanlar sıraya alınır, bağlanınca gönderilir.
 */
'use strict';

const PAGE_W = 1000, PAGE_H = 1414;
const INKS = ['#1F1A2E', '#2F5BEA', '#D7263D', '#1E9E5A', '#7C4DFF'];
const MARKS = ['#FFE45C', '#FF9EC0', '#9BE7FF'];
const SIZES = { pen: [4, 7, 12], mark: [22, 32, 44] };
const REASONS = ['Bilgi eksiği', 'İşlem hatası', 'Dikkatsizlik', 'Süre yetmedi', 'Soruyu anlamadım'];
const REVIEW_DAYS = [1, 3, 7, 14, 30];
const NOTE_COLS = 'id, kind, title, body, subject, topic, reason, pages, image_path, paper, status, review_at, review_step, created_at, updated_at';

const NT = {
  list: null, busy: false, err: '', filter: { subj: '', status: 'due' }, urls: {}, cur: null, saveT: null, state: '',
  key(){ return 'dersozetim.notes.' + (Cloud.uid || 'yerel'); },
  qkey(){ return 'dersozetim.notesq.' + (Cloud.uid || 'yerel'); },
  readCache(){ try { return JSON.parse(localStorage.getItem(this.key()) || 'null'); } catch(e){ return null; } },
  writeCache(){ try { localStorage.setItem(this.key(), JSON.stringify({ list: this.list, full: this.full || {} })); } catch(e){} },
  queue(){ try { return JSON.parse(localStorage.getItem(this.qkey()) || '{}'); } catch(e){ return {}; } },
  setQueue(q){ try { localStorage.setItem(this.qkey(), JSON.stringify(q)); } catch(e){} },
  due(){ const t = dayKey(); return (this.list || []).filter(n => n.kind === 'wrong' && n.status === 'open' && (!n.review_at || n.review_at <= t)); }
};

async function ntLoad(force){
  if (!Cloud.uid || NT.busy || (NT.list && !force)) return;
  if (!NT.list){ const c = NT.readCache(); if (c){ NT.list = c.list; NT.full = c.full || {}; } }
  NT.busy = true; NT.err = '';
  try {
    await ntFlush();
    const { data, error } = await Cloud.sb.from('notes').select(NOTE_COLS).order('updated_at', { ascending: false }).limit(500);
    if (error) throw error;
    const q = NT.queue();
    NT.list = (data || []).map(n => q[n.id] ? Object.assign({}, n, q[n.id]) : n);
    Object.values(q).forEach(n => { if (!NT.list.some(x => x.id === n.id)) NT.list.unshift(n); });
    NT.writeCache();
  } catch(e){ if (!NT.list) NT.err = 'Notlar alınamadı. İnternet bağlantını kontrol et.'; }
  NT.busy = false;
  if (/^(defter|yanlis|bugun)$/.test(route.page) && !sheetEl) render();
}

async function ntFlush(){
  const q = NT.queue(), ids = Object.keys(q);
  for (const id of ids){
    const row = Object.assign({}, q[id]); delete row.created_at; delete row.updated_at; delete row._del;
    const res = q[id]._del ? await Cloud.sb.from('notes').delete().eq('id', id) : await Cloud.sb.from('notes').upsert(Object.assign(row, { user_id: Cloud.uid }));
    if (res.error){ if (/sınır/.test(res.error.message || '')) toast(res.error.message); else throw res.error; }
    const cur = NT.queue(); delete cur[id]; NT.setQueue(cur);
  }
}

function ntSave(n, now){
  n.updated_at = new Date().toISOString();
  const meta = {}; NOTE_COLS.split(', ').forEach(k => { meta[k] = n[k]; });
  NT.list = NT.list || [];
  const i = NT.list.findIndex(x => x.id === n.id);
  if (i < 0) NT.list.unshift(meta); else NT.list[i] = meta;
  NT.full = NT.full || {}; NT.full[n.id] = n;
  const keys = Object.keys(NT.full); if (keys.length > 30) delete NT.full[keys[0]];
  const q = NT.queue(); q[n.id] = Object.assign({}, n); NT.setQueue(q); NT.writeCache();
  NT.state = 'Kaydediliyor…'; ntPaintState();
  clearTimeout(NT.saveT);
  NT.saveT = setTimeout(async () => {
    try { await ntFlush(); NT.state = 'Kaydedildi'; }
    catch(e){ NT.state = 'İnternet yok; bağlanınca kaydedilecek'; }
    ntPaintState();
  }, now ? 0 : 1200);
}
function ntPaintState(){ const el = $('#nt-state'); if (el) el.textContent = NT.state; }
window.addEventListener('online', () => { if (Cloud.uid) ntFlush().then(() => { NT.state = 'Kaydedildi'; ntPaintState(); }).catch(() => {}); });

async function ntImageUrl(path){
  if (!path) return '';
  const c = NT.urls[path]; if (c && c.exp > Date.now()) return c.url;
  try {
    const { data } = await Cloud.sb.storage.from('notes').createSignedUrl(path, 3600);
    if (data && data.signedUrl){ NT.urls[path] = { url: data.signedUrl, exp: Date.now() + 3500e3 }; return data.signedUrl; }
  } catch(e){}
  return '';
}

async function compressImage(file){
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const max = 1600, k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise(res => c.toBlob(res, 'image/jpeg', 0.82));
  } finally { URL.revokeObjectURL(url); }
}

function newNote(kind, extra){
  const id = (crypto.randomUUID && crypto.randomUUID()) || ('xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, () => Math.floor(Math.random() * 16).toString(16)));
  return Object.assign({ id, kind, title: '', body: '', subject: '', topic: '', reason: '', strokes: [], pages: 1, image_path: null,
    paper: kind === 'wrong' ? 'plain' : 'lines', status: 'open', review_at: kind === 'wrong' ? dayKey(addDays(new Date(), 1)) : null, review_step: 0,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, extra || {});
}

/* ---------- liste sayfaları ---------- */
const defterHead = () => `<header class="page-head"><h1>${isTeacher() ? 'Ders araçları' : 'Defter'}</h1></header>`;
function defterSeg(on){
  // hocada: derste kullanılan araçlar önde
  if (isTeacher()) return `<div class="seg" role="tablist" aria-label="Ders araçları">${[['lab', 'Deneyler'], ['kitaplik', 'Özetler'], ['defter', 'Notlar']].map(([k, n]) => `<a class="seg-b${on === k ? ' on' : ''}" href="#/${k}" role="tab" aria-selected="${on === k}">${n}</a>`).join('')}</div>`;
  return `<div class="seg" role="tablist" aria-label="Defter"><a class="seg-b${on === 'defter' ? ' on' : ''}" href="#/defter" role="tab" aria-selected="${on === 'defter'}">Notlar</a><a class="seg-b${on === 'yanlis' ? ' on' : ''}" href="#/yanlis" role="tab" aria-selected="${on === 'yanlis'}">Yanlışlar${NT.due().length ? ` <b class="seg-n">${NT.due().length}</b>` : ''}</a><a class="seg-b${on === 'kitaplik' ? ' on' : ''}" href="#/kitaplik" role="tab" aria-selected="${on === 'kitaplik'}">Özetler</a><a class="seg-b${on === 'lab' ? ' on' : ''}" href="#/lab" role="tab" aria-selected="${on === 'lab'}">Deneyler</a></div>`;
}
function ntWhen(s){ const d = new Date(s), t = new Date(); const days = Math.round((new Date(t.toDateString()) - new Date(d.toDateString())) / 864e5); return days === 0 ? 'bugün ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) : days === 1 ? 'dün' : d.getDate() + ' ' + MONTHS[d.getMonth()]; }

function notesView(){
  if (!Cloud.uid) return emptyBlock('Giriş gerekli', 'Notların hesabına kaydedilir.', '');
  ntLoad();
  const list = (NT.list || []).filter(n => n.kind === 'note');
  return `${defterHead()}
  ${defterSeg('defter')}
  <div class="row"><button class="btn primary" data-act="nt-new">Yeni not</button></div>
  ${NT.err ? `<p class="err">${esc(NT.err)}</p>` : ''}
  ${!NT.list ? '<div class="progress"><span class="spinner" aria-hidden="true"></span><span>Notlar yükleniyor…</span></div>'
    : list.length ? `<ul class="note-list">${list.map(n => `<li><a class="note-card" href="#/not/${n.id}" style="--c:${subjColor(n.subject)}">
        <span class="nc-paper ${esc(n.paper || 'lines')}" aria-hidden="true">${I.pen}</span>
        <span class="cl-b"><strong>${esc(n.title || 'Adsız not')}</strong><span>${n.body ? esc(n.body.slice(0, 90)) : (n.subject ? esc(n.subject) + (n.topic ? ', ' + esc(n.topic) : '') : 'Çizim')}</span><span class="hint">${ntWhen(n.updated_at)}</span></span></a></li>`).join('')}</ul>`
    : `<div class="empty"><h2>Defterin boş</h2><p>Ders anlatırken not al, formülleri yaz ya da tabletinde kalemle çiz. Telefonda yazdığın bilgisayarda da açılır.</p></div>`}`;
}

function wrongsView(){
  if (!Cloud.uid) return emptyBlock('Giriş gerekli', 'Yanlış defterin hesabına kaydedilir.', '');
  ntLoad();
  const all = (NT.list || []).filter(n => n.kind === 'wrong'), due = NT.due(), f = NT.filter;
  const subjects = Array.from(new Set(all.map(n => n.subject).filter(Boolean))).sort((a, b) => subjRank(a) - subjRank(b));
  let list = all.filter(n => !f.subj || n.subject === f.subj);
  list = f.status === 'due' ? list.filter(n => due.includes(n)) : f.status === 'learned' ? list.filter(n => n.status === 'learned') : list.filter(n => n.status === 'open');
  const byReason = REASONS.map(r => [r, all.filter(n => n.reason === r).length]).filter(x => x[1]);
  return `${defterHead()}
  ${defterSeg('yanlis')}
  <section class="wrong-hero"><div><p class="wh-n">${due.length}</p><p class="wh-l">${due.length ? 'soru bugün tekrar bekliyor' : 'bugün tekrar edilecek soru yok'}</p></div>
    <div class="row">${due.length ? '<a class="btn primary" href="#/tekrar">Tekrara başla</a>' : ''}<button class="btn${due.length ? '' : ' primary'}" data-act="wr-new">Yanlış ekle</button></div></section>
  ${byReason.length ? `<p class="hint">En çok: ${byReason.sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => esc(x[0]) + ' (' + x[1] + ')').join(', ')}</p>` : ''}
  <div class="chips">${['due', 'open', 'learned'].map(s => `<button class="fchip${f.status === s ? ' on' : ''}" data-act="wr-f" data-k="status" data-v="${s}">${{ due: 'Tekrar bekleyen', open: 'Hepsi', learned: 'Öğrendiklerim' }[s]}</button>`).join('')}</div>
  ${subjects.length > 1 ? `<div class="chips">${['', ...subjects].map(s => `<button class="fchip${f.subj === s ? ' on' : ''}" data-act="wr-f" data-k="subj" data-v="${esc(s)}">${s ? esc(s) : 'Tüm dersler'}</button>`).join('')}</div>` : ''}
  ${!NT.list ? '<div class="progress"><span class="spinner" aria-hidden="true"></span><span>Yükleniyor…</span></div>'
    : list.length ? `<ul class="wrong-grid">${list.map(n => `<li><a class="wrong-card" href="#/not/${n.id}" style="--c:${subjColor(n.subject)}">
        <span class="wc-img" data-img="${esc(n.image_path || '')}">${n.image_path ? '' : I.pen}</span>
        <span class="wc-b">${n.subject ? chip(n.subject) : ''}<strong>${esc(n.topic || n.title || 'Soru')}</strong><span class="hint">${esc(n.reason || '')}${n.status === 'learned' ? ' · öğrenildi' : n.review_at ? ' · tekrar ' + (n.review_at <= dayKey() ? 'bugün' : fmtDay(fromKey(n.review_at))) : ''}</span></span></a></li>`).join('')}</ul>`
    : `<div class="empty"><h2>${all.length ? 'Bu filtrede soru yok' : 'Yanlış defterin boş'}</h2><p>Yanlış yaptığın ya da boş bıraktığın sorunun fotoğrafını çek, nedenini seç, çözümü üstüne yaz. Mürek o soruyu 1, 3, 7, 14 ve 30 gün sonra sana yeniden sorar.</p></div>`}`;
}
wrongsView.after = () => {
  $$('.wc-img[data-img]').forEach(async el => { const p = el.dataset.img; if (!p) return; const u = await ntImageUrl(p); if (u) el.style.backgroundImage = `url("${u}")`; });
};

/* ---------- düzenleyici ---------- */
const PAD = { tool: 'pen', ink: 0, mark: 0, size: 1, finger: null, penSeen: false, undo: [], redo: [], tab: null };

function noteView(){
  const id = route.arg.split('/')[0];
  let n = NT.cur && NT.cur.id === id ? NT.cur : null;
  if (!n){ ntOpen(id); return '<div class="progress"><span class="spinner" aria-hidden="true"></span><span>Not açılıyor…</span></div>'; }
  const wrong = n.kind === 'wrong';
  if (!PAD.tab) PAD.tab = wrong || matchMedia('(pointer: coarse)').matches ? 'draw' : 'text';
  if (PAD.finger === null) PAD.finger = matchMedia('(pointer: coarse)').matches;
  const subs = TRACKS[DB.d.profile.track] ? TRACKS[DB.d.profile.track].subjects : SUBJ_ORDER;
  const subjOpts = ['', ...Array.from(new Set(subs.concat(n.subject ? [n.subject] : [])))].map(s => `<option value="${esc(s)}"${n.subject === s ? ' selected' : ''}>${s || 'Ders seç'}</option>`).join('');
  const tops = n.subject ? topicsOfSubject(n.subject) : [];
  return `<div class="note-ed${wrong ? ' wrong' : ''}">
    <header class="page-head slim"><a class="back" href="#/${wrong ? 'yanlis' : 'defter'}">${I.back}${wrong ? 'Yanlışlar' : 'Defter'}</a><span class="nt-state" id="nt-state" aria-live="polite">${esc(NT.state)}</span><button class="icon-btn" data-act="nt-menu" aria-label="Not seçenekleri">${I.dots}</button></header>
    <input class="nt-title" id="nt-title" maxlength="120" placeholder="${wrong ? 'Kısa bir başlık (isteğe bağlı)' : 'Başlık'}" value="${esc(n.title)}" autocomplete="off">
    <div class="nt-meta">
      <select id="nt-subj" aria-label="Ders">${subjOpts}</select>
      <input id="nt-topic" list="nt-topics" maxlength="120" placeholder="Konu" value="${esc(n.topic)}" autocomplete="off"><datalist id="nt-topics">${tops.map(t => `<option value="${esc(t)}">`).join('')}</datalist>
    </div>
    ${wrong ? `<div class="chips" role="group" aria-label="Neden yanlış yaptın?">${REASONS.map(r => `<button class="fchip${n.reason === r ? ' on' : ''}" data-act="nt-reason" data-r="${esc(r)}">${esc(r)}</button>`).join('')}</div>` : ''}
    <div class="seg small" role="tablist"><button class="seg-b${PAD.tab === 'draw' ? ' on' : ''}" data-act="nt-tab" data-t="draw" role="tab">${I.pen}${wrong ? 'Soru ve çözüm' : 'Çizim'}</button><button class="seg-b${PAD.tab === 'text' ? ' on' : ''}" data-act="nt-tab" data-t="text" role="tab">${I.text}${wrong ? 'Not' : 'Yazı'}</button></div>
    <div id="nt-text" ${PAD.tab === 'text' ? '' : 'hidden'}><textarea id="nt-body" class="nt-body" maxlength="20000" placeholder="${wrong ? 'Doğru çözüm, dikkat etmen gereken nokta…' : 'Yazmaya başla…'}">${esc(n.body)}</textarea></div>
    <div id="nt-draw" ${PAD.tab === 'draw' ? '' : 'hidden'}>
      <div class="pad-tools" role="toolbar" aria-label="Kalem araçları">
        <button class="pt${PAD.tool === 'pen' ? ' on' : ''}" data-act="pt-tool" data-t="pen" aria-label="Kalem">${I.pen}</button>
        <button class="pt${PAD.tool === 'mark' ? ' on' : ''}" data-act="pt-tool" data-t="mark" aria-label="Fosforlu kalem">${I.marker}</button>
        <button class="pt${PAD.tool === 'erase' ? ' on' : ''}" data-act="pt-tool" data-t="erase" aria-label="Silgi">${I.eraser}</button>
        <span class="pt-sep"></span>
        ${(PAD.tool === 'mark' ? MARKS : INKS).map((c, i) => `<button class="pt-c${(PAD.tool === 'mark' ? PAD.mark : PAD.ink) === i ? ' on' : ''}" data-act="pt-color" data-i="${i}" style="--k:${c}" aria-label="Renk ${i + 1}"></button>`).join('')}
        <span class="pt-sep"></span>
        ${[0, 1, 2].map(i => `<button class="pt-s${PAD.size === i ? ' on' : ''}" data-act="pt-size" data-i="${i}" aria-label="${['İnce', 'Orta', 'Kalın'][i]}"><span style="--d:${4 + i * 4}px"></span></button>`).join('')}
        <span class="pt-sep"></span>
        <button class="pt" data-act="pt-undo" aria-label="Geri al">${I.undo}</button>
        <button class="pt" data-act="pt-redo" aria-label="Yinele">${I.redo}</button>
        <button class="pt${PAD.finger ? ' on' : ''}" data-act="pt-finger" aria-label="${PAD.finger ? 'Parmakla çizim açık' : 'Parmakla kaydırma'}" title="${PAD.finger ? 'Parmakla çiz' : 'Parmakla kaydır'}">${I.hand}</button>
      </div>
      ${wrong && !n.image_path ? `<div class="row"><button class="btn" data-act="wr-photo">Sorunun fotoğrafını ekle</button></div>` : ''}
      <div class="pages" id="pages">${Array.from({ length: n.pages }, (_, i) => `<div class="page paper-${esc(n.paper)}" data-pg="${i}"><canvas></canvas></div>`).join('')}</div>
      <div class="row center"><button class="btn sm" data-act="pt-page">Sayfa ekle</button><span class="hint">${n.pages}/20 sayfa</span></div>
    </div>
    ${wrong ? `<div class="wr-foot"><p class="hint">${n.status === 'learned' ? 'Bu soruyu öğrendin.' : 'Mürek bu soruyu ' + (n.review_at ? (n.review_at <= dayKey() ? 'bugün' : fmtDay(fromKey(n.review_at))) : 'yarın') + ' yeniden soracak.'}</p></div>` : ''}
  </div>`;
}
noteView.after = () => { padMount(); const b = $('#nt-body'); if (b) autoGrow(b); };

async function ntOpen(id){
  if (NT.opening === id) return; NT.opening = id;
  await new Promise(r => setTimeout(r, 0)); // render() bitmeden yeniden çizme
  if (id === 'yeni' || id === 'yeni-yanlis'){
    const n = newNote(id === 'yeni' ? 'note' : 'wrong', ui.noteSeed || {}); ui.noteSeed = null;
    NT.cur = n; NT.state = ''; PAD.undo = []; PAD.redo = []; PAD.tab = null;
    history.replaceState(null, '', '#/not/' + n.id); route.arg = n.id; NT.opening = null;
    if (n.kind === 'wrong' && ui.notePhoto){ const f = ui.notePhoto; ui.notePhoto = null; render(); await ntAttachPhoto(f); return; }
    render(); return;
  }
  let n = NT.full && NT.full[id];
  try {
    const { data, error } = await Cloud.sb.from('notes').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    const q = NT.queue();
    if (q[id]) n = q[id]; else if (data) n = data;
  } catch(e){}
  NT.opening = null;
  if (!n){ toast('Not bulunamadı.'); go('#/defter'); return; }
  NT.cur = n; NT.state = ''; PAD.undo = []; PAD.redo = []; PAD.tab = null;
  if (route.page === 'not') render();
}

async function ntAttachPhoto(file){
  const n = NT.cur; if (!n) return;
  NT.state = 'Fotoğraf yükleniyor…'; ntPaintState();
  try {
    const blob = await compressImage(file);
    const path = Cloud.uid + '/' + n.id + '-' + Date.now().toString(36) + '.jpg';
    const { error } = await Cloud.sb.storage.from('notes').upload(path, blob, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;
    const old = n.image_path; n.image_path = path;
    if (old) Cloud.sb.storage.from('notes').remove([old]).catch(() => {});
    NT.urls[path] = { url: URL.createObjectURL(blob), exp: Date.now() + 3500e3 };
    ntSave(n, true); render();
  } catch(e){ NT.state = ''; ntPaintState(); toast('Fotoğraf yüklenemedi. İnternet bağlantını kontrol et.'); }
}

/* ---------- kalem alanı ---------- */
/* Bir defter sayfasını tuvale çizer (düzenleyici ve tekrar ekranı ortak kullanır). */
function wFor(pr){ return 0.45 + (pr / 100) * 0.9; }
function drawStroke(g, s, k){
  const p = s.p; if (!p || p.length < 3) return;
  g.save();
  g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = s.c;
  if (s.t === 'mark'){ g.globalAlpha = 0.38; g.globalCompositeOperation = 'multiply'; }
  if (p.length === 3){ g.fillStyle = s.c; g.beginPath(); g.arc(p[0] * k, p[1] * k, Math.max(0.6, s.w * k * (s.t === 'mark' ? 1 : wFor(p[2])) / 2), 0, Math.PI * 2); g.fill(); g.restore(); return; }
  if (s.t === 'mark'){
    g.lineWidth = s.w * k; g.beginPath(); g.moveTo(p[0] * k, p[1] * k);
    for (let i = 3; i < p.length; i += 3) g.lineTo(p[i] * k, p[i + 1] * k);
    g.stroke(); g.restore(); return;
  }
  for (let i = 3; i < p.length; i += 3){
    const x0 = p[i - 3], y0 = p[i - 2], x1 = p[i], y1 = p[i + 1];
    const mx0 = i >= 6 ? (p[i - 6] + x0) / 2 : x0, my0 = i >= 6 ? (p[i - 5] + y0) / 2 : y0, mx1 = (x0 + x1) / 2, my1 = (y0 + y1) / 2;
    g.lineWidth = Math.max(0.6, s.w * k * wFor((p[i - 1] + p[i + 2]) / 2));
    g.beginPath(); g.moveTo(mx0 * k, my0 * k); g.quadraticCurveTo(x0 * k, y0 * k, i + 3 >= p.length ? x1 * k : mx1 * k, i + 3 >= p.length ? y1 * k : my1 * k); g.stroke();
  }
  g.restore();
}
function paintPage(g, n, i, bg){
  const c = g.canvas, k = c.width / PAGE_W;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height);
  if (i === 0 && bg && bg.complete && bg.naturalWidth){ const h = Math.min(PAGE_H * 0.62, PAGE_W * bg.naturalHeight / bg.naturalWidth); const w = h * bg.naturalWidth / bg.naturalHeight; g.drawImage(bg, (PAGE_W - w) / 2 * k, 20 * k, w * k, h * k); }
  n.strokes.forEach(s => { if ((s.g || 0) === i) drawStroke(g, s, k); });
}
function sizeCanvas(el){
  const c = el.querySelector('canvas'), w = el.clientWidth, dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = Math.round(w * dpr); c.height = Math.round(w * PAGE_H / PAGE_W * dpr);
  c.style.height = Math.round(w * PAGE_H / PAGE_W) + 'px';
  return c.getContext('2d');
}

function padMount(){
  if (NT.unmount){ NT.unmount(); NT.unmount = null; }
  const n = NT.cur, wrap = $('#pages'); if (!n || !wrap || wrap.offsetParent === null) return;
  const pages = $$('.page', wrap);
  const bg = n.image_path ? new Image() : null;
  if (bg){ bg.crossOrigin = 'anonymous'; ntImageUrl(n.image_path).then(u => { if (u){ bg.onload = () => drawPage(0); bg.src = u; } }); }
  const ctxOf = {};
  const size = () => pages.forEach((el, i) => { ctxOf[i] = sizeCanvas(el); drawPage(i); });
  function drawPage(i){ const g = ctxOf[i]; if (g) paintPage(g, n, i, bg); }
  size();
  const ro = new ResizeObserver(() => size()); ro.observe(wrap);
  PAD.redraw = drawPage;
  let cur = null, lastY = 0;
  const pt = (e, el) => { const r = el.getBoundingClientRect(), k = PAGE_W / r.width; return [Math.round((e.clientX - r.left) * k), Math.round((e.clientY - r.top) * k), Math.round((e.pressure && e.pointerType === 'pen' ? e.pressure : 0.5) * 100)]; };
  pages.forEach((el, i) => {
    const c = el.querySelector('canvas');
    c.style.touchAction = 'none';
    c.addEventListener('pointerdown', e => {
      if (e.pointerType === 'pen' && !PAD.penSeen){ PAD.penSeen = true; PAD.finger = false; const b = $('[data-act="pt-finger"]'); if (b) b.classList.remove('on'); }
      if (e.pointerType === 'touch' && !PAD.finger){ lastY = e.clientY; cur = { scroll: true, id: e.pointerId }; c.setPointerCapture(e.pointerId); return; }
      if (e.button > 0) return;
      e.preventDefault(); c.setPointerCapture(e.pointerId);
      if (PAD.tool === 'erase'){ cur = { erase: true, id: e.pointerId, g: i, gone: [] }; eraseAt(i, pt(e, c), cur); return; }
      const mark = PAD.tool === 'mark';
      cur = { id: e.pointerId, g: i, s: { g: i, t: mark ? 'mark' : 'pen', c: mark ? MARKS[PAD.mark] : INKS[PAD.ink], w: SIZES[mark ? 'mark' : 'pen'][PAD.size], p: pt(e, c) } };
      n.strokes.push(cur.s); drawPage(i);
    });
    c.addEventListener('pointermove', e => {
      if (!cur || cur.id !== e.pointerId) return;
      if (cur.scroll){ window.scrollBy(0, lastY - e.clientY); lastY = e.clientY; return; }
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      if (cur.erase){ evs.forEach(ev => eraseAt(i, pt(ev, c), cur)); return; }
      const p = cur.s.p;
      evs.forEach(ev => { const q = pt(ev, c); const dx = q[0] - p[p.length - 3], dy = q[1] - p[p.length - 2]; if (dx * dx + dy * dy >= 4) p.push(q[0], q[1], q[2]); });
      drawPage(i);
    });
    const end = e => {
      if (!cur || cur.id !== e.pointerId) return;
      if (cur.erase){ if (cur.gone.length){ PAD.undo.push({ t: 'erase', s: cur.gone }); PAD.redo = []; ntSave(n); } }
      else if (cur.s){ PAD.undo.push({ t: 'add', s: [cur.s] }); PAD.redo = []; ntSave(n); }
      cur = null;
    };
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
  });
  function eraseAt(i, q, st){
    const r = 14, before = n.strokes.length;
    n.strokes = n.strokes.filter(s => {
      if ((s.g || 0) !== i) return true;
      const p = s.p, rr = r + s.w / 2;
      for (let j = 0; j < p.length; j += 3){ const dx = p[j] - q[0], dy = p[j + 1] - q[1]; if (dx * dx + dy * dy < rr * rr){ st.gone.push(s); return false; } }
      return true;
    });
    if (n.strokes.length !== before) drawPage(i);
  }
  NT.unmount = () => ro.disconnect();
}

function autoGrow(t){ t.style.height = 'auto'; t.style.height = Math.max(220, t.scrollHeight + 4) + 'px'; }

/* ---------- tekrar ---------- */
const RV = { list: null, i: 0, shown: false, ok: 0 };
function reviewView(){
  if (!RV.list){ RV.list = NT.due().slice().sort((a, b) => (a.review_at || '').localeCompare(b.review_at || '')); RV.i = 0; RV.shown = false; RV.ok = 0; }
  const n = RV.list[RV.i];
  if (!n){
    const total = RV.list.length; RV.list = null;
    return `<header class="page-head slim"><a class="back" href="#/yanlis">${I.back}Yanlışlar</a></header>
      <div class="empty"><div class="m-head">${mascotSVG(total ? 'happy' : 'ok', 72)}</div><h2>${total ? 'Tekrar bitti' : 'Bugün tekrar yok'}</h2><p>${total ? `${total} sorudan ${RV.ok} tanesini bu sefer yaptın. Yapamadıklarını yarın yeniden soracağım.` : 'Yeni bir yanlış eklediğinde ertesi gün sana soracağım.'}</p><a class="btn primary" href="#/yanlis">Yanlış defterine dön</a></div>`;
  }
  return `<header class="page-head slim"><a class="back" href="#/yanlis">${I.back}Yanlışlar</a><span class="hint">${RV.i + 1}/${RV.list.length}</span></header>
    <section class="review">
      <p class="rv-m">${n.subject ? chip(n.subject) : ''}<strong>${esc(n.topic || n.title || 'Soru')}</strong>${n.reason ? `<span class="hint">Geçen sefer: ${esc(n.reason)}</span>` : ''}</p>
      ${n.image_path ? `<div class="rv-img" data-img="${esc(n.image_path)}"></div>` : `<p class="hint">Bu sorunun fotoğrafı yok; notuna bakarak hatırlamaya çalış.</p>`}
      ${RV.shown ? `<div class="rv-sol">${n.body ? `<p>${esc(n.body)}</p>` : ''}<div class="page paper-plain rv-page" id="rv-page"><canvas></canvas></div><a class="btn sm" href="#/not/${n.id}">Düzenle</a></div>
        <p class="f-h">Bu sefer yapabildin mi?</p>
        <div class="row"><button class="btn primary" data-act="rv-ok">Yaptım</button><button class="btn" data-act="rv-no">Yine yapamadım</button></div>`
        : `<p class="hint">Önce soruyu kâğıtta yeniden çöz, sonra çözümüne bak.</p><div class="row"><button class="btn primary" data-act="rv-show">Çözümümü göster</button></div>`}
    </section>`;
}
reviewView.after = async () => {
  $$('.rv-img[data-img]').forEach(async el => { const u = await ntImageUrl(el.dataset.img); if (u) el.innerHTML = `<img src="${esc(u)}" alt="Soru fotoğrafı">`; });
  const pe = $('#rv-page'), meta = RV.list && RV.list[RV.i]; if (!pe || !meta) return;
  let n = NT.full && NT.full[meta.id];
  if (!n){ try { const { data } = await Cloud.sb.from('notes').select('*').eq('id', meta.id).maybeSingle(); n = data; if (n){ NT.full = NT.full || {}; NT.full[n.id] = n; } } catch(e){} }
  if (!n || !$('#rv-page')) return;
  if (!n.strokes.some(s => (s.g || 0) === 0)){ pe.remove(); return; }
  const g = sizeCanvas(pe);
  const bg = n.image_path ? new Image() : null;
  paintPage(g, n, 0, null);
  if (bg){ bg.crossOrigin = 'anonymous'; const u = await ntImageUrl(n.image_path); if (u){ bg.onload = () => paintPage(g, n, 0, bg); bg.src = u; } }
};
async function rvAnswer(ok){
  const meta = RV.list[RV.i]; if (!meta) return;
  let n = NT.full && NT.full[meta.id];
  if (!n){ try { const { data } = await Cloud.sb.from('notes').select('*').eq('id', meta.id).maybeSingle(); n = data; } catch(e){} }
  if (!n){ toast('Soru açılamadı.'); return; }
  if (ok){
    RV.ok++;
    const step = (n.review_step || 0) + 1;
    if (step >= REVIEW_DAYS.length){ n.status = 'learned'; n.review_at = null; } else n.review_at = dayKey(addDays(new Date(), REVIEW_DAYS[step]));
    n.review_step = step;
  } else { n.review_step = 0; n.review_at = dayKey(addDays(new Date(), 1)); }
  ntSave(n, true); RV.i++; RV.shown = false; render();
}

/* ---------- işlemler ---------- */
function photoPicker(then){
  const box = openSheet('Yanlış ekle', `<p class="hint">Sorunun fotoğrafını çek; sonra ders, konu ve nedenini seçip çözümü üstüne yazarsın.</p>
    <div class="opts">
      <label class="opt"><input type="file" accept="image/*" capture="environment" hidden id="wp-cam"><span><strong>Fotoğraf çek</strong><span>Kamerayla soruyu çek</span></span></label>
      <label class="opt"><input type="file" accept="image/*" hidden id="wp-gal"><span><strong>Galeriden seç</strong><span>Daha önce çektiğin bir fotoğraf</span></span></label>
      <button class="opt" id="wp-none"><span><strong>Fotoğrafsız</strong><span>Soruyu kendin yazıp çiz</span></span></button>
    </div>`);
  const pick = e => { const f = e.target.files && e.target.files[0]; if (f){ closeSheet(); then(f); } };
  $('#wp-cam', box).addEventListener('change', pick); $('#wp-gal', box).addEventListener('change', pick);
  $('#wp-none', box).addEventListener('click', () => { closeSheet(); then(null); });
}

Object.assign(ACT, {
  'nt-new': () => { ui.noteSeed = null; go('#/not/yeni'); },
  'wr-new': () => photoPicker(f => { ui.notePhoto = f; ui.noteSeed = null; go('#/not/yeni-yanlis'); }),
  'wr-photo': () => photoPicker(f => { if (f) ntAttachPhoto(f); }),
  'wr-f': el => { NT.filter[el.dataset.k] = el.dataset.v; render(); },
  'nt-tab': el => { PAD.tab = el.dataset.t; $('#nt-text').hidden = PAD.tab !== 'text'; $('#nt-draw').hidden = PAD.tab !== 'draw'; $$('[data-act="nt-tab"]').forEach(b => b.classList.toggle('on', b.dataset.t === PAD.tab)); if (PAD.tab === 'draw') padMount(); else { const b = $('#nt-body'); if (b){ autoGrow(b); b.focus(); } } },
  'nt-reason': el => { const n = NT.cur; n.reason = n.reason === el.dataset.r ? '' : el.dataset.r; $$('[data-act="nt-reason"]').forEach(b => b.classList.toggle('on', b.dataset.r === n.reason)); ntSave(n); },
  'pt-tool': el => { PAD.tool = el.dataset.t; render(); },
  'pt-color': el => { if (PAD.tool === 'mark') PAD.mark = Number(el.dataset.i); else { PAD.ink = Number(el.dataset.i); if (PAD.tool === 'erase') PAD.tool = 'pen'; } render(); },
  'pt-size': el => { PAD.size = Number(el.dataset.i); $$('.pt-s').forEach(b => b.classList.toggle('on', b === el)); },
  'pt-finger': el => { PAD.finger = !PAD.finger; el.classList.toggle('on', PAD.finger); toast(PAD.finger ? 'Parmakla çizim açık' : 'Parmakla kaydırma açık; kalemle çizebilirsin'); },
  'pt-undo': () => { const a = PAD.undo.pop(), n = NT.cur; if (!a || !n) return; if (a.t === 'add') n.strokes = n.strokes.filter(s => !a.s.includes(s)); else n.strokes = n.strokes.concat(a.s); PAD.redo.push(a); a.s.forEach(s => PAD.redraw && PAD.redraw(s.g || 0)); ntSave(n); },
  'pt-redo': () => { const a = PAD.redo.pop(), n = NT.cur; if (!a || !n) return; if (a.t === 'add') n.strokes = n.strokes.concat(a.s); else n.strokes = n.strokes.filter(s => !a.s.includes(s)); PAD.undo.push(a); a.s.forEach(s => PAD.redraw && PAD.redraw(s.g || 0)); ntSave(n); },
  'pt-page': () => { const n = NT.cur; if (!n || n.pages >= 20) return; n.pages++; ntSave(n); render(); setTimeout(() => { const p = $$('.page'); if (p.length) p[p.length - 1].scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60); },
  'nt-menu': () => {
    const n = NT.cur; if (!n) return;
    const box = openSheet(n.kind === 'wrong' ? 'Soru' : 'Not', `
      <p class="f-h">Kâğıt</p><div class="chips">${[['lines', 'Çizgili'], ['grid', 'Kareli'], ['dots', 'Noktalı'], ['plain', 'Düz']].map(([k, l]) => `<button class="fchip${n.paper === k ? ' on' : ''}" data-paper="${k}">${l}</button>`).join('')}</div>
      <ul class="menu">
        ${n.kind === 'wrong' ? `<li><button data-k="photo"><span>${n.image_path ? 'Fotoğrafı değiştir' : 'Fotoğraf ekle'}</span></button></li>
        <li><button data-k="learned"><span>${n.status === 'learned' ? 'Tekrar listesine geri al' : 'Öğrendim, tekrar sorma'}</span></button></li>` : `<li><button data-k="towrong"><span>Yanlış defterine taşı</span></button></li>`}
        <li><button data-k="clear"><span>Çizimleri temizle</span></button></li>
        <li><button data-k="del" class="danger"><span>${n.kind === 'wrong' ? 'Soruyu sil' : 'Notu sil'}</span></button></li>
      </ul>`);
    box.addEventListener('click', async e => {
      const pb = e.target.closest('[data-paper]');
      if (pb){ n.paper = pb.dataset.paper; ntSave(n); closeSheet(); render(); return; }
      const b = e.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k;
      if ((k === 'del' || k === 'clear') && b.dataset.armed !== '1'){ b.dataset.armed = '1'; b.querySelector('span').textContent = k === 'del' ? 'Silinsin mi? Tekrar bas' : 'Bütün çizimler silinsin mi? Tekrar bas'; return; }
      closeSheet();
      if (k === 'photo') ACT['wr-photo']();
      if (k === 'learned'){ if (n.status === 'learned'){ n.status = 'open'; n.review_step = 0; n.review_at = dayKey(addDays(new Date(), 1)); } else { n.status = 'learned'; n.review_at = null; } ntSave(n, true); render(); }
      if (k === 'towrong'){ n.kind = 'wrong'; n.review_at = dayKey(addDays(new Date(), 1)); ntSave(n, true); render(); toast('Yanlış defterine taşındı'); }
      if (k === 'clear'){ PAD.undo.push({ t: 'erase', s: n.strokes.slice() }); n.strokes = []; ntSave(n); render(); }
      if (k === 'del'){
        const q = NT.queue(); q[n.id] = { id: n.id, _del: true }; NT.setQueue(q);
        NT.list = (NT.list || []).filter(x => x.id !== n.id); if (NT.full) delete NT.full[n.id]; NT.writeCache();
        if (n.image_path) Cloud.sb.storage.from('notes').remove([n.image_path]).catch(() => {});
        ntFlush().catch(() => {});
        const back = n.kind === 'wrong' ? '#/yanlis' : '#/defter'; NT.cur = null; go(back); toast('Silindi');
      }
    });
  },
  'rv-show': () => { RV.shown = true; render(); },
  'rv-ok': () => rvAnswer(true),
  'rv-no': () => rvAnswer(false),
  'm-wrongs': () => go('#/tekrar')
});

document.addEventListener('input', e => {
  const n = NT.cur; if (!n || route.page !== 'not') return;
  if (e.target.id === 'nt-title'){ n.title = e.target.value.slice(0, 120); ntSave(n); }
  if (e.target.id === 'nt-topic'){ n.topic = e.target.value.slice(0, 120); ntSave(n); }
  if (e.target.id === 'nt-body'){ n.body = e.target.value.slice(0, 20000); autoGrow(e.target); ntSave(n); }
});
document.addEventListener('change', e => {
  const n = NT.cur; if (!n || route.page !== 'not') return;
  if (e.target.id === 'nt-subj'){ n.subject = e.target.value; ntSave(n); render(); }
});
window.addEventListener('hashchange', () => {
  if (route.page !== 'not' && NT.cur){ if (NT.unmount) NT.unmount(); clearTimeout(NT.saveT); ntFlush().catch(() => {}); NT.cur = null; }
  if (route.page !== 'tekrar') RV.list = null;
});

VIEWS.defter = notesView;
VIEWS.yanlis = wrongsView;
VIEWS.not = noteView;
VIEWS.tekrar = reviewView;
