-- Ders Özetim — yönetici paneli
-- Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
--
-- Yöneticiler app_admins tablosunda tutulur. Tabloya istemciden yazılamaz; yönetici
-- eklemek için Supabase SQL düzenleyicisinde:
--   insert into public.app_admins (user_id) select id from auth.users where email = 'adres@ornek.com';

create table public.app_admins (
  user_id uuid primary key references auth.users on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.app_admins enable row level security;
create policy "yönetici: kendini görür" on public.app_admins
  for select to authenticated using (user_id = (select auth.uid()));

create function public.is_app_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.app_admins a where a.user_id = (select auth.uid()))
$$;

create function public.admin_overview() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare r jsonb;
begin
  if not public.is_app_admin() then raise exception 'Yetkin yok.'; end if;
  select jsonb_build_object(
    'counts', jsonb_build_object(
      'users', (select count(*) from auth.users),
      'users7', (select count(*) from auth.users where created_at > now() - interval '7 days'),
      'active1', (select count(*) from auth.users where last_sign_in_at > now() - interval '1 day'),
      'institutions', (select count(*) from public.institutions),
      'classes', (select count(*) from public.classes),
      'programs', (select count(*) from public.programs),
      'rooms', (select count(*) from public.rooms where not closed),
      'rooms_live', (select count(*) from public.rooms where not closed and last_active > now() - interval '15 minutes'),
      'messages1', (select count(*) from public.messages where created_at > now() - interval '1 day'),
      'reports', (select count(*) from public.reports where status = 'open')),
    'users', coalesce((select jsonb_agg(x order by x->>'created_at' desc) from (
        select jsonb_build_object('id', u.id, 'email', u.email, 'name', p.name, 'created_at', u.created_at, 'last', u.last_sign_in_at,
          'banned', u.banned_until is not null and u.banned_until > now(),
          'providers', u.raw_app_meta_data->'providers',
          'schools', (select count(*) from public.memberships m where m.user_id = u.id)) x
        from auth.users u left join public.profiles p on p.id = u.id order by u.created_at desc limit 200) t), '[]'::jsonb),
    'institutions', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'name', i.name, 'created_at', i.created_at,
        'owner', (select p.name from public.profiles p where p.id = i.created_by),
        'students', (select count(*) from public.memberships m where m.institution_id = i.id and m.role = 'student'),
        'teachers', (select count(*) from public.memberships m where m.institution_id = i.id and m.role <> 'student'),
        'classes', (select count(*) from public.classes c where c.institution_id = i.id)) order by i.created_at desc)
      from public.institutions i), '[]'::jsonb),
    'rooms', coalesce((select jsonb_agg(x order by x->>'last_active' desc) from (
        select jsonb_build_object('id', r.id, 'name', r.name, 'kind', r.kind, 'code', r.code, 'last_active', r.last_active,
          'owner', (select p.name from public.profiles p where p.id = r.created_by),
          'school', (select i.name from public.institutions i where i.id = r.institution_id),
          'members', (select count(*) from public.room_members m where m.room_id = r.id and not m.banned),
          'messages', (select count(*) from public.messages m where m.room_id = r.id)) x
        from public.rooms r where not r.closed order by r.last_active desc limit 100) t), '[]'::jsonb),
    'reports', coalesce((select jsonb_agg(jsonb_build_object('id', rp.id, 'reason', rp.reason, 'created_at', rp.created_at,
        'room', (select r.name from public.rooms r where r.id = rp.room_id), 'room_id', rp.room_id,
        'reporter', (select p.name from public.profiles p where p.id = rp.reporter),
        'reported', (select p.name from public.profiles p where p.id = rp.reported), 'reported_id', rp.reported,
        'message', (select m.body from public.messages m where m.id = rp.message_id), 'message_id', rp.message_id) order by rp.created_at desc)
      from public.reports rp where rp.status = 'open'), '[]'::jsonb)
  ) into r;
  return r;
end $$;

create function public.admin_room_messages(p_room uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_app_admin() then raise exception 'Yetkin yok.'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'body', m.body, 'created_at', m.created_at, 'user_id', m.user_id,
      'name', (select p.name from public.profiles p where p.id = m.user_id)) order by m.created_at desc)
    from (select * from public.messages where room_id = p_room order by created_at desc limit 100) m), '[]'::jsonb);
end $$;

create function public.admin_action(p_action text, p_id text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_app_admin() then raise exception 'Yetkin yok.'; end if;
  if p_action = 'close_room' then
    update public.rooms set closed = true where id = p_id::uuid;
  elsif p_action = 'delete_message' then
    delete from public.messages where id = p_id::bigint;
  elsif p_action = 'close_report' then
    update public.reports set status = 'closed' where id = p_id::bigint;
  elsif p_action = 'delete_institution' then
    delete from public.institutions where id = p_id::uuid;
  elsif p_action = 'ban_user' then
    if p_id::uuid = (select auth.uid()) then raise exception 'Kendini engelleyemezsin.'; end if;
    update auth.users set banned_until = now() + interval '100 years' where id = p_id::uuid;
    delete from auth.refresh_tokens where user_id::uuid = p_id::uuid;
  elsif p_action = 'unban_user' then
    update auth.users set banned_until = null where id = p_id::uuid;
  else
    raise exception 'Bilinmeyen işlem.';
  end if;
end $$;

revoke execute on function public.is_app_admin(), public.admin_overview(), public.admin_room_messages(uuid), public.admin_action(text, text) from public, anon;
grant execute on function public.is_app_admin(), public.admin_overview(), public.admin_room_messages(uuid), public.admin_action(text, text) to authenticated;

