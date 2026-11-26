-- Ders Özetim — Copyright (C) 2026 Esat Taha Polat — AGPL-3.0
-- Açılış kayıtları: uygulama bir telefonda açılmazsa ya da çok yavaş açılırsa tarayıcı bilgisi,
-- hata yazısı ve hangi adımda takıldığı buraya düşer. Ad, e-posta ya da içerik yazılmaz.
-- Herkes ekleyebilir, yalnızca yönetici okur.

create table public.client_logs (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  kind text not null check (char_length(kind) <= 20),
  ver text not null default '' check (char_length(ver) <= 20),
  ua text not null default '' check (char_length(ua) <= 300),
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) < 6000),
  user_id uuid default auth.uid()
);
create index client_logs_at on public.client_logs (at desc);
alter table public.client_logs enable row level security;
create policy "kayıt: herkes ekler" on public.client_logs for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));
create policy "kayıt: yönetici okur" on public.client_logs for select to authenticated
  using (public.is_app_admin());
grant insert on public.client_logs to anon, authenticated;
grant select on public.client_logs to authenticated;
