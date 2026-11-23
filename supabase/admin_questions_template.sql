-- ============================================================
-- 보안 질문 등록 양식
-- ※ 이 파일에 실제 답을 적어서 GitHub에 올리지 마세요!
--   Supabase SQL Editor 에 붙여넣은 다음, 거기서 '정답' 부분만 바꿔서 실행하세요.
-- ※ 답은 암호화되어 저장되므로 등록 후에는 아무도 원래 답을 볼 수 없습니다.
-- ※ 띄어쓰기와 영문 대소문자는 구분하지 않습니다. ("홍 길동" = "홍길동")
-- ※ 실행 후 SQL Editor 왼쪽 목록에 저장된 이 쿼리는 삭제해 두세요.
-- ============================================================

insert into public.admin_questions (question, answer_hash) values
  ('고향이 어디인가요?',              extensions.crypt(public.norm_answer('정답1'),  extensions.gen_salt('bf'))),
  ('아버지 성함을 입력하세요',         extensions.crypt(public.norm_answer('정답2'),  extensions.gen_salt('bf'))),
  ('첫째 딸 이름을 입력하세요',        extensions.crypt(public.norm_answer('정답3'),  extensions.gen_salt('bf'))),
  ('질문4',                         extensions.crypt(public.norm_answer('정답4'),  extensions.gen_salt('bf'))),
  ('질문5',                         extensions.crypt(public.norm_answer('정답5'),  extensions.gen_salt('bf'))),
  ('질문6',                         extensions.crypt(public.norm_answer('정답6'),  extensions.gen_salt('bf'))),
  ('질문7',                         extensions.crypt(public.norm_answer('정답7'),  extensions.gen_salt('bf'))),
  ('질문8',                         extensions.crypt(public.norm_answer('정답8'),  extensions.gen_salt('bf'))),
  ('질문9',                         extensions.crypt(public.norm_answer('정답9'),  extensions.gen_salt('bf'))),
  ('질문10',                        extensions.crypt(public.norm_answer('정답10'), extensions.gen_salt('bf')));

-- 질문을 모두 지우고 새로 등록하려면 아래 두 줄을 먼저 실행하세요.
-- update public.admin_guard set question_id = null;
-- delete from public.admin_questions;
