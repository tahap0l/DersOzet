/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0. Eski tarayıcılar için çevrilmiş kopya; kaynak app/js, üreten tools/build-legacy.sh */
"use strict";
const fmtNet = (x) => {
  const r = Math.round((Number(x) || 0) * 100) / 100;
  return String(r).replace(".", ",");
};
const fmtMin = (m) => {
  m = Math.round(m || 0);
  const h = Math.floor(m / 60), r = m % 60;
  return h ? h + " sa" + (r ? " " + r + " dk" : "") : r + " dk";
};
const newId = () => crypto.randomUUID && crypto.randomUUID() || "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx".replace(/x/g, () => Math.floor(Math.random() * 16).toString(16));
const trDate = (k) => {
  const d = fromKey(k);
  return d.getDate() + " " + MONTHS[d.getMonth()];
};
I.chart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V4M4 20h16"/><path d="m7 15 4-4 3 3 5-6"/></svg>';
I.share = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
I.bell = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4S6 15 6 10Z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>';
I.camera = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/></svg>';
const EXAM_DEF = {
  TYT: [["Türkçe", 40], ["Tarih", 5], ["Coğrafya", 5], ["Felsefe", 5], ["Din Kültürü", 5], ["Matematik", 40], ["Fizik", 7], ["Kimya", 7], ["Biyoloji", 6]],
  "AYT-SAY": [["Matematik", 40], ["Fizik", 14], ["Kimya", 13], ["Biyoloji", 13]],
  "AYT-EA": [["Matematik", 40], ["Edebiyat", 24], ["Tarih", 10], ["Coğrafya", 6]],
  "AYT-SOZ": [["Edebiyat", 24], ["Tarih", 10], ["Coğrafya", 6], ["Tarih-2", 11], ["Coğrafya-2", 11], ["Felsefe", 12], ["Din Kültürü", 6]],
  YDT: [["İngilizce", 80]]
};
const SET_NAME = { TYT: "TYT", "AYT-SAY": "AYT Sayısal", "AYT-EA": "AYT Eşit ağırlık", "AYT-SOZ": "AYT Sözel", YDT: "YDT İngilizce" };
const kindOf = (set) => set.split("-")[0];
const defaultAyt = () => ({ SAY: "AYT-SAY", EA: "AYT-EA", SOZ: "AYT-SOZ" })[DB.d.profile.track] || "AYT-SAY";
const myExams = () => (DB.d.exams || []).slice().sort((a, b) => b.on.localeCompare(a.on) || String(b.at || 0).localeCompare(String(a.at || 0)));
const examsOf = (set) => myExams().filter((e) => e.set === set);
const netOf = (d, y) => Math.max(-99, (Number(d) || 0) - (Number(y) || 0) / 4);
function examSheet(ex) {
  const isNew = !ex;
  ex = ex || { id: newId(), on: dayKey(), set: "TYT", name: "", nets: {} };
  let set = ex.set;
  const rows = () => EXAM_DEF[set].map(([s, n]) => {
    const v = ex.set === set ? ex.nets[s] || {} : {};
    return '<tr><th scope="row"><span class="dot" style="--c:'.concat(subjColor(s.replace(/-2$/, "")), '"></span>').concat(esc(s), '<span class="hint"> ').concat(n, '</span></th>\n      <td><input class="input sm" type="number" inputmode="numeric" min="0" max="').concat(n, '" data-s="').concat(esc(s), '" data-k="d" value="').concat(v.d != null ? v.d : "", '" aria-label="').concat(esc(s), ' doğru"></td>\n      <td><input class="input sm" type="number" inputmode="numeric" min="0" max="').concat(n, '" data-s="').concat(esc(s), '" data-k="y" value="').concat(v.y != null ? v.y : "", '" aria-label="').concat(esc(s), ' yanlış"></td>\n      <td class="ex-net" data-n="').concat(esc(s), '">').concat(v.d != null ? fmtNet(netOf(v.d, v.y)) : "", "</td></tr>");
  }).join("");
  const box = openSheet(isNew ? "Deneme ekle" : "Denemeyi düzenle", '\n    <div class="seg small" role="tablist" aria-label="Sınav">'.concat(["TYT", "AYT", "YDT"].map((k) => '<button class="seg-b'.concat(kindOf(set) === k ? " on" : "", '" data-k="').concat(k, '" role="tab">').concat(k, "</button>")).join(""), '</div>\n    <div id="ex-ayt"').concat(kindOf(set) === "AYT" ? "" : " hidden", '><label class="f-h" for="ex-set">Alan</label><select id="ex-set">').concat(["AYT-SAY", "AYT-EA", "AYT-SOZ"].map((k) => '<option value="'.concat(k, '"').concat(set === k ? " selected" : "", ">").concat(SET_NAME[k], "</option>")).join(""), '</select></div>\n    <div class="two"><div><label class="f-h" for="ex-on">Tarih</label><input id="ex-on" class="input" type="date" value="').concat(ex.on, '" max="').concat(dayKey(), '"></div>\n      <div><label class="f-h" for="ex-n">Adı <span class="f-opt">isteğe bağlı</span></label><input id="ex-n" class="input" maxlength="80" value="').concat(esc(ex.name || ""), '" placeholder="Örn. Dershane TYT-4"></div></div>\n    <div class="ex-tbl-w"><table class="ex-tbl"><thead><tr><th>Ders</th><th>Doğru</th><th>Yanlış</th><th>Net</th></tr></thead><tbody id="ex-rows">').concat(rows(), '</tbody>\n      <tfoot><tr><th>Toplam</th><td></td><td></td><td id="ex-tot"></td></tr></tfoot></table></div>\n    <p class="hint">Net = doğru − yanlış ÷ 4. Boş bıraktığın dersler hesaba katılmaz.</p>\n    <p class="err" id="ex-e" role="alert"></p>\n    <div class="row"><button class="btn primary" id="ex-go">Kaydet</button>').concat(isNew ? "" : '<button class="btn danger" id="ex-del">Sil</button>', "</div>"));
  const tot = () => {
    let t = 0;
    $$("#ex-rows tr", box).forEach((tr) => {
      const d = $("[data-k=d]", tr).value, y = $("[data-k=y]", tr).value, cell = $(".ex-net", tr);
      if (d === "" && y === "") {
        cell.textContent = "";
        return;
      }
      const n = netOf(d, y);
      t += n;
      cell.textContent = fmtNet(n);
    });
    $("#ex-tot", box).textContent = fmtNet(t);
  };
  const swap = (s) => {
    set = s;
    $("#ex-rows", box).innerHTML = rows();
    $("#ex-ayt", box).hidden = kindOf(set) !== "AYT";
    tot();
  };
  box.addEventListener("click", (e) => {
    const b = e.target.closest(".seg-b[data-k]");
    if (!b) return;
    $$(".seg-b[data-k]", box).forEach((x) => x.classList.toggle("on", x === b));
    swap(b.dataset.k === "AYT" ? $("#ex-set", box).value || defaultAyt() : b.dataset.k);
  });
  $("#ex-set", box).addEventListener("change", (e) => swap(e.target.value));
  box.addEventListener("input", (e) => {
    if (e.target.matches("[data-k]")) tot();
  });
  if (isNew && kindOf(set) !== "AYT") $("#ex-set", box).value = defaultAyt();
  tot();
  $("#ex-go", box).addEventListener("click", () => {
    const err = $("#ex-e", box), nets = {};
    let total = 0, any = false;
    for (const [s, n] of EXAM_DEF[set]) {
      const d = $('[data-s="'.concat(s, '"][data-k=d]'), box).value, y = $('[data-s="'.concat(s, '"][data-k=y]'), box).value;
      if (d === "" && y === "") continue;
      const dn = Math.max(0, Math.round(Number(d) || 0)), yn = Math.max(0, Math.round(Number(y) || 0));
      if (dn + yn > n) {
        err.textContent = "".concat(s, ": doğru ve yanlış toplamı ").concat(n, " soruyu geçemez.");
        return;
      }
      nets[s] = { d: dn, y: yn, n: Math.round(netOf(dn, yn) * 100) / 100 };
      total += nets[s].n;
      any = true;
    }
    if (!any) {
      err.textContent = "En az bir dersin doğru ve yanlışını yaz.";
      return;
    }
    const on = $("#ex-on", box).value || dayKey();
    Object.assign(ex, { set, on, name: $("#ex-n", box).value.trim().slice(0, 80), nets, total: Math.round(total * 100) / 100, at: ex.at || Date.now() });
    DB.d.exams = (DB.d.exams || []).filter((x) => x.id !== ex.id).concat([ex]);
    DB.save();
    exPush(ex);
    closeSheet();
    ui.prog = "deneme";
    render();
    const prev = examsOf(set).filter((x) => x.id !== ex.id && x.on <= ex.on)[0];
    toast(prev ? "".concat(SET_NAME[set], " netin ").concat(fmtNet(ex.total), ". Öncekine göre ").concat(ex.total >= prev.total ? "+" : "").concat(fmtNet(ex.total - prev.total), ".") : "".concat(SET_NAME[set], " netin ").concat(fmtNet(ex.total), ". Kaydedildi."));
  });
  const del = $("#ex-del", box);
  if (del) del.addEventListener("click", () => {
    if (del.dataset.armed !== "1") {
      del.dataset.armed = "1";
      del.textContent = "Silmek için tekrar bas";
      return;
    }
    DB.d.exams = (DB.d.exams || []).filter((x) => x.id !== ex.id);
    DB.save();
    closeSheet();
    render();
    toast("Deneme silindi");
    if (Cloud.uid) Cloud.sb.from("exams").delete().eq("id", ex.id).then(() => {
    }, () => {
    });
  });
}
async function exPush(ex) {
  if (!Cloud.uid) return;
  try {
    await Cloud.sb.from("exams").upsert({ id: ex.id, user_id: Cloud.uid, taken_on: ex.on, kind: kindOf(ex.set), name: ex.name || "", nets: Object.assign({ _set: ex.set }, ex.nets), total: ex.total });
  } catch (e) {
  }
}
let exSynced = false;
async function exSyncAll() {
  if (exSynced || !Cloud.uid || isTeacher() || !(DB.d.exams || []).length) return;
  exSynced = true;
  try {
    await Cloud.sb.from("exams").upsert(DB.d.exams.map((ex) => ({ id: ex.id, user_id: Cloud.uid, taken_on: ex.on, kind: kindOf(ex.set), name: ex.name || "", nets: Object.assign({ _set: ex.set }, ex.nets), total: ex.total })));
  } catch (e) {
    exSynced = false;
  }
}
function lineChart(list, max) {
  const pts = list.slice(0, 10).reverse();
  if (pts.length < 2) return "";
  const W = 320, H = 120, P = 14, vals = pts.map((e) => e.total);
  const lo = Math.max(0, Math.floor(Math.min.apply(null, vals) - 3)), hi = Math.min(max, Math.ceil(Math.max.apply(null, vals) + 3));
  const x = (i) => P + i * (W - 2 * P) / (pts.length - 1), y = (v) => H - P - (v - lo) / Math.max(1, hi - lo) * (H - 2 * P);
  const d = pts.map((e, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(e.total).toFixed(1)).join(" ");
  return '<svg class="lchart" viewBox="0 0 '.concat(W, " ").concat(H, '" role="img" aria-label="Son ').concat(pts.length, ' denemenin toplam neti">\n    <path d="').concat(d, '" class="lc-l"/>').concat(pts.map((e, i) => '<circle cx="'.concat(x(i).toFixed(1), '" cy="').concat(y(e.total).toFixed(1), '" r="4" class="lc-p"><title>').concat(trDate(e.on), ": ").concat(fmtNet(e.total), " net</title></circle>")).join(""), "\n</svg>");
}
function examTrends(set) {
  const l = examsOf(set).slice(0, 3);
  if (l.length < 3) return [];
  const out = [];
  EXAM_DEF[set].forEach(([s]) => {
    const v = l.map((e) => e.nets[s] && e.nets[s].n);
    if (v.some((x) => x == null)) return;
    if (v[0] < v[1] && v[1] < v[2]) out.push({ s, down: true, diff: v[0] - v[2] });
    else if (v[0] > v[1] && v[1] > v[2]) out.push({ s, down: false, diff: v[0] - v[2] });
  });
  return out.sort((a, b) => a.diff - b.diff);
}
function examBlock(set) {
  const list = examsOf(set);
  if (!list.length) return "";
  const last = list[0], prev = list[1], max = EXAM_DEF[set].reduce((a, r) => a + r[1], 0);
  const tr = examTrends(set);
  return '<section class="block ex-block">\n    <div class="block-head"><h2>'.concat(SET_NAME[set], '</h2><span class="hint">').concat(list.length, ' deneme</span></div>\n    <div class="ex-big"><p><strong>').concat(fmtNet(last.total), '</strong> net<span class="hint"> / ').concat(max, "</span></p>").concat(prev ? '<span class="delta '.concat(last.total >= prev.total ? "up" : "down", '">').concat(last.total >= prev.total ? "+" : "").concat(fmtNet(last.total - prev.total), "</span>") : "", '<span class="hint">').concat(trDate(last.on)).concat(last.name ? " · " + esc(last.name) : "", "</span></div>\n    ").concat(lineChart(list, max), "\n    ").concat(tr.map((t) => '<p class="ex-warn '.concat(t.down ? "down" : "up", '">').concat(t.down ? "<strong>".concat(esc(t.s), "</strong> netin son 3 denemedir düşüyor (").concat(fmtNet(t.diff), "). Bu hafta programına bu dersten bir tekrar koy.") : "<strong>".concat(esc(t.s), "</strong> netin son 3 denemedir yükseliyor (+").concat(fmtNet(t.diff), "). Böyle devam."), "</p>")).join(""), '\n    <div class="ex-subj">').concat(EXAM_DEF[set].filter(([s]) => last.nets[s]).map(([s, n]) => {
    const v = last.nets[s].n, p = prev && prev.nets[s] ? prev.nets[s].n : null;
    return '<div class="es-r"><span class="es-s"><span class="dot" style="--c:'.concat(subjColor(s.replace(/-2$/, "")), '"></span>').concat(esc(s), '</span><span class="minibar" aria-hidden="true"><span style="width:').concat(Math.max(0, Math.round(v / n * 100)), '%"></span></span><span class="es-n">').concat(fmtNet(v), '<span class="hint">/').concat(n, "</span></span>").concat(p != null ? '<span class="delta sm '.concat(v >= p ? "up" : "down", '">').concat(v >= p ? "+" : "").concat(fmtNet(v - p), "</span>") : "<span></span>", "</div>");
  }).join(""), "</div>\n  </section>");
}
function examsTab() {
  const all = myExams(), sets = Object.keys(EXAM_DEF).filter((s) => examsOf(s).length);
  return '<div class="row"><button class="btn primary" data-act="ex-new">Deneme ekle</button></div>\n  '.concat(all.length ? sets.map(examBlock).join("") + '<section class="block"><div class="block-head"><h2>Bütün denemeler</h2></div>\n    <ul class="plist">'.concat(all.map((e) => '<li><button class="ex-row" data-act="ex-edit" data-id="'.concat(e.id, '"><span><strong>').concat(SET_NAME[e.set]).concat(e.name ? " · " + esc(e.name) : "", '</strong><span class="hint">').concat(trDate(e.on), '</span></span><span class="ex-tot">').concat(fmtNet(e.total), " net</span></button></li>")).join(""), "</ul></section>") : '<div class="empty"><h2>İlk denemeni ekle</h2><p>Her denemeden sonra doğru ve yanlışlarını ders ders yaz; netin kendiliğinden hesaplansın. Birkaç deneme sonra hangi dersin yükseldiğini, hangisinin düştüğünü gösteririm.</p></div>');
}
const topicsDone = () => DB.d.topicsDone || (DB.d.topicsDone = {});
function mufStats(groups) {
  let n = 0, d = 0;
  const td = topicsDone();
  groups.forEach((g) => g.topics.forEach((t) => {
    n++;
    if (td[t.id]) d++;
  }));
  return { n, d, pct: n ? Math.round(d / n * 100) : 0 };
}
function mufSummary(subject, name) {
  const nk = normName(name), sub = subject;
  const hit = Object.keys(LIB.summaries || {}).find((k) => {
    const s = LIB.summaries[k];
    return s && normName(s.name) === nk && (!s.subject || s.subject === sub);
  });
  return hit || "";
}
function topicsTab() {
  const groups = mufList(DB.d.profile.track), td = topicsDone(), open = ui.mufOpen || (ui.mufOpen = {});
  const exams = Array.from(new Set(groups.map((g) => g.exam)));
  return '<div class="muf-sum">'.concat(exams.map((ex) => {
    const s = mufStats(groups.filter((g) => g.exam === ex));
    return '<div class="ms-c"><p class="ms-k">'.concat(ex, '</p><p class="ms-p">%').concat(s.pct, '</p><span class="minibar"><span style="width:').concat(s.pct, '%"></span></span><p class="hint">').concat(s.d, "/").concat(s.n, " konu</p></div>");
  }).join(""), '</div>\n  <p class="hint">Çalıştığın konuyu işaretle. Programındaki bir görevi bitirince ilgili konu kendiliğinden işaretlenir. Alanını Profil\'den değiştirebilirsin.</p>\n  ').concat(exams.map((ex) => '<h2 class="menu-h">'.concat(ex, '</h2><div class="muf">').concat(groups.filter((g) => g.exam === ex).map((g) => {
    const k = ex + "|" + g.subject, s = mufStats([g]), on = !!open[k];
    return '<section class="muf-g'.concat(on ? " open" : "", '" style="--c:').concat(subjColor(g.subject), '">\n      <button class="muf-h" data-act="muf-open" data-k="').concat(esc(k), '" aria-expanded="').concat(on, '"><span class="dot"></span><strong>').concat(esc(g.subject), '</strong><span class="minibar"><span style="width:').concat(s.pct, '%"></span></span><span class="hint">').concat(s.d, "/").concat(s.n, "</span>").concat(I.next, "</button>\n      ").concat(on ? '<ul class="muf-l">'.concat(g.topics.map((t) => {
      const sum = mufSummary(g.subject, t.name);
      return '<li><label class="muf-t"><input type="checkbox" data-muf="'.concat(t.id, '"').concat(td[t.id] ? " checked" : "", '><span class="box" aria-hidden="true"></span><span>').concat(esc(t.name)).concat(td[t.id] && td[t.id] !== "1" ? '<span class="hint"> · '.concat(trDate(td[t.id]), "</span>") : "", "</span></label>").concat(sum ? '<a class="tlink" href="#/konu/'.concat(encodeURIComponent(sum), '">Özet</a>') : "", "</li>");
    }).join(""), "</ul>") : "", "\n    </section>");
  }).join(""), "</div>")).join(""));
}
function mufAutoMark(task) {
  if (!task || isTeacher()) return;
  const subj = canonSubject(task.subject || guessTask(task.text || "").subject);
  const words = wordsOf(task.topic || task.text || ""), stems = words.map((w) => w.slice(0, 5));
  let best = null, bw = 0;
  mufList(DB.d.profile.track).forEach((g) => {
    if (subj && g.subject !== subj) return;
    g.topics.forEach((t) => {
      const key = topicKey(t.name);
      if (!key.length) return;
      if (key.every((k) => k.exact ? words.includes(k.w) : stems.includes(k.w))) {
        const w = key.reduce((a, k) => a + k.w.length, 0);
        if (w > bw) {
          bw = w;
          best = t;
        }
      }
    });
  });
  if (best && !topicsDone()[best.id]) {
    topicsDone()[best.id] = dayKey();
    return best;
  }
  return null;
}
const LB = { rows: null, at: 0, busy: false, err: "", scope: "class" };
async function lbLoad(force) {
  if (!Cloud.uid || LB.busy || !force && LB.rows && Date.now() - LB.at < 6e4) return;
  LB.busy = true;
  LB.err = "";
  try {
    await pushWeekly(true);
    LB.rows = await Cloud.rpc("leaderboard", { p_week: thisWeek() }) || [];
    LB.at = Date.now();
  } catch (e) {
    LB.err = "Sıralama alınamadı. İnternet bağlantını kontrol et.";
  }
  LB.busy = false;
  if (route.page === "ilerleme" && !sheetEl) render();
}
function rankTab() {
  if (!Cloud.uid) return emptyBlock("Giriş gerekli", "Sıralama için hesabına giriş yap.", "");
  lbLoad();
  const rows = LB.rows, hidden = !!DB.d.profile.rankHidden;
  if (!rows) return LB.err ? '<p class="err">'.concat(esc(LB.err), '</p><div class="row"><button class="btn" data-act="lb-reload">Tekrar dene</button></div>') : '<div class="progress"><span class="spinner" aria-hidden="true"></span><span>Sıralama yükleniyor…</span></div>';
  const hasClass = rows.some((r) => r.in_class), hasRoom = rows.some((r) => r.in_room);
  let scope = LB.scope;
  if (scope === "class" && !hasClass && hasRoom) scope = "room";
  if (scope === "room" && !hasRoom && hasClass) scope = "class";
  const list = rows.filter((r) => r.me || (scope === "class" ? r.in_class : r.in_room));
  const mx = Math.max(60, ...list.map((r) => r.focus_min));
  return "".concat(hasClass && hasRoom ? '<div class="seg small" role="tablist"><button class="seg-b'.concat(scope === "class" ? " on" : "", '" data-act="lb-scope" data-s="class">Sınıfım</button><button class="seg-b').concat(scope === "room" ? " on" : "", '" data-act="lb-scope" data-s="room">Oda arkadaşlarım</button></div>') : "", '\n  <p class="hint">Bu haftanın odak süresi (').concat(weekRange(thisWeek()), "). Her pazartesi sıfırlanır.</p>\n  ").concat(list.length > 1 ? '<ol class="lb">'.concat(list.map((r, i) => '<li class="'.concat(r.me ? "me" : "", '"><span class="lb-n">').concat(i + 1, "</span>").concat(avatarFor(r.name), '<span class="lb-b"><strong>').concat(esc(r.name || "Öğrenci")).concat(r.me ? " (sen)" : "", '</strong><span class="minibar"><span style="width:').concat(Math.round(r.focus_min / mx * 100), '%"></span></span></span><span class="lb-v"><strong>').concat(fmtMin(r.focus_min), '</strong><span class="hint">').concat(r.tasks_done, " görev").concat(r.streak ? " · " + r.streak + " gün seri" : "", "</span></span></li>")).join(""), "</ol>") : '<div class="empty"><h2>Sıralamada henüz sadece sen varsın</h2><p>Dershanende bir sınıfa katıl ya da Odalar\'dan bir arkadaş odası açıp arkadaşlarını davet et; aynı sınıftaki ve aynı odadaki arkadaşlarınla haftalık sıralaman burada görünür.</p><div class="row"><a class="btn" href="#/odalar">Odalar</a><button class="btn" data-act="sc-join">Sınıf koduyla katıl</button></div></div>', '\n  <label class="switch-row"><input type="checkbox" data-act="lb-hide"').concat(hidden ? "" : " checked", '><span><strong>Sıralamada görün</strong><span class="hint">Kapatırsan arkadaşların seni sıralamada görmez. Hocaların raporunda yine görünürsün.</span></span></label>');
}
function weekStats(wk) {
  const mon = fromKey(wk);
  let focus = 0, active = 0;
  for (let i = 0; i < 7; i++) {
    const k = dayKey(addDays(mon, i)), d = DB.d.stats.days[k];
    if (d) focus += d.focus || 0;
    if (dayActive(k)) active++;
  }
  const w = DB.week(wk), ts = w ? w.tasks : [];
  return { focus_min: Math.min(10080, Math.round(focus)), tasks_done: Math.min(2e3, ts.filter((t) => t.done).length), tasks_total: Math.min(2e3, ts.length), active_days: active, streak: Math.min(5e3, streakInfo().cur), topics_done: Math.min(2e3, Object.keys(topicsDone()).length) };
}
let wsLast = "", wsT = null;
function pushWeekly(now) {
  if (!Cloud.uid || isTeacher()) return Promise.resolve();
  clearTimeout(wsT);
  const run = async () => {
    exSyncAll();
    const wk = thisWeek(), s = weekStats(wk), sig = wk + JSON.stringify(s);
    if (sig === wsLast) return;
    try {
      const { error } = await Cloud.sb.from("weekly_stats").upsert(Object.assign({ user_id: Cloud.uid, week_start: wk }, s));
      if (!error) wsLast = sig;
    } catch (e) {
    }
  };
  if (now) return run();
  wsT = setTimeout(run, 8e3);
  return Promise.resolve();
}
function weekSummary() {
  const wk = thisWeek(), s = weekStats(wk), st = streakInfo(), groups = mufList(DB.d.profile.track), m = mufStats(groups);
  const last = myExams()[0];
  return { wk, s, st, m, last };
}
async function drawShareCard() {
  const W = 1080, H = 1920, c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d"), x = weekSummary(), p = DB.d.profile, pal = paletteOf(p.palette);
  try {
    await Promise.all(['800 90px "Bricolage Grotesque"', "800 40px Nunito", "700 40px Nunito"].map((f) => document.fonts.load(f)));
  } catch (e) {
  }
  const grad = g.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#6A4BD6");
  grad.addColorStop(1, "#2B1B6E");
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  g.fillStyle = "rgba(255,255,255,.06)";
  for (let i = 0; i < 7; i++) {
    g.beginPath();
    g.arc(120 + i * 170, 260 + i % 2 * 90, 60 + i % 3 * 30, 0, 7);
    g.fill();
  }
  const H1 = '"Bricolage Grotesque", Nunito, system-ui, sans-serif', B = "Nunito, system-ui, sans-serif";
  g.fillStyle = "#fff";
  g.textBaseline = "alphabetic";
  g.font = "800 44px " + B;
  g.globalAlpha = 0.8;
  g.fillText("Ders Özetim", 90, 150);
  g.globalAlpha = 1;
  g.font = "800 108px " + H1;
  g.fillText("Bu hafta", 90, 420);
  g.font = "700 46px " + B;
  g.globalAlpha = 0.85;
  g.fillText((p.name ? firstName(p.name) + " · " : "") + weekRange(x.wk), 90, 500);
  g.globalAlpha = 1;
  const card = (y, big, label, sub) => {
    g.fillStyle = "rgba(255,255,255,.12)";
    const r = 40, cx = 90, cw = W - 180, ch = 230;
    g.beginPath();
    g.moveTo(cx + r, y);
    g.arcTo(cx + cw, y, cx + cw, y + ch, r);
    g.arcTo(cx + cw, y + ch, cx, y + ch, r);
    g.arcTo(cx, y + ch, cx, y, r);
    g.arcTo(cx, y, cx + cw, y, r);
    g.fill();
    g.fillStyle = "#fff";
    g.font = "800 104px " + H1;
    g.fillText(big, 140, y + 135);
    g.font = "800 40px " + B;
    g.fillText(label, 140, y + 192);
    if (sub) {
      g.font = "700 34px " + B;
      g.globalAlpha = 0.7;
      const tw = g.measureText(sub).width;
      g.fillText(sub, W - 140 - tw, y + 192);
      g.globalAlpha = 1;
    }
  };
  card(600, fmtMin(x.s.focus_min), "odak", x.s.active_days + " gün çalıştım");
  card(870, x.s.tasks_done + (x.s.tasks_total ? "/" + x.s.tasks_total : ""), "görev bitti", x.s.tasks_total ? "%" + Math.round(x.s.tasks_done / x.s.tasks_total * 100) : "");
  card(1140, x.st.cur + " gün", "seri", x.st.best > x.st.cur ? "en iyisi " + x.st.best : "en iyi serim");
  card(1410, x.last ? fmtNet(x.last.total) : "%" + x.m.pct, x.last ? SET_NAME[x.last.set] + " neti" : "konular bitti", x.last ? trDate(x.last.on) : x.m.d + "/" + x.m.n + " konu");
  const svg = mascotSVG("happy", 220).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ').replace(/var\(--[\w-]+,([^)]+)\)/g, "$1");
  await new Promise((res) => {
    const im = new Image();
    im.onload = () => {
      g.drawImage(im, W - 330, 230, 240, 248);
      res();
    };
    im.onerror = res;
    im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
  g.fillStyle = "#fff";
  g.font = "800 44px " + B;
  g.fillText(daysLeft() + " gün sonra YKS", 90, 1760);
  g.font = "700 36px " + B;
  g.globalAlpha = 0.75;
  g.fillText("dersozet.pages.dev · ücretsiz", 90, 1820);
  g.globalAlpha = 1;
  return c;
}
async function shareSheet() {
  const box = openSheet("Haftanı paylaş", '<p class="hint">Instagram hikâyesine uygun bir görsel hazırladım. Paylaş ya da indir.</p><div class="share-prev" id="sh-prev"><span class="spinner" aria-hidden="true"></span></div><div class="row" id="sh-acts"></div>');
  const c = await drawShareCard();
  if (!document.contains(box)) return;
  const blob = await new Promise((r) => c.toBlob(r, "image/png"));
  const url = URL.createObjectURL(blob), file = new File([blob], "ders-ozetim-haftam.png", { type: "image/png" });
  $("#sh-prev", box).innerHTML = '<img src="'.concat(url, '" alt="Haftalık özet görseli">');
  const canShare = navigator.canShare && navigator.canShare({ files: [file] });
  $("#sh-acts", box).innerHTML = "".concat(canShare ? '<button class="btn primary" id="sh-go">Paylaş</button>' : "", '<a class="btn').concat(canShare ? "" : " primary", '" href="').concat(url, '" download="ders-ozetim-haftam.png">İndir</a>');
  const sb = $("#sh-go", box);
  if (sb) sb.addEventListener("click", async () => {
    try {
      await navigator.share({ files: [file], text: "Bu haftam · Ders Özetim" });
    } catch (e) {
    }
  });
}
function progressView() {
  const tab = route.arg || ui.prog || "deneme";
  const seg = [["deneme", "Denemeler"], ["konular", "Konular"], ["siralama", "Sıralama"]];
  return '<header class="page-head"><h1>İlerleme</h1><button class="btn sm" data-act="share-week">'.concat(I.share, 'Haftanı paylaş</button></header>\n  <div class="seg" role="tablist" aria-label="İlerleme">').concat(seg.map(([k, n]) => '<a class="seg-b'.concat(tab === k ? " on" : "", '" href="#/ilerleme/').concat(k, '" role="tab" aria-selected="').concat(tab === k, '">').concat(n, "</a>")).join(""), "</div>\n  ").concat(tab === "konular" ? topicsTab() : tab === "siralama" ? rankTab() : examsTab());
}
VIEWS.ilerleme = progressView;
function progressPill() {
  const e = myExams()[0];
  if (!e) return "";
  const prev = examsOf(e.set).filter((x) => x.id !== e.id)[0];
  return '<a class="pill" href="#/ilerleme">'.concat(I.chart, "<span>").concat(kindOf(e.set), " <strong>").concat(fmtNet(e.total), "</strong>").concat(prev ? ' <span class="delta sm '.concat(e.total >= prev.total ? "up" : "down", '">').concat(e.total >= prev.total ? "+" : "").concat(fmtNet(e.total - prev.total), "</span>") : "", "</span></a>");
}
const RP = { ex: {}, ws: {}, busy: {} };
async function classStatsLoad(inst, cid, ids, force) {
  const k = cid;
  if (RP.busy[k] || RP.ex[k] && !force) return;
  RP.busy[k] = true;
  try {
    const since = wkKey(addDays(fromKey(thisWeek()), -21));
    const [ex, ws] = await Promise.all([
      ids.length ? Cloud.sb.from("exams").select("id, user_id, taken_on, kind, name, nets, total").in("user_id", ids).order("taken_on", { ascending: false }).limit(400) : { data: [] },
      ids.length ? Cloud.sb.from("weekly_stats").select("*").in("user_id", ids).gte("week_start", since) : { data: [] }
    ]);
    RP.ex[k] = ex.data || [];
    RP.ws[k] = ws.data || [];
  } catch (e) {
    RP.ex[k] = RP.ex[k] || [];
    RP.ws[k] = RP.ws[k] || [];
  }
  RP.busy[k] = false;
  if (route.page === "dershane" && !sheetEl) render();
}
const exSet = (e) => e.nets && e.nets._set || e.kind;
function classExamsBlock(inst, cid, students) {
  const ids = students.map((s) => s.user_id);
  if (!RP.ex[cid]) {
    classStatsLoad(inst, cid, ids);
    return '<section class="block"><div class="block-head"><h2>Denemeler ve odak</h2></div><div class="progress"><span class="spinner" aria-hidden="true"></span><span>Yükleniyor…</span></div></section>';
  }
  const ex = RP.ex[cid], ws = RP.ws[cid], wk = thisWeek();
  const row = (s) => {
    const mine = ex.filter((e) => e.user_id === s.user_id), tyt = mine.filter((e) => e.kind === "TYT"), ayt = mine.filter((e) => e.kind === "AYT");
    const w = ws.find((x) => x.user_id === s.user_id && x.week_start === wk);
    const d = (l) => l[1] ? '<span class="delta sm '.concat(l[0].total >= l[1].total ? "up" : "down", '">').concat(l[0].total >= l[1].total ? "+" : "").concat(fmtNet(l[0].total - l[1].total), "</span>") : "";
    return '<tr><th scope="row"><button class="link" data-act="sc-report" data-u="'.concat(s.user_id, '">').concat(esc(s.p ? s.p.name : "Öğrenci"), "</button></th><td>").concat(tyt[0] ? fmtNet(tyt[0].total) + d(tyt) : "–", "</td><td>").concat(ayt[0] ? fmtNet(ayt[0].total) + d(ayt) : "–", "</td><td>").concat(w ? fmtMin(w.focus_min) : "–", "</td></tr>");
  };
  return '<section class="block"><div class="block-head"><h2>Denemeler ve odak</h2><button class="link sm" data-act="sc-stats-reload" data-c="'.concat(cid, '">Yenile</button></div>\n    ').concat(students.length ? '<div class="ex-tbl-w"><table class="ex-tbl cls"><thead><tr><th>Öğrenci</th><th>Son TYT</th><th>Son AYT</th><th>Bu hafta odak</th></tr></thead><tbody>'.concat(students.map(row).join(""), '</tbody></table></div>\n    <p class="hint">Öğrencinin adına dokun: haftalık raporu açılır, veliyle de paylaşabilirsin. Netleri öğrenciler kendi uygulamasında girer.</p>') : '<p class="hint">Henüz öğrenci yok.</p>', "</section>");
}
function reportText(s, D, cid) {
  const u = s.user_id, wk = thisWeek(), ex = (RP.ex[cid] || []).filter((e) => e.user_id === u), w = (RP.ws[cid] || []).find((x) => x.user_id === u && x.week_start === wk);
  const weekProgs = D.programs.filter((p) => (p.class_id === cid || p.student_id === u) && wkKey(mondayOf(fromKey(p.week_start))) === wk);
  let t = 0, d = 0;
  weekProgs.forEach((p) => {
    t += (p.tasks || []).length;
    d += doneCount(p, u);
  });
  const lines = ["".concat(s.p ? s.p.name : "Öğrenci", " · ").concat(weekRange(wk), " haftası")];
  lines.push(t ? "• Program: ".concat(d, "/").concat(t, " görev bitti (%").concat(Math.round(d / t * 100), ")") : "• Bu hafta dershane programı yok");
  if (w) lines.push("• Odak: ".concat(fmtMin(w.focus_min), ", ").concat(w.active_days || 0, " gün çalıştı").concat(w.streak ? ", " + w.streak + " günlük seri" : ""));
  else lines.push("• Bu hafta uygulamada çalışma kaydı yok");
  ["TYT", "AYT"].forEach((k) => {
    const l = ex.filter((e) => e.kind === k);
    if (!l.length) return;
    lines.push("• Son ".concat(k, " denemesi: ").concat(fmtNet(l[0].total), " net (").concat(trDate(l[0].taken_on), ")").concat(l[1] ? ", öncekine göre " + (l[0].total >= l[1].total ? "+" : "") + fmtNet(l[0].total - l[1].total) : ""));
  });
  if (w && w.topics_done) lines.push("• Çalıştığı konu: ".concat(w.topics_done));
  lines.push("Ders Özetim");
  return lines.join("\n");
}
function reportSheet(el) {
  const [inst, cid] = route.arg.split("/"), D = SC.data[inst], s = D && D.members.find((x) => x.user_id === el.dataset.u);
  if (!s) return;
  const u = s.user_id, ex = (RP.ex[cid] || []).filter((e) => e.user_id === u), ws = (RP.ws[cid] || []).filter((x) => x.user_id === u).sort((a, b) => b.week_start.localeCompare(a.week_start));
  const txt = reportText(s, D, cid);
  const box = openSheet("Haftalık rapor", '<p class="hint">'.concat(esc(s.p ? s.p.name : "")).concat(s.p && s.p.goal ? " · " + esc(s.p.goal) + " hedefliyor" : "", '</p>\n    <pre class="report">').concat(esc(txt), '</pre>\n    <div class="row"><button class="btn primary" id="rp-share">Paylaş</button><button class="btn" id="rp-copy">Kopyala</button></div>\n    ').concat(ws.length ? '<h3 class="f-h">Son haftalar</h3><ul class="plist">'.concat(ws.map((w) => "<li><div><strong>".concat(weekRange(w.week_start), '</strong><span class="hint">').concat(fmtMin(w.focus_min), " odak · ").concat(w.active_days || 0, " gün · ").concat(w.tasks_done || 0).concat(w.tasks_total ? "/" + w.tasks_total : "", " görev</span></div></li>")).join(""), "</ul>") : "", "\n    ").concat(ex.length ? '<h3 class="f-h">Denemeleri</h3><ul class="plist">'.concat(ex.slice(0, 8).map((e) => "<li><div><strong>".concat(SET_NAME[exSet(e)] || e.kind).concat(e.name ? " · " + esc(e.name) : "", ": ").concat(fmtNet(e.total), ' net</strong><span class="hint">').concat(trDate(e.taken_on), " · ").concat(Object.keys(e.nets || {}).filter((k) => k !== "_set").map((k) => esc(k) + " " + fmtNet(e.nets[k].n)).join(", "), "</span></div></li>")).join(""), "</ul>") : '<p class="hint">Henüz deneme girmemiş. Öğrenci İlerleme > Denemeler\'den ekler.</p>'));
  $("#rp-copy", box).addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(txt);
      toast("Kopyalandı; WhatsApp'a yapıştırabilirsin");
    } catch (e) {
      toast("Kopyalanamadı");
    }
  });
  $("#rp-share", box).addEventListener("click", async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: txt });
      } catch (e) {
      }
    } else {
      try {
        await navigator.clipboard.writeText(txt);
        toast("Paylaşım desteklenmiyor; metin kopyalandı");
      } catch (e) {
      }
    }
  });
}
Object.assign(ACT, {
  "ex-new": () => examSheet(null),
  "ex-edit": (el) => {
    const e = (DB.d.exams || []).find((x) => x.id === el.dataset.id);
    if (e) examSheet(e);
  },
  "muf-open": (el) => {
    const o = ui.mufOpen || (ui.mufOpen = {});
    o[el.dataset.k] = !o[el.dataset.k];
    render();
  },
  "lb-reload": () => lbLoad(true),
  "lb-scope": (el) => {
    LB.scope = el.dataset.s;
    render();
  },
  "share-week": () => shareSheet(),
  "sc-report": (el) => reportSheet(el),
  "sc-stats-reload": (el) => {
    const [inst] = route.arg.split("/");
    const D = SC.data[inst];
    const ids = D.members.filter((x) => x.class_id === el.dataset.c && x.role === "student").map((x) => x.user_id);
    classStatsLoad(inst, el.dataset.c, ids, true);
  }
});
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.matches("input[data-muf]")) {
    const td = topicsDone();
    if (t.checked) td[t.dataset.muf] = dayKey();
    else delete td[t.dataset.muf];
    DB.save();
    render();
    return;
  }
  if (t.matches('input[data-act="lb-hide"]')) {
    DB.d.profile.rankHidden = !t.checked;
    DB.save();
    if (Cloud.uid) Cloud.pushProfile().then(() => lbLoad(true));
    toast(t.checked ? "Sıralamada görünüyorsun" : "Sıralamada artık görünmüyorsun");
  }
});
