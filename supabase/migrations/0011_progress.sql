-- Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
-- İlerleme: deneme sonuçları, haftalık özet (sıralama ve hoca raporu için) ve telefon bildirimleri.
--  - exams: öğrencinin girdiği deneme netleri. Kendisi ve dershanedeki hocaları görür.
--  - weekly_stats: haftanın odak dakikası, biten görev, aktif gün, seri. Uygulama kendisi yazar.
--  - leaderboard(): aynı sınıftaki ve aynı arkadaş odasındaki öğrencilerin haftalık sıralaması.
--    Profilde "sıralamada görünme" seçilirse başkaları görmez (hocalar raporda yine görür).
--  - push_subs: bildirim aboneliği (cihaz başına). Gönderimi "push" Edge Function'ı yapar.

create table public.exams (
  id uuid primary key,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  taken_on date not null,
  kind text not null check (kind in ('TYT', 'AYT', 'YDT')),
  name text not null default '' check (char_length(name) <= 80),
  nets jsonb not null default '{}'::jsonb check (jsonb_typeof(nets) = 'object' and pg_column_size(nets) < 8000),
  total numeric(6, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.exams (user_id, taken_on desc);

create table public.weekly_stats (
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  week_start date not null,
  focus_min int not null default 0 check (focus_min between 0 and 10080),
  tasks_done int not null default 0 check (tasks_done between 0 and 2000),
  tasks_total int not null default 0 check (tasks_total between 0 and 2000),
  active_days int not null default 0 check (active_days between 0 and 7),
  streak int not null default 0 check (streak between 0 and 5000),
  topics_done int not null default 0 check (topics_done between 0 and 2000),
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

alter table public.profiles add column rank_hidden boolean not null default false;

create trigger exams_touch before update on public.exams for each row execute function public.touch_updated_at();
create trigger weekly_touch before update on public.weekly_stats for each row execute function public.touch_updated_at();

-- bu öğrenci, giriş yapan hocanın (ya da kurucunun) dershanesinde mi
create function public.is_my_student(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.memberships a join public.memberships b on a.institution_id = b.institution_id
                 where a.user_id = (select auth.uid()) and a.role in ('owner', 'teacher') and b.user_id = pid)
$$;

alter table public.exams enable row level security;
alter table public.weekly_stats enable row level security;
create policy "deneme: kendisi ve hocaları görür" on public.exams for select to authenticated
  using (user_id = (select auth.uid()) or public.is_my_student(user_id));
create policy "deneme: kendi denemesini ekler" on public.exams for insert to authenticated with check (user_id = (select auth.uid()));
create policy "deneme: kendi denemesini düzenler" on public.exams for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "deneme: kendi denemesini siler" on public.exams for delete to authenticated using (user_id = (select auth.uid()));
create policy "hafta: kendisi ve hocaları görür" on public.weekly_stats for select to authenticated
  using (user_id = (select auth.uid()) or public.is_my_student(user_id));
create policy "hafta: kendi haftasını yazar" on public.weekly_stats for insert to authenticated with check (user_id = (select auth.uid()));
create policy "hafta: kendi haftasını günceller" on public.weekly_stats for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- bir hesap en fazla 400 deneme
create function public.exams_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.exams where user_id = new.user_id) >= 400 then
    raise exception 'En fazla 400 deneme kaydedebilirsin.' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke execute on function public.exams_limit() from public, anon, authenticated;
create trigger exams_limit before insert on public.exams for each row execute function public.exams_limit();

-- haftalık sıralama: aynı sınıftaki öğrenciler ve aynı arkadaş odasındakiler
create function public.leaderboard(p_week date) returns table (user_id uuid, name text, focus_min int, tasks_done int, streak int, me boolean, in_class boolean, in_room boolean)
language sql stable security definer set search_path = '' as $$
  with peers as (
    select b.user_id, true as c, false as r
      from public.memberships a join public.memberships b
        on a.institution_id = b.institution_id and a.class_id is not null and b.class_id = a.class_id and b.role = 'student'
     where a.user_id = (select auth.uid()) and a.role = 'student'
    union all
    select m2.user_id, false, true
      from public.room_members m1 join public.rooms r on r.id = m1.room_id and r.kind = 'private'
      join public.room_members m2 on m2.room_id = m1.room_id and not m2.banned
     where m1.user_id = (select auth.uid()) and not m1.banned
    union all
    select (select auth.uid()), false, false
  ), p as (
    select peers.user_id, bool_or(c) as c, bool_or(r) as r from peers group by peers.user_id
  )
  select p.user_id, pr.name, coalesce(ws.focus_min, 0), coalesce(ws.tasks_done, 0), coalesce(ws.streak, 0),
         p.user_id = (select auth.uid()), p.c, p.r
    from p join public.profiles pr on pr.id = p.user_id
    left join public.weekly_stats ws on ws.user_id = p.user_id and ws.week_start = p_week
   where (select auth.uid()) is not null
     and (p.user_id = (select auth.uid()) or (not pr.rank_hidden and pr.kind = 'student'))
   order by coalesce(ws.focus_min, 0) desc, pr.name
   limit 60
$$;
revoke execute on function public.leaderboard(date) from public, anon;
grant execute on function public.leaderboard(date) to authenticated;

-- bildirim abonelikleri
create table public.push_subs (
  endpoint text primary key check (char_length(endpoint) < 1000),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  p256dh text not null check (char_length(p256dh) < 200),
  auth text not null check (char_length(auth) < 100),
  remind_at text check (remind_at ~ '^[0-2][0-9]:[0-5][0-9]$'),
  programs boolean not null default true,
  last_daily date,
  fails int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.push_subs (user_id);
alter table public.push_subs enable row level security;
create policy "bildirim: kendi aboneliği" on public.push_subs for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- hocanın gönderdiği program bildirildi mi
alter table public.programs add column notified_at timestamptz;
