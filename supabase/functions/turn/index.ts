// Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
//
// Görüntülü odalar için kısa ömürlü TURN (aktarıcı) bilgisi üretir.
// Mobil veride ya da okul ağlarında doğrudan bağlantı kurulamazsa ses ve görüntü
// Cloudflare'in aktarıcısı üzerinden geçer. Yalnızca giriş yapmış kullanıcılar çağırabilir.
// Gerekli gizli değerler: CF_TURN_KEY_ID, CF_TURN_KEY_TOKEN (Cloudflare > Realtime > TURN Server).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const id = Deno.env.get("CF_TURN_KEY_ID"), token = Deno.env.get("CF_TURN_KEY_TOKEN");
  if (!id || !token) return json({ iceServers: [] });
  try {
    const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${id}/credentials/generate-ice-servers`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ttl: 6 * 3600 }),
    });
    if (!r.ok) return json({ iceServers: [] });
    const j = await r.json();
    const list = Array.isArray(j.iceServers) ? j.iceServers : j.iceServers ? [j.iceServers] : [];
    // 53 numaralı port bazı tarayıcılarda engellidir; onu içeren adresleri ayıkla.
    const clean = list.map((s: { urls: string | string[] }) => ({ ...s, urls: ([] as string[]).concat(s.urls).filter((u) => !/:53\b/.test(u)) }))
      .filter((s: { urls: string[] }) => s.urls.length);
    return json({ iceServers: clean });
  } catch (_e) {
    return json({ iceServers: [] });
  }
});
