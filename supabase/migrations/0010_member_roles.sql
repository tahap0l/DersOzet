-- Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
-- Üyelerin rolünü dershanenin kurucusu belirler: hoca ya da (bir sınıfta) öğrenci.
-- Profildeki "hoca mı öğrenci mi" bilgisi rolle birlikte kendiliğinden değişir.

create or replace function public.set_member_role(p_inst uuid, p_user uuid, p_role text, p_class uuid default null) returns void
language plpgsql security definer set search_path = '' as $$
declare v_cur text;
begin
  if not exists (select 1 from public.memberships where institution_id = p_inst and user_id = (select auth.uid()) and role = 'owner') then
    raise exception 'Rolleri yalnızca dershanenin kurucusu değiştirebilir.';
  end if;
  if p_role not in ('teacher', 'student') then raise exception 'Geçersiz rol.'; end if;
  select role into v_cur from public.memberships where institution_id = p_inst and user_id = p_user;
  if v_cur is null then raise exception 'Bu kişi dershanede değil.'; end if;
  if v_cur = 'owner' then raise exception 'Kurucunun rolü değiştirilemez.'; end if;
  if p_role = 'student' then
    if p_class is null or not exists (select 1 from public.classes where id = p_class and institution_id = p_inst) then
      raise exception 'Öğrenci için bir sınıf seç.';
    end if;
    update public.memberships set role = 'student', class_id = p_class where institution_id = p_inst and user_id = p_user;
  else
    update public.memberships set role = 'teacher', class_id = null where institution_id = p_inst and user_id = p_user;
  end if;
end $$;
revoke execute on function public.set_member_role(uuid, uuid, text, uuid) from public, anon;
grant execute on function public.set_member_role(uuid, uuid, text, uuid) to authenticated;

-- hoca rolü gelince hoca, son hocalık rolü gidince öğrenci
create or replace function public.mark_teacher() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.role in ('owner', 'teacher') then
    update public.profiles set kind = 'teacher', grade = '' where id = new.user_id and kind <> 'teacher';
  elsif tg_op = 'UPDATE' and old.role in ('owner', 'teacher')
    and not exists (select 1 from public.memberships where user_id = new.user_id and role in ('owner', 'teacher')) then
    update public.profiles set kind = 'student' where id = new.user_id;
  end if;
  return new;
end $$;

-- Sınıf koduyla katılan hoca (kurucu değil) o sınıfın öğrencisi olur: yanlışlıkla hoca koduyla
-- katılan öğrenci sınıf kodunu yazarak düzeltebilir. Önceden bu durumda kısıt hatası çıkıyordu.
create or replace function public.join_with_code(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_row public.invite_codes; v_uid uuid := (select auth.uid()); v_cur text; v_role text;
begin
  if v_uid is null then raise exception 'Giriş yapmalısın.'; end if;
  select * into v_row from public.invite_codes where code = upper(btrim(p_code));
  if v_row is null then raise exception 'Bu kod geçerli değil.'; end if;
  select role into v_cur from public.memberships where institution_id = v_row.institution_id and user_id = v_uid;
  if v_cur is null then
    insert into public.memberships (institution_id, user_id, role, class_id)
    values (v_row.institution_id, v_uid, v_row.role, v_row.class_id);
    v_role := v_row.role;
  elsif v_row.role = 'teacher' then
    if v_cur = 'student' then
      update public.memberships set role = 'teacher', class_id = null where institution_id = v_row.institution_id and user_id = v_uid;
    end if;
    v_role := case when v_cur = 'owner' then 'owner' else 'teacher' end;
  elsif v_cur = 'owner' then
    v_role := 'owner';
  else
    update public.memberships set role = 'student', class_id = v_row.class_id where institution_id = v_row.institution_id and user_id = v_uid;
    v_role := 'student';
  end if;
  return jsonb_build_object('institution_id', v_row.institution_id, 'role', v_role, 'class_id', v_row.class_id);
end $$;

-- kurucu bir hocayı dershaneden çıkarabilir
create or replace function public.is_owner(inst uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.memberships where institution_id = inst and user_id = (select auth.uid()) and role = 'owner');
$$;
revoke execute on function public.is_owner(uuid) from public, anon;
grant execute on function public.is_owner(uuid) to authenticated;
create policy "üyelik: kurucu hocayı çıkarır" on public.memberships
  for delete to authenticated using (role = 'teacher' and public.is_owner(institution_id));
