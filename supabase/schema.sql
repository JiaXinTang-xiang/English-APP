create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  created_at timestamptz not null default now()
);

create table if not exists public.word_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  level text not null check (level in ('cet4', 'cet6')),
  word text not null,
  right_count integer not null default 0,
  wrong_count integer not null default 0,
  in_wrong_book boolean not null default false,
  wrong_review_count integer not null default 0,
  last_right date,
  last_wrong date,
  wrong_day integer,
  updated_at timestamptz not null default now(),
  primary key (user_id, level, word)
);

create table if not exists public.day_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  level text not null check (level in ('cet4', 'cet6')),
  day integer not null,
  learned_count integer not null default 0,
  learned_date date,
  reviewed_days integer[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, level, day)
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  auto_play boolean not null default false,
  word_audio boolean not null default true,
  accent text not null default 'us' check (accent in ('us', 'uk')),
  word_volume integer not null default 85,
  playback_rate numeric not null default 1,
  loop_audio boolean not null default false,
  show_phonetic boolean not null default true,
  translation_speech boolean not null default false,
  keyboard_sound boolean not null default false,
  keyboard_sound_file text not null default '机械键盘2',
  keyboard_volume integer not null default 55,
  feedback_sound boolean not null default true,
  feedback_volume integer not null default 55,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.word_progress enable row level security;
alter table public.day_progress enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "profiles own row" on public.profiles;
drop policy if exists "word progress own rows" on public.word_progress;
drop policy if exists "day progress own rows" on public.day_progress;
drop policy if exists "settings own row" on public.user_settings;
create policy "profiles own row" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "word progress own rows" on public.word_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "day progress own rows" on public.day_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "settings own row" on public.user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into public.profiles (id) values (new.id);
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();
