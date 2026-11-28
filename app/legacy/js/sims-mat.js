/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0. Eski tarayıcılar için çevrilmiş kopya; kaynak app/js, üreten tools/build-legacy.sh */
"use strict";
const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
};
const lcm = (a, b) => a / gcd(a, b) * b;
const factor = (n) => {
  const out = [];
  let m = n;
  for (let p = 2; p * p <= m; p++) while (m % p === 0) {
    out.push(p);
    m /= p;
  }
  if (m > 1) out.push(m);
  return out;
};
const factorStr = (n) => {
  if (n < 2) return String(n);
  const f = factor(n), c = {};
  f.forEach((p) => c[p] = (c[p] || 0) + 1);
  return Object.entries(c).map(([p, e]) => e > 1 ? p + toSup(e) : p).join(" · ");
};
const toSup = (n) => String(n).split("").map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]).join("");
const sgn = (v) => v < 0 ? "− " + nf(-v, 2) : "+ " + nf(v, 2);
defSim({
  id: "mutlak",
  subject: "Matematik",
  title: "Mutlak değer ve sayı doğrusu",
  topics: ["matematik--mutlak-deger", "matematik--basit-esitsizlikler", "matematik--pozitif-negatif-sayilar", "matematik--dogal-sayilar-ve-tam-sayilar"],
  icon: I.target,
  blurb: "|x − a| bir uzaklıktır: x'in a'ya olan uzaklığı.",
  lead: "|x − a|, sayı doğrusunda x ile a arasındaki uzaklıktır. Noktayı sürükle; denklem ve eşitsizliğin çözüm kümesinin nasıl oluştuğunu izle.",
  tries: ["|x − 2| = 3 için x hangi iki değeri alır?", '"<" seç: çözüm kümesi neden bir aralık?', '">" seç ve r = 0 yap: hangi sayı çözüm değil?'],
  note: "|x − a| = r ⇔ x = a − r ya da x = a + r. <b>|x − a| < r ⇔ a − r < x < a + r</b>, |x − a| > r ⇔ x < a − r ya da x > a + r. Mutlak değer hiçbir zaman negatif olmaz.",
  aspect: 0.5,
  init(S) {
    S.choice("m", "Soru", [["eq", "|x − a| = r"], ["lt", "|x − a| < r"], ["gt", "|x − a| > r"]], "eq");
    S.slider("a", "a", -6, 6, 1, 2, (x) => nf(x, 0));
    S.slider("r", "r", 0, 6, 1, 3, (x) => nf(x, 0));
    let px = 5, drag = false;
    const X = (v) => 500 + v * 42, V = (x) => (x - 500) / 42, Y = 300;
    return {
      down(x, y) {
        if (Math.abs(x - X(px)) < 60 && Math.abs(y - (Y - 40)) < 90) {
          drag = true;
          return true;
        }
        return false;
      },
      move(x) {
        if (drag) px = clamp(Math.round(V(x) * 2) / 2, -10, 10);
      },
      up() {
        drag = false;
      },
      draw() {
        const c = S.c, g = S.g, a = S.vals.a, r = S.vals.r, m = S.vals.m;
        const L = a - r, R = a + r, sc = c.ok;
        g.save();
        g.globalAlpha = 0.9;
        if (m === "lt" && r > 0) {
          g.fillStyle = sc;
          g.fillRect(X(L), Y - 9, X(R) - X(L), 18);
        }
        if (m === "gt") {
          g.fillStyle = sc;
          g.fillRect(X(-10.6), Y - 9, X(L) - X(-10.6), 18);
          g.fillRect(X(R), Y - 9, X(10.6) - X(R), 18);
        }
        g.restore();
        S.line(X(-10.8), Y, X(10.8), Y, c.ink2, 4);
        for (let v = -10; v <= 10; v++) {
          S.line(X(v), Y - (v % 5 ? 10 : 18), X(v), Y + (v % 5 ? 10 : 18), c.ink2, 3);
          if (S.ts < 1.2 || v % 2 === 0) S.text(String(v).replace("-", "−"), X(v), Y + 48, { size: v % 5 ? 20 : 24, align: "center", color: v === 0 ? c.ink : c.ink2, weight: v === 0 ? 900 : 600 });
        }
        if (m === "eq" || m === "lt" || m === "gt") {
          [L, R].forEach((v) => S.circle(X(v), Y, 12, m === "eq" ? sc : c.bg, sc, 5));
        }
        S.circle(X(a), Y, 10, c.brand);
        S.text("a = " + String(a).replace("-", "−"), X(a), Y + 88, { size: 24, align: "center", color: c.brand, weight: 900 });
        if (r > 0) [L, R].forEach((v) => {
          g.save();
          g.strokeStyle = c.brand;
          g.lineWidth = 3;
          g.setLineDash([6, 6]);
          g.beginPath();
          g.arc((X(a) + X(v)) / 2, Y, Math.abs(X(v) - X(a)) / 2, Math.PI, 0);
          g.stroke();
          g.restore();
          S.text("r = " + r, (X(a) + X(v)) / 2, Y - Math.abs(X(v) - X(a)) / 2 - 10, { size: 20, align: "center", color: c.brand });
        });
        const d = Math.abs(px - a), ok = m === "eq" ? d === r : m === "lt" ? d < r : d > r;
        S.line(X(a), Y - 120, X(px), Y - 120, c.warn, 6);
        S.line(X(a), Y - 132, X(a), Y - 108, c.warn, 4);
        S.line(X(px), Y - 132, X(px), Y - 108, c.warn, 4);
        S.text("|x − a| = " + nf(d, 1), (X(a) + X(px)) / 2, Y - 140, { size: 26, align: "center", color: c.warn, weight: 900 });
        g.fillStyle = ok ? c.ok : c.danger;
        g.beginPath();
        g.moveTo(X(px), Y - 14);
        g.lineTo(X(px) - 18, Y - 50);
        g.lineTo(X(px) + 18, Y - 50);
        g.closePath();
        g.fill();
        S.circle(X(px), Y - 66, 24, ok ? c.ok : c.danger, "#fff", 4);
        S.text("x", X(px), Y - 64, { size: 26, color: "#fff", align: "center", base: "middle", weight: 900 });
        const aS = a < 0 ? "+ " + -a : "− " + a, eqs = { eq: "|x " + aS + "| = " + r, lt: "|x " + aS + "| < " + r, gt: "|x " + aS + "| > " + r };
        const sol = m === "eq" ? r === 0 ? "{" + a + "}" : "{" + L + ", " + R + "}" : m === "lt" ? r === 0 ? "Boş küme" : "(" + L + ", " + R + ")" : r === 0 ? "ℝ − {" + a + "}" : "x < " + L + " ya da x > " + R;
        S.text(eqs[m].replace(/-(\d)/g, "−$1"), 500, 60, { size: 40, align: "center", weight: 900 });
        S.text("Çözüm: " + sol.replace(/-(\d)/g, "−$1"), 500, 104, { size: 28, align: "center", color: c.ok, weight: 800 });
        if (S.t < 5 && !drag) S.text("x'i sürükle", X(px), Y + 130, { size: 20, align: "center", color: c.ink2 });
        S.kv([["Denklem", eqs[m].replace(/-(\d)/g, "−$1")], ["x", nf(px, 1)], ["x'in a'ya uzaklığı", nf(d, 1)], ["x çözüm mü?", ok ? '<span class="ok-t">Evet</span>' : '<span class="no-t">Hayır</span>'], ["Çözüm kümesi", sol.replace(/-(\d)/g, "−$1")]]);
      }
    };
  }
});
defSim({
  id: "ebob",
  subject: "Matematik",
  title: "EBOB ve EKOK",
  topics: ["matematik--ebob-ekok", "matematik--bolme-ve-bolunebilme"],
  icon: I.target,
  blurb: "Dikdörtgeni en büyük karelerle döşe; iki sıçrayışın ilk buluştuğu yeri bul.",
  lead: "a × b dikdörtgeni boşluk kalmadan döşeyen en büyük karenin kenarı EBOB'dur. a ve b adımlarla sıçrayan iki tavşanın ilk buluştuğu sayı EKOK'tur.",
  tries: ["12 ve 18 için kaç kare gerekiyor?", "Aralarında asal iki sayı seç (ör. 8 ve 15): EBOB kaç oldu?", "EBOB × EKOK ile a × b'yi karşılaştır."],
  note: "EBOB, ortak asal çarpanların <b>en küçük</b> kuvvetlerinin çarpımı; EKOK, tüm asal çarpanların <b>en büyük</b> kuvvetlerinin çarpımıdır. İki sayı için her zaman <b>EBOB · EKOK = a · b</b>.",
  aspect: 0.78,
  init(S) {
    S.slider("a", "a", 2, 24, 1, 12, (x) => nf(x, 0));
    S.slider("b", "b", 2, 24, 1, 18, (x) => nf(x, 0));
    let t0 = 0;
    S.changed = () => {
      t0 = S.t;
    };
    S.button("Tekrar oynat", () => {
      t0 = S.t;
    }, true);
    return {
      draw() {
        const c = S.c, g = S.g, a = S.vals.a, b = S.vals.b, e = gcd(a, b), k = lcm(a, b), tt = S.t - t0;
        const box = 330, u = box / Math.max(a, b), rx = 60, ry = 70, W = a * u, H = b * u;
        S.text(a + " × " + b + " dikdörtgen", rx, ry - 20, { size: 24, color: c.ink2 });
        g.fillStyle = c.bg2;
        g.fillRect(rx, ry, W, H);
        const n = a / e * (b / e), shown = Math.min(n, Math.floor(tt * Math.max(4, n / 2.5)));
        for (let i = 0; i < shown; i++) {
          const cx = i % (a / e), cy = Math.floor(i / (a / e));
          g.fillStyle = i % 2 ? "rgba(124,92,230,.55)" : "rgba(124,92,230,.35)";
          g.fillRect(rx + cx * e * u + 1, ry + cy * e * u + 1, e * u - 2, e * u - 2);
        }
        g.strokeStyle = c.ink;
        g.lineWidth = 3;
        g.strokeRect(rx, ry, W, H);
        if (shown >= n) S.text(n + " kare, kenarı " + e, rx, ry + H + 34, { size: 26, weight: 900, color: c.brand });
        const ix = 540;
        S.text("EBOB = " + e, ix, 110, { size: 38, weight: 900, color: c.brand });
        S.text("EKOK = " + k, ix, 110 + 52 * S.ts, { size: 38, weight: 900, color: c.warn });
        S.text(a + " = " + factorStr(a), ix, 130 + 100 * S.ts, { size: 28 });
        S.text(b + " = " + factorStr(b), ix, 130 + 140 * S.ts, { size: 28 });
        S.text(e + " · " + k + " = " + a + " · " + b, ix, 130 + 190 * S.ts, { size: 26, color: c.ink2 });
        if (e === 1) S.text("Aralarında asal", ix, 130 + 230 * S.ts, { size: 26, color: c.ok, weight: 800 });
        const lx = 60, lw = 880, ly = [560, 690], X = (v) => lx + lw * v / k, hop = clamp((tt - 1.2) / 3, 0, 1);
        [[a, c.brand, ly[0]], [b, c.cold, ly[1]]].forEach(([s, col, y]) => {
          S.line(lx, y, lx + lw, y, c.ink2, 3);
          const steps = k / s, done = hop * steps;
          for (let j2 = 0; j2 <= steps; j2++) {
            S.line(X(j2 * s), y - 8, X(j2 * s), y + 8, c.ink2, 2);
            if (steps <= 24 || j2 === steps) S.text(String(j2 * s), X(j2 * s), y + 34, { size: steps > 14 ? 16 : 20, align: "center", color: c.ink2 });
          }
          g.save();
          g.strokeStyle = col;
          g.lineWidth = 3;
          const rh = Math.min((X(s) - X(0)) / 2, 44);
          for (let j2 = 0; j2 < Math.floor(done); j2++) {
            g.beginPath();
            g.ellipse((X(j2 * s) + X((j2 + 1) * s)) / 2, y, (X(s) - X(0)) / 2, rh, 0, Math.PI, 0);
            g.stroke();
          }
          g.restore();
          const f = done - Math.floor(done), j = Math.floor(done), hx = j >= steps ? X(k) : lerp(X(j * s), X((j + 1) * s), f), hy = j >= steps ? y : y - Math.sin(f * Math.PI) * rh;
          S.circle(hx, hy - 14, 14, col, "#fff", 3);
          S.text(s + "'er", lx, y - 56, { size: 22, color: col, weight: 800 });
        });
        if (hop >= 1) {
          S.line(X(k), ly[0] - 30, X(k), ly[1] + 10, c.warn, 4, [8, 6]);
          S.text("İlk buluşma: " + k, X(k), ly[0] - 46, { size: 24, align: "right", color: c.warn, weight: 900 });
        }
        S.kv([["EBOB", String(e)], ["EKOK", String(k)], ["Asal çarpanlar", a + " = " + factorStr(a) + ", " + b + " = " + factorStr(b)], ["Kontrol", e + " · " + k + " = " + a + " · " + b + " = " + a * b]]);
      }
    };
  }
});
defSim({
  id: "terazi",
  subject: "Matematik",
  title: "Denklem terazisi",
  topics: ["matematik--basit-denklemler", "matematik--harfli-ifadeler"],
  icon: I.target,
  blurb: "Terazinin iki kefesine aynı işlemi yap; x yalnız kalsın.",
  lead: "Denklem dengedeki bir terazidir. İki tarafa da aynı şeyi yaparsan denge bozulmaz. Adım adım ilerle, x'i yalnız bırak.",
  tries: ["İlk adımda neden iki taraftan da aynı sayıyı çıkarıyoruz?", "Sadece bir taraftan çıkarsaydın terazi ne yapardı?", "Yeni denklem al, çözmeden önce x'i tahmin et."],
  note: "ax + b = c denkleminde önce iki taraftan b çıkarılır: ax = c − b. Sonra iki taraf a'ya bölünür: <b>x = (c − b) / a</b>. Bulduğun değeri denklemde yerine koyarak kontrol et.",
  aspect: 0.66,
  init(S) {
    let A = 3, B = 4, X = 5, step = 0, ts = 0;
    const C = () => A * X + B;
    const btn = S.button("Sonraki adım", () => {
      if (step < 3) {
        step++;
        ts = S.t;
      }
      btn.textContent = step < 3 ? "Sonraki adım" : "Bitti";
    }, true);
    S.button("Yeni denklem", () => {
      A = 1 + Math.floor(Math.random() * 4);
      B = 1 + Math.floor(Math.random() * 7);
      X = 1 + Math.floor(Math.random() * 5);
      step = 0;
      ts = S.t;
      btn.textContent = "Sonraki adım";
    });
    const unit = (x, y, col, al) => {
      S.g.globalAlpha = al;
      S.circle(x, y, 13, col, "rgba(0,0,0,.25)", 2);
      S.g.globalAlpha = 1;
    };
    const box = (x, y, al, hl) => {
      const g = S.g;
      g.globalAlpha = al;
      g.fillStyle = hl ? S.c.warn : S.c.brand;
      S.rr(x - 26, y - 52, 52, 52, 8);
      g.fill();
      S.text("x", x, y - 24, { size: 30, color: "#fff", align: "center", base: "middle", weight: 900 });
      g.globalAlpha = 1;
    };
    return {
      draw() {
        const c = S.c, g = S.g, cc = C(), p = clamp((S.t - ts) / 1.2, 0, 1);
        const tilt = step === 1 && p < 1 ? Math.sin(p * Math.PI) * 0.05 : 0;
        const cx = 500, cy = 250, arm = 300;
        g.fillStyle = c.ink2;
        g.beginPath();
        g.moveTo(cx, cy);
        g.lineTo(cx - 60, 620);
        g.lineTo(cx + 60, 620);
        g.closePath();
        g.fill();
        g.fillRect(cx - 140, 614, 280, 16);
        const lx = cx - Math.cos(tilt) * arm, ly = cy - Math.sin(tilt) * arm, rx = cx + Math.cos(tilt) * arm, ry = cy + Math.sin(tilt) * arm;
        S.line(lx, ly, rx, ry, c.ink, 12);
        S.circle(cx, cy, 16, c.ink);
        const pan = (x, y) => {
          S.line(x, y, x - 150, y + 170, c.ink2, 2);
          S.line(x, y, x + 150, y + 170, c.ink2, 2);
          g.fillStyle = c.bg2;
          g.beginPath();
          g.ellipse(x, y + 176, 170, 20, 0, 0, Math.PI * 2);
          g.fill();
          g.strokeStyle = c.ink2;
          g.lineWidth = 3;
          g.stroke();
          return y + 166;
        };
        const lb = pan(lx, ly), rb = pan(rx, ry);
        const remB = step >= 1, divd = step >= 2;
        for (let i = 0; i < A; i++) {
          const gx = lx - 120 + i * 62 + (divd ? i * 10 : 0);
          box(gx + 26, lb, divd && i > 0 ? lerp(1, 0.3, step === 2 ? p : 1) : 1, divd && i === 0);
        }
        const bAlpha = remB ? step === 1 ? 1 - p : 0 : 1, lift = remB && step === 1 ? -p * 120 : 0;
        for (let i = 0; i < B; i++) {
          const col = i % 4, row = Math.floor(i / 4);
          unit(lx + 70 + col * 28, lb - 14 - row * 28 + lift, c.danger, bAlpha);
        }
        const rest = cc - B, per = rest / A;
        for (let i = 0; i < cc; i++) {
          const isB = i >= rest, grp = Math.floor(i / per), k = i % per;
          let x, y;
          if (divd && !isB) {
            x = rx - 150 + grp * (300 / A) + k % 3 * 26 + 14;
            y = rb - 14 - Math.floor(k / 3) * 26;
          } else {
            x = rx - 130 + i % 9 * 30;
            y = rb - 14 - Math.floor(i / 9) * 30;
          }
          const al = isB ? bAlpha : divd && grp > 0 ? lerp(1, 0.3, step === 2 ? p : 1) : 1;
          unit(x, y + (isB ? lift : 0), isB ? c.danger : divd && grp === 0 ? c.warn : c.ok, al);
        }
        const ax = A === 1 ? "x" : A + "x", eq = [ax + " + " + B + " = " + cc, ax + " = " + cc + " − " + B + " = " + rest, "x = " + rest + " / " + A, "x = " + X][step];
        const why = ["Terazi dengede: iki taraf eşit.", "İki taraftan da " + B + " çıkar.", "İki tarafı " + A + " eşit gruba böl.", "Kontrol: " + A + " · " + X + " + " + B + " = " + cc];
        S.text(eq, 500, 70, { size: 46, align: "center", weight: 900, color: step === 3 ? c.ok : c.ink });
        S.text(why[step], 500, 120, { size: 26, align: "center", color: c.ink2 });
        S.kv([["Denklem", ax + " + " + B + " = " + cc], ["Adım", step + 1 + " / 4"], ["Şu an", eq], step === 3 ? ["Çözüm", "x = " + X, "hl"] : null]);
      }
    };
  }
});
defSim({
  id: "kesir",
  subject: "Matematik",
  title: "Kesirlerle toplama",
  topics: ["matematik--rasyonel-sayilar", "matematik--ondalik-sayilar"],
  icon: I.target,
  blurb: "Paydalar eşit değilse parçalar farklı boydadır. Ortak paydaya genişlet.",
  lead: "Farklı paydalı kesirlerde parçaların boyu farklıdır, bu yüzden doğrudan toplanmaz. Ortak paydaya genişletince bütün aynı sayıda eşit parçaya bölünür.",
  tries: ["1/2 + 1/3 için ortak payda kaç?", "Karşılaştır'ı seç: 3/4 mü 5/7 mi büyük?", "Genişletmeyi kapat ve aç: kesrin değeri değişiyor mu?"],
  note: "a/b + c/d = (a·d + c·b) / (b·d). En küçük ortak payda paydaların <b>EKOK</b>'udur. Pay ve payda aynı sayıyla çarpılırsa (genişletme) kesrin değeri değişmez.",
  aspect: 0.62,
  init(S) {
    S.choice("op", "İşlem", [["+", "Topla"], ["-", "Çıkar"], ["cmp", "Karşılaştır"]], "+");
    S.slider("a", "Birinci kesrin payı", 1, 12, 1, 1, (x) => nf(x, 0));
    S.slider("b", "Birinci kesrin paydası", 2, 12, 1, 2, (x) => nf(x, 0));
    S.slider("c", "İkinci kesrin payı", 1, 12, 1, 1, (x) => nf(x, 0));
    S.slider("d", "İkinci kesrin paydası", 2, 12, 1, 3, (x) => nf(x, 0));
    S.toggle("ext", "Ortak paydaya genişlet", false);
    S.changed = (id) => {
      if (S.vals.a > S.vals.b) S.set_a(S.vals.b);
      if (S.vals.c > S.vals.d) S.set_c(S.vals.d);
    };
    const simp = (p, q) => {
      const e = gcd(p, q) || 1;
      return [p / e, q / e];
    };
    return {
      draw() {
        const c = S.c, g = S.g, { a, b, c: cn, d, op, ext } = S.vals, L = lcm(b, d), U = 380, X0 = 200;
        const bar = (y, p, q, parts, col, label) => {
          const val = p / q, wholes = Math.max(1, Math.ceil(val - 1e-9));
          for (let w = 0; w < wholes; w++) {
            const x = X0 + w * (U + 20);
            g.fillStyle = c.bg2;
            g.fillRect(x, y, U, 64);
            const fill = clamp(val - w, 0, 1);
            g.fillStyle = col;
            g.fillRect(x, y, U * fill, 64);
            for (let i = 1; i < parts; i++) S.line(x + U * i / parts, y, x + U * i / parts, y + 64, c.bg, parts > 24 ? 1 : 3);
            g.strokeStyle = c.ink;
            g.lineWidth = 3;
            g.strokeRect(x, y, U, 64);
          }
          S.text(label, X0 - 24, y + 44, { size: 36, align: "right", weight: 900 });
        };
        const fr = (p, q) => p + "/" + q;
        const m1 = ext ? L / b : 1, m2 = ext ? L / d : 1;
        bar(70, a, b, ext ? L : b, "rgba(124,92,230,.7)", ext ? fr(a * m1, L) : fr(a, b));
        bar(180, cn, d, ext ? L : d, "rgba(59,130,246,.7)", ext ? fr(cn * m2, L) : fr(cn, d));
        if (ext && (m1 > 1 || m2 > 1)) S.text("Genişletme: " + fr(a, b) + " = " + fr(a * m1, L) + ",  " + fr(cn, d) + " = " + fr(cn * m2, L), X0, 290, { size: 24, color: c.ink2 });
        const v1 = a / b, v2 = cn / d;
        let rd = "";
        if (op === "cmp") {
          const s = Math.abs(v1 - v2) < 1e-9 ? "=" : v1 > v2 ? ">" : "<";
          S.text(fr(a, b) + "  " + s + "  " + fr(cn, d), 500, 400, { size: 64, align: "center", weight: 900, color: c.brand });
          S.text("Çapraz çarpım: " + a + "·" + d + " = " + a * d + "   " + s + "   " + cn + "·" + b + " = " + cn * b, 500, 460, { size: 26, align: "center", color: c.ink2 });
          rd = fr(a, b) + " " + s + " " + fr(cn, d);
        } else {
          const pn = op === "+" ? a * (L / b) + cn * (L / d) : a * (L / b) - cn * (L / d);
          const [sp, sq] = simp(Math.abs(pn), L);
          if (pn >= 0 && ext) {
            const val = pn / L, wholes = Math.max(1, Math.ceil(val - 1e-9));
            for (let w = 0; w < wholes; w++) {
              const x = X0 + w * (U + 20);
              g.fillStyle = c.bg2;
              g.fillRect(x, 320, U, 64);
              const f1 = op === "+" ? clamp(a / b - w, 0, 1) : clamp(val - w, 0, 1);
              g.fillStyle = "rgba(124,92,230,.7)";
              g.fillRect(x, 320, U * f1, 64);
              if (op === "+") {
                const f2 = clamp(val - w, 0, 1);
                g.fillStyle = "rgba(59,130,246,.7)";
                g.fillRect(x + U * f1, 320, U * Math.max(0, f2 - f1), 64);
              }
              for (let i = 1; i < L; i++) S.line(x + U * i / L, 320, x + U * i / L, 384, c.bg, L > 24 ? 1 : 3);
              g.strokeStyle = c.ink;
              g.lineWidth = 3;
              g.strokeRect(x, 320, U, 64);
            }
            S.text("=", X0 - 24, 364, { size: 40, align: "right", weight: 900 });
          } else if (!ext) S.text("Parçalar farklı boyda: önce genişlet.", 500, 360, { size: 26, align: "center", color: c.warn, weight: 800 });
          const res = (pn < 0 ? "−" : "") + fr(Math.abs(pn), L) + (sq !== L ? " = " + (pn < 0 ? "−" : "") + fr(sp, sq) : "");
          S.text(fr(a, b) + " " + (op === "+" ? "+" : "−") + " " + fr(cn, d) + " = " + res, 500, 480, { size: 44, align: "center", weight: 900 });
          S.text("≈ " + nf(pn / L, 3), 500, 530, { size: 26, align: "center", color: c.ink2 });
          rd = res;
        }
        S.kv([["Birinci", fr(a, b) + " ≈ " + nf(v1, 3)], ["İkinci", fr(cn, d) + " ≈ " + nf(v2, 3)], ["Ortak payda (EKOK)", String(L)], ["Sonuç", rd, "hl"]]);
      }
    };
  }
});
defSim({
  id: "asal",
  subject: "Matematik",
  title: "Asal sayı kalburu",
  topics: ["matematik--asal-sayilar", "matematik--bolme-ve-bolunebilme"],
  icon: I.target,
  blurb: "1'den 100'e: katları ele, geriye asallar kalsın.",
  lead: "Eratosthenes'in yöntemi: 2'den başla, her asalın katlarını ele. 10 × 10 = 100 olduğu için 7'ye kadar elemek yeter. Bir sayıya dokunup asal çarpanlarını gör.",
  tries: ["Elemeyi başlat ve izle: 11'in katlarını elemek neden gerekmiyor?", "91'e dokun: asal mı?", "1 neden asal değil?"],
  note: "Asal sayı yalnızca 1'e ve kendisine bölünen, <b>1'den büyük</b> doğal sayıdır. 2 tek çift asaldır. 1 ile 100 arasında <b>25 asal</b> vardır. Bir n sayısının asallığını sınamak için √n'e kadar olan asallara bölmek yeter.",
  aspect: 0.99,
  init(S) {
    S.slider("sp", "Hız", 2, 40, 1, 10, (x) => nf(x, 0) + " adım/sn");
    const ev = [];
    const crossed = /* @__PURE__ */ new Set();
    [2, 3, 5, 7].forEach((p) => {
      ev.push(["p", p]);
      for (let m = p * p; m <= 100; m += p) if (!crossed.has(m)) {
        crossed.add(m);
        ev.push(["x", m, p]);
      }
    });
    ev.push(["done"]);
    const PC = { 2: "#7C5CE6", 3: "#3B82F6", 5: "#F59E0B", 7: "#E5484D" };
    let i = 0, run = false, acc = 0, sel = 91;
    const st = /* @__PURE__ */ new Map(), primes = /* @__PURE__ */ new Set();
    let cur = 0, done = false;
    const runB = S.button("Elemeyi başlat", (b) => {
      if (done) {
        reset();
      }
      run = !run;
      b.textContent = run ? "Duraklat" : "Devam et";
    }, true);
    const reset = () => {
      i = 0;
      acc = 0;
      st.clear();
      primes.clear();
      cur = 0;
      done = false;
      runB.textContent = "Elemeyi başlat";
    };
    S.button("Sıfırla", () => {
      run = false;
      reset();
    });
    const CW = 80, X0 = 100, Y0 = 30;
    return {
      down(x, y) {
        const cx = Math.floor((x - X0) / CW), cy = Math.floor((y - Y0) / CW);
        if (cx >= 0 && cx < 10 && cy >= 0 && cy < 10) {
          sel = cy * 10 + cx + 1;
          return true;
        }
        return false;
      },
      draw(dt) {
        const c = S.c, g = S.g;
        if (run && !done) {
          acc += dt * S.vals.sp;
          while (acc >= 1 && i < ev.length) {
            acc -= 1;
            const e = ev[i++];
            if (e[0] === "p") {
              primes.add(e[1]);
              cur = e[1];
            } else if (e[0] === "x") st.set(e[1], e[2]);
            else {
              done = true;
              run = false;
              runB.textContent = "Baştan izle";
            }
          }
        }
        for (let n = 1; n <= 100; n++) {
          const x = X0 + (n - 1) % 10 * CW, y = Y0 + Math.floor((n - 1) / 10) * CW, p = st.get(n), isP = primes.has(n) || done && n > 1 && !p;
          g.fillStyle = isP ? "rgba(30,158,90,.85)" : p ? c.dark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.05)" : c.bg2;
          S.rr(x + 3, y + 3, CW - 6, CW - 6, 10);
          g.fill();
          if (n === sel) {
            g.strokeStyle = c.ink;
            g.lineWidth = 4;
            S.rr(x + 3, y + 3, CW - 6, CW - 6, 10);
            g.stroke();
          }
          if (n === cur && !done) {
            g.strokeStyle = PC[cur];
            g.lineWidth = 6;
            S.rr(x + 3, y + 3, CW - 6, CW - 6, 10);
            g.stroke();
          }
          S.text(String(n), x + CW / 2, y + CW / 2 + 2, { size: 30, align: "center", base: "middle", weight: isP ? 900 : 700, color: isP ? "#fff" : p ? c.ink2 : c.ink });
          if (p) S.line(x + 14, y + CW - 14, x + CW - 14, y + 14, PC[p], 5);
        }
        const leg = [[2, "2'nin katları"], [3, "3'ün katları"], [5, "5'in katları"], [7, "7'nin katları"]];
        leg.forEach(([p, l], k) => {
          const x = X0 + k % 2 * 400, y = 866 + Math.floor(k / 2) * 40;
          S.line(x, y, x + 30, y - 26, PC[p], 5);
          S.text(l, x + 40, y - 2, { size: 22, color: c.ink2 });
        });
        const cnt = done ? 25 : primes.size;
        S.text(done ? "1–100 arasında 25 asal sayı var." : cur ? cur + "'nin katları eleniyor" : "Başlat'a bas ya da bir sayıya dokun.", 500, 964, { size: 24, align: "center", weight: 800, color: done ? c.ok : c.ink });
        const isPrime = sel > 1 && factor(sel).length === 1;
        const divs = [];
        for (let k = 1; k <= sel; k++) if (sel % k === 0) divs.push(k);
        S.kv([["Seçili sayı", String(sel)], ["Durum", sel === 1 ? "Ne asal ne bileşik" : isPrime ? '<span class="ok-t">Asal</span>' : "Bileşik"], ["Asal çarpanlar", sel > 1 ? factorStr(sel) : "—"], ["Bölenleri", divs.join(", ") + " (" + divs.length + " tane)"], ["Bulunan asal", String(cnt)]]);
      }
    };
  }
});
defSim({
  id: "pisagor",
  subject: "Geometri",
  title: "Pisagor ve Öklid bağıntıları",
  topics: ["geometri--dik-ucgen"],
  icon: I.target,
  blurb: "Dik kenarlar üzerindeki karelerin alanları toplamı hipotenüs karesine eşit.",
  lead: "Dik üçgenin kenarlarına kare çiz. Küçük iki karenin alanları toplamı büyük karenin alanına eşittir. Öklid'i açınca dik açıdan inen yüksekliğin bağıntılarını gör.",
  tries: ["3-4-5'i seç ve küçük karelerdeki birim kareleri say.", "Kenarları 6 ve 8 yap: hipotenüs kaç?", "Öklid'i aç: h² = p · k doğru mu?"],
  note: "<b>a² + b² = c²</b>. Özel üçlüler: 3-4-5, 5-12-13, 8-15-17 ve katları (6-8-10). Öklid: h² = p·k, b² = p·c, a² = k·c ve a·b = c·h.",
  aspect: 0.72,
  init(S) {
    S.choice("pr", "Hazır üçlü", [["3,4", "3-4-5"], ["5,12", "5-12-13"], ["6,8", "6-8-10"], ["8,15", "8-15-17"], ["x", "Serbest"]], "3,4");
    S.slider("a", "a (yatay dik kenar)", 1, 15, 1, 4, (x) => nf(x, 0));
    S.slider("b", "b (dikey dik kenar)", 1, 15, 1, 3, (x) => nf(x, 0));
    S.toggle("ok", "Öklid bağıntılarını göster", false);
    S.toggle("gr", "Birim kareleri göster", true);
    S.changed = (id) => {
      if (id === "pr" && S.vals.pr !== "x") {
        const [b, a] = S.vals.pr.split(",").map(Number);
        S.set_a(a);
        S.set_b(b);
      }
    };
    S.changed("pr");
    return {
      draw() {
        const c = S.c, g = S.g, a = S.vals.a, b = S.vals.b, h2 = a * a + b * b, cc = Math.sqrt(h2);
        const sc = Math.min(600 / (a + 2 * b), 660 / (2 * a + b)), ox = 30 + b * sc + (600 - (a + 2 * b) * sc) / 2, oy = 20 + (a + b) * sc + (660 - (2 * a + b) * sc) / 2;
        const P = (x, y) => [ox + x * sc, oy + y * sc];
        const poly = (pts, fill, stroke) => {
          g.beginPath();
          pts.forEach((p, i) => {
            const q2 = P(p[0], p[1]);
            i ? g.lineTo(q2[0], q2[1]) : g.moveTo(q2[0], q2[1]);
          });
          g.closePath();
          if (fill) {
            g.fillStyle = fill;
            g.fill();
          }
          if (stroke) {
            g.strokeStyle = stroke;
            g.lineWidth = 3;
            g.stroke();
          }
        };
        const grid = (o, u, v, n1, n2) => {
          if (!S.vals.gr) return;
          g.save();
          g.strokeStyle = "rgba(255,255,255,.55)";
          g.lineWidth = 1.5;
          for (let i = 1; i < n1; i++) {
            const p1 = P(o[0] + u[0] * i, o[1] + u[1] * i), p2 = P(o[0] + u[0] * i + v[0] * n2, o[1] + u[1] * i + v[1] * n2);
            g.beginPath();
            g.moveTo(p1[0], p1[1]);
            g.lineTo(p2[0], p2[1]);
            g.stroke();
          }
          for (let j = 1; j < n2; j++) {
            const p1 = P(o[0] + v[0] * j, o[1] + v[1] * j), p2 = P(o[0] + v[0] * j + u[0] * n1, o[1] + v[1] * j + u[1] * n1);
            g.beginPath();
            g.moveTo(p1[0], p1[1]);
            g.lineTo(p2[0], p2[1]);
            g.stroke();
          }
          g.restore();
        };
        const C0 = [0, 0], B0 = [a, 0], A0 = [0, -b];
        poly([[0, 0], [a, 0], [a, a], [0, a]], "rgba(59,130,246,.65)");
        grid([0, 0], [1, 0], [0, 1], a, a);
        poly([[0, 0], [0, -b], [-b, -b], [-b, 0]], "rgba(124,92,230,.65)");
        grid([0, 0], [-1, 0], [0, -1], b, b);
        const n = [b / cc, -a / cc], d = [a / cc, b / cc];
        poly([A0, B0, [a + b, -a], [b, -b - a]], "rgba(245,158,11,.65)");
        if (Number.isInteger(cc)) grid(A0, d, n, cc, cc);
        poly([C0, B0, A0], c.bg, c.ink);
        const q = P(0, 0), m = 18;
        g.strokeStyle = c.ink;
        g.lineWidth = 3;
        g.strokeRect(q[0], q[1] - m, m, m);
        const lab = (x, y, s, col) => {
          const p = P(x, y);
          S.text(s, p[0], p[1], { size: 30, align: "center", base: "middle", color: col || "#fff", weight: 900, bg: "rgba(0,0,0,.25)" });
        };
        lab(a / 2, a / 2, a + "² = " + a * a);
        lab(-b / 2, -b / 2, b + "² = " + b * b);
        lab((a + b) / 2, -(a + b) / 2, "c² = " + h2);
        const pa = P(a / 2, 0), pb = P(0, -b / 2);
        S.text("a", pa[0], pa[1] - 12, { size: 26, align: "center", color: c.ink, weight: 900 });
        S.text("b", pb[0] + 14, pb[1], { size: 26, base: "middle", color: c.ink, weight: 900 });
        let ok = null;
        if (S.vals.ok) {
          const pp = b * b / cc, kk = a * a / cc, hh = a * b / cc, H0 = [A0[0] + d[0] * pp, A0[1] + d[1] * pp], hq = P(H0[0], H0[1]);
          S.line(q[0], q[1], hq[0], hq[1], c.danger, 4, [8, 6]);
          S.text("h", (q[0] + hq[0]) / 2 + 12, (q[1] + hq[1]) / 2 + 6, { size: 26, color: c.danger, weight: 900 });
          const pm = P(A0[0] + d[0] * pp / 2 - n[0] * 0.6, A0[1] + d[1] * pp / 2 - n[1] * 0.6), km = P(H0[0] + d[0] * kk / 2 - n[0] * 0.6, H0[1] + d[1] * kk / 2 - n[1] * 0.6);
          S.text("p", pm[0], pm[1], { size: 24, color: c.danger, weight: 900, align: "center" });
          S.text("k", km[0], km[1], { size: 24, color: c.danger, weight: 900, align: "center" });
          ok = [pp, kk, hh];
        }
        const ix = 680;
        S.text("a² + b² = c²", ix, 80, { size: 38, weight: 900 });
        S.text(a * a + " + " + b * b + " = " + h2, ix, 130, { size: 32 });
        S.text("c = " + (Number.isInteger(cc) ? cc : "√" + h2 + " ≈ " + nf(cc, 2)), ix, 180, { size: 32, weight: 900, color: "#D97706" });
        if (ok) {
          S.text("p = " + nf(ok[0], 2) + ",  k = " + nf(ok[1], 2), ix, 250, { size: 24, color: c.danger });
          S.text("h = a·b / c = " + nf(ok[2], 2), ix, 290, { size: 24, color: c.danger });
          S.text("h² = p·k = " + nf(ok[2] * ok[2], 2), ix, 330, { size: 24, color: c.danger });
        }
        S.kv([["a, b", a + ", " + b], ["Hipotenüs c", Number.isInteger(cc) ? String(cc) : "√" + h2 + " ≈ " + nf(cc, 2)], ["Alanlar", a * a + " + " + b * b + " = " + h2], ["Üçgenin alanı", nf(a * b / 2, 1)], ok ? ["Öklid", "p = " + nf(ok[0], 2) + ", k = " + nf(ok[1], 2) + ", h = " + nf(ok[2], 2)] : null]);
      }
    };
  }
});
defSim({
  id: "ucgen",
  subject: "Geometri",
  title: "Üçgende açılar ve açıortay",
  topics: ["geometri--ucgende-aci", "geometri--ikizkenar-ucgen", "geometri--eskenar-ucgen", "geometri--aciortay"],
  icon: I.target,
  blurb: "Köşeleri sürükle: açıların toplamı hep 180°. İkizkenar ve eşkenarı yakala.",
  lead: "Köşeleri sürükleyerek üçgeni değiştir. İç açıların toplamı hep 180° kalır. İki kenar eşitlenince taban açıları da eşitlenir. Açıortayı açıp kenarları nasıl böldüğüne bak.",
  tries: ["Üçgeni ne kadar değiştirirsen değiştir, açılar toplamı kaç?", "İkizkenar yap: hangi açılar eşit oldu?", "Açıortayı aç: |BD| / |DC| ile |AB| / |AC| aynı mı?"],
  note: "İç açılar toplamı <b>180°</b>, bir dış açı kendisine komşu olmayan iki iç açının toplamına eşittir. İkizkenar üçgende eşit kenarların karşısındaki açılar eşittir. İç açıortay teoremi: <b>|BD| / |DC| = |AB| / |AC|</b>.",
  aspect: 0.72,
  init(S) {
    let P = { A: [430, 120], B: [140, 600], C: [820, 600] }, drag = null;
    S.toggle("bis", "A'dan açıortay çiz", false);
    S.toggle("ext", "C'deki dış açıyı göster", false);
    S.button("Eşkenar yap", () => {
      P = { A: [480, 600 - 560 * Math.sqrt(3) / 2], B: [200, 600], C: [760, 600] };
    });
    S.button("İkizkenar yap", () => {
      P = { A: [480, 140], B: [220, 600], C: [740, 600] };
    });
    S.button("Dik yap", () => {
      P = { A: [200, 160], B: [200, 600], C: [800, 600] };
    });
    const D = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
    const ang = (p, q, r) => {
      const v1 = [q[0] - p[0], q[1] - p[1]], v2 = [r[0] - p[0], r[1] - p[1]];
      return Math.acos(clamp((v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2) || 1), -1, 1)) * 180 / Math.PI;
    };
    return {
      down(x, y) {
        const k = Object.keys(P).find((k2) => Math.hypot(P[k2][0] - x, P[k2][1] - y) < 60);
        if (k) {
          drag = k;
          return true;
        }
        return false;
      },
      move(x, y) {
        if (drag) P[drag] = [clamp(x, 40, 960), clamp(y, 40, 680)];
      },
      up() {
        drag = null;
      },
      draw() {
        const c = S.c, g = S.g, { A, B, C } = P;
        const a = D(B, C), b = D(A, C), cs = D(A, B), u = 60;
        const aA = ang(A, B, C), aB = ang(B, A, C), aC = 180 - aA - aB;
        g.fillStyle = "rgba(124,92,230,.12)";
        g.beginPath();
        g.moveTo(...A);
        g.lineTo(...B);
        g.lineTo(...C);
        g.closePath();
        g.fill();
        const eq = (x, y) => Math.abs(x - y) / Math.max(x, y) < 0.025;
        const sides = [[B, C, a, "a"], [A, C, b, "b"], [A, B, cs, "c"]];
        sides.forEach(([p, q, L, n]) => {
          const same = sides.some((s) => s[3] !== n && eq(s[2], L));
          S.line(p[0], p[1], q[0], q[1], same ? c.ok : c.ink, same ? 6 : 4);
        });
        const arc = (p, q, r, deg, col) => {
          const a1 = Math.atan2(q[1] - p[1], q[0] - p[0]), a2 = Math.atan2(r[1] - p[1], r[0] - p[0]);
          let d = a2 - a1;
          while (d > Math.PI) d -= 2 * Math.PI;
          while (d < -Math.PI) d += 2 * Math.PI;
          g.save();
          g.fillStyle = col;
          g.globalAlpha = 0.35;
          g.beginPath();
          g.moveTo(...p);
          g.arc(p[0], p[1], 52, a1, a1 + d, d < 0);
          g.closePath();
          g.fill();
          g.restore();
          const m = a1 + d / 2;
          if (Math.abs(deg - 90) < 1) {
          }
          S.text(nf(deg, 0) + "°", p[0] + Math.cos(m) * 90, p[1] + Math.sin(m) * 90, { size: 26, align: "center", base: "middle", weight: 900, color: col });
        };
        arc(A, B, C, aA, "#7C5CE6");
        arc(B, C, A, aB, "#3B82F6");
        arc(C, A, B, aC, "#F59E0B");
        if (S.vals.ext) {
          const E = [C[0] + (C[0] - B[0]) * 0.35, C[1] + (C[1] - B[1]) * 0.35];
          S.line(C[0], C[1], E[0], E[1], c.ink2, 3, [8, 6]);
          const a1 = Math.atan2(E[1] - C[1], E[0] - C[0]), a2 = Math.atan2(A[1] - C[1], A[0] - C[0]);
          let d = a2 - a1;
          while (d > Math.PI) d -= 2 * Math.PI;
          while (d < -Math.PI) d += 2 * Math.PI;
          g.save();
          g.strokeStyle = c.danger;
          g.lineWidth = 4;
          g.beginPath();
          g.arc(C[0], C[1], 34, a1, a1 + d, d < 0);
          g.stroke();
          g.restore();
          const m = a1 + d / 2;
          S.text(nf(180 - aC, 0) + "° = " + nf(aA, 0) + "° + " + nf(aB, 0) + "°", C[0] + Math.cos(m) * 70, C[1] + Math.sin(m) * 70 - 10, { size: 22, color: c.danger, weight: 900, align: Math.cos(m) < 0 ? "right" : "left" });
        }
        let bisR = null;
        if (S.vals.bis) {
          const Dp = [(b * B[0] + cs * C[0]) / (b + cs), (b * B[1] + cs * C[1]) / (b + cs)];
          S.line(A[0], A[1], Dp[0], Dp[1], c.danger, 4, [10, 8]);
          S.circle(Dp[0], Dp[1], 8, c.danger);
          S.text("D", Dp[0], Dp[1] + 34, { size: 26, color: c.danger, weight: 900, align: "center" });
          bisR = [D(B, Dp) / u, D(Dp, C) / u];
        }
        Object.entries(P).forEach(([k, p]) => {
          S.circle(p[0], p[1], 18, k === drag ? c.warn : c.brand, "#fff", 4);
          const cx = (A[0] + B[0] + C[0]) / 3, cy = (A[1] + B[1] + C[1]) / 3, dx = p[0] - cx, dy = p[1] - cy, l = Math.hypot(dx, dy) || 1;
          S.text(k, p[0] + dx / l * 40, p[1] + dy / l * 40, { size: 32, weight: 900, align: "center", base: "middle" });
        });
        sides.forEach(([p, q, L, n]) => {
          const mx2 = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, cx = (A[0] + B[0] + C[0]) / 3, cy = (A[1] + B[1] + C[1]) / 3, dx = mx2 - cx, dy = my - cy, l = Math.hypot(dx, dy) || 1;
          S.text(n + " = " + nf(L / u, 1), mx2 + dx / l * 34, my + dy / l * 34, { size: 22, align: "center", base: "middle", color: c.ink2, weight: 800 });
        });
        const all = eq(a, b) && eq(b, cs), two = eq(a, b) || eq(b, cs) || eq(a, cs);
        const mx = Math.max(aA, aB, aC), kind = Math.abs(mx - 90) < 1.2 ? "Dik" : mx > 90 ? "Geniş açılı" : "Dar açılı";
        const typ = all ? "Eşkenar" : two ? "İkizkenar" : "Çeşitkenar";
        S.text(nf(aA, 0) + "° + " + nf(aB, 0) + "° + " + nf(aC, 0) + "° = 180°", 500, 50, { size: 32, align: "center", weight: 900 });
        if (S.t < 5 && !drag) S.text("Köşeleri sürükle", 500, 700, { size: 22, align: "center", color: c.ink2 });
        S.kv([["Açılar", "A " + nf(aA, 0) + "°, B " + nf(aB, 0) + "°, C " + nf(aC, 0) + "°"], ["Toplam", "180°"], ["Kenarlara göre", typ, two ? "hl" : ""], ["Açılara göre", kind], bisR ? ["Açıortay", "|BD| / |DC| = " + nf(bisR[0] / bisR[1], 2) + ",  |AB| / |AC| = " + nf(cs / b, 2)] : null]);
      }
    };
  }
});
