/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
 *
 * youtube.js: programdaki konulara YouTube ders videosu. Program hazırlanınca her konu için
 * yeni ve çok izlenen bir konu anlatımı bulunur; öğrencinin seçtiği hocaların videoları önce gelir.
 * Görevdeki "YouTube'da izle" düğmesi videoyu doğrudan YouTube'da (telefonda uygulamada) açar.
 */
'use strict';

const YT_SEED = {
  Matematik: ['Rehber Matematik', 'Bıyıklı Matematik', 'Mert Hoca'],
  Fizik: ['Altuğ Güneş FİZİK', 'Fizikle Barış', 'VIP FİZİK']
};
const ytNorm = s => String(s || '').toLocaleLowerCase('tr').replace(/[çğıöşüâîû]/g, c => ASCII_TR[c] || c).replace(/[^a-z0-9]+/g, '');
const YT = {
  busy: {},
  store(){ if (!DB.d.vids || typeof DB.d.vids !== 'object') DB.d.vids = {}; return DB.d.vids; },
  chans(){ if (!DB.d.ytCh || typeof DB.d.ytCh !== 'object') DB.d.ytCh = {}; return DB.d.ytCh; },
  teachers(subject){ const t = DB.d.profile.teachers || {}; return Array.isArray(t[subject]) ? t[subject] : []; },
  setTeachers(subject, list){ DB.d.profile.teachers = Object.assign({}, DB.d.profile.teachers || {}, { [subject]: list.slice(0, 3) }); DB.save(); },
  key(t){ const base = t.topic || String(t.label || t.text || '').replace(/\b(izle|dinle|konu (çalış|anlatımı)|video)\b/gi, ''); return ytNorm(t.subject) + '|' + ytNorm(base).slice(0, 60); },
  query(t){ return (t.topic || String(t.label || t.text || '').replace(/^[^:]{2,20}:\s*/, '').replace(/\b(izle|dinle|konu çalış|video(su)?|tekrar et)\b/gi, '')).replace(/\s+/g, ' ').trim().slice(0, 100); },
  /* bu göreve video uyar mı: konu çalışması ya da izleme görevi; soru, deneme, tekrar değil */
  wants(t){
    if (!t || t.src === 'focus') return false;
    const ty = t.type || guessTask(t.text || '').type;
    if (ty === 'video') return true;
    if (!t.topic || ty === 'soru' || /deneme|yanlış defter/i.test(t.text || '')) return false;
    return true;
  },
  of(t){ if (t.vid) return { id: t.vid, title: t.vt || '', ch: t.vc || '' }; const e = this.store()[this.key(t)]; return e && e.v ? e.v : null; },
  async find(t, force){
    const k = this.key(t), st = this.store(), e = st[k];
    if (!force && e && e.v && Date.now() - e.at < 30 * 864e5) return e.v;
    if (this.busy[k]) return this.busy[k];
    const q = this.query(t); if (q.length < 2) return null;
    const tea = this.teachers(t.subject);
    const url = '/api/yt?q=' + encodeURIComponent(q) + (t.subject ? '&s=' + encodeURIComponent(t.subject) : '') + (tea.length ? '&t=' + encodeURIComponent(tea.join('|')) : '');
    this.busy[k] = (async () => {
      try {
        const r = await fetch(new URL(url, location.origin)); if (!r.ok) return null;
        const j = await r.json(); const list = j.videos || [];
        this.learn(t.subject, list);
        const v = list[0]; if (!v) return null;
        st[k] = { at: Date.now(), v: { id: v.id, title: v.title, ch: v.ch, len: v.len, age: v.age } };
        // en fazla 300 kayıt
        const ks = Object.keys(st); if (ks.length > 300) ks.sort((a, b) => st[a].at - st[b].at).slice(0, ks.length - 300).forEach(x => delete st[x]);
        DB.save();
        return st[k].v;
      } catch(e){ return null; } finally { delete this.busy[k]; }
    })();
    return this.busy[k];
  },
  /* aramalarda görülen kanallar hoca önerisi olur */
  learn(subject, list){
    if (!subject || !list.length) return;
    const c = this.chans(), m = c[subject] = c[subject] || {};
    list.forEach(v => { if (v.ch) m[v.ch.trim()] = (m[v.ch.trim()] || 0) + 1; });
    const top = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 12); c[subject] = Object.fromEntries(top);
  },
  suggestions(subject){
    const mine = this.teachers(subject).map(ytNorm);
    const seen = Object.entries(this.chans()[subject] || {}).sort((a, b) => b[1] - a[1]).map(x => x[0]);
    const all = Array.from(new Set(seen.concat(YT_SEED[subject] || [])));
    return all.filter(n => !mine.includes(ytNorm(n))).slice(0, 6);
  },
  /* taslaktaki konulara video bul: aynı anda 3 istek */
  async fill(list, onEach){
    const todo = []; const seen = new Set();
    list.forEach(t => { if (this.wants(t)){ const k = this.key(t); if (!seen.has(k)){ seen.add(k); todo.push(t); } } });
    let i = 0;
    const worker = async () => { while (i < todo.length){ const t = todo[i++]; await this.find(t); if (onEach) onEach(); } };
    await Promise.all([worker(), worker(), worker()]);
  }
};

const ytUrl = id => 'https://www.youtube.com/watch?v=' + encodeURIComponent(id);
/* görev satırında video düğmesi */
function taskVideoHTML(wk, t){
  if (ENV === 'artifact' || !YT.wants(t)) return '';
  const v = YT.of(t);
  if (v) return `<a class="tlink yt" href="${ytUrl(v.id)}" target="_blank" rel="noopener" title="${esc(v.title + (v.ch ? ' · ' + v.ch : ''))}">${YT_IC}YouTube'da izle</a>`;
  return `<button class="tlink yt soft" data-act="yt-open" data-k="${wk}|${esc(t.id)}">${YT_IC}YouTube'da aç</button>`;
}
const YT_IC = '<svg viewBox="0 0 24 24" aria-hidden="true" class="yt-ic"><path d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8Z" fill="currentColor" stroke="none"/><path d="m10 15 5.2-3L10 9Z" fill="#fff" stroke="none"/></svg>';

/* hoca seçimi: plan formunda ve profilde */
function teachersHTML(subjects){
  return `<div class="yt-teach">${subjects.map(s => { const mine = YT.teachers(s), sug = YT.suggestions(s);
    return `<div class="yt-row" style="--c:${subjColor(s)}"><p class="yt-s">${esc(s)}</p>
      <div class="chips-row wrap">${mine.map(n => `<span class="fchip on">${esc(n)}<button class="x" data-act="yt-t-rm" data-s="${esc(s)}" data-n="${esc(n)}" aria-label="${esc(n)} hocasını çıkar">×</button></span>`).join('')}
      ${mine.length < 3 ? sug.map(n => `<button class="fchip" data-act="yt-t-add" data-s="${esc(s)}" data-n="${esc(n)}">+ ${esc(n)}</button>`).join('') + `<button class="fchip ghost" data-act="yt-t-new" data-s="${esc(s)}">+ Başka kanal</button>` : ''}</div></div>`; }).join('')}</div>`;
}
async function ytDiscover(subjects){
  const need = subjects.filter(s => !Object.keys(YT.chans()[s] || {}).length && !(YT_SEED[s] || []).length);
  for (const s of need.slice(0, 4)){
    try { const r = await fetch(new URL('/api/yt?q=' + encodeURIComponent('TYT AYT ' + s) + '&s=' + encodeURIComponent(s), location.origin)); if (r.ok){ const j = await r.json(); YT.learn(s, j.videos || []); } } catch(e){}
  }
  if (need.length) DB.save();
  return need.length > 0;
}
function teachersSheet(){
  const subs = (ui.plan && ui.plan.subjects && ui.plan.subjects.length ? ui.plan.subjects : TRACKS[DB.d.profile.track].subjects);
  const box = openSheet('YouTube hocaların', `<p class="hint">Programına konu videosu eklenirken bu kanalların videoları önce gelir. Her ders için en fazla 3 kanal seçebilirsin.</p><div id="yt-tb">${teachersHTML(subs)}</div>`);
  ytDiscover(subs).then(ch => { if (ch && sheetEl){ const b = $('#yt-tb'); if (b) b.innerHTML = teachersHTML(subs); } });
  return box;
}
const ytRepaint = () => { const b = $('#yt-tb'); if (b){ const subs = (ui.plan && ui.plan.subjects && ui.plan.subjects.length ? ui.plan.subjects : TRACKS[DB.d.profile.track].subjects); b.innerHTML = teachersHTML(subs); } else render(); };

Object.assign(ACT, {
  'yt-teach': () => teachersSheet(),
  'yt-t-add': el => { const s = el.dataset.s; YT.setTeachers(s, YT.teachers(s).concat([el.dataset.n])); ytRepaint(); },
  'yt-t-rm': el => { const s = el.dataset.s; YT.setTeachers(s, YT.teachers(s).filter(n => n !== el.dataset.n)); ytRepaint(); },
  'yt-t-new': el => {
    const s = el.dataset.s, row = el.closest('.chips-row');
    if (!row || row.querySelector('input')) return;
    el.insertAdjacentHTML('beforebegin', `<span class="yt-new"><input class="input sm" maxlength="40" placeholder="Kanal ya da hoca adı" aria-label="${esc(s)} için kanal adı"><button class="btn sm primary">Ekle</button></span>`);
    const inp = row.querySelector('.yt-new input'), go = () => { const n = inp.value.trim(); if (n){ YT.setTeachers(s, YT.teachers(s).concat([n])); ytRepaint(); } };
    inp.focus(); inp.addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); go(); } });
    row.querySelector('.yt-new .btn').addEventListener('click', go);
  },
  /* videosu henüz bulunmamış görev: pencereyi hemen aç, video bulununca oraya yönlendir */
  'yt-open': async el => {
    const [wk, id] = el.dataset.k.split('|'), w = DB.week(wk), t = w && w.tasks.find(x => x.id === id);
    if (!t) return;
    let win = null; try { win = window.open('about:blank', '_blank'); } catch(e){}
    el.disabled = true; el.innerHTML = YT_IC + 'Video aranıyor…';
    const v = await YT.find(t);
    if (v){ t.vid = v.id; t.vt = v.title; t.vc = v.ch; DB.save(); }
    const url = v ? ytUrl(v.id) : 'https://www.youtube.com/results?search_query=' + encodeURIComponent(YT.query(t) + ' ' + (t.subject || '') + ' konu anlatımı');
    if (win && !win.closed) win.location.href = url; else location.href = url;
    render();
  }
});
