-- 为已有 Supabase 项目补充个人资料字段。
-- 使用 IF NOT EXISTS，可重复执行，不会删除已有账号或学习记录。
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists gender text not null default 'secret';

update public.profiles
set gender = 'secret'
where gender is null or gender not in ('male', 'female', 'secret');

alter table public.profiles drop constraint if exists profiles_gender_check;
alter table public.profiles add constraint profiles_gender_check check (gender in ('male', 'female', 'secret'));
