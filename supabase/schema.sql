-- ============================================================
-- youtube-lms Database Schema
-- Supabase SQL Editor에 전체 복사 후 실행
-- 실행 시 기존 테이블 초기화 후 재생성 (개발 환경용)
-- ============================================================

-- ── 초기화 (의존성 역순으로 drop) ─────────────────────────
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.search_keywords cascade;
drop table if exists public.feedback cascade;
drop table if exists public.video_logs cascade;
drop table if exists public.profiles cascade;

-- ── ① profiles ────────────────────────────────────────────
create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text not null,
  display_name     text,
  theme_preference text default 'monokai',
  created_at       timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "본인 프로필만 조회" on public.profiles
  for select using (auth.uid() = id);

create policy "본인 프로필만 수정" on public.profiles
  for update using (auth.uid() = id);

-- 신규 유저 가입 시 profiles 자동 생성 트리거
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── ② video_logs ──────────────────────────────────────────
create table public.video_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  video_id      text not null,
  status        text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  last_position numeric(10,2) default 0,
  watch_seconds integer default 0,
  updated_at    timestamptz default now(),
  unique (user_id, video_id)
);

alter table public.video_logs enable row level security;

create policy "본인 로그만 조회" on public.video_logs
  for select using (auth.uid() = user_id);

create policy "본인 로그만 삽입" on public.video_logs
  for insert with check (auth.uid() = user_id);

create policy "본인 로그만 수정" on public.video_logs
  for update using (auth.uid() = user_id);

create policy "본인 로그만 삭제" on public.video_logs
  for delete using (auth.uid() = user_id);

-- ── ③ feedback ────────────────────────────────────────────
create table public.feedback (
  id         uuid primary key default gen_random_uuid(),
  video_id   text not null,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  comment    text,
  rating     smallint check (rating between 1 and 5),
  created_at timestamptz default now()
);

alter table public.feedback enable row level security;

create policy "본인 피드백만 조회" on public.feedback
  for select using (auth.uid() = user_id);

create policy "본인 피드백만 삽입" on public.feedback
  for insert with check (auth.uid() = user_id);

create policy "본인 피드백만 수정" on public.feedback
  for update using (auth.uid() = user_id);

-- ── ④ search_keywords ─────────────────────────────────────
create table public.search_keywords (
  id         uuid primary key default gen_random_uuid(),
  keyword    text not null unique,
  is_active  boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

alter table public.search_keywords enable row level security;

create policy "인증 유저 키워드 전체 조회" on public.search_keywords
  for select using (auth.role() = 'authenticated');

-- 인증 유저는 키워드 관리 가능
create policy "인증 유저 키워드 삽입" on public.search_keywords
  for insert with check (auth.role() = 'authenticated');

create policy "인증 유저 키워드 수정" on public.search_keywords
  for update using (auth.role() = 'authenticated');

create policy "인증 유저 키워드 삭제" on public.search_keywords
  for delete using (auth.role() = 'authenticated');

-- 초기 키워드 데이터
insert into public.search_keywords (keyword, sort_order) values
  ('Claude AI', 0),
  ('ChatGPT', 1),
  ('Gemini AI', 2),
  ('Codex', 3),
  ('LLM 강의', 4),
  ('AI 개발', 5);

-- ── ⑤ search_channels ────────────────────────────────────
create table public.search_channels (
  id           uuid primary key default gen_random_uuid(),
  channel_url  text not null unique,
  channel_name text,
  channel_id   text,
  is_active    boolean default true,
  sort_order   integer default 0,
  created_at   timestamptz default now()
);

alter table public.search_channels enable row level security;

create policy "인증 유저 채널 전체 조회" on public.search_channels
  for select using (auth.role() = 'authenticated');

create policy "인증 유저 채널 삽입" on public.search_channels
  for insert with check (auth.role() = 'authenticated');

create policy "인증 유저 채널 수정" on public.search_channels
  for update using (auth.role() = 'authenticated');

create policy "인증 유저 채널 삭제" on public.search_channels
  for delete using (auth.role() = 'authenticated');
