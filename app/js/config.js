/* Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
 *
 * Sunucu ayarları. Bu anahtar "publishable" (herkese açık) türdedir; tarayıcıda görünmesi
 * güvenlidir, verileri satır düzeyi güvenlik kuralları korur (supabase/migrations).
 * Kendi kopyanı yayımlıyorsan buraya kendi Supabase projenin adresini ve anahtarını yaz.
 */
window.DO_CONFIG = {
  supabaseUrl: 'https://gwmetoexnklzdyzrvgdv.supabase.co',
  supabaseKey: 'sb_publishable_jwY5M8lzep4mvJoqUQQbzQ_scsnOrDK',
  // Görüntülü odalarda bağlantı kurmak için. Mobil veride bağlantı kurulamazsa
  // sunucudaki "turn" fonksiyonu aktarıcı (TURN) adreslerini ekler.
  iceServers: [
    { urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }
  ],
  maxVideoPeers: 8,
  // Supabase'de Google sağlayıcısı açılınca true yap.
  googleLogin: false,
  // Spotify geliştirici panelindeki uygulamanın Client ID'si (gizli değildir). Boş bırakırsan Spotify bağlantısı görünmez.
  spotifyClientId: '23f34cc2a19c4e0bb43c1a580462db92',
  // Telefon bildirimleri (Web Push) için VAPID açık anahtarı. Gizli eşi sunucuda (push fonksiyonu).
  vapidPublic: 'BDYiLMfucCBUq0F7H7nURoKQQnHrXE3KsKHgfXM_x-NkKrx378kXN8Pdc_faTZ4WY4p0MDofjeF9_A-_fufQ_qs'
};
