/* Ders Özetim tanıtım sitesi — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0 */
(function(){
  'use strict';
  var MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  // ÖSYM 2027 YKS tarihini açıklayınca burayı güncelle.
  var YKS = new Date(2027, 5, 19);
  var now = new Date(); now.setHours(0, 0, 0, 0);
  var left = Math.max(0, Math.round((YKS - now) / 864e5));
  var set = function(id, v){ var el = document.getElementById(id); if (el) el.textContent = v; };
  set('to-num', left); set('final-num', left); set('to-month', MONTHS[now.getMonth()]); set('yil', now.getFullYear());
  fetch('app/data/library.json').then(function(r){ return r.json(); }).then(function(j){ set('lib-count', Object.keys(j.summaries || {}).length); }).catch(function(){});
  var nav = document.querySelector('.nav');
  var onScroll = function(){ nav.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
})();
