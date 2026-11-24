-- Profil adlarını üyelik, oda, mesaj ve ilerleme kayıtlarıyla birlikte çekebilmek için bağlantılar.
alter table public.profiles drop constraint profiles_track_check;
alter table public.profiles add constraint profiles_track_check check (track in ('say','ea','soz','dil','tyt'));
alter table public.memberships add constraint memberships_profile_fk foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.room_members add constraint room_members_profile_fk foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.messages add constraint messages_profile_fk foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.program_progress add constraint program_progress_profile_fk foreign key (user_id) references public.profiles(id) on delete cascade;
