/*!
 * Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
 * motivation.js: renk temaları, hedef, günün sözü, rozetler ve günlük hedefler.
 */
'use strict';

/* ---------- renk temaları ---------- */
const PALETTES = [
  { id: 'lavanta', name: 'Lavanta', note: 'Sakin ve yumuşak', sw: ['#6A4BD6', '#E8E1FC'], theme: '#F4F1FB', dark: '#15111F' },
  { id: 'okyanus', name: 'Okyanus', note: 'Serin ve odaklı', sw: ['#2D6CDF', '#DFEAFE'], theme: '#F1F5FC', dark: '#10151F' },
  { id: 'nane', name: 'Nane', note: 'Taze ve dingin', sw: ['#1E7F5C', '#DBF3E9'], theme: '#F0F8F4', dark: '#0F1814' },
  { id: 'mandalina', name: 'Mandalina', note: 'Sıcak ve enerjik', sw: ['#B85A0E', '#FDE9D3'], theme: '#FCF6EF', dark: '#1A140D' },
  { id: 'gul', name: 'Gül', note: 'Canlı ve neşeli', sw: ['#C2417A', '#FADDEA'], theme: '#FBF2F6', dark: '#1A1016' }
];
const paletteOf = id => PALETTES.find(p => p.id === id) || PALETTES[0];

/* ---------- toplamlar ---------- */
function totals(){
  const days = DB.d.stats.days;
  let tasks = 0, focus = 0;
  Object.values(days).forEach(d => { tasks += d.tasks || 0; focus += d.focus || 0; });
  return { tasks, focus, fullDays: Object.keys(DB.d.stats.full || {}).length, plans: DB.d.stats.plans || 0, imports: DB.d.stats.imports || 0, own: Object.keys(DB.d.userSums).length, best: streakInfo().best };
}
function weekProgress(wk){
  const w = DB.week(wk); if (!w || !w.tasks.length) return null;
  const done = w.tasks.filter(t => t.done).length;
  return { done, total: w.tasks.length, pct: Math.round(done / w.tasks.length * 100) };
}

/* ---------- haftaya bakış ---------- */
const weekSig = w => (w && w.tasks ? w.tasks.map(t => t.day + ':' + t.text).join('|') : '');
function weekAuto(wk){
  const w = DB.week(wk); if (!w || !w.tasks.length) return null;
  const subj = {};
  w.tasks.forEach(t => {
    const k = t.subject || '';
    const s = subj[k] = subj[k] || { subject: k, tasks: 0, done: 0, videos: 0, topics: {} };
    s.tasks++; if (t.done) s.done++; if (t.type === 'video') s.videos++;
    if (t.topic){ const sl = topicSlug(t.subject, t.topic); s.topics[sl] = { slug: sl, name: t.topic, ready: !!sumFor(sl) }; }
  });
  const list = Object.values(subj).sort((a, b) => (a.subject ? 0 : 1) - (b.subject ? 0 : 1) || b.tasks - a.tasks || subjRank(a.subject) - subjRank(b.subject));
  const perDay = [0, 1, 2, 3, 4, 5, 6].map(d => w.tasks.filter(t => t.day === d).length);
  const busiest = perDay.indexOf(Math.max.apply(null, perDay));
  const topics = [].concat(...list.map(s => Object.values(s.topics)));
  const missing = topics.filter(t => !t.ready).map(t => t.name);
  const videos = w.tasks.filter(t => t.type === 'video').length;
  const named = list.filter(s => s.subject);
  const top = named.slice(0, 3).map(s => s.subject);
  const summary = `Bu hafta ${w.tasks.length} görevin var${top.length ? '; en çok ' + top.join(', ') + (named.length > 3 ? ' ve ' + (named.length - 3) + ' ders daha' : '') : ''}. ` +
    (videos ? videos + ' video izleyeceksin. ' : '') + (topics.length ? (missing.length ? topics.length + ' konunun ' + (topics.length - missing.length) + ' tanesinin özeti hazır.' : topics.length + ' konunun hepsinin özeti hazır.') : '');
  const pr = [];
  pr.push(DAYS[busiest] + ' en yoğun günün (' + perDay[busiest] + ' görev); önceki akşam hazırlığını yap.');
  const heavy = named.filter(s => s.tasks - s.done > 0).sort((a, b) => (b.tasks - b.done) - (a.tasks - a.done))[0];
  if (heavy) pr.push(heavy.subject + ' bu haftanın ağırlığı: ' + (heavy.tasks - heavy.done) + ' görev bekliyor.');
  if (missing.length) pr.push('Özeti olmayan konular: ' + missing.slice(0, 4).join(', ') + (missing.length > 4 ? ' ve ' + (missing.length - 4) + ' konu daha' : '') + '. Asistandan özet çıkarabilirsin.');
  return { summary, priorities: pr, subjects: list };
}

/* ---------- rozetler ---------- */
const BADGES = [
  { id: 'ilk-adim', name: 'İlk adım', how: 'İlk görevini bitir', ok: t => t.tasks >= 1 },
  { id: 'tam-gun', name: 'Eksiksiz gün', how: 'Bir günün bütün görevlerini bitir', ok: t => t.fullDays >= 1 },
  { id: 'seri-3', name: 'Üç gün üst üste', how: '3 günlük seri yap', ok: t => t.best >= 3 },
  { id: 'odak-ilk', name: 'İlk odak turu', how: 'Bir odak turunu tamamla', ok: t => t.focus >= 10 },
  { id: 'hedef', name: 'Hedefim belli', how: 'Profilde hedef bölümünü yaz', ok: () => !!(DB.d.profile.goal && DB.d.profile.goal.dept) },
  { id: 'planci', name: 'Planlı çalışan', how: 'Asistanla bir plan oluştur', ok: t => t.plans >= 1 },
  { id: 'seri-7', name: 'Bir hafta aralıksız', how: '7 günlük seri yap', ok: t => t.best >= 7 },
  { id: 'gorev-50', name: 'Elli görev', how: 'Toplam 50 görev bitir', ok: t => t.tasks >= 50 },
  { id: 'odak-10', name: 'On saat odak', how: 'Toplam 10 saat odaklan', ok: t => t.focus >= 600 },
  { id: 'kitaplik', name: 'Kendi kitaplığım', how: 'Kendi konu özetini çıkar', ok: t => t.own >= 1 },
  { id: 'tam-7', name: 'Yedi eksiksiz gün', how: '7 günün bütün görevlerini bitir', ok: t => t.fullDays >= 7 },
  { id: 'seri-30', name: 'Bir ay aralıksız', how: '30 günlük seri yap', ok: t => t.best >= 30 },
  { id: 'gorev-200', name: 'İki yüz görev', how: 'Toplam 200 görev bitir', ok: t => t.tasks >= 200 },
  { id: 'odak-50', name: 'Elli saat odak', how: 'Toplam 50 saat odaklan', ok: t => t.focus >= 3000 }
];
function checkBadges(){
  if (!DB.d || !DB.d.onboarded) return;
  const got = DB.d.stats.badges = DB.d.stats.badges || {};
  const t = totals(), fresh = [];
  BADGES.forEach(b => { if (!got[b.id] && b.ok(t)){ got[b.id] = dayKey(); fresh.push(b); } });
  if (!fresh.length) return;
  DB.save();
  const b = fresh[fresh.length - 1];
  setTimeout(() => toast('Yeni rozet: ' + b.name + (fresh.length > 1 ? ' ve ' + (fresh.length - 1) + ' rozet daha' : '')), 350);
}

/* ---------- günün sözü: kişiye göre seçilir ---------- */
const MOTTOS = [
  n => `${n}, bugün yaptığın küçük işler sınav günü büyük fark eder.`,
  n => `Bugün tek bir konuyu gerçekten bitir, ${n}. Gerisi kendiliğinden gelir.`,
  () => 'Zor soru seni durdurmasın; işaretle, devam et, sonra geri dön.',
  n => `Dün nerede kaldıysan oradan devam, ${n}. Sıfırdan başlamana gerek yok.`,
  () => 'Bir saat odak, üç saat dağınık çalışmadan daha çok şey öğretir.',
  n => `Yorulduğunda dinlen, ${n}; bırakmak yok.`,
  () => 'Yanlışların sana neyi tekrar etmen gerektiğini söylüyor. Onları dinle.',
  n => `Sınav günü bugünün emeğini hatırlayacaksın, ${n}.`,
  () => 'Mükemmel bir gün bekleme. İyi bir gün yeter.',
  n => `Her biten görev seni hedefine bir adım daha yaklaştırıyor, ${n}.`
];
function mottoFor(o){
  const p = DB.d.profile, n = esc(firstName(p.name) || 'Sen');
  const g = p.goal || {};
  const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
  if (o.allDone) return `Bugünkü bütün görevlerin bitti, ${n}. Bu tempoyla ${g.dept ? esc(g.dept) + ' çok uzakta değil' : 'hedefine yaklaşıyorsun'}.`;
  if (o.streak >= 3 && doy % 2 === 0) return `${o.streak} gündür aralıksız çalışıyorsun. Zinciri bugün de koparma.`;
  if (g.dept && doy % 3 === 1) return `${g.school ? esc(g.school) + ' ' : ''}${esc(g.dept)} seni bekliyor. Bugünkü görevlerin o yolun bir parçası.`;
  if (o.left > 0 && o.left <= 100 && doy % 3 === 2) return `Son ${o.left} gün. Haftada birkaç konu, ${Math.ceil(o.left / 7)} hafta. Yetişir.`;
  return MOTTOS[doy % MOTTOS.length](n);
}
