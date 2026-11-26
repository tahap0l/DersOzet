/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
 *
 * mascot.js: Mürek. Mor bir mürekkep damlası; gözlüklü, meraklı, biraz da inatçı.
 * Bugünün konularını hatırlatır, konulardan soru sorar, yapay zekâ açıksa sohbet eder.
 * Hatırlatmalar kurallarla yazılır, yapay zekâ gerekmez.
 */
'use strict';

const MASCOT = { name: 'Mürek' };

function mascotSVG(mood, size){
  mood = mood || 'ok';
  const eyes = mood === 'happy'
    ? '<path class="m-eye" d="M37 66q6-7 12 0M71 66q6-7 12 0" fill="none" stroke="#2A1D52" stroke-width="3.4" stroke-linecap="round"/>'
    : mood === 'sleepy'
      ? '<path class="m-eye" d="M37 67h12M71 67h12" stroke="#2A1D52" stroke-width="3.4" stroke-linecap="round"/>'
      : '<g class="m-eye"><circle cx="43" cy="66" r="5.2" fill="#2A1D52"/><circle cx="77" cy="66" r="5.2" fill="#2A1D52"/><circle cx="45" cy="64" r="1.7" fill="#fff"/><circle cx="79" cy="64" r="1.7" fill="#fff"/></g>';
  const mouth = mood === 'sleepy' ? '<ellipse cx="60" cy="86" rx="4" ry="3" fill="#2A1D52"/>'
    : mood === 'think' ? '<path d="M53 87q7-3 14 1" fill="none" stroke="#2A1D52" stroke-width="3" stroke-linecap="round"/>'
    : '<path d="M50 84q10 9 20 0" fill="none" stroke="#2A1D52" stroke-width="3.2" stroke-linecap="round"/>';
  return `<svg class="mascot m-${mood}" viewBox="0 0 120 124" style="width:${size || 72}px;height:${Math.round((size || 72) * 124 / 120)}px" role="img" aria-label="${MASCOT.name}">
    <ellipse cx="60" cy="119" rx="30" ry="4" fill="var(--m-shadow,rgba(60,40,140,.14))"/>
    <path d="M60 6C49 24 20 48 20 76c0 23 18 40 40 40s40-17 40-40C100 48 71 24 60 6Z" fill="var(--m-body,#8C6CF0)"/>
    <path d="M60 6C49 24 20 48 20 76c0 6 1 11 3 16 4-27 22-55 37-86Z" fill="var(--m-shade,#7656E4)" opacity=".55"/>
    <ellipse cx="44" cy="40" rx="5" ry="9" transform="rotate(28 44 40)" fill="#fff" opacity=".45"/>
    <ellipse cx="32" cy="80" rx="6" ry="4" fill="#FF9EC0" opacity=".55"/><ellipse cx="88" cy="80" rx="6" ry="4" fill="#FF9EC0" opacity=".55"/>
    <g fill="none" stroke="#2A1D52" stroke-width="2.6"><circle cx="43" cy="66" r="11.5" fill="rgba(255,255,255,.55)"/><circle cx="77" cy="66" r="11.5" fill="rgba(255,255,255,.55)"/><path d="M54.5 65q5.5-4 11 0"/></g>
    ${eyes}${mouth}
  </svg>`;
}

function mascotMood(){
  const h = new Date().getHours(), di = todayIdx(), w = DB.week(thisWeek());
  const ts = w ? w.tasks.filter(t => t.day === di) : [];
  if (ts.length && ts.every(t => t.done)) return 'happy';
  if (h >= 23 || h < 6) return 'sleepy';
  return 'ok';
}

function todayTopics(){
  const w = DB.week(thisWeek()), di = todayIdx(), seen = new Set(), out = [];
  (w ? w.tasks.filter(t => t.day === di) : []).forEach(t => {
    if (!t.topic) return;
    const slug = topicSlug(t.subject, t.topic);
    if (seen.has(slug)) return; seen.add(slug);
    out.push({ slug, subject: t.subject, name: t.topic, done: t.done, sum: sumFor(slug) });
  });
  return out;
}

const joinTr = a => a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' ve ' + a[a.length - 1];

function mascotLines(){
  const p = DB.d.profile, di = todayIdx(), w = DB.week(thisWeek());
  const ts = w ? w.tasks.filter(t => t.day === di) : [];
  const tops = todayTopics(), open = ts.filter(t => !t.done);
  const h = new Date().getHours();
  const name = p.name ? firstName(p.name) : '';
  if (!ts.length){
    const tom = w ? w.tasks.filter(t => t.day === (di + 1) % 7 && t.topic) : [];
    if (w && w.tasks.length) return [`Bugün programında görev yok${name ? ', ' + name : ''}.`, tom.length ? `Yarın ${joinTr(tom.slice(0, 2).map(t => t.topic))} var; istersen bugün özetine bir göz at.` : 'Dinlen, ya da geçen haftanın yanlışlarına dön.'];
    return ['Bu hafta için programın yok.', Cloud.school.some(m => m.role === 'student') ? 'Hocan programı yükleyince burada göreceksin. O zamana kadar kendi planını yapabilirsin.' : 'Excel programını yükle ya da birlikte bir plan yapalım.'];
  }
  if (!open.length) return [`Bugünkü ${ts.length} görevin hepsi bitti${name ? ', ' + name : ''}!`, 'Yarın da böyle devam. Yatmadan önce 5 dakika bugünün konularını hatırlamak kalıcılığı artırır.'];
  const lines = [];
  if (tops.length) lines.push(`Bugün ${tops.length === 1 ? 'konun' : 'konuların'}: ${joinTr(tops.slice(0, 3).map(t => t.name))}${tops.length > 3 ? ' ve ' + (tops.length - 3) + ' konu daha' : ''}.`);
  else lines.push(`Bugün ${ts.length} görevin var.`);
  const first = open[0];
  const fs = first.topic && sumFor(topicSlug(first.subject, first.topic));
  if (h < 12) lines.push(fs ? `Başlamadan ${first.topic} özetine 5 dakika göz at, sonra soruya geç.` : `İlk iş: ${sentence(first.label || first.text)}.`);
  else if (h < 19) lines.push(open.length === ts.length ? `Daha başlamadık. ${sentence(first.label || first.text)} ile açalım mı?` : `${ts.length - open.length} görev bitti, ${open.length} kaldı. Sıradaki: ${sentence(first.label || first.text)}.`);
  else lines.push(`Akşam oldu; ${open.length} görev kaldı. Hepsine yetişmezse en az ${first.topic || 'ilk görevi'} bitir.`);
  return lines;
}

function mascotCard(say){
  const tops = todayTopics().filter(t => t.sum);
  const qs = tops.reduce((a, t) => a + ((t.sum.summary.questions || []).length), 0);
  const lines = say || mascotLines();
  const wd = typeof NT !== 'undefined' ? NT.due().length : 0;
  if (wd) lines.push(`Yanlış defterinde bugün ${wd} soru seni bekliyor.`);
  const sim = typeof simsFor === 'function' ? todayTopics().map(t => [t, simsFor(t.slug)[0]]).find(x => x[1]) : null;
  if (sim) lines.push(`${sim[0].name} için laboratuvarda bir deney var: ${sim[1].title}. Kurcalayınca daha iyi oturur.`);
  return `<section class="mascot-card" aria-label="${MASCOT.name}">
    <div class="mc-face">${mascotSVG(mascotMood(), 76)}</div>
    <div class="mc-b">
      <p class="mc-name">${MASCOT.name}</p>
      <div class="bubble">${lines.map(l => `<p>${esc(l)}</p>`).join('')}</div>
      <div class="mc-acts">
        ${tops.length ? `<button class="mc-btn" data-act="m-topics">Konuları hatırlat</button>` : ''}
        ${qs ? `<button class="mc-btn" data-act="m-quiz">Beni sına</button>` : ''}
        ${wd ? `<button class="mc-btn" data-act="m-wrongs">Yanlışları tekrar et</button>` : ''}
        ${sim ? `<a class="mc-btn" href="#/lab/${sim[1].id}">Deneyi aç</a>` : ''}
        <button class="mc-btn" data-act="m-chat">Sor</button>
      </div>
    </div>
  </section>`;
}

/* ---------- sayfalar ---------- */
function mTopicsSheet(){
  const tops = todayTopics().filter(t => t.sum);
  openSheet('Bugünün konuları', `<div class="m-head">${mascotSVG('ok', 44)}<p>Her konudan en önemli birkaç şey. Ayrıntı için özeti aç.</p></div>
    ${tops.map(t => { const s = t.sum.summary || {}; const pts = (s.formulas || []).slice(0, 2).map(f => typeof f === 'string' ? f : (f.name ? f.name + ': ' : '') + (f.formula || f.f || '')).concat((s.mistakes || []).slice(0, 2).map(m => 'Dikkat: ' + m));
      return `<article class="m-topic" style="--c:${subjColor(t.subject)}">
        <p class="m-t">${chip(t.subject)}<strong>${esc(t.name)}</strong></p>
        ${s.oneLiner ? `<p>${esc(s.oneLiner)}</p>` : ''}
        ${pts.length ? `<ul>${pts.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        <a class="tlink" href="#/konu/${encodeURIComponent(t.slug)}">Özeti aç</a>${typeof simsFor === 'function' ? simsFor(t.slug).map(x => ` <a class="tlink" href="#/lab/${x.id}">Deney: ${esc(x.title)}</a>`).join('') : ''}
      </article>`; }).join('')}`);
}

function mQuizSheet(){
  const tops = todayTopics().filter(t => t.sum);
  const qs = [];
  tops.forEach(t => (t.sum.summary.questions || []).forEach(q => qs.push({ q: q.q, a: q.a, topic: t.name, subject: t.subject })));
  for (let i = qs.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [qs[i], qs[j]] = [qs[j], qs[i]]; }
  const list = qs.slice(0, 6), miss = new Set();
  let i = 0, ok = 0;
  const box = openSheet('Mürek soruyor', '<div id="mq"></div>');
  const paint = () => {
    const el = $('#mq', box);
    if (i >= list.length){
      el.innerHTML = `<div class="m-head">${mascotSVG(ok >= list.length * .7 ? 'happy' : 'think', 52)}<p><strong>${list.length} sorudan ${ok} tanesini bildin.</strong> ${miss.size ? 'Tekrar bakman gerekenler: ' + esc(joinTr(Array.from(miss))) + '.' : 'Bugünün konuları sağlam görünüyor.'}</p></div>
        <div class="row"><button class="btn primary" id="mq-again">Yeniden sor</button></div>`;
      $('#mq-again', box).addEventListener('click', () => { closeSheet(); mQuizSheet(); });
      return;
    }
    const q = list[i];
    el.innerHTML = `<p class="hint">${i + 1}/${list.length} · ${esc(q.subject)}, ${esc(q.topic)}</p>
      <p class="mq-q">${esc(q.q)}</p>
      <div class="mq-a" id="mq-a" hidden><p>${esc(q.a)}</p></div>
      <div class="row" id="mq-c"><button class="btn primary" id="mq-show">Cevabı göster</button></div>`;
    $('#mq-show', box).addEventListener('click', () => {
      $('#mq-a', box).hidden = false;
      $('#mq-c', box).innerHTML = '<button class="btn primary" id="mq-y">Bildim</button><button class="btn" id="mq-n">Tekrar bakmalıyım</button>';
      $('#mq-y', box).addEventListener('click', () => { ok++; i++; paint(); });
      $('#mq-n', box).addEventListener('click', () => { miss.add(q.topic); i++; paint(); });
    });
  };
  paint();
}

const mChat = { msgs: [] };
function mChatSheet(){
  const tops = todayTopics();
  const ctx = tops.map(t => `${t.subject} - ${t.name}${t.sum && t.sum.summary.oneLiner ? ': ' + t.sum.summary.oneLiner : ''}`).join('\n');
  const sys = `Sen Mürek'sin: Ders Özetim uygulamasının maskotu, mor bir mürekkep damlası. YKS'ye hazırlanan bir öğrenciye Türkçe, kısa (en fazla 5 cümle), sıcak ve net cevaplar verirsin. Bilmediğin bir şeyi uydurmazsın; emin değilsen ders kitabına bakmasını söylersin. Öğrencinin adı: ${DB.d.profile.name || 'bilinmiyor'}. Bugünün konuları:\n${ctx || 'Bugün konu yok.'}`;
  if (!AI.ready()){
    openSheet('Mürek\'e sor', `<div class="m-head">${mascotSVG('think', 52)}<p>Sohbet için bir yapay zekâ seçmen gerekiyor. Ücretsiz seçenekler var: bu cihazda çalışan model ya da Ollama.</p></div>
      <div class="row"><a class="btn primary" href="#/asistan/ayar">Yapay zekâyı seç</a></div>
      <p class="hint">Konuları hatırlatma ve soru sorma, yapay zekâ olmadan da çalışır.</p>`);
    return;
  }
  const box = openSheet('Mürek\'e sor', `<div class="m-chat" id="mc-log">${mChat.msgs.length ? '' : `<div class="m-head">${mascotSVG('ok', 44)}<p>Bugünün konularıyla ilgili ne sormak istersin?</p></div>`}</div>
    <form class="m-form" id="mc-f"><input id="mc-i" class="input" maxlength="400" placeholder="Örn. Kaldırma kuvveti neden yoğunluğa bağlı?" autocomplete="off" autofocus><button class="btn primary">Gönder</button></form>`);
  const log = $('#mc-log', box);
  const paint = () => { log.innerHTML = mChat.msgs.map(m => `<p class="mc-msg ${m.role}">${esc(m.content)}</p>`).join('') || log.innerHTML; log.scrollTop = log.scrollHeight; };
  if (mChat.msgs.length) paint();
  $('#mc-f', box).addEventListener('submit', async e => {
    e.preventDefault();
    const inp = $('#mc-i', box), q = inp.value.trim(); if (!q) return;
    inp.value = ''; mChat.msgs.push({ role: 'user', content: q }); mChat.msgs.push({ role: 'assistant', content: '…' }); paint();
    const last = mChat.msgs[mChat.msgs.length - 1];
    try {
      const hist = mChat.msgs.slice(0, -1).slice(-8);
      const txt = await AI.chat([{ role: 'system', content: sys }].concat(hist), { maxTokens: 500, onText: s => { last.content = stripThink(s); paint(); } });
      last.content = stripThink(txt).trim() || 'Bunu cevaplayamadım, başka türlü sorar mısın?';
    } catch(err){ last.content = 'Şu an cevap veremiyorum. Yapay zekâ ayarlarına bir bak.'; }
    if (document.contains(log)) paint();
  });
}

Object.assign(ACT, {
  'm-topics': () => mTopicsSheet(),
  'm-quiz': () => mQuizSheet(),
  'm-chat': () => go('#/asistan/sor')
});
