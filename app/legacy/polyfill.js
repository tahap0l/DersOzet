/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
 * Eski tarayıcılar için eksik parçalar (iOS 12-14 Safari, eski Android Chrome). Yalnız app/legacy
 * yüklendiğinde çalışır; yeni tarayıcılar bu dosyayı hiç indirmez. Düz ES5 yazılmıştır. */
(function(){
  'use strict';
  var g = typeof self !== 'undefined' ? self : window;
  if (typeof g.globalThis === 'undefined') g.globalThis = g;
  function def(o, k, v){ if (!o[k]) try { Object.defineProperty(o, k, { value: v, configurable: true, writable: true }); } catch(e){ o[k] = v; } }

  def(Object, 'fromEntries', function(it){ var o = {}; Array.from(it).forEach(function(p){ o[p[0]] = p[1]; }); return o; });
  def(Object, 'hasOwn', function(o, k){ return Object.prototype.hasOwnProperty.call(o, k); });
  def(Array.prototype, 'flat', function(d){
    d = d === undefined ? 1 : Math.floor(d) || 0;
    return d < 1 ? this.slice() : this.reduce(function(a, x){ return a.concat(Array.isArray(x) ? x.flat(d - 1) : [x]); }, []);
  });
  def(Array.prototype, 'flatMap', function(f, t){ return this.map(f, t).flat(); });
  def(Array.prototype, 'at', function(i){ i = Math.trunc(i) || 0; if (i < 0) i += this.length; return this[i]; });
  def(String.prototype, 'at', function(i){ i = Math.trunc(i) || 0; if (i < 0) i += this.length; return this.charAt(i) || undefined; });
  def(String.prototype, 'replaceAll', function(a, b){
    if (a instanceof RegExp) return this.replace(a, b);
    return this.replace(new RegExp(String(a).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), b);
  });
  def(String.prototype, 'trimStart', String.prototype.trimLeft);
  def(String.prototype, 'trimEnd', String.prototype.trimRight);
  if (g.Promise){
    def(Promise.prototype, 'finally', function(f){
      var P = this.constructor || Promise;
      return this.then(function(v){ return P.resolve(f()).then(function(){ return v; }); },
        function(e){ return P.resolve(f()).then(function(){ throw e; }); });
    });
    def(Promise, 'allSettled', function(ps){
      return Promise.all(Array.from(ps).map(function(p){
        return Promise.resolve(p).then(function(v){ return { status: 'fulfilled', value: v }; }, function(e){ return { status: 'rejected', reason: e }; });
      }));
    });
  }
  def(g, 'queueMicrotask', function(f){ Promise.resolve().then(f); });
  def(g, 'structuredClone', function(v){ return v === undefined ? v : JSON.parse(JSON.stringify(v)); });
  if (g.crypto && !g.crypto.randomUUID && g.crypto.getRandomValues) def(g.crypto, 'randomUUID', function(){
    var b = g.crypto.getRandomValues(new Uint8Array(16)); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var h = Array.from(b, function(x){ return (x + 256).toString(16).slice(1); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  });

  /* iOS 12.0-12.1: AbortController yok. Sahte bir tane verip fetch'i sarıyoruz: iptal edilince söz reddedilir. */
  if (!g.AbortController){
    var Sig = function(){ this.aborted = false; this.reason = undefined; this.onabort = null; this._l = []; };
    Sig.prototype.addEventListener = function(t, f){ if (t === 'abort') this._l.push(f); };
    Sig.prototype.removeEventListener = function(t, f){ this._l = this._l.filter(function(x){ return x !== f; }); };
    Sig.prototype.throwIfAborted = function(){ if (this.aborted) throw this.reason; };
    var AC = function(){ this.signal = new Sig(); };
    AC.prototype.abort = function(r){
      var s = this.signal; if (s.aborted) return;
      s.aborted = true; s.reason = r || abortErr();
      var ev = { type: 'abort', target: s }; if (s.onabort) s.onabort(ev); s._l.forEach(function(f){ f(ev); });
    };
    g.AbortController = AC; g.AbortSignal = Sig;
    var abortErr = function(){ var e = new Error('The operation was aborted.'); e.name = 'AbortError'; return e; };
    if (g.fetch){
      var nf = g.fetch;
      g.fetch = function(u, o){
        var s = o && o.signal;
        if (!(s instanceof Sig)) return nf.apply(this, arguments);
        var o2 = {}; for (var k in o) if (k !== 'signal') o2[k] = o[k];
        if (s.aborted) return Promise.reject(s.reason);
        return new Promise(function(res, rej){ s.addEventListener('abort', function(){ rej(s.reason); }); nf.call(g, u, o2).then(res, rej); });
      };
    }
  }

  /* ResizeObserver yok (Safari 13.0 ve öncesi): pencere boyutu değişince haber veren basit yedek */
  if (!g.ResizeObserver){
    g.ResizeObserver = function(cb){ var els = [], self = this, fire = function(){ cb(els.map(function(t){ return { target: t, contentRect: t.getBoundingClientRect() }; }), self); };
      this.observe = function(el){ if (els.indexOf(el) < 0) els.push(el); setTimeout(fire, 0); };
      this.unobserve = function(el){ els = els.filter(function(x){ return x !== el; }); };
      this.disconnect = function(){ els = []; g.removeEventListener('resize', fire); };
      g.addEventListener('resize', fire); };
  }
})();
