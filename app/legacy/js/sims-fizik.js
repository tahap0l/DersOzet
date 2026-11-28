/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0. Eski tarayıcılar için çevrilmiş kopya; kaynak app/js, üreten tools/build-legacy.sh */
"use strict";
const LIQUIDS = [["su", "Su", 1, "rgba(64,140,255,.32)"], ["yag", "Zeytinyağı", 0.92, "rgba(214,170,40,.40)"], ["tuzlu", "Tuzlu su", 1.2, "rgba(40,170,190,.36)"], ["gliserin", "Gliserin", 1.26, "rgba(180,150,230,.38)"], ["civa", "Cıva", 13.6, "rgba(170,175,185,.75)"]];
const liq = (id) => LIQUIDS.find((l) => l[0] === id) || LIQUIDS[0];
defSim({
  id: "kaldirma",
  subject: "Fizik",
  title: "Kaldırma kuvveti",
  topics: ["fizik--kaldirma-kuvveti", "fizik--basinc"],
  icon: I.book,
  blurb: "Cisim yüzer mi, askıda mı kalır, batar mı?",
  lead: "Cismi sıvıya bırak. Cismin yoğunluğunu ve sıvıyı değiştir; kaldırma kuvvetinin batan hacme göre nasıl değiştiğini izle.",
  tries: ["Cismin yoğunluğunu sıvınınkine eşitle: cisim nerede durur?", "Aynı cismi sudan tuzlu suya al: batan kısım artar mı azalır mı?", "Cıvayı seç: demir (7,8 g/cm³) bile neden yüzer?"],
  note: "Kaldırma kuvveti <b>F<sub>k</sub> = V<sub>batan</sub> · d<sub>sıvı</sub> · g</b>. Yüzen cisimde F<sub>k</sub> = G olur ve batan hacim oranı <b>d<sub>cisim</sub> / d<sub>sıvı</sub></b> kadardır.",
  aspect: 0.78,
  init(S) {
    S.slider("dc", "Cismin yoğunluğu", 0.2, 8, 0.05, 0.6, (x) => nf(x, 2) + " g/cm³");
    S.slider("V", "Cismin hacmi", 100, 800, 10, 300, (x) => nf(x, 0) + " cm³");
    S.choice("liq", "Sıvı", LIQUIDS.map((l) => [l[0], l[1] + " (" + nf(l[2], 2) + ")"]), "su");
    let y = 70, v = 0;
    S.button("Yeniden bırak", () => {
      y = 70;
      v = 0;
    }, true);
    const L = 150, R = 850, TOP = 170, BOT = 700, YL = 320;
    return {
      draw(dt) {
        const c = S.c, g = S.g, dc = S.vals.dc, V = S.vals.V, L0 = liq(S.vals.liq), ds = L0[2];
        const s = 22 * Math.cbrt(V), x0 = 500 - s / 2;
        const f = clamp((y + s - YL) / s, 0, 1);
        const a = 1400 * (1 - ds / dc * f) - (0.6 + 4.2 * f) * v;
        v += a * dt;
        y += v * dt;
        if (y + s > BOT) {
          y = BOT - s;
          if (v > 0) v = 0;
        }
        if (y < 20) {
          y = 20;
          v = Math.max(0, v);
        }
        const fNow = clamp((y + s - YL) / s, 0, 1);
        g.fillStyle = L0[3];
        g.fillRect(L, YL, R - L, BOT - YL);
        const wave = Math.sin(S.t * 2) * 3;
        S.line(L, YL + wave * 0.3, R, YL - wave * 0.3, c.waterTop, 3);
        g.strokeStyle = c.ink2;
        g.lineWidth = 6;
        g.beginPath();
        g.moveTo(L, TOP);
        g.lineTo(L, BOT);
        g.lineTo(R, BOT);
        g.lineTo(R, TOP);
        g.stroke();
        const col = dc > ds + 0.02 ? "#8B5E3C" : Math.abs(dc - ds) <= 0.02 ? "#7C5CE6" : "#E0A458";
        g.fillStyle = col;
        S.rr(x0, y, s, s, 10);
        g.fill();
        if (fNow > 0 && fNow < 1) {
          g.save();
          g.fillStyle = "rgba(255,255,255,.22)";
          g.fillRect(x0, YL, s, y + s - YL);
          g.restore();
        }
        S.text(nf(dc, 2), x0 + 12, y + 22, { size: 20, align: "left", color: "#fff", align: "center", base: "middle", weight: 900 });
        const G = dc * V / 100, Fk = ds * V * fNow / 100, N = Math.max(0, G - Fk);
        const sc = 230 / Math.max(G, ds * V / 100, 0.5), cx = 500, cy = y + s / 2;
        S.arrow(cx + 26, cy, cx + 26, cy + G * sc, c.danger, 7, "G = " + nf(G, 2) + " N", { dx: 18 });
        if (Fk > 5e-3) S.arrow(cx - 26, cy, cx - 26, cy - Fk * sc, c.ok, 7, "Fk = " + nf(Fk, 2) + " N", { dx: -18, align: "right" });
        if (N > 0.01 && y + s >= BOT - 1) S.arrow(cx - s / 2 - 30, BOT, cx - s / 2 - 30, BOT - N * sc, c.brand, 6, "N", { dx: -14, align: "right" });
        S.text(L0[1] + ": " + nf(ds, 2) + " g/cm³", L + 16, BOT - 18, { size: 28, color: c.ink2 });
        const state = Math.abs(dc - ds) <= 0.02 ? "Askıda kalır" : dc < ds ? "Yüzer" : "Batar";
        S.kv([["Durum", state], ["Batan hacim", "%" + nf(fNow * 100, 0) + (dc < ds ? " (beklenen %" + nf(dc / ds * 100, 0) + ")" : "")], ["Ağırlık G", nf(G, 2) + " N"], ["Kaldırma kuvveti F<sub>k</sub>", nf(Fk, 2) + " N"], N > 0.01 && y + s >= BOT - 1 ? ["Tabanın tepkisi N", nf(N, 2) + " N"] : null]);
      }
    };
  }
});
defSim({
  id: "sivi",
  subject: "Fizik",
  title: "Sıvı basıncı",
  topics: ["fizik--sivi-basinci", "fizik--basinc", "fizik--basinc-olcen-aletler-ve-akiskanlarin-basinci"],
  icon: I.book,
  blurb: "Derinlik arttıkça basınç ve fışkırma hızı nasıl değişir?",
  lead: "Ölçeri sürükle, derinliğe göre basıncı oku. Delikten fışkıran sıvının hızı da derinlikle artar.",
  tries: ["Ölçeri aşağı indir: basınç neden artıyor?", "Kabın şeklini değiştir: tabandaki basınç değişiyor mu?", "Sıvıyı cıva yap: aynı derinlikte basınç kaç katına çıkar?"],
  note: "Sıvı basıncı <b>P = h · d · g</b>. Sadece derinliğe ve sıvının yoğunluğuna bağlıdır; kabın şekline ve sıvının miktarına bağlı değildir.",
  aspect: 0.8,
  init(S) {
    S.choice("liq", "Sıvı", LIQUIDS.filter((l) => l[0] !== "gliserin").map((l) => [l[0], l[1]]), "su");
    S.slider("h", "Sıvı yüksekliği", 15, 60, 1, 45, (x) => nf(x, 0) + " cm");
    S.choice("shape", "Kabın şekli", [["duz", "Düz"], ["genis", "Üstü geniş"], ["dar", "Üstü dar"]], "duz");
    S.toggle("holes", "Yan delikleri aç", true);
    const PX = 9, BOT = 700, XL = 170, XR = 470, HMAX = 60;
    let probe = { x: 300, y: BOT - 160 }, drag = false;
    const wallX = (yy, side) => {
      const t = (BOT - yy) / (HMAX * PX), sh = S.vals.shape, d = sh === "genis" ? 90 * t : sh === "dar" ? -90 * t : 0;
      return side < 0 ? XL - d : XR + d;
    };
    return {
      down(x, y) {
        if (Math.hypot(x - probe.x, y - probe.y) < 70) {
          drag = true;
          return true;
        }
        return false;
      },
      move(x, y) {
        if (!drag) return;
        const top = BOT - S.vals.h * PX;
        probe.y = clamp(y, top + 6, BOT - 10);
        probe.x = clamp(x, wallX(probe.y, -1) + 30, wallX(probe.y, 1) - 30);
      },
      up() {
        drag = false;
      },
      draw(dt, t) {
        const c = S.c, g = S.g, L0 = liq(S.vals.liq), d = L0[2], h = S.vals.h, top = BOT - h * PX;
        probe.y = clamp(probe.y, top + 6, BOT - 10);
        probe.x = clamp(probe.x, wallX(probe.y, -1) + 30, wallX(probe.y, 1) - 30);
        g.fillStyle = L0[3];
        g.beginPath();
        g.moveTo(wallX(BOT, -1), BOT);
        g.lineTo(wallX(top, -1), top);
        g.lineTo(wallX(top, 1), top);
        g.lineTo(wallX(BOT, 1), BOT);
        g.closePath();
        g.fill();
        const gr = g.createLinearGradient(0, top, 0, BOT);
        gr.addColorStop(0, "rgba(0,0,40,0)");
        gr.addColorStop(1, "rgba(0,0,60,.18)");
        g.fillStyle = gr;
        g.fill();
        const T = BOT - HMAX * PX - 10;
        g.strokeStyle = c.ink2;
        g.lineWidth = 6;
        g.beginPath();
        g.moveTo(wallX(T, -1), T);
        g.lineTo(wallX(BOT, -1), BOT);
        g.lineTo(wallX(BOT, 1), BOT);
        g.lineTo(wallX(T, 1), T);
        g.stroke();
        if (S.vals.holes) [10, 25, 40].forEach((hh, i) => {
          const hy = BOT - hh * PX, depth = h - hh;
          if (depth <= 0) return;
          const hx = wallX(hy, 1), R = 2 * Math.sqrt(depth * hh) * PX;
          g.strokeStyle = L0[3].replace(/[\d.]+\)$/, ".9)");
          g.lineWidth = 5;
          g.beginPath();
          for (let k = 0; k <= 24; k++) {
            const u = k / 24, xx = hx + R * u, yy = hy + hh * PX * u * u;
            k ? g.lineTo(xx, yy) : g.moveTo(xx, yy);
          }
          g.stroke();
          for (let k = 0; k < 4; k++) {
            const u = (t * 0.9 + k / 4 + i * 0.13) % 1;
            S.circle(hx + R * u, hy + hh * PX * u * u, 6, L0[3].replace(/[\d.]+\)$/, "1)"));
          }
          S.circle(hx, hy, 7, c.bg, c.ink2, 3);
          S.text("v ∝ √" + nf(depth, 0), hx + 12, hy - 14, { size: 22, color: c.ink2 });
        });
        const pd = (probe.y - top) / PX, P = d * 1e3 * 10 * pd / 100;
        S.line(probe.x, top, probe.x, probe.y, c.ink2, 2, [8, 8]);
        S.circle(probe.x, probe.y, 22, c.brand, "#fff", 4);
        S.text("h = " + nf(pd, 0) + " cm", probe.x + 34, probe.y - 19 * S.ts, { size: 26, color: c.ink, bg: c.bg, base: "middle" });
        S.text("P = " + nf(P / 1e3, 2) + " kPa", probe.x + 34, probe.y + 19 * S.ts, { size: 26, color: c.brand, bg: c.bg, base: "middle" });
        if (!drag && t < 6) S.text("Ölçeri sürükle", probe.x, probe.y + 50 + 20 * S.ts, { size: 24, color: c.ink2, align: "center" });
        const Pb = d * 1e3 * 10 * h / 100;
        S.text("Tabanda: " + nf(Pb / 1e3, 2) + " kPa", 600, 90, { size: 30, weight: 800 });
        S.text(L0[1] + ", d = " + nf(d, 2) + " g/cm³", 600, 130, { size: 24, color: c.ink2 });
        S.kv([["Ölçerin derinliği", nf(pd, 0) + " cm"], ["Basınç P = h·d·g", nf(P, 0) + " Pa"], ["Tabandaki basınç", nf(Pb, 0) + " Pa"], ["Kabın şekli", S.vals.shape === "duz" ? "Düz" : S.vals.shape === "genis" ? "Üstü geniş" : "Üstü dar"]]);
      }
    };
  }
});
defSim({
  id: "kati",
  subject: "Fizik",
  title: "Katı basıncı",
  topics: ["fizik--kati-basinci", "fizik--basinc"],
  icon: I.book,
  blurb: "Aynı tuğla, farklı yüzey: kuma ne kadar gömülür?",
  lead: "Tuğlayı farklı yüzeyleri üstüne koy, üst üste tuğla ekle. Yüzey küçüldükçe basınç ve kuma gömülme artar.",
  tries: ["Tuğlayı dar yüzeyinin üstüne koy: basınç kaç katına çıktı?", "İki tuğlayı üst üste koy: basınç ne oldu?", "Kütleyi iki katına çıkar ve yüzeyi iki katına çıkar: basınç değişir mi?"],
  note: "Katı basıncı <b>P = F / A</b>. Kuvvet aynıyken temas yüzeyi küçülürse basınç artar; bıçağın keskin, kayağın geniş olması bu yüzdendir.",
  aspect: 0.66,
  init(S) {
    S.choice("face", "Üstüne konduğu yüzey", [["g", "Geniş (20×10)"], ["y", "Yan (20×5)"], ["d", "Dar (10×5)"]], "g");
    S.slider("m", "Bir tuğlanın kütlesi", 1, 6, 0.5, 2, (x) => nf(x, 1) + " kg");
    S.slider("n", "Üst üste tuğla", 1, 3, 1, 1, (x) => nf(x, 0));
    let sink = 0;
    const FACES = { g: { w: 20, dpt: 10, h: 5 }, y: { w: 20, dpt: 5, h: 10 }, d: { w: 10, dpt: 5, h: 20 } };
    return {
      draw(dt) {
        const c = S.c, g = S.g, F = FACES[S.vals.face], n = S.vals.n, m = S.vals.m;
        const A = F.w * F.dpt, G = n * m * 10, P = G / (A / 1e4);
        const target = clamp(P / 1e3 * 5, 0, 110);
        sink = lerp(sink, target, 1 - Math.pow(0.02, dt));
        const PX = 14, GROUND = 470, cx = 500, bw = F.w * PX, bh = F.h * PX;
        g.fillStyle = "#E9C98B";
        g.fillRect(60, GROUND, 880, 200);
        g.fillStyle = "#D7B06A";
        for (let i = 0; i < 90; i++) {
          const xx = 60 + i * 97 % 880, yy = GROUND + 12 + i * 53 % 180;
          g.fillRect(xx, yy, 4, 4);
        }
        g.fillStyle = "#C99F57";
        g.beginPath();
        g.moveTo(cx - bw / 2 - 20, GROUND);
        g.quadraticCurveTo(cx - bw / 2, GROUND + sink, cx, GROUND + sink);
        g.quadraticCurveTo(cx + bw / 2, GROUND + sink, cx + bw / 2 + 20, GROUND);
        g.closePath();
        g.fill();
        for (let i = 0; i < n; i++) {
          const y0 = GROUND + sink - bh * (i + 1);
          g.fillStyle = "#C0463A";
          S.rr(cx - bw / 2, y0, bw, bh, 6);
          g.fill();
          g.strokeStyle = "rgba(0,0,0,.25)";
          g.lineWidth = 2;
          g.stroke();
          g.fillStyle = "rgba(255,255,255,.16)";
          g.fillRect(cx - bw / 2 + 6, y0 + 6, bw - 12, Math.min(14, bh / 4));
        }
        S.line(cx - bw / 2, GROUND + sink + 26, cx + bw / 2, GROUND + sink + 26, c.brand, 4);
        S.text("A = " + F.w + " × " + F.dpt + " = " + A + " cm²", cx, GROUND + sink + 62, { size: 28, color: c.brand, align: "center", weight: 800 });
        S.arrow(cx, GROUND + sink - bh * n - 110, cx, GROUND + sink - bh * n - 10, c.danger, 7, "G = " + nf(G, 0) + " N", { dx: 18 });
        const bx = 860, by = 80, bhh = 330, pf = clamp(P / 4e4, 0, 1);
        g.fillStyle = c.bg2;
        S.rr(bx, by, 50, bhh, 12);
        g.fill();
        g.fillStyle = S.tempColor(pf);
        S.rr(bx, by + bhh * (1 - pf), 50, bhh * pf, 12);
        g.fill();
        S.text("P", bx + 25, by - 14, { size: 30, align: "center", weight: 900 });
        S.kv([["Ağırlık G", nf(G, 0) + " N"], ["Temas yüzeyi A", A + " cm² = " + nf(A / 1e4, 4) + " m²"], ["Basınç P = G / A", nf(P, 0) + " Pa"], ["Kuma gömülme", nf(sink / 5, 1) + " (göreli)"]]);
      }
    };
  }
});
defSim({
  id: "gaz",
  subject: "Fizik",
  title: "Gaz basıncı",
  topics: ["fizik--gaz-basinci", "fizik--basinc-olcen-aletler-ve-akiskanlarin-basinci"],
  icon: I.book,
  blurb: "Tanecikler çarptıkça basınç oluşur; hacim ve sıcaklığı değiştir.",
  lead: "Kaptaki gaz tanecikleri duvarlara çarptıkça basınç oluşur. Pistonu it, gazı ısıt, tanecik ekle; basınç göstergesini izle.",
  tries: ["Hacmi yarıya indir: çarpışmalar ve basınç ne oldu? (Boyle)", "Sıcaklığı iki katına çıkar: tanecikler hızlanıyor mu?", "Tanecik sayısını artır: basınç neden artıyor?"],
  note: "Gaz basıncı tanecik sayısı ve sıcaklıkla doğru, hacimle ters orantılıdır: <b>P · V = n · R · T</b>. Sabit sıcaklıkta <b>P₁V₁ = P₂V₂</b>.",
  aspect: 0.62,
  init(S) {
    S.slider("V", "Hacim", 10, 40, 1, 25, (x) => nf(x, 0) + " L");
    S.slider("T", "Sıcaklık", 100, 600, 10, 300, (x) => nf(x, 0) + " K");
    S.slider("n", "Gaz miktarı", 0.5, 3, 0.25, 1, (x) => nf(x, 2) + " mol");
    const ps = [], X0 = 70, Y0 = 90, H = 440;
    for (let i = 0; i < 90; i++) ps.push({ x: X0 + 20 + Math.random() * 300, y: Y0 + 20 + Math.random() * (H - 40), a: Math.random() * Math.PI * 2 });
    const flashes = [];
    let shownP = 1;
    return {
      draw(dt, t) {
        const c = S.c, g = S.g, V = S.vals.V, T = S.vals.T, n = S.vals.n;
        const W = 160 + V * 15, xr = X0 + W, count = Math.round(n * 30), sp = 230 * Math.sqrt(T / 300);
        g.fillStyle = c.bg2;
        g.fillRect(X0, Y0, W, H);
        g.strokeStyle = c.ink2;
        g.lineWidth = 6;
        g.beginPath();
        g.moveTo(xr + 30, Y0);
        g.lineTo(X0, Y0);
        g.lineTo(X0, Y0 + H);
        g.lineTo(xr + 30, Y0 + H);
        g.stroke();
        g.fillStyle = c.brand;
        g.fillRect(xr, Y0 + 4, 18, H - 8);
        g.fillRect(xr + 18, Y0 + H / 2 - 10, 120, 20);
        for (let i = 0; i < count; i++) {
          const p = ps[i];
          p.x += Math.cos(p.a) * sp * dt;
          p.y += Math.sin(p.a) * sp * dt;
          if (p.x < X0 + 10) {
            p.x = X0 + 10;
            p.a = Math.PI - p.a;
            flashes.push({ x: X0, y: p.y, t: 0 });
          }
          if (p.x > xr - 10) {
            p.x = xr - 10;
            p.a = Math.PI - p.a;
            flashes.push({ x: xr, y: p.y, t: 0 });
          }
          if (p.y < Y0 + 10) {
            p.y = Y0 + 10;
            p.a = -p.a;
            flashes.push({ x: p.x, y: Y0, t: 0 });
          }
          if (p.y > Y0 + H - 10) {
            p.y = Y0 + H - 10;
            p.a = -p.a;
            flashes.push({ x: p.x, y: Y0 + H, t: 0 });
          }
          S.circle(p.x, p.y, 9, S.tempColor((T - 100) / 500));
        }
        for (let i = flashes.length - 1; i >= 0; i--) {
          const f = flashes[i];
          f.t += dt;
          if (f.t > 0.25) {
            flashes.splice(i, 1);
            continue;
          }
          g.globalAlpha = 1 - f.t / 0.25;
          S.circle(f.x, f.y, 14, null, c.warn, 3);
          g.globalAlpha = 1;
        }
        if (flashes.length > 200) flashes.splice(0, flashes.length - 200);
        const P = n * 0.082 * T / V;
        shownP = lerp(shownP, P, 1 - Math.pow(0.05, dt));
        const gx = 850, gy = 250, r = 100, ang = Math.PI * (1 + clamp(shownP / 15, 0, 1));
        g.lineWidth = 16;
        g.strokeStyle = c.bg2;
        g.beginPath();
        g.arc(gx, gy, r, Math.PI, 2 * Math.PI);
        g.stroke();
        g.strokeStyle = S.tempColor(shownP / 15);
        g.beginPath();
        g.arc(gx, gy, r, Math.PI, ang);
        g.stroke();
        S.line(gx, gy, gx + Math.cos(ang) * (r - 20), gy + Math.sin(ang) * (r - 20), c.ink, 5);
        S.circle(gx, gy, 8, c.ink);
        S.text(nf(shownP, 2) + " atm", gx, gy + 50, { size: 34, align: "center", weight: 900 });
        S.text("Basınç", gx, gy - r - 24, { size: 26, align: "center", color: c.ink2 });
        S.kv([["Basınç P = nRT / V", nf(P, 2) + " atm"], ["Hacim", nf(V, 0) + " L"], ["Sıcaklık", nf(T, 0) + " K (" + nf(T - 273, 0) + " °C)"], ["Gaz miktarı", nf(n, 2) + " mol"]]);
      }
    };
  }
});
defSim({
  id: "enerji",
  subject: "Fizik",
  title: "Enerjinin korunumu",
  topics: ["fizik--is-guc-ve-enerji"],
  icon: I.book,
  blurb: "Potansiyel enerji kinetiğe dönüşür; sürtünme ısıya çevirir.",
  lead: "Topu rampadan bırak. Yükseklik azaldıkça potansiyel enerji kinetik enerjiye dönüşür; sürtünme varsa bir kısmı ısıya gider.",
  tries: ["Sürtünmeyi sıfır yap: top diğer tarafta aynı yüksekliğe çıkar mı?", "Sürtünmeyi aç: toplam enerji nereye gidiyor?", "Kütleyi iki katına çıkar: en alttaki hız değişir mi?"],
  note: "Sürtünmesiz ortamda <b>E<sub>p</sub> + E<sub>k</sub></b> sabittir. <b>E<sub>p</sub> = m·g·h</b>, <b>E<sub>k</sub> = ½·m·v²</b>. Sürtünmenin yaptığı iş ısıya dönüşür.",
  aspect: 0.62,
  init(S) {
    S.slider("h", "Bırakma yüksekliği", 20, 100, 5, 90, (x2) => nf(x2, 0) + "%");
    S.slider("mu", "Sürtünme", 0, 0.3, 0.01, 0, (x2) => nf(x2, 2));
    S.slider("m", "Kütle", 1, 5, 0.5, 2, (x2) => nf(x2, 1) + " kg");
    const CX = 470, HW = 400, BASE = 520, DEPTH = 380, PPM = 190;
    const yAt = (x2) => BASE - DEPTH * Math.pow((x2 - CX) / HW, 2), dyAt = (x2) => -2 * DEPTH * (x2 - CX) / (HW * HW);
    let x = 0, vs = 0, Q = 0, E0 = 0, run = false;
    const reset = () => {
      const h = S.vals.h / 100;
      x = CX - HW * Math.sqrt(h);
      vs = 0;
      Q = 0;
      E0 = S.vals.m * 10 * (BASE - yAt(x)) / PPM;
      run = true;
    };
    S.button("Bırak", reset, true);
    S.changed = (id) => {
      if (id === "h" || id === "m") reset();
    };
    reset();
    return {
      draw(dt) {
        const c = S.c, g = S.g, m = S.vals.m, mu = S.vals.mu;
        g.strokeStyle = c.ink2;
        g.lineWidth = 8;
        g.beginPath();
        for (let xx = CX - HW; xx <= CX + HW; xx += 8) xx === CX - HW ? g.moveTo(xx, yAt(xx)) : g.lineTo(xx, yAt(xx));
        g.stroke();
        S.line(CX - HW - 20, BASE + 6, CX + HW + 20, BASE + 6, c.line, 3);
        if (run) {
          const steps = 8, h = dt * 0.55 / steps;
          for (let i = 0; i < steps; i++) {
            const d2 = dyAt(x), k = Math.sqrt(1 + d2 * d2);
            let a = 2e3 * d2 / k;
            if (Math.abs(vs) > 1) a -= Math.sign(vs) * mu * 2e3 / k;
            else if (Math.abs(a) < mu * 2e3 / k) {
              a = 0;
              vs = 0;
            }
            const vOld = vs;
            vs += a * h;
            const ds = (vOld + vs) / 2 * h;
            x += ds / k;
            Q += mu * m * 10 / k * Math.abs(ds) / PPM;
            if (x < CX - HW) {
              x = CX - HW;
              vs = Math.abs(vs) * 0;
            }
            if (x > CX + HW) {
              x = CX + HW;
              vs = 0;
            }
          }
        }
        const y = yAt(x), Hm = (BASE - y) / PPM, Ep = m * 10 * Hm, Ek = Math.max(0, E0 - Ep - Q);
        const d = dyAt(x), nx = d / Math.sqrt(1 + d * d), ny = -1 / Math.sqrt(1 + d * d);
        S.circle(x + nx * 26, y + ny * 26, 26, c.brand, "#fff", 4);
        S.line(x + nx * 26, BASE + 6, x + nx * 26, y + ny * 26 + 26, c.ink2, 2, [6, 8]);
        S.text("h = " + nf(Hm, 2) + " m", x + nx * 26 - 14, (y + BASE) / 2, { size: 24, color: c.ink2, align: "right" });
        const bars = [["Eₚ", Ep, c.cold], ["Eₖ", Ek, "#F59E0B"], ["Isı", Q, c.danger]], bx = 860, top = 90, bh = 380, mx = Math.max(E0, 0.01);
        bars.forEach(([l, v, col], i) => {
          const hh = bh * clamp(v / mx, 0, 1), xx = bx + i * 44 - 44;
          g.fillStyle = c.bg2;
          g.fillRect(xx, top, 32, bh);
          g.fillStyle = col;
          g.fillRect(xx, top + bh - hh, 32, hh);
          S.text(l, xx + 16, top + bh + 34, { size: 24, align: "center", weight: 800 });
        });
        S.text("Enerji", bx, top - 20, { size: 26, align: "center", color: c.ink2 });
        const vms = Math.sqrt(2 * Ek / m);
        S.kv([["Potansiyel E<sub>p</sub> = mgh", nf(Ep, 1) + " J"], ["Kinetik E<sub>k</sub> = ½mv²", nf(Ek, 1) + " J"], ["Isıya dönüşen", nf(Q, 1) + " J"], ["Toplam", nf(E0, 1) + " J"], ["Hız", nf(vms, 2) + " m/s"]]);
      }
    };
  }
});
const MATS = [["su", "Su", 4.18], ["al", "Alüminyum", 0.9], ["fe", "Demir", 0.45], ["cu", "Bakır", 0.39]];
defSim({
  id: "isi",
  subject: "Fizik",
  title: "Isı alışverişi",
  topics: ["fizik--isi-ve-sicaklik"],
  icon: I.book,
  blurb: "Sıcak ve soğuk cisim temas edince ortak sıcaklık kaç olur?",
  lead: "İki cismi birbirine değdir. Isı sıcaktan soğuğa akar, ikisi aynı sıcaklığa gelince durur. Kütleyi ve maddeyi değiştir.",
  tries: ["Aynı kütlede su ile bakırı temas ettir: ortak sıcaklık hangisine yakın?", "Sıcak cismin kütlesini artır: denge sıcaklığı ne olur?", "Verilen ısı alınan ısıya eşit mi?"],
  note: "Alınan ya da verilen ısı <b>Q = m · c · ΔT</b>. Isı alışverişinde verilen ısı = alınan ısı; denge sıcaklığı <b>T = (m₁c₁T₁ + m₂c₂T₂) / (m₁c₁ + m₂c₂)</b>. Öz ısısı büyük madde sıcaklığını zor değiştirir.",
  aspect: 0.62,
  init(S) {
    S.choice("ma", "Sıcak cisim", MATS.map((m) => [m[0], m[1]]), "cu");
    S.slider("mA", "Sıcak cismin kütlesi", 100, 1e3, 50, 300, (x) => nf(x, 0) + " g");
    S.slider("TA", "Sıcak cismin sıcaklığı", 40, 100, 1, 90, (x) => nf(x, 0) + " °C");
    S.choice("mb", "Soğuk cisim", MATS.map((m) => [m[0], m[1]]), "su");
    S.slider("mB", "Soğuk cismin kütlesi", 100, 1e3, 50, 300, (x) => nf(x, 0) + " g");
    S.slider("TB", "Soğuk cismin sıcaklığı", 0, 39, 1, 20, (x) => nf(x, 0) + " °C");
    let tA = 90, tB = 20, touch = false, gap = 160;
    const reset = () => {
      tA = S.vals.TA;
      tB = S.vals.TB;
      touch = false;
    };
    S.button("Temas ettir", (b) => {
      if (touch) {
        reset();
        b.textContent = "Temas ettir";
      } else {
        reset();
        touch = true;
        b.textContent = "Başa al";
      }
    }, true);
    S.changed = () => {
      if (!touch) reset();
    };
    return {
      draw(dt, t) {
        const c = S.c, g = S.g, mA = S.vals.mA, mB = S.vals.mB, cA = MATS.find((m) => m[0] === S.vals.ma)[2], cB = MATS.find((m) => m[0] === S.vals.mb)[2];
        const Teq = (mA * cA * S.vals.TA + mB * cB * S.vals.TB) / (mA * cA + mB * cB);
        gap = lerp(gap, touch ? 0 : 160, 1 - Math.pow(0.01, dt));
        if (touch && gap < 2) {
          const k = 2.2 * (tA - tB) * dt;
          tA -= k * Math.min(mA * cA, mB * cB) / (mA * cA);
          tB += k * Math.min(mA * cA, mB * cB) / (mB * cB);
        }
        const sA = 120 + 70 * Math.cbrt(mA / 1e3), sB = 120 + 70 * Math.cbrt(mB / 1e3), base = 470;
        const xA = 500 - gap / 2 - sA, xB = 500 + gap / 2;
        const block = (x, s, T, name) => {
          g.fillStyle = S.tempColor(T / 100);
          S.rr(x, base - s, s, s, 14);
          g.fill();
          for (let i = 0; i < 10; i++) {
            const j = T / 100 * 7;
            S.circle(x + s * (0.2 + 0.6 * (i * 37 % 10) / 10) + Math.sin(t * 20 + i) * j, base - s * (0.2 + 0.6 * (i * 61 % 10) / 10) + Math.cos(t * 23 + i * 2) * j, 7, "rgba(255,255,255,.55)");
          }
          S.text(name, x + s / 2, base - s - 16, { size: 26, align: "center", weight: 800 });
          S.text(nf(T, 1) + " °C", x + s / 2, base + 46, { size: 32, align: "center", weight: 900 });
        };
        block(xA, sA, tA, MATS.find((m) => m[0] === S.vals.ma)[1]);
        block(xB, sB, tB, MATS.find((m) => m[0] === S.vals.mb)[1]);
        if (touch && Math.abs(tA - tB) > 0.3) {
          const ph = t * 1.5 % 1;
          S.arrow(500 - 60, base - 60, 500 + 60, base - 60, "#F59E0B", 8, "");
          S.circle(500 - 50 + 100 * ph, base - 60, 8, "#fff");
        }
        S.line(60, base, 940, base, c.line, 4);
        const Q = mA * cA * (S.vals.TA - tA);
        S.kv([["Denge sıcaklığı", nf(Teq, 1) + " °C"], ["Şimdi", nf(tA, 1) + " °C ve " + nf(tB, 1) + " °C"], ["Sıcak cismin verdiği ısı", nf(Q, 0) + " J"], ["Soğuk cismin aldığı ısı", nf(mB * cB * (tB - S.vals.TB), 0) + " J"], ["Öz ısılar", "c = " + nf(cA, 2) + " ve " + nf(cB, 2) + " J/g·°C"]]);
      }
    };
  }
});
const DMATS = [["tahta", "Tahta", 0.7, "#C08A52"], ["buz", "Buz", 0.92, "#A9D8F5"], ["al", "Alüminyum", 2.7, "#B8BEC9"], ["fe", "Demir", 7.9, "#6E7480"], ["au", "Altın", 19.3, "#E6B422"]];
defSim({
  id: "yogunluk",
  subject: "Fizik",
  title: "Kütle, hacim ve yoğunluk",
  topics: ["fizik--madde-ve-ozellikleri"],
  icon: I.book,
  blurb: "Aynı hacimde farklı maddeler, farklı kütle.",
  lead: "Maddeyi ve hacmi seç, teraziyi oku. Kütle-hacim grafiğinde her maddenin doğrusu farklı eğimde; eğim yoğunluktur.",
  tries: ["Hacmi iki katına çıkar: yoğunluk değişti mi?", "Aynı hacimde demir ile alüminyumu karşılaştır.", "Grafikte en dik doğru hangi maddenin?"],
  note: "Yoğunluk <b>d = m / V</b> maddeyi ayırt eden bir özelliktir; maddenin miktarına bağlı değildir. Kütle-hacim grafiğinin eğimi yoğunluğu verir.",
  aspect: 0.62,
  init(S) {
    S.choice("mat", "Madde", DMATS.map((m) => [m[0], m[1]]), "al");
    S.slider("V", "Hacim", 10, 100, 5, 40, (x) => nf(x, 0) + " cm³");
    let shown = 0;
    return {
      draw(dt) {
        const c = S.c, g = S.g, M = DMATS.find((m) => m[0] === S.vals.mat), V = S.vals.V, mass = M[2] * V;
        shown = lerp(shown, mass, 1 - Math.pow(0.02, dt));
        const s = 40 + 4.5 * Math.cbrt(V) * 8, bx = 250, by = 460;
        g.fillStyle = c.bg2;
        S.rr(bx - 170, by, 340, 60, 14);
        g.fill();
        g.fillStyle = "#1A1530";
        S.rr(bx - 120, by + 70, 240, 70, 12);
        g.fill();
        S.text(nf(shown, 1) + " g", bx, by + 118, { size: 40, color: "#7CFFB2", align: "center", weight: 900 });
        g.fillStyle = M[3];
        S.rr(bx - s / 2, by - s, s, s, 10);
        g.fill();
        S.text(M[1], bx, by - s - 18, { size: 28, align: "center", weight: 800 });
        const gx = 520, gy = 470, gw = 330, gh = 380, mMax = 2e3;
        S.line(gx, gy, gx + gw, gy, c.ink2, 3);
        S.line(gx, gy, gx, gy - gh, c.ink2, 3);
        S.text("V (cm³)", gx + gw, gy + 36, { size: 22, align: "right", color: c.ink2 });
        S.text("m (g)", gx - 8, gy - gh - 12, { size: 22, color: c.ink2 });
        DMATS.forEach((D) => {
          const xEnd = Math.min(100, mMax / D[2]), on = D[0] === M[0];
          S.line(gx, gy, gx + gw * xEnd / 100, gy - gh * (D[2] * xEnd) / mMax, D[3], on ? 6 : 3);
          S.text(D[1], gx + gw * xEnd / 100 + 4, gy - gh * (D[2] * xEnd) / mMax, { size: 20, color: D[3], base: "middle", weight: on ? 900 : 600 });
        });
        if (mass <= mMax) S.circle(gx + gw * V / 100, gy - gh * mass / mMax, 11, M[3], "#fff", 3);
        S.kv([["Kütle m", nf(mass, 1) + " g"], ["Hacim V", nf(V, 0) + " cm³"], ["Yoğunluk d = m / V", nf(M[2], 2) + " g/cm³"]]);
      }
    };
  }
});
