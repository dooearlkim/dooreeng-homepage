(function () {
  'use strict';
  var CFG = window.DOOREE_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };
  if (!CFG.SUPABASE_URL || !CFG.SUPABASE_ANON_KEY || !window.supabase) {
    $('setup-msg').hidden = false;
    return;
  }
  var db = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
  var filter = 'wait';

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function fmt(ts) {
    return ts ? new Date(ts).toLocaleString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  }

  async function show() {
    var s = await db.auth.getSession();
    var logged = !!(s.data && s.data.session);
    $('login').hidden = logged;
    $('panel').hidden = !logged;
    $('logout').hidden = !logged;
    if (logged) load();
  }

  $('login').addEventListener('submit', async function (e) {
    e.preventDefault();
    $('login-msg').textContent = '';
    var r = await db.auth.signInWithPassword({ email: $('email').value.trim(), password: $('pw').value });
    if (r.error) { $('login-msg').textContent = '이메일 또는 비밀번호가 맞지 않습니다.'; return; }
    show();
  });
  $('logout').addEventListener('click', async function () { await db.auth.signOut(); show(); });
  $('reload').addEventListener('click', load);
  document.querySelectorAll('[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () {
      filter = b.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      load();
    });
  });

  async function load() {
    var q = db.from('posts').select('*').order('created_at', { ascending: false }).limit(100);
    if (filter === 'wait') q = q.is('answer', null);
    var r = await q;
    var list = $('admin-list');
    list.innerHTML = '';
    if (r.error) { $('panel-msg').textContent = '불러오기 실패: 관리자 권한이 등록되었는지 확인해 주세요.'; return; }
    $('panel-msg').textContent = filter === 'wait' ? '답변을 기다리는 글 ' + r.data.length + '개' : '최근 글 ' + r.data.length + '개';
    r.data.forEach(function (p) { list.appendChild(card(p)); });
  }

  function card(p) {
    var art = el('article', 'post');
    var top = el('div', 'post-top');
    top.appendChild(el('span', 'status ' + (p.answer ? 'done' : 'wait'), p.answer ? '답변 완료' : '답변 대기'));
    top.appendChild(el('span', 'who', p.author + ' · ' + fmt(p.created_at) + (p.is_secret ? ' · 비밀글' : '')));
    art.appendChild(top);
    art.appendChild(el('h3', null, p.title));
    art.appendChild(el('p', 'body', p.body));
    if (p.contact) {
      var c = el('a', 'contact-line', '연락처: ' + p.contact);
      c.href = 'tel:' + p.contact.replace(/[^0-9+]/g, '');
      art.appendChild(c);
    }
    var id = 'ans-' + p.id;
    var lab = el('label', null, '답변');
    lab.htmlFor = id;
    lab.style.fontWeight = '700';
    var ta = el('textarea');
    ta.id = id;
    ta.rows = 4;
    ta.maxLength = 4000;
    ta.value = p.answer || '';
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
    });
    del.addEventListener('click', async function () {
      if (del.dataset.confirm !== '1') { del.dataset.confirm = '1'; del.textContent = '한 번 더 누르면 삭제'; return; }
      var r = await db.from('posts').delete().eq('id', p.id);
      if (!r.error) art.remove();
    });
    btns.appendChild(save);
    btns.appendChild(del);
    art.appendChild(lab);
    art.appendChild(ta);
    art.appendChild(btns);
    art.appendChild(note);
    return art;
  }

  show();
})();
