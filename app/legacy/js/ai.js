/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0. Eski tarayıcılar için çevrilmiş kopya; kaynak app/js, üreten tools/build-legacy.sh */
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __knownSymbol = (name, symbol) => (symbol = Symbol[name]) ? symbol : Symbol.for("Symbol." + name);
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __forAwait = (obj, it, method) => (it = obj[__knownSymbol("asyncIterator")]) ? it.call(obj) : (obj = obj[__knownSymbol("iterator")](), it = {}, method = (key, fn) => (fn = obj[key]) && (it[key] = (arg) => new Promise((yes, no, done) => (arg = fn.call(obj, arg), done = arg.done, Promise.resolve(arg.value).then((value) => yes({ value, done }), no)))), method("next"), method("return"), it);
/*!
 * Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
 * ai.js: API anahtarı gerektirmeyen yapay zekâ motorları.
 *   - Bulut (varsayılan): sitenin kendi sunucusundaki model (functions/api/ai.js, Cloudflare Workers AI).
 *     Giriş yapan herkes kullanır; anahtar, kurulum, indirme yok. Günlük kullanım hakkı vardır.
 *   - WebLLM: model tarayıcıda, cihazın kendi ekran kartında çalışır (WebGPU). Kurulum ve anahtar yok.
 *   - Ollama: bilgisayarına kurduğun ücretsiz yerel model sunucusu.
 *   - Dışarıdan yapıştır: hazır metni herhangi bir sohbet botuna verip yanıtı geri yapıştırırsın.
 */
const WEBLLM_URL = "https://esm.run/@mlc-ai/web-llm@0.2.89";
const AI_MODELS = [
  { id: "Qwen3-1.7B-q4f16_1-MLC", name: "Hafif", note: "Telefon ve tabletler için. Yaklaşık 2 GB ekran belleği ister." },
  { id: "Qwen3.5-2B-q4f16_1-MLC", name: "Dengeli", note: "Yeni telefonlar ve bilgisayarlar için. Yaklaşık 2,2 GB ister." },
  { id: "Qwen3.5-4B-q4f16_1-MLC", name: "Güçlü", note: "Bilgisayarlar için; Türkçesi daha iyi. Yaklaşık 3,9 GB ister." }
];
const AI = {
  engine: null,
  loadedModel: "",
  status: "idle",
  progress: "",
  worker: null,
  quota: null,
  hasWebGPU() {
    return typeof navigator !== "undefined" && !!navigator.gpu;
  },
  ready() {
    const c = DB.d.ai;
    return c.engine === "bulut" ? !!Cloud.uid : c.engine === "claude" ? !!CAP.sample : c.engine === "ollama" ? !!c.ollamaModel : c.engine === "webllm" ? this.hasWebGPU() : false;
  },
  label() {
    const c = DB.d.ai;
    if (c.engine === "bulut") return "Ders Özetim yapay zekâsı";
    if (c.engine === "webllm") {
      const m = AI_MODELS.find((x) => x.id === c.model);
      return "Tarayıcıda: " + (m ? m.name + " model" : c.model);
    }
    if (c.engine === "ollama") return "Ollama: " + (c.ollamaModel || "model seçilmedi");
    if (c.engine === "claude") return CAP.sample ? "Claude (kendi hesabınla)" : "Claude (bu görünümde kullanılamıyor)";
    return "Kapalı";
  },
  async loadWebLLM(onProgress) {
    const model = DB.d.ai.model;
    if (this.engine && this.loadedModel === model) return this.engine;
    if (!this.hasWebGPU()) throw new Error("nogpu");
    this.status = "loading";
    const wl = await Promise.resolve().then(() => __toESM(require(WEBLLM_URL)));
    const report = (p) => {
      this.progress = p.text || "";
      if (onProgress) onProgress(p);
    };
    try {
      if (this.engine && this.engine.reload) {
        await this.engine.reload(model);
      } else {
        try {
          this.worker = new Worker(new URL("js/llm-worker.js", document.baseURI), { type: "module" });
          this.engine = await wl.CreateWebWorkerMLCEngine(this.worker, model, { initProgressCallback: report });
        } catch (e) {
          if (this.worker) {
            this.worker.terminate();
            this.worker = null;
          }
          this.engine = await wl.CreateMLCEngine(model, { initProgressCallback: report });
        }
      }
      this.loadedModel = model;
      this.status = "ready";
      return this.engine;
    } catch (e) {
      this.status = "error";
      throw e;
    }
  },
  async ollamaModels(url) {
    const r = await fetch(String(url || DB.d.ai.ollamaUrl).replace(/\/+$/, "") + "/api/tags");
    if (!r.ok) throw new Error("ollama " + r.status);
    const j = await r.json();
    return (j.models || []).map((m) => m.name);
  },
  async refreshQuota() {
    if (!Cloud.uid) return null;
    try {
      this.quota = await Cloud.rpc("ai_left");
    } catch (e) {
    }
    return this.quota;
  },
  quotaText() {
    const q = this.quota;
    return q ? "Bugün ".concat(q.limit - q.used, " hakkın kaldı (").concat(q.limit, " üzerinden)") : "";
  },
  /* sunucudaki model; görsel ve adım adım düşünme destekler */
  async cloud(messages, opts) {
    const tok = await Cloud.token();
    if (!tok) throw new Error("cloud:not_signed_in");
    let r;
    try {
      r = await fetch(new URL("/api/ai", location.origin), {
        method: "POST",
        signal: opts.signal,
        headers: { "content-type": "application/json", Authorization: "Bearer " + tok },
        body: JSON.stringify({ messages, think: !!opts.think, maxTokens: opts.maxTokens || 1800, stream: !!opts.onText })
      });
    } catch (e) {
      if (e && e.name === "AbortError") throw e;
      throw new Error("cloud:offline");
    }
    const used = r.headers.get("x-ai-used"), lim = r.headers.get("x-ai-limit");
    if (used && lim) this.quota = { used: Number(used), limit: Number(lim) };
    if (!r.ok) {
      let j = {};
      try {
        j = await r.json();
      } catch (e) {
      }
      if (j.error === "quota" && j.limit) this.quota = { used: j.used, limit: j.limit };
      throw new Error("cloud:" + (j.error || "http" + r.status));
    }
    if (!opts.onText) {
      const j = await r.json();
      return stripThink(j.text || "");
    }
    const rd = r.body.getReader(), dec = new TextDecoder();
    let buf = "", txt = "", thinking = 0;
    for (; ; ) {
      const { value, done } = await rd.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        let j;
        try {
          j = JSON.parse(data);
        } catch (e) {
          continue;
        }
        const ch = j.choices && j.choices[0], d = ch && (ch.delta || ch.message) || {};
        const piece = typeof j.response === "string" ? j.response : d.content || "";
        if (piece) {
          txt += piece;
          opts.onText(stripThink(txt), false);
        } else if (d.reasoning_content || d.reasoning) {
          thinking += String(d.reasoning_content || d.reasoning).length;
          opts.onText(stripThink(txt), thinking);
        }
      }
    }
    return stripThink(txt);
  },
  async chat(messages, opts) {
    opts = opts || {};
    const c = DB.d.ai;
    if (c.engine === "bulut") return this.cloud(messages, opts);
    if (c.engine === "webllm") {
      const eng = await this.loadWebLLM(opts.onProgress);
      const req = { messages, temperature: 0.4, max_tokens: opts.maxTokens || 1800, extra_body: { enable_thinking: false } };
      if (opts.json) req.response_format = { type: "json_object" };
      if (opts.onText) {
        req.stream = true;
        let txt = "";
        const it = await eng.chat.completions.create(req);
        try {
          for (var iter = __forAwait(it), more, temp, error; more = !(temp = await iter.next()).done; more = false) {
            const ch = temp.value;
            txt += ch.choices[0] && ch.choices[0].delta && ch.choices[0].delta.content || "";
            opts.onText(txt);
          }
        } catch (temp) {
          error = [temp];
        } finally {
          try {
            more && (temp = iter.return) && await temp.call(iter);
          } finally {
            if (error)
              throw error[0];
          }
        }
        return stripThink(txt);
      }
      const r = await eng.chat.completions.create(req);
      return stripThink(r.choices[0].message.content || "");
    }
    if (c.engine === "claude") {
      if (!CAP.sample) throw new Error("claude-off");
      const prompt = messages.map((m) => m.content).join("\n\n");
      const onText = opts.onText ? (u) => opts.onText(u.text || "") : void 0;
      try {
        if (opts.json) {
          const v = await CAP.sample.json(prompt, { onText });
          return JSON.stringify(v);
        }
        const r = await CAP.sample(prompt, { onText });
        return r.text || "";
      } catch (e) {
        const err = new Error("claude:" + (e && e.code || "error"));
        err.text = e && e.text;
        throw err;
      }
    }
    if (c.engine === "ollama") {
      const body = { model: c.ollamaModel, messages, stream: false, think: false, options: { temperature: 0.4 } };
      if (opts.json) body.format = "json";
      const r = await fetch(c.ollamaUrl.replace(/\/+$/, "") + "/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: opts.signal });
      if (!r.ok) throw new Error("ollama " + r.status);
      const j = await r.json();
      return stripThink(j.message && j.message.content || "");
    }
    throw new Error("off");
  }
};
function stripThink(t) {
  return String(t || "").replace(/<think>[\s\S]*?(<\/think>|$)/g, "").replace(/^\s+/, "");
}
function aiErrText(e) {
  const m = String(e && e.message || e || "");
  const q = AI.quota;
  const map = {
    "cloud:quota": "Bugünkü yapay zekâ hakkın bitti" + (q ? " (" + q.limit + "/" + q.limit + ")" : "") + ". Gece yarısı yenilenir.",
    "cloud:busy_day": "Uygulamanın bugünkü ortak yapay zekâ kotası doldu. Sabah 03.00'te yenilenir.",
    "cloud:busy": "Yapay zekâ şu an çok yoğun. Birkaç saniye sonra tekrar dene.",
    "cloud:no_ai": "Sunucudaki yapay zekâ şu an kapalı. Biraz sonra tekrar dene.",
    "cloud:not_signed_in": "Yapay zekâyı kullanmak için hesabına giriş yap.",
    "cloud:offline": "İnternete bağlanılamadı. Bağlantını kontrol edip tekrar dene.",
    "cloud:bad_request": "İstek çok uzun ya da fotoğraf çok büyük. Kısaltıp tekrar dene."
  };
  if (map[m]) return map[m];
  if (m.startsWith("cloud:")) return "Yapay zekâ yanıt veremedi. Tekrar dene.";
  if (m.startsWith("claude:")) {
    const code = m.slice(7);
    return code === "rate_limited" ? "Claude kullanım sınırına ulaşıldı. Biraz sonra tekrar dene." : code === "not_granted" ? "Claude'a izin verilmedi." : "Claude yanıt veremedi. Tekrar dene.";
  }
  if (m === "nogpu") return 'Bu tarayıcı WebGPU desteklemiyor. Ayarlar\'dan "Ders Özetim yapay zekâsı"nı seç.';
  if (/ollama|fetch|Failed/i.test(m)) return "Ollama'ya bağlanılamadı. Ayarlar'daki komutla başlattığından emin ol.";
  return "Yapay zekâ yanıt veremedi. Tekrar dene.";
}
function parseJSONLoose(t) {
  t = stripThink(t).replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(t);
  } catch (e) {
  }
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) {
    try {
      return JSON.parse(t.slice(a, b + 1));
    } catch (e) {
    }
  }
  return null;
}
function weekPrompt(wk, w) {
  const p = DB.d.profile;
  const lines = w.tasks.map((t) => DAYS[t.day] + ": " + t.text + (t.topic ? " (konu: " + t.topic + ")" : "")).slice(0, 80).join("\n");
  return "Sen YKS'ye hazırlanan bir öğrencinin rehber öğretmenisin. Aşağıda öğrencinin ".concat(weekRange(wk), " haftasının çalışma programı var. Haftaya başlamadan önce okuyacağı kısa bir ön izleme yaz. Tamamen Türkçe, sade ve cesaretlendirici yaz; abartma.\nÖğrenci: ").concat(p.name || "öğrenci", ", alan: ").concat(TRACKS[p.track] ? TRACKS[p.track].name : p.track).concat(p.goal && p.goal.dept ? ", hedef: " + p.goal.dept : "", ".\n\nProgram:\n").concat(lines, '\n\nSADECE şu yapıda JSON döndür:\n{"baslik":"haftayı anlatan kısa bir cümle","ozet":"3-4 cümle: bu hafta hangi derslerde hangi konular var","oncelikler":["haftaya başlamadan bilinmesi ya da odaklanılması gereken 3-4 somut şey"],"dersler":[{"ders":"Fizik","not":"bu hafta bu derste neye odaklanılıyor, 1 cümle"}],"ipucu":"bu haftayı verimli geçirmek için kısa bir ipucu"}');
}
function weekFromJSON(j) {
  if (!j || typeof j !== "object") return null;
  const s = (v) => typeof v === "string" ? v.trim() : "";
  const arr = (v) => Array.isArray(v) ? v : [];
  const o = {
    headline: s(j.baslik || j.headline),
    summary: s(j.ozet || j.summary),
    priorities: arr(j.oncelikler || j.priorities).map(s).filter(Boolean),
    subjects: arr(j.dersler || j.subjects).map((x) => ({ subject: canonSubject(s(x && (x.ders || x.subject))), note: s(x && (x.not || x.note)) })).filter((x) => x.subject && x.note),
    tip: s(j.ipucu || j.tip)
  };
  return o.summary || o.headline ? o : null;
}
function summaryPrompt(subject, name) {
  return "Sen YKS'ye hazırlanan öğrencilere ders anlatan bir öğretmensin. \"".concat(name, '" konusu').concat(subject ? " (" + subject + ")" : "", ' için lise müfredatına ve YKS kapsamına uygun, anlaşılır bir konu özeti yaz. Tamamen Türkçe, sade cümlelerle yaz. Emin olmadığın bilgiyi yazma. Formülleri düz metinle yaz.\n\nSADECE şu yapıda JSON döndür:\n{"title":"konu başlığı","oneLiner":"tek cümlelik özet","overview":"3-4 cümle genel bakış","sections":[{"title":"alt başlık","explanation":"2-4 cümle açıklama","points":["önemli nokta"],"example":"kısa örnek ya da boş metin"}],"formulas":[{"name":"formül adı","formula":"formül","note":"semboller"}],"terms":[{"term":"kavram","definition":"tanım"}],"mistakes":["sık yapılan hata"],"questions":[{"q":"soru","a":"kısa cevap"}],"studyTip":"çalışma ipucu"}\n3-5 alt başlık, 3-6 kavram, 2-3 hata ve 3-4 soru yaz. Konuda formül yoksa formulas boş dizi olsun.');
}
