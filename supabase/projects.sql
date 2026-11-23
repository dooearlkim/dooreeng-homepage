-- ============================================================
-- 시공실적 관리 (관리자가 홈페이지에서 직접 추가·수정·삭제)
-- admin_2step.sql 을 실행한 뒤, 이 파일을 SQL Editor 에서 한 번 실행하세요.
-- ============================================================

-- 1) 시공실적 테이블
create table if not exists public.projects (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  category   text not null check (char_length(category) between 1 and 20),
  company    text not null check (char_length(company) between 1 and 60),
  title      text not null check (char_length(title) between 1 and 100),
  content    text check (content is null or char_length(content) <= 3000),
  work_date  text check (work_date is null or char_length(work_date) <= 20),
  images     text[] not null default '{}'
);
create index if not exists projects_created_at_idx on public.projects (created_at desc);

alter table public.projects enable row level security;
revoke all on public.projects from anon, authenticated;

-- 누구나 보기, 관리자(2단계 통과)만 추가·수정·삭제
grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;
drop policy if exists "projects public read" on public.projects;
create policy "projects public read" on public.projects for select to anon, authenticated using (true);
drop policy if exists "projects admin insert" on public.projects;
create policy "projects admin insert" on public.projects for insert to authenticated with check (public.is_admin());
drop policy if exists "projects admin update" on public.projects;
create policy "projects admin update" on public.projects for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "projects admin delete" on public.projects;
create policy "projects admin delete" on public.projects for delete to authenticated using (public.is_admin());

-- 2) 사진 저장소 (누구나 보기, 관리자만 올리기·지우기, 사진 1장 최대 5MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-photos', 'project-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "project photos admin insert" on storage.objects;
create policy "project photos admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'project-photos' and public.is_admin());
drop policy if exists "project photos admin update" on storage.objects;
create policy "project photos admin update" on storage.objects for update to authenticated
  using (bucket_id = 'project-photos' and public.is_admin());
drop policy if exists "project photos admin delete" on storage.objects;
create policy "project photos admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'project-photos' and public.is_admin());
