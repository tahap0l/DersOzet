-- Ders Özetim — not defteri ve yanlış defteri
-- Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
--
-- Her not yalnızca sahibine aittir. Çizimler vektör olarak (strokes) saklanır;
-- soru fotoğrafları "notes" deposunda kullanıcının kendi klasöründe durur: <user_id>/<dosya>.

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  kind text not null default 'note' check (kind in ('note','wrong')),
  title text not null default '' check (char_length(title) <= 120),
  body text not null default '' check (char_length(body) <= 20000),
  subject text not null default '' check (char_length(subject) <= 40),
  topic text not null default '' check (char_length(topic) <= 120),
  reason text not null default '' check (char_length(reason) <= 40),
  strokes jsonb not null default '[]'::jsonb check (jsonb_typeof(strokes) = 'array' and pg_column_size(strokes) < 1500000),
  pages smallint not null default 1 check (pages between 1 and 20),
  image_path text check (image_path is null or char_length(image_path) <= 200),
  status text not null default 'open' check (status in ('open','learned')),
  review_at date,
  review_step smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.notes (user_id, kind, updated_at desc);
create trigger notes_touch before update on public.notes for each row execute function public.touch_updated_at();

alter table public.notes enable row level security;
create policy "not: yalnızca sahibi" on public.notes
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Kişi başına en fazla 2000 not.
create function public.notes_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.notes where user_id = new.user_id) >= 2000 then
    raise exception 'Not sınırına ulaştın (2000). Eski notlardan bazılarını sil.';
  end if;
  return new;
end $$;
create trigger notes_limit before insert on public.notes for each row execute function public.notes_limit();
revoke execute on function public.notes_limit() from public, anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('notes', 'notes', false, 3145728, array['image/jpeg','image/webp','image/png'])
on conflict (id) do nothing;

create policy "not fotoğrafı: kendi klasörünü okur" on storage.objects
  for select to authenticated using (bucket_id = 'notes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "not fotoğrafı: kendi klasörüne yükler" on storage.objects
  for insert to authenticated with check (bucket_id = 'notes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "not fotoğrafı: kendi klasöründe günceller" on storage.objects
  for update to authenticated using (bucket_id = 'notes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "not fotoğrafı: kendi klasöründen siler" on storage.objects
  for delete to authenticated using (bucket_id = 'notes' and (storage.foldername(name))[1] = (select auth.uid())::text);

alter table public.notes add column paper text not null default 'lines' check (paper in ('lines','grid','dots','plain'));
