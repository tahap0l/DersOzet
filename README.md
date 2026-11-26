# Ders Özetim

YKS ve YDS'ye hazırlanan öğrenciler ve dershaneler için ücretsiz, açık kaynaklı bir çalışma uygulaması. Haftalık program, konu özetleri, ortak ders odaları, odak sayacı ve maskot Mürek tek yerde. Telefonda ve tablette tarayıcıdan açılır, ana ekrana uygulama olarak eklenir; internetsiz de çalışır, bağlanınca eşitlenir.

**Site:** https://dersozet.pages.dev · **Uygulama:** https://dersozet.pages.dev/app/

Geliştiren: **Esat Taha Polat** ([@tahap0l](https://github.com/tahap0l))

## Neler var

- **Hesap:** Google ya da e-postayla giriş. Program ve işaretler her cihazda aynı.
- **Bugün:** YKS'ye kalan gün, günlük seri, bugünkü görevler ve o günün konularını hatırlatan, konulardan soru soran maskot **Mürek**.
- **Hoca ya da öğrenci:** İlk açılışta seçilir. Hocaya sınıf ve alan sorulmaz; adının yanında branşı yazar. Hocanın Bugün sayfasında dershaneleri, sınıfların bu haftaki ilerlemesi ve derste kullanacağı araçlar (laboratuvar, konu özetleri, ders odaları) bulunur. Dershane kuran ya da hoca koduyla katılan hesap kendiliğinden hoca olur.
- **Dershane:** Hoca dershaneyi ve sınıfları kurar, sınıf kodunu öğrencilere verir, Excel programını ya da kendi yazdığı haftayı sınıfa veya tek öğrenciye gönderir ve ilerlemeyi görür. Program öğrencinin uygulamasına kendiliğinden düşer.
- **Odalar:** Dershane ya da kodla girilen arkadaş odalarında ortak odak sayacı, sohbet, isteğe bağlı ses ve görüntü (WebRTC). Şikâyet, sessize alma ve odadan çıkarma var. Odadan başka sayfaya geçince bağlantı kopmaz; üstteki şeritten mikrofonu açıp kapatabilir, odaya dönebilir ya da çıkabilirsin.
- **Program:** Koçunun gönderdiği Excel programını yükle (birden fazla hafta aynı anda), görevlerini kendin yaz ya da düzenle. Görevler konu kitaplığıyla otomatik eşleşir.
- **Kişiye özel program:** Derslerdeki seviyeni, hafta içi ve hafta sonu boş zamanını, dershane günlerini ve deneme sayısını seç. Yanlış defterin ve son haftalarda bitirdiğin konular da hesaba katılır; yapay zekâ programı neden böyle kurduğunu da anlatır. Yapay zekâsız Hızlı plan da aynı bilgileri kullanır.
- **Konu videoları:** Program hazırlanınca her konuya YouTube'dan yeni ve çok izlenen bir konu anlatımı eklenir (Shorts ve çok eski videolar elenir). Profil > YouTube hocaların'dan her ders için en fazla 3 kanal seçersen önce onların videoları gelir. Görevdeki "YouTube'da izle" düğmesi videoyu doğrudan açar; dershaneden gelen izleme görevlerinde "YouTube'da aç" videoyu bulup açar. Arama API anahtarsız çalışır (`functions/api/yt.js`).
- **Soru sor:** Asistan'da Mürek'e yazıyla ya da sorunun fotoğrafını çekerek soru sor; çözüm adım adım, yazılırken ekrana akar.
- **Kitaplık:** Hazır YKS konu özetleri (konu anlatımı, formüller, kavramlar, sık yapılan hatalar, çözümlü sorular). Türkçe karakter yazmadan arayabilirsin.
- **Odak:** Odak ve mola sayacı (25/5 ya da kendi sürelerin), kronometre, son 7 günün odak grafiği. Sayaç ve kronometre hesapta durur; telefonda ve bilgisayarda aynı anda akar.
- **Laboratuvar:** Konulara bağlı 20 dokunmatik deney ve animasyon. Fizik (kaldırma kuvveti, sıvı, katı ve gaz basıncı, enerjinin korunumu, ısı alışverişi, yoğunluk), kimya (maddenin halleri, iyonik ve kovalent bağ, molekül şekilleri, periyodik sistem, zayıf etkileşimler), biyoloji (enzimler), matematik (mutlak değer, EBOB-EKOK, denklem terazisi, kesirler, asal sayı kalburu) ve geometri (Pisagor ve Öklid, üçgende açılar ve açıortay). Konu özetinin başında ve Mürek'in günlük mesajında o konunun deneyi çıkar.
- **Defter:** Not defteri (yazı ve kalemle çizim; çizgili, kareli, noktalı kâğıt; kalem basıncı, fosforlu kalem, silgi, geri al) ve yanlış defteri (sorunun fotoğrafı, ders/konu, yanlış nedeni, üstüne çözüm, 1-3-7-14-30 gün aralıklı tekrar). Hepsi hesapta; internet yokken yazılanlar bağlanınca gönderilir.
- **Ana ekrana ekle:** iPhone, iPad, Android ve bilgisayar için cihazı tanıyan adım adım rehber; destekleyen tarayıcıda tek dokunuşla yükleme.
- **Müzik ve video:** YouTube'daki ders videosunu ya da Spotify listesini uygulamanın içinde aç; oynatıcı sayfa değişince de çalmaya devam eder. Spotify hesabını bağlayınca listelerin, arama, çalan şarkı, başlat/durdur/sonraki, ses ve cihaz seçimi uygulamadan yönetilir; bilgisayarda müzik doğrudan uygulamanın içinde çalabilir (Spotify Premium gerekir; geliştirme modunda en fazla 5 hesap). Kendi kopyanda `app/js/config.js` içindeki `spotifyClientId`'yi kendi Spotify uygulamanla değiştir.
- **Yönetici paneli:** Kullanıcılar, dershaneler, odalar ve şikâyetler; mesaj silme, oda kapatma, kullanıcı engelleme. Yalnızca `app_admins` tablosundaki hesaplar açabilir.
- **PDF:** Tek konuyu ya da haftanın programını konu özetleriyle birlikte A4 PDF olarak indir.
- **Profil:** Ad, alan, hedef, sınav tarihi, şehir, renk teması, dershane üyelikleri, hesabı silme.

## Yapay zekâ (API anahtarı yok)

Varsayılan olarak **Ders Özetim yapay zekâsı** kullanılır: model sitenin kendi sunucusunda, Cloudflare Workers AI üzerinde çalışır (Google Gemma 4). Öğrenci hiçbir şey indirmez, kurmaz, anahtar girmez; hesabıyla giriş yapması yeter. Fotoğraflı soru çözer. Her öğrencinin günlük 60 kullanım hakkı vardır (fotoğraflı ve adım adım çözümler 2-3 hak sayılır). Kod: `functions/api/ai.js`, kota: `supabase/migrations/0006_ai_usage.sql`, bağlantı: `wrangler.toml`.

Ayarlar > Gelişmiş seçeneklerde şunlar da var:

1. **Tarayıcının içinde (WebLLM):** Model cihazın ekran kartında çalışır; ilk seferde birkaç GB indirilir. Güçlü bilgisayarlar içindir, çoğu telefonda çalışmaz.
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
app/js/media.js            YouTube ve Spotify oynatıcı
app/js/spotify.js          Spotify hesabı bağlama ve çalma kumandası
app/js/notes.js            not defteri, yanlış defteri, kalemle çizim, aralıklı tekrar
app/js/install.js          ana ekrana ekleme rehberi
app/js/lab.js              laboratuvar: deney çerçevesi (tuval, kaydırıcılar, dokunma)
app/js/sims-*.js           fizik, kimya-biyoloji, matematik-geometri deneyleri
app/js/admin.js            yönetici paneli
app/js/motivation.js       renk temaları, rozetler, günün sözü, hedefler
app/js/app.js              arayüz ve sayfalar
app/js/ai.js               sunucu yapay zekâsı, WebLLM, Ollama ve Claude bağlantısı, istemler
app/js/chat.js             Asistan > Soru sor (yazılı ve fotoğraflı soru)
app/js/plan.js             kişiye özel haftalık program
functions/api/ai.js        Cloudflare Workers AI'a giden sunucu fonksiyonu
functions/api/yt.js        YouTube'da konu videosu arayan sunucu fonksiyonu
app/js/youtube.js          görevlere video, hoca seçimi
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
