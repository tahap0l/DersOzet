/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0. Eski tarayıcılar için çevrilmiş kopya; kaynak app/js, üreten tools/build-legacy.sh */
"use strict";
const AD = { data: null, busy: false, err: "", tab: "ozet", q: "" };
async function adLoad(force) {
  if (AD.busy || AD.data && !force) return;
  AD.busy = true;
  AD.err = "";
  try {
    AD.data = await Cloud.rpc("admin_overview");
  } catch (e) {
    AD.err = /Yetki/.test(e.message || "") ? "Bu sayfa yalnızca yöneticiler içindir." : "Bilgiler alınamadı.";
  }
  AD.busy = false;
  if (route.page === "admin") render();
}
const adDate = (s) => {
  if (!s) return "-";
  const d = new Date(s);
  return d.getDate() + " " + MONTHS[d.getMonth()].slice(0, 3) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
};
function adminView() {
  if (!Cloud.isAdmin) return emptyBlock("Yetkin yok", "Bu sayfa yalnızca yöneticiler içindir.", '<a class="btn" href="#/bugun">Bugün\'e dön</a>');
  if (!AD.data) adLoad();
  const D = AD.data, c = D ? D.counts : {};
  const tabs = [["ozet", "Özet"], ["kullanici", "Kullanıcılar"], ["dershane", "Dershaneler"], ["oda", "Odalar"], ["sikayet", "Şikâyetler" + (c.reports ? " (" + c.reports + ")" : "")]];
  let body = "";
  if (AD.err) body = '<p class="err">'.concat(esc(AD.err), "</p>");
  else if (!D) body = '<div class="progress"><span class="spinner" aria-hidden="true"></span><span>Yükleniyor…</span></div>';
  else if (AD.tab === "ozet") body = '<div class="stat-grid">\n      '.concat([["users", "Kullanıcı"], ["users7", "Son 7 günde yeni"], ["active1", "Bugün giren"], ["institutions", "Dershane"], ["classes", "Sınıf"], ["programs", "Gönderilen program"], ["rooms", "Açık oda"], ["rooms_live", "Şu an aktif oda"], ["messages1", "Bugünkü mesaj"], ["reports", "Açık şikâyet"]].map(([k, l]) => '<div class="stat'.concat(k === "reports" && c[k] ? " warn" : "", '"><p class="st-n">').concat(c[k] || 0, '</p><p class="st-l">').concat(l, "</p></div>")).join(""), '\n    </div><p class="hint">Son güncelleme: ').concat(adDate((/* @__PURE__ */ new Date()).toISOString()), "</p>");
  else if (AD.tab === "kullanici") {
    const q = AD.q.toLocaleLowerCase("tr");
    const list = D.users.filter((u) => !q || (u.email || "").toLowerCase().includes(q) || (u.name || "").toLocaleLowerCase("tr").includes(q) || whoTag(u).toLocaleLowerCase("tr").includes(q));
    body = '<input class="input" id="ad-q" placeholder="Ad, e-posta ya da sınıf ara" value="'.concat(esc(AD.q), '" autocomplete="off">\n      <ul class="people ad-list">').concat(list.map((u) => "<li>".concat(avatarFor(u.name), '<span class="pp-b"><strong>').concat(esc(u.name || "(adsız)")).concat(whoTag(u) ? ' <span class="tag'.concat(u.kind === "teacher" ? " t" : "", '">').concat(esc(whoTag(u)), "</span>") : "").concat(u.banned ? ' <span class="tag-x">engelli</span>' : "", '</strong><span class="hint">').concat(esc(u.email || "")).concat(u.track && u.kind !== "teacher" ? " · " + esc((TRACKS[String(u.track).toUpperCase()] || {}).name || u.track) : "", "</span>\n        ").concat((u.school_names || []).length ? '<span class="hint">'.concat(esc(u.school_names.join(", ")), "</span>") : "", '\n        <span class="hint">Katıldı ').concat(adDate(u.created_at), " · son giriş ").concat(adDate(u.last), " · ").concat(u.schools, " dershane · ").concat(esc((u.providers || []).join(", ")), "</span></span>\n        ").concat(u.id === Cloud.uid ? '<span class="hint">sen</span>' : '<button class="btn sm'.concat(u.banned ? "" : " danger", '" data-act="ad-do" data-a="').concat(u.banned ? "unban_user" : "ban_user", '" data-id="').concat(u.id, '">').concat(u.banned ? "Engeli kaldır" : "Engelle", "</button>"), "</li>")).join(""), "</ul>");
  } else if (AD.tab === "dershane") body = D.institutions.length ? '<ul class="plist">'.concat(D.institutions.map((i) => "<li><div><strong>".concat(esc(i.name), '</strong><span class="hint">').concat(esc(i.owner || ""), " kurdu · ").concat(adDate(i.created_at), '</span><span class="hint">').concat(i.classes, " sınıf, ").concat(i.students, " öğrenci, ").concat(i.teachers, ' hoca</span></div>\n      <button class="link danger sm" data-act="ad-do" data-a="delete_institution" data-id="').concat(i.id, '">Sil</button></li>')).join(""), "</ul>") : '<p class="hint">Henüz dershane yok.</p>';
  else if (AD.tab === "oda") body = D.rooms.length ? '<ul class="plist">'.concat(D.rooms.map((r) => "<li><div><strong>".concat(esc(r.name), '</strong><span class="hint">').concat(r.kind === "class" ? esc(r.school || "Dershane") : "Arkadaş odası, kod " + esc(r.code || ""), " · ").concat(esc(r.owner || ""), ' açtı</span><span class="hint">').concat(r.members, " üye, ").concat(r.messages, " mesaj · ").concat(ago(r.last_active), '</span></div>\n      <span class="ad-acts"><button class="link sm" data-act="ad-msgs" data-id="').concat(r.id, '" data-n="').concat(esc(r.name), '">Mesajlar</button><button class="link danger sm" data-act="ad-do" data-a="close_room" data-id="').concat(r.id, '">Kapat</button></span></li>')).join(""), "</ul>") : '<p class="hint">Açık oda yok.</p>';
  else if (AD.tab === "sikayet") body = D.reports.length ? D.reports.map((r) => '<article class="report">\n      <p class="hint">'.concat(adDate(r.created_at), " · ").concat(esc(r.room || "oda silinmiş"), "</p>\n      <p><strong>").concat(esc(r.reporter || "Biri"), "</strong> → <strong>").concat(esc(r.reported || "bilinmiyor"), "</strong>: ").concat(esc(r.reason || ""), "</p>\n      ").concat(r.message ? '<p class="m-body quote">'.concat(esc(r.message), "</p>") : "", '\n      <div class="row">').concat(r.message_id ? '<button class="btn sm" data-act="ad-do" data-a="delete_message" data-id="'.concat(r.message_id, '">Mesajı sil</button>') : "").concat(r.reported_id ? '<button class="btn sm danger" data-act="ad-do" data-a="ban_user" data-id="'.concat(r.reported_id, '">Kişiyi engelle</button>') : "", '<button class="btn sm" data-act="ad-do" data-a="close_report" data-id="').concat(r.id, '">Şikâyeti kapat</button></div>\n    </article>')).join("") : '<p class="hint">Açık şikâyet yok.</p>';
  return '<header class="page-head"><h1>Yönetici paneli</h1><button class="icon-btn" data-act="ad-reload" aria-label="Yenile">'.concat(I.refresh, '</button></header>\n    <div class="seg scroll" role="tablist">').concat(tabs.map(([k, l]) => '<button class="seg-b'.concat(AD.tab === k ? " on" : "", '" data-act="ad-tab" data-t="').concat(k, '" role="tab" aria-selected="').concat(AD.tab === k, '">').concat(l, "</button>")).join(""), "</div>\n    ").concat(body);
}
const AD_CONFIRM = { ban_user: "Bu kişi bir daha giriş yapamayacak.", delete_institution: "Dershanenin bütün sınıfları, programları ve odaları silinecek.", close_room: "Oda herkes için kapanacak.", delete_message: "Mesaj silinecek." };
Object.assign(ACT, {
  "ad-tab": (el) => {
    AD.tab = el.dataset.t;
    render();
  },
  "ad-reload": () => {
    AD.data = null;
    adLoad(true);
    render();
  },
  "ad-do": async (el) => {
    const a = el.dataset.a;
    if (AD_CONFIRM[a] && el.dataset.armed !== "1") {
      el.dataset.armed = "1";
      el.textContent = "Emin misin? Tekrar bas";
      el.title = AD_CONFIRM[a];
      return;
    }
    el.disabled = true;
    try {
      await Cloud.rpc("admin_action", { p_action: a, p_id: el.dataset.id });
      toast("Yapıldı");
      await adLoad(true);
    } catch (e) {
      el.disabled = false;
      toast(e.message || "Olmadı");
    }
  },
  "ad-msgs": async (el) => {
    const box = openSheet(el.dataset.n || "Mesajlar", '<div id="am"><div class="progress"><span class="spinner" aria-hidden="true"></span><span>Yükleniyor…</span></div></div>');
    let list = [];
    try {
      list = await Cloud.rpc("admin_room_messages", { p_room: el.dataset.id });
    } catch (e) {
    }
    const paint = () => {
      $("#am", box).innerHTML = list.length ? '<ul class="plist">'.concat(list.map((m) => "<li><div><strong>".concat(esc(m.name || "Biri"), '</strong><span class="hint">').concat(adDate(m.created_at), "</span><span>").concat(esc(m.body), '</span></div><button class="link danger sm" data-mid="').concat(m.id, '">Sil</button></li>')).join(""), "</ul>") : '<p class="hint">Mesaj yok.</p>';
    };
    paint();
    box.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-mid]");
      if (!b) return;
      try {
        await Cloud.rpc("admin_action", { p_action: "delete_message", p_id: b.dataset.mid });
        list = list.filter((m) => String(m.id) !== b.dataset.mid);
        paint();
        toast("Mesaj silindi");
      } catch (err) {
        toast(err.message);
      }
    });
  }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "ad-q") {
    AD.q = e.target.value;
    const pos = e.target.selectionStart;
    render();
    const i = $("#ad-q");
    if (i) {
      i.focus();
      i.setSelectionRange(pos, pos);
    }
  }
});
VIEWS.admin = adminView;
