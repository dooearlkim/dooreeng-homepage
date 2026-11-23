-- ============================================================
-- 관리자 2단계 로그인 (비밀번호 + 보안 질문)
-- schema.sql 을 실행한 뒤, 이 파일을 SQL Editor 에서 한 번 실행하세요.
-- 보안 질문 정답은 서버(DB)에서만 확인하고, 암호화(해시)되어 저장됩니다.
-- 2단계를 통과하지 않으면 비밀번호가 맞아도 답변·삭제·비밀글 보기가 막힙니다.
-- ============================================================

-- 답 비교용: 띄어쓰기 무시, 영문 대소문자 무시
create or replace function public.norm_answer(t text)
returns text language sql immutable
as $$ select lower(regexp_replace(coalesce(t, ''), '\s', '', 'g')) $$;

-- 보안 질문 목록 (답은 해시로만 저장)
create table if not exists public.admin_questions (
  id          serial primary key,
  question    text not null,
  answer_hash text not null
);

-- 관리자별 현재 질문, 틀린 횟수, 잠금 시간
create table if not exists public.admin_guard (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  question_id  int references public.admin_questions (id) on delete set null,
  fails        int not null default 0,
  locked_until timestamptz
);

-- 2단계를 통과한 로그인 세션 (12시간 유지)
create table if not exists public.admin_sessions (
  session_id     text primary key,
  user_id        uuid not null references auth.users (id) on delete cascade,
  verified_until timestamptz not null
);

alter table public.admin_questions enable row level security;
alter table public.admin_guard     enable row level security;
alter table public.admin_sessions  enable row level security;
revoke all on public.admin_questions, public.admin_guard, public.admin_sessions from anon, authenticated;

-- 1단계: 비밀번호로 로그인한 관리자인지
create or replace function public.is_admin_user()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admins where user_id = auth.uid()); $$;

-- 최종 관리자 = 1단계 + 이 로그인 세션에서 2단계 통과
-- (게시판 보안 규칙이 이 함수를 쓰므로, 2단계 전에는 관리 기능이 모두 막힘)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select public.is_admin_user() and exists (
    select 1 from public.admin_sessions s
    where s.session_id = auth.jwt() ->> 'session_id'
      and s.user_id = auth.uid()
      and s.verified_until > now()
  );
$$;

-- 상태: none(관리자 아님) / verified(통과) / locked(잠김) / need_answer(질문 필요)
create or replace function public.admin_status()
returns text language plpgsql stable security definer set search_path = public
as $$
declare g record;
begin
  if not public.is_admin_user() then return 'none'; end if;
  if public.is_admin() then return 'verified'; end if;
  select * into g from public.admin_guard where user_id = auth.uid();
  if found and g.locked_until is not null and g.locked_until > now() then return 'locked'; end if;
  return 'need_answer';
end $$;

-- 질문 하나를 무작위로 골라 줌 (맞힐 때까지 같은 질문 유지: 다시 로그인해도 바뀌지 않음)
create or replace function public.get_admin_question()
returns text language plpgsql volatile security definer set search_path = public
as $$
declare g record; qid int; qtext text;
begin
  if not public.is_admin_user() then raise exception 'not allowed'; end if;
  select * into g from public.admin_guard where user_id = auth.uid();
  if found and g.locked_until is not null and g.locked_until > now() then raise exception 'locked'; end if;
  if found and g.question_id is not null then
    select question into qtext from public.admin_questions where id = g.question_id;
    if qtext is not null then return qtext; end if;
  end if;
  select id, question into qid, qtext from public.admin_questions order by random() limit 1;
  if qid is null then raise exception 'no questions'; end if;
  insert into public.admin_guard (user_id, question_id) values (auth.uid(), qid)
    on conflict (user_id) do update set question_id = excluded.question_id;
  return qtext;
end $$;

-- 답 확인: 맞으면 이 세션 12시간 승인, 5번 틀리면 30분 잠금
create or replace function public.verify_admin_answer(ans text)
returns boolean language plpgsql volatile security definer set search_path = public, extensions
as $$
declare g record; ok boolean; sid text := auth.jwt() ->> 'session_id';
begin
  if not public.is_admin_user() or sid is null then raise exception 'not allowed'; end if;
  select * into g from public.admin_guard where user_id = auth.uid();
  if not found or g.question_id is null then raise exception 'no question'; end if;
  if g.locked_until is not null and g.locked_until > now() then raise exception 'locked'; end if;
  if g.locked_until is not null and g.locked_until <= now() then
    update public.admin_guard set fails = 0, locked_until = null where user_id = auth.uid();
    g.fails := 0;
  end if;

  select a.answer_hash = extensions.crypt(public.norm_answer(ans), a.answer_hash)
    into ok from public.admin_questions a where a.id = g.question_id;

  if coalesce(ok, false) then
    insert into public.admin_sessions (session_id, user_id, verified_until)
      values (sid, auth.uid(), now() + interval '12 hours')
      on conflict (session_id) do update set verified_until = excluded.verified_until;
    update public.admin_guard set fails = 0, locked_until = null, question_id = null where user_id = auth.uid();
    return true;
  end if;

  update public.admin_guard
     set fails = g.fails + 1,
         locked_until = case when g.fails + 1 >= 5 then now() + interval '30 minutes' else null end
   where user_id = auth.uid();
  return false;
end $$;

-- 로그아웃 시 승인 기록 지우기
create or replace function public.admin_logout()
returns void language sql volatile security definer set search_path = public
as $$ delete from public.admin_sessions where session_id = auth.jwt() ->> 'session_id'; $$;

-- 실행 권한: 로그인한 사용자만 (방문자는 불가)
revoke execute on function public.is_admin_user(), public.admin_status(), public.get_admin_question(),
  public.verify_admin_answer(text), public.admin_logout() from public, anon;
grant execute on function public.is_admin_user(), public.admin_status(), public.get_admin_question(),
  public.verify_admin_answer(text), public.admin_logout() to authenticated;
