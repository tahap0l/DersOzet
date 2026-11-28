/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0. Eski tarayıcılar için çevrilmiş kopya; kaynak app/js, üreten tools/build-legacy.sh */
"use strict";
const CH_PHOTO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1.3-2h5.2l1.3 2h1.6A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5Z"/><circle cx="12" cy="12.5" r="3.5"/></svg>';
const CH = { msgs: null, img: null, busy: false, ctrl: null, think: false, photos: /* @__PURE__ */ new Map() };
function chCanSave(i) {
  const u = CH.msgs[i - 1];
  return !!(Cloud.uid && u && u.role === "user" && (u.thumb || CH.photos.has(CH.msgs[i].at)));
}
const chKey = () => "dersozetim.chat." + (Cloud.uid || "yerel");
function chLoad() {
  if (CH.msgs && CH.owner === chKey()) return;
  CH.owner = chKey();
  try {
    CH.msgs = JSON.parse(localStorage.getItem(chKey()) || "[]");
  } catch (e) {
    CH.msgs = [];
  }
  if (!Array.isArray(CH.msgs)) CH.msgs = [];
}
function chSave() {
  let imgs = 0;
  const keep = CH.msgs.slice(-40).map((m) => Object.assign({}, m, { pending: false })).reverse().map((m) => {
    if (m.thumb && ++imgs > 6) {
      const c = Object.assign({}, m);
      delete c.thumb;
      c.hadImg = true;
      return c;
    }
    return m;
  }).reverse();
  CH.msgs = keep;
  try {
    localStorage.setItem(chKey(), JSON.stringify(keep));
  } catch (e) {
    try {
      localStorage.setItem(chKey(), JSON.stringify(keep.map((m) => {
        const c = Object.assign({}, m);
        delete c.thumb;
        return c;
      })));
    } catch (_) {
    }
  }
}
function texLite(t) {
  let s = String(t || "");
  s = s.replace(/\$\$([\s\S]+?)\$\$/g, "$1").replace(/\\\[([\s\S]+?)\\\]/g, "$1").replace(/\\\(([\s\S]+?)\\\)/g, "$1").replace(/\$([^$\n]{1,200})\$/g, "$1");
  for (let i = 0; i < 4; i++) s = s.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, (m, a, b) => (/^[\w.]+$/.test(a) ? a : "(" + a + ")") + "/" + (/^[\w.]+$/.test(b) ? b : "(" + b + ")"));
  s = s.replace(/\\sqrt\[(\d)\]\{([^{}]*)\}/g, (m, n, x) => (n === "3" ? "∛" : n + "√") + "(" + x + ")").replace(/\\sqrt\{([^{}]*)\}/g, (m, x) => /^\w+$/.test(x) ? "√" + x : "√(" + x + ")");
  s = s.replace(/\\text\{([^{}]*)\}/g, "$1").replace(/\\mathrm\{([^{}]*)\}/g, "$1").replace(/\\(left|right)/g, "").replace(/\\[,;!]/g, " ");
  const sym = { cdot: "·", times: "×", div: "÷", le: "≤", leq: "≤", ge: "≥", geq: "≥", neq: "≠", ne: "≠", approx: "≈", pm: "±", infty: "∞", pi: "π", alpha: "α", beta: "β", gamma: "γ", theta: "θ", lambda: "λ", mu: "μ", Delta: "Δ", delta: "δ", omega: "ω", sigma: "σ", Omega: "Ω", rightarrow: "→", Rightarrow: "⇒", to: "→", degree: "°", circ: "°", angle: "∠", perp: "⊥", parallel: "∥", in: "∈", cup: "∪", cap: "∩", emptyset: "∅", sum: "Σ", int: "∫" };
  s = s.replace(/\\([A-Za-z]+)/g, (m, w) => sym[w] != null ? sym[w] : w);
  s = s.replace(/\^\{([^{}]*)\}/g, (m, x) => /^-?\d+$/.test(x) ? toSupS(x) : "^(" + x + ")").replace(/\^(-?\d)/g, (m, x) => toSupS(x)).replace(/_\{([^{}]*)\}/g, "_$1");
  return s;
}
const toSupS = (x) => String(x).split("").map((c) => ({ "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" })[c] || c).join("");
function mdLite(t) {
  const inline = (x) => x.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/__([^_]+)__/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>");
  const lines = esc(texLite(t)).split("\n"), out = [];
  let list = null;
  const close = () => {
    if (list) {
      out.push("</".concat(list, ">"));
      list = null;
    }
  };
  lines.forEach((raw) => {
    const l = raw.replace(/\s+$/, "");
    let m;
    if (m = l.match(/^\s*[-*•]\s+(.*)$/)) {
      if (list !== "ul") {
        close();
        out.push("<ul>");
        list = "ul";
      }
      out.push("<li>" + inline(m[1]) + "</li>");
      return;
    }
    if (m = l.match(/^\s*(\d+)[.)]\s+(.*)$/)) {
      if (list !== "ol") {
        close();
        out.push('<ol start="'.concat(m[1], '">'));
        list = "ol";
      }
      out.push("<li>" + inline(m[2]) + "</li>");
      return;
    }
    close();
    if (!l.trim()) return;
    if (m = l.match(/^#{1,6}\s+(.*)$/)) {
      out.push("<h4>" + inline(m[1]) + "</h4>");
      return;
    }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(l)) return;
    out.push("<p>" + inline(l) + "</p>");
  });
  close();
  return out.join("");
}
async function chImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const draw = (max) => {
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * k);
      c.height = Math.round(img.naturalHeight * k);
      const g = c.getContext("2d");
      g.fillStyle = "#fff";
      g.fillRect(0, 0, c.width, c.height);
      g.drawImage(img, 0, 0, c.width, c.height);
      return c;
    };
    return { data: draw(1600).toDataURL("image/jpeg", 0.85), thumb: draw(360).toDataURL("image/jpeg", 0.7) };
  } finally {
    URL.revokeObjectURL(url);
  }
}
function chSystem() {
  const p = DB.d.profile, tops = typeof todayTopics === "function" ? todayTopics() : [];
  const tr = TRACKS[p.track] ? TRACKS[p.track].name : p.track;
  return "Sen Mürek'sin: Ders Özetim uygulamasının yapay zekâ öğretmeni. YKS'ye (TYT ve AYT) hazırlanan bir lise öğrencisine yardım ediyorsun.\nKurallar:\n- Her zaman Türkçe yaz. Sade, sıcak ve net ol; gereksiz uzatma.\n- Soru çözerken önce sorunun hangi ders ve konudan olduğunu bir cümleyle söyle, sonra çözümü numaralı adımlarla yaz, en sonda \"Cevap:\" satırında sonucu ver (şıklı soruysa şıkkı da yaz).\n- Konu anlatırken kısa paragraflar ve maddeler kullan, mutlaka bir örnek ver.\n- Formülleri düz metinle yaz (örnek: a^2 + b^2 = c^2, √x, x/y). LaTeX kullanma.\n- Fotoğraftaki yazıyı okuyamıyorsan ya da bir bilgiden emin değilsen bunu açıkça söyle; uydurma.\n- Ders dışı konulara kısa cevap ver ve nazikçe derslere dön.\n".concat(isTeacher() ? "Bu kullanıcı öğrenci değil, dershanede ".concat(p.branch ? p.branch + " hocası" : "hoca", ": ").concat(firstName(p.name) || "", " Hoca. Ona meslektaşın gibi konuş; soru çözümü, örnek soru hazırlama, konu anlatım fikri ve sınıf yönetiminde yardım et. Öğrencilere uygun soru isterse zorluk seviyesini ve cevap anahtarını da ver.") : "Öğrenci: ".concat(firstName(p.name) || "öğrenci").concat(p.grade ? ", " + gradeName(p.grade) : "", ", alan: ").concat(tr, ", YKS'ye ").concat(daysLeft(), " gün var").concat(p.goal && p.goal.dept ? ", hedefi: " + (p.goal.school ? p.goal.school + " " : "") + p.goal.dept : "", ".\n").concat(tops.length ? "Bugünkü konuları: " + tops.map((t) => t.subject + " - " + t.name).join(", ") + "." : "Bugün programında konu yok."));
}
function chSuggestions() {
  const tops = typeof todayTopics === "function" ? todayTopics() : [];
  const out = [];
  if (isTeacher()) {
    const b = DB.d.profile.branch || "Matematik";
    return ["".concat(b, " için 5 soruluk kısa bir sınav hazırla, cevap anahtarıyla"), "Fotoğraftaki soruyu adım adım çöz", "".concat(b, " dersinde zor bir konuyu öğrencilere nasıl anlatırım?"), "Programını yapmayan öğrenciyle nasıl konuşurum?"];
  }
  if (tops[0]) out.push("".concat(tops[0].name, " konusunu kısaca anlat"));
  out.push("Fotoğraftaki soruyu adım adım çöz");
  if (tops[1]) out.push("Bana ".concat(tops[1].name, " konusundan 3 soru sor"));
  else out.push("Türev nedir? Basit bir örnekle anlat");
  out.push("Paragraf sorularında nasıl hızlanırım?");
  return out;
}
function chMsgHTML(m, i) {
  if (m.role === "user") return '<div class="ch-msg user">'.concat(m.thumb ? '<img class="ch-thumb" src="'.concat(m.thumb, '" alt="Gönderdiğin fotoğraf">') : m.hadImg ? '<span class="hint">[fotoğraf]</span>' : "").concat(m.text ? "<p>".concat(esc(m.text), "</p>") : "", "</div>");
  const body = m.err ? '<p class="err">'.concat(esc(m.err), "</p>").concat(m.retry ? '<button class="link sm" data-act="ch-retry">Tekrar dene</button>' : "") : m.text ? mdLite(m.text) : '<p class="ch-wait"><span class="spinner" aria-hidden="true"></span>'.concat(m.thinking ? "Düşünüyor…" : "Yazıyor…", "</p>");
  return '<div class="ch-msg bot" data-i="'.concat(i, '"><div class="ch-av" aria-hidden="true">').concat(mascotSVG(m.pending ? "think" : "ok", 30), '</div><div class="ch-b">').concat(body).concat(!m.pending && m.text ? '<div class="ch-acts"><button class="link sm" data-act="ch-copy" data-i="'.concat(i, '">Kopyala</button>').concat(chCanSave(i) ? m.saved ? '<span class="hint">Yanlış defterine eklendi</span>' : '<button class="link sm" data-act="ch-wrong" data-i="'.concat(i, '">Yanlış defterime ekle</button>') : "", "</div>") : "", "</div></div>");
}
function askHTML() {
  chLoad();
  const empty = !CH.msgs.length;
  return '<section class="ask">\n    <div class="ask-top"><span class="hint" id="ask-q">'.concat(esc(AI.quotaText()), "</span>").concat(empty ? "" : '<button class="link sm" data-act="ch-new">Yeni sohbet</button>', '</div>\n    <div class="ch-log" id="ch-log" aria-live="polite">').concat(empty ? '<div class="ch-empty">'.concat(mascotSVG("ok", 64), "<p><strong>Merhaba").concat(DB.d.profile.name ? " " + esc(firstName(DB.d.profile.name)) : "", '!</strong> Takıldığın soruyu yaz ya da fotoğrafını çek; adım adım çözelim. Konu anlatmamı da isteyebilirsin.</p>\n      <div class="ch-sugs">').concat(chSuggestions().map((s) => '<button class="fchip" data-act="ch-sug" data-t="'.concat(esc(s), '">').concat(esc(s), "</button>")).join(""), "</div></div>") : CH.msgs.map(chMsgHTML).join(""), '</div>\n    <form class="ch-form" id="ch-f">\n      <div class="ch-pic" id="ch-pic"').concat(CH.img ? "" : " hidden", ">").concat(CH.img ? '<img src="'.concat(CH.img.thumb, '" alt="Eklenen fotoğraf">') : "", '<button type="button" class="icon-btn sm" data-act="ch-pic-x" aria-label="Fotoğrafı kaldır">').concat(I.close, '</button></div>\n      <div class="ch-row">\n        <label class="icon-btn ch-cam" for="ch-file" title="Sorunun fotoğrafını ekle" aria-label="Sorunun fotoğrafını ekle">').concat(CH_PHOTO, '</label>\n        <input type="file" id="ch-file" accept="image/*" hidden>\n        <textarea id="ch-t" rows="1" maxlength="4000" placeholder="Sorunu yaz ya da fotoğrafını ekle" aria-label="Sorun"></textarea>\n        <button class="btn primary ch-send" id="ch-send" aria-label="Gönder"').concat(CH.busy ? " disabled" : "", ">").concat(I.send, '</button>\n      </div>\n      <label class="ch-think" title="Daha yavaş ama matematik ve fen sorularında daha doğru"><input type="checkbox" id="ch-think"').concat(CH.think ? " checked" : "", "> Adım adım düşünerek çöz</label>\n    </form>\n  </section>");
}
function chPaintLog(scroll) {
  const log = $("#ch-log");
  if (!log) return;
  log.innerHTML = CH.msgs.map(chMsgHTML).join("");
  const top = $(".ask-top");
  if (top && !$('[data-act="ch-new"]', top)) top.insertAdjacentHTML("beforeend", '<button class="link sm" data-act="ch-new">Yeni sohbet</button>');
  if (scroll !== false) chScroll();
}
function chScroll() {
  const last = $("#ch-log .ch-msg:last-child");
  if (last) last.scrollIntoView({ block: "end", behavior: "smooth" });
}
function chPaintLast() {
  const log = $("#ch-log");
  if (!log) return;
  const i = CH.msgs.length - 1, el = log.querySelector('.ch-msg[data-i="'.concat(i, '"]'));
  if (el) el.outerHTML = chMsgHTML(CH.msgs[i], i);
  else chPaintLog();
}
async function chSend(text) {
  chLoad();
  if (CH.busy) return;
  text = String(text || "").trim();
  const img = CH.img;
  if (!text && !img) return;
  if (!AI.ready()) {
    toast(DB.d.ai.engine === "bulut" ? "Yapay zekâyı kullanmak için hesabına giriş yap." : "Önce yapay zekâyı seç: Asistan > Ayarlar.");
    return;
  }
  if (img && DB.d.ai.engine !== "bulut") {
    toast('Fotoğraflı soru için Ayarlar\'dan "Ders Özetim yapay zekâsı"nı seç.');
    return;
  }
  const think = !!($("#ch-think") && $("#ch-think").checked);
  CH.think = think;
  const q = text || "Fotoğraftaki soruyu adım adım çöz.";
  CH.msgs.push({ role: "user", text, thumb: img ? img.thumb : "", at: Date.now() });
  const bot = { role: "assistant", text: "", pending: true, at: Date.now() };
  CH.msgs.push(bot);
  if (img) CH.photos.set(bot.at, img.data);
  CH.img = null;
  const pic = $("#ch-pic");
  if (pic) {
    pic.hidden = true;
    pic.innerHTML = "";
  }
  const ta = $("#ch-t");
  if (ta) {
    ta.value = "";
    ta.style.height = "";
  }
  CH.busy = true;
  const sb = $("#ch-send");
  if (sb) sb.disabled = true;
  chPaintLog();
  const hist = CH.msgs.slice(0, -2).slice(-10).filter((m) => (m.text || m.thumb || m.hadImg) && !m.err).map((m) => ({ role: m.role, content: m.role === "user" ? (m.thumb || m.hadImg ? "[Fotoğraflı bir soru gönderdi] " : "") + (m.text || "") : m.text }));
  const cur = img ? { role: "user", content: [{ type: "text", text: q }, { type: "image_url", image_url: { url: img.data } }] } : { role: "user", content: q };
  const messages = [{ role: "system", content: chSystem() }].concat(hist, [cur]);
  let lastPaint = 0;
  try {
    CH.ctrl = new AbortController();
    const txt = await AI.chat(messages, { think, maxTokens: think ? 6e3 : 2e3, signal: CH.ctrl.signal, onText: (s, th) => {
      bot.text = s;
      bot.thinking = !!th && !s;
      const now = Date.now();
      if (now - lastPaint > 60) {
        lastPaint = now;
        chPaintLast();
      }
    } });
    bot.text = String(txt || bot.text || "").trim() || "Buna bir cevap üretemedim. Soruyu biraz farklı yazar mısın?";
  } catch (e) {
    bot.err = aiErrText(e);
    bot.retry = !/quota|busy_day|not_signed_in/.test(String(e && e.message));
    CH.lastQ = { text, img };
  }
  bot.pending = false;
  bot.thinking = false;
  CH.busy = false;
  CH.ctrl = null;
  chSave();
  if (route.page === "asistan") {
    chPaintLog();
    const s2 = $("#ch-send");
    if (s2) s2.disabled = false;
    const qq = $("#ask-q");
    if (qq) qq.textContent = AI.quotaText();
  }
}
async function chSetImage(file) {
  if (!file || !/^image\//.test(file.type)) return;
  try {
    CH.img = await chImage(file);
    const pic = $("#ch-pic");
    if (pic) {
      pic.hidden = false;
      pic.innerHTML = '<img src="'.concat(CH.img.thumb, '" alt="Eklenen fotoğraf"><button type="button" class="icon-btn sm" data-act="ch-pic-x" aria-label="Fotoğrafı kaldır">').concat(I.close, "</button>");
    }
    const th = $("#ch-think");
    if (th && !th.checked) th.checked = true;
    const ta = $("#ch-t");
    if (ta) ta.focus();
  } catch (e) {
    toast("Bu fotoğraf açılamadı. Başka bir fotoğraf dene.");
  }
}
function askAfter() {
  chLoad();
  if (DB.d.ai.engine === "bulut" && Cloud.uid && !AI.quota) AI.refreshQuota().then(() => {
    const q = $("#ask-q");
    if (q) q.textContent = AI.quotaText();
  });
  const ta = $("#ch-t");
  if (ta) {
    const grow = () => {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
    };
    ta.addEventListener("input", grow);
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing && matchMedia("(pointer: fine)").matches) {
        e.preventDefault();
        chSend(ta.value);
      }
    });
    ta.addEventListener("paste", (e) => {
      const f2 = Array.from(e.clipboardData && e.clipboardData.files || []).find((x) => /^image\//.test(x.type));
      if (f2) {
        e.preventDefault();
        chSetImage(f2);
      }
    });
    if (ui.askDraft) {
      ta.value = ui.askDraft;
      ui.askDraft = "";
      grow();
      ta.focus();
    }
  }
  const f = $("#ch-file");
  if (f) f.addEventListener("change", () => {
    const x = f.files && f.files[0];
    f.value = "";
    chSetImage(x);
  });
  const form = $("#ch-f");
  if (form) form.addEventListener("submit", (e) => {
    e.preventDefault();
    chSend($("#ch-t").value);
  });
  if (CH.msgs.length) setTimeout(() => {
    const log = $("#ch-log .ch-msg:last-child");
    if (log) log.scrollIntoView({ block: "end" });
  }, 30);
}
Object.assign(ACT, {
  "ch-sug": (el) => {
    const t = el.dataset.t;
    if (/fotoğraf/i.test(t)) {
      const f = $("#ch-file");
      if (f) f.click();
      return;
    }
    chSend(t);
  },
  "ch-new": () => {
    if (CH.ctrl) CH.ctrl.abort();
    CH.msgs = [];
    CH.busy = false;
    chSave();
    render();
  },
  "ch-wrong": (el) => chToWrong(Number(el.dataset.i)),
  "ch-pic-x": () => {
    CH.img = null;
    const pic = $("#ch-pic");
    if (pic) {
      pic.hidden = true;
      pic.innerHTML = "";
    }
  },
  "ch-copy": async (el) => {
    const m = CH.msgs[Number(el.dataset.i)];
    if (!m) return;
    try {
      await navigator.clipboard.writeText(texLite(m.text));
      toast("Kopyalandı");
    } catch (e) {
      toast("Kopyalanamadı");
    }
  },
  "ch-retry": () => {
    const bot = CH.msgs[CH.msgs.length - 1];
    if (!bot || !bot.err) return;
    const q = CH.lastQ || {};
    CH.msgs.splice(-2, 2);
    CH.img = q.img || null;
    chSend(q.text || "");
  }
});
async function chToWrong(i) {
  const bot = CH.msgs[i], u = CH.msgs[i - 1];
  if (!bot || !u || !Cloud.uid || bot.saving) return;
  bot.saving = true;
  const data = CH.photos.get(bot.at) || u.thumb;
  if (!data) {
    bot.saving = false;
    toast("Fotoğraf bulunamadı.");
    return;
  }
  try {
    const blob = await (await fetch(data)).blob();
    const sol = texLite(bot.text).trim(), g = guessTask(sol.slice(0, 300) + " " + (u.text || ""));
    const m = libraryMatch([{ text: sol.split("\n")[0].slice(0, 200), subject: g.subject }], libIndex()).tasks[0] || {};
    const n = newNote("wrong", { title: "Mürek'in çözdüğü soru", subject: m.subject || g.subject || "", topic: m.topic || "", body: ("Mürek'in çözümü:\n" + sol).slice(0, 2e4), paper: "plain" });
    const path = Cloud.uid + "/" + n.id + "-" + Date.now().toString(36) + ".jpg";
    const { error } = await Cloud.sb.storage.from("notes").upload(path, blob, { contentType: "image/jpeg", upsert: true });
    if (error) throw error;
    n.image_path = path;
    NT.urls[path] = { url: data, exp: Date.now() + 35e5 };
    if (!NT.list) NT.list = (NT.readCache() || {}).list || [];
    ntSave(n, true);
    bot.saved = true;
    chSave();
    chPaintLog();
    toast("Yanlış defterine eklendi. Yarın tekrar soracağım.");
  } catch (e) {
    toast("Eklenemedi. İnternet bağlantını kontrol et.");
  }
  bot.saving = false;
}
async function chQuickSolve(file) {
  if (!file) return;
  if (!Cloud.uid) {
    toast("Fotoğraflı soru için hesabına giriş yap.");
    return;
  }
  if (DB.d.ai.engine !== "bulut") {
    DB.d.ai.engine = "bulut";
    DB.save();
  }
  chLoad();
  try {
    CH.img = await chImage(file);
  } catch (e) {
    toast("Bu fotoğraf açılamadı. Başka bir fotoğraf dene.");
    return;
  }
  CH.think = true;
  go("#/asistan/sor");
  setTimeout(() => {
    const th = $("#ch-think");
    if (th) th.checked = true;
    chSend("");
  }, 120);
}
document.addEventListener("change", (e) => {
  if (e.target && e.target.id === "qs-file") {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    chQuickSolve(f);
  }
});
