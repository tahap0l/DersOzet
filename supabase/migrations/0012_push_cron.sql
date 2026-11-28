-- Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
-- Bildirim gönderici: "push" Edge Function'ı her 10 dakikada bir çağrılır; günlük hatırlatmaları ve
-- hocanın yeni programlarını gönderir. Anahtarlar Vault'ta durur (koda girmez):
--   select vault.create_secret('<VAPID gizli>', 'vapid_private');
--   select vault.create_secret('<VAPID açık>',  'vapid_public');
--   select vault.create_secret('<rastgele>',    'push_cron');
-- VAPID anahtar çifti: npx web-push generate-vapid-keys. Açık anahtar app/js/config.js'te de yazar.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- yalnızca sunucu (service_role) okur
create function public.push_config() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_object_agg(name, decrypted_secret) from vault.decrypted_secrets where name in ('vapid_private', 'vapid_public', 'push_cron')
$$;
revoke execute on function public.push_config() from public, anon, authenticated;
grant execute on function public.push_config() to service_role;

select cron.schedule('push-tick', '*/10 * * * *', $cron$
  select net.http_post(
    url := 'https://gwmetoexnklzdyzrvgdv.supabase.co/functions/v1/push',
    headers := jsonb_build_object('content-type', 'application/json',
      'x-cron', (select decrypted_secret from vault.decrypted_secrets where name = 'push_cron')),
    body := '{"mode":"cron"}'::jsonb,
    timeout_milliseconds := 25000)
$cron$);

-- düzenleme (0013): is_my_student yalnızca giriş yapanlara; pg_net extensions şemasına
-- revoke execute on function public.is_my_student(uuid) from public, anon;
-- drop extension if exists pg_net; create extension pg_net with schema extensions;
