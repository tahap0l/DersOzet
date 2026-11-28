/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0. Eski tarayıcılar için çevrilmiş kopya; kaynak app/js, üreten tools/build-legacy.sh */
"use strict";
const LEVELS = [["iyi", "İyi"], ["orta", "Orta"], ["zayif", "Zayıf"]];
const LEVEL_W = { iyi: 1, orta: 2, zayif: 3 };
function studyInsights() {
  const by = {};
  Object.keys(DB.d.weeks || {}).sort().slice(-5).forEach((wk) => (DB.d.weeks[wk].tasks || []).forEach((t) => {
    if (!t.subject) return;
    const b = by[t.subject] = by[t.subject] || { n: 0, done: 0, topics: [] };
    b.n++;
    if (t.done) {
      b.done++;
      if (t.topic && !b.topics.includes(t.topic)) b.topics.push(t.topic);
    }
  }));
  const wrongs = {}, wrongTopics = {};
  (typeof NT !== "undefined" && NT.list || []).filter((n) => n.kind === "wrong" && n.status !== "learned").forEach((n) => {
    if (!n.subject) return;
    wrongs[n.subject] = (wrongs[n.subject] || 0) + 1;
    if (n.topic) {
      const w = wrongTopics[n.subject] = wrongTopics[n.subject] || {};
      w[n.topic] = (w[n.topic] || 0) + 1;
    }
  });
  Object.keys(wrongTopics).forEach((s) => {
    wrongTopics[s] = Object.entries(wrongTopics[s]).sort((a, b) => b[1] - a[1]).map((x) => x[0]).slice(0, 4);
  });
  return { by, wrongs, wrongTopics };
}
function insightLine(s, ins) {
  const b = ins.by[s], w = ins.wrongs[s], out = [];
  if (w) out.push("yanlış defterinde ".concat(w, " soru"));
  if (b && b.n >= 3) out.push("son haftalarda görevlerin %".concat(Math.round(b.done / b.n * 100), "'ı bitti"));
  return out.join(", ");
}
function planDefaults() {
  const saved = DB.d.profile.planPrefs;
  const subjects = TRACKS[DB.d.profile.track].subjects.slice();
  const P = Object.assign({ subjects, level: {}, hWk: 4, hWe: 6, days: [0, 1, 2, 3, 4, 5, 6], busy: [], exams: 1, next: false, note: "" }, saved ? JSON.parse(JSON.stringify(saved)) : {});
  P.note = "";
  if (!saved) {
    const ins = studyInsights();
    subjects.forEach((s) => {
      const b = ins.by[s];
      if ((ins.wrongs[s] || 0) >= 3 || b && b.n >= 4 && b.done / b.n < 0.5) P.level[s] = "zayif";
    });
  }
  return P;
}
const lvl = (P, s) => P.level[s] || "orta";
function dayBlocks(P, day) {
  const h = day >= 5 ? P.hWe : P.hWk;
  let n = Math.max(1, Math.round(h * 60 / 50));
  if (P.busy.includes(day)) n = Math.max(1, Math.round(n / 2));
  return Math.min(n, 12);
}
function examDays(P) {
  const ds = P.days.slice().sort((a, b) => a - b);
  if (!P.exams || !ds.length) return [];
  const pref = [5, 6, 2, 3, 4, 1, 0].filter((d) => ds.includes(d) && !P.busy.includes(d));
  return pref.slice(0, P.exams).sort((a, b) => a - b);
}
function planFormHTML() {
  const P = ui.plan = ui.plan || planDefaults();
  const p = DB.d.profile, ins = studyInsights();
  const subs = SUBJ_ORDER.filter((s) => s !== "Edebiyat" || p.track !== "SAY");
  const busy = ui.busy ? '<div class="progress"><span class="spinner" aria-hidden="true"></span><span id="ai-prog">'.concat(esc(ui.busyText || "Hazırlanıyor…"), "</span></div>") : "";
  const draft = ui.planDraft;
  const total = P.days.reduce((a, d) => a + dayBlocks(P, d), 0);
  const facts = [TRACKS[p.track] ? TRACKS[p.track].name : p.track, "YKS'ye " + daysLeft() + " gün", p.goal && p.goal.dept ? "Hedef: " + p.goal.dept : ""].filter(Boolean);
  return '\n  <section class="block plan-me">\n    <p class="pm-lead">Sana göre bir hafta kuralım. Seviyeni, boş zamanını ve yanlış defterini dikkate alırım.</p>\n    <div class="pm-facts">'.concat(facts.map((f) => '<span class="tag">'.concat(esc(f), "</span>")).join("")).concat(p.goal && p.goal.dept ? "" : '<a class="link sm" href="#/profil">Hedefini ekle</a>', '</div>\n\n    <h2 class="f-h">Dersler ve seviyen</h2>\n    <p class="hint">Zayıf dediğin derslere daha çok, iyi dediklerine daha az zaman ayrılır. Çalışmayacağın dersi kapat.</p>\n    <ul class="pm-subs">').concat(subs.map((s) => {
    const on = P.subjects.includes(s), line = insightLine(s, ins);
    return '<li class="'.concat(on ? "on" : "", '" style="--c:').concat(subjColor(s), '">\n      <button class="pm-s" data-act="pl-subj" data-s="').concat(esc(s), '" aria-pressed="').concat(on, '"><span class="pm-box" aria-hidden="true">').concat(on ? "✓" : "", "</span><span><strong>").concat(esc(s), "</strong>").concat(line ? '<span class="hint">'.concat(esc(line), "</span>") : "", "</span></button>\n      ").concat(on ? '<div class="seg small pm-lv" role="group" aria-label="'.concat(esc(s), ' seviyen">').concat(LEVELS.map(([k, n]) => '<button class="seg-b'.concat(lvl(P, s) === k ? " on" : "", '" data-act="pl-lv" data-s="').concat(esc(s), '" data-v="').concat(k, '">').concat(n, "</button>")).join(""), "</div>") : "", "\n    </li>");
  }).join(""), '</ul>\n\n    <h2 class="f-h">Günde ne kadar çalışabilirsin?</h2>\n    <label class="pm-range"><span>Hafta içi</span><input id="pl-hwk" type="range" min="1" max="10" step="0.5" value="').concat(P.hWk, '"><strong id="pl-hwk-v">').concat(nfh(P.hWk), '</strong></label>\n    <label class="pm-range"><span>Hafta sonu</span><input id="pl-hwe" type="range" min="1" max="12" step="0.5" value="').concat(P.hWe, '"><strong id="pl-hwe-v">').concat(nfh(P.hWe), '</strong></label>\n\n    <h2 class="f-h">Hangi günler çalışacaksın?</h2>\n    <div class="chips-row wrap">').concat(DAYS_S.map((d, i) => '<button class="fchip'.concat(P.days.includes(i) ? " on" : "", '" data-act="pl-day" data-i="').concat(i, '">').concat(d, "</button>")).join(""), '</div>\n    <h2 class="f-h">Dershane ya da okul yüzünden yoğun olduğun günler</h2>\n    <div class="chips-row wrap">').concat(DAYS_S.map((d, i) => '<button class="fchip'.concat(P.busy.includes(i) ? " on" : "", '" data-act="pl-busy" data-i="').concat(i, '"').concat(P.days.includes(i) ? "" : " disabled", ">").concat(d, "</button>")).join(""), '</div>\n    <p class="hint">Bu günlere daha az görev konur.</p>\n\n    <h2 class="f-h">Konu videoları</h2>\n    <label class="pm-vid"><input type="checkbox" id="pl-vid"').concat(P.videos !== false ? " checked" : "", "> Her konuya YouTube'dan yeni ve çok izlenen bir konu anlatımı ekle</label>\n    ").concat(P.videos !== false ? '<div class="pm-teach"><p class="hint">'.concat((() => {
    const l = P.subjects.map((s) => YT.teachers(s).map((n) => n + " (" + s + ")")).flat();
    return l.length ? "Önce şu hocaların videoları gelir: " + esc(l.join(", ")) : "Sevdiğin hocaları seçersen önce onların videoları gelir.";
  })(), '</p><button class="btn sm" data-act="yt-teach">').concat(YT_IC, "Hocalarını seç</button></div>") : "", '\n\n    <h2 class="f-h">Haftada kaç deneme?</h2>\n    <div class="seg small">').concat([[0, "Yok"], [1, "1"], [2, "2"]].map(([v, n]) => '<button class="seg-b'.concat(P.exams === v ? " on" : "", '" data-act="pl-exam" data-v="').concat(v, '">').concat(n, "</button>")).join(""), '</div>\n\n    <h2 class="f-h">Hangi hafta?</h2>\n    <div class="seg small"><button class="seg-b').concat(!P.next ? " on" : "", '" data-act="pl-week" data-v="0">Bu hafta</button><button class="seg-b').concat(P.next ? " on" : "", '" data-act="pl-week" data-v="1">Gelecek hafta</button></div>\n    <label class="f-h" for="pl-note">Eklemek istediğin bir şey var mı?</label>\n    <textarea id="pl-note" rows="2" placeholder="Örn. Fizikte elektriğe yeni başladık, perşembe akşamı maçım var">').concat(esc(P.note), '</textarea>\n    <p class="hint" id="pl-sum">Toplam yaklaşık ').concat(total, ' görev (her biri 50 dakika).</p>\n    <div class="row stack">\n      <button class="btn primary" data-act="pl-ai"').concat(ui.busy ? " disabled" : "", ">").concat(I.spark, 'Bana özel program hazırla</button>\n      <button class="btn" data-act="pl-quick">Hızlı plan (yapay zekâsız)</button>\n      <button class="link" data-act="pl-ext">Başka bir yapay zekâda oluştur</button>\n    </div>\n    ').concat(busy, "\n  </section>\n  ").concat(draft ? '<section class="block draft">\n    <div class="block-head"><h2>Önerilen program</h2><span class="hint">'.concat(draft.length, " görev</span></div>\n    ").concat(ui.planWhy ? '<div class="pm-why">'.concat(mascotSVG("ok", 40), "<p>").concat(esc(ui.planWhy), "</p></div>") : "", "\n    ").concat([0, 1, 2, 3, 4, 5, 6].map((di) => {
    const ts = draft.map((t, i) => Object.assign({ i }, t)).filter((t) => t.day === di);
    return ts.length ? '<h3 class="d-day">'.concat(DAYS[di], '</h3><ul class="dlist">').concat(ts.map((t) => '<li style="--c:'.concat(subjColor(t.subject), '">').concat(t.subject ? chip(t.subject) : "", '<span class="d-txt">').concat(esc(t.text)).concat(draftVid(t), '</span><button class="icon-btn ghost sm" data-act="pl-rm" data-i="').concat(t.i, '" aria-label="Bu görevi çıkar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></li>')).join(""), "</ul>") : "";
  }).join(""), '\n    <div class="row"><button class="btn primary" data-act="pl-add">Programa ekle</button><button class="btn" data-act="pl-clear">Vazgeç</button></div>\n  </section>') : "");
}
const nfh = (h) => String(h).replace(".", ",") + " saat";
function planOptions() {
  const P = ui.plan;
  const n = $("#pl-note");
  if (n) P.note = n.value.trim();
  P.subjects = P.subjects.filter((s) => SUBJ_ORDER.includes(s));
  const keep = JSON.parse(JSON.stringify(P));
  delete keep.note;
  DB.d.profile.planPrefs = keep;
  DB.save();
  return P;
}
function planPrompt(P) {
  const p = DB.d.profile, ins = studyInsights();
  const wk = P.next ? wkKey(addDays(fromKey(thisWeek()), 7)) : thisWeek();
  const w = DB.week(wk);
  const existing = w ? w.tasks.filter((t) => t.src === "dershane" || t.src === "excel").map((t) => DAYS[t.day] + ": " + t.text).slice(0, 30) : [];
  const exams = examDays(P);
  const dayLines = P.days.slice().sort((a, b) => a - b).map((d) => "- ".concat(DAYS[d], ": ").concat(dayBlocks(P, d), " görev").concat(P.busy.includes(d) ? " (dershane/okul yoğun)" : "").concat(exams.includes(d) ? " (bu görevlerden biri deneme sınavı olsun)" : "")).join("\n");
  const subjLines = P.subjects.map((s) => {
    const b = ins.by[s], done = b ? b.topics.slice(-8) : [], wt = ins.wrongTopics[s] || [];
    const todo = topicsOfSubject(s).filter((t) => !done.includes(t)).slice(0, 14);
    return "- ".concat(s, ": seviye ").concat({ iyi: "iyi", orta: "orta", zayif: "zayıf" }[lvl(P, s)]) + (done.length ? "; son haftalarda bitirdiği konular: ".concat(done.join(", ")) : "") + (wt.length ? "; yanlış defterinde biriken konular: ".concat(wt.join(", ")) : "") + (b && b.n >= 3 ? "; son haftalarda görevlerinin %".concat(Math.round(b.done / b.n * 100), "'ını bitirdi") : "") + (todo.length ? "\n  Sıradaki konu adları (aynen kullan): ".concat(todo.join(", ")) : "");
  }).join("\n");
  return "Sen YKS'ye hazırlanan öğrencilere kişisel çalışma programı hazırlayan deneyimli bir rehber öğretmensin. Tamamen Türkçe yaz.\n\nÖğrenci:\n- Adı: ".concat(firstName(p.name) || "belirtilmedi").concat(p.grade ? ", " + gradeName(p.grade) + (p.grade === "12" || p.grade === "mezun" ? " (bu yıl sınava girecek)" : " (sınava daha zamanı var; okul derslerini de dengele)") : "", ", alan: ").concat(TRACKS[p.track] ? TRACKS[p.track].name : p.track, "\n- YKS'ye ").concat(daysLeft(), " gün var").concat(p.goal && p.goal.dept ? "; hedefi: " + (p.goal.school ? p.goal.school + " " : "") + p.goal.dept : "", "\n").concat(P.note ? "- Öğrencinin notu: " + P.note + "\n" : "", "\nDersler:\n").concat(subjLines, "\n\nGünlere göre görev sayısı (her görev yaklaşık 50 dakika; bu sayılara tam uy):\n").concat(dayLines, "\n").concat(existing.length ? "\nBu hafta programında zaten olan görevler (tekrar yazma, yükü buna göre dengele):\n" + existing.join("\n") + "\n" : "", '\nKurallar:\n1. Seviyesi zayıf olan derslere orta olanlardan yaklaşık 1,5 kat, iyi olanlardan 2-3 kat fazla görev ver.\n2. Bitirdiği konuları yeniden anlatma; sıradaki konulardan devam et. Biten konular için kısa tekrar ve soru çözümü koyabilirsin.\n3. Konu çalışmasının hemen ardından aynı konudan soru çözümü koy (örn. "Mutlak Değer: 30 soru çöz").\n4. Yanlış defterinde biriken konular için haftada en az bir "yanlış defteri tekrarı" görevi koy.\n5. Aynı gün içinde en fazla 3 farklı ders olsun; zor dersleri günün başına koy. Yoğun günlerde ağır yeni konu verme.\n6. Deneme sınavı olan günde "Deneme sınavı çöz ve yanlışlarını analiz et" görevi olsun.\n7. Görev metinleri kısa ve net olsun.\n\nSADECE şu yapıda JSON döndür:\n{"aciklama":"2-3 cümle: programı neden böyle kurduğunu öğrenciye \'sen\' diye hitap ederek anlat","gunler":[{"gun":"Pazartesi","gorevler":[{"ders":"Matematik","konu":"Mutlak Değer","gorev":"Mutlak Değer: konu çalış"}]}]}');
}
function quickPlan(P) {
  const subjects = P.subjects.length ? P.subjects : TRACKS[DB.d.profile.track].subjects;
  const ins = studyInsights();
  const pool = [];
  subjects.forEach((s) => {
    for (let i = 0; i < LEVEL_W[lvl(P, s)]; i++) pool.push(s);
  });
  const order = [];
  const left = {};
  subjects.forEach((s) => {
    left[s] = LEVEL_W[lvl(P, s)];
  });
  while (order.length < pool.length) {
    subjects.slice().sort((a, b) => left[b] - left[a]).forEach((s) => {
      if (left[s] > 0) {
        order.push(s);
        left[s]--;
      }
    });
  }
  const used = /* @__PURE__ */ new Set();
  const topicQ = {};
  subjects.forEach((s) => {
    const done = ins.by[s] ? ins.by[s].topics : [];
    topicQ[s] = topicsOfSubject(s).filter((t) => !done.includes(t));
    if (!topicQ[s].length) topicQ[s] = topicsOfSubject(s);
  });
  const nextTopic = (s) => {
    const t = (topicQ[s] || []).find((x) => !used.has(s + x)) || "";
    if (t) used.add(s + t);
    return t;
  };
  const exams = examDays(P);
  const wrongSubj = Object.entries(ins.wrongs).filter(([s]) => subjects.includes(s)).sort((a, b) => b[1] - a[1]).map((x) => x[0])[0];
  let wrongDone = false, cursor = 0;
  const lastDay = Math.max(...P.days);
  const out = [];
  P.days.slice().sort((a, b) => a - b).forEach((day) => {
    let n = dayBlocks(P, day);
    if (exams.includes(day)) {
      out.push({ day, subject: "", topic: "", text: "Deneme sınavı çöz ve yanlışlarını analiz et" });
      n = Math.max(0, n - 3);
    }
    if (!wrongDone && wrongSubj && (day === 5 || day === 6 || day === lastDay) && n > 0) {
      out.push({ day, subject: wrongSubj, topic: "", text: wrongSubj + ": yanlış defterini tekrar et" });
      wrongDone = true;
      n--;
    }
    const seen = {};
    let kinds = 0;
    for (let b = 0; b < n; b++) {
      let s = order[cursor % order.length];
      cursor++;
      if (!seen[s] && kinds >= 3) {
        const k = Object.keys(seen);
        s = k[b % k.length];
      }
      if (!seen[s]) {
        kinds++;
        const t = nextTopic(s);
        seen[s] = t || true;
        out.push({ day, subject: s, topic: t, text: t ? s + ": " + t + " konu çalış" : s + ": konu çalış" });
      } else {
        const t = typeof seen[s] === "string" ? seen[s] : "";
        out.push({ day, subject: s, topic: t, text: s + ": " + (t ? t + " " : "") + "30 soru çöz" });
      }
    }
  });
  return out;
}
function planFromJSON(j) {
  if (!j) return null;
  const days = Array.isArray(j.gunler) ? j.gunler : Array.isArray(j.days) ? j.days : null;
  if (!days) return null;
  const lc = DAYS.map((d) => d.toLocaleLowerCase("tr"));
  const out = [];
  days.forEach((d) => {
    const di = lc.indexOf(String(d.gun || d.day || "").toLocaleLowerCase("tr").trim());
    if (di < 0) return;
    (d.gorevler || d.tasks || []).forEach((t) => {
      const text = String(t.gorev || t.task || "").trim();
      if (!text) return;
      out.push({ day: di, subject: canonSubject(t.ders || t.subject || ""), topic: String(t.konu || t.topic || "").trim(), text });
    });
  });
  return out.length ? out : null;
}
const planWhyOf = (j) => j && typeof (j.aciklama || j.explanation) === "string" ? String(j.aciklama || j.explanation).trim().slice(0, 600) : "";
function draftVid(t) {
  if (!YT.wants(t) || ui.plan && ui.plan.videos === false) return "";
  const v = YT.of(t);
  if (v) return '<a class="d-vid" href="'.concat(ytUrl(v.id), '" target="_blank" rel="noopener">').concat(YT_IC, "<span>").concat(esc(v.ch || "YouTube")).concat(v.len ? " · " + esc(v.len) : "").concat(v.age ? " · " + esc(v.age) : "", "</span></a>");
  return ui.vidBusy ? '<span class="d-vid wait">Video aranıyor…</span>' : "";
}
function planVideos() {
  if (!ui.planDraft || ui.plan && ui.plan.videos === false || ENV === "artifact") return;
  ui.vidBusy = true;
  const paint = () => {
    if (route.page === "asistan" && (route.arg || "") === "plan" && !ui.busy) render();
  };
  let last = 0;
  YT.fill(ui.planDraft, () => {
    const n = Date.now();
    if (n - last > 400) {
      last = n;
      paint();
    }
  }).then(() => {
    ui.vidBusy = false;
    paint();
  });
}
const planCheck = () => {
  const P = planOptions();
  if (!P.subjects.length || !P.days.length) {
    toast("En az bir ders ve bir gün seç.");
    return null;
  }
  return P;
};
Object.assign(ACT, {
  "pl-subj": (el) => {
    const P = ui.plan, s = el.dataset.s;
    P.subjects = P.subjects.includes(s) ? P.subjects.filter((x) => x !== s) : P.subjects.concat([s]);
    planOptions();
    render();
  },
  "pl-lv": (el) => {
    ui.plan.level[el.dataset.s] = el.dataset.v;
    planOptions();
    render();
  },
  "pl-day": (el) => {
    const P = ui.plan, i = Number(el.dataset.i);
    P.days = P.days.includes(i) ? P.days.filter((x) => x !== i) : P.days.concat([i]);
    P.busy = P.busy.filter((x) => P.days.includes(x));
    planOptions();
    render();
  },
  "pl-busy": (el) => {
    const P = ui.plan, i = Number(el.dataset.i);
    P.busy = P.busy.includes(i) ? P.busy.filter((x) => x !== i) : P.busy.concat([i]);
    planOptions();
    render();
  },
  "pl-exam": (el) => {
    ui.plan.exams = Number(el.dataset.v);
    planOptions();
    render();
  },
  "pl-week": (el) => {
    ui.plan.next = el.dataset.v === "1";
    planOptions();
    render();
  },
  "pl-vid": () => {
  },
  "pl-quick": () => {
    const P = planCheck();
    if (!P) return;
    ui.planWhy = "Seviyene göre dağıttım: zayıf derslerine daha çok blok koydum, bitirdiğin konuları atladım" + (P.exams ? ", deneme günlerini hafta sonuna yerleştirdim" : "") + ". İstemediğin görevi çarpıyla çıkarabilirsin.";
    acceptPlan(quickPlan(P));
    planVideos();
  },
  "pl-ai": () => {
    const P = planCheck();
    if (!P) return;
    aiRun(planPrompt(P), (j) => {
      const list = planFromJSON(j);
      if (!list) {
        render();
        toast("Yapay zekâ geçerli bir program yazamadı. Tekrar dene ya da Hızlı plan kullan.");
        return;
      }
      ui.planWhy = planWhyOf(j);
      acceptPlan(list);
      planVideos();
    }, { maxTokens: 4e3 });
  },
  "pl-ext": () => {
    const P = planCheck();
    if (!P) return;
    extSheet("Başka bir yapay zekâda oluştur", planPrompt(P), (j) => {
      const list = planFromJSON(j);
      if (!list) return false;
      ui.planWhy = planWhyOf(j);
      acceptPlan(list);
      planVideos();
      return true;
    });
  }
});
document.addEventListener("input", (e) => {
  const t = e.target;
  if ((t.id === "pl-hwk" || t.id === "pl-hwe") && ui.plan) {
    ui.plan[t.id === "pl-hwk" ? "hWk" : "hWe"] = Number(t.value);
    const v = $("#" + t.id + "-v");
    if (v) v.textContent = nfh(Number(t.value));
    const sm = $("#pl-sum");
    if (sm) sm.textContent = "Toplam yaklaşık " + ui.plan.days.reduce((a, d) => a + dayBlocks(ui.plan, d), 0) + " görev (her biri 50 dakika).";
  }
  if (t.id === "pl-note" && ui.plan) ui.plan.note = t.value;
});
document.addEventListener("change", (e) => {
  if ((e.target.id === "pl-hwk" || e.target.id === "pl-hwe") && ui.plan) planOptions();
  if (e.target.id === "pl-vid" && ui.plan) {
    ui.plan.videos = e.target.checked;
    planOptions();
    render();
  }
});
