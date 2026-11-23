-- ============================================================
-- 관리자 로그인 아이디 (이메일 대신 짧은 아이디로 로그인)
-- 아이디와 실제 Supabase 계정 이메일의 연결표를 DB 안에만 저장합니다.
-- (이메일은 홈페이지 코드나 GitHub에 드러나지 않습니다)
-- ============================================================

create table if not exists public.admin_logins (
  login_id text primary key,
  email    text not null
);
alter table public.admin_logins enable row level security;
revoke all on public.admin_logins from anon, authenticated;

-- 아이디를 넣으면 로그인에 쓸 이메일을 돌려줌 (목록 전체 조회는 불가)
create or replace function public.resolve_admin_login(p_login text)
returns text language sql stable security definer set search_path = public
as $$ select email from public.admin_logins where login_id = lower(trim(p_login)); $$;

revoke execute on function public.resolve_admin_login(text) from public;
grant execute on function public.resolve_admin_login(text) to anon, authenticated;

-- 등록 (이 줄은 SQL Editor 에서만 실행하고, 실제 이메일을 GitHub 파일에 적지 마세요)
-- insert into public.admin_logins (login_id, email) values ('hopeso9517', '관리자이메일@주소')
--   on conflict (login_id) do update set email = excluded.email;
