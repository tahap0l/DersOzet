-- Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
-- Hoca mı öğrenci mi: hocalara sınıf ve alan sorulmaz, adlarının yanında "Hoca" (ya da branşı) yazar.
-- Dershanede kurucu ya da hoca olan herkes hoca sayılır; hoca koduyla katılan da hoca olur.

alter table public.profiles add column kind text not null default 'student' check (kind in ('student', 'teacher'));
alter table public.profiles add column branch text not null default '' check (char_length(branch) <= 30);

update public.profiles p set kind = 'teacher', grade = ''
  where exists (select 1 from public.memberships m where m.user_id = p.id and m.role in ('owner', 'teacher'));

-- dershane kuran ya da hoca koduyla katılan hesap hoca olur
create or replace function public.mark_teacher() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.role in ('owner', 'teacher') then
    update public.profiles set kind = 'teacher', grade = '' where id = new.user_id and kind <> 'teacher';
  end if;
  return new;
end $$;
revoke execute on function public.mark_teacher() from public, anon, authenticated;
create trigger memberships_mark_teacher after insert or update of role on public.memberships
  for each row execute function public.mark_teacher();

create or replace function public.admin_overview() returns jsonb
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
        select jsonb_build_object('id', u.id, 'email', u.email, 'name', p.name, 'kind', p.kind, 'branch', p.branch, 'grade', p.grade, 'track', p.track, 'created_at', u.created_at, 'last', u.last_sign_in_at,
          'banned', u.banned_until is not null and u.banned_until > now(),
          'providers', u.raw_app_meta_data->'providers',
          'schools', (select count(*) from public.memberships m where m.user_id = u.id),
          'school_names', (select coalesce(jsonb_agg(i.name || coalesce(' / ' || c.name, '')), '[]'::jsonb) from public.memberships m join public.institutions i on i.id = m.institution_id left join public.classes c on c.id = m.class_id where m.user_id = u.id)) x
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
