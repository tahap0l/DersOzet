/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0. Eski tarayıcılar için çevrilmiş kopya; kaynak app/js, üreten tools/build-legacy.sh */
"use strict";
const MUF = {
  TYT: {
    "Türkçe": ["Sözcükte Anlam", "Cümlede Anlam", "Paragraf", "Ses Bilgisi", "Yazım Kuralları", "Noktalama İşaretleri", "Sözcük Yapısı", "İsimler", "Sıfatlar", "Zamirler", "Zarflar", "Edat, Bağlaç, Ünlem", "Fiiller ve Ek Fiil", "Fiilimsiler", "Fiil Çatısı", "Cümlenin Ögeleri", "Cümle Türleri", "Anlatım Bozuklukları"],
    "Matematik": ["Temel Kavramlar", "Sayı Basamakları", "Bölme ve Bölünebilme", "EBOB ve EKOK", "Rasyonel Sayılar", "Basit Eşitsizlikler", "Mutlak Değer", "Üslü Sayılar", "Köklü Sayılar", "Çarpanlara Ayırma", "Oran ve Orantı", "Denklem Çözme", "Sayı Problemleri", "Kesir Problemleri", "Yaş Problemleri", "Yüzde, Kâr ve Zarar Problemleri", "Karışım Problemleri", "Hareket Problemleri", "İşçi ve Havuz Problemleri", "Grafik Problemleri", "Kümeler", "Mantık", "Fonksiyonlar", "Polinomlar", "İkinci Dereceden Denklemler", "Permütasyon", "Kombinasyon", "Olasılık", "Veri ve İstatistik"],
    "Geometri": ["Doğruda ve Üçgende Açılar", "Dik Üçgen ve Pisagor", "Özel Üçgenler", "Açıortay ve Kenarortay", "Üçgende Alan", "Üçgende Benzerlik", "Açı ve Kenar Bağıntıları", "Çokgenler", "Dörtgenler", "Yamuk", "Paralelkenar", "Eşkenar Dörtgen", "Dikdörtgen ve Kare", "Çember ve Daire", "Noktanın ve Doğrunun Analitiği", "Katı Cisimler"],
    "Fizik": ["Fizik Bilimine Giriş", "Madde ve Özellikleri", "Hareket ve Kuvvet", "İş, Güç ve Enerji", "Isı ve Sıcaklık", "Elektrostatik", "Elektrik Akımı ve Devreler", "Manyetizma", "Basınç", "Kaldırma Kuvveti", "Dalgalar", "Optik"],
    "Kimya": ["Kimya Bilimi", "Atom ve Periyodik Sistem", "Kimyasal Türler Arası Etkileşimler", "Maddenin Halleri", "Doğa ve Kimya", "Kimyanın Temel Kanunları", "Mol Kavramı", "Kimyasal Tepkimeler", "Karışımlar", "Asitler, Bazlar ve Tuzlar", "Kimya Her Yerde"],
    "Biyoloji": ["Canlıların Ortak Özellikleri", "Canlıların Temel Bileşenleri", "Hücre ve Organeller", "Hücre Zarından Madde Geçişi", "Canlıların Sınıflandırılması", "Mitoz ve Eşeysiz Üreme", "Mayoz ve Eşeyli Üreme", "Kalıtım", "Ekosistem Ekolojisi", "Güncel Çevre Sorunları"],
    "Tarih": ["Tarih ve Zaman", "İlk Çağ Uygarlıkları", "İlk Türk Devletleri", "İslam Tarihi ve Uygarlığı", "Türk-İslam Devletleri", "Türkiye Selçuklu Devleti", "Osmanlı Kuruluş Dönemi", "Osmanlı Yükselme Dönemi", "Osmanlı Kültür ve Medeniyeti", "Değişen Dünya Dengeleri", "Osmanlı Dağılma Dönemi", "20. Yüzyıl Başında Osmanlı", "Milli Mücadele", "Atatürk İlke ve İnkılapları"],
    "Coğrafya": ["Doğa ve İnsan", "Dünya'nın Şekli ve Hareketleri", "Harita Bilgisi", "Coğrafi Konum", "Atmosfer ve İklim", "İç ve Dış Kuvvetler", "Su, Toprak ve Bitki", "Nüfus", "Göç", "Yerleşme", "Türkiye'nin Yer Şekilleri", "Ekonomik Faaliyetler", "Bölgeler ve Ülkeler", "Doğal Afetler"],
    "Felsefe": ["Felsefeyi Tanıma", "Bilgi Felsefesi", "Varlık Felsefesi", "Ahlak Felsefesi", "Sanat Felsefesi", "Din Felsefesi", "Siyaset Felsefesi", "Bilim Felsefesi"],
    "Din Kültürü": ["Bilgi ve İnanç", "Din ve İslam", "İslam ve İbadet", "Gençlik ve Değerler", "Hz. Muhammed", "Allah İnsan İlişkisi"]
  },
  AYT: {
    "Matematik": ["Fonksiyonlar", "Polinomlar", "İkinci Dereceden Eşitsizlikler", "Parabol", "Trigonometri", "Logaritma", "Diziler", "Limit ve Süreklilik", "Türev", "Türevin Uygulamaları", "İntegral", "Belirli İntegral ve Alan", "Permütasyon, Kombinasyon, Binom", "Olasılık", "Karmaşık Sayılar"],
    "Geometri": ["Doğrunun Analitiği", "Dönüşümler", "Çemberin Analitiği", "Çember ve Daire", "Katı Cisimler"],
    "Fizik": ["Vektörler", "Bağıl Hareket", "Newton'un Hareket Yasaları", "Sabit İvmeli Hareket", "Atışlar", "İş, Enerji ve Korunum", "İtme ve Momentum", "Tork ve Denge", "Kütle Merkezi", "Basit Makineler", "Elektrik Alan ve Potansiyel", "Sığaçlar", "Manyetik Alan ve Kuvvet", "İndüksiyon ve Alternatif Akım", "Transformatörler", "Düzgün Çembersel Hareket", "Basit Harmonik Hareket", "Dalga Mekaniği", "Atom Fiziği", "Özel Görelilik", "Kuantum ve Fotoelektrik Olay", "Modern Fiziğin Uygulamaları"],
    "Kimya": ["Modern Atom Teorisi", "Gazlar", "Sıvı Çözeltiler ve Çözünürlük", "Tepkimelerde Enerji", "Tepkime Hızı", "Kimyasal Denge", "Asit-Baz Dengesi", "Çözünürlük Dengesi", "Elektrokimya", "Karbon Kimyasına Giriş", "Organik Bileşikler", "Enerji Kaynakları"],
    "Biyoloji": ["Sinir Sistemi", "Endokrin Sistem", "Duyu Organları", "Destek ve Hareket Sistemi", "Sindirim Sistemi", "Dolaşım ve Bağışıklık", "Solunum Sistemi", "Boşaltım Sistemi", "Üreme Sistemi ve Gelişim", "Komünite ve Popülasyon Ekolojisi", "Nükleik Asitler ve Protein Sentezi", "Genetik Şifre ve Biyoteknoloji", "Fotosentez ve Kemosentez", "Hücresel Solunum", "Bitki Biyolojisi", "Canlılar ve Çevre"],
    "Edebiyat": ["Anlam Bilgisi ve Şiir Bilgisi", "Edebi Sanatlar", "Nazım Biçimleri ve Türleri", "İslamiyet Öncesi Türk Edebiyatı", "Geçiş Dönemi Edebiyatı", "Halk Edebiyatı", "Divan Edebiyatı", "Tanzimat Edebiyatı", "Servet-i Fünun", "Fecr-i Ati", "Milli Edebiyat", "Cumhuriyet Dönemi Şiiri", "Cumhuriyet Dönemi Roman ve Hikâye", "Tiyatro", "Edebi Akımlar", "Düzyazı Türleri"],
    "Tarih": ["Tarih Bilimi", "Türk-İslam Tarihi", "Osmanlı Siyasi Tarihi", "Osmanlı Kültür ve Medeniyeti", "En Uzun Yüzyıl", "20. Yüzyıl Başlarında Osmanlı", "Kurtuluş Savaşı", "Atatürk Dönemi İç ve Dış Politika", "II. Dünya Savaşı", "Soğuk Savaş Dönemi", "Yumuşama Dönemi", "Küreselleşen Dünya"],
    "Coğrafya": ["Ekosistemler", "Nüfus Politikaları", "Türkiye'de Nüfus ve Yerleşme", "Ekonomik Faaliyetler ve Doğal Kaynaklar", "Türkiye Ekonomisi", "Türkiye'nin İşlevsel Bölgeleri", "Küresel Ticaret", "Bölgeler ve Ülkeler", "Çevre ve Toplum", "Doğal Afetler"],
    "Felsefe": ["Klasik Mantık", "Sembolik Mantık", "Psikolojinin Temel Süreçleri", "Öğrenme, Bellek, Düşünme", "Ruh Sağlığı", "Birey ve Toplum", "Toplumsal Kurumlar", "Kültür ve Toplumsal Değişme", "Felsefe Tarihi"],
    "Din Kültürü": ["Dünya ve Ahiret", "Kur'an'a Göre Hz. Muhammed", "İnançla İlgili Meseleler", "Yahudilik ve Hristiyanlık", "İslam Düşüncesinde Yorumlar", "Anadolu'da İslam"]
  },
  YDT: {
    "İngilizce": ["Kelime Bilgisi", "Dil Bilgisi", "Cloze Test", "Cümle Tamamlama", "İngilizceden Türkçeye Çeviri", "Türkçeden İngilizceye Çeviri", "Okuduğunu Anlama", "Diyalog Tamamlama", "Anlamca En Yakın Cümle", "Paragraf Tamamlama", "Anlam Bütünlüğünü Bozan Cümle"]
  }
};
const MUF_TRACK = {
  SAY: { AYT: ["Matematik", "Geometri", "Fizik", "Kimya", "Biyoloji"] },
  EA: { AYT: ["Matematik", "Geometri", "Edebiyat", "Tarih", "Coğrafya"] },
  SOZ: { AYT: ["Edebiyat", "Tarih", "Coğrafya", "Felsefe", "Din Kültürü"] },
  DIL: { YDT: ["İngilizce"] },
  TYT: {}
};
function mufList(track) {
  const t = MUF_TRACK[track] || MUF_TRACK.SAY, out = [];
  Object.keys(MUF.TYT).forEach((s) => out.push({ exam: "TYT", subject: s, topics: MUF.TYT[s] }));
  Object.keys(t).forEach((ex) => t[ex].forEach((s) => out.push({ exam: ex, subject: s, topics: MUF[ex][s] })));
  return out.map((g) => Object.assign(g, { topics: g.topics.map((n) => ({ id: slugify(g.exam + " " + g.subject + " " + n), name: n })) }));
}
