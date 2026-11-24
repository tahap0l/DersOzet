-- Ders Özetim — veritabanı şeması
-- Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
--
-- Hesaplar, dershaneler, sınıflar, hocanın yüklediği programlar, ders odaları,
-- oda sohbeti ve şikâyetler. Tüm tablolarda satır düzeyi güvenlik (RLS) açıktır;
-- kodla katılma ve oluşturma işlemleri aşağıdaki fonksiyonlarla yapılır.

-- ───────────────────────── tablolar ─────────────────────────

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default '' check (char_length(name) <= 40),
  track text not null default 'say' check (track in ('say','ea','soz','dil')),
  goal text not null default '' check (char_length(goal) <= 80),
  palette text not null default 'lavanta' check (char_length(palette) <= 20),
  created_at timestamptz not null default now()
);

create table public.user_state (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  check (pg_column_size(data) < 2000000)
);

create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  created_by uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now()
);
create index on public.classes (institution_id);

create table public.memberships (
  institution_id uuid not null references public.institutions on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null check (role in ('owner','teacher','student')),
  class_id uuid references public.classes on delete set null,
  joined_at timestamptz not null default now(),
  primary key (institution_id, user_id)
);
create index on public.memberships (user_id);
create index on public.memberships (class_id);

-- Davet kodları yalnızca dershane yöneticileri ve hocalar tarafından görülür.
create table public.invite_codes (
  code text primary key,
  institution_id uuid not null references public.institutions on delete cascade,
  class_id uuid references public.classes on delete cascade,
  role text not null check (role in ('teacher','student')),
  created_at timestamptz not null default now(),
  check ((role = 'student') = (class_id is not null))
);
create index on public.invite_codes (institution_id);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions on delete cascade,
  class_id uuid references public.classes on delete cascade,
  student_id uuid references auth.users on delete cascade,
  week_start date not null,
  title text not null default '' check (char_length(title) <= 120),
  tasks jsonb not null default '[]'::jsonb check (jsonb_typeof(tasks) = 'array' and pg_column_size(tasks) < 500000),
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (class_id is not null or student_id is not null)
);
create index on public.programs (institution_id, week_start);
create index on public.programs (class_id);
create index on public.programs (student_id);

create table public.program_progress (
  program_id uuid not null references public.programs on delete cascade,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  done jsonb not null default '{}'::jsonb check (pg_column_size(done) < 100000),
  updated_at timestamptz not null default now(),
  primary key (program_id, user_id)
);
create index on public.program_progress (user_id);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  kind text not null check (kind in ('class','private')),
  institution_id uuid references public.institutions on delete cascade,
  class_id uuid references public.classes on delete cascade,
  code text unique,
  created_by uuid not null references auth.users on delete cascade,
  timer jsonb not null default '{}'::jsonb check (pg_column_size(timer) < 4000),
  closed boolean not null default false,
  created_at timestamptz not null default now(),
  last_active timestamptz not null default now(),
  check ((kind = 'class' and institution_id is not null) or (kind = 'private' and code is not null))
);
create index on public.rooms (institution_id);
create index on public.rooms (created_by);

create table public.room_members (
  room_id uuid not null references public.rooms on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null default 'member' check (role in ('host','member')),
  banned boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);
create index on public.room_members (user_id);

create table public.messages (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.rooms on delete cascade,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  body text not null check (char_length(btrim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);
create index on public.messages (room_id, created_at desc);
create index on public.messages (user_id);

create table public.reports (
  id bigint generated always as identity primary key,
  room_id uuid references public.rooms on delete set null,
  reporter uuid not null references auth.users on delete cascade default auth.uid(),
  reported uuid references auth.users on delete set null,
  message_id bigint references public.messages on delete set null,
  reason text not null default '' check (char_length(reason) <= 300),
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now()
);
create index on public.reports (room_id);
create index on public.reports (reporter);
create index on public.reports (reported);

-- ───────────────────────── yardımcı fonksiyonlar ─────────────────────────

create function public.gen_code(n int default 6) returns text
language sql volatile set search_path = '' as $$
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1), '')
  from generate_series(1, n)
$$;

create function public.is_member(inst uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.memberships m where m.institution_id = inst and m.user_id = (select auth.uid()))
$$;

create function public.is_staff(inst uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.memberships m
                 where m.institution_id = inst and m.user_id = (select auth.uid()) and m.role in ('owner','teacher'))
$$;

create function public.my_class(inst uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select m.class_id from public.memberships m where m.institution_id = inst and m.user_id = (select auth.uid())
$$;

create function public.can_access_room(rid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.rooms r
    where r.id = rid and not r.closed
      and not exists (select 1 from public.room_members b where b.room_id = r.id and b.user_id = (select auth.uid()) and b.banned)
      and (
        exists (select 1 from public.room_members rm where rm.room_id = r.id and rm.user_id = (select auth.uid()))
        or (r.kind = 'class' and exists (
              select 1 from public.memberships m
              where m.institution_id = r.institution_id and m.user_id = (select auth.uid())
                and (r.class_id is null or m.class_id = r.class_id or m.role in ('owner','teacher'))))
      )
  )
$$;

create function public.is_room_mod(rid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.rooms r
    where r.id = rid and (
      r.created_by = (select auth.uid())
      or (r.kind = 'class' and exists (select 1 from public.memberships m
            where m.institution_id = r.institution_id and m.user_id = (select auth.uid()) and m.role in ('owner','teacher')))
    )
  )
$$;

create function public.can_see_profile(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select pid = (select auth.uid())
    or exists (select 1 from public.memberships a join public.memberships b on a.institution_id = b.institution_id
               where a.user_id = (select auth.uid()) and b.user_id = pid)
    or exists (select 1 from public.room_members a join public.room_members b on a.room_id = b.room_id
               where a.user_id = (select auth.uid()) and b.user_id = pid)
$$;

create function public.can_see_program(pid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.programs p join public.memberships m on m.institution_id = p.institution_id
    where p.id = pid and m.user_id = (select auth.uid())
      and (m.role in ('owner','teacher') or p.student_id = m.user_id or (p.class_id is not null and p.class_id = m.class_id))
  )
$$;

create function public.topic_room(t text) returns uuid
language sql immutable set search_path = '' as $$
  select case when t ~ '^room:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then substr(t, 6)::uuid end
$$;

-- ───────────────────────── tetikleyiciler ─────────────────────────

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name)
  values (new.id, left(coalesce(nullif(new.raw_user_meta_data->>'full_name', ''),
                                nullif(new.raw_user_meta_data->>'name', ''),
                                split_part(coalesce(new.email, ''), '@', 1)), 40))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
create trigger user_state_touch before update on public.user_state for each row execute function public.touch_updated_at();
create trigger programs_touch before update on public.programs for each row execute function public.touch_updated_at();
create trigger progress_touch before update on public.program_progress for each row execute function public.touch_updated_at();

-- Sohbette art arda çok mesajı engeller (10 saniyede en fazla 8).
create function public.message_rate_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.messages
      where user_id = new.user_id and created_at > now() - interval '10 seconds') >= 8 then
    raise exception 'Çok hızlı yazıyorsun, biraz bekle.' using errcode = 'P0001';
  end if;
  update public.rooms set last_active = now() where id = new.room_id;
  return new;
end $$;
create trigger messages_rate before insert on public.messages for each row execute function public.message_rate_limit();

-- ───────────────────────── işlemler (RPC) ─────────────────────────

create function public.create_institution(p_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'Giriş yapmalısın.'; end if;
  if (select count(*) from public.institutions where created_by = v_uid) >= 5 then
    raise exception 'En fazla 5 dershane oluşturabilirsin.';
  end if;
  insert into public.institutions (name, created_by) values (btrim(p_name), v_uid) returning id into v_id;
  insert into public.memberships (institution_id, user_id, role) values (v_id, v_uid, 'owner');
  insert into public.invite_codes (code, institution_id, role) values (public.gen_code(8), v_id, 'teacher');
  return v_id;
end $$;

create function public.create_class(p_inst uuid, p_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.is_staff(p_inst) then raise exception 'Bu işlem için hoca olmalısın.'; end if;
  insert into public.classes (institution_id, name) values (p_inst, btrim(p_name)) returning id into v_id;
  insert into public.invite_codes (code, institution_id, class_id, role) values (public.gen_code(6), p_inst, v_id, 'student');
  return v_id;
end $$;

create function public.renew_code(p_code text) returns text
language plpgsql security definer set search_path = '' as $$
declare v_row public.invite_codes; v_new text := public.gen_code(case when length(p_code) = 8 then 8 else 6 end);
begin
  select * into v_row from public.invite_codes where code = upper(p_code);
  if v_row is null or not public.is_staff(v_row.institution_id) then raise exception 'Kod bulunamadı.'; end if;
  update public.invite_codes set code = v_new, created_at = now() where code = v_row.code;
  return v_new;
end $$;

create function public.join_with_code(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_row public.invite_codes; v_uid uuid := (select auth.uid()); v_cur text;
begin
  if v_uid is null then raise exception 'Giriş yapmalısın.'; end if;
  select * into v_row from public.invite_codes where code = upper(btrim(p_code));
  if v_row is null then raise exception 'Bu kod geçerli değil.'; end if;
  select role into v_cur from public.memberships where institution_id = v_row.institution_id and user_id = v_uid;
  if v_cur is null then
    insert into public.memberships (institution_id, user_id, role, class_id)
    values (v_row.institution_id, v_uid, v_row.role, v_row.class_id);
  elsif v_row.role = 'teacher' and v_cur = 'student' then
    update public.memberships set role = 'teacher' where institution_id = v_row.institution_id and user_id = v_uid;
  elsif v_row.role = 'student' then
    update public.memberships set class_id = v_row.class_id where institution_id = v_row.institution_id and user_id = v_uid;
  end if;
  return jsonb_build_object('institution_id', v_row.institution_id, 'role', coalesce(case when v_cur in ('owner','teacher') then v_cur end, v_row.role), 'class_id', v_row.class_id);
end $$;

create function public.create_room(p_name text, p_inst uuid default null, p_class uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_code text; v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'Giriş yapmalısın.'; end if;
  if (select count(*) from public.rooms where created_by = v_uid and not closed) >= 10 then
    raise exception 'Açık odan çok fazla; eskilerden birini kapat.';
  end if;
  if p_inst is null then
    v_code := public.gen_code(6);
    insert into public.rooms (name, kind, code, created_by) values (btrim(p_name), 'private', v_code, v_uid) returning id into v_id;
  else
    if not public.is_member(p_inst) then raise exception 'Bu dershanenin üyesi değilsin.'; end if;
    if p_class is not null and not exists (select 1 from public.classes where id = p_class and institution_id = p_inst) then
      raise exception 'Sınıf bulunamadı.';
    end if;
    if p_class is null and not public.is_staff(p_inst) then p_class := public.my_class(p_inst); end if;
    insert into public.rooms (name, kind, institution_id, class_id, created_by)
    values (btrim(p_name), 'class', p_inst, p_class, v_uid) returning id into v_id;
  end if;
  insert into public.room_members (room_id, user_id, role) values (v_id, v_uid, 'host');
  return jsonb_build_object('id', v_id, 'code', v_code);
end $$;

create function public.join_room(p_code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_room public.rooms; v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'Giriş yapmalısın.'; end if;
  select * into v_room from public.rooms where code = upper(btrim(p_code)) and not closed;
  if v_room is null then raise exception 'Bu oda kodu geçerli değil.'; end if;
  if exists (select 1 from public.room_members where room_id = v_room.id and user_id = v_uid and banned) then
    raise exception 'Bu odaya katılamazsın.';
  end if;
  if (select count(*) from public.room_members where room_id = v_room.id and not banned) >= 30 then
    raise exception 'Oda dolu.';
  end if;
  insert into public.room_members (room_id, user_id) values (v_room.id, v_uid) on conflict do nothing;
  return v_room.id;
end $$;

create function public.enter_room(p_room uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.can_access_room(p_room) then raise exception 'Bu odaya erişimin yok.'; end if;
  insert into public.room_members (room_id, user_id) values (p_room, (select auth.uid())) on conflict do nothing;
  update public.rooms set last_active = now() where id = p_room;
end $$;

create function public.set_room_timer(p_room uuid, p_timer jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.can_access_room(p_room) then raise exception 'Bu odaya erişimin yok.'; end if;
  update public.rooms set timer = p_timer, last_active = now() where id = p_room;
end $$;

create function public.kick_from_room(p_room uuid, p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_room_mod(p_room) then raise exception 'Bunu yalnızca odayı açan ya da hoca yapabilir.'; end if;
  if p_user = (select auth.uid()) then raise exception 'Kendini çıkaramazsın.'; end if;
  insert into public.room_members (room_id, user_id, banned) values (p_room, p_user, true)
  on conflict (room_id, user_id) do update set banned = true;
end $$;

create function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from auth.users where id = (select auth.uid());
end $$;

revoke execute on all functions in schema public from public, anon;
grant execute on function public.create_institution(text), public.create_class(uuid, text), public.renew_code(text),
  public.join_with_code(text), public.create_room(text, uuid, uuid), public.join_room(text), public.enter_room(uuid),
  public.set_room_timer(uuid, jsonb), public.kick_from_room(uuid, uuid), public.delete_my_account(),
  public.is_member(uuid), public.is_staff(uuid), public.my_class(uuid), public.can_access_room(uuid),
  public.is_room_mod(uuid), public.can_see_profile(uuid), public.can_see_program(uuid), public.topic_room(text)
  to authenticated;

-- ───────────────────────── güvenlik kuralları (RLS) ─────────────────────────

alter table public.profiles enable row level security;
alter table public.user_state enable row level security;
alter table public.institutions enable row level security;
alter table public.classes enable row level security;
alter table public.memberships enable row level security;
alter table public.invite_codes enable row level security;
alter table public.programs enable row level security;
alter table public.program_progress enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;

create policy "profil: ortak dershane ya da odadakiler görür" on public.profiles
  for select to authenticated using (public.can_see_profile(id));
create policy "profil: kendi profilini oluşturur" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "profil: kendi profilini düzenler" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "durum: yalnızca kendisi" on public.user_state
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "dershane: üyeler görür" on public.institutions
  for select to authenticated using (public.is_member(id));
create policy "dershane: hocalar adını değiştirir" on public.institutions
  for update to authenticated using (public.is_staff(id)) with check (public.is_staff(id));
create policy "dershane: kurucu siler" on public.institutions
  for delete to authenticated using (created_by = (select auth.uid()));

create policy "sınıf: üyeler görür" on public.classes
  for select to authenticated using (public.is_member(institution_id));
create policy "sınıf: hocalar düzenler" on public.classes
  for update to authenticated using (public.is_staff(institution_id)) with check (public.is_staff(institution_id));
create policy "sınıf: hocalar siler" on public.classes
  for delete to authenticated using (public.is_staff(institution_id));

create policy "üyelik: aynı dershanedekiler görür" on public.memberships
  for select to authenticated using (public.is_member(institution_id));
create policy "üyelik: hocalar öğrencinin sınıfını değiştirir" on public.memberships
  for update to authenticated using (public.is_staff(institution_id) and role = 'student')
  with check (public.is_staff(institution_id) and role = 'student');
create policy "üyelik: kişi ayrılır, hoca öğrenciyi çıkarır" on public.memberships
  for delete to authenticated using (
    (user_id = (select auth.uid()) and role <> 'owner')
    or (public.is_staff(institution_id) and role = 'student'));

create policy "kod: yalnızca hocalar görür" on public.invite_codes
  for select to authenticated using (public.is_staff(institution_id));
create policy "kod: hocalar siler" on public.invite_codes
  for delete to authenticated using (public.is_staff(institution_id));

create policy "program: ilgili öğrenci ve hocalar görür" on public.programs
  for select to authenticated using (
    public.is_staff(institution_id)
    or student_id = (select auth.uid())
    or (class_id is not null and class_id = public.my_class(institution_id)));
create policy "program: hocalar ekler" on public.programs
  for insert to authenticated with check (public.is_staff(institution_id) and created_by = (select auth.uid()));
create policy "program: hocalar düzenler" on public.programs
  for update to authenticated using (public.is_staff(institution_id)) with check (public.is_staff(institution_id));
create policy "program: hocalar siler" on public.programs
  for delete to authenticated using (public.is_staff(institution_id));

create policy "ilerleme: kendisi ve hocaları görür" on public.program_progress
  for select to authenticated using (
    user_id = (select auth.uid())
    or exists (select 1 from public.programs p where p.id = program_id and public.is_staff(p.institution_id)));
create policy "ilerleme: kendi ilerlemesini yazar" on public.program_progress
  for insert to authenticated with check (user_id = (select auth.uid()) and public.can_see_program(program_id));
create policy "ilerleme: kendi ilerlemesini günceller" on public.program_progress
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "oda: erişimi olanlar görür" on public.rooms
  for select to authenticated using (public.can_access_room(id) or (created_by = (select auth.uid())));
create policy "oda: açan ya da hoca düzenler" on public.rooms
  for update to authenticated using (public.is_room_mod(id)) with check (public.is_room_mod(id));
create policy "oda: açan ya da hoca siler" on public.rooms
  for delete to authenticated using (public.is_room_mod(id));

create policy "oda üyeleri: odadakiler görür" on public.room_members
  for select to authenticated using (user_id = (select auth.uid()) or public.can_access_room(room_id));
create policy "oda üyeleri: kişi ayrılır" on public.room_members
  for delete to authenticated using (user_id = (select auth.uid()) and not banned);

create policy "mesaj: odadakiler okur" on public.messages
  for select to authenticated using (public.can_access_room(room_id));
create policy "mesaj: odadakiler yazar" on public.messages
  for insert to authenticated with check (user_id = (select auth.uid()) and public.can_access_room(room_id));
create policy "mesaj: yazan ya da oda yöneticisi siler" on public.messages
  for delete to authenticated using (user_id = (select auth.uid()) or public.is_room_mod(room_id));

create policy "şikâyet: herkes şikâyet edebilir" on public.reports
  for insert to authenticated with check (reporter = (select auth.uid()));
create policy "şikâyet: şikâyet eden ve hocalar görür" on public.reports
  for select to authenticated using (
    reporter = (select auth.uid())
    or exists (select 1 from public.rooms r where r.id = room_id and r.kind = 'class' and public.is_staff(r.institution_id)));
create policy "şikâyet: hocalar kapatır" on public.reports
  for update to authenticated using (
    exists (select 1 from public.rooms r where r.id = room_id and r.kind = 'class' and public.is_staff(r.institution_id)));

-- ───────────────────────── canlı kanallar ─────────────────────────

create policy "oda kanalı: erişimi olanlar dinler" on realtime.messages
  for select to authenticated using (
    realtime.messages.extension in ('broadcast','presence')
    and public.can_access_room(public.topic_room((select realtime.topic()))));
create policy "oda kanalı: erişimi olanlar gönderir" on realtime.messages
  for insert to authenticated with check (
    realtime.messages.extension in ('broadcast','presence')
    and public.can_access_room(public.topic_room((select realtime.topic()))));

alter publication supabase_realtime add table public.messages;

revoke execute on function public.handle_new_user(), public.message_rate_limit(), public.touch_updated_at(), public.gen_code(int) from authenticated, anon, public;
alter default privileges in schema public revoke execute on functions from anon;
