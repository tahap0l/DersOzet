-- Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
-- Sunucudaki yapay zekâ için günlük kullanım hakkı.
-- Cloudflare'daki /api/ai fonksiyonu her istekten önce, öğrencinin kendi oturum anahtarıyla
-- ai_take() çağırır: oturum geçerli değilse ya da günlük hak bittiyse istek modele gitmez.

create table public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default (now() at time zone 'Europe/Istanbul')::date,
  used int not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;
-- Doğrudan okuma/yazma yok; yalnızca aşağıdaki fonksiyonlar.

create function public.ai_limit() returns int
language sql stable security definer set search_path = '' as $$
  select case when public.is_app_admin() then 1000 else 60 end
$$;

-- cost kadar hak düşer. Yetmezse hiçbir şey değişmez ve ok=false döner.
create function public.ai_take(cost int default 1) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me uuid := (select auth.uid()); lim int; n int; today date := (now() at time zone 'Europe/Istanbul')::date;
begin
  if me is null then raise exception 'not_signed_in' using errcode = '28000'; end if;
  cost := greatest(1, least(coalesce(cost, 1), 10));
  lim := public.ai_limit();
  insert into public.ai_usage as u (user_id, day, used) values (me, today, cost)
    on conflict (user_id, day) do update set used = u.used + cost where u.used + cost <= lim
    returning used into n;
  if n is null then
    select used into n from public.ai_usage where user_id = me and day = today;
    return jsonb_build_object('ok', false, 'used', coalesce(n, 0), 'limit', lim);
  end if;
  return jsonb_build_object('ok', true, 'used', n, 'limit', lim);
end $$;

-- Model hata verirse düşülen hak geri verilir.
create function public.ai_refund(cost int default 1) returns void
language sql security definer set search_path = '' as $$
  update public.ai_usage set used = greatest(0, used - greatest(1, least(coalesce(cost, 1), 10)))
  where user_id = (select auth.uid()) and day = (now() at time zone 'Europe/Istanbul')::date
$$;

create function public.ai_left() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('used', coalesce((select used from public.ai_usage where user_id = (select auth.uid()) and day = (now() at time zone 'Europe/Istanbul')::date), 0), 'limit', public.ai_limit())
$$;

revoke execute on function public.ai_limit(), public.ai_take(int), public.ai_refund(int), public.ai_left() from public, anon;
grant execute on function public.ai_limit(), public.ai_take(int), public.ai_refund(int), public.ai_left() to authenticated;
