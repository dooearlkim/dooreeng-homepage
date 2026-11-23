-- ============================================================
-- 두레이엔지 고객지원 게시판 DB 설정
-- Supabase 대시보드 > SQL Editor 에 이 파일 내용을 통째로 붙여넣고 Run
-- ============================================================

create extension if not exists pgcrypto;

-- 1) 게시글 테이블
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  author      text not null check (char_length(author) between 1 and 40),
  contact     text check (contact is null or char_length(contact) <= 30),
  title       text not null check (char_length(title) between 1 and 100),
  body        text not null check (char_length(body) between 1 and 2000),
  is_secret   boolean not null default false,
  answer      text check (answer is null or char_length(answer) <= 4000),
  answered_at timestamptz
);
create index if not exists posts_created_at_idx on public.posts (created_at desc);

-- 2) 관리자 목록 (관리자 계정의 user id 를 여기에 넣음)
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

-- (이미 2단계 로그인 버전이 있으면 덮어쓰지 않음: 이 파일을 다시 실행해도 안전)
do $do$
begin
  if not exists (select 1 from pg_proc where proname = 'is_admin' and pronamespace = 'public'::regnamespace) then
    execute $f$
      create function public.is_admin()
      returns boolean language sql stable security definer set search_path = public
      as $$ select exists (select 1 from public.admins where user_id = auth.uid()); $$
    $f$;
  end if;
end
$do$;

-- 3) 보안 규칙 (RLS)
alter table public.posts  enable row level security;
alter table public.admins enable row level security;

revoke all on public.posts  from anon, authenticated;
revoke all on public.admins from anon, authenticated;

-- 누구나 글 등록 가능 (답변 칸은 비워야 함). 연락처·비밀글 내용은 표에서 직접 읽을 수 없음
grant insert (author, contact, title, body, is_secret) on public.posts to anon, authenticated;
drop policy if exists "anyone can post" on public.posts;
create policy "anyone can post" on public.posts
  for insert to anon, authenticated
  with check (answer is null and answered_at is null);

-- 관리자만 전체 조회 / 답변 / 삭제
grant select, delete on public.posts to authenticated;
grant update (answer, answered_at) on public.posts to authenticated;
drop policy if exists "admin read" on public.posts;
create policy "admin read" on public.posts for select to authenticated using (public.is_admin());
drop policy if exists "admin answer" on public.posts;
create policy "admin answer" on public.posts for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin delete" on public.posts;
create policy "admin delete" on public.posts for delete to authenticated using (public.is_admin());

-- 4) 홈페이지에 공개되는 글 목록 (연락처 제외, 비밀글은 내용·답변 가림)
create or replace view public.public_posts as
select
  id,
  created_at,
  case when is_secret then '비밀글' else author end as author,
  title,
  case when is_secret then '' else body end as body,
  is_secret,
  case when is_secret then case when answer is null then null else '(비밀 답변)' end else answer end as answer,
  answered_at
from public.posts;

grant select on public.public_posts to anon, authenticated;

-- ============================================================
-- 관리자 등록 (관리자 계정을 만든 다음 한 번만 실행)
--   1. Authentication > Users > Add user 로 동생분 이메일/비밀번호 계정 생성
--   2. 아래 줄의 이메일을 바꿔서 실행
-- insert into public.admins (user_id)
--   select id from auth.users where email = '동생분이메일@example.com'
--   on conflict do nothing;
-- ============================================================
