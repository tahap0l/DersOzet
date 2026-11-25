/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
 *
 * install.js: ana ekrana ekleme rehberi. Cihazı ve tarayıcıyı tanır, uygun adımları gösterir;
 * tarayıcı izin veriyorsa tek dokunuşla yükleme düğmesi çıkarır.
 */
'use strict';

const INS = { prompt: null, done: false };
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); INS.prompt = e; if (route && (route.page === 'kur' || route.page === 'bugun' || route.page === 'profil')) render(); });
window.addEventListener('appinstalled', () => { INS.prompt = null; INS.done = true; toast('Ders Özetim ana ekrana eklendi'); render(); });

function devInfo(){
  const ua = navigator.userAgent, touchMac = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  const ios = /iPhone|iPad|iPod/.test(ua) || touchMac, android = /Android/.test(ua);
  const os = ios ? (/iPad/.test(ua) || touchMac ? 'ipad' : 'iphone') : android ? 'android' : /Windows/.test(ua) ? 'windows' : /Mac/.test(ua) ? 'mac' : 'pc';
  const br = /EdgA?\//.test(ua) ? 'edge' : /SamsungBrowser/.test(ua) ? 'samsung' : /CriOS/.test(ua) ? 'chrome' : /FxiOS|Firefox/.test(ua) ? 'firefox' : /OPR\/|Opera/.test(ua) ? 'opera' : /Chrome\//.test(ua) ? 'chrome' : /Safari\//.test(ua) ? 'safari' : 'other';
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  return { os, br, ios, android, standalone };
}

const SHARE_IC = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M8 7l4-4 4 4"/><path d="M6 11H5v10h14V11h-1"/></svg>';
const DOTS_IC = '<svg viewBox="0 0 24 24" aria-hidden="true" style="fill:currentColor;stroke:none"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>';
const INSTALL_IC = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M12 7.5v6M9.5 11l2.5 2.5 2.5-2.5M8 21h8"/></svg>';
const PLUS_IC = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/></svg>';

const GUIDES = {
  iphone: { name: 'iPhone', steps: [
    ['Safari\'de aç', 'Uygulamayı Safari\'de aç. Chrome kullanıyorsan iOS 16.4 ve sonrasında Chrome\'da da olur.'],
    ['Paylaş\'a dokun', `Alttaki çubukta ${SHARE_IC} <strong>Paylaş</strong> simgesine dokun. Chrome'da adres çubuğunun sağındadır.`],
    ['Ana Ekrana Ekle', `Açılan listeyi biraz kaydır, ${PLUS_IC} <strong>Ana Ekrana Ekle</strong>'yi seç.`],
    ['Ekle', 'Sağ üstteki <strong>Ekle</strong>\'ye bas. Ders Özetim simgesi ana ekranına gelir; oradan açınca tam ekran çalışır.']] },
  ipad: { name: 'iPad', steps: [
    ['Safari\'de aç', 'Uygulamayı Safari\'de aç.'],
    ['Paylaş\'a dokun', `Adres çubuğunun sağındaki ${SHARE_IC} <strong>Paylaş</strong> simgesine dokun.`],
    ['Ana Ekrana Ekle', `${PLUS_IC} <strong>Ana Ekrana Ekle</strong>'yi seç.`],
    ['Ekle', '<strong>Ekle</strong>\'ye bas. Apple Pencil ile defterde çizebilirsin.']] },
  android: { name: 'Android', steps: [
    ['Chrome\'da aç', 'Uygulamayı Chrome\'da aç. Samsung tarayıcısında da olur.'],
    ['Menüyü aç', `Sağ üstteki ${DOTS_IC} <strong>üç nokta</strong> menüsüne dokun. Samsung tarayıcısında alttaki <strong>≡</strong> menüsü.`],
    ['Uygulamayı yükle', `<strong>Uygulamayı yükle</strong> ya da <strong>Ana ekrana ekle</strong>'yi seç. Samsung'da: <strong>Sayfayı ekle > Ana ekran</strong>.`],
    ['Yükle', '<strong>Yükle</strong>\'ye bas. Simge uygulama listene ve ana ekrana gelir.']] },
  pc: { name: 'Bilgisayar', steps: [
    ['Chrome ya da Edge\'de aç', 'Uygulamayı Google Chrome ya da Microsoft Edge\'de aç. Firefox uygulama yüklemeyi desteklemiyor.'],
    ['Yükle simgesine tıkla', `Adres çubuğunun sağındaki ${INSTALL_IC} <strong>yükle</strong> simgesine tıkla. Görmüyorsan menüden: Chrome'da <strong>Kaydet ve paylaş > Sayfayı uygulama olarak yükle</strong>, Edge'de <strong>Uygulamalar > Bu siteyi uygulama olarak yükle</strong>.`],
    ['Yükle', '<strong>Yükle</strong>\'ye bas. Ders Özetim kendi penceresinde açılır; Başlat menüsünde ya da masaüstünde simgesi olur.'],
    ['Mac\'te Safari', 'Safari kullanıyorsan menüden <strong>Dosya > Dock\'a Ekle</strong>.']] }
};

function installView(){
  const d = devInfo(), key = d.os === 'iphone' ? 'iphone' : d.os === 'ipad' ? 'ipad' : d.os === 'android' ? 'android' : 'pc';
  const order = [key].concat(['iphone', 'ipad', 'android', 'pc'].filter(k => k !== key));
  const can = !!INS.prompt;
  const say = d.standalone || INS.done ? ['Şu an Ders Özetim\'i uygulama olarak açmışsın, her şey tamam.', 'Başka bir cihaza da eklemek istersen adımlar aşağıda.']
    : can ? ['Bu tarayıcı tek dokunuşla yüklemeye izin veriyor.', 'Aşağıdaki düğmeye bas, Ders Özetim ana ekranına gelsin.']
    : d.ios && d.br !== 'safari' && d.br !== 'chrome' ? ['iPhone ve iPad\'de ana ekrana eklemek için Safari gerekiyor.', 'Bu sayfanın adresini kopyalayıp Safari\'de aç, sonra adımları izle.']
    : d.br === 'firefox' && !d.android ? ['Firefox bilgisayarda uygulama yüklemeyi desteklemiyor.', 'Chrome ya da Edge\'de açarsan iki tıkla yüklenir.']
    : ['Ana ekrana eklersen Ders Özetim tek dokunuşla, tam ekran açılır ve internetsiz de çalışır.', 'Senin cihazın için adımları en üste koydum.'];
  return `<header class="page-head slim"><a class="back" href="#/profil">${I.back}Profil</a></header>
    <h1 class="page-title">Ana ekrana ekle</h1>
    <section class="mascot-card"><div class="mc-face">${mascotSVG(d.standalone ? 'happy' : 'ok', 68)}</div><div class="mc-b"><p class="mc-name">${MASCOT.name}</p><div class="bubble">${say.map(l => `<p>${esc(l)}</p>`).join('')}</div></div></section>
    ${can ? `<div class="row"><button class="btn primary lg" data-act="ins-go">${I.phone}Ders Özetim'i yükle</button></div>` : ''}
    ${d.ios && d.br !== 'safari' ? `<div class="codebox"><div><p class="cb-l">Bu adresi Safari'de aç</p><p class="cb-url">${esc(location.origin + location.pathname)}</p></div><div class="cb-a"><button class="btn sm" data-act="ins-copy">Kopyala</button></div></div>` : ''}
    ${order.map((k, gi) => { const g = GUIDES[k]; return `<details class="guide"${gi === 0 ? ' open' : ''}><summary><span>${esc(g.name)}</span>${gi === 0 && !d.standalone ? '<span class="tag-now">Senin cihazın</span>' : ''}</summary>
      <ol class="g-steps">${g.steps.map(([t, x]) => `<li><strong class="g-t">${esc(t)}</strong><p>${x}</p></li>`).join('')}</ol></details>`; }).join('')}
    <p class="hint">Uygulama mağazadan indirilmez; sitenin kendisi yüklenir. Güncellemeler kendiliğinden gelir, telefonda neredeyse hiç yer kaplamaz.</p>`;
}

function installBanner(){
  const d = devInfo();
  if (d.standalone || INS.done || DB.d.profile.installHide) return '';
  return `<aside class="ins-banner"><span class="fc-ic">${I.phone}</span><span class="ib-b"><strong>Ana ekrana ekle</strong><span>Tek dokunuşla aç, tam ekran ve internetsiz çalışsın.</span></span>
    ${INS.prompt ? '<button class="btn sm primary" data-act="ins-go">Yükle</button>' : '<a class="btn sm" href="#/kur">Nasıl?</a>'}<button class="icon-btn ghost sm" data-act="ins-hide" aria-label="Gizle">${I.close}</button></aside>`;
}

Object.assign(ACT, {
  'ins-go': async () => {
    if (!INS.prompt){ go('#/kur'); return; }
    const p = INS.prompt; INS.prompt = null;
    try { await p.prompt(); const r = await p.userChoice; if (r && r.outcome === 'accepted') INS.done = true; } catch(e){}
    render();
  },
  'ins-hide': () => { DB.d.profile.installHide = true; DB.save(); render(); toast('Gizlendi. Profil > Ana ekrana ekle\'den her zaman açabilirsin.'); },
  'ins-copy': async () => { const u = location.origin + location.pathname; try { await navigator.clipboard.writeText(u); toast('Adres kopyalandı'); } catch(e){ toast(u); } }
});
VIEWS.kur = installView;
