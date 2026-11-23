(function () {
  'use strict';
  var CFG = window.DOOREE_CONFIG || {};
  var PHONE = CFG.PHONE_DISPLAY || '';
  var TEL = (CFG.PHONE_TEL || '').replace(/[^0-9+]/g, '');
  if (TEL.length < 9) TEL = ''; // 번호 설정 전에는 비활성

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function smsHref(body) {
    if (!TEL) return '#contact';
    return 'sms:' + TEL + (body ? '?body=' + encodeURIComponent(body) : '');
  }

  // ---------- 메인 사진 슬라이드 ----------
  var slides = document.querySelectorAll('.hero-bg .slide');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (slides.length > 1 && !reduce) {
    var cur = 0;
    setInterval(function () {
      slides[cur].classList.remove('on');
      cur = (cur + 1) % slides.length;
      slides[cur].classList.add('on');
    }, 5500);
  }

  // ---------- 스크롤하면 부드럽게 나타나기 ----------
  var targets = document.querySelectorAll(
    'section:not(.hero) h2, section:not(.hero) .eyebrow, .head-row > p, .card, .photo, .tile, .pills, .steps li, details, .est-form, .result, .board-form, .stats .stat'
  );
  targets.forEach(function (t) {
    var sibs = t.parentElement ? Array.prototype.indexOf.call(t.parentElement.children, t) : 0;
    t.classList.add('reveal');
    t.style.setProperty('--d', Math.min(sibs, 6) * 0.08 + 's');
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add('in'); });
  }

  // ---------- 전화 / 문자 버튼 ----------
  document.querySelectorAll('.js-tel').forEach(function (a) {
    if (TEL) a.href = 'tel:' + TEL;
  });
  document.querySelectorAll('.js-phone').forEach(function (s) {
    if (PHONE) s.textContent = PHONE;
  });
  document.querySelectorAll('.js-sms').forEach(function (a) {
    a.href = smsHref('[두레이엔지 문의]\n');
  });

  // ---------- 30초 가견적 ----------
  // 단가는 여기서 바꾸면 됩니다 (세관 1대 기준, 부가세 별도)
  var JOBS = [
    { id: 'sekwan', label: '세관 작업' },
    { id: 'leak', label: '누설 검사 · 진공' },
    { id: 'repair', label: '부품 교체 · 수리' },
    { id: 'annual', label: '연간 유지보수' }
  ];
  var CAPS = [
    { id: 'c1', label: '100RT 이하', price: 600000 },
    { id: 'c2', label: '101~200', price: 750000 },
    { id: 'c3', label: '201~300', price: 800000 },
    { id: 'c4', label: '301~400', price: 900000 },
    { id: 'c5', label: '401~500', price: 1000000 },
    { id: 'c6', label: '501~600', price: 1050000 },
    { id: 'c7', label: '601~700', price: 1150000 },
    { id: 'c8', label: '701~1000', price: 1400000 },
    { id: 'c9', label: '1001RT 이상', price: 1900000 }
  ];
  var COUNTS = [
    { id: 1, label: '1대' }, { id: 2, label: '2대' }, { id: 3, label: '3대' }, { id: 4, label: '4대 이상' }
  ];
  var pick = { job: null, cap: null, count: null };

  function makeChips(containerId, list, key) {
    var box = document.getElementById(containerId);
    list.forEach(function (item) {
      var b = el('button', 'chip', item.label);
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () {
        pick[key] = item;
        box.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        updateEstimate();
      });
      box.appendChild(b);
    });
  }
  function won(n) { return n.toLocaleString('ko-KR') + '원'; }
  function updateEstimate() {
    var amount = document.getElementById('est-amount');
    var detail = document.getElementById('est-detail');
    var j = pick.job, c = pick.cap, n = pick.count;
    if (j && c && n) {
      if (j.id === 'sekwan') {
        amount.textContent = '약 ' + won(c.price * n.id) + (n.id >= 4 ? '부터' : '');
        detail.textContent = c.label + ' · ' + n.label + ' 세관 기준 (대당 ' + won(c.price) + ')';
      } else {
        amount.textContent = '현장 확인 후 안내';
        detail.textContent = j.label + '은(는) 설비 상태에 따라 금액 차이가 커서, 점검 후 정확히 알려드립니다.';
      }
    }
    var msg = '[두레이엔지 견적 문의]\n작업: ' + (j ? j.label : '-') + '\n용량: ' + (c ? c.label : '-') +
      '\n대수: ' + (n ? n.label : '-') + '\n건물명/위치: ';
    document.getElementById('est-sms').href = smsHref(msg);
  }
  makeChips('chips-job', JOBS, 'job');
  makeChips('chips-cap', CAPS, 'cap');
  makeChips('chips-count', COUNTS, 'count');
  updateEstimate();

  // ---------- 고객지원 게시판 ----------
  var PAGE = 10;
  var list = document.getElementById('post-list');
  var moreBtn = document.getElementById('more-btn');
  var modeNote = document.getElementById('board-mode');
  var form = document.getElementById('board-form');
  var msg = document.getElementById('form-msg');
  var db = null;
  var loaded = 0;

  if (CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && window.supabase) {
    db = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
  }

  var demoPosts = [
    { author: '○○시네마 시설팀', created_at: null, whenText: '예시', title: '냉동기 운전 중 경보가 울리고 멈췄어요', body: '흡수식 2호기가 고온재생기 온도 경보 후 정지했습니다. 재가동해도 되나요?', answer: '바로 재가동하지 마시고 냉각수 펌프와 냉각탑 팬이 돌고 있는지 먼저 확인해 주세요. 내일 오전에 현장 방문하겠습니다.', is_secret: false },
    { author: '○○병원 관리과', created_at: null, whenText: '예시', title: '세관 시기 문의드립니다', body: '작년 4월에 세관했는데 올해도 같은 시기에 하면 될까요? 장비는 300RT 2대입니다.', answer: '네, 냉방 시즌 전인 3~4월이 적당합니다. 일정은 전화로 잡아드리겠습니다.', is_secret: false },
    { author: '비밀글', created_at: null, whenText: '예시', title: '연간 유지보수 견적 요청', body: '', answer: null, is_secret: true }
  ];

  function fmt(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    return d.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  var isAdmin = false;

  function renderPost(p) {
    var art = el('article', 'post');
    var top = el('div', 'post-top');
    var done = !!p.answer;
    var hide = p.is_secret && !isAdmin;
    top.appendChild(el('span', 'status ' + (done ? 'done' : 'wait'), done ? '답변 완료' : '답변 대기'));
    top.appendChild(el('span', 'who', (hide ? '비밀글' : (p.author || '익명')) + ' · ' + (p.whenText || fmt(p.created_at))));
    art.appendChild(top);
    art.appendChild(el('h3', null, (p.is_secret ? '[비밀글] ' : '') + p.title));
    art.appendChild(el('p', 'body', hide ? '작성자와 관리자만 볼 수 있는 글입니다.' : p.body));
    if (done && !hide && !isAdmin) {
      var ans = el('div', 'answer');
      ans.appendChild(el('strong', null, '두레이엔지 답변' + (p.answered_at ? ' · ' + fmt(p.answered_at) : '')));
      ans.appendChild(el('p', null, p.answer));
      art.appendChild(ans);
    }
    if (isAdmin && p.id) art.appendChild(adminControls(p, art));
    return art;
  }

  // ---------- 관리자 기능 (로그인한 관리자에게만 보임) ----------
  function adminControls(p, art) {
    var box = el('div', 'admin-ctrl');
    if (p.contact) {
      var c = el('a', 'contact-line', '연락처: ' + p.contact);
      c.href = 'tel:' + p.contact.replace(/[^0-9+]/g, '');
      box.appendChild(c);
    }
    var id = 'ans-' + p.id;
    var lab = el('label', null, '답변');
    lab.htmlFor = id;
    lab.style.fontWeight = '700';
    lab.style.fontSize = '14px';
    var ta = el('textarea');
    ta.id = id; ta.rows = 3; ta.maxLength = 4000; ta.value = p.answer || '';
    var btns = el('div', 'row-btns');
    var save = el('button', 'btn btn-blue', p.answer ? '답변 수정' : '답변 등록');
    save.type = 'button';
    var del = el('button', 'btn btn-del', '글 삭제');
    del.type = 'button';
    var note = el('p', 'form-msg');
    save.addEventListener('click', async function () {
      var text = ta.value.trim();
      save.disabled = true;
      var r = await db.from('posts').update({ answer: text || null, answered_at: text ? new Date().toISOString() : null }).eq('id', p.id);
      save.disabled = false;
      note.className = 'form-msg ' + (r.error ? 'err' : 'ok');
      note.textContent = r.error ? '저장 실패. 다시 시도해 주세요.' : '저장되었습니다.';
      if (!r.error) {
        save.textContent = text ? '답변 수정' : '답변 등록';
        var st = art.querySelector('.status');
        st.className = 'status ' + (text ? 'done' : 'wait');
        st.textContent = text ? '답변 완료' : '답변 대기';
      }
    });
    del.addEventListener('click', async function () {
      if (del.dataset.confirm !== '1') { del.dataset.confirm = '1'; del.textContent = '한 번 더 누르면 삭제'; return; }
      var r = await db.from('posts').delete().eq('id', p.id);
      if (r.error) { note.className = 'form-msg err'; note.textContent = '삭제 실패. 다시 시도해 주세요.'; return; }
      art.remove();
    });
    btns.appendChild(save); btns.appendChild(del);
    box.appendChild(lab); box.appendChild(ta); box.appendChild(btns); box.appendChild(note);
    return box;
  }

  var adminToggle = document.getElementById('admin-toggle');
  var adminLogin = document.getElementById('admin-login');
  var adminBar = document.getElementById('admin-bar');
  var waitOnly = document.getElementById('a-wait');

  async function checkAdmin() {
    isAdmin = false;
    if (db) {
      var s = await db.auth.getSession();
      if (s.data && s.data.session) {
        var r = await db.rpc('is_admin');
        isAdmin = r.data === true;
      }
    }
    adminBar.hidden = !isAdmin;
    adminToggle.hidden = !db || isAdmin;
    if (isAdmin) adminLogin.hidden = true;
  }
  adminToggle.addEventListener('click', function () {
    adminLogin.hidden = !adminLogin.hidden;
    if (!adminLogin.hidden) document.getElementById('a-email').focus();
  });
  adminLogin.addEventListener('submit', async function (e) {
    e.preventDefault();
    var m = document.getElementById('a-msg');
    m.textContent = '';
    var r = await db.auth.signInWithPassword({ email: document.getElementById('a-email').value.trim(), password: document.getElementById('a-pw').value });
    if (r.error) { m.textContent = '이메일 또는 비밀번호가 맞지 않습니다.'; return; }
    await checkAdmin();
    if (!isAdmin) { m.textContent = '관리자로 등록된 계정이 아닙니다.'; adminLogin.hidden = false; await db.auth.signOut(); return; }
    adminLogin.reset();
    loadPosts(true);
  });
  document.getElementById('admin-logout').addEventListener('click', async function () {
    await db.auth.signOut();
    await checkAdmin();
    loadPosts(true);
  });
  waitOnly.addEventListener('change', function () { loadPosts(true); });

  async function loadPosts(reset) {
    if (!db) {
      modeNote.textContent = '※ 예시 게시판입니다. 게시판 서버를 연결하면 실제 글이 표시됩니다.';
      list.innerHTML = '';
      demoPosts.forEach(function (p) { list.appendChild(renderPost(p)); });
      return;
    }
    if (reset) { list.innerHTML = ''; loaded = 0; }
    var q = db.from(isAdmin ? 'posts' : 'public_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(loaded, loaded + PAGE - 1);
    if (isAdmin && waitOnly.checked) q = q.is('answer', null);
    var res = await q;
    if (res.error) {
      modeNote.textContent = '게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
      return;
    }
    modeNote.textContent = '';
    if (loaded === 0 && res.data.length === 0) {
      list.appendChild(el('p', 'small-note', isAdmin && waitOnly.checked ? '답변을 기다리는 글이 없습니다.' : '아직 등록된 글이 없습니다. 첫 문의를 남겨주세요.'));
    }
    res.data.forEach(function (p) { list.appendChild(renderPost(p)); });
    loaded += res.data.length;
    moreBtn.hidden = res.data.length < PAGE;
  }
  moreBtn.addEventListener('click', function () { loadPosts(false); });

  // 새 글이 올라오면 메일로 알림 (config.js 의 NOTIFY_ACCESS_KEY 가 있을 때만)
  function notifyByEmail(row) {
    if (!CFG.NOTIFY_ACCESS_KEY) return;
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: CFG.NOTIFY_ACCESS_KEY,
        subject: '[두레이엔지 홈페이지] 새 상담글: ' + row.title,
        from_name: '두레이엔지 홈페이지',
        '작성자': row.author,
        '연락처': row.contact || '(없음)',
        '제목': row.title,
        '내용': row.body,
        '비밀글': row.is_secret ? '예' : '아니오',
        '답변하러 가기': location.href.split('#')[0] + '#board'
      })
    }).catch(function () {});
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    msg.className = 'form-msg';
    var v = function (id) { return document.getElementById(id).value.trim(); };
    if (v('f-website')) return; // 스팸 방지
    var row = {
      author: v('f-author'),
      contact: v('f-contact') || null,
      title: v('f-title'),
      body: v('f-body'),
      is_secret: document.getElementById('f-secret').checked
    };
    if (!row.author || !row.title || !row.body) {
      msg.textContent = '건물명(이름), 제목, 내용을 모두 적어 주세요.';
      msg.classList.add('err');
      return;
    }
    var last = 0;
    try { last = Number(localStorage.getItem('dooree_last_post') || 0); } catch (err) {}
    if (Date.now() - last < 60000) {
      msg.textContent = '잠시 후(1분 뒤) 다시 등록해 주세요.';
      msg.classList.add('err');
      return;
    }
    var btn = document.getElementById('f-submit');
    btn.disabled = true;
    if (db) {
      var res = await db.from('posts').insert(row);
      btn.disabled = false;
      if (res.error) {
        msg.textContent = '등록하지 못했습니다. 잠시 후 다시 시도하거나 전화 주세요.';
        msg.classList.add('err');
        return;
      }
      notifyByEmail(row);
      await loadPosts(true);
    } else {
      btn.disabled = false;
      row.whenText = '방금 전';
      row.answer = null;
      demoPosts.unshift(row);
      loadPosts(true);
    }
    try { localStorage.setItem('dooree_last_post', String(Date.now())); } catch (err) {}
    form.reset();
    msg.textContent = '등록되었습니다. 확인 후 빠르게 답변드리겠습니다.';
    msg.classList.add('ok');
  });

  checkAdmin().then(function () { loadPosts(true); });
  if (db) db.auth.onAuthStateChange(function (ev) {
    if (ev === 'SIGNED_OUT') { isAdmin = false; adminBar.hidden = true; adminToggle.hidden = false; }
  });
})();
