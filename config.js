// ============================================================
// 두레이엔지 홈페이지 설정 파일
// 이 파일만 고치면 사이트 전체에 반영됩니다.
// ============================================================
window.DOOREE_CONFIG = {
  // 홈페이지에 보이는 대표 전화번호 (050/070 번호 발급 후 교체)
  PHONE_DISPLAY: '050-XXXX-XXXX',
  // 전화·문자 버튼이 거는 번호 (숫자만)
  PHONE_TEL: '050XXXXXXXX',

  // 고객지원 게시판용 Supabase 정보 (README의 "게시판 연결" 참고)
  // 비워 두면 게시판이 '예시 모드'로 동작합니다.
  SUPABASE_URL: 'https://wfpthvtogogdaqarupkc.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_qWD9LlXUiYv4792L9M-9YA_q1BXF5AI',

  // 관리자 아이디 뒤에 자동으로 붙는 주소 (Supabase 계정은 이메일 형식이어야 해서)
  // 예: 아이디 hopeso9517 → hopeso9517@dooreeng.example 계정으로 로그인
  ADMIN_ID_DOMAIN: 'dooreeng.example'
};
