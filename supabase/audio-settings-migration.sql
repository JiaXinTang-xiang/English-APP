-- 在 Supabase SQL Editor 执行一次。已有用户设置不会丢失。
alter table public.user_settings add column if not exists word_volume integer not null default 85;
alter table public.user_settings add column if not exists word_audio boolean not null default true;
alter table public.user_settings add column if not exists playback_rate numeric not null default 1;
alter table public.user_settings add column if not exists loop_audio boolean not null default false;
alter table public.user_settings add column if not exists show_phonetic boolean not null default true;
alter table public.user_settings add column if not exists translation_speech boolean not null default false;
alter table public.user_settings add column if not exists keyboard_sound boolean not null default false;
alter table public.user_settings add column if not exists keyboard_sound_file text not null default '机械键盘2';
alter table public.user_settings add column if not exists keyboard_volume integer not null default 55;
alter table public.user_settings add column if not exists feedback_sound boolean not null default true;
alter table public.user_settings add column if not exists feedback_volume integer not null default 55;
