#!/bin/sh
# Eski telefonlar (iOS 12-14 Safari, güncellenmemiş Android Chrome) için uygulamanın çevrilmiş kopyası.
# Yeni tarayıcılar app/js'yi olduğu gibi kullanır; eski tarayıcıyı index.html'deki bekçi tanır ve app/legacy'yi yükler.
# Uygulama dosyalarını değiştirdikten sonra çalıştır:  sh tools/build-legacy.sh
set -e
cd "$(dirname "$0")/../app"
T=es2017,chrome63,safari12,firefox60,edge79
rm -rf legacy/js legacy/vendor   # polyfill.js elle yazılır, silinmez
npx -y esbuild@0.24.2 js/*.js --outdir=legacy/js --target=$T --charset=utf8 --log-level=error --legal-comments=inline --banner:js='/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0. Eski tarayıcılar için çevrilmiş kopya; kaynak app/js, üreten tools/build-legacy.sh */'
npx -y esbuild@0.24.2 vendor/supabase.min.js vendor/jspdf.umd.min.js --outdir=legacy/vendor --target=$T --charset=utf8 --minify --log-level=warning --legal-comments=inline
rm -f legacy/js/llm-worker.js legacy/js/config.js
grep -o "version: *'[0-9.]*'" js/core.js | head -1 > legacy/VERSION
echo "legacy hazır: $(cat legacy/VERSION)"
