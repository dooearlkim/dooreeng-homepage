# 두레이엔지 홈페이지

흡수식 냉온수기·냉동기 정비 전문 업체 **두레이엔지** 홈페이지입니다.
GitHub Pages로 무료 운영하고, 고객지원 게시판은 Supabase(무료)를 씁니다.

## 파일 구성

| 파일 | 내용 |
|---|---|
| `index.html` | 홈페이지 본문 (문구 수정은 여기서) |
| `style.css` | 색상·디자인 |
| `config.js` | **전화번호, 게시판 연결 정보** (가장 자주 고칠 파일) |
| `app.js` | 가견적 계산기, 게시판 동작 (단가표도 여기 있음) |
| `supabase/schema.sql` | 게시판 DB 설정 (한 번만 실행) |
| `supabase/admin_login_id.sql` | 관리자 아이디 로그인 설정 (한 번만 실행) |
| `supabase/admin_2step.sql` | 관리자 2단계 로그인 설정 (한 번만 실행) |
| `supabase/projects.sql` | 시공실적 관리·사진 저장소 설정 (한 번만 실행) |
| `supabase/leads.sql` | 견적 요청(가망 고객) 저장 설정 (한 번만 실행) |
| `supabase/projects_sample.sql` | (선택) 예전 실적 5건 예시 넣기 (한 번만) |
| `supabase/admin_questions_template.sql` | 보안 질문 등록 양식 (**실제 답을 여기에 적어 올리지 말 것**) |
| `assets/` | 로고, 사진 |

## 자주 하는 수정

- 파일을 고친 뒤 화면이 안 바뀌면 `index.html` 안의 `?v=` 뒤 숫자를 바꾸면 됩니다 (브라우저 캐시 방지)

- **전화번호 바꾸기**: `config.js` 의 `PHONE_DISPLAY`, `PHONE_TEL`
- **가견적 단가 바꾸기**: `app.js` 의 `CAPS` 목록에 있는 `price` 숫자
- **문구·실적 바꾸기**: `index.html` 에서 해당 글자를 찾아 수정

GitHub 웹사이트에서 파일을 열고 연필(Edit) 버튼으로 고친 뒤 **Commit changes** 를 누르면 1~2분 뒤 홈페이지에 반영됩니다.

## 게시판 연결 (처음 한 번)

연결 전에는 게시판이 '예시 모드'로 보입니다.

1. https://supabase.com 에서 무료 가입 → **New project** 생성 (지역: Northeast Asia (Seoul))
2. 왼쪽 메뉴 **SQL Editor** → `supabase/schema.sql` 내용을 붙여넣고 **Run**
3. **Authentication → Users → Add user** 로 동생분 이메일·비밀번호 계정 만들기
4. 다시 SQL Editor 에서 아래 실행 (이메일만 바꿔서)
   ```sql
   insert into public.admins (user_id)
     select id from auth.users where email = '동생분이메일@example.com';
   ```
5. **Project Settings → API** 에서 `Project URL` 과 `anon public` 키를 복사해 `config.js` 에 붙여넣기
   (anon 키는 공개되어도 괜찮은 키입니다. `service_role` 키는 절대 넣지 마세요.)
6. **Authentication → Sign In / Providers** 에서 회원가입(Allow new users to sign up)을 꺼 두면 더 안전합니다.

## 관리자 2단계 로그인

1. SQL Editor 에서 `supabase/admin_2step.sql` 내용을 붙여넣고 **Run**
2. `supabase/admin_questions_template.sql` 내용을 SQL Editor 에 붙여넣고, 질문과 '정답' 부분을 바꿔서 **Run**
   (답은 암호화되어 저장됩니다. 실행 후 SQL Editor 에 저장된 쿼리는 삭제하세요.)

## 답변 달기

홈페이지 고객지원 게시판의 **관리자 로그인** → 비밀번호 → 보안 질문(무작위 1개) 순서로 들어가면
글마다 답변 등록·삭제 버튼이 나타납니다. 보안 질문을 5번 틀리면 30분 동안 잠깁니다.

## 시공실적 관리

1. SQL Editor 에서 `supabase/projects.sql` 을 실행 (테이블·사진 저장소 설정, 한 번만)
   - 예전 실적 5건을 예시로 넣고 싶으면 `supabase/projects_sample.sql` 도 한 번 실행 (선택)
2. 홈페이지에서 관리자 로그인(2단계)을 하면 시공실적 아래에 **+ 시공실적 추가** 버튼이 생깁니다
3. 실적을 누르면 상세 팝업이 열리고, 관리자에게는 **수정·삭제** 버튼이 보입니다
   (사진은 최대 6장, 자동으로 줄여서 저장. 첫 번째 사진이 대표 사진)

## 견적 요청 (가망 고객)

1. SQL Editor 에서 `supabase/leads.sql` 을 한 번 실행
2. 손님이 '30초 가견적'에서 **이 내용으로 견적 요청하기** → 연락처 입력 → 저장
3. 관리자 로그인하면 '견적 요청 (가망 고객)' 칸이 나타나고, 상태(신규·연락함·견적 발송·계약·보류)와 메모를 관리합니다
