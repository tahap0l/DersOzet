/*!
 * Ders Özetim — YKS / YDS çalışma arkadaşı
 * Copyright (C) 2026 Esat Taha Polat — https://github.com/tahap0l/DersOzet
 * GNU Affero General Public License v3.0 altında lisanslanmıştır (LICENSE dosyasına bak).
 *
 * core.js: yardımcılar, Excel okuma, görev/konu eşleştirme, veri deposu, seri ve plan oluşturucu.
 */
'use strict';

const APP = { name: 'Ders Özetim', author: 'Esat Taha Polat', repo: 'https://github.com/tahap0l/DersOzet', version: '3.10.2' };
const ENV = window.DO_ENV || 'web'; // 'web': Cloudflare / GitHub sürümü, 'artifact': claude.ai yapıtı
const CAP = { sample: null, downloads: null };

/* ---------- genel yardımcılar ---------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const clone = o => JSON.parse(JSON.stringify(o));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const DAYS_S = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const MONTHS_LC = MONTHS.map(m => m.toLocaleLowerCase('tr'));
const TR_MAP = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'â': 'a', 'î': 'i', 'û': 'u' };

/* Ders renkleri: mor temaya uyan yumuşak pastel tonlar */
const SUBJECTS = {
  'Türkçe': '#F6C4DA', 'Edebiyat': '#F6C4DA', 'Matematik': '#F8E28F', 'Geometri': '#F9CDA0',
  'Fizik': '#AFD9F4', 'Kimya': '#BDE7B4', 'Biyoloji': '#AEE5D9', 'Tarih': '#D8CBFF',
  'Coğrafya': '#FFC4BE', 'Felsefe': '#E4D6FF', 'Din Kültürü': '#FFD9CC', 'İngilizce': '#C8D1FF'
};
const SUBJ_ORDER = Object.keys(SUBJECTS);
const OTHER_COLOR = '#E5DFF2';
const subjColor = s => SUBJECTS[s] || OTHER_COLOR;
const subjRank = s => { const i = SUBJ_ORDER.indexOf(s); return i < 0 ? 99 : i; };
const TRACKS = {
  SAY: { name: 'Sayısal', subjects: ['Türkçe', 'Matematik', 'Geometri', 'Fizik', 'Kimya', 'Biyoloji'] },
  EA: { name: 'Eşit ağırlık', subjects: ['Türkçe', 'Matematik', 'Geometri', 'Edebiyat', 'Tarih', 'Coğrafya'] },
  SOZ: { name: 'Sözel', subjects: ['Türkçe', 'Edebiyat', 'Tarih', 'Coğrafya', 'Felsefe', 'Din Kültürü'] },
  DIL: { name: 'Dil', subjects: ['Türkçe', 'İngilizce', 'Matematik'] },
  TYT: { name: 'Sadece TYT', subjects: ['Türkçe', 'Matematik', 'Geometri', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya'] }
};

function slugify(s){ return String(s || '').toLocaleLowerCase('tr').replace(/[çğıöşüâîû]/g, c => TR_MAP[c]).normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90); }
function topicSlug(subject, topic){ return (slugify(subject) || 'genel') + '--' + (slugify(topic) || 'konu'); }
function sentence(s){ const l = String(s).toLocaleLowerCase('tr'); return l.charAt(0).toLocaleUpperCase('tr') + l.slice(1); }
function titleCase(s){ return String(s).toLocaleLowerCase('tr').split(/\s+/).filter(Boolean).map(w => w.charAt(0).toLocaleUpperCase('tr') + w.slice(1)).join(' '); }
const normName = s => String(s || '').toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();
function safeName(s){ return String(s).replace(/[\\/:*?"<>|\n\r]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100) || 'ozet'; }
function canonSubject(s){
  const t = String(s || '').trim(); if (!t) return '';
  const l = t.toLocaleLowerCase('tr');
  if (l.includes('edebiyat')) return 'Edebiyat';
  if (/türk|paragraf|dil ?bilgisi/.test(l)) return 'Türkçe';
  if (l.includes('geometri')) return 'Geometri';
  if (/matematik|^mat$/.test(l)) return 'Matematik';
  if (l.includes('fizik')) return 'Fizik';
  if (l.includes('kimya')) return 'Kimya';
  if (l.includes('biyoloji')) return 'Biyoloji';
  if (l.includes('tarih')) return 'Tarih';
  if (l.includes('coğrafya')) return 'Coğrafya';
  if (l.includes('felsefe')) return 'Felsefe';
  if (l.includes('din')) return 'Din Kültürü';
  if (/ingilizce|english/.test(l)) return 'İngilizce';
  return t.charAt(0).toLocaleUpperCase('tr') + t.slice(1);
}

/* ---------- tarih ---------- */
function mondayOf(d){ const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
function wkKey(d){ return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function fromKey(k){ const p = String(k).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
function addDays(d, n){ const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function fmtDay(d){ return d.getDate() + ' ' + MONTHS[d.getMonth()]; }
function weekRange(k){
  const a = fromKey(k), b = addDays(a, 6);
  return a.getMonth() === b.getMonth() ? a.getDate() + '–' + b.getDate() + ' ' + MONTHS[b.getMonth()] : fmtDay(a) + ' – ' + fmtDay(b);
}
const thisWeek = () => wkKey(mondayOf(new Date()));
const dayKey = d => wkKey(d || new Date());
const todayIdx = () => (new Date().getDay() + 6) % 7;

/* ---------- Excel (.xlsx) okuma: fflate ile zip açılır, XML elle okunur ---------- */
function readXlsx(buf){
  const want = /^xl\/(workbook\.xml|_rels\/workbook\.xml\.rels|sharedStrings\.xml|worksheets\/sheet\d+\.xml)$/;
  const files = fflate.unzipSync(new Uint8Array(buf), { filter: f => want.test(f.name) });
  const dec = new TextDecoder('utf-8');
  const xml = n => files[n] ? new DOMParser().parseFromString(dec.decode(files[n]), 'application/xml') : null;
  const textOf = node => Array.from(node.getElementsByTagName('t')).filter(t => !t.parentNode || t.parentNode.nodeName !== 'rPh').map(t => t.textContent).join('').replace(/_x000D_/g, '');
  const shared = [];
  const sx = xml('xl/sharedStrings.xml');
  if (sx) Array.from(sx.getElementsByTagName('si')).forEach(si => shared.push(textOf(si)));
  let sheets = Object.keys(files).filter(n => /worksheets\/sheet\d+\.xml$/.test(n))
    .sort((a, b) => parseInt(a.match(/(\d+)\.xml$/)[1], 10) - parseInt(b.match(/(\d+)\.xml$/)[1], 10));
  const wb = xml('xl/workbook.xml'), rels = xml('xl/_rels/workbook.xml.rels');
  if (wb && rels){
    const map = {};
    Array.from(rels.getElementsByTagName('Relationship')).forEach(r => { map[r.getAttribute('Id')] = 'xl/' + String(r.getAttribute('Target') || '').replace(/^\/?xl\//, '').replace(/^\//, ''); });
    const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    const order = Array.from(wb.getElementsByTagName('sheet')).map(s => map[s.getAttributeNS(R, 'id') || s.getAttribute('r:id')]).filter(n => n && files[n]);
    if (order.length) sheets = order;
  }
  const colIdx = ref => { const m = /^([A-Z]+)/.exec(ref || ''); if (!m) return -1; let n = 0; for (const ch of m[1]) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; };
  return sheets.map(name => {
    const doc = xml(name), rows = [];
    Array.from(doc.getElementsByTagName('row')).forEach((row, ri) => {
      const r = (parseInt(row.getAttribute('r'), 10) || ri + 1) - 1, out = [];
      Array.from(row.getElementsByTagName('c')).forEach((c, ci) => {
        const i = colIdx(c.getAttribute('r')); const col = i < 0 ? ci : i;
        const t = c.getAttribute('t'); const v = c.getElementsByTagName('v')[0];
        let val = '';
        if (t === 's') val = v ? (shared[parseInt(v.textContent, 10)] || '') : '';
        else if (t === 'inlineStr') { const is = c.getElementsByTagName('is')[0]; val = is ? textOf(is) : ''; }
        else val = v ? v.textContent : '';
        out[col] = val;
      });
      for (let k = 0; k < out.length; k++) if (out[k] == null) out[k] = '';
      rows[r] = out;
    });
    for (let k = 0; k < rows.length; k++) if (!rows[k]) rows[k] = [];
    return rows;
  });
}

/* ---------- haftalık program tablosunu çözme ---------- */
function findWeekStart(txt){
  const lc = String(txt).toLocaleLowerCase('tr');
  const now = new Date();
  const nearest = (d, m, yHint) => {
    const years = yHint ? [yHint] : [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
    let best = null;
    years.forEach(y => { const x = new Date(y, m, d); if (x.getMonth() !== m || x.getDate() !== d) return; if (!best || Math.abs(x - now) < Math.abs(best - now)) best = x; });
    return best;
  };
  let m = lc.match(new RegExp('(\\d{1,2})\\s*[./-]?\\s*(' + MONTHS_LC.join('|') + ')'));
  if (m){ const d = nearest(Number(m[1]), MONTHS_LC.indexOf(m[2])); if (d) return wkKey(mondayOf(d)); }
  m = lc.match(/(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
  if (m){ let y = Number(m[3]); if (y < 100) y += 2000; const d = nearest(Number(m[1]), Number(m[2]) - 1, y); if (d) return wkKey(mondayOf(d)); }
  return null;
}
function parseProgram(rows){
  const norm = v => String(v == null ? '' : v).toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();
  const dayLc = DAYS.map(d => d.toLocaleLowerCase('tr'));
  const dayOf = v => { const n = norm(v).replace(/[:.]$/, ''); return dayLc.indexOf(n); };
  const splitTasks = v => String(v == null ? '' : v).split(/\r?\n/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const all = rows.map(r => (r || []).map(v => String(v == null ? '' : v)).join('\n')).join('\n');
  const tasks = [];
  let student = '', hr = -1, cols = {};
  for (let r = 0; r < rows.length && hr < 0; r++){
    const m = {}; (rows[r] || []).forEach((v, ci) => { const di = dayOf(v); if (di >= 0 && !(di in m)) m[di] = ci; });
    if (Object.keys(m).length >= 3){ hr = r; cols = m; }
  }
  if (hr >= 0){
    const header = rows[hr] || [];
    const nameCol = header.findIndex(v => { const n = norm(v); return n.includes('öğrenci') || n.includes('adı'); });
    for (let r = hr + 1; r < rows.length; r++){
      const row = rows[r] || [];
      if (!Object.values(cols).some(ci => String(row[ci] == null ? '' : row[ci]).trim())) continue;
      if (nameCol >= 0 && !student) student = String(row[nameCol] || '').trim();
      Object.keys(cols).map(Number).sort().forEach(di => splitTasks(row[cols[di]]).forEach(text => tasks.push({ day: di, text })));
    }
  } else {
    let found = false;
    rows.forEach(row => {
      row = row || [];
      const ci = row.findIndex(v => dayOf(v) >= 0);
      if (ci < 0) return;
      found = true;
      const di = dayOf(row[ci]);
      row.forEach((v, j) => { if (j !== ci) splitTasks(v).forEach(text => tasks.push({ day: di, text })); });
    });
    if (!found) return null;
  }
  if (!tasks.length) return null;
  const lm = all.toLocaleLowerCase('tr').match(/(\d{1,2})\s*\.?\s*hafta/);
  tasks.sort((a, b) => a.day - b.day);
  return { tasks, student: student ? sentence(student) : '', label: lm ? lm[1] + '. Hafta' : '', monday: findWeekStart(all) };
}
function guessTask(text){
  const u = String(text).toLocaleUpperCase('tr');
  const type = /\bDİNLE\b|\bİZLE\b/.test(u) ? 'video' : /SORU|PROBLEM|ÇÖZ|TEST|DENEME/.test(u) ? 'soru' : /TEKRAR/.test(u) ? 'tekrar' : /DERSHANE|OKUL DERS/.test(u) ? 'ders' : 'diger';
  const rules = [[/PARAGRAF|TÜRKÇE|DİL ?BİLGİSİ/, 'Türkçe'], [/ÜÇGEN|GEOMETRİ|ÇEMBER|DÖRTGEN/, 'Geometri'], [/MATEMATİK|EBOB|EKOK|BÖLÜNEBİLME|PROBLEM/, 'Matematik'], [/BASINÇ|BASINCI|FİZİK/, 'Fizik'], [/KİMYA|PERİYODİK/, 'Kimya'], [/BİYOLOJİ|BİOSEM/, 'Biyoloji'], [/İNGİLİZCE|ENGLISH|YDS|KELİME/, 'İngilizce'], [/TARİH/, 'Tarih'], [/COĞRAFYA/, 'Coğrafya'], [/EDEBİYAT/, 'Edebiyat']];
  const hit = rules.find(r => r[0].test(u));
  return { type, subject: hit ? hit[1] : '' };
}

/* ---------- görev metnini konu kitaplığıyla eşleştirme ---------- */
const ASCII_TR = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'â': 'a', 'î': 'i', 'û': 'u' };
function stemWords(text){
  const t = String(text || '').toLocaleLowerCase('tr').replace(/[çğıöşüâîû]/g, c => ASCII_TR[c]).replace(/[^a-z0-9]+/g, ' ').trim();
  return t ? t.split(' ') : [];
}
const TYPO = { esnekar: 'eskenar', eskenarr: 'eskenar' };
function wordsOf(text){
  const base = stemWords(text).filter(w => w !== 'hallet').map(w => TYPO[w] || w);
  const pairs = [];
  for (let i = 0; i + 1 < base.length; i++) pairs.push(base[i] + base[i + 1]);
  return base.concat(pairs);
}
function topicKey(name){
  return stemWords(name).filter(w => w.length >= 3).map(w => w.length <= 3 ? { w, exact: true } : { w: w.slice(0, 5), exact: false });
}
function subjStem(sj){ return stemWords(sj).map(w => w.slice(0, 5))[0] || ''; }
function libraryMatch(tasks, idx){
  const names = Object.values(idx || {}).filter(x => x && x.name).map(x => ({ subject: x.subject || '', name: x.name, key: topicKey(x.match || x.name) }))
    .filter(x => x.key.length && x.key.reduce((a, k) => a + k.w.length, 0) >= 4);
  const weight = x => x.key.length * 100 + x.key.reduce((n, k) => n + k.w.length, 0);
  const freq = {};
  names.forEach(x => x.key.forEach(k => { if (!k.exact && k.w.length >= 5){ (freq[k.w] = freq[k.w] || new Set()).add(normName(x.name)); } }));
  const cands = t => {
    const words = wordsOf(t.text), stems = words.map(w => w.slice(0, 5));
    let all = names.filter(x => x.key.every(k => k.exact ? words.includes(k.w) : stems.includes(k.w)));
    if (!all.length) all = names.filter(x => x.key.some(k => !k.exact && k.w.length >= 5 && freq[k.w] && freq[k.w].size === 1 && stems.includes(k.w)) && !(x.subject && t.subject && x.subject !== t.subject));
    if (!all.length) return { top: [], stems };
    const mx = Math.max.apply(null, all.map(weight));
    return { top: all.filter(x => weight(x) === mx), stems };
  };
  const known = {};
  const first = tasks.map(t => {
    if (t.topic) return { t, done: null, c: null };
    const c = cands(t);
    if (!c.top.length) return { t, done: null, c: null };
    const bySubj = c.top.filter(x => x.subject && (x.subject === t.subject || c.stems.includes(subjStem(x.subject))));
    if (bySubj.length){ known[bySubj[0].name] = bySubj[0].subject; return { t, done: bySubj[0] }; }
    if (new Set(c.top.map(x => x.subject)).size === 1){ if (c.top[0].subject) known[c.top[0].name] = c.top[0].subject; return { t, done: c.top[0] }; }
    return { t, done: null, c };
  });
  let hits = 0;
  const out = first.map(r => {
    let h = r.done;
    if (!h && r.c) h = r.c.top.find(x => !x.subject) || r.c.top.find(x => x.subject && known[x.name] === x.subject) || r.c.top[0];
    if (!h) return r.t;
    hits++;
    return Object.assign({}, r.t, { topic: h.name, subject: h.subject || r.t.subject });
  });
  return { tasks: out, hits };
}

/* ---------- konu kitaplığı (hazır özetler + kendi özetlerin) ---------- */
let LIB = window.DO_LIBRARY || { summaries: {}, topics: {} };
function libIndex(){
  const idx = Object.assign({}, LIB.topics);
  Object.values(DB.d.userSums).forEach(s => { idx[s.slug] = { subject: s.subject || '', name: s.name }; });
  return idx;
}
const sumFor = slug => DB.d.userSums[slug] || LIB.summaries[slug] || null;
function allTopics(){
  const out = {};
  Object.keys(LIB.summaries).forEach(k => { const s = LIB.summaries[k]; out[k] = { slug: k, subject: s.subject || '', name: s.name, mine: false }; });
  Object.keys(DB.d.userSums).forEach(k => { const s = DB.d.userSums[k]; out[k] = { slug: k, subject: s.subject || '', name: s.name, mine: true }; });
  return Object.values(out).sort((a, b) => subjRank(a.subject) - subjRank(b.subject) || a.name.localeCompare(b.name, 'tr'));
}
function topicsOfSubject(subj){ return Object.values(libIndex()).filter(t => t.subject === subj).map(t => t.name).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a.localeCompare(b, 'tr')); }
function normalizeSummary(r){
  if (!r || typeof r !== 'object' || Array.isArray(r)) return null;
  const s = v => typeof v === 'string' ? v.trim() : (typeof v === 'number' ? String(v) : '');
  const arr = v => Array.isArray(v) ? v : [];
  const sections = arr(r.sections || r.bolumler).map(t => ({ title: s(t && (t.title || t.baslik)), explanation: s(t && (t.explanation || t.aciklama)), points: arr(t && (t.points || t.noktalar)).map(s).filter(Boolean), example: s(t && (t.example || t.ornek)) })).filter(t => t.title || t.explanation);
  const overview = s(r.overview || r.genel);
  if (!sections.length && !overview) return null;
  return {
    title: s(r.title || r.baslik), oneLiner: s(r.oneLiner || r.ozet), overview, sections,
    formulas: arr(r.formulas || r.formuller).map(f => ({ name: s(f && (f.name || f.ad)), formula: s(f && (f.formula || f.formul)), note: s(f && (f.note || f.not)) })).filter(f => f.formula),
    terms: arr(r.terms || r.kavramlar).map(t => ({ term: s(t && (t.term || t.kavram)), definition: s(t && (t.definition || t.tanim)) })).filter(t => t.term),
    mistakes: arr(r.mistakes || r.hatalar).map(s).filter(Boolean),
    questions: arr(r.questions || r.sorular).map(q => ({ q: s(q && (q.q || q.soru)), a: s(q && (q.a || q.cevap)) })).filter(q => q.q),
    studyTip: s(r.studyTip || r.ipucu)
  };
}

/* ---------- veri deposu (yalnızca bu cihazda, localStorage) ---------- */
/* kaçıncı sınıf */
const GRADES = [['9', '9. sınıf'], ['10', '10. sınıf'], ['11', '11. sınıf'], ['12', '12. sınıf'], ['mezun', 'Mezun']];
const gradeName = g => { const x = GRADES.find(r => r[0] === String(g || '')); return x ? x[1] : ''; };
const firstName = n => String(n || '').trim().split(/\s+/)[0] || '';
/* ad ve soyad en az iki kelime mi */
/* hoca mı öğrenci mi: hocaya sınıf ve alan sorulmaz; adının yanında branşı ya da "Hoca" yazar */
const BRANCHES = ['Matematik', 'Geometri', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Edebiyat', 'Tarih', 'Coğrafya', 'Felsefe', 'Din Kültürü', 'İngilizce', 'Rehberlik'];
const isTeacher = p => (p || DB.d.profile).kind === 'teacher';
const whoTag = p => !p ? '' : p.kind === 'teacher' ? (p.branch ? p.branch + ' hocası' : 'Hoca') : gradeName(p.grade);
const fullNameOk = n => String(n || '').trim().split(/\s+/).filter(w => w.length >= 2).length >= 2;

const DB = {
  KEY: 'dersozetim.v4',
  d: null,
  blank(){
    return {
      v: 4,
      profile: { name: '', kind: '', branch: '', track: 'SAY', yks: '', city: null, theme: 'auto', sound: true, palette: 'lavanta', goal: { school: '', dept: '' }, why: '', dailyFocus: 120 },
      weeks: {}, stats: { days: {}, badges: {}, full: {}, plans: 0, imports: 0 },
      focus: { focus: 25, brk: 5, long: 15 },
      timer: { mode: 'focus', left: 25 * 60, endAt: 0, running: false, rounds: 0, roundsDay: '' },
      sw: { running: false, startAt: 0, acc: 0 },
      userSums: {},
      ai: { engine: 'bulut', v2: true, model: 'Qwen3.5-2B-q4f16_1-MLC', ollamaUrl: 'http://localhost:11434', ollamaModel: '' },
      onboarded: false
    };
  },
  normalize(d){
    const base = this.blank();
    const aiV2 = !!(d.ai && d.ai.v2);
    ['profile', 'focus', 'timer', 'sw', 'ai', 'stats'].forEach(k => { d[k] = Object.assign({}, base[k], d[k] || {}); });
    if (!aiV2){ if (d.ai.engine !== 'ollama' && ENV !== 'artifact') d.ai.engine = 'bulut'; d.ai.v2 = true; }
    d.v = 4; d.weeks = d.weeks || {}; d.userSums = d.userSums || {}; d.stats.days = d.stats.days || {};
    return d;
  },
  load(){
    let d = null;
    try { d = JSON.parse(localStorage.getItem(this.KEY)); } catch(e){}
    if (!d){ d = this.blank(); this.migrateV3(d); }
    this.d = this.normalize(d);
  },
  save(urgent){
    this.d.mtime = Date.now();
    Sync.schedule();
    if (typeof Cloud !== 'undefined' && Cloud.uid) Cloud.schedulePush(urgent ? 0 : undefined);
    return this.persist();
  },
  persist(){
    try { localStorage.setItem(this.KEY, JSON.stringify(this.d)); return true; }
    catch(e){ if (!Sync.col && !(typeof Cloud !== 'undefined' && Cloud.uid) && window.toast) toast('Cihaz depolaması dolu; son değişiklik kaydedilemedi. Profil > Yedeği indir ile verini kaydet.'); return false; }
  },
  migrateV3(d){
    try {
      const v3 = JSON.parse(localStorage.getItem('dersozetim.v3') || 'null');
      if (v3 && v3.weeks){
        const sid = Object.keys(v3.weeks)[0];
        const name = sid && v3.students && v3.students[sid] ? v3.students[sid].name : '';
        Object.entries(v3.weeks[sid] || {}).forEach(([wk, w]) => {
          d.weeks[wk] = { label: w.label || '', fileName: w.fileName || '', importedAt: w.importedAt || Date.now(),
            tasks: (w.tasks || []).map(t => Object.assign({}, t, { done: !!(w.done || {})[t.id], src: /^m/.test(t.id) ? 'el' : 'excel' })) };
        });
        if (name){ d.profile.name = name.split(' ')[0]; d.onboarded = true; }
      }
      const st = JSON.parse(localStorage.getItem('dersozetim.stats.v1') || 'null');
      if (st && st.days){ d.stats.days = st.days; if (st.yks) d.profile.yks = st.yks; }
    } catch(e){}
  },
  week(wk){ return this.d.weeks[wk] || null; },
  ensureWeek(wk){ return this.d.weeks[wk] || (this.d.weeks[wk] = { label: '', fileName: '', importedAt: Date.now(), tasks: [] }); },
  task(wk, id){ const w = this.week(wk); return w ? w.tasks.find(t => t.id === id) : null; }
};

/* ---------- claude.ai yapıtında: verileri hesabına kaydet, cihazlar arasında eşitle ---------- */
const Sync = {
  col: null, last: {}, timer: null, busy: false, again: false, err: false,
  async init(){
    if (ENV !== 'artifact' || !window.claude || typeof window.claude.use !== 'function') return null;
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    if (!db || !user) return null;
    const id = await user.id(); if (!id) return null;
    const col = db.collection('data/users/' + id);
    const snap = await Promise.race([col.get(), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000))]);
    this.col = col;
    const docs = {};
    snap.docs.forEach(x => { if (x.exists) docs[x.id] = x.data(); });
    return docs;
  },
  split(d){
    const out = {}, st = Object.assign({}, d);
    delete st.weeks; delete st.userSums;
    out.state = st;
    Object.keys(d.weeks).forEach(k => { out['w-' + k] = d.weeks[k]; });
    Object.keys(d.userSums).forEach(k => { out['s-' + k] = d.userSums[k]; });
    return out;
  },
  join(docs){
    const d = Object.assign({}, docs.state || {}); d.weeks = {}; d.userSums = {};
    Object.keys(docs).forEach(k => { if (k.startsWith('w-')) d.weeks[k.slice(2)] = docs[k]; else if (k.startsWith('s-')) d.userSums[k.slice(2)] = docs[k]; });
    return d;
  },
  remember(d){ const parts = this.split(d); this.last = {}; Object.keys(parts).forEach(k => { this.last[k] = JSON.stringify(parts[k]); }); },
  schedule(){ if (!this.col) return; clearTimeout(this.timer); this.timer = setTimeout(() => { this.timer = null; this.flush(); }, 700); },
  async flush(){
    if (!this.col) return;
    if (this.busy){ this.again = true; return; }
    this.busy = true;
    try {
      const parts = this.split(DB.d);
      const keys = new Set(Object.keys(parts).concat(Object.keys(this.last)));
      for (const k of keys){
        const js = parts[k] ? JSON.stringify(parts[k]) : null;
        if (js === this.last[k]) continue;
        if (js){ await this.col.doc(k).set(JSON.parse(js)); this.last[k] = js; }
        else { await this.col.doc(k).delete(); delete this.last[k]; }
      }
      this.err = false;
    } catch(e){ this.err = true; }
    finally { this.busy = false; if (this.again){ this.again = false; this.schedule(); } }
  },
};

/* ---------- seri ve günlük istatistik ---------- */
function bump(day, kind, n){
  const d = DB.d.stats.days[day] = DB.d.stats.days[day] || { tasks: 0, focus: 0 };
  d[kind] = Math.max(0, (d[kind] || 0) + n);
}
const dayActive = k => { const d = DB.d.stats.days[k]; return !!d && (d.tasks > 0 || d.focus >= 10); };
function streakInfo(){
  let cur = 0; const d = new Date();
  if (!dayActive(dayKey(d))) d.setDate(d.getDate() - 1);
  while (dayActive(dayKey(d))){ cur++; d.setDate(d.getDate() - 1); }
  let best = 0, run = 0, prev = null;
  Object.keys(DB.d.stats.days).sort().forEach(k => {
    if (!dayActive(k)) return;
    run = prev && Math.round((fromKey(k) - fromKey(prev)) / 864e5) === 1 ? run + 1 : 1; prev = k; best = Math.max(best, run);
  });
  return { cur, best, today: dayActive(dayKey()) };
}
const YKS_GUESS = '2027-06-19';
const yksDate = () => DB.d.profile.yks || YKS_GUESS;
function daysLeft(){ const n = new Date(); n.setHours(0, 0, 0, 0); return Math.max(0, Math.round((fromKey(yksDate()) - n) / 864e5)); }

/* ---------- hava durumu (Open-Meteo, anahtar gerektirmez) ---------- */
const WX = { data: null, loading: false };
function wxKind(code, temp){
  if ([95, 96, 99].includes(code)) return 'firtina';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'kar';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'yagmur';
  if ([45, 48].includes(code)) return 'sis';
  if (temp >= 30) return 'sicak';
  if (temp <= 4) return 'soguk';
  if (code >= 1 && code <= 3) return 'bulut';
  return 'acik';
}
const WX_TEXT = {
  acik: { name: 'Açık', lines: ['Hava güzel. 25 dakika odak, 5 dakika cam kenarı. Adil bir takas.', 'Güneş var; molada pencereyi aç, beynin oksijen sever.', 'Açık bir gün. Zor dersi sabaha koy, güneş seni desteklesin.'] },
  bulut: { name: 'Bulutlu', lines: ['Bulutlu ve sakin. Uzun bir odak turu için ideal hava.', 'Gri bir gün; en sevdiğin dersle ısın, sonra zor olana geç.', 'Bulutlar dışarıda kalsın, kafan açık olsun.'] },
  yagmur: { name: 'Yağmurlu', lines: ['Yağmur var. Test kitabını poşete koy; ıslanan sayfalar birbirine yapışıyor.', 'Şemsiyeni al, defterini çantanın en içine koy.', 'Yağmurlu gün, ev içi çalışma günü. Bahane yok.'] },
  kar: { name: 'Karlı', lines: ['Kar yağıyor. Pencereden bakmak serbest; paragraf soruları seni bekliyor.', 'Karda yürüyecek sen, ıslanmasın diye kitapların çantada kalsın.', 'Sıcak bir içecek, kalın çorap ve bir deneme. Kış planı hazır.'] },
  firtina: { name: 'Fırtınalı', lines: ['Fırtına var. Telefonunu şarj et, özetlerin PDF olarak yanında olsun.', 'Elektrik gidebilir; bugünün özetini önceden indir.', 'Dışarısı gürültülü, sen kulaklığını tak ve odaklan.'] },
  sis: { name: 'Sisli', lines: ['Sis var. Kafan da bulanıksa önce kısa bir tekrarla başla.', 'Görüş az; yola çıkarken dikkat, masada odak.', 'Sisli sabah, net bir plan: bugünkü görevlerine bir göz at.'] },
  sicak: { name: 'Sıcak', lines: ['Sıcak. Su şişeni masada tut; susuz beyin formül unutuyor.', 'Güneşin tepede olduğu saatlerde serin bir köşede çalış.', 'Hava sıcak, molalar kısa ama sık olsun.'] },
  soguk: { name: 'Soğuk', lines: ['Soğuk. Çayını demle; deneme çözmenin tam havası.', 'Dışarısı soğuk, masan sıcak olsun. Battaniye serbest, uyku yasak.', 'Ellerin üşümesin, kalemi sıkı tut.'] }
};
async function loadWeather(force){
  const c = DB.d.profile.city; if (!c || WX.loading) return;
  const cached = WX.data || (() => { try { return JSON.parse(localStorage.getItem('dersozetim.wx')); } catch(e){ return null; } })();
  if (!force && cached && cached.lat === c.lat && cached.lon === c.lon && Date.now() - cached.at < 30 * 60 * 1000){ WX.data = cached; return; }
  WX.loading = true;
  try {
    const u = 'https://api.open-meteo.com/v1/forecast?latitude=' + c.lat + '&longitude=' + c.lon + '&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=1';
    const r = await fetch(u); if (!r.ok) throw new Error('wx');
    const j = await r.json();
    WX.data = { lat: c.lat, lon: c.lon, at: Date.now(), temp: Math.round(j.current.temperature_2m), code: j.current.weather_code,
      max: Math.round(j.daily.temperature_2m_max[0]), min: Math.round(j.daily.temperature_2m_min[0]), rain: j.daily.precipitation_probability_max ? j.daily.precipitation_probability_max[0] : null };
    try { localStorage.setItem('dersozetim.wx', JSON.stringify(WX.data)); } catch(e){}
  } catch(e){ WX.data = cached || null; WX.error = true; }
  finally { WX.loading = false; }
}
async function searchCity(q){
  const r = await fetch('https://geocoding-api.open-meteo.com/v1/search?count=6&language=tr&format=json&name=' + encodeURIComponent(q));
  if (!r.ok) throw new Error('geo');
  const j = await r.json();
  return (j.results || []).map(x => ({ name: x.name, region: [x.admin1, x.country].filter(Boolean).join(', '), lat: Math.round(x.latitude * 100) / 100, lon: Math.round(x.longitude * 100) / 100 }));
}
