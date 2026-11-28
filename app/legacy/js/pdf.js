/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0. Eski tarayıcılar için çevrilmiş kopya; kaynak app/js, üreten tools/build-legacy.sh */
"use strict";
/*!
 * Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
 * pdf.js: konu özetlerini ve haftalık programı A4 PDF olarak indirir.
 */
const PDF_W = 720, PDF_H = Math.floor(720 * 273 / 186);
function loadScript(src, globalName) {
  if (window[globalName]) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => window[globalName] ? res() : rej(new Error("missing " + globalName));
    s.onerror = () => rej(new Error("load " + src));
    document.head.appendChild(s);
  });
}
function topicDocHTML(tp, sd, pdf) {
  const s = sd.summary || {};
  const sections = (s.sections || []).map((t, i) => '<div class="d-sec">\n      <h3><span class="d-num">'.concat(i + 1, '</span><span class="d-ttl">').concat(esc(t.title), "</span></h3>\n      ").concat(t.explanation ? "<p>".concat(esc(t.explanation), "</p>") : "", "\n      ").concat((t.points || []).length ? "<ul>".concat(t.points.map((p) => "<li>".concat(esc(p), "</li>")).join(""), "</ul>") : "", "\n      ").concat(t.example ? '<p class="d-ex"><strong>Örnek:</strong> '.concat(esc(t.example), "</p>") : "", "\n    </div>")).join("");
  const formulas = (s.formulas || []).map((f) => '<div class="d-f"><span class="d-f-name">'.concat(esc(f.name), '</span><span class="d-f-eq">').concat(esc(f.formula), "</span>").concat(f.note ? '<span class="d-f-note">'.concat(esc(f.note), "</span>") : "", "</div>")).join("");
  const terms = (s.terms || []).map((t) => '<div class="d-term"><dt>'.concat(esc(t.term), "</dt><dd>").concat(esc(t.definition), "</dd></div>")).join("");
  const qs = (s.questions || []).map((q) => pdf ? '<li class="d-q"><p class="q">'.concat(esc(q.q), "</p>").concat(q.a ? '<p class="a">Cevap: '.concat(esc(q.a), "</p>") : "", "</li>") : '<li class="d-q"><p class="q">'.concat(esc(q.q), "</p>").concat(q.a ? '<details><summary>Cevabı göster</summary><p class="a">'.concat(esc(q.a), "</p></details>") : "", "</li>")).join("");
  const rel = (tp.tasks || []).map((t) => DAYS_S[t.day] + ": " + (t.label || sentence(t.text)));
  const src = sd.source === "yerel-yz" ? "Bu özeti cihazındaki yapay zekâ hazırladı; hatalar içerebilir, önemli bilgileri ders kitabından kontrol et." : sd.source === "dis-yz" ? "Bu özet dışarıdan yapıştırdığın yapay zekâ yanıtından oluşturuldu; önemli bilgileri ders kitabından kontrol et." : sd.source === "video" ? "Bu özet videonun transkriptine göre hazırlandı." : "Bu özet konunun genel YKS kapsamına göre hazırlandı; videonun birebir özeti değildir.";
  return '<article class="d" style="--c:'.concat(subjColor(tp.subject), '">\n    <header class="d-head">\n      <p class="d-course"><span class="chip">').concat(esc(tp.subject || "Konu"), "</span><span>").concat(sd.mine ? "Senin özetin" : "Konu özeti", '</span></p>\n      <h1 class="d-title">').concat(esc(s.title || tp.name), "</h1>\n      ").concat(s.oneLiner ? '<p class="d-one">'.concat(esc(s.oneLiner), "</p>") : "", "\n      ").concat(rel.length ? '<p class="d-rel"><strong>Bu hafta:</strong> '.concat(rel.map(esc).join("; "), "</p>") : "", "\n    </header>\n    ").concat(s.overview ? "<h2>Genel bakış</h2><p>".concat(esc(s.overview), "</p>") : "", "\n    ").concat(sections ? "<h2>Konu anlatımı</h2>".concat(sections) : "", "\n    ").concat(formulas ? '<h2>Formüller</h2><div class="d-fs">'.concat(formulas, "</div>") : "", "\n    ").concat(terms ? '<h2>Kavramlar</h2><dl class="d-terms">'.concat(terms, "</dl>") : "", "\n    ").concat((s.mistakes || []).length ? '<h2>Sık yapılan hatalar</h2><ul class="d-list">'.concat(s.mistakes.map((m) => "<li>".concat(esc(m), "</li>")).join(""), "</ul>") : "", "\n    ").concat(qs ? '<h2>Kendini dene</h2><ol class="d-qs">'.concat(qs, "</ol>") : "", "\n    ").concat(s.studyTip ? '<p class="d-tip"><strong>Çalışma ipucu:</strong> '.concat(esc(s.studyTip), "</p>") : "", '\n    <p class="d-src">').concat(src, "</p>\n  </article>");
}
function programDocHTML(wk, w) {
  const mon = fromKey(wk), name = DB.d.profile.name;
  const days = [0, 1, 2, 3, 4, 5, 6].map((di) => {
    const ts = w.tasks.filter((t) => t.day === di);
    if (!ts.length) return "";
    return '<div class="pd-day"><h2>'.concat(DAYS[di], ", ").concat(fmtDay(addDays(mon, di)), '</h2><ul class="pd-tasks">').concat(ts.map((t) => '<li><span class="pd-box">'.concat(t.done ? "✓" : "", '</span><span class="pd-t">').concat(esc(t.label || sentence(t.text)), "</span>").concat(t.subject ? '<span class="chip" style="--c:'.concat(subjColor(t.subject), '">').concat(esc(t.subject), "</span>") : "", "</li>")).join(""), "</ul></div>");
  }).join("");
  const auto = weekAuto(wk), ai = w.overview && w.overview.sig === weekSig(w) ? w.overview : null;
  const ov = auto ? "<h2>Haftaya bakış</h2>".concat(ai && ai.headline ? "<p><strong>".concat(esc(ai.headline), "</strong></p>") : "", "<p>").concat(esc(ai && ai.summary ? ai.summary : auto.summary), '</p>\n    <ul class="d-list">').concat((ai && ai.priorities.length ? ai.priorities : auto.priorities).map((x) => "<li>".concat(esc(x), "</li>")).join(""), "</ul>\n    ").concat(ai && ai.subjects.length ? '<ul class="d-list">'.concat(ai.subjects.map((x) => "<li><strong>".concat(esc(x.subject), ":</strong> ").concat(esc(x.note), "</li>")).join(""), "</ul>") : "", "\n    ").concat(ai && ai.tip ? '<p class="d-tip"><strong>İpucu:</strong> '.concat(esc(ai.tip), "</p>") : "") : "";
  return '<article class="d"><header class="d-head"><p class="d-course"><span>'.concat(esc(w.label ? w.label + " programı" : "Haftalık program"), "</span><span>").concat(esc(weekRange(wk)), '</span></p>\n    <h1 class="d-title">').concat(name ? esc(name) + " için haftalık program" : "Haftalık program", "</h1></header>").concat(ov).concat(days, "</article>");
}
function buildPages(stage, html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const root = tmp.firstElementChild;
  if (!root) return [];
  root.querySelectorAll("ol").forEach((ol) => {
    const st = Number(ol.getAttribute("start") || 1);
    Array.from(ol.children).forEach((li, i) => {
      if (li.tagName === "LI") li.setAttribute("value", String(st + i));
    });
  });
  const pages = [];
  let pageEl = null, parent = null;
  const openPage = (chain) => {
    pageEl = document.createElement("div");
    pageEl.className = "pdf-doc pdf-page";
    stage.appendChild(pageEl);
    pages.push(pageEl);
    let p = pageEl;
    chain.forEach((src) => {
      const c = src.cloneNode(false);
      p.appendChild(c);
      p = c;
    });
    return p;
  };
  const over = () => pageEl.scrollHeight > PDF_H + 1;
  const hasText = () => pageEl.textContent.trim().length > 0;
  const splittable = (el) => /^(UL|OL|DL)$/.test(el.tagName) || el.matches(".d-sec,.d-fs,.pd-day,.pd-tasks");
  const heading = (el) => /^H[1-6]$/.test(el.tagName);
  const place = (kids, chain) => {
    for (let i = 0; i < kids.length; i++) {
      const node = kids[i];
      parent.appendChild(node);
      if (!over()) {
        const nxt = kids[i + 1];
        if (heading(node) && nxt) {
          const split = splittable(nxt) && nxt.firstElementChild;
          const probe = split ? nxt.cloneNode(false) : nxt.cloneNode(true);
          if (split) probe.appendChild(nxt.firstElementChild.cloneNode(true));
          parent.appendChild(probe);
          const bad = over();
          probe.remove();
          if (bad) {
            node.remove();
            if (hasText()) parent = openPage(chain);
            parent.appendChild(node);
          }
        }
        continue;
      }
      node.remove();
      if (splittable(node) && node.firstElementChild) {
        const shell = node.cloneNode(false);
        parent.appendChild(shell);
        parent = shell;
        place(Array.from(node.children), chain.concat([node]));
        parent = parent.parentElement;
        continue;
      }
      if (hasText()) parent = openPage(chain);
      parent.appendChild(node);
    }
  };
  parent = openPage([root]);
  place(Array.from(root.children), [root]);
  pages.forEach((pg) => {
    Array.from(pg.querySelectorAll("*")).reverse().forEach((el) => {
      if (!el.children.length && !el.textContent.trim() && el.tagName !== "SPAN" && el.tagName !== "BR") el.remove();
    });
  });
  return pages.filter((pg) => {
    if (pg.textContent.trim()) return true;
    pg.remove();
    return false;
  });
}
function saveBlob(blob, filename) {
  if (CAP.downloads) {
    CAP.downloads.save({ filename, data: blob }).catch((e) => {
      const c = e && e.code;
      if (c === "declined") return;
      toast(c === "host_unavailable" ? "Bu uygulama dosya kaydedemiyor; sayfayı tarayıcıda ya da bilgisayarda aç." : "Dosya kaydedilemedi. Tekrar dene.");
    });
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 12e4);
}
async function exportPdf(parts, filename, note) {
  const cover = document.createElement("div");
  cover.className = "pdf-cover";
  cover.innerHTML = '<span class="spinner" aria-hidden="true"></span><p id="pdf-cover-t">PDF hazırlanıyor…</p>';
  document.body.appendChild(cover);
  const setT = (t) => {
    const el = document.getElementById("pdf-cover-t");
    if (el) el.textContent = t;
  };
  let stage = null, blob = null;
  const sx = window.scrollX, sy = window.scrollY;
  try {
    const art = ENV === "artifact";
    await loadScript(art ? "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" : "vendor/html2canvas.min.js", "html2canvas");
    await loadScript(art ? "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" : (window.__DO_LEGACY ? "legacy/" : "") + "vendor/jspdf.umd.min.js", "jspdf");
    try {
      await document.fonts.ready;
    } catch (e) {
    }
    window.scrollTo(0, 0);
    stage = document.createElement("div");
    stage.className = "pdf-stage";
    document.body.appendChild(stage);
    let pages = [];
    parts.forEach((h) => {
      pages = pages.concat(buildPages(stage, h));
    });
    pages.forEach((p) => {
      p.style.display = "none";
    });
    const pdf = new window.jspdf.jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    pdf.setProperties({ title: filename.replace(/\.pdf$/, ""), author: APP.author, creator: APP.name + " (" + APP.repo + ")" });
    const scale = navigator.maxTouchPoints > 1 ? 1.3 : 1.5;
    for (let i = 0; i < pages.length; i++) {
      setT("PDF hazırlanıyor… sayfa " + (i + 1) + "/" + pages.length);
      const pg = pages[i];
      pg.style.display = "";
      const canvas = await window.html2canvas(pg, { scale, backgroundColor: "#ffffff", logging: false, scrollX: 0, scrollY: 0 });
      pg.style.display = "none";
      const img = canvas.toDataURL("image/jpeg", 0.8);
      const h = canvas.height * 186 / canvas.width;
      if (i) pdf.addPage();
      pdf.addImage(img, "JPEG", 12, 12, 186, h, void 0, "FAST");
      pdf.setFontSize(8);
      pdf.setTextColor(120, 110, 150);
      pdf.text("Ders Özetim · Esat Taha Polat", 12, 290);
      pdf.text(i + 1 + " / " + pages.length, 198, 290, { align: "right" });
      canvas.width = 0;
      canvas.height = 0;
    }
    blob = pdf.output("blob");
  } catch (e) {
    toast("PDF oluşturulamadı. Tekrar dene.");
  } finally {
    if (stage) stage.remove();
    cover.remove();
    window.scrollTo(sx, sy);
  }
  if (blob) {
    saveBlob(blob, filename);
    if (!CAP.downloads) toast(note || "PDF indirildi");
  }
}
