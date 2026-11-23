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

  // 게시판 맨 위에 항상 보이는 '자주 받는 문의' (두레이엔지가 직접 작성)
  var PINNED = [
    { title: '난방 전환 전에 점검을 꼭 받아야 하나요?',
      body: '여름 내내 냉방으로 쓰던 흡수식 냉온수기를 겨울 난방으로 바꾸려고 합니다. 그냥 전환해도 되나요?',
      answer: '전환 전 점검을 권합니다. 연소 장치(버너)와 안전장치 작동, 용액 상태, 진공도를 확인하고 냉각수 배관 동파 대비까지 함께 해야 겨울철 갑작스러운 정지를 막을 수 있습니다.' },
    { title: '진공도가 떨어지면 어떤 증상이 나타나나요?',
      body: '냉방은 되는데 예전만큼 시원하지 않습니다. 진공 문제일 수도 있나요?',
      answer: '네, 가능성이 있습니다. 미세한 누설로 공기가 들어오면 냉수 온도가 잘 내려가지 않고 냉방 능력이 떨어집니다. 질소 가압 누설 검사로 새는 곳을 찾고 진공 작업으로 성능을 회복할 수 있습니다.' },
    { title: '세관 작업은 얼마나 걸리고, 영업 중에도 가능한가요?',
      body: '마트 영업에 지장이 없도록 하고 싶습니다.',
      answer: '장비 용량과 오염 정도에 따라 다르지만 보통 대당 1~2일 정도 걸립니다. 냉방을 쓰지 않는 시기나 영업시간 외로 일정을 맞춰 영업에 지장이 없도록 진행합니다.' },
    { title: '연간 유지보수 견적은 어떻게 받나요?',
      body: '건물 냉온수기 3대를 1년 단위로 맡기고 싶습니다.',
      answer: '장비 제조사, 용량(RT), 대수를 알려주시면 현장 점검 후 정기 점검 횟수와 세관, 긴급 출동 범위를 포함한 견적을 드립니다. 위 30초 가견적이나 문자로 먼저 남겨주셔도 됩니다.' }
  ];
  function renderPinned(p) {
    var art = el('article', 'post');
    var top = el('div', 'post-top');
    top.appendChild(el('span', 'status pinned', '자주 받는 문의'));
    top.appendChild(el('span', 'status done', '답변 완료'));
    art.appendChild(top);
    art.appendChild(el('h3', null, p.title));
    art.appendChild(el('p', 'body', p.body));
    var ans = el('div', 'answer');
    ans.appendChild(el('strong', null, '두레이엔지 답변'));
    ans.appendChild(el('p', null, p.answer));
    art.appendChild(ans);
    return art;
  }

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

  var qForm = document.getElementById('admin-question');
  var aMsg = document.getElementById('a-msg');
  var qMsg = document.getElementById('q-msg');

  // 관리자 상태: none / need_answer / locked / verified (판단은 서버에서)
  async function checkAdmin() {
    isAdmin = false;
    var status = 'none';
    if (db) {
      var s = await db.auth.getSession();
      if (s.data && s.data.session) {
        var r = await db.rpc('admin_status');
        status = r.error ? 'none' : r.data;
      }
    }
    isAdmin = status === 'verified';
    adminBar.hidden = !isAdmin;
    adminToggle.hidden = !db || isAdmin;
    adminLogin.hidden = true;
    qForm.hidden = true;
    if (status === 'need_answer') await askQuestion();
    if (status === 'locked') showLocked();
    return status;
  }
  function showLocked() {
    qForm.hidden = false;
    document.getElementById('q-text').textContent = '보안 질문을 5번 틀려서 30분 동안 잠겼습니다.';
    document.getElementById('q-answer').disabled = true;
    document.getElementById('q-submit').disabled = true;
  }
  async function askQuestion() {
    var r = await db.rpc('get_admin_question');
    if (r.error) {
      if (String(r.error.message).indexOf('locked') >= 0) { showLocked(); return; }
      qForm.hidden = false;
      document.getElementById('q-text').textContent = '등록된 보안 질문이 없습니다. README의 "보안 질문 등록"을 먼저 진행해 주세요.';
      return;
    }
    qForm.hidden = false;
    document.getElementById('q-answer').disabled = false;
    document.getElementById('q-submit').disabled = false;
    document.getElementById('q-text').textContent = r.data;
    document.getElementById('q-answer').value = '';
    document.getElementById('q-answer').focus();
  }
  adminToggle.addEventListener('click', function () {
    adminLogin.hidden = !adminLogin.hidden;
    if (!adminLogin.hidden) document.getElementById('a-email').focus();
  });
  // 1단계: 비밀번호
  adminLogin.addEventListener('submit', async function (e) {
    e.preventDefault();
    aMsg.textContent = '';
    var id = document.getElementById('a-email').value.trim();
    if (id.indexOf('@') < 0) id = id + '@' + (CFG.ADMIN_ID_DOMAIN || 'dooreeng.example');
    var r = await db.auth.signInWithPassword({ email: id.toLowerCase(), password: document.getElementById('a-pw').value });
    if (r.error) { aMsg.textContent = '아이디 또는 비밀번호가 맞지 않습니다.'; return; }
    adminLogin.reset();
    var st = await checkAdmin();
    if (st === 'none') {
      await db.auth.signOut();
      adminLogin.hidden = false;
      aMsg.textContent = '관리자로 등록된 계정이 아닙니다.';
    }
  });
  // 2단계: 보안 질문
  qForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    qMsg.textContent = '';
    var r = await db.rpc('verify_admin_answer', { ans: document.getElementById('q-answer').value });
    if (r.error) {
      if (String(r.error.message).indexOf('locked') >= 0) { showLocked(); return; }
      qMsg.textContent = '확인 중 문제가 생겼습니다. 다시 시도해 주세요.';
      return;
    }
    if (r.data !== true) {
      qMsg.textContent = '답이 맞지 않습니다. (5번 틀리면 30분 동안 잠깁니다)';
      var st = await db.rpc('admin_status');
      if (st.data === 'locked') showLocked();
      return;
    }
    await checkAdmin();
    loadPosts(true);
  });
  document.getElementById('q-cancel').addEventListener('click', async function () {
    await db.auth.signOut();
    await checkAdmin();
  });
  document.getElementById('admin-logout').addEventListener('click', async function () {
    await db.rpc('admin_logout');
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
    if (reset) {
      list.innerHTML = ''; loaded = 0;
      if (!isAdmin) PINNED.forEach(function (p) { list.appendChild(renderPinned(p)); });
    }
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
    if (loaded === 0 && res.data.length === 0 && isAdmin) {
      list.appendChild(el('p', 'small-note', waitOnly.checked ? '답변을 기다리는 글이 없습니다.' : '아직 등록된 글이 없습니다.'));
    }
    res.data.forEach(function (p) { list.appendChild(renderPost(p)); });
    loaded += res.data.length;
    moreBtn.hidden = res.data.length < PAGE;
  }
  moreBtn.addEventListener('click', function () { loadPosts(false); });

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
    if (ev === 'SIGNED_OUT') { isAdmin = false; adminBar.hidden = true; adminToggle.hidden = false; qForm.hidden = true; }
  });
})();
