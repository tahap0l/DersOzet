/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0. Eski tarayıcılar için çevrilmiş kopya; kaynak app/js, üreten tools/build-legacy.sh */
"use strict";
defSim({
  id: "haller",
  subject: "Kimya",
  title: "Maddenin halleri",
  topics: ["kimya--maddenin-halleri", "kimya--katilar", "fizik--isi-ve-sicaklik"],
  icon: I.book,
  blurb: "Isıtınca tanecikler ne yapar? Hal değişirken sıcaklık neden sabit?",
  lead: "Suyun sıcaklığını değiştir. Katıda tanecikler yerinde titreşir, sıvıda birbirinin üstünden kayar, gazda serbestçe dağılır.",
  tries: ["0 °C'nin altına in: tanecikler düzenli dizildi mi?", "100 °C'yi geç: tanecikler arası uzaklık ne oldu?", "Isınma eğrisinde düz kısımlar neyi gösteriyor?"],
  note: "Hal değişimi sırasında verilen ısı tanecikler arası çekimi yenmeye harcanır, bu yüzden <b>sıcaklık sabit kalır</b> (erime ve kaynama noktası). Saf suda 1 atm'de erime 0 °C, kaynama 100 °C'dir.",
  aspect: 0.62,
  init(S) {
    S.slider("T", "Sıcaklık", -40, 140, 1, 20, (x) => nf(x, 0) + " °C");
    const N = 42, X0 = 60, Y0 = 80, W = 420, H = 420, ps = [];
    for (let i = 0; i < N; i++) {
      const col = i % 7, row = Math.floor(i / 7);
      ps.push({ hx: X0 + 70 + col * 47, hy: Y0 + H - 40 - row * 47, x: X0 + 70 + col * 47, y: Y0 + H - 40 - row * 47, vx: (Math.random() - 0.5) * 100, vy: (Math.random() - 0.5) * 100 });
    }
    return {
      draw(dt, t) {
        const c = S.c, g = S.g, T = S.vals.T, st = T < 0 ? "Katı" : T < 100 ? "Sıvı" : "Gaz";
        g.fillStyle = c.bg2;
        S.rr(X0, Y0, W, H, 16);
        g.fill();
        const sp = 60 + (T + 40) * 3.2;
        ps.forEach((p, i) => {
          if (st === "Katı") {
            const j = 2 + (T + 40) * 0.12;
            p.x = lerp(p.x, p.hx + Math.sin(t * 30 + i) * j, 1 - Math.pow(1e-3, dt));
            p.y = lerp(p.y, p.hy + Math.cos(t * 27 + i * 3) * j, 1 - Math.pow(1e-3, dt));
          } else {
            p.vx += (Math.random() - 0.5) * 900 * dt;
            p.vy += (Math.random() - 0.5) * 900 * dt;
            if (st === "Sıvı") p.vy += 500 * dt;
            const v = Math.hypot(p.vx, p.vy) || 1;
            p.vx = p.vx / v * sp;
            p.vy = p.vy / v * sp;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            const top = st === "Sıvı" ? Y0 + H - 6 * 47 - 20 : Y0 + 16;
            if (p.x < X0 + 16) {
              p.x = X0 + 16;
              p.vx *= -1;
            }
            if (p.x > X0 + W - 16) {
              p.x = X0 + W - 16;
              p.vx *= -1;
            }
            if (p.y < top) {
              p.y = top;
              p.vy = Math.abs(p.vy);
            }
            if (p.y > Y0 + H - 16) {
              p.y = Y0 + H - 16;
              p.vy = -Math.abs(p.vy);
            }
          }
        });
        if (st === "Sıvı") for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
          const a = ps[i], b = ps[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
          if (d < 36 && d > 0) {
            const k = (36 - d) / 2 / d;
            a.x -= dx * k;
            a.y -= dy * k;
            b.x += dx * k;
            b.y += dy * k;
          }
        }
        if (st !== "Katı") ps.forEach((p) => {
          p.x = clamp(p.x, X0 + 16, X0 + W - 16);
          p.y = clamp(p.y, Y0 + 16, Y0 + H - 16);
        });
        ps.forEach((p) => S.circle(p.x, p.y, 16, S.tempColor((T + 40) / 180), "rgba(255,255,255,.6)", 2));
        S.text(st, X0 + W / 2, Y0 - 20, { size: 34, align: "center", weight: 900 });
        const gx = 540, gy = 480, gw = 400, gh = 380, ty = (v) => gy - gh * (v + 40) / 180;
        const pts = [[0, -40], [0.18, 0], [0.38, 0], [0.62, 100], [0.86, 100], [1, 140]];
        S.line(gx, gy, gx + gw, gy, c.ink2, 3);
        S.line(gx, gy, gx, gy - gh, c.ink2, 3);
        g.strokeStyle = c.brand;
        g.lineWidth = 5;
        g.beginPath();
        pts.forEach(([u2, v], i) => i ? g.lineTo(gx + gw * u2, ty(v)) : g.moveTo(gx + gw * u2, ty(v)));
        g.stroke();
        [[0, "erime 0 °C"], [100, "kaynama 100 °C"]].forEach(([v, l]) => {
          S.line(gx, ty(v), gx + gw, ty(v), c.line, 2, [6, 8]);
          S.text(l, gx + 8, ty(v) - 10, { size: 20, color: c.ink2 });
        });
        const u = T < 0 ? 0.18 * (T + 40) / 40 : T < 100 ? 0.38 + 0.24 * T / 100 : 0.86 + 0.14 * (T - 100) / 40;
        S.circle(gx + gw * u, ty(T), 12, c.danger, "#fff", 3);
        S.text("Verilen ısı →", gx + gw, gy + 34, { size: 22, align: "right", color: c.ink2 });
        S.text("T", gx - 10, gy - gh - 10, { size: 22, color: c.ink2 });
        S.kv([["Hal", st], ["Tanecik hareketi", st === "Katı" ? "Yerinde titreşim" : st === "Sıvı" ? "Öteleme, birbirinin üstünden kayma" : "Serbest, hızlı öteleme"], ["Tanecikler arası boşluk", st === "Gaz" ? "Çok fazla" : st === "Sıvı" ? "Az" : "Çok az"], ["Belirli şekli", st === "Katı" ? "Var" : "Yok"], ["Belirli hacmi", st === "Gaz" ? "Yok" : "Var"]]);
      }
    };
  }
});
const IONIC = {
  nacl: { name: "NaCl", m: ["Na", [2, 8, 1]], n: [["Cl", [2, 8, 7]]], give: 1, out: "Na⁺ + Cl⁻ → NaCl" },
  mgo: { name: "MgO", m: ["Mg", [2, 8, 2]], n: [["O", [2, 6]]], give: 2, out: "Mg²⁺ + O²⁻ → MgO" },
  lif: { name: "LiF", m: ["Li", [2, 1]], n: [["F", [2, 7]]], give: 1, out: "Li⁺ + F⁻ → LiF" },
  mgcl2: { name: "MgCl₂", m: ["Mg", [2, 8, 2]], n: [["Cl", [2, 8, 7]], ["Cl", [2, 8, 7]]], give: 1, out: "Mg²⁺ + 2Cl⁻ → MgCl₂" }
};
defSim({
  id: "iyonik",
  subject: "Kimya",
  title: "İyonik bağ",
  topics: ["kimya--iyonik-bagli-bilesikler", "kimya--guclu-etkilesimler", "kimya--inorganik-bilesikler"],
  icon: I.book,
  blurb: "Metal elektron verir, ametal alır; zıt yüklü iyonlar çekişir.",
  lead: "Metal atomu son katmanındaki elektronları ametale verir. İki taraf da soy gaz düzenine ulaşır; oluşan zıt yüklü iyonlar birbirini çeker.",
  tries: ["MgO'da magnezyum kaç elektron veriyor?", "MgCl₂'de neden iki klor var?", "İyonların son katmanında kaç elektron kaldı?"],
  note: "İyonik bağ, metal ile ametal arasında <b>elektron alışverişiyle</b> oluşan iyonların elektrostatik çekimidir. Metal katyon (+), ametal anyon (−) olur; ikisi de oktede ulaşır.",
  aspect: 0.6,
  init(S) {
    S.choice("p", "Bileşik", Object.entries(IONIC).map(([k, v]) => [k, v.name]), "nacl");
    let t0 = 0;
    S.button("Tekrar oynat", () => {
      t0 = S.t;
    }, true);
    S.changed = () => {
      t0 = S.t;
    };
    const atom = (x, y, sym, shells, color, charge, alpha) => {
      const c = S.c, g = S.g;
      shells.forEach((n, i) => {
        const r = 38 + i * 34;
        S.circle(x, y, r, null, c.line, 2);
        for (let k = 0; k < n; k++) {
          const a = S.t * (0.6 - i * 0.12) + k * Math.PI * 2 / n + i;
          S.circle(x + Math.cos(a) * r, y + Math.sin(a) * r, 9, i === shells.length - 1 ? "#F59E0B" : c.ink2);
        }
      });
      S.circle(x, y, 30, color);
      S.text(sym, x, y + 1, { size: 30, color: "#fff", align: "center", base: "middle", weight: 900 });
      if (charge) {
        g.globalAlpha = alpha;
        S.text(charge, x + 30, y - 40 - shells.length * 34, { size: 36, color: charge.includes("+") ? S.c.danger : S.c.cold, weight: 900, align: "center" });
        g.globalAlpha = 1;
      }
    };
    return {
      draw(dt) {
        const c = S.c, g = S.g, P = IONIC[S.vals.p], tt = S.t - t0, two = P.n.length === 2;
        const move = clamp((tt - 1) / 2, 0, 1), done = tt > 3.1, close = clamp((tt - 3.4) / 1.2, 0, 1);
        const mx = 500, my = 300, off = lerp(300, 205, close);
        const nPos = two ? [[mx - off, my], [mx + off, my]] : [[mx + off, my]];
        const mxx = two ? mx : mx - off;
        const total = P.give * P.n.length;
        const mShells = P.m[1].slice();
        if (done) mShells.pop();
        else if (move > 0) mShells[mShells.length - 1] = Math.max(0, mShells[mShells.length - 1] - Math.floor(move * total + 1e-3));
        atom(mxx, my, P.m[0], mShells.filter((n, i) => n > 0 || i < mShells.length - 1), "#7C5CE6", done ? "+".repeat(1) + (total > 1 ? total : "") : "", close);
        P.n.forEach(([sym, sh], j) => {
          const s2 = sh.slice();
          if (done) s2[s2.length - 1] += P.give;
          atom(nPos[j][0], nPos[j][1], sym, s2, "#1E9E5A", done ? (P.give > 1 ? P.give : "") + "−" : "", close);
        });
        if (move > 0 && move < 1) for (let e = 0; e < total; e++) {
          const j = two ? e % 2 : 0, sx = mxx + (j === 0 && two ? -1 : 1) * (38 + 34 * (P.m[1].length - 1)), ex = nPos[j][0] + (nPos[j][0] < mxx ? 1 : -1) * (38 + 34 * (P.n[j][1].length - 1));
          const u = clamp(move * 1.15 - e * 0.12, 0, 1);
          S.circle(lerp(sx, ex, u), my - Math.sin(u * Math.PI) * 120, 12, "#F59E0B", "#fff", 3);
        }
        if (close > 0) {
          g.globalAlpha = close;
          nPos.forEach((p) => S.line(mxx, my + 150, p[0], my + 150, c.brand, 4, [10, 10]));
          S.text("Elektrostatik çekim", mx, my + 190, { size: 26, align: "center", color: c.brand, weight: 800 });
          g.globalAlpha = 1;
        }
        S.text(tt < 1 ? "Atomlar" : !done ? "Elektron aktarımı" : P.out, mx, 70, { size: 36, align: "center", weight: 900 });
        S.kv([["Metal", P.m[0] + " (" + P.m[1].join("-") + ") → " + P.give * P.n.length + " e⁻ verir"], ["Ametal", P.n[0][0] + " (" + P.n[0][1].join("-") + ") → " + P.give + " e⁻ alır"], ["Sonuç", P.out]]);
      }
    };
  }
});
const MOLS = {
  h2: { name: "H₂", atoms: [["H", -0.37, 0, 0], ["H", 0.37, 0, 0]], bonds: [[0, 1, 1]], lp: [], shape: "Doğrusal", angle: "180°", bond: "Apolar kovalent", pol: false },
  cl2: { name: "Cl₂", atoms: [["Cl", -1, 0, 0], ["Cl", 1, 0, 0]], bonds: [[0, 1, 1]], lp: [], shape: "Doğrusal", angle: "180°", bond: "Apolar kovalent", pol: false },
  hcl: { name: "HCl", atoms: [["H", -0.8, 0, 0], ["Cl", 0.55, 0, 0]], bonds: [[0, 1, 1]], lp: [], shape: "Doğrusal", angle: "180°", bond: "Polar kovalent", pol: true, dip: [1, 0, 0] },
  h2o: { name: "H₂O", atoms: [["O", 0, -0.12, 0], ["H", -0.76, 0.48, 0], ["H", 0.76, 0.48, 0]], bonds: [[0, 1, 1], [0, 2, 1]], lp: [[0, [0, -0.7, 0.55]], [0, [0, -0.7, -0.55]]], shape: "Kırık doğru (açısal)", angle: "104,5°", bond: "Polar kovalent", pol: true, dip: [0, -1, 0] },
  nh3: { name: "NH₃", atoms: [["N", 0, -0.15, 0], ["H", 0.94, 0.3, 0], ["H", -0.47, 0.3, 0.81], ["H", -0.47, 0.3, -0.81]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]], lp: [[0, [0, -1, 0]]], shape: "Üçgen piramit", angle: "107°", bond: "Polar kovalent", pol: true, dip: [0, -1, 0] },
  ch4: { name: "CH₄", atoms: [["C", 0, 0, 0], ["H", 0.63, 0.63, 0.63], ["H", 0.63, -0.63, -0.63], ["H", -0.63, 0.63, -0.63], ["H", -0.63, -0.63, 0.63]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]], lp: [], shape: "Düzgün dörtyüzlü", angle: "109,5°", bond: "Polar kovalent", pol: false },
  co2: { name: "CO₂", atoms: [["O", -1.16, 0, 0], ["C", 0, 0, 0], ["O", 1.16, 0, 0]], bonds: [[0, 1, 2], [1, 2, 2]], lp: [], shape: "Doğrusal", angle: "180°", bond: "Polar kovalent", pol: false }
};
const ACOL = { H: ["#E8E8EE", 26, 2.2], O: ["#E5484D", 40, 3.44], N: ["#3B82F6", 40, 3.04], C: ["#3F3F46", 40, 2.55], Cl: ["#22C55E", 48, 3.16] };
defSim({
  id: "kovalent",
  subject: "Kimya",
  title: "Kovalent bağ ve molekül şekli",
  topics: ["kimya--kovalent-bag", "kimya--guclu-etkilesimler", "kimya--guclu-ve-zayif-etkilesimler"],
  icon: I.book,
  blurb: "Ortak elektron, bağ açısı, polar ve apolar molekül.",
  lead: "Molekülü seç ve döndür. Ortaklanmamış elektron çiftleri bağları iter; şekil buna göre oluşur. Polar moleküllerde yük dağılımı simetrik değildir.",
  tries: ["CO₂'nin bağları polar, molekülü neden apolar?", "H₂O ile CO₂'nin şekillerini karşılaştır.", "CH₄, NH₃ ve H₂O'da bağ açısı neden küçülüyor?"],
  note: "Kovalent bağ ametal atomları arasında <b>elektronların ortaklaşa kullanılmasıyla</b> oluşur. Aynı atomlar arasında apolar, farklı atomlar arasında polar bağ oluşur. Molekül simetrikse bağlar polar olsa da molekül apolardır.",
  aspect: 0.66,
  init(S) {
    S.choice("m", "Molekül", Object.entries(MOLS).map(([k, v]) => [k, v.name]), "h2o");
    S.toggle("lp", "Ortaklanmamış elektron çiftlerini göster", true);
    S.toggle("rot", "Kendi kendine dönsün", true);
    let ang = 0.6, drag = null;
    return {
      down(x) {
        drag = x;
        return true;
      },
      move(x) {
        if (drag != null) {
          ang += (x - drag) * 0.01;
          drag = x;
        }
      },
      up() {
        drag = null;
      },
      draw(dt) {
        const c = S.c, g = S.g, M = MOLS[S.vals.m];
        if (S.vals.rot && drag == null) ang += dt * 0.7;
        const narrow = S.ts > 1.2, cx = narrow ? 500 : 360, cy = 340, sc = 170, tilt = 0.35;
        const P = ([x, y, z]) => {
          const X = x * Math.cos(ang) + z * Math.sin(ang), Z = -x * Math.sin(ang) + z * Math.cos(ang);
          const Y = y * Math.cos(tilt) - Z * Math.sin(tilt), Z2 = y * Math.sin(tilt) + Z * Math.cos(tilt);
          const f = 4 / (4 + Z2);
          return [cx + X * sc * f, cy + Y * sc * f, Z2, f];
        };
        const pts = M.atoms.map((a) => P([a[1], a[2], a[3]]));
        const items = [];
        M.bonds.forEach(([i, j, o]) => items.push({ z: (pts[i][2] + pts[j][2]) / 2 + 0.01, f() {
          const a = pts[i], b = pts[j];
          const nx = -(b[1] - a[1]), ny = b[0] - a[0], l = Math.hypot(nx, ny) || 1;
          for (let k = 0; k < o; k++) {
            const off = (k - (o - 1) / 2) * 16;
            S.line(a[0] + nx / l * off, a[1] + ny / l * off, b[0] + nx / l * off, b[1] + ny / l * off, c.ink2, 9);
          }
        } }));
        if (S.vals.lp) M.lp.forEach(([i, d]) => {
          const base = M.atoms[i];
          const p = P([base[1] + d[0] * 0.9, base[2] + d[1] * 0.9, base[3] + d[2] * 0.9]);
          items.push({ z: p[2], f() {
            g.save();
            g.globalAlpha = 0.55;
            S.circle(p[0], p[1], 22 * p[3], "#F59E0B");
            g.restore();
            S.circle(p[0] - 8, p[1], 6, "#7A4A00");
            S.circle(p[0] + 8, p[1], 6, "#7A4A00");
          } });
        });
        M.atoms.forEach((a, i) => items.push({ z: pts[i][2], f() {
          const [col, r] = ACOL[a[0]];
          const p = pts[i], rr = r * p[3];
          const gr = g.createRadialGradient(p[0] - rr * 0.35, p[1] - rr * 0.35, rr * 0.1, p[0], p[1], rr);
          gr.addColorStop(0, "#fff");
          gr.addColorStop(0.25, col);
          gr.addColorStop(1, col);
          S.circle(p[0], p[1], rr, gr, "rgba(0,0,0,.25)", 2);
          S.text(a[0], p[0], p[1] + 2, { size: 26 * p[3], color: a[0] === "H" ? "#333" : "#fff", align: "center", base: "middle", weight: 900 });
        } }));
        items.sort((a, b) => b.z - a.z).forEach((it) => it.f());
        if (M.pol && M.dip) {
          const a = P([0, 0, 0]), b = P(M.dip.map((v) => v * 1.6));
          S.arrow(a[0], a[1], b[0], b[1], c.danger, 5, "δ−", { dx: 12, size: 26 });
        }
        if (narrow) {
          S.text(M.name, 40, 80, { size: 48, weight: 900 });
          S.text(M.shape + ", " + M.angle, 40, 130, { size: 24, color: c.ink2 });
        } else {
          S.text(M.name, 760, 120, { size: 56, align: "center", weight: 900 });
          [["Şekil", M.shape], ["Bağ açısı", M.angle], ["Bağ", M.bond], ["Molekül", M.pol ? "Polar" : "Apolar"]].forEach(([k, v], i) => {
            S.text(k, 640, 200 + i * 70, { size: 22, color: c.ink2 });
            S.text(v, 640, 230 + i * 70, { size: 28, weight: 800 });
          });
        }
        if (!drag && S.t < 5) S.text("Sürükleyerek döndür", cx, 620, { size: 24, color: c.ink2, align: "center" });
        const en = Array.from(new Set(M.atoms.map((a) => a[0]))).map((s) => s + ": " + nf(ACOL[s][2], 2)).join(", ");
        S.kv([["Şekil", M.shape], ["Bağ açısı", M.angle], ["Bağ türü", M.bond], ["Molekül", M.pol ? "Polar" : "Apolar"], ["Elektronegatiflik", en]]);
      }
    };
  }
});
const ELS = [
  [1, "H", "Hidrojen", 1, 1, "ametal", 2.2, 53, 1312],
  [2, "He", "Helyum", 1, 18, "soygaz", 0, 31, 2372],
  [3, "Li", "Lityum", 2, 1, "metal", 0.98, 167, 520],
  [4, "Be", "Berilyum", 2, 2, "metal", 1.57, 112, 900],
  [5, "B", "Bor", 2, 13, "yarımetal", 2.04, 87, 801],
  [6, "C", "Karbon", 2, 14, "ametal", 2.55, 67, 1086],
  [7, "N", "Azot", 2, 15, "ametal", 3.04, 56, 1402],
  [8, "O", "Oksijen", 2, 16, "ametal", 3.44, 48, 1314],
  [9, "F", "Flor", 2, 17, "ametal", 3.98, 42, 1681],
  [10, "Ne", "Neon", 2, 18, "soygaz", 0, 38, 2081],
  [11, "Na", "Sodyum", 3, 1, "metal", 0.93, 190, 496],
  [12, "Mg", "Magnezyum", 3, 2, "metal", 1.31, 145, 738],
  [13, "Al", "Alüminyum", 3, 13, "metal", 1.61, 118, 578],
  [14, "Si", "Silisyum", 3, 14, "yarımetal", 1.9, 111, 787],
  [15, "P", "Fosfor", 3, 15, "ametal", 2.19, 98, 1012],
  [16, "S", "Kükürt", 3, 16, "ametal", 2.58, 88, 1e3],
  [17, "Cl", "Klor", 3, 17, "ametal", 3.16, 79, 1251],
  [18, "Ar", "Argon", 3, 18, "soygaz", 0, 71, 1521],
  [19, "K", "Potasyum", 4, 1, "metal", 0.82, 243, 419],
  [20, "Ca", "Kalsiyum", 4, 2, "metal", 1, 194, 590]
];
const GCOL = { 1: 0, 2: 1, 13: 2, 14: 3, 15: 4, 16: 5, 17: 6, 18: 7 };
const GNAME = { 1: "1A Alkali metal", 2: "2A Toprak alkali", 13: "3A Toprak metali", 14: "4A Karbon grubu", 15: "5A Azot grubu", 16: "6A Kalkojen", 17: "7A Halojen", 18: "8A Soy gaz" };
const shellsOf = (z) => {
  const out = [];
  let r = z;
  [2, 8, 8, 2].forEach((n) => {
    if (r > 0) {
      out.push(Math.min(n, r));
      r -= n;
    }
  });
  return out;
};
defSim({
  id: "periyodik",
  subject: "Kimya",
  title: "Periyodik sistem",
  topics: ["kimya--periyodik-sistem", "kimya--atom-modelleri-ve-atom-yapisi"],
  icon: I.book,
  blurb: "İlk 20 element: katman dizilimi, grup, periyot ve eğilimler.",
  lead: "Bir elemente dokun: katmanlarındaki elektronları, grubunu ve periyodunu gör. Eğilimleri aç: atom yarıçapı ve iyonlaşma enerjisi tabloda nasıl değişiyor?",
  tries: ["Aynı gruptaki Li, Na, K'nın son katman elektron sayısı kaç?", "Atom yarıçapı eğilimini aç: grupta aşağı inince ne oluyor?", "İyonlaşma enerjisi en yüksek element hangisi?"],
  note: "Periyot numarası katman sayısını, A grubu numarası değerlik elektron sayısını verir. Periyotta soldan sağa atom yarıçapı <b>azalır</b>, iyonlaşma enerjisi genelde <b>artar</b>; grupta yukarıdan aşağı yarıçap <b>artar</b>, iyonlaşma enerjisi <b>azalır</b>.",
  aspect: 0.82,
  init(S) {
    S.choice("tr", "Eğilim", [["yok", "Yok"], ["r", "Atom yarıçapı"], ["ie", "İyonlaşma enerjisi"], ["en", "Elektronegatiflik"]], "yok");
    let sel = 11;
    const CW = 108, CH = 92, X0 = 68, Y0 = 50;
    const cell = (e) => [X0 + GCOL[e[4]] * CW, Y0 + (e[3] - 1) * CH];
    return {
      down(x, y) {
        const e = ELS.find((e2) => {
          const [cx, cy] = cell(e2);
          return x >= cx && x <= cx + CW - 6 && y >= cy && y <= cy + CH - 6;
        });
        if (e) {
          sel = e[0];
          return true;
        }
        return false;
      },
      draw(dt) {
        const c = S.c, g = S.g, tr = S.vals.tr;
        Object.entries(GCOL).forEach(([gr, i]) => S.text(gr <= 2 ? gr + "A" : gr - 10 + "A", X0 + i * CW + (CW - 6) / 2, Y0 - 12, { size: 20, align: "center", color: c.ink2 }));
        [1, 2, 3, 4].forEach((p) => S.text(String(p), X0 - 20, Y0 + (p - 1) * CH + CH / 2, { size: 22, align: "center", base: "middle", color: c.ink2 }));
        ELS.forEach((e2) => {
          const [x, y] = cell(e2), on = e2[0] === sel;
          let fill = e2[5] === "metal" ? "#C7B8FF" : e2[5] === "ametal" ? "#A7F3D0" : e2[5] === "soygaz" ? "#FDE68A" : "#FBCFE8";
          if (tr === "ie") fill = S.tempColor((e2[8] - 400) / 2e3);
          if (tr === "en") fill = e2[6] ? S.tempColor((e2[6] - 0.8) / 3.2) : "#ddd";
          g.fillStyle = fill;
          S.rr(x, y, CW - 6, CH - 6, 10);
          g.fill();
          if (on) {
            g.strokeStyle = c.ink;
            g.lineWidth = 5;
            S.rr(x, y, CW - 6, CH - 6, 10);
            g.stroke();
          }
          if (tr === "r") S.circle(x + (CW - 6) / 2, y + (CH - 6) / 2 + 6, e2[7] / 7, "rgba(124,92,230,.35)");
          S.text(String(e2[0]), x + 8, y + 22, { size: 18, color: "#333" });
          S.text(e2[1], x + (CW - 6) / 2, y + 58, { size: 32, align: "center", color: "#1a1530", weight: 900 });
        });
        if (tr !== "yok") {
          const lab = tr === "r" ? "Yarıçap: periyotta ←, grupta ↓ büyür" : tr === "ie" ? "İyonlaşma enerjisi: periyotta → , grupta ↑ artar" : "Elektronegatiflik: periyotta →, grupta ↑ artar";
          S.text(lab, X0, Y0 + 4 * CH + 30, { size: 24, color: c.ink2, weight: 800 });
        }
        const e = ELS.find((x) => x[0] === sel), sh = shellsOf(e[0]), bx = 220, by = 640;
        sh.forEach((n, i) => {
          const r = 40 + i * 30;
          S.circle(bx, by, r, null, c.line, 2);
          for (let k = 0; k < n; k++) {
            const a = S.t * (0.7 - i * 0.12) + k * Math.PI * 2 / n;
            S.circle(bx + Math.cos(a) * r, by + Math.sin(a) * r, 8, i === sh.length - 1 ? "#F59E0B" : c.ink2);
          }
        });
        S.circle(bx, by, 26, "#7C5CE6");
        S.text(e[1], bx, by + 1, { size: 26, align: "center", base: "middle", color: "#fff", weight: 900 });
        const ly = (k) => 540 + k * 40 * S.ts;
        S.text(e[2] + " (" + e[1] + ")", 400, ly(0), { size: 36, weight: 900 });
        S.text(e[3] + ". periyot, " + GNAME[e[4]].split(" ")[0] + " grubu", 400, ly(1), { size: 24, color: c.ink2 });
        S.text("Katmanlar: " + sh.join("-"), 400, ly(2), { size: 26, weight: 800 });
        S.text(e[5] === "metal" ? "Metal" : e[5] === "ametal" ? "Ametal" : e[5] === "soygaz" ? "Soy gaz" : "Yarı metal", 400, ly(3), { size: 26, color: c.brand, weight: 800 });
        if (S.t < 4) S.text("Bir elemente dokun", 500, Y0 + 4 * CH + 64, { size: 22, color: c.ink2, align: "center" });
        S.kv([["Element", e[2] + " (" + e[1] + ")"], ["Yeri", e[3] + ". periyot, " + GNAME[e[4]]], ["Katman dizilimi", sh.join(" - ")], ["Atom yarıçapı", e[7] + " pm"], ["1. iyonlaşma enerjisi", e[8] + " kJ/mol"], ["Elektronegatiflik", e[6] ? nf(e[6], 2) : "—"]]);
      }
    };
  }
});
const WEAK = {
  h2o: { name: "Su (H₂O)", kind: "Hidrojen bağı", bp: 100, col: "#3B82F6", w: 4, dist: 95 },
  hcl: { name: "HCl", kind: "Dipol–dipol", bp: -85, col: "#22C55E", w: 2.5, dist: 80 },
  ch4: { name: "CH₄", kind: "London kuvvetleri", bp: -161, col: "#A1A1AA", w: 1.2, dist: 62 }
};
defSim({
  id: "zayif",
  subject: "Kimya",
  title: "Zayıf etkileşimler",
  topics: ["kimya--kimyasal-turler-arasi-etkilesimler", "kimya--guclu-ve-zayif-etkilesimler"],
  icon: I.book,
  blurb: "Hidrojen bağı, dipol–dipol, London: kaynama noktasını ne belirler?",
  lead: "Moleküller arası çekim ne kadar güçlüyse moleküller birbirine o kadar tutunur ve kaynama noktası yükselir. Maddeyi değiştir, çekim çizgilerini izle.",
  tries: ["Suyun kaynama noktası neden CH₄'tan bu kadar yüksek?", "HCl'deki etkileşim neden London'dan güçlü?", "Hangi maddede moleküller daha uzaktan birbirini çekiyor?"],
  note: "Güç sırası genelde: <b>Hidrojen bağı > dipol–dipol > London</b>. Hidrojen bağı, H atomu F, O ya da N'ye bağlıyken oluşur. Etkileşim güçlendikçe kaynama noktası yükselir.",
  aspect: 0.62,
  init(S) {
    S.choice("s", "Madde", Object.entries(WEAK).map(([k, v]) => [k, v.name]), "h2o");
    const ms = [];
    for (let i = 0; i < 16; i++) ms.push({ x: 100 + Math.random() * 440, y: 100 + Math.random() * 420, vx: (Math.random() - 0.5) * 80, vy: (Math.random() - 0.5) * 80, a: Math.random() * 6 });
    return {
      draw(dt, t) {
        const c = S.c, g = S.g, W0 = WEAK[S.vals.s];
        g.fillStyle = c.bg2;
        S.rr(60, 70, 520, 480, 16);
        g.fill();
        ms.forEach((m) => {
          m.vx += (Math.random() - 0.5) * 120 * dt;
          m.vy += (Math.random() - 0.5) * 120 * dt;
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          m.a += dt * 0.8;
          if (m.x < 100 || m.x > 540) m.vx *= -1;
          if (m.y < 110 || m.y > 510) m.vy *= -1;
          m.x = clamp(m.x, 100, 540);
          m.y = clamp(m.y, 110, 510);
        });
        for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) {
          const a = ms[i], b = ms[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < W0.dist + 40) {
            g.globalAlpha = clamp(1 - (d - W0.dist * 0.6) / 80, 0.15, 1);
            S.line(a.x, a.y, b.x, b.y, W0.col, W0.w, S.vals.s === "h2o" ? [6, 6] : S.vals.s === "hcl" ? [3, 5] : [2, 8]);
            g.globalAlpha = 1;
          }
          if (d < W0.dist * 0.7 && d > 0) {
            const k = (W0.dist * 0.7 - d) / d * 0.5;
            a.x -= (b.x - a.x) * k;
            a.y -= (b.y - a.y) * k;
            b.x += (b.x - a.x) * k;
            b.y += (b.y - a.y) * k;
          } else if (d < W0.dist + 40 && d > 0) {
            const k = W0.w * 2 * dt / d;
            a.vx += (b.x - a.x) * k;
            a.vy += (b.y - a.y) * k;
            b.vx -= (b.x - a.x) * k;
            b.vy -= (b.y - a.y) * k;
          }
        }
        ms.forEach((m) => {
          const s = S.vals.s, ca = Math.cos(m.a), sa = Math.sin(m.a);
          if (s === "h2o") {
            S.circle(m.x, m.y, 20, "#E5484D");
            [[-0.9, 0.5], [0.9, 0.5]].forEach(([dx, dy]) => S.circle(m.x + (dx * ca - dy * sa) * 22, m.y + (dx * sa + dy * ca) * 22, 11, "#EDEDF2", "#999", 1.5));
          } else if (s === "hcl") {
            S.circle(m.x + ca * 10, m.y + sa * 10, 21, "#22C55E");
            S.circle(m.x - ca * 16, m.y - sa * 16, 11, "#EDEDF2", "#999", 1.5);
            S.text("δ−", m.x + ca * 34, m.y + sa * 34, { size: 16, color: c.cold, align: "center", base: "middle" });
          } else {
            S.circle(m.x, m.y, 18, "#52525B");
            for (let k = 0; k < 4; k++) {
              const q = m.a + k * Math.PI / 2;
              S.circle(m.x + Math.cos(q) * 22, m.y + Math.sin(q) * 22, 9, "#EDEDF2", "#999", 1.5);
            }
          }
        });
        const gx = 650, gy = 470, gh = 300, Tmin = -180, Tmax = 120, y0 = gy - gh * (0 - Tmin) / (Tmax - Tmin);
        S.text("Kaynama noktası", 790, 110, { size: 26, align: "center", color: c.ink2 });
        S.line(gx - 10, y0, 950, y0, c.line, 2);
        S.text("0 °C", 950, y0 - 8, { size: 18, align: "right", color: c.ink2 });
        Object.entries(WEAK).forEach(([k, v], i) => {
          const x = gx + i * 105, yv = gy - gh * (v.bp - Tmin) / (Tmax - Tmin);
          g.fillStyle = k === S.vals.s ? v.col : c.bg2;
          g.fillRect(x, Math.min(yv, y0), 70, Math.abs(y0 - yv));
          S.text(v.bp + " °C", x + 35, yv < y0 ? yv - 12 : yv + 28, { size: 22, align: "center", weight: 800 });
          S.text(v.name.split(" ")[0], x + 35, gy + 50, { size: 22, align: "center", weight: k === S.vals.s ? 900 : 600 });
        });
        S.kv([["Madde", W0.name], ["Baskın etkileşim", W0.kind], ["Kaynama noktası", W0.bp + " °C"]]);
      }
    };
  }
});
defSim({
  id: "enzim",
  subject: "Biyoloji",
  title: "Enzim çalışması",
  topics: ["biyoloji--enzimler", "biyoloji--proteinler", "biyoloji--su-asit-ve-baz"],
  icon: I.book,
  blurb: "Sıcaklık ve pH enzimin hızını nasıl değiştirir?",
  lead: "Enzimler substratı aktif bölgesine alıp ürüne çevirir. Sıcaklığı ve pH'ı değiştir: en hızlı nerede çalışıyor? Çok ısınınca ne oluyor?",
  tries: ["Sıcaklığı 37 °C'ye getir: tepkime hızı en yüksek mi?", "Sıcaklığı 65 °C'nin üstüne çıkar: enzimin şekli bozuldu mu?", "Pepsini seç ve pH'ı 2 yap: neden asitte çalışıyor?"],
  note: "Enzimler protein yapılı biyolojik katalizörlerdir; tepkimeden değişmeden çıkar ve tekrar kullanılır. Her enzimin bir <b>optimum sıcaklığı ve pH'ı</b> vardır. Yüksek sıcaklık enzimin yapısını bozar (denatürasyon), düşük sıcaklık ise sadece yavaşlatır.",
  aspect: 0.62,
  init(S) {
    S.choice("e", "Enzim", [["amilaz", "Amilaz (optimum pH 7)"], ["pepsin", "Pepsin (optimum pH 2)"]], "amilaz");
    S.slider("T", "Sıcaklık", 0, 80, 1, 37, (x) => nf(x, 0) + " °C");
    S.slider("pH", "pH", 1, 12, 0.5, 7, (x) => nf(x, 1));
    S.slider("sub", "Substrat miktarı", 4, 30, 1, 16, (x) => nf(x, 0));
    const enz = [[160, 200], [380, 380], [180, 450], [420, 170]].map(([x, y]) => ({ x, y, a: Math.random() * 6, busy: 0, vx: 0, vy: 0 }));
    const subs = [], prods = [];
    let made = 0, rate = 0, acc = 0;
    const act = () => {
      const T = S.vals.T, opt = S.vals.e === "pepsin" ? 2 : 7;
      const fT = T > 60 ? Math.max(0, 1 - (T - 60) / 8) * Math.exp(-Math.pow((T - 37) / 18, 2)) : Math.exp(-Math.pow((T - 37) / 18, 2));
      const fP = Math.exp(-Math.pow((S.vals.pH - opt) / 1.6, 2));
      return fT * fP;
    };
    return {
      draw(dt, t) {
        const c = S.c, g = S.g, A = act(), denat = S.vals.T > 62, sp = 25 + S.vals.T * 1.4;
        g.fillStyle = c.bg2;
        S.rr(60, 70, 520, 480, 16);
        g.fill();
        while (subs.length < S.vals.sub) subs.push({ x: 90 + Math.random() * 460, y: 100 + Math.random() * 420, a: Math.random() * 6 });
        if (subs.length > S.vals.sub) subs.length = S.vals.sub;
        subs.forEach((s) => {
          s.a += (Math.random() - 0.5) * 2 * dt;
          s.x += Math.cos(s.a) * sp * dt;
          s.y += Math.sin(s.a) * sp * dt;
          if (s.x < 90 || s.x > 550) s.a = Math.PI - s.a;
          if (s.y < 100 || s.y > 520) s.a = -s.a;
          s.x = clamp(s.x, 90, 550);
          s.y = clamp(s.y, 100, 520);
        });
        enz.forEach((e) => {
          e.a += dt * 0.3;
          e.x += Math.cos(e.a * 1.3) * 8 * dt;
          e.y += Math.sin(e.a) * 8 * dt;
          const mx = e.x + Math.cos(e.a) * 44, my = e.y + Math.sin(e.a) * 44;
          if (e.busy > 0) {
            e.busy -= dt;
            if (e.busy <= 0) {
              prods.push({ x: mx, y: my, vx: Math.cos(e.a + 0.5) * 90, vy: Math.sin(e.a + 0.5) * 90, life: 2.5 }, { x: mx, y: my, vx: Math.cos(e.a - 0.5) * 90, vy: Math.sin(e.a - 0.5) * 90, life: 2.5 });
              made++;
              acc++;
            }
          } else if (!denat) {
            const k = subs.findIndex((s) => Math.hypot(s.x - mx, s.y - my) < 34);
            if (k >= 0 && Math.random() < A * 6 * dt + (A > 0.05 ? 0.02 : 0)) {
              subs.splice(k, 1);
              e.busy = 0.7;
            }
          }
          g.save();
          g.translate(e.x, e.y);
          g.rotate(e.a);
          g.fillStyle = denat ? "#9CA3AF" : "#7C5CE6";
          g.beginPath();
          if (denat) {
            for (let k = 0; k <= 12; k++) {
              const q = k / 12 * Math.PI * 2, rr = 46 + Math.sin(q * 5 + t * 3) * 10;
              k ? g.lineTo(Math.cos(q) * rr, Math.sin(q) * rr) : g.moveTo(Math.cos(q) * rr, Math.sin(q) * rr);
            }
          } else {
            g.moveTo(0, 0);
            g.arc(0, 0, 50, 0.45, Math.PI * 2 - 0.45);
            g.lineTo(26, -14);
            g.lineTo(40, 0);
            g.lineTo(26, 14);
          }
          g.closePath();
          g.fill();
          if (e.busy > 0 && !denat) {
            g.fillStyle = "#F59E0B";
            g.beginPath();
            g.moveTo(26, -14);
            g.lineTo(46, 0);
            g.lineTo(26, 14);
            g.closePath();
            g.fill();
          }
          g.restore();
        });
        subs.forEach((s) => {
          g.save();
          g.translate(s.x, s.y);
          g.rotate(s.a);
          g.fillStyle = "#F59E0B";
          g.beginPath();
          g.moveTo(-14, -14);
          g.lineTo(16, 0);
          g.lineTo(-14, 14);
          g.closePath();
          g.fill();
          g.restore();
        });
        for (let i = prods.length - 1; i >= 0; i--) {
          const p = prods[i];
          p.life -= dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.98;
          p.vy *= 0.98;
          if (p.life <= 0) {
            prods.splice(i, 1);
            continue;
          }
          g.globalAlpha = Math.min(1, p.life);
          S.circle(p.x, p.y, 9, "#22C55E");
          g.globalAlpha = 1;
        }
        rate = lerp(rate, acc / Math.max(dt, 1e-3) * 60, 0.02);
        acc = 0;
        const gx = 640, gy = 330, gw = 300, gh = 200;
        S.text("Sıcaklık – hız", gx, gy - gh - 18, { size: 24, color: c.ink2 });
        S.line(gx, gy, gx + gw, gy, c.ink2, 3);
        S.line(gx, gy, gx, gy - gh, c.ink2, 3);
        g.strokeStyle = c.brand;
        g.lineWidth = 4;
        g.beginPath();
        for (let T = 0; T <= 80; T += 2) {
          const f = (T > 60 ? Math.max(0, 1 - (T - 60) / 8) : 1) * Math.exp(-Math.pow((T - 37) / 18, 2));
          const x = gx + gw * T / 80, y = gy - gh * f;
          T ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.stroke();
        const fT = (S.vals.T > 60 ? Math.max(0, 1 - (S.vals.T - 60) / 8) : 1) * Math.exp(-Math.pow((S.vals.T - 37) / 18, 2));
        S.circle(gx + gw * S.vals.T / 80, gy - gh * fT, 10, c.danger, "#fff", 3);
        S.text("37 °C", gx + gw * 37 / 80, gy + 28, { size: 20, align: "center", color: c.ink2 });
        S.text(denat ? "Enzim bozuldu (denatürasyon)" : "Etkinlik: %" + nf(A * 100, 0), gx, 440, { size: 28, weight: 900, color: denat ? c.danger : c.ink });
        S.text("Oluşan ürün: " + made, gx, 490, { size: 26, color: c.ink2 });
        S.kv([["Enzim etkinliği", denat ? "Yok, yapısı bozuldu" : "%" + nf(A * 100, 0)], ["Sıcaklık", nf(S.vals.T, 0) + " °C" + (S.vals.T < 15 ? " (yavaş ama bozulmadı)" : "")], ["pH", nf(S.vals.pH, 1) + " (optimum " + (S.vals.e === "pepsin" ? 2 : 7) + ")"], ["Tepkimeye giren", made + " substrat"]]);
      }
    };
  }
});
