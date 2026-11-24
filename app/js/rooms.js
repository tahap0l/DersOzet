/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
 *
 * rooms.js: birlikte çalışma odaları.
 *  - Dershane odaları: aynı dershanedeki (ya da sınıftaki) öğrenciler görür ve girer.
 *  - Özel odalar: 6 haneli kodu bilen arkadaşlar girer.
 * Ses ve görüntü tarayıcılar arasında doğrudan (WebRTC) gider; sunucu yalnızca bağlantıyı kurar.
 * Ortak odak sayacı, sohbet, şikâyet ve odadan çıkarma vardır.
 */
'use strict';

const RL = { list: null, busy: false, err: '' };

async function roomsLoad(force){
  if (RL.busy || (RL.list && !force)) return;
  RL.busy = true; RL.err = '';
  try {
    const { data, error } = await Cloud.sb.from('rooms').select('id, name, kind, institution_id, class_id, code, created_by, last_active').eq('closed', false).order('last_active', { ascending: false }).limit(60);
    if (error) throw error;
    RL.list = data || [];
  } catch(e){ RL.err = 'Odalar alınamadı. İnternet bağlantını kontrol et.'; }
  RL.busy = false;
  if (route.page === 'odalar') render();
}

function ago(ts){
  const m = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
  return m < 3 ? 'şu an aktif' : m < 60 ? m + ' dk önce' : m < 1440 ? Math.round(m / 60) + ' saat önce' : Math.round(m / 1440) + ' gün önce';
}

function roomsView(){
  if (!RL.list){ roomsLoad(); }
  const list = RL.list || [];
  const sch = list.filter(r => r.kind === 'class'), priv = list.filter(r => r.kind === 'private');
  const instName = id => { const m = Cloud.member(id); return m && m.inst ? m.inst.name : 'Dershane'; };
  const className = (inst, cid) => { const m = Cloud.member(inst); if (!cid) return 'Bütün dershane'; const d = SC.data[inst]; const c = d && d.classes.find(x => x.id === cid); return c ? c.name : (m && m.cls && m.cls.id === cid ? m.cls.name : 'Sınıf'); };
  const row = r => `<li><a class="room-row${Date.now() - new Date(r.last_active).getTime() < 180000 ? ' live' : ''}" href="#/oda/${r.id}">
      <span class="rr-dot" aria-hidden="true"></span>
      <span class="cl-b"><strong>${esc(r.name)}</strong><span>${r.kind === 'class' ? esc(instName(r.institution_id)) + ' · ' + esc(className(r.institution_id, r.class_id)) : 'Kodla girilen oda' + (r.code ? ' · ' + esc(r.code) : '')} · ${ago(r.last_active)}</span></span>${I.next}</a></li>`;
  return `<header class="page-head"><h1>Birlikte çalış</h1><button class="icon-btn" data-act="rooms-reload" aria-label="Yenile">${I.refresh}</button></header>
  <p class="sub">Arkadaşlarınla aynı odada ortak odak sayacıyla çalış. Kamera ve mikrofon sen açana kadar kapalı kalır.</p>
  <div class="row"><button class="btn primary" data-act="room-new">Oda aç</button><button class="btn" data-act="room-code">Kodla katıl</button><a class="btn" href="#/odak">Tek başına</a></div>
  ${RL.err ? `<p class="err">${esc(RL.err)}</p>` : ''}
  ${!RL.list && !RL.err ? '<div class="progress"><span class="spinner" aria-hidden="true"></span><span>Odalar yükleniyor…</span></div>' : ''}
  ${RL.list ? `
  <section class="block"><div class="block-head"><h2>Dershane odaları</h2></div>
    ${sch.length ? `<ul class="rooms">${sch.map(row).join('')}</ul>` : `<p class="hint">${Cloud.school.length ? 'Şu an açık dershane odası yok. İlk odayı sen aç.' : 'Bir dershaneye katılınca sınıfının odalarını burada görürsün.'}</p>${Cloud.school.length ? '' : '<div class="row"><a class="link" href="#/dershane">Dershaneye katıl</a></div>'}`}
  </section>
  <section class="block"><div class="block-head"><h2>Arkadaş odaların</h2></div>
    ${priv.length ? `<ul class="rooms">${priv.map(row).join('')}</ul>` : '<p class="hint">Bir oda açıp kodunu arkadaşlarına gönder ya da onların kodunu yaz.</p>'}
  </section>` : ''}
  <p class="hint safety">Odada adresini, telefonunu ya da okulunu paylaşma. Rahatsız olursan kişiyi şikâyet et ya da odadan çık.</p>`;
}

/* ---------- oda ---------- */
const Room = {
  id: null, room: null, ch: null, peers: {}, local: null, mic: false, cam: false, front: true,
  present: {}, msgs: [], tab: 'grid', tick: null, wake: null, unread: 0, ice: null, muted: new Set(), counted: 0, mod: false,

  async enter(id){
    if (this.id === id) return;
    if (this.id) await this.leave(true);
    this.id = id; this.room = null; this.msgs = []; this.present = {}; this.peers = {}; this.unread = 0; this.tab = 'grid'; this.counted = 0;
    const sb = Cloud.sb;
    try {
      await Cloud.rpc('enter_room', { p_room: id });
      const [r, m] = await Promise.all([
        sb.from('rooms').select('*').eq('id', id).single(),
        sb.from('messages').select('id, user_id, body, created_at, p:profiles(name)').eq('room_id', id).order('created_at', { ascending: false }).limit(60)
      ]);
      if (r.error) throw r.error;
      if (this.id !== id) return;
      this.room = r.data; this.msgs = (m.data || []).reverse();
      this.mod = this.room.created_by === Cloud.uid || (this.room.kind === 'class' && Cloud.isStaff(this.room.institution_id));
    } catch(e){
      this.id = null; toast(e.message && /erişim/.test(e.message) ? 'Bu odaya erişimin yok.' : 'Odaya girilemedi.'); go('#/odalar'); return;
    }
    this.ice = (window.DO_CONFIG || {}).iceServers || [];
    sb.functions.invoke('turn').then(r => { if (r && r.data && Array.isArray(r.data.iceServers) && r.data.iceServers.length) this.ice = this.ice.concat(r.data.iceServers); }).catch(() => {});
    try { await sb.realtime.setAuth(); } catch(e){}
    const ch = this.ch = sb.channel('room:' + id, { config: { private: true, presence: { key: Cloud.uid }, broadcast: { self: false } } });
    ch.on('presence', { event: 'sync' }, () => this.onSync())
      .on('broadcast', { event: 'sig' }, ({ payload }) => this.onSignal(payload))
      .on('broadcast', { event: 'timer' }, ({ payload }) => { this.room.timer = payload || {}; this.paintTimer(); })
      .on('broadcast', { event: 'kick' }, ({ payload }) => { if (payload && payload.uid === Cloud.uid){ this.leave(); toast('Odadan çıkarıldın.'); go('#/odalar'); } })
      .on('broadcast', { event: 'closed' }, () => { this.leave(); toast('Oda kapatıldı.'); go('#/odalar'); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'room_id=eq.' + id }, p => this.onMessage(p.new))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: 'room_id=eq.' + id }, p => { this.msgs = this.msgs.filter(x => x.id !== p.old.id); this.paintChat(); })
      .subscribe(st => {
        if (st === 'SUBSCRIBED') this.track();
        if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT'){ const s = $('#rm-status'); if (s) s.textContent = 'Bağlantı koptu, yeniden deneniyor…'; }
      });
    this.tick = setInterval(() => this.paintTimer(), 500);
    this.lockScreen();
    if (route.page === 'oda' && route.arg === id) render();
  },

  async leave(silent){
    const ch = this.ch; this.ch = null;
    clearInterval(this.tick); this.tick = null;
    Object.keys(this.peers).forEach(u => this.dropPeer(u));
    if (this.local){ this.local.getTracks().forEach(t => t.stop()); this.local = null; }
    this.mic = false; this.cam = false;
    if (ch){ try { await ch.untrack(); } catch(e){} try { await Cloud.sb.removeChannel(ch); } catch(e){} }
    if (this.wake){ try { this.wake.release(); } catch(e){} this.wake = null; }
    this.id = null; this.room = null;
    if (!silent) RL.list = null;
  },

  me(){ const t = this.room && this.room.timer || {}; return { uid: Cloud.uid, name: DB.d.profile.name || 'Ben', mic: this.mic, cam: this.cam, st: t.running ? t.mode : 'idle', at: Date.now() }; },
  track(){ if (this.ch) this.ch.track(this.me()).catch(() => {}); },

  onSync(){
    const st = this.ch ? this.ch.presenceState() : {};
    const now = {};
    Object.keys(st).forEach(k => { const a = st[k]; if (a && a.length) now[k] = a[a.length - 1]; });
    Object.keys(this.peers).forEach(u => { if (!now[u]) this.dropPeer(u); });
    this.present = now;
    if (this.local) this.others().slice(0, this.cap()).forEach(u => this.peer(u));
    this.paintGrid();
  },
  others(){ return Object.keys(this.present).filter(u => u !== Cloud.uid).sort(); },
  cap(){ return (window.DO_CONFIG || {}).maxVideoPeers || 8; },

  /* --- WebRTC: her kişiyle ayrı bağlantı, "kibar/kaba" çakışma çözümüyle --- */
  peer(uid){
    let P = this.peers[uid]; if (P) return P;
    const pc = new RTCPeerConnection({ iceServers: this.ice });
    P = this.peers[uid] = { pc, polite: Cloud.uid < uid, making: false, ignore: false, stream: new MediaStream() };
    pc.onicecandidate = e => { if (e.candidate) this.send(uid, { cand: e.candidate.toJSON() }); };
    pc.onnegotiationneeded = async () => {
      try { P.making = true; await pc.setLocalDescription(); this.send(uid, { desc: { type: pc.localDescription.type, sdp: pc.localDescription.sdp } }); }
      catch(e){} finally { P.making = false; }
    };
    pc.ontrack = e => {
      const tr = e.track;
      P.stream.getTracks().filter(x => x.kind === tr.kind).forEach(x => P.stream.removeTrack(x));
      P.stream.addTrack(tr);
      tr.onunmute = () => this.paintTile(uid); tr.onmute = () => this.paintTile(uid); tr.onended = () => { P.stream.removeTrack(tr); this.paintTile(uid); };
      this.paintTile(uid, true);
    };
    pc.onconnectionstatechange = () => { if (pc.connectionState === 'failed'){ try { pc.restartIce(); } catch(e){} } this.paintTile(uid); };
    if (this.local) this.local.getTracks().forEach(t => pc.addTrack(t, this.local));
    return P;
  },
  dropPeer(uid){ const P = this.peers[uid]; if (!P) return; try { P.pc.close(); } catch(e){} delete this.peers[uid]; },
  send(to, data){ if (this.ch) this.ch.send({ type: 'broadcast', event: 'sig', payload: Object.assign({ from: Cloud.uid, to }, data) }); },
  async onSignal(s){
    if (!s || s.to !== Cloud.uid || !s.from || s.from === Cloud.uid) return;
    const P = this.peer(s.from), pc = P.pc;
    try {
      if (s.desc){
        const collision = s.desc.type === 'offer' && (P.making || pc.signalingState !== 'stable');
        P.ignore = !P.polite && collision;
        if (P.ignore) return;
        await pc.setRemoteDescription(s.desc);
        if (s.desc.type === 'offer'){ await pc.setLocalDescription(); this.send(s.from, { desc: { type: pc.localDescription.type, sdp: pc.localDescription.sdp } }); }
      } else if (s.cand){
        try { await pc.addIceCandidate(s.cand); } catch(e){ if (!P.ignore) throw e; }
      }
    } catch(e){ console.warn('rtc', e); }
  },

  async setMedia(kind, on){
    if (on){
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ toast('Bu tarayıcı kamera ve mikrofonu desteklemiyor.'); return; }
      if (this.others().length >= this.cap() && kind === 'cam'){ toast('Odada ' + this.cap() + ' kişiden fazla var; görüntü yerine ses ve sohbet kullan.'); return; }
      try {
        const s = await navigator.mediaDevices.getUserMedia(kind === 'mic'
          ? { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }
          : { video: { facingMode: this.front ? 'user' : 'environment', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 20, max: 24 } } });
        const track = s.getTracks()[0];
        if (!this.local) this.local = new MediaStream();
        this.local.getTracks().filter(t => t.kind === track.kind).forEach(t => { t.stop(); this.local.removeTrack(t); });
        this.local.addTrack(track);
        this.others().slice(0, this.cap()).forEach(u => {
          const P = this.peer(u);
          const snd = P.pc.getSenders().find(x => x.track && x.track.kind === track.kind) || P.pc.getSenders().find(x => !x.track && x.__kind === track.kind);
          if (snd) snd.replaceTrack(track); else { const x = P.pc.addTrack(track, this.local); x.__kind = track.kind; }
        });
      } catch(e){ toast(e && e.name === 'NotAllowedError' ? (kind === 'mic' ? 'Mikrofon izni verilmedi. Tarayıcı ayarlarından izin ver.' : 'Kamera izni verilmedi. Tarayıcı ayarlarından izin ver.') : 'Cihaz açılamadı.'); return; }
    } else if (this.local){
      const k = kind === 'mic' ? 'audio' : 'video';
      this.local.getTracks().filter(t => t.kind === k).forEach(t => { t.stop(); this.local.removeTrack(t); });
      Object.values(this.peers).forEach(P => P.pc.getSenders().forEach(x => { if (x.track && x.track.kind === k){ x.__kind = k; x.replaceTrack(null); } }));
    }
    this[kind] = on;
    this.track(); this.paintGrid(); this.paintCtl();
  },

  /* --- ortak sayaç --- */
  timerLeft(){ const t = this.room.timer || {}; if (!t.mode) return (DB.d.focus.focus) * 60; return t.running ? Math.max(0, (t.endsAt - Date.now()) / 1000) : (t.left != null ? t.left : t.len * 60); },
  setTimer(t){
    t.by = DB.d.profile.name || ''; this.room.timer = t;
    if (this.ch) this.ch.send({ type: 'broadcast', event: 'timer', payload: t });
    Cloud.rpc('set_room_timer', { p_room: this.id, p_timer: t }).catch(() => {});
    this.track(); this.paintTimer();
  },
  timerGo(){
    const t = Object.assign({ mode: 'focus', len: DB.d.focus.focus, brk: DB.d.focus.brk }, this.room.timer || {});
    if (t.running){ t.left = Math.round(this.timerLeft()); t.running = false; t.endsAt = 0; }
    else { const left = t.left != null ? t.left : t.len * 60; t.running = true; t.endsAt = Date.now() + left * 1000; t.left = null; }
    try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); } catch(e){}
    this.setTimer(t);
  },
  timerSet(len, brk){ this.setTimer({ mode: 'focus', len, brk, running: false, endsAt: 0, left: len * 60 }); },
  timerReset(){ const t = this.room.timer || {}; this.setTimer({ mode: t.mode || 'focus', len: t.len || DB.d.focus.focus, brk: t.brk || DB.d.focus.brk, running: false, endsAt: 0, left: (t.mode === 'brk' ? (t.brk || 5) : (t.len || 25)) * 60 }); },
  timerEnd(){
    const t = this.room.timer;
    if (!t || !t.running || t.endsAt > Date.now() || this.counted === t.endsAt) return;
    this.counted = t.endsAt;
    if (t.mode === 'focus'){ bump(dayKey(), 'focus', t.len); DB.save(); toast('Ortak odak turu bitti: ' + t.len + ' dakika serine eklendi. Mola!'); }
    else toast('Mola bitti. Hazırsan devam.');
    beep();
    const next = t.mode === 'focus' ? { mode: 'brk', len: t.len, brk: t.brk, running: true, endsAt: Date.now() + (t.brk || 5) * 60000, left: null }
      : { mode: 'focus', len: t.len, brk: t.brk, running: false, endsAt: 0, left: t.len * 60 };
    const leader = Object.keys(this.present).sort()[0] === Cloud.uid;
    if (leader) this.setTimer(next); else { this.room.timer = next; this.track(); }
  },

  /* --- sohbet --- */
  onMessage(m){
    if (!m || this.msgs.some(x => x.id === m.id)) return;
    const who = this.present[m.user_id];
    m.p = { name: who ? who.name : (this.msgs.find(x => x.user_id === m.user_id) || { p: { name: '' } }).p.name || 'Biri' };
    this.msgs.push(m); if (this.msgs.length > 200) this.msgs.shift();
    if (this.tab !== 'chat' && m.user_id !== Cloud.uid && !this.wide()) this.unread++;
    this.paintChat(); this.paintCtl();
  },
  async sendMsg(body){
    body = body.trim().slice(0, 500); if (!body) return;
    const { data, error } = await Cloud.sb.from('messages').insert({ room_id: this.id, user_id: Cloud.uid, body }).select('id, user_id, body, created_at').single();
    if (error){ toast(/hızlı/.test(error.message) ? error.message : 'Mesaj gönderilemedi.'); return false; }
    this.onMessage(data); return true;
  },
  wide(){ return matchMedia('(min-width: 900px)').matches; },

  async lockScreen(){ try { if ('wakeLock' in navigator && !this.wake) { this.wake = await navigator.wakeLock.request('screen'); this.wake.addEventListener('release', () => { this.wake = null; }); } } catch(e){} },

  /* --- çizim --- */
  paintGrid(){
    const g = $('#rg'); if (!g) return;
    const ids = [Cloud.uid].concat(this.others());
    $$('.tile', g).forEach(el => { if (!ids.includes(el.dataset.u)) el.remove(); });
    ids.forEach(u => this.paintTile(u));
    g.dataset.n = Math.min(ids.length, 9);
    const c = $('#rm-count'); if (c) c.textContent = ids.length + ' kişi';
  },
  paintTile(u, fresh){
    const g = $('#rg'); if (!g) return;
    const self = u === Cloud.uid, info = self ? this.me() : this.present[u]; if (!info) return;
    let el = g.querySelector('.tile[data-u="' + u + '"]');
    if (!el){
      el = document.createElement('div'); el.className = 'tile'; el.dataset.u = u;
      el.innerHTML = `<video playsinline autoplay${self ? ' muted' : ''}></video><span class="t-av" aria-hidden="true"></span><span class="t-name"></span><span class="t-st"></span>${self ? '' : `<button class="t-menu icon-btn ghost sm" data-act="rm-who" data-u="${u}" aria-label="Seçenekler">${I.dots}</button>`}`;
      if (self) g.prepend(el); else g.appendChild(el);
    }
    const v = el.querySelector('video');
    const stream = self ? this.local : (this.peers[u] && this.peers[u].stream);
    const hasVideo = !!stream && stream.getVideoTracks().some(t => t.readyState === 'live' && !t.muted) && (self ? this.cam : info.cam);
    if (stream && v.srcObject !== stream){ v.srcObject = stream; }
    if (stream && (fresh || v.paused)) v.play().catch(() => {});
    v.muted = self || this.muted.has(u);
    el.classList.toggle('has-video', hasVideo);
    el.classList.toggle('self', self);
    el.classList.toggle('mirror', self && this.front);
    el.querySelector('.t-av').textContent = String(info.name || '?').charAt(0).toLocaleUpperCase('tr');
    el.querySelector('.t-name').textContent = (info.name || '') + (self ? ' (sen)' : '');
    const P = this.peers[u], conn = !self && P && (info.mic || info.cam) && P.pc.connectionState !== 'connected' ? ' · bağlanıyor' : '';
    el.querySelector('.t-st').innerHTML = (info.mic ? I.mic : I.micOff) + (this.muted.has(u) ? '<span>sessizde</span>' : '') + (conn ? `<span>${conn.slice(3)}</span>` : '');
  },
  paintTimer(){
    if (!this.room) return;
    this.timerEnd();
    const t = this.room.timer || {}, left = this.timerLeft();
    const el = $('#rt-time'); if (el) el.textContent = pmFmt(left);
    const md = $('#rt-mode'); if (md) md.textContent = !t.mode ? 'Ortak sayaç hazır' : (t.mode === 'focus' ? 'Odak' : 'Mola') + (t.running ? '' : ', duraklatıldı') + (t.by ? ' · ' + t.by : '');
    const b = $('#rt-go'); if (b) b.textContent = t.running ? 'Duraklat' : 'Başlat';
    const w = $('#rt'); if (w){ w.classList.toggle('run', !!t.running); w.classList.toggle('brk', t.mode === 'brk'); }
    const total = ((t.mode === 'brk' ? t.brk : t.len) || DB.d.focus.focus) * 60;
    const bar = $('#rt-bar'); if (bar) bar.style.width = Math.max(0, Math.min(100, 100 - left / total * 100)) + '%';
  },
  paintChat(){
    const box = $('#rc-log'); if (!box) return;
    const near = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
    box.innerHTML = this.msgs.length ? this.msgs.map(m => { const mine = m.user_id === Cloud.uid; const t = new Date(m.created_at);
      return `<div class="msg${mine ? ' mine' : ''}"><p class="m-who">${esc(mine ? 'Sen' : (m.p && m.p.name) || 'Biri')}<span>${pad(t.getHours())}:${pad(t.getMinutes())}</span>${mine && !this.mod ? '' : `<button class="m-opt" data-act="rm-msg" data-id="${m.id}" aria-label="Mesaj seçenekleri">${I.dots}</button>`}</p><p class="m-body">${esc(m.body)}</p></div>`; }).join('')
      : '<p class="hint center">Henüz mesaj yok. Selam ver ya da bir soru sor.</p>';
    if (near || true) box.scrollTop = box.scrollHeight;
  },
  paintCtl(){
    const m = $('#rc-mic'), c = $('#rc-cam'), ch = $('#rc-chat');
    if (m){ m.classList.toggle('on', this.mic); m.innerHTML = (this.mic ? I.mic : I.micOff) + `<span>${this.mic ? 'Mikrofon açık' : 'Mikrofon'}</span>`; m.setAttribute('aria-pressed', this.mic); }
    if (c){ c.classList.toggle('on', this.cam); c.innerHTML = (this.cam ? I.cam : I.camOff) + `<span>${this.cam ? 'Kamera açık' : 'Kamera'}</span>`; c.setAttribute('aria-pressed', this.cam); }
    if (ch){ ch.classList.toggle('on', this.tab === 'chat'); ch.innerHTML = I.chat + `<span>${this.tab === 'chat' ? 'Görüntü' : 'Sohbet'}</span>` + (this.unread ? `<b class="badge-n">${this.unread}</b>` : ''); }
    const r = $('#room'); if (r) r.dataset.tab = this.tab;
  }
};

function roomView(){
  const id = route.arg;
  if (Room.id !== id){ Room.enter(id); return '<div class="progress"><span class="spinner" aria-hidden="true"></span><span>Odaya giriliyor…</span></div>'; }
  if (!Room.room) return '<div class="progress"><span class="spinner" aria-hidden="true"></span><span>Odaya giriliyor…</span></div>';
  const r = Room.room;
  return `<div id="room" class="room" data-tab="${Room.tab}">
    <header class="room-top">
      <button class="icon-btn" data-act="rm-leave" aria-label="Odadan çık">${I.back}</button>
      <div class="rt-b"><h1>${esc(r.name)}</h1><p class="hint"><span id="rm-count">1 kişi</span>${r.code ? ` · kod <button class="code-chip" data-act="rm-share">${esc(r.code)}</button>` : ''}<span id="rm-status"></span></p></div>
      <button class="icon-btn" data-act="rm-menu" aria-label="Oda seçenekleri">${I.dots}</button>
    </header>
    <section class="rt" id="rt">
      <div class="rt-l"><p class="rt-time" id="rt-time" role="timer">--:--</p><p class="rt-mode" id="rt-mode"></p></div>
      <div class="rt-c"><button class="btn primary" data-act="rt-go" id="rt-go">Başlat</button><button class="btn sm" data-act="rt-set">Süre</button></div>
      <div class="rt-track" aria-hidden="true"><span id="rt-bar"></span></div>
    </section>
    <div class="room-main">
      <div class="room-grid" id="rg" data-n="1"></div>
      <aside class="room-chat" aria-label="Sohbet">
        <div class="rc-log" id="rc-log" aria-live="polite"></div>
        <form class="rc-form" id="rc-form"><input id="rc-in" class="input" maxlength="500" placeholder="Mesaj yaz" autocomplete="off" enterkeyhint="send"><button class="btn primary" aria-label="Gönder">${I.send}</button></form>
      </aside>
    </div>
    <nav class="room-ctl" aria-label="Oda kontrolleri">
      <button class="rc-b" id="rc-mic" data-act="rc-mic" aria-pressed="false"></button>
      <button class="rc-b" id="rc-cam" data-act="rc-cam" aria-pressed="false"></button>
      <button class="rc-b chat-t" id="rc-chat" data-act="rc-chat"></button>
      <button class="rc-b leave" data-act="rm-leave">${I.leave}<span>Çık</span></button>
    </nav>
  </div>`;
}
roomView.after = () => { Room.paintGrid(); Room.paintTimer(); Room.paintChat(); Room.paintCtl(); };

function roomNewSheet(instPre){
  const sch = Cloud.school;
  const box = openSheet('Oda aç', `
    <label class="f-h" for="rn-n">Odanın adı</label>
    <input id="rn-n" class="input" maxlength="60" placeholder="Örn. Akşam matematik" autocomplete="off" autofocus>
    <p class="f-h">Kimler girebilsin?</p>
    <div class="opts">
      ${sch.map(m => `<label class="opt"><input type="radio" name="rn-k" value="${m.institution_id}"${instPre === m.institution_id || (!instPre && sch[0] === m) ? ' checked' : ''}><span><strong>${esc(m.inst ? m.inst.name : 'Dershane')}</strong><span>${m.role === 'student' ? (m.cls ? esc(m.cls.name) + ' sınıfındakiler' : 'Dershanedekiler') : 'Seçtiğin sınıf ya da bütün dershane'}</span></span></label>`).join('')}
      <label class="opt"><input type="radio" name="rn-k" value=""${!sch.length ? ' checked' : ''}><span><strong>Kodu bilen arkadaşlarım</strong><span>Oda açılınca 6 haneli bir kod verilir; sadece kodu paylaştıkların girer.</span></span></label>
    </div>
    <div id="rn-cls"></div>
    <p class="err" id="rn-e" role="alert"></p>
    <div class="row"><button class="btn primary" id="rn-go">Odayı aç</button></div>`);
  const paintCls = async () => {
    const k = (box.querySelector('input[name="rn-k"]:checked') || {}).value, el = $('#rn-cls', box);
    if (!k || !Cloud.isStaff(k)){ el.innerHTML = ''; return; }
    if (!SC.data[k]) await scLoad(k);
    const D = SC.data[k]; if (!D) return;
    el.innerHTML = `<label class="f-h" for="rn-c">Sınıf</label><select id="rn-c"><option value="">Bütün dershane</option>${D.classes.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>`;
  };
  box.addEventListener('change', e => { if (e.target.name === 'rn-k') paintCls(); });
  paintCls();
  $('#rn-go', box).addEventListener('click', async () => {
    const n = $('#rn-n', box).value.trim(), k = (box.querySelector('input[name="rn-k"]:checked') || {}).value || null;
    if (!n){ $('#rn-e', box).textContent = 'Odaya bir ad ver.'; return; }
    const c = $('#rn-c', box); $('#rn-go', box).disabled = true;
    try {
      const r = await Cloud.rpc('create_room', { p_name: n, p_inst: k, p_class: c && c.value ? c.value : null });
      RL.list = null; closeSheet(); go('#/oda/' + r.id);
      if (r.code) setTimeout(() => toast('Oda kodu: ' + r.code + '. Arkadaşlarına gönder.'), 600);
    } catch(e){ $('#rn-go', box).disabled = false; $('#rn-e', box).textContent = e.message; }
  });
}

function reportSheet(uid, msgId){
  const who = (Room.present[uid] || {}).name || ((Room.msgs.find(m => m.user_id === uid) || {}).p || {}).name || 'Bu kişi';
  const box = openSheet('Şikâyet et', `<p>${esc(who)} hakkında ne oldu?</p>
    <div class="opts">${['Hakaret ya da zorbalık', 'Uygunsuz görüntü ya da içerik', 'Kişisel bilgi istedi', 'Sürekli rahatsız ediyor', 'Başka bir şey'].map((t, i) => `<label class="opt"><input type="radio" name="rp" value="${t}"${i === 0 ? ' checked' : ''}><span><strong>${t}</strong></span></label>`).join('')}</div>
    <textarea id="rp-t" rows="2" maxlength="250" placeholder="İstersen kısaca anlat"></textarea>
    <div class="row"><button class="btn primary" id="rp-go">Gönder</button></div>
    <p class="hint">Şikâyetin ${Room.room && Room.room.kind === 'class' ? 'dershanendeki hocalara' : 'kayda'} iletilir. Tehlikedeysen ya da biri seni tehdit ediyorsa bir yetişkine ve gerekirse 112'ye haber ver.</p>`);
  $('#rp-go', box).addEventListener('click', async () => {
    const reason = ((box.querySelector('input[name="rp"]:checked') || {}).value || '') + (($('#rp-t', box).value.trim()) ? ': ' + $('#rp-t', box).value.trim() : '');
    const { error } = await Cloud.sb.from('reports').insert({ room_id: Room.id, reporter: Cloud.uid, reported: uid, message_id: msgId || null, reason: reason.slice(0, 300) });
    closeSheet(); toast(error ? 'Şikâyet gönderilemedi.' : 'Şikâyetin alındı. İstersen kişiyi sessize alabilir ya da odadan çıkabilirsin.');
  });
}

Object.assign(ACT, {
  'rooms-reload': () => { RL.list = null; roomsLoad(true); render(); },
  'room-new': el => roomNewSheet(el.dataset.inst),
  'room-code': () => {
    const box = openSheet('Kodla katıl', `<p class="hint">Arkadaşının gönderdiği 6 haneli oda kodunu yaz.</p>
      <input id="rj-c" class="input code-in" maxlength="6" placeholder="Örn. FJ8AQQ" autocomplete="off" autocapitalize="characters" autofocus>
      <p class="err" id="rj-e" role="alert"></p><div class="row"><button class="btn primary" id="rj-go">Katıl</button></div>`);
    const run = async () => {
      const code = $('#rj-c', box).value.trim(); if (code.length < 6) return;
      try { const id = await Cloud.rpc('join_room', { p_code: code }); closeSheet(); go('#/oda/' + id); }
      catch(e){ $('#rj-e', box).textContent = e.message; }
    };
    $('#rj-go', box).addEventListener('click', run);
    $('#rj-c', box).addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
  },
  'rm-leave': () => { Room.leave(); go('#/odalar'); },
  'rc-mic': () => Room.setMedia('mic', !Room.mic),
  'rc-cam': () => Room.setMedia('cam', !Room.cam),
  'rc-chat': () => { Room.tab = Room.tab === 'chat' ? 'grid' : 'chat'; if (Room.tab === 'chat') Room.unread = 0; Room.paintCtl(); Room.paintChat(); if (Room.tab === 'chat'){ const i = $('#rc-in'); if (i) i.focus({ preventScroll: true }); } },
  'rt-go': () => Room.timerGo(),
  'rt-set': () => {
    const box = openSheet('Ortak sayaç', `<p class="hint">Değişiklik odadaki herkesin sayacını değiştirir.</p>
      <div class="opts">${[[25, 5], [50, 10], [40, 10], [90, 15]].map(([a, b]) => `<button class="opt" data-a="${a}" data-b="${b}"><span><strong>${a} dk odak, ${b} dk mola</strong></span></button>`).join('')}</div>
      <div class="row"><button class="btn" id="rs-reset">Sayacı sıfırla</button></div>`);
    box.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b){ Room.timerSet(Number(b.dataset.a), Number(b.dataset.b)); closeSheet(); } });
    $('#rs-reset', box).addEventListener('click', () => { Room.timerReset(); closeSheet(); });
  },
  'rm-share': async () => {
    const r = Room.room; if (!r || !r.code) return;
    const text = `Ders Özetim'de birlikte çalışalım. Oda kodu: ${r.code}\n${location.origin}${location.pathname}`;
    try { if (navigator.share){ await navigator.share({ title: 'Ders Özetim oda kodu', text }); return; } } catch(e){ return; }
    try { await navigator.clipboard.writeText(r.code); toast('Kod kopyalandı: ' + r.code); } catch(e){ toast('Oda kodu: ' + r.code); }
  },
  'rm-menu': () => {
    const r = Room.room; if (!r) return;
    const box = openSheet(r.name, `<ul class="menu">
      ${r.code ? '<li><button data-k="share"><span>Kodu paylaş</span><span class="mv">' + esc(r.code) + '</span></button></li>' : ''}
      ${Room.cam ? '<li><button data-k="flip"><span>Kamerayı çevir</span></button></li>' : ''}
      ${Room.mod ? '<li><button data-k="close" class="danger"><span>Odayı herkes için kapat</span></button></li>' : ''}
      <li><button data-k="leave"><span>Odadan çık</span></button></li></ul>
      <p class="hint">Ses ve görüntü kaydedilmez. Sohbet mesajları oda açık kaldıkça odadakilere görünür.</p>`);
    box.addEventListener('click', async e => {
      const b = e.target.closest('[data-k]'); if (!b) return;
      const k = b.dataset.k; closeSheet();
      if (k === 'share') ACT['rm-share']();
      if (k === 'flip'){ Room.front = !Room.front; await Room.setMedia('cam', true); }
      if (k === 'leave') ACT['rm-leave']();
      if (k === 'close'){
        const { error } = await Cloud.sb.from('rooms').update({ closed: true }).eq('id', Room.id);
        if (error){ toast('Kapatılamadı.'); return; }
        if (Room.ch) Room.ch.send({ type: 'broadcast', event: 'closed', payload: {} });
        Room.leave(); go('#/odalar'); toast('Oda kapatıldı');
      }
    });
  },
  'rm-who': el => {
    const u = el.dataset.u, p = Room.present[u] || {};
    const box = openSheet(p.name || 'Kişi', `<ul class="menu">
      <li><button data-k="mute"><span>${Room.muted.has(u) ? 'Sesini aç' : 'Sessize al'}</span><span class="mv">Sadece senin için</span></button></li>
      <li><button data-k="report"><span>Şikâyet et</span></button></li>
      ${Room.mod ? '<li><button data-k="kick" class="danger"><span>Odadan çıkar</span><span class="mv">Bir daha giremez</span></button></li>' : ''}</ul>`);
    box.addEventListener('click', async e => {
      const b = e.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k; closeSheet();
      if (k === 'mute'){ Room.muted.has(u) ? Room.muted.delete(u) : Room.muted.add(u); Room.paintTile(u); }
      if (k === 'report') reportSheet(u);
      if (k === 'kick'){
        try { await Cloud.rpc('kick_from_room', { p_room: Room.id, p_user: u }); if (Room.ch) Room.ch.send({ type: 'broadcast', event: 'kick', payload: { uid: u } }); Room.dropPeer(u); toast((p.name || 'Kişi') + ' odadan çıkarıldı'); }
        catch(err){ toast(err.message); }
      }
    });
  },
  'rm-msg': el => {
    const id = Number(el.dataset.id), m = Room.msgs.find(x => x.id === id); if (!m) return;
    const mine = m.user_id === Cloud.uid;
    const box = openSheet('Mesaj', `<p class="m-body quote">${esc(m.body)}</p><ul class="menu">
      ${!mine ? '<li><button data-k="report"><span>Şikâyet et</span></button></li>' : ''}
      ${mine || Room.mod ? '<li><button data-k="del" class="danger"><span>Mesajı sil</span></button></li>' : ''}
      ${!mine && Room.mod ? '<li><button data-k="kick" class="danger"><span>Yazanı odadan çıkar</span></button></li>' : ''}</ul>`);
    box.addEventListener('click', async e => {
      const b = e.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k; closeSheet();
      if (k === 'report') reportSheet(m.user_id, m.id);
      if (k === 'del'){ const { error } = await Cloud.sb.from('messages').delete().eq('id', id); if (!error){ Room.msgs = Room.msgs.filter(x => x.id !== id); Room.paintChat(); } }
      if (k === 'kick'){ try { await Cloud.rpc('kick_from_room', { p_room: Room.id, p_user: m.user_id }); if (Room.ch) Room.ch.send({ type: 'broadcast', event: 'kick', payload: { uid: m.user_id } }); toast('Kişi odadan çıkarıldı'); } catch(err){ toast(err.message); } }
    });
  }
});
document.addEventListener('submit', async e => {
  if (e.target.id !== 'rc-form') return;
  e.preventDefault();
  const i = $('#rc-in'); const v = i.value; if (!v.trim()) return;
  i.value = '';
  const ok = await Room.sendMsg(v); if (ok === false) i.value = v;
});
document.addEventListener('visibilitychange', () => { if (!document.hidden && Room.id) Room.lockScreen(); });
window.addEventListener('pagehide', () => { if (Room.id) Room.leave(true); });
VIEWS.odalar = roomsView;
VIEWS.oda = roomView;
