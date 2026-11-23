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
| `admin.html`, `admin.js` | 동생분이 답변을 다는 관리자 화면 |
| `supabase/schema.sql` | 게시판 DB 설정 (한 번만 실행) |
| `assets/` | 로고, 사진 |

## 자주 하는 수정

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

답변은 홈페이지 맨 아래 **관리자** 링크(`admin.html`)에서 로그인해서 답니다.
