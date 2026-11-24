# Ders Özetim

YKS ve YDS'ye hazırlanan öğrenciler ve dershaneler için ücretsiz, açık kaynaklı bir çalışma uygulaması. Haftalık program, konu özetleri, ortak ders odaları, odak sayacı ve maskot Mürek tek yerde. Telefonda ve tablette tarayıcıdan açılır, ana ekrana uygulama olarak eklenir; internetsiz de çalışır, bağlanınca eşitlenir.

**Site:** https://dersozet.pages.dev · **Uygulama:** https://dersozet.pages.dev/app/

Geliştiren: **Esat Taha Polat** ([@tahap0l](https://github.com/tahap0l))

## Neler var

- **Hesap:** Google ya da e-postayla giriş. Program ve işaretler her cihazda aynı.
- **Bugün:** YKS'ye kalan gün, günlük seri, bugünkü görevler ve o günün konularını hatırlatan, konulardan soru soran maskot **Mürek**.
- **Dershane:** Hoca dershaneyi ve sınıfları kurar, sınıf kodunu öğrencilere verir, Excel programını ya da kendi yazdığı haftayı sınıfa veya tek öğrenciye gönderir ve ilerlemeyi görür. Program öğrencinin uygulamasına kendiliğinden düşer.
- **Odalar:** Dershane ya da kodla girilen arkadaş odalarında ortak odak sayacı, sohbet, isteğe bağlı ses ve görüntü (WebRTC). Şikâyet, sessize alma ve odadan çıkarma var.
- **Program:** Koçunun gönderdiği Excel programını yükle (birden fazla hafta aynı anda), görevlerini kendin yaz ya da düzenle. Görevler konu kitaplığıyla otomatik eşleşir.
- **Plan oluştur:** Derslerini, zorlandığın dersleri, günlük saatini ve günlerini seç; sana göre haftalık plan hazırlansın. Yapay zekâ gerekmez.
- **Kitaplık:** Hazır YKS konu özetleri (konu anlatımı, formüller, kavramlar, sık yapılan hatalar, çözümlü sorular). Türkçe karakter yazmadan arayabilirsin.
- **Odak:** Odak ve mola sayacı (25/5 ya da kendi sürelerin), kronometre, son 7 günün odak grafiği.
- **PDF:** Tek konuyu ya da haftanın programını konu özetleriyle birlikte A4 PDF olarak indir.
- **Profil:** Ad, alan, hedef, sınav tarihi, şehir, renk teması, dershane üyelikleri, hesabı silme.

## Yapay zekâ (isteğe bağlı, API anahtarı yok)

Uygulama yapay zekâ olmadan da tam çalışır. İstersen şu üç yoldan biriyle kişiye özel program ve yeni konu özetleri hazırlatabilirsin:

1. **Tarayıcının içinde (WebLLM):** Model cihazının ekran kartında çalışır. Kurulum ve anahtar yok; ilk seferde model indirilir (birkaç GB), sonra internetsiz çalışır. Chrome, Edge ya da iOS 26 ve sonrası Safari gerekir.
2. **Ollama:** Bilgisayarına ücretsiz [Ollama](https://ollama.com) kurduysan onun modellerini kullanır. Siteye izin vermek için Ollama'yı `OLLAMA_ORIGINS="https://senin-adresin" ollama serve` ile başlat.
3. **Başka bir yapay zekâ:** Uygulama hazır bir metin verir; ChatGPT, Gemini, Copilot ya da Claude'un ücretsiz sürümüne yapıştırıp yanıtı geri yapıştırırsın.

Küçük modeller hata yapabilir. Yapay zekâyla hazırlanan özetler uygulamada ayrıca belirtilir; önemli bilgileri ders kitabınla karşılaştır.

## Gizlilik

Programın ve özetlerin yalnızca senin hesabında durur. Sınıf arkadaşların ve hocaların yalnızca adını, hedefini ve hocanın gönderdiği programdaki ilerlemeni görür. Her tablo satır düzeyi güvenlik kurallarıyla korunur (`supabase/migrations`). Ses ve görüntü kaydedilmez; tarayıcılar arasında doğrudan gider. Hava durumu için sadece seçtiğin şehrin koordinatları [Open-Meteo](https://open-meteo.com)'ya gönderilir. Profil > Hesabımı sil ile her şey kalıcı olarak silinir.

## Sunucu (Supabase)

Hesaplar, dershaneler, odalar ve sohbet [Supabase](https://supabase.com) üzerinde çalışır (ücretsiz plan yeterli).

1. Supabase'de bir proje aç; `supabase/migrations` içindeki SQL dosyalarını sırayla çalıştır.
2. `supabase/functions/turn` fonksiyonunu yayımla. Mobil veride görüntülü bağlantı için Cloudflare Realtime'da bir TURN anahtarı oluşturup `CF_TURN_KEY_ID` ve `CF_TURN_KEY_TOKEN` gizli değerlerini ekle (isteğe bağlı).
3. Authentication > URL Configuration'da sitenin adresini ve `https://senin-adresin/**` yönlendirme adresini ekle; Google ile giriş için Google sağlayıcısını aç.
4. `app/js/config.js` içine projenin adresini ve publishable anahtarını yaz.

## Yayımlama (Cloudflare Pages)

Derleme adımı yoktur; dosyalar olduğu gibi yayımlanır.

1. Cloudflare panelinde **Workers & Pages > Create > Pages > Connect to Git** seç ve bu depoyu bağla.
2. Framework: **None**. Build command: boş bırak. Build output directory: `/`.
3. **Save and Deploy**. Her `git push` sonrasında site kendiliğinden güncellenir.

Ana adres tanıtım sitesini, `/app/` uygulamayı açar. `_headers` güvenlik ve önbellek başlıklarını, `404.html` bulunamayan sayfaları ayarlar. Yeni sürüm yayımlarken `app/sw.js` içindeki `VERSION` değerini artır ki kullanıcıların uygulaması güncellensin. ÖSYM 2027 YKS tarihini açıklayınca `site/site.js` ve `app/js/core.js` içindeki tahmini tarihi güncelle.

Uygulama bir PWA olduğu için [PWABuilder](https://www.pwabuilder.com) ile Microsoft Store ve Android paketleri hazırlanabilir.

## Yerelde çalıştırma

```bash
python3 -m http.server 8080
# tanıtım sitesi: http://localhost:8080  uygulama: http://localhost:8080/app/
```

## Proje yapısı

```
index.html                 tanıtım sitesi
site/                      sitenin stili, betiği, ekran görüntüleri ve paylaşım görseli
404.html, robots.txt, _headers
app/index.html             uygulama
app/css/app.css            tema ve görünüm (renk temaları dahil)
app/js/config.js           sunucu adresi ve herkese açık anahtar
app/js/core.js             Excel okuma, konu eşleştirme, veri deposu, seri, hızlı plan, hava durumu
app/js/cloud.js            giriş, buluta eşitleme, dershane üyelikleri, hocanın programları
app/js/school.js           dershane paneli
app/js/rooms.js            ders odaları: ortak sayaç, sohbet, ses ve görüntü
app/js/mascot.js           maskot Mürek
app/js/motivation.js       renk temaları, rozetler, günün sözü, hedefler
app/js/app.js              arayüz ve sayfalar
app/js/ai.js               WebLLM, Ollama ve Claude bağlantısı, istemler
app/js/llm-worker.js       modeli arka planda çalıştıran işçi
app/js/pdf.js              PDF oluşturma
app/data/library.json      konu özetleri kitaplığı
app/fonts/                 Bricolage Grotesque ve Nunito (SIL OFL 1.1)
app/vendor/                supabase-js, fflate, html2canvas, jsPDF
supabase/                  veritabanı şeması, güvenlik kuralları ve TURN fonksiyonu
app/sw.js, app/manifest.webmanifest, app/icons/   çevrimdışı çalışma ve uygulama olarak yükleme
```

## Katkı

Yeni bir konu özeti eklemek için `app/data/library.json` içinde `summaries` ve `topics` alanlarına `ders--konu` anahtarıyla bir kayıt ekle (mevcut kayıtları örnek al) ve bir pull request aç.

## Lisans

Copyright (C) 2026 Esat Taha Polat

Bu proje [GNU Affero General Public License v3.0](LICENSE) ile lisanslanmıştır. Kodu kullanabilir, değiştirebilir ve paylaşabilirsin; ancak değiştirdiğin sürümü yayımlarsan ya da bir web sitesinde sunarsan kaynak kodunu aynı lisansla açman ve bu telif bildirimini koruman gerekir.

Yazı tipleri: [Bricolage Grotesque](https://fonts.google.com/specimen/Bricolage+Grotesque) ve [Nunito](https://fonts.google.com/specimen/Nunito) (SIL Open Font License 1.1). Kullanılan açık kaynak kütüphaneler: [supabase-js](https://github.com/supabase/supabase-js) (MIT), [fflate](https://github.com/101arrowz/fflate) (MIT), [html2canvas](https://github.com/niklasvh/html2canvas) (MIT), [jsPDF](https://github.com/parallax/jsPDF) (MIT), [WebLLM](https://github.com/mlc-ai/web-llm) (Apache-2.0, yalnızca yapay zekâ açıldığında yüklenir).
