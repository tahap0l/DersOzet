/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0. Eski tarayıcılar için çevrilmiş kopya; kaynak app/js, üreten tools/build-legacy.sh */
"use strict";
const PUSH = { key: (window.DO_CONFIG || {}).vapidPublic || "", row: null, sub: null, checked: false };
const pushOk = () => ENV === "web" && !!PUSH.key && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
const standalone = () => !!(navigator.standalone || window.matchMedia && matchMedia("(display-mode: standalone)").matches);
function b64u(s) {
  const p = "=".repeat((4 - s.length % 4) % 4), b = atob((s + p).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}
async function swReady() {
  const r = await Promise.race([navigator.serviceWorker.ready, new Promise((res) => setTimeout(() => res(null), 6e3))]);
  if (!r) throw new Error("nosw");
  return r;
}
async function pushCheck() {
  if (!pushOk() || !Cloud.uid) return null;
  try {
    const reg = await swReady();
    PUSH.sub = await reg.pushManager.getSubscription();
    PUSH.row = null;
    if (PUSH.sub && Notification.permission === "granted") {
      const { data } = await Cloud.sb.from("push_subs").select("endpoint, remind_at, programs").eq("endpoint", PUSH.sub.endpoint).maybeSingle();
      PUSH.row = data || null;
    }
  } catch (e) {
  }
  PUSH.checked = true;
  return PUSH.row;
}
async function pushEnable(remindAt, programs) {
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("denied");
  const reg = await swReady();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(PUSH.key) });
  const j = sub.toJSON();
  const row = { endpoint: sub.endpoint, user_id: Cloud.uid, p256dh: j.keys.p256dh, auth: j.keys.auth, remind_at: remindAt || null, programs: !!programs, fails: 0 };
  const { error } = await Cloud.sb.from("push_subs").upsert(row);
  if (error) throw error;
  PUSH.sub = sub;
  PUSH.row = row;
  DB.d.profile.pushAsked = true;
  DB.save();
}
async function pushDisable() {
  try {
    if (PUSH.sub) {
      await Cloud.sb.from("push_subs").delete().eq("endpoint", PUSH.sub.endpoint);
      await PUSH.sub.unsubscribe();
    }
  } catch (e) {
  }
  PUSH.sub = null;
  PUSH.row = null;
}
function pushWhy() {
  if (ENV !== "web") return "Bildirimler bu görünümde kullanılamıyor.";
  if (!Cloud.uid) return "Bildirimler için hesabına giriş yap.";
  if (isIOS() && !standalone()) return "iPhone ve iPad'de bildirim için önce uygulamayı ana ekrana ekle (Paylaş > Ana Ekrana Ekle), sonra ana ekrandaki simgeden aç.";
  if (!pushOk()) return "Bu tarayıcı bildirimleri desteklemiyor. Telefonunu ve tarayıcını güncellemeyi dene.";
  if (Notification.permission === "denied") return "Bildirim izni kapalı. Tarayıcının site ayarlarından bu sitenin bildirim iznini aç.";
  return "";
}
async function pushSheet() {
  const why = pushWhy();
  const box = openSheet("Bildirimler", '<div id="pu-b"><div class="progress"><span class="spinner" aria-hidden="true"></span><span>Bakılıyor…</span></div></div>');
  if (!why) await pushCheck();
  if (!document.contains(box)) return;
  const r = PUSH.row, on = !!r, t = r && r.remind_at || DB.d.profile.remindAt || "20:00";
  const hours = [];
  for (let h = 7; h <= 23; h++) ["00", "30"].forEach((m) => hours.push(pad(h) + ":" + m));
  $("#pu-b", box).innerHTML = why ? '<p class="hint">'.concat(esc(why), "</p>").concat(isIOS() && !standalone() ? '<div class="row"><a class="btn" href="#/kur">Nasıl eklenir?</a></div>' : "") : '\n    <p class="hint">'.concat(on ? "Bu cihazda bildirimler açık." : "Bu cihaza bildirim gönderelim mi? İstediğin zaman kapatırsın.", '</p>\n    <label class="switch-row"><input type="checkbox" id="pu-d"').concat(!on || r.remind_at ? " checked" : "", '><span><strong>Günlük hatırlatma</strong><span class="hint">Kalan görevlerin, tekrar bekleyen yanlışların ya da serin için günde bir kez.</span></span></label>\n    <label class="f-h" for="pu-t">Saat</label><select id="pu-t">').concat(hours.map((h) => "<option".concat(h === t ? " selected" : "", ">").concat(h, "</option>")).join(""), '</select>\n    <label class="switch-row"><input type="checkbox" id="pu-p"').concat(!on || r.programs ? " checked" : "", '><span><strong>Hocam program gönderince</strong><span class="hint">Dershaneden yeni haftalık program gelince haber ver.</span></span></label>\n    <p class="err" id="pu-e" role="alert"></p>\n    <div class="row"><button class="btn primary" id="pu-go">').concat(on ? "Kaydet" : "Bildirimleri aç", "</button>").concat(on ? '<button class="btn" id="pu-test">Deneme bildirimi</button><button class="btn danger" id="pu-off">Kapat</button>' : "", "</div>");
  if (why) return;
  const err = $("#pu-e", box);
  $("#pu-go", box).addEventListener("click", async (e) => {
    const b = e.currentTarget;
    b.disabled = true;
    err.textContent = "";
    const at = $("#pu-d", box).checked ? $("#pu-t", box).value : null;
    DB.d.profile.remindAt = $("#pu-t", box).value;
    try {
      await pushEnable(at, $("#pu-p", box).checked);
      closeSheet();
      toast(at ? "Tamam, her gün ".concat(at, "'de hatırlatırım.") : "Bildirimler açık.");
      render();
    } catch (x) {
      b.disabled = false;
      err.textContent = x && x.message === "denied" ? 'İzin verilmedi. Tarayıcı sorunca "İzin ver"e bas.' : x && x.message === "nosw" ? "Uygulama hazır değil. Sayfayı yenileyip tekrar dene." : "Açılamadı. İnternet bağlantını kontrol et.";
    }
  });
  const tb = $("#pu-test", box);
  if (tb) tb.addEventListener("click", async () => {
    tb.disabled = true;
    try {
      const { data, error } = await Cloud.sb.functions.invoke("push", { body: { mode: "test" } });
      if (error || !data || !data.sent) throw error || new Error("none");
      toast("Gönderildi; birkaç saniye içinde gelir.");
    } catch (e) {
      toast("Gönderilemedi. Biraz sonra tekrar dene.");
    }
    tb.disabled = false;
  });
  const ob = $("#pu-off", box);
  if (ob) ob.addEventListener("click", async () => {
    await pushDisable();
    closeSheet();
    toast("Bildirimler kapandı");
    render();
  });
}
function pushBanner() {
  if (DB.d.profile.pushAsked || isTeacher() || !Cloud.uid || pushWhy()) return "";
  if (!PUSH.checked) {
    pushCheck().then(() => {
      if (route.page === "bugun" && !sheetEl && !PUSH.row) render();
    });
    return "";
  }
  if (PUSH.row) return "";
  return '<aside class="push-ban">'.concat(I.bell, '<span><strong>Görevlerini hatırlatayım mı?</strong><span>Her akşam kalan görevlerini, hocan program gönderince de haber veririm.</span></span>\n    <span class="pb-a"><button class="btn sm primary" data-act="push-open">Aç</button><button class="link sm" data-act="push-no">Şimdi değil</button></span></aside>');
}
Object.assign(ACT, {
  "push-open": () => pushSheet(),
  "push-no": () => {
    DB.d.profile.pushAsked = true;
    DB.save();
    render();
  }
});
