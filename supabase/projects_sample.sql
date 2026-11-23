-- ============================================================
-- (선택) 처음 한 번만: 예전 실적 5건을 예시로 넣기
-- 실적이 하나라도 있으면 아무것도 넣지 않습니다. 다시 실행할 필요 없습니다.
-- 이후 실적 추가·수정·삭제는 홈페이지 관리자 화면에서 합니다.
-- ============================================================
insert into public.projects (category, company, title, content, work_date, created_at)
select * from (values
  ('체육시설', '서남권야구장', '장비 도장 작업', '냉동기 본체 지지대 도장 작업', '2014.07', now() - interval '5 minutes'),
  ('공공시설', '광명소각장', '질소 가압 누설 검사 · 펌프 패킹 교체', '질소 가압 누설 검사 후 펌프 패킹 교체', '2014.08', now() - interval '4 minutes'),
  ('병원', '인천성모병원', '냉동기 정비', '냉동기 정비 작업', '2014.05', now() - interval '3 minutes'),
  ('오피스', '제일기획', '열교환기 정비', '질소 가압, 용액 추출, 열교환기 절단·분해, 배관 반입 등 열교환기 정비', '2014.08', now() - interval '2 minutes'),
  ('대형마트', '홈플러스 영등포점', '흡수식 냉온수기 세관', '흡수식 냉온수기 700RT × 3대 세관 작업', '2014.04', now() - interval '1 minutes')
) as v(category, company, title, content, work_date, created_at)
where not exists (select 1 from public.projects);
