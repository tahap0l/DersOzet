/*!
 * Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
 * ai.js: API anahtarı gerektirmeyen yapay zekâ motorları.
 *   - WebLLM: model tarayıcıda, cihazın kendi ekran kartında çalışır (WebGPU). Kurulum ve anahtar yok.
 *   - Ollama: bilgisayarına kurduğun ücretsiz yerel model sunucusu.
 *   - Dışarıdan yapıştır: hazır metni herhangi bir sohbet botuna verip yanıtı geri yapıştırırsın.
 */
'use strict';

const WEBLLM_URL = 'https://esm.run/@mlc-ai/web-llm@0.2.89';
const AI_MODELS = [
  { id: 'Qwen3-1.7B-q4f16_1-MLC', name: 'Hafif', note: 'Telefon ve tabletler için. Yaklaşık 2 GB ekran belleği ister.' },
  { id: 'Qwen3.5-2B-q4f16_1-MLC', name: 'Dengeli', note: 'Yeni telefonlar ve bilgisayarlar için. Yaklaşık 2,2 GB ister.' },
  { id: 'Qwen3.5-4B-q4f16_1-MLC', name: 'Güçlü', note: 'Bilgisayarlar için; Türkçesi daha iyi. Yaklaşık 3,9 GB ister.' }
];

const AI = {
  engine: null, loadedModel: '', status: 'idle', progress: '', worker: null,
  hasWebGPU(){ return typeof navigator !== 'undefined' && !!navigator.gpu; },
  ready(){ const c = DB.d.ai; return c.engine === 'claude' ? !!CAP.sample : c.engine === 'ollama' ? !!c.ollamaModel : c.engine === 'webllm' ? this.hasWebGPU() : false; },
  label(){
    const c = DB.d.ai;
    if (c.engine === 'webllm'){ const m = AI_MODELS.find(x => x.id === c.model); return 'Tarayıcıda: ' + (m ? m.name + ' model' : c.model); }
    if (c.engine === 'ollama') return 'Ollama: ' + (c.ollamaModel || 'model seçilmedi');
    if (c.engine === 'claude') return CAP.sample ? 'Claude (kendi hesabınla)' : 'Claude (bu görünümde kullanılamıyor)';
    return 'Kapalı';
  },

  async loadWebLLM(onProgress){
    const model = DB.d.ai.model;
    if (this.engine && this.loadedModel === model) return this.engine;
    if (!this.hasWebGPU()) throw new Error('nogpu');
    this.status = 'loading';
    const wl = await import(WEBLLM_URL);
    const report = p => { this.progress = p.text || ''; if (onProgress) onProgress(p); };
    try {
      if (this.engine && this.engine.reload){ await this.engine.reload(model); }
      else {
        try {
          this.worker = new Worker(new URL('js/llm-worker.js', document.baseURI), { type: 'module' });
          this.engine = await wl.CreateWebWorkerMLCEngine(this.worker, model, { initProgressCallback: report });
        } catch(e){
          if (this.worker){ this.worker.terminate(); this.worker = null; }
          this.engine = await wl.CreateMLCEngine(model, { initProgressCallback: report });
        }
      }
      this.loadedModel = model; this.status = 'ready';
      return this.engine;
    } catch(e){ this.status = 'error'; throw e; }
  },

  async ollamaModels(url){
    const r = await fetch(String(url || DB.d.ai.ollamaUrl).replace(/\/+$/, '') + '/api/tags');
    if (!r.ok) throw new Error('ollama ' + r.status);
    const j = await r.json();
    return (j.models || []).map(m => m.name);
  },

  async chat(messages, opts){
    opts = opts || {};
    const c = DB.d.ai;
    if (c.engine === 'webllm'){
      const eng = await this.loadWebLLM(opts.onProgress);
      const req = { messages, temperature: 0.4, max_tokens: opts.maxTokens || 1800, extra_body: { enable_thinking: false } };
      if (opts.json) req.response_format = { type: 'json_object' };
      if (opts.onText){
        req.stream = true;
        let txt = '';
        const it = await eng.chat.completions.create(req);
        for await (const ch of it){ txt += (ch.choices[0] && ch.choices[0].delta && ch.choices[0].delta.content) || ''; opts.onText(txt); }
        return stripThink(txt);
      }
      const r = await eng.chat.completions.create(req);
      return stripThink(r.choices[0].message.content || '');
    }
    if (c.engine === 'claude'){
      if (!CAP.sample) throw new Error('claude-off');
      const prompt = messages.map(m => m.content).join('\n\n');
      const onText = opts.onText ? (u => opts.onText(u.text || '')) : undefined;
      try {
        if (opts.json){ const v = await CAP.sample.json(prompt, { onText }); return JSON.stringify(v); }
        const r = await CAP.sample(prompt, { onText }); return r.text || '';
      } catch(e){ const err = new Error('claude:' + (e && e.code || 'error')); err.text = e && e.text; throw err; }
    }
    if (c.engine === 'ollama'){
      const body = { model: c.ollamaModel, messages, stream: false, think: false, options: { temperature: 0.4 } };
      if (opts.json) body.format = 'json';
      const r = await fetch(c.ollamaUrl.replace(/\/+$/, '') + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: opts.signal });
      if (!r.ok) throw new Error('ollama ' + r.status);
      const j = await r.json();
      return stripThink((j.message && j.message.content) || '');
    }
    throw new Error('off');
  }
};
function stripThink(t){ return String(t || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim(); }
function parseJSONLoose(t){
  t = stripThink(t).replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try { return JSON.parse(t); } catch(e){}
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a){ try { return JSON.parse(t.slice(a, b + 1)); } catch(e){} }
  return null;
}

/* ---------- istemler (prompt) ---------- */
function planPrompt(o){
  const p = DB.d.profile;
  const topics = o.subjects.map(s => { const t = topicsOfSubject(s).slice(0, 14); return t.length ? s + ': ' + t.join(', ') : ''; }).filter(Boolean).join('\n');
  return `Sen YKS'ye hazırlanan bir öğrenciye haftalık çalışma programı hazırlayan bir rehber öğretmensin. Tamamen Türkçe yaz.

Öğrenci bilgileri:
- Alan: ${TRACKS[p.track] ? TRACKS[p.track].name : p.track}
- Çalışacağı dersler: ${o.subjects.join(', ')}
- Zorlandığı dersler (daha çok zaman ayır): ${o.weak.length ? o.weak.join(', ') : 'belirtilmedi'}
- Günlük çalışma süresi: yaklaşık ${o.hours} saat (her görev yaklaşık 50 dakika)
- Çalışacağı günler: ${o.days.slice().sort().map(d => DAYS[d]).join(', ')}
${o.note ? '- Öğrencinin notu: ' + o.note + '\n' : ''}
Mümkünse şu konu adlarını aynen kullan:
${topics || '(liste yok)'}

Kurallar: Her güne ${Math.max(1, Math.round(o.hours * 60 / 50))} görev koy. Konu çalışmasını hemen ardından aynı konudan soru çözümüyle eşleştir. Pazar günü çalışılıyorsa genel tekrar ve deneme koy. Görev metni kısa ve net olsun.

SADECE şu yapıda JSON döndür:
{"gunler":[{"gun":"Pazartesi","gorevler":[{"ders":"Matematik","konu":"Mutlak Değer","gorev":"Mutlak değer konu tekrarı"}]}]}`;
}
function weekPrompt(wk, w){
  const p = DB.d.profile;
  const lines = w.tasks.map(t => DAYS[t.day] + ': ' + t.text + (t.topic ? ' (konu: ' + t.topic + ')' : '')).slice(0, 80).join('\n');
  return `Sen YKS'ye hazırlanan bir öğrencinin rehber öğretmenisin. Aşağıda öğrencinin ${weekRange(wk)} haftasının çalışma programı var. Haftaya başlamadan önce okuyacağı kısa bir ön izleme yaz. Tamamen Türkçe, sade ve cesaretlendirici yaz; abartma.
Öğrenci: ${p.name || 'öğrenci'}, alan: ${TRACKS[p.track] ? TRACKS[p.track].name : p.track}${p.goal && p.goal.dept ? ', hedef: ' + p.goal.dept : ''}.

Program:
${lines}

SADECE şu yapıda JSON döndür:
{"baslik":"haftayı anlatan kısa bir cümle","ozet":"3-4 cümle: bu hafta hangi derslerde hangi konular var","oncelikler":["haftaya başlamadan bilinmesi ya da odaklanılması gereken 3-4 somut şey"],"dersler":[{"ders":"Fizik","not":"bu hafta bu derste neye odaklanılıyor, 1 cümle"}],"ipucu":"bu haftayı verimli geçirmek için kısa bir ipucu"}`;
}
function weekFromJSON(j){
  if (!j || typeof j !== 'object') return null;
  const s = v => typeof v === 'string' ? v.trim() : '';
  const arr = v => Array.isArray(v) ? v : [];
  const o = { headline: s(j.baslik || j.headline), summary: s(j.ozet || j.summary), priorities: arr(j.oncelikler || j.priorities).map(s).filter(Boolean),
    subjects: arr(j.dersler || j.subjects).map(x => ({ subject: canonSubject(s(x && (x.ders || x.subject))), note: s(x && (x.not || x.note)) })).filter(x => x.subject && x.note), tip: s(j.ipucu || j.tip) };
  return (o.summary || o.headline) ? o : null;
}
function summaryPrompt(subject, name){
  return `Sen YKS'ye hazırlanan öğrencilere ders anlatan bir öğretmensin. "${name}" konusu${subject ? ' (' + subject + ')' : ''} için lise müfredatına ve YKS kapsamına uygun, anlaşılır bir konu özeti yaz. Tamamen Türkçe, sade cümlelerle yaz. Emin olmadığın bilgiyi yazma. Formülleri düz metinle yaz.

SADECE şu yapıda JSON döndür:
{"title":"konu başlığı","oneLiner":"tek cümlelik özet","overview":"3-4 cümle genel bakış","sections":[{"title":"alt başlık","explanation":"2-4 cümle açıklama","points":["önemli nokta"],"example":"kısa örnek ya da boş metin"}],"formulas":[{"name":"formül adı","formula":"formül","note":"semboller"}],"terms":[{"term":"kavram","definition":"tanım"}],"mistakes":["sık yapılan hata"],"questions":[{"q":"soru","a":"kısa cevap"}],"studyTip":"çalışma ipucu"}
3-5 alt başlık, 3-6 kavram, 2-3 hata ve 3-4 soru yaz. Konuda formül yoksa formulas boş dizi olsun.`;
}
function planFromJSON(j){
  if (!j) return null;
  const days = Array.isArray(j.gunler) ? j.gunler : Array.isArray(j.days) ? j.days : null;
  if (!days) return null;
  const lc = DAYS.map(d => d.toLocaleLowerCase('tr'));
  const out = [];
  days.forEach(d => {
    const di = lc.indexOf(String(d.gun || d.day || '').toLocaleLowerCase('tr').trim());
    if (di < 0) return;
    (d.gorevler || d.tasks || []).forEach(t => {
      const text = String(t.gorev || t.task || '').trim(); if (!text) return;
      out.push({ day: di, subject: canonSubject(t.ders || t.subject || ''), topic: String(t.konu || t.topic || '').trim(), text });
    });
  });
  return out.length ? out : null;
}
