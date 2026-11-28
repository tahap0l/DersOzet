/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0. Eski tarayıcılar için çevrilmiş kopya; kaynak app/js, üreten tools/build-legacy.sh */
"use strict";
const SC = { data: {}, busy: {}, err: {} };
const ROLE_NAME = { owner: "Kurucu", teacher: "Hoca", student: "Öğrenci" };
async function scLoad(inst, force) {
  if (SC.busy[inst] || SC.data[inst] && !force) return;
  SC.busy[inst] = true;
  SC.err[inst] = "";
  const sb = Cloud.sb, staff = Cloud.isStaff(inst);
  try {
    const [cls, mem, codes, progs] = await Promise.all([
      sb.from("classes").select("id, name, created_at").eq("institution_id", inst).order("name"),
      sb.from("memberships").select("user_id, role, class_id, joined_at, p:profiles(name, goal, track, grade, kind, branch)").eq("institution_id", inst).order("joined_at"),
      staff ? sb.from("invite_codes").select("code, class_id, role").eq("institution_id", inst) : Promise.resolve({ data: [] }),
      staff ? sb.from("programs").select("id, class_id, student_id, week_start, title, tasks, created_at").eq("institution_id", inst).order("week_start", { ascending: false }).limit(80) : Promise.resolve({ data: [] })
    ]);
    [cls, mem, codes, progs].forEach((r) => {
      if (r.error) throw r.error;
    });
    let progress = [];
    if (staff && progs.data.length) {
      const r = await sb.from("program_progress").select("program_id, user_id, done, updated_at").in("program_id", progs.data.map((p) => p.id));
      progress = r.data || [];
    }
    SC.data[inst] = { classes: cls.data, members: mem.data, codes: codes.data, programs: progs.data, progress, at: Date.now() };
    try {
      localStorage.setItem("dersozetim.sc." + inst, JSON.stringify(SC.data[inst]));
    } catch (e) {
    }
  } catch (e) {
    SC.err[inst] = "Bilgiler alınamadı. İnternet bağlantını kontrol et.";
  }
  SC.busy[inst] = false;
  if ((route.page === "dershane" || route.page === "bugun") && !sheetEl) render();
}
const codeBox = (code, label, renew) => '<div class="codebox"><div><p class="cb-l">'.concat(esc(label), '</p><p class="cb-c">').concat(esc(code), '</p></div>\n  <div class="cb-a"><button class="btn sm" data-act="sc-copy" data-code="').concat(esc(code), '">Kopyala</button>').concat(renew ? '<button class="link sm" data-act="sc-renew" data-code="'.concat(esc(code), '">Yenile</button>') : "", "</div></div>");
function doneCount(prog, uid) {
  const r = (SC.cur && SC.cur.progress || []).find((x) => x.program_id === prog.id && x.user_id === uid);
  return r ? Object.keys(r.done || {}).length : 0;
}
function dershaneView() {
  const [inst, cls] = (route.arg || "").split("/");
  if (!Cloud.uid) return emptyBlock("Giriş gerekli", "Dershane özelliklerini kullanmak için giriş yap.", "");
  if (!inst) return dershaneHome();
  const m = Cloud.member(inst);
  if (!m) return '<header class="page-head slim"><a class="back" href="#/dershane">'.concat(I.back, "Dershanem</a></header>").concat(emptyBlock("Bu dershanede değilsin", "Hocandan aldığın kodla katılabilirsin.", '<button class="btn primary" data-act="sc-join">Kodla katıl</button>'));
  const D = SC.data[inst];
  SC.cur = D;
  if (!D) {
    scLoad(inst);
    return '<header class="page-head slim"><a class="back" href="#/dershane">'.concat(I.back, 'Dershanem</a></header><h1 class="page-title">').concat(esc(m.inst.name), "</h1>").concat(SC.err[inst] ? '<p class="err">'.concat(esc(SC.err[inst]), '</p><div class="row"><button class="btn" data-act="sc-reload" data-i="').concat(inst, '">Tekrar dene</button></div>') : '<div class="progress"><span class="spinner" aria-hidden="true"></span><span>Yükleniyor…</span></div>');
  }
  return cls ? classView(m, D, cls) : instView(m, D);
}
function dershaneHome() {
  const list = Cloud.school;
  return '<header class="page-head"><h1>Dershanem</h1></header>\n  '.concat(list.length ? '<ul class="cards">'.concat(list.map((m) => '<li><a class="card-link" href="#/dershane/'.concat(m.institution_id, '">\n      <span class="cl-ic">').concat(I.school, '</span><span class="cl-b"><strong>').concat(esc(m.inst ? m.inst.name : "Dershane"), "</strong><span>").concat(ROLE_NAME[m.role]).concat(m.cls ? ", " + esc(m.cls.name) : "", "</span></span>").concat(I.next, "</a></li>")).join(""), "</ul>") : '<div class="empty"><h2>Dershaneye katıl</h2><p>Hocan sana 6 haneli bir sınıf kodu verdiyse yaz; haftalık programın kendiliğinden gelsin ve sınıf arkadaşlarınla aynı odalarda çalış.</p></div>', '\n  <div class="row"><button class="btn primary" data-act="sc-join">Kodla katıl</button><button class="btn" data-act="sc-new">Dershane oluştur</button></div>\n  <p class="hint">Dershane oluşturmak hocalar ve dershane yöneticileri içindir. Oluşturunca sınıfları ekler, öğrencilere sınıf kodunu, diğer hocalara hoca kodunu verirsin.</p>');
}
function instView(m, D) {
  const staff = m.role !== "student", inst = m.institution_id;
  const tcode = D.codes.find((c) => c.role === "teacher");
  const byClass = (id) => D.members.filter((x) => x.class_id === id && x.role === "student");
  const teachers = D.members.filter((x) => x.role !== "student");
  const noClass = D.members.filter((x) => x.role === "student" && !x.class_id);
  return '<header class="page-head slim"><a class="back" href="#/dershane">'.concat(I.back, 'Dershanem</a><button class="icon-btn" data-act="sc-reload" data-i="').concat(inst, '" aria-label="Yenile">').concat(I.refresh, '</button></header>\n  <h1 class="page-title">').concat(esc(m.inst.name), '</h1>\n  <p class="sub">').concat(ROLE_NAME[m.role]).concat(m.cls ? ", " + esc(m.cls.name) : "", " · ").concat(D.members.filter((x) => x.role === "student").length, " öğrenci, ").concat(teachers.length, " hoca</p>\n  ").concat(staff && tcode ? '<section class="block">'.concat(codeBox(tcode.code, "Hoca kodu: yalnızca hocalara ver", true), '<p class="hint">Bu kodla katılan hoca olur. Öğrencilere sınıfın kodunu ver; her sınıfın kodu aşağıda, sınıfın yanında yazıyor.</p></section>') : "", '\n  <section class="block">\n    <div class="block-head"><h2>Sınıflar</h2>').concat(staff ? '<button class="link" data-act="sc-class-new">Sınıf ekle</button>' : "", "</div>\n    ").concat(D.classes.length ? '<ul class="cards">'.concat(D.classes.map((c) => {
    const code = D.codes.find((x) => x.class_id === c.id);
    const n = byClass(c.id).length;
    return "<li>".concat(staff ? '<a class="card-link" href="#/dershane/'.concat(inst, "/").concat(c.id, '">') : '<div class="card-link">', '<span class="cl-ic soft">').concat(esc(c.name.slice(0, 2)), '</span><span class="cl-b"><strong>').concat(esc(c.name), "</strong><span>").concat(n, " öğrenci").concat(staff && code ? " · kod " + esc(code.code) : "").concat(m.class_id === c.id ? " · senin sınıfın" : "", "</span></span>").concat(staff ? I.next + "</a>" : "</div>", "</li>");
  }).join(""), "</ul>") : '<p class="hint">'.concat(staff ? "Henüz sınıf yok. Bir sınıf ekle; her sınıfın öğrencilere vereceğin ayrı bir kodu olur." : "Henüz sınıf eklenmemiş.", "</p>"), "\n    ").concat(staff && noClass.length ? '<p class="hint">'.concat(noClass.length, " öğrencinin sınıfı yok.</p>") : "", '\n  </section>\n  <section class="block">\n    <div class="block-head"><h2>Ders odaları</h2><a class="link" href="#/odalar">Tümü</a></div>\n    <p class="hint">Dershanenin öğrencileri aynı odada sesli, görüntülü ya da sadece yazışarak birlikte çalışabilir. Odaları açan kişi ve hocalar kuralları bozanı odadan çıkarabilir.</p>\n    <div class="row"><button class="btn" data-act="room-new" data-inst="').concat(inst, '">Oda aç</button></div>\n  </section>\n  <section class="block">\n    <h2 class="f-h">Hocalar</h2>\n    <ul class="people">').concat(teachers.map((x) => "<li>".concat(avatarFor(x.p && x.p.name), '<span class="pp-b"><strong>').concat(esc(x.p ? x.p.name : ""), '</strong><span class="hint">').concat(ROLE_NAME[x.role]).concat(x.p && x.p.branch ? " · " + esc(x.p.branch) : "", "</span></span>").concat(m.role === "owner" && x.role !== "owner" ? '<button class="btn sm" data-act="sc-mem" data-u="'.concat(x.user_id, '" aria-label="').concat(esc(x.p ? x.p.name : ""), ' için rol">Rolü</button>') : "", "</li>")).join(""), "</ul>\n    ").concat(m.role === "owner" ? '<p class="hint">Yanlışlıkla hoca koduyla katılan bir öğrenciyi "Rolü"ne dokunup öğrenci yapabilir ve sınıfını seçebilirsin.</p>' : "", '\n  </section>\n  <div class="row"><button class="link danger" data-act="sc-leave" data-i="').concat(inst, '">').concat(m.role === "owner" ? "Dershaneyi sil" : "Dershaneden ayrıl", "</button></div>");
}
function classView(m, D, cid) {
  const inst = m.institution_id, c = D.classes.find((x) => x.id === cid);
  if (!c || m.role === "student") return '<header class="page-head slim"><a class="back" href="#/dershane/'.concat(inst, '">').concat(I.back, 'Geri</a></header><p class="hint">Sınıf bulunamadı.</p>');
  const code = D.codes.find((x) => x.class_id === cid);
  const students = D.members.filter((x) => x.class_id === cid && x.role === "student");
  const ids = new Set(students.map((s) => s.user_id));
  const progs = D.programs.filter((p) => p.class_id === cid || p.student_id && ids.has(p.student_id));
  const wk = thisWeek();
  const weekProgs = progs.filter((p) => wkKey(mondayOf(fromKey(p.week_start))) === wk);
  const stat = (uid) => {
    let t = 0, d = 0;
    weekProgs.forEach((p) => {
      if (p.class_id === cid || p.student_id === uid) {
        t += (p.tasks || []).length;
        d += doneCount(p, uid);
      }
    });
    return { t, d };
  };
  const name = (uid) => {
    const s = D.members.find((x) => x.user_id === uid);
    return s && s.p ? s.p.name : "Öğrenci";
  };
  return '<header class="page-head slim"><a class="back" href="#/dershane/'.concat(inst, '">').concat(I.back).concat(esc(m.inst.name), '</a><button class="icon-btn" data-act="sc-reload" data-i="').concat(inst, '" aria-label="Yenile">').concat(I.refresh, '</button></header>\n  <h1 class="page-title">').concat(esc(c.name), "</h1>\n  ").concat(code ? '<section class="block">'.concat(codeBox(code.code, "Sınıf kodu: öğrencilere ver", true), '<p class="hint">Öğrenci uygulamada Profil > Dershanem > Kodla katıl\'a bu kodu yazar.</p></section>') : "", '\n  <section class="block">\n    <div class="block-head"><h2>Program gönder</h2></div>\n    <div class="row"><button class="btn primary" data-act="sc-up" data-c="').concat(cid, '">Excel\'den yükle</button><button class="btn" data-act="sc-write" data-c="').concat(cid, '">Program yaz</button><button class="btn" data-act="sc-mine" data-c="').concat(cid, '">Kendi programımdan</button></div>\n    <p class="hint"><strong>Herkese ayrı program:</strong> her öğrencinin Excel\'ini onun adıyla kaydet (örn. "Esat Taha Polat.xlsx") ve hepsini birlikte seç; ya da tek dosyada her öğrenciye bir sayfa aç, sayfaya öğrencinin adını ver. Uygulama hangi programın kime gideceğini adlardan bulur. Tek bir öğrenciye göndermek için öğrencinin yanındaki ⋯\'ye dokun.</p>\n  </section>\n  <section class="block">\n    <div class="block-head"><h2>Öğrenciler</h2><span class="hint">Bu hafta</span></div>\n    ').concat(students.length ? '<ul class="people">'.concat(students.map((s) => {
    const x = stat(s.user_id);
    const pct = x.t ? Math.round(x.d / x.t * 100) : 0;
    const own = weekProgs.some((p) => p.student_id === s.user_id);
    return "<li>".concat(avatarFor(s.p && s.p.name), '<span class="pp-b"><strong>').concat(esc(s.p ? s.p.name : "")).concat(own ? ' <span class="tag">Özel program</span>' : "", '</strong><span class="hint">').concat(esc([s.p && whoTag(s.p), s.p && s.p.goal].filter(Boolean).join(" · ")), "</span>\n        ").concat(x.t ? '<span class="minibar" aria-label="'.concat(x.d, "/").concat(x.t, ' görev"><span style="width:').concat(pct, '%"></span></span><span class="hint">').concat(x.d, "/").concat(x.t, " görev</span>") : '<span class="hint">Bu hafta programı yok</span>', '</span>\n        <button class="icon-btn ghost" data-act="sc-stu" data-u="').concat(s.user_id, '" aria-label="Öğrenci seçenekleri">').concat(I.dots, "</button></li>");
  }).join(""), "</ul>") : '<p class="hint">Henüz öğrenci yok. Sınıf kodunu paylaş.</p>', '\n  </section>\n  <section class="block">\n    <div class="block-head"><h2>Gönderilen programlar</h2></div>\n    ').concat(progs.length ? '<ul class="plist">'.concat(progs.map((p) => {
    const who = p.student_id ? [p.student_id] : students.map((s) => s.user_id);
    const tot = (p.tasks || []).length * who.length;
    const dn = who.reduce((a, u) => a + doneCount(p, u), 0);
    return "<li><div><strong>".concat(esc(p.title || "Program"), '</strong><span class="hint">').concat(weekRange(wkKey(mondayOf(fromKey(p.week_start)))), " · ").concat((p.tasks || []).length, " görev · ").concat(p.student_id ? esc(name(p.student_id)) + " için" : "bütün sınıf", "</span>\n        ").concat(tot ? '<span class="minibar"><span style="width:'.concat(Math.round(dn / tot * 100), '%"></span></span><span class="hint">Tamamlanma %').concat(Math.round(dn / tot * 100), "</span>") : "", '</div>\n        <button class="link danger sm" data-act="sc-prog-del" data-p="').concat(p.id, '">Sil</button></li>');
  }).join(""), "</ul>") : '<p class="hint">Henüz program gönderilmedi.</p>', '\n  </section>\n  <div class="row"><button class="link danger" data-act="sc-class-del" data-c="').concat(cid, '">Sınıfı sil</button></div>');
}
function classWeek(D, cid) {
  const students = D.members.filter((x) => x.class_id === cid && x.role === "student");
  const wk = thisWeek(), ids = new Set(students.map((s) => s.user_id));
  const progs = D.programs.filter((p) => (p.class_id === cid || p.student_id && ids.has(p.student_id)) && wkKey(mondayOf(fromKey(p.week_start))) === wk);
  let t = 0, d = 0;
  students.forEach((s) => progs.forEach((p) => {
    if (p.class_id === cid || p.student_id === s.user_id) {
      t += (p.tasks || []).length;
      d += doneCount(p, s.user_id);
    }
  }));
  return { n: students.length, progs: progs.length, pct: t ? Math.round(d / t * 100) : null };
}
function teacherToday() {
  const p = DB.d.profile, h = (/* @__PURE__ */ new Date()).getHours(), di = todayIdx();
  const hi = h < 5 ? "İyi geceler" : h < 12 ? "Günaydın" : h < 18 ? "İyi günler" : "İyi akşamlar";
  const staff = Cloud.school.filter((m) => m.role !== "student");
  staff.forEach((m) => {
    const i = m.institution_id;
    if (!SC.data[i]) {
      try {
        const c = JSON.parse(localStorage.getItem("dersozetim.sc." + i) || "null");
        if (c) SC.data[i] = c;
      } catch (e) {
      }
      scLoad(i, true);
    }
  });
  const instCard = (m) => {
    const inst = m.institution_id, D = SC.data[inst];
    if (!D) return '<section class="block t-inst"><div class="block-head"><h2>'.concat(esc(m.inst ? m.inst.name : "Dershane"), '</h2><span class="tag">').concat(ROLE_NAME[m.role], '</span></div><div class="progress"><span class="spinner" aria-hidden="true"></span><span>Yükleniyor…</span></div></section>');
    SC.cur = D;
    const stu = D.members.filter((x) => x.role === "student").length, tcode = D.codes.find((c) => c.role === "teacher");
    return '<section class="block t-inst">\n      <div class="block-head"><h2>'.concat(esc(m.inst.name), '</h2><span class="tag">').concat(ROLE_NAME[m.role], '</span></div>\n      <p class="hint">').concat(D.classes.length, " sınıf · ").concat(stu, " öğrenci · ").concat(D.members.length - stu, " hoca</p>\n      ").concat(D.classes.length ? '<ul class="t-classes">'.concat(D.classes.map((c) => {
      const x = classWeek(D, c.id);
      return '<li><a href="#/dershane/'.concat(inst, "/").concat(c.id, '"><span class="tc-n">').concat(esc(c.name), '</span><span class="tc-s">').concat(x.n, " öğrenci").concat(x.pct == null ? " · bu hafta program yok" : "", "</span>\n          ").concat(x.pct == null ? "" : '<span class="minibar" aria-label="Bu hafta %'.concat(x.pct, ' tamamlandı"><span style="width:').concat(x.pct, '%"></span></span><span class="tc-p">%').concat(x.pct, "</span>")).concat(I.next, "</a></li>");
    }).join(""), "</ul>") : '<p class="hint">Henüz sınıf yok. Dershaneyi açıp sınıf ekle; her sınıfın öğrencilere vereceğin bir kodu olur.</p>', '\n      <div class="row"><a class="btn sm primary" href="#/dershane/').concat(inst, '">Dershaneyi aç</a><button class="btn sm" data-act="room-new" data-inst="').concat(inst, '">Ders odası aç</button>').concat(m.role === "owner" && tcode ? '<button class="btn sm" data-act="sc-copy" data-code="'.concat(esc(tcode.code), '">Hoca kodu: ').concat(esc(tcode.code), "</button>") : "", "</div>\n    </section>");
  };
  const nSims = typeof LAB !== "undefined" ? LAB.sims.length : 0;
  return '\n  <header class="top"><p class="top-date">'.concat(DAYS[di], ", ").concat(fmtDay(/* @__PURE__ */ new Date()), '</p><a class="avatar" href="#/profil" aria-label="Profil">').concat(esc((p.name || "?").charAt(0).toLocaleUpperCase("tr")), '</a></header>\n  <section class="hero">\n    <h1 class="greet">').concat(hi).concat(p.name ? ", " + esc(firstName(p.name)) + " Hoca" : "", '.</h1>\n    <p class="lede">').concat(staff.length ? "Sınıflarının bu haftaki durumu aşağıda. Program göndermek için sınıfa dokun." : "Dershaneni kur ya da kurucunun verdiği hoca koduyla katıl; sınıflarını ve öğrencilerini buradan takip edersin.", "</p>\n  </section>\n  ").concat(staff.length ? staff.map(instCard).join("") : '<section class="block">'.concat(emptyBlock("Dershanen yok", "Dershaneyi sen kuruyorsan oluştur. Başka bir hocanın dershanesine katılıyorsan ondan hoca kodunu iste.", '<button class="btn primary" data-act="sc-new">Dershane oluştur</button><button class="btn" data-act="sc-join">Hoca koduyla katıl</button>'), "</section>"), "\n  ").concat((() => {
    const wk = thisWeek(), w = DB.week(wk), ts = w ? w.tasks.filter((t) => t.day === di) : [];
    return ts.length ? '<section class="block"><div class="block-head"><h2>Kendi görevlerin</h2><a href="#/program">Tüm hafta</a></div><ul class="tasks">'.concat(ts.map((t) => taskRow(wk, t)).join(""), "</ul></section>") : "";
  })(), '\n  <section class="block">\n    <div class="block-head"><h2>Derste kullan</h2></div>\n    <ul class="t-tools">\n      <li><a href="#/lab"><span class="tt-ic">').concat(I.flask, "</span><span><strong>Laboratuvar</strong><span>").concat(nSims, ' deney ve animasyon; tahtada göster</span></span></a></li>\n      <li><a href="#/kitaplik"><span class="tt-ic">').concat(I.book, "</span><span><strong>Konu özetleri</strong><span>").concat(allTopics().length, ' konu, PDF olarak da iner</span></span></a></li>\n      <li><a href="#/asistan/sor"><span class="tt-ic">').concat(I.spark, '</span><span><strong>Yapay zekâya sor</strong><span>Soru çözümü, örnek soru, anlatım fikri</span></span></a></li>\n      <li><a href="#/odak"><span class="tt-ic">').concat(I.timer, '</span><span><strong>Odak sayacı ve kronometre</strong><span>Derste süre tut, sınav provası yap</span></span></a></li>\n      <li><a href="#/odalar"><span class="tt-ic">').concat(I.rooms, "</span><span><strong>Ders odaları</strong><span>Sesli, görüntülü ya da yazışarak</span></span></a></li>\n    </ul>\n  </section>\n  ").concat(Cloud.enabled ? installBanner() : "");
}
async function setRole(inst, uid, role, cls, name) {
  try {
    await Cloud.rpc("set_member_role", { p_inst: inst, p_user: uid, p_role: role, p_class: cls });
  } catch (e) {
    toast(e.message || "Değiştirilemedi");
    return false;
  }
  closeSheet();
  toast((name || "Üye") + (role === "teacher" ? " artık hoca" : " artık öğrenci"));
  await scLoad(inst, true);
  return true;
}
function roleSheet(uid) {
  const [inst] = route.arg.split("/"), D = SC.data[inst], x = D && D.members.find((y) => y.user_id === uid);
  if (!x) return;
  const name = x.p ? x.p.name : "Üye";
  const box = openSheet(name, '<p class="hint">Hoca dershanenin sınıflarını ve öğrencilerini görür, program gönderir. Öğrenci kendi sınıfının programını alır.</p>\n    <div class="kind-pick" role="radiogroup" aria-label="Rol">\n      <label class="kind"><input type="radio" name="rs-r" value="teacher"'.concat(x.role === "teacher" ? " checked" : "", ">").concat(KIND_ICON.teacher, '<span><strong>Hoca</strong><span>Sınıfları yönetir</span></span></label>\n      <label class="kind"><input type="radio" name="rs-r" value="student"').concat(x.role === "student" ? " checked" : "", ">").concat(KIND_ICON.student, '<span><strong>Öğrenci</strong><span>Sınıfının programını alır</span></span></label></div>\n    <div data-for="student">').concat(D.classes.length ? '<label class="f-h" for="rs-c">Sınıfı</label><select id="rs-c">'.concat(D.classes.map((c) => '<option value="'.concat(c.id, '"').concat(c.id === x.class_id ? " selected" : "", ">").concat(esc(c.name), "</option>")).join(""), "</select>") : '<p class="err">Önce bir sınıf ekle; öğrenci bir sınıfta olmalı.</p>', '</div>\n    <div class="row"><button class="btn primary" id="rs-go">Kaydet</button><button class="btn danger" id="rs-x">Dershaneden çıkar</button></div>'));
  bindKind(box, "rs-r");
  $("#rs-go", box).addEventListener("click", () => {
    const r = ($('input[name="rs-r"]:checked', box) || {}).value, c = $("#rs-c", box);
    if (r === "student" && !c) return;
    if (r === x.role && (r === "teacher" || c && c.value === x.class_id)) {
      closeSheet();
      return;
    }
    setRole(inst, uid, r, r === "student" ? c.value : null, name);
  });
  const del = $("#rs-x", box);
  del.addEventListener("click", async () => {
    if (del.dataset.armed !== "1") {
      del.dataset.armed = "1";
      del.textContent = "Tekrar bas";
      return;
    }
    const { error } = await Cloud.sb.from("memberships").delete().eq("institution_id", inst).eq("user_id", uid);
    if (error) {
      toast("Çıkarılamadı: " + error.message);
      return;
    }
    closeSheet();
    toast(name + " dershaneden çıkarıldı");
    scLoad(inst, true);
  });
}
function avatarFor(name) {
  return '<span class="avatar sm" aria-hidden="true">'.concat(esc(String(name || "?").charAt(0).toLocaleUpperCase("tr")), "</span>");
}
function toServerTasks(tasks) {
  return tasks.map((t) => ({ day: t.day, text: t.text, label: t.label || sentence(t.text), subject: t.subject || "", topic: t.topic || "", type: t.type || "" }));
}
const nameKey = (x) => String(x || "").toLocaleLowerCase("tr").replace(/[çğıöşüâîû]/g, (c) => ASCII_TR[c] || c).replace(/[^a-z0-9]+/g, " ").trim();
function matchStudent(text, students) {
  const words = new Set(nameKey(text).split(" ").filter((w) => w.length >= 2));
  let best = null, bestScore = 0, tie = false;
  students.forEach((s) => {
    const parts = nameKey(s.p && s.p.name).split(" ").filter((w) => w.length >= 2);
    if (!parts.length) return;
    const hit = parts.filter((w) => words.has(w)).length;
    if (!hit) return;
    const score = hit / parts.length + (words.has(parts[0]) ? 0.5 : 0);
    if (score > bestScore) {
      best = s;
      bestScore = score;
      tie = false;
    } else if (score === bestScore) tie = true;
  });
  return best && !tie ? best.user_id : "";
}
function sendProgramSheet(cid, items, preset) {
  const [inst] = route.arg.split("/");
  const D = SC.data[inst];
  const students = D.members.filter((x) => x.class_id === cid && x.role === "student");
  const one = items.length === 1;
  items.forEach((x) => {
    if (x.to == null) x.to = preset || matchStudent(x.match || x.title, students) || (one ? "class" : "");
  });
  const opts = (sel) => "".concat(one ? "" : '<option value=""'.concat(!sel ? " selected" : "", ">Kime gönderilsin?</option>"), '<option value="class"').concat(sel === "class" ? " selected" : "", ">Bütün sınıf (").concat(students.length, " öğrenci)</option>").concat(students.map((s) => '<option value="'.concat(s.user_id, '"').concat(sel === s.user_id ? " selected" : "", ">").concat(esc(s.p ? s.p.name : "Öğrenci"), "</option>")).join(""));
  const matched = items.filter((x) => x.to && x.to !== "class").length;
  const box = openSheet(one ? "Program gönder" : items.length + " program gönder", "\n    ".concat(!one ? '<p class="hint">'.concat(matched ? "".concat(matched, " programı dosya ya da sayfa adından öğrenciyle eşleştirdim. ") : "", 'Her programın kime gideceğini kontrol et. İpucu: dosyayı öğrencinin adıyla kaydedersen (örn. "Esat Taha Polat.xlsx") kendiliğinden eşleşir.</p>') : "", '\n    <div id="sp-list">').concat(items.map((x, i) => '<div class="im" data-i="'.concat(i, '">\n      <p class="im-n">').concat(esc(x.title), '</p><p class="hint">').concat(x.tasks.length, " görev").concat(x.src ? " · " + esc(x.src) : "", '</p>\n      <label class="f-h sm" for="sp-to-').concat(i, '">Kime?</label><select id="sp-to-').concat(i, '" class="sp-to" data-i="').concat(i, '">').concat(opts(x.to), '</select>\n      <div class="weeknav small"><button class="icon-btn" data-step="-1" aria-label="Önceki hafta">').concat(I.back, '</button><p class="wk-r im-r">').concat(weekRange(x.wk), '</p><button class="icon-btn" data-step="1" aria-label="Sonraki hafta">').concat(I.next, "</button></div></div>")).join(""), '</div>\n    <p class="err" id="sp-e" role="alert"></p>\n    <div class="row"><button class="btn primary" id="sp-go">Gönder</button></div>'));
  $("#sp-list", box).addEventListener("click", (e) => {
    const b = e.target.closest("[data-step]");
    if (!b) return;
    const el = b.closest(".im"), x = items[Number(el.dataset.i)];
    x.wk = wkKey(addDays(fromKey(x.wk), 7 * Number(b.dataset.step)));
    el.querySelector(".im-r").textContent = weekRange(x.wk);
  });
  box.querySelectorAll(".sp-to").forEach((sel) => sel.addEventListener("change", () => {
    items[Number(sel.dataset.i)].to = sel.value;
  }));
  $("#sp-go", box).addEventListener("click", async () => {
    const miss = items.findIndex((x) => !x.to);
    if (miss >= 0) {
      $("#sp-e", box).textContent = '"'.concat(items[miss].title, '" kime gidecek? Seç.');
      $("#sp-to-" + miss, box).focus();
      return;
    }
    const btn = $("#sp-go", box);
    btn.disabled = true;
    btn.textContent = "Gönderiliyor…";
    const rows = items.map((x) => {
      const to = x.to === "class" ? null : x.to;
      return { institution_id: inst, class_id: to ? null : cid, student_id: to, week_start: x.wk, title: x.title.slice(0, 120), tasks: toServerTasks(x.tasks), created_by: Cloud.uid };
    });
    const { error } = await Cloud.sb.from("programs").insert(rows);
    if (error) {
      btn.disabled = false;
      btn.textContent = "Gönder";
      $("#sp-e", box).textContent = "Gönderilemedi: " + error.message;
      return;
    }
    const n = rows.filter((r) => r.student_id).length;
    closeSheet();
    toast(rows.length === 1 ? n ? "Program öğrenciye gönderildi" : "Program sınıfa gönderildi" : rows.length + " program gönderildi" + (n ? " (".concat(n, " öğrenciye özel)") : ""));
    await scLoad(inst, true);
  });
}
async function scExcel(files, cid, preset) {
  const items = [], bad = [];
  const toItem = (p, f, sheet, many) => {
    if (!p.label) {
      const m = f.name.match(/(\d+)[\s_.-]*hafta/i);
      if (m) p.label = m[1] + ". Hafta";
    }
    let tasks = p.tasks.map((t) => {
      const g = guessTask(t.text);
      return { day: t.day, text: t.text, label: sentence(t.text), type: g.type, subject: g.subject, topic: "" };
    });
    tasks = libraryMatch(tasks, libIndex()).tasks;
    const base = f.name.replace(/\.xlsx$/i, "").replace(/_/g, " ");
    const who = many ? p.student || sheet : "";
    return {
      title: who ? (p.label ? p.label + " · " : "") + who : p.label || base,
      wk: p.monday || thisWeek(),
      tasks,
      match: [many ? "" : base, sheet, p.student].filter(Boolean).join(" "),
      src: f.name + (sheet ? " · " + sheet : "")
    };
  };
  for (const f of files) {
    try {
      const sheets = readXlsx(await f.arrayBuffer());
      const found = [];
      sheets.forEach((rows) => parsePrograms(rows).forEach((p) => found.push({ p, sheet: rows.sheetName || "" })));
      if (!found.length) {
        bad.push(f.name);
        continue;
      }
      found.forEach((x) => items.push(toItem(x.p, f, found.length > 1 ? x.sheet : "", found.length > 1)));
    } catch (e) {
      bad.push(f.name);
    }
  }
  if (!items.length) {
    toast("Dosyada haftalık program bulamadım. Gün adları (Pazartesi, Salı…) olan bir .xlsx seç.");
    return;
  }
  if (bad.length) toast("Okunamayan dosya: " + bad.join(", "));
  sendProgramSheet(cid, items, preset);
}
function programEditor(cid, to, prefill) {
  const [inst] = route.arg.split("/"), D = SC.data[inst];
  const who = to ? ((D.members.find((x) => x.user_id === to) || {}).p || {}).name || "Öğrenci" : "Bütün sınıf";
  let wk = prefill && prefill.wk ? prefill.wk : thisWeek();
  const lines = Array.from({ length: 7 }, (_, d) => prefill && prefill.tasks ? prefill.tasks.filter((t) => Number(t.day) === d).map((t) => t.label || t.text).join("\n") : "");
  const box = openSheet("Program yaz: " + who, '<p class="hint">Her güne bir satıra bir görev yaz. Ders ve konu kendiliğinden bulunur; öğrencide konu özeti ve video düğmeleri çıkar.</p>\n    <label class="f-h" for="pe-t">Başlık</label><input id="pe-t" class="input" maxlength="80" value="'.concat(esc(prefill && prefill.title || "Haftalık program"), '">\n    <div class="weeknav small"><button class="icon-btn" data-pe="-1" aria-label="Önceki hafta">').concat(I.back, '</button><p class="wk-r" id="pe-w">').concat(weekRange(wk), '</p><button class="icon-btn" data-pe="1" aria-label="Sonraki hafta">').concat(I.next, '</button></div>\n    <div class="pe-days">').concat(DAYS.map((d, i) => '<label class="f-h sm" for="pe-'.concat(i, '">').concat(d, '</label><textarea id="pe-').concat(i, '" class="input pe-ta" rows="3" placeholder="').concat(i === 0 ? "Örn. Türev konu anlatımı\nTürev 40 soru" : "", '">').concat(esc(lines[i]), "</textarea>")).join(""), '</div>\n    <p class="err" id="pe-e" role="alert"></p>\n    <div class="row"><button class="btn primary" id="pe-go">Gönder</button></div>'));
  box.addEventListener("click", (e) => {
    const b = e.target.closest("[data-pe]");
    if (!b) return;
    wk = wkKey(addDays(fromKey(wk), 7 * Number(b.dataset.pe)));
    $("#pe-w", box).textContent = weekRange(wk);
  });
  $("#pe-go", box).addEventListener("click", async () => {
    let tasks = [];
    for (let d = 0; d < 7; d++) $("#pe-" + d, box).value.split("\n").map((x) => x.trim()).filter(Boolean).forEach((text) => {
      const g = guessTask(text);
      tasks.push({ day: d, text, label: sentence(text), type: g.type, subject: g.subject, topic: "" });
    });
    if (!tasks.length) {
      $("#pe-e", box).textContent = "En az bir görev yaz.";
      return;
    }
    tasks = libraryMatch(tasks, libIndex()).tasks;
    const btn = $("#pe-go", box);
    btn.disabled = true;
    btn.textContent = "Gönderiliyor…";
    const row = { institution_id: inst, class_id: to ? null : cid, student_id: to || null, week_start: wk, title: ($("#pe-t", box).value.trim() || "Haftalık program").slice(0, 120), tasks: toServerTasks(tasks), created_by: Cloud.uid };
    const { error } = await Cloud.sb.from("programs").insert(row);
    if (error) {
      btn.disabled = false;
      btn.textContent = "Gönder";
      $("#pe-e", box).textContent = "Gönderilemedi: " + error.message;
      return;
    }
    closeSheet();
    toast(to ? who + " için program gönderildi" : "Program sınıfa gönderildi");
    await scLoad(inst, true);
  });
}
let scUploadClass = null, scUploadStudent = null;
Object.assign(ACT, {
  "sc-join": () => {
    const box = openSheet("Kodla katıl", '<p class="hint">Hocandan aldığın sınıf kodunu ya da hoca kodunu yaz.</p>\n      <input id="sj-c" class="input code-in" maxlength="10" placeholder="Örn. GAF7DU" autocomplete="off" autocapitalize="characters" autofocus>\n      <p class="err" id="sj-e" role="alert"></p><div class="row"><button class="btn primary" id="sj-go">Katıl</button></div>');
    const go2 = async () => {
      const code = $("#sj-c", box).value.trim();
      if (code.length < 6) {
        $("#sj-e", box).textContent = "Kod en az 6 karakter.";
        return;
      }
      $("#sj-go", box).disabled = true;
      try {
        const r = await Cloud.joinCode(code);
        closeSheet();
        toast(r.role === "student" ? "Sınıfa katıldın. Programın gelince Program sayfanda görünecek." : "Dershaneye hoca olarak katıldın.");
        go("#/dershane/" + r.institution_id);
      } catch (e) {
        $("#sj-go", box).disabled = false;
        $("#sj-e", box).textContent = e.message || "Katılamadın.";
      }
    };
    $("#sj-go", box).addEventListener("click", go2);
    $("#sj-c", box).addEventListener("keydown", (e) => {
      if (e.key === "Enter") go2();
    });
  },
  "sc-new": () => {
    const box = openSheet("Dershane oluştur", '<label class="f-h" for="sn-n">Dershanenin adı</label>\n      <input id="sn-n" class="input" maxlength="80" placeholder="Örn. Bilgi Dershanesi Kadıköy" autocomplete="off" autofocus>\n      <label class="f-h" for="sn-c">İlk sınıf (isteğe bağlı)</label><input id="sn-c" class="input" maxlength="60" placeholder="Örn. 12-A Sayısal" autocomplete="off">\n      <p class="err" id="sn-e" role="alert"></p><div class="row"><button class="btn primary" id="sn-go">Oluştur</button></div>');
    $("#sn-go", box).addEventListener("click", async () => {
      const n = $("#sn-n", box).value.trim(), c = $("#sn-c", box).value.trim();
      if (n.length < 2) {
        $("#sn-e", box).textContent = "Dershanenin adını yaz.";
        return;
      }
      $("#sn-go", box).disabled = true;
      try {
        const id = await Cloud.rpc("create_institution", { p_name: n });
        if (c) await Cloud.rpc("create_class", { p_inst: id, p_name: c });
        await Cloud.loadSchool();
        closeSheet();
        go("#/dershane/" + id);
        toast("Dershane oluşturuldu");
      } catch (e) {
        $("#sn-go", box).disabled = false;
        $("#sn-e", box).textContent = e.message;
      }
    });
  },
  "sc-class-new": () => {
    const inst = route.arg.split("/")[0];
    const box = openSheet("Sınıf ekle", '<label class="f-h" for="cn-n">Sınıfın adı</label><input id="cn-n" class="input" maxlength="60" placeholder="Örn. 12-B Eşit Ağırlık" autocomplete="off" autofocus>\n      <p class="err" id="cn-e" role="alert"></p><div class="row"><button class="btn primary" id="cn-go">Ekle</button></div>');
    $("#cn-go", box).addEventListener("click", async () => {
      const n = $("#cn-n", box).value.trim();
      if (!n) return;
      try {
        await Cloud.rpc("create_class", { p_inst: inst, p_name: n });
        closeSheet();
        toast("Sınıf eklendi");
        await scLoad(inst, true);
      } catch (e) {
        $("#cn-e", box).textContent = e.message;
      }
    });
  },
  "sc-class-del": async (el) => {
    if (el.dataset.armed !== "1") {
      el.dataset.armed = "1";
      el.textContent = "Sınıf ve programları silinecek. Tekrar bas";
      return;
    }
    const inst = route.arg.split("/")[0];
    const { error } = await Cloud.sb.from("classes").delete().eq("id", el.dataset.c);
    if (error) {
      toast("Silinemedi: " + error.message);
      return;
    }
    toast("Sınıf silindi");
    go("#/dershane/" + inst);
    scLoad(inst, true);
  },
  "sc-copy": async (el) => {
    const t = el.dataset.code;
    let ok = false;
    try {
      await navigator.clipboard.writeText(t);
      ok = true;
    } catch (e) {
    }
    toast(ok ? "Kod kopyalandı: " + t : "Kod: " + t);
  },
  "sc-renew": async (el) => {
    if (el.dataset.armed !== "1") {
      el.dataset.armed = "1";
      el.textContent = "Eski kod çalışmayacak. Tekrar bas";
      return;
    }
    try {
      await Cloud.rpc("renew_code", { p_code: el.dataset.code });
      toast("Yeni kod oluşturuldu");
      scLoad(route.arg.split("/")[0], true);
    } catch (e) {
      toast(e.message);
    }
  },
  "sc-reload": (el) => {
    const i = el.dataset.i;
    Cloud.loadSchool().then(() => scLoad(i, true));
  },
  "sc-leave": async (el) => {
    const inst = el.dataset.i, m = Cloud.member(inst);
    if (!m) return;
    if (el.dataset.armed !== "1") {
      el.dataset.armed = "1";
      el.textContent = m.role === "owner" ? "Bütün sınıflar, programlar ve odalar silinecek. Tekrar bas" : "Emin misin? Tekrar bas";
      return;
    }
    const q = m.role === "owner" ? Cloud.sb.from("institutions").delete().eq("id", inst) : Cloud.sb.from("memberships").delete().eq("institution_id", inst).eq("user_id", Cloud.uid);
    const { error } = await q;
    if (error) {
      toast(error.message);
      return;
    }
    delete SC.data[inst];
    await Cloud.loadSchool();
    await Cloud.pullPrograms();
    go("#/dershane");
    toast(m.role === "owner" ? "Dershane silindi" : "Dershaneden ayrıldın");
  },
  "sc-up": (el) => {
    scUploadClass = el.dataset.c;
    scUploadStudent = el.dataset.u || null;
    closeSheet();
    $("#file-xlsx-sc").click();
  },
  "sc-write": (el) => {
    closeSheet();
    programEditor(el.dataset.c, el.dataset.u || null);
  },
  "sc-last": (el) => {
    const [inst] = route.arg.split("/"), D = SC.data[inst], u = el.dataset.u;
    const last = D.programs.filter((p) => p.student_id === u).concat(D.programs.filter((p) => p.class_id === el.dataset.c)).sort((a, b) => String(b.week_start).localeCompare(String(a.week_start)))[0];
    if (!last) {
      toast("Bu öğrenciye daha önce program gönderilmemiş.");
      return;
    }
    closeSheet();
    programEditor(el.dataset.c, u, { title: last.title, tasks: last.tasks || [], wk: wkKey(addDays(mondayOf(fromKey(last.week_start)), 7)) });
  },
  "sc-mine": (el) => {
    const cid = el.dataset.c, to = el.dataset.u || null;
    closeSheet();
    const weeks = Object.keys(DB.d.weeks).sort().reverse().filter((k) => DB.d.weeks[k].tasks.some((t) => t.src !== "dershane"));
    if (!weeks.length) {
      toast("Programında gönderilecek bir hafta yok. Önce Program sayfasında görevleri yaz.");
      return;
    }
    const box = openSheet("Kendi programımdan", '<p class="hint">Hangi haftayı göndermek istiyorsun?</p><ul class="menu">'.concat(weeks.map((k) => {
      const w = DB.d.weeks[k];
      return '<li><button data-wk="'.concat(k, '"><span>').concat(esc(w.label || "Program"), '</span><span class="mv">').concat(weekRange(k), ", ").concat(w.tasks.filter((t) => t.src !== "dershane").length, " görev</span></button></li>");
    }).join(""), "</ul>"));
    box.addEventListener("click", (e) => {
      const b = e.target.closest("[data-wk]");
      if (!b) return;
      const w = DB.d.weeks[b.dataset.wk];
      closeSheet();
      sendProgramSheet(cid, [{ title: w.label || "Haftalık program", wk: b.dataset.wk, tasks: w.tasks.filter((t) => t.src !== "dershane") }], to);
    });
  },
  "sc-prog-del": async (el) => {
    if (el.dataset.armed !== "1") {
      el.dataset.armed = "1";
      el.textContent = "Tekrar bas";
      return;
    }
    const { error } = await Cloud.sb.from("programs").delete().eq("id", el.dataset.p);
    if (error) {
      toast(error.message);
      return;
    }
    closeSheet();
    toast("Program silindi");
    scLoad(route.arg.split("/")[0], true);
  },
  /* kurucu: üyeyi hoca ya da öğrenci yap */
  "sc-mem": (el) => roleSheet(el.dataset.u),
  "sc-stu": (el) => {
    const [inst, cid] = route.arg.split("/"), D = SC.data[inst], s = D.members.find((x2) => x2.user_id === el.dataset.u);
    if (!s) return;
    const mine = D.programs.filter((p) => p.student_id === s.user_id).sort((a, b) => String(b.week_start).localeCompare(String(a.week_start)));
    const u = s.user_id;
    const box = openSheet(s.p ? s.p.name : "Öğrenci", '<p class="hint">'.concat(esc(whoTag(s.p) || "")).concat(s.p && s.p.goal ? " · " + esc(s.p.goal) + " hedefliyor" : "", '</p>\n      <h3 class="f-h">Bu öğrenciye özel program</h3>\n      <div class="row"><button class="btn primary" data-act="sc-write" data-c="').concat(cid, '" data-u="').concat(u, '">Program yaz</button><button class="btn" data-act="sc-up" data-c="').concat(cid, '" data-u="').concat(u, "\">Excel'den yükle</button>\n        ").concat(mine.length ? '<button class="btn" data-act="sc-last" data-c="'.concat(cid, '" data-u="').concat(u, '">Son programdan başla</button>') : "", '<button class="btn" data-act="sc-mine" data-c="').concat(cid, '" data-u="').concat(u, '">Kendi programımdan</button></div>\n      ').concat(mine.length ? '<ul class="plist">'.concat(mine.slice(0, 6).map((p) => {
      const n = (p.tasks || []).length, dn = doneCount(p, u);
      return "<li><div><strong>".concat(esc(p.title || "Program"), '</strong><span class="hint">').concat(weekRange(wkKey(mondayOf(fromKey(p.week_start)))), " · ").concat(n, " görev").concat(n ? " · %" + Math.round(dn / n * 100) + " bitti" : "", '</span></div><button class="link danger sm" data-act="sc-prog-del" data-p="').concat(p.id, '">Sil</button></li>');
    }).join(""), "</ul>") : '<p class="hint">Bu öğrenciye henüz özel program gönderilmedi; sınıfa gönderilenleri alıyor.</p>', '\n      <label class="f-h" for="ss-c">Sınıfı</label>\n      <select id="ss-c">').concat(D.classes.map((c) => '<option value="'.concat(c.id, '"').concat(c.id === cid ? " selected" : "", ">").concat(esc(c.name), "</option>")).join(""), '</select>\n      <div class="row"><button class="btn primary" id="ss-go">Kaydet</button>').concat(Cloud.member(inst) && Cloud.member(inst).role === "owner" ? '<button class="btn" id="ss-t">Hoca yap</button>' : "", '<button class="btn danger" id="ss-x">Dershaneden çıkar</button></div>'));
    const st = $("#ss-t", box);
    if (st) st.addEventListener("click", () => setRole(inst, s.user_id, "teacher", null, s.p ? s.p.name : ""));
    $("#ss-go", box).addEventListener("click", async () => {
      const { error } = await Cloud.sb.from("memberships").update({ class_id: $("#ss-c", box).value }).eq("institution_id", inst).eq("user_id", s.user_id);
      if (error) {
        toast(error.message);
        return;
      }
      closeSheet();
      toast("Sınıfı değişti");
      scLoad(inst, true);
    });
    const x = $("#ss-x", box);
    x.addEventListener("click", async () => {
      if (x.dataset.armed !== "1") {
        x.dataset.armed = "1";
        x.textContent = "Tekrar bas";
        return;
      }
      const { error } = await Cloud.sb.from("memberships").delete().eq("institution_id", inst).eq("user_id", s.user_id);
      if (error) {
        toast(error.message);
        return;
      }
      closeSheet();
      toast("Öğrenci çıkarıldı");
      scLoad(inst, true);
    });
  }
});
document.addEventListener("change", (e) => {
  if (e.target.id === "file-xlsx-sc") {
    const fs = Array.from(e.target.files || []);
    e.target.value = "";
    if (fs.length && scUploadClass) scExcel(fs, scUploadClass, scUploadStudent);
  }
});
VIEWS.dershane = dershaneView;
