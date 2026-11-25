/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
 *
 * admin.js: yönetici paneli. Yalnızca sunucudaki app_admins tablosunda olan hesaplar açabilir;
 * her işlem sunucuda yeniden yetki kontrolünden geçer (supabase/migrations/0004_admin.sql).
 */
'use strict';

const AD = { data: null, busy: false, err: '', tab: 'ozet', q: '' };

async function adLoad(force){
  if (AD.busy || (AD.data && !force)) return;
  AD.busy = true; AD.err = '';
  try { AD.data = await Cloud.rpc('admin_overview'); }
  catch(e){ AD.err = /Yetki/.test(e.message || '') ? 'Bu sayfa yalnızca yöneticiler içindir.' : 'Bilgiler alınamadı.'; }
  AD.busy = false;
  if (route.page === 'admin') render();
}

const adDate = s => { if (!s) return '-'; const d = new Date(s); return d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0, 3) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };

function adminView(){
  if (!Cloud.isAdmin) return emptyBlock('Yetkin yok', 'Bu sayfa yalnızca yöneticiler içindir.', '<a class="btn" href="#/bugun">Bugün\'e dön</a>');
  if (!AD.data) adLoad();
  const D = AD.data, c = D ? D.counts : {};
  const tabs = [['ozet', 'Özet'], ['kullanici', 'Kullanıcılar'], ['dershane', 'Dershaneler'], ['oda', 'Odalar'], ['sikayet', 'Şikâyetler' + (c.reports ? ' (' + c.reports + ')' : '')]];
  let body = '';
  if (AD.err) body = `<p class="err">${esc(AD.err)}</p>`;
  else if (!D) body = '<div class="progress"><span class="spinner" aria-hidden="true"></span><span>Yükleniyor…</span></div>';
  else if (AD.tab === 'ozet') body = `<div class="stat-grid">
      ${[['users', 'Kullanıcı'], ['users7', 'Son 7 günde yeni'], ['active1', 'Bugün giren'], ['institutions', 'Dershane'], ['classes', 'Sınıf'], ['programs', 'Gönderilen program'], ['rooms', 'Açık oda'], ['rooms_live', 'Şu an aktif oda'], ['messages1', 'Bugünkü mesaj'], ['reports', 'Açık şikâyet']]
        .map(([k, l]) => `<div class="stat${k === 'reports' && c[k] ? ' warn' : ''}"><p class="st-n">${c[k] || 0}</p><p class="st-l">${l}</p></div>`).join('')}
    </div><p class="hint">Son güncelleme: ${adDate(new Date().toISOString())}</p>`;
  else if (AD.tab === 'kullanici'){
    const q = AD.q.toLocaleLowerCase('tr');
    const list = D.users.filter(u => !q || (u.email || '').toLowerCase().includes(q) || (u.name || '').toLocaleLowerCase('tr').includes(q) || gradeName(u.grade).toLocaleLowerCase('tr').includes(q));
    body = `<input class="input" id="ad-q" placeholder="Ad, e-posta ya da sınıf ara" value="${esc(AD.q)}" autocomplete="off">
      <ul class="people ad-list">${list.map(u => `<li>${avatarFor(u.name)}<span class="pp-b"><strong>${esc(u.name || '(adsız)')}${u.grade ? ` <span class="tag">${esc(gradeName(u.grade))}</span>` : ''}${u.banned ? ' <span class="tag-x">engelli</span>' : ''}</strong><span class="hint">${esc(u.email || '')}${u.track ? ' · ' + esc((TRACKS[String(u.track).toUpperCase()] || {}).name || u.track) : ''}</span>
        ${(u.school_names || []).length ? `<span class="hint">${esc(u.school_names.join(', '))}</span>` : ''}
        <span class="hint">Katıldı ${adDate(u.created_at)} · son giriş ${adDate(u.last)} · ${u.schools} dershane · ${esc((u.providers || []).join(', '))}</span></span>
        ${u.id === Cloud.uid ? '<span class="hint">sen</span>' : `<button class="btn sm${u.banned ? '' : ' danger'}" data-act="ad-do" data-a="${u.banned ? 'unban_user' : 'ban_user'}" data-id="${u.id}">${u.banned ? 'Engeli kaldır' : 'Engelle'}</button>`}</li>`).join('')}</ul>`;
  }
  else if (AD.tab === 'dershane') body = D.institutions.length ? `<ul class="plist">${D.institutions.map(i => `<li><div><strong>${esc(i.name)}</strong><span class="hint">${esc(i.owner || '')} kurdu · ${adDate(i.created_at)}</span><span class="hint">${i.classes} sınıf, ${i.students} öğrenci, ${i.teachers} hoca</span></div>
      <button class="link danger sm" data-act="ad-do" data-a="delete_institution" data-id="${i.id}">Sil</button></li>`).join('')}</ul>` : '<p class="hint">Henüz dershane yok.</p>';
  else if (AD.tab === 'oda') body = D.rooms.length ? `<ul class="plist">${D.rooms.map(r => `<li><div><strong>${esc(r.name)}</strong><span class="hint">${r.kind === 'class' ? esc(r.school || 'Dershane') : 'Arkadaş odası, kod ' + esc(r.code || '')} · ${esc(r.owner || '')} açtı</span><span class="hint">${r.members} üye, ${r.messages} mesaj · ${ago(r.last_active)}</span></div>
      <span class="ad-acts"><button class="link sm" data-act="ad-msgs" data-id="${r.id}" data-n="${esc(r.name)}">Mesajlar</button><button class="link danger sm" data-act="ad-do" data-a="close_room" data-id="${r.id}">Kapat</button></span></li>`).join('')}</ul>` : '<p class="hint">Açık oda yok.</p>';
  else if (AD.tab === 'sikayet') body = D.reports.length ? D.reports.map(r => `<article class="report">
      <p class="hint">${adDate(r.created_at)} · ${esc(r.room || 'oda silinmiş')}</p>
      <p><strong>${esc(r.reporter || 'Biri')}</strong> → <strong>${esc(r.reported || 'bilinmiyor')}</strong>: ${esc(r.reason || '')}</p>
      ${r.message ? `<p class="m-body quote">${esc(r.message)}</p>` : ''}
      <div class="row">${r.message_id ? `<button class="btn sm" data-act="ad-do" data-a="delete_message" data-id="${r.message_id}">Mesajı sil</button>` : ''}${r.reported_id ? `<button class="btn sm danger" data-act="ad-do" data-a="ban_user" data-id="${r.reported_id}">Kişiyi engelle</button>` : ''}<button class="btn sm" data-act="ad-do" data-a="close_report" data-id="${r.id}">Şikâyeti kapat</button></div>
    </article>`).join('') : '<p class="hint">Açık şikâyet yok.</p>';
  return `<header class="page-head"><h1>Yönetici paneli</h1><button class="icon-btn" data-act="ad-reload" aria-label="Yenile">${I.refresh}</button></header>
    <div class="seg scroll" role="tablist">${tabs.map(([k, l]) => `<button class="seg-b${AD.tab === k ? ' on' : ''}" data-act="ad-tab" data-t="${k}" role="tab" aria-selected="${AD.tab === k}">${l}</button>`).join('')}</div>
    ${body}`;
}

const AD_CONFIRM = { ban_user: 'Bu kişi bir daha giriş yapamayacak.', delete_institution: 'Dershanenin bütün sınıfları, programları ve odaları silinecek.', close_room: 'Oda herkes için kapanacak.', delete_message: 'Mesaj silinecek.' };
Object.assign(ACT, {
  'ad-tab': el => { AD.tab = el.dataset.t; render(); },
  'ad-reload': () => { AD.data = null; adLoad(true); render(); },
  'ad-do': async el => {
    const a = el.dataset.a;
    if (AD_CONFIRM[a] && el.dataset.armed !== '1'){ el.dataset.armed = '1'; el.textContent = 'Emin misin? Tekrar bas'; el.title = AD_CONFIRM[a]; return; }
    el.disabled = true;
    try { await Cloud.rpc('admin_action', { p_action: a, p_id: el.dataset.id }); toast('Yapıldı'); await adLoad(true); }
    catch(e){ el.disabled = false; toast(e.message || 'Olmadı'); }
  },
  'ad-msgs': async el => {
    const box = openSheet(el.dataset.n || 'Mesajlar', '<div id="am"><div class="progress"><span class="spinner" aria-hidden="true"></span><span>Yükleniyor…</span></div></div>');
    let list = [];
    try { list = await Cloud.rpc('admin_room_messages', { p_room: el.dataset.id }); } catch(e){}
    const paint = () => { $('#am', box).innerHTML = list.length ? `<ul class="plist">${list.map(m => `<li><div><strong>${esc(m.name || 'Biri')}</strong><span class="hint">${adDate(m.created_at)}</span><span>${esc(m.body)}</span></div><button class="link danger sm" data-mid="${m.id}">Sil</button></li>`).join('')}</ul>` : '<p class="hint">Mesaj yok.</p>'; };
    paint();
    box.addEventListener('click', async e => {
      const b = e.target.closest('[data-mid]'); if (!b) return;
      try { await Cloud.rpc('admin_action', { p_action: 'delete_message', p_id: b.dataset.mid }); list = list.filter(m => String(m.id) !== b.dataset.mid); paint(); toast('Mesaj silindi'); }
      catch(err){ toast(err.message); }
    });
  }
});
document.addEventListener('input', e => { if (e.target.id === 'ad-q'){ AD.q = e.target.value; const pos = e.target.selectionStart; render(); const i = $('#ad-q'); if (i){ i.focus(); i.setSelectionRange(pos, pos); } } });
VIEWS.admin = adminView;
