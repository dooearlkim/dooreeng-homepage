-- ============================================================
-- 견적 요청 (가망 고객) 관리
-- 홈페이지 '30초 가견적'에서 견적 요청을 하면 여기에 저장되고,
-- 관리자(2단계 통과)만 홈페이지 관리자 화면에서 보고 관리합니다.
-- admin_2step.sql 을 실행한 뒤, 이 파일을 SQL Editor 에서 한 번 실행하세요.
-- ============================================================

create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  company     text not null check (char_length(company) between 1 and 60),
  name        text check (name is null or char_length(name) <= 30),
  phone       text not null check (char_length(phone) between 8 and 30),
  job         text check (job is null or char_length(job) <= 30),
  capacity    text check (capacity is null or char_length(capacity) <= 30),
  unit_count  text check (unit_count is null or char_length(unit_count) <= 20),
  estimate    text check (estimate is null or char_length(estimate) <= 60),
  memo        text check (memo is null or char_length(memo) <= 1000),
  agreed      boolean not null check (agreed),
  status      text not null default '신규' check (status in ('신규', '연락함', '견적 발송', '계약', '보류')),
  admin_note  text check (admin_note is null or char_length(admin_note) <= 2000)
);
create index if not exists leads_created_at_idx on public.leads (created_at desc);

alter table public.leads enable row level security;
revoke all on public.leads from anon, authenticated;

-- 방문자: 견적 요청 등록만 가능 (조회 불가)
grant insert (company, name, phone, job, capacity, unit_count, estimate, memo, agreed) on public.leads to anon, authenticated;
drop policy if exists "anyone can request" on public.leads;
create policy "anyone can request" on public.leads for insert to anon, authenticated
  with check (agreed and status = '신규' and admin_note is null);

-- 관리자: 조회, 상태·메모 수정, 삭제
grant select, delete on public.leads to authenticated;
grant update (status, admin_note) on public.leads to authenticated;
drop policy if exists "admin read leads" on public.leads;
create policy "admin read leads" on public.leads for select to authenticated using (public.is_admin());
drop policy if exists "admin update leads" on public.leads;
create policy "admin update leads" on public.leads for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin delete leads" on public.leads;
create policy "admin delete leads" on public.leads for delete to authenticated using (public.is_admin());
