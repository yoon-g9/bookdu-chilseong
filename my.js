(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KEY = 'bukdu_my_v1';
  const CAP = 30;

  /* ───────── 데이터 정의 ───────── */
  const GENRES = [
    ['한국소설', '#FF6B6B'], ['외국소설', '#FFA05A'], ['장르소설', '#B58CFF'], ['동화·그림책', '#FFE066'],
    ['시·에세이', '#FFB3E6'], ['인문·철학·심리', '#7F9CFF'], ['역사·문화', '#C9A27A'], ['사회·경제', '#4FD1B5'],
    ['과학·수학·IT', '#4FC3F7'], ['예술·체육·취미', '#A5E05A'], ['자기계발·진로', '#E85BB0'], ['만화·학습만화', '#9AE3FF'],
    ['장르 미정', '#F2F0E8'],
  ];
  const gi = g => (g === '' || g == null || isNaN(+g)) ? 12 : +g;

  const ACTS = [
    { k: 'sentence', n: '문장 수집', deep: false, amt: 3 },
    { k: 'reason',   n: '읽은 계기', deep: false, amt: 4 },
    { k: 'reread',   n: '다시 읽음', deep: false, amt: 5 },
    { k: 'summary',  n: '요약',      deep: true,  amt: 6 },
    { k: 'feeling',  n: '느낀점',    deep: true,  amt: 6 },
    { k: 'question', n: '탐구 질문', deep: true,  amt: 6 },
    { k: 'photo',    n: '필사 사진', deep: true,  amt: 8 },
  ];
  const REG = { base: 5, rate: 2 };

  // 12궁: 이름, 시작(월,일), 윤곽 점·선 (100x70 상자, 도안용으로 단순화)
  const Z = [
    { n: '양자리', s: [3, 21], p: [[14,46],[36,38],[58,32],[84,20]], e: [[0,1],[1,2],[2,3]] },
    { n: '황소자리', s: [4, 20], p: [[10,16],[28,30],[42,38],[56,36],[70,28],[88,14],[50,54]], e: [[0,1],[1,2],[2,3],[3,4],[4,5],[2,6]] },
    { n: '쌍둥이자리', s: [5, 21], p: [[22,12],[26,30],[30,48],[24,60],[52,10],[54,28],[58,46],[68,58]], e: [[0,1],[1,2],[2,3],[4,5],[5,6],[6,7],[1,5]] },
    { n: '게자리', s: [6, 22], p: [[50,36],[30,14],[72,18],[38,58],[66,56]], e: [[0,1],[0,2],[0,3],[0,4]] },
    { n: '사자자리', s: [7, 23], p: [[20,36],[24,22],[34,12],[46,14],[48,28],[70,24],[86,40],[62,44]], e: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,4]] },
    { n: '처녀자리', s: [8, 23], p: [[14,18],[30,26],[44,34],[60,28],[80,18],[46,52],[64,58],[28,48]], e: [[0,1],[1,2],[2,3],[3,4],[2,5],[5,6],[2,7]] },
    { n: '천칭자리', s: [9, 23], p: [[50,12],[22,34],[78,34],[30,58],[70,58]], e: [[0,1],[0,2],[1,3],[2,4],[1,2]] },
    { n: '전갈자리', s: [10, 23], p: [[16,14],[22,26],[28,38],[38,46],[50,48],[62,44],[74,50],[84,58],[90,46]], e: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8]] },
    { n: '궁수자리', s: [11, 23], p: [[28,40],[42,28],[58,30],[72,44],[56,54],[38,54],[52,12]], e: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[1,6],[2,6]] },
    { n: '염소자리', s: [12, 22], p: [[12,22],[40,16],[78,24],[88,36],[66,58],[44,50],[26,40]], e: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0]] },
    { n: '물병자리', s: [1, 20], p: [[12,24],[28,16],[44,28],[60,18],[74,32],[88,24],[42,48],[58,58]], e: [[0,1],[1,2],[2,3],[3,4],[4,5],[2,6],[6,7]] },
    { n: '물고기자리', s: [2, 19], p: [[10,20],[22,14],[30,26],[18,32],[50,44],[70,48],[88,40],[84,56],[72,58]], e: [[0,1],[1,2],[2,3],[3,0],[2,4],[4,5],[5,6],[6,7],[7,8],[8,5]] },
  ];
  function zodiacOf(m, d) {
    const v = m * 100 + d;
    // 시작일 기준: 염소(12/22~) → 물병(1/20~) ...
    const list = Z.map((z, i) => ({ i, v: z.s[0] * 100 + z.s[1] })).sort((a, b) => a.v - b.v);
    let pick = list[list.length - 1].i; // 12/22 이후
    for (const it of list) if (v >= it.v) pick = it.i;
    if (v < list[0].v) pick = list[list.length - 1].i;
    return pick;
  }

  /* ───────── 유틸 ───────── */
  const kst = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
  const norm = s => s.replace(/[\s.,!?'"“”‘’~·…\-—()\[\]]/g, '').toLowerCase();
  const uid = () => Math.random().toString(36).slice(2, 9);
  const h = (t, a = {}, ...c) => {
    const e = document.createElement(t);
    for (const [k, v] of Object.entries(a)) {
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, '');
      else if (v !== false && v != null) e.setAttribute(k, v);
    }
    c.flat(9).forEach(x => { if (x == null || x === false) return; e.append(x.nodeType ? x : document.createTextNode(x)); });
    return e;
  };
  const svg = (t, a = {}) => {
    const e = document.createElementNS(NS, t);
    for (const [k, v] of Object.entries(a)) e.setAttribute(k, v);
    return e;
  };
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* ───────── 상태 ───────── */
  const blank = () => ({ nick: '', zodiac: -1, balance: 0, ledger: {}, books: [] });
  let S = blank();
  try { const r = localStorage.getItem(KEY); if (r) S = Object.assign(blank(), JSON.parse(r)); } catch (e) {}
  let saveWarned = false;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { if (!saveWarned) { saveWarned = true; toast('저장 공간이 부족해요. 필사 사진을 줄여 주세요.'); } }
  }
  const today = () => S.ledger[kst()] || 0;
  function pay(amount) {
    const room = Math.max(0, CAP - today());
    const got = Math.min(amount, room);
    if (got > 0) { S.ledger[kst()] = today() + got; S.balance += got; }
    if (got < amount) toast('오늘 별가루를 다 모았어요');
    return got;
  }
  const refund = n => { if (n > 0) S.balance = Math.max(0, S.balance - n); };

  const kinds = b => (b.sentences.length ? 1 : 0) + (b.reason ? 1 : 0) + (b.rereads.length ? 1 : 0) + (b.summary ? 1 : 0) + (b.feeling ? 1 : 0) + (b.question ? 1 : 0) + (b.photo ? 1 : 0);
  const levelOf = b => { const n = kinds(b); return n === 0 ? 1 : n === 1 ? 2 : n === 2 ? 3 : n <= 4 ? 4 : 5; };
  const newBook = (title, author, rating, genre) => ({
    id: uid(), title, author, rating, genre, t: Date.now(), regPaid: 0,
    sentences: [], reason: '', reasonPaid: 0, rereads: [], rereadPaid: 0, summary: '', summaryPaid: 0,
    feeling: '', feelingPaid: 0, question: '', questionPaid: 0, photo: '', photoPaid: 0, big: false, bigReason: '',
  });
  const paidSum = b => b.regPaid + b.sentences.reduce((a, s) => a + s.paid, 0) + b.reasonPaid + b.rereadPaid + b.summaryPaid + b.feelingPaid + b.questionPaid + b.photoPaid;

  /* ───────── 토스트 · 마스코트 ───────── */
  let toastT;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600);
  }
  function say(msg) { $('#mascotSay').textContent = msg; }

  /* ───────── 배경 반짝임 캔버스 ───────── */
  const cv = $('#bgsky'), cx = cv.getContext('2d');
  let CW = 0, CH = 0, dots = [], sparks = [];
  function sizeCanvas() {
    const r = cv.getBoundingClientRect(); const d = Math.min(devicePixelRatio || 1, 2);
    CW = r.width; CH = r.height; cv.width = CW * d; cv.height = CH * d; cx.setTransform(d, 0, 0, d, 0, 0);
    dots = Array.from({ length: Math.round(Math.min(160, CW * CH / 5000)) }, () => ({
      x: Math.random() * CW, y: Math.random() * CH, r: Math.random() * 1.2 + .3, p: Math.random() * 6.28, s: Math.random() * 1.5 + .4,
      c: Math.random() < .2 ? '#FFD66B' : '#ffffff',
    }));
  }
  function sparkleAt(el) {
    if (reduce || !el) return;
    const a = el.getBoundingClientRect(), b = cv.getBoundingClientRect();
    const x = a.left + a.width / 2 - b.left, y = a.top + a.height / 2 - b.top;
    for (let i = 0; i < 22; i++) { const g = Math.random() * 6.28, v = Math.random() * 2.8 + .8; sparks.push({ x, y, vx: Math.cos(g) * v, vy: Math.sin(g) * v, l: 1, r: Math.random() * 1.8 + .6 }); }
  }
  let t0 = performance.now();
  (function loop(now) {
    cx.clearRect(0, 0, CW, CH);
    const t = (now - t0) / 1000;
    for (const d of dots) { cx.globalAlpha = reduce ? .7 : .25 + .6 * (.5 + .5 * Math.sin(t * d.s + d.p)); cx.fillStyle = d.c; cx.beginPath(); cx.arc(d.x, d.y, d.r, 0, 6.283); cx.fill(); }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i]; s.x += s.vx; s.y += s.vy; s.vx *= .94; s.vy = s.vy * .94 + .03; s.l -= .022;
      if (s.l <= 0) { sparks.splice(i, 1); continue; }
      cx.globalAlpha = s.l; cx.fillStyle = '#FFD66B'; cx.beginPath(); cx.arc(s.x, s.y, s.r * s.l + .3, 0, 6.283); cx.fill();
    }
    cx.globalAlpha = 1; requestAnimationFrame(loop);
  })(t0);

  /* ───────── 별자리 위치 ───────── */
  const posCache = {};
  function positions(zi) {
    if (posCache[zi]) return posCache[zi];
    const z = Z[zi], R = rng(zi * 977 + 13), out = z.p.map(p => p.slice());
    const bad = (x, y) => (x < 22 && y < 16) || (x < 30 && y > 52);
    let tries = 0;
    while (out.length < 400 && tries++ < 20000) {
      let best = null, bd = -1;
      for (let k = 0; k < 8; k++) {
        const x = 7 + R() * 86, y = 11 + R() * 49; if (bad(x, y)) continue;
        let md = 1e9; for (const q of out) { const d = Math.hypot(q[0] - x, q[1] - y); if (d < md) md = d; }
        if (md > bd) { bd = md; best = [x, y]; }
      }
      if (best) out.push(best);
    }
    return (posCache[zi] = out);
  }

  /* ───────── 렌더 ───────── */
  const sky = $('#sky'), gOut = $('#outline'), gBooks = $('#books'), gGrads = $('#grads');
  GENRES.forEach(([, c], i) => {
    const g = svg('radialGradient', { id: 'g' + i });
    g.append(svg('stop', { offset: '0', 'stop-color': c, 'stop-opacity': '.95' }), svg('stop', { offset: '1', 'stop-color': c, 'stop-opacity': '0' }));
    gGrads.append(g);
  });
  let sel = null, popId = null, lvlId = null;

  function render(o = {}) {
    gOut.replaceChildren(); gBooks.replaceChildren();
    const zi = S.zodiac; if (zi < 0) return;
    const z = Z[zi], P = positions(zi), n = S.books.length;
    $('#zname').textContent = z.n;
    // 윤곽선
    z.e.forEach(([a, b], i) => {
      const lit = a < n && b < n;
      const L = Math.hypot(z.p[a][0] - z.p[b][0], z.p[a][1] - z.p[b][1]);
      const ln = svg('line', { x1: z.p[a][0], y1: z.p[a][1], x2: z.p[b][0], y2: z.p[b][1], class: 'edge' + (lit ? ' lit' : '') + (o.intro && !reduce ? ' draw' : '') });
      if (o.intro && !reduce) {
        ln.style.setProperty('--l', (L + 1).toFixed(1)); ln.style.setProperty('--dl', (i * .22).toFixed(2) + 's');
        ln.addEventListener('animationend', () => ln.classList.remove('draw'));
      }
      gOut.append(ln);
    });
    for (let i = n; i < z.p.length; i++) gOut.append(svg('circle', { cx: z.p[i][0], cy: z.p[i][1], r: 1.1, class: 'slot' }));
    // 별
    const upx = Math.min(sky.clientWidth / 100, sky.clientHeight / 70) || 4;
    const f = n <= 12 ? 1 : Math.max(.35, Math.sqrt(12 / n));
    S.books.forEach((b, i) => {
      const base = P[i % P.length]; const jit = i >= P.length ? rng(i)() * 2 - 1 : 0;
      const x = base[0] + jit * 2, y = base[1] + jit * 2;
      const L = levelOf(b), s = f * (.6 + .13 * L) * (b.big ? 1.6 : 1), Rr = 4.2 * s, gx = gi(b.genre), col = GENRES[gx][1];
      const g = svg('g', { class: 'bk' + (b.id === sel ? ' sel' : '') + (L === 5 ? ' tw5' : '') + (b.id === popId ? ' pop' : '') + (b.id === lvlId ? ' lvl' : ''), transform: `translate(${x.toFixed(2)} ${y.toFixed(2)})`, tabindex: 0, role: 'button', 'data-id': b.id,
        'aria-label': `${b.title}, ${b.author}, 별점 ${b.rating}, 밝기 ${L}단계${b.big ? ', 큰 별' : ''}` });
      g.append(svg('title')); g.firstChild.textContent = `${b.title} · ${GENRES[gx][0]} · 밝기 ${L}단계`;
      g.append(svg('circle', { class: 'halo', r: (Rr * (.9 + L * .32)).toFixed(2), fill: `url(#g${gx})`, opacity: (.2 + L * .13).toFixed(2) }));
      if (b.big) g.append(svg('circle', { class: 'big', r: (Rr * 1.9).toFixed(2), 'stroke-dasharray': '1 1.2' }));
      g.append(svg('circle', { class: 'ring', r: (Rr * 1.7).toFixed(2) }));
      const body = svg('g', { class: 'body' });
      const st = svg('use', { href: '#star5', fill: col, stroke: col, 'stroke-width': 1.6, 'stroke-linejoin': 'round', transform: `scale(${s.toFixed(3)})`, opacity: (.5 + L * .1).toFixed(2) });
      if (L >= 4) st.setAttribute('style', `filter:drop-shadow(0 0 ${L - 2}px ${col})`);
      body.append(st); g.append(body);
      g.append(svg('circle', { class: 'hit', r: Math.max(22 / upx, Rr * 1.2).toFixed(2) }));
      if (o.intro && !reduce) { g.classList.add('pop'); body.style.animationDelay = (.8 + Math.min(i, 30) * .07).toFixed(2) + 's'; body.style.animationFillMode = 'backwards'; }
      g.addEventListener('click', () => openDetail(b.id));
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(b.id); } });
      gBooks.append(g);
    });
    popId = lvlId = null;
    // 헤더·하단
    $('#nick').textContent = S.nick || '내 별자리';
    $('#dustBal').textContent = S.balance; $('#dustToday').textContent = `오늘 ${today()}/${CAP}`;
    $('#bookCount').textContent = n;
    const bigN = S.books.filter(b => b.big).length, allow = Math.floor(n / 5);
    $('#bigCount').textContent = n >= 5 ? `큰 별 ${bigN}/${allow}` : '';
    $('#empty').hidden = n > 0;
    $('#mascot').style.display = n > 0 ? 'flex' : 'none';
  }

  /* ───────── 상세 노트 ───────── */
  const detail = $('#detail'), dBody = $('#dBody');
  const openAct = {};
  function openDetail(id) {
    sel = id; detail.classList.add('open'); detail.setAttribute('aria-hidden', 'false'); document.body.classList.add('det-open');
    gBooks.querySelectorAll('.bk').forEach(g => g.classList.toggle('sel', g.dataset.id === id));
    renderDetail(); setTimeout(() => dBody.scrollTop = 0, 0);
  }
  function closeDetail() {
    sel = null; detail.classList.remove('open'); detail.setAttribute('aria-hidden', 'true'); document.body.classList.remove('det-open');
    gBooks.querySelectorAll('.bk.sel').forEach(g => g.classList.remove('sel'));
  }
  $('#dClose').addEventListener('click', closeDetail);
  addEventListener('keydown', e => { if (e.key === 'Escape' && detail.classList.contains('open') && !document.querySelector('dialog[open]')) closeDetail(); });

  function commit(b, before, text) {
    const after = levelOf(b);
    if (after > before) { lvlId = b.id; toast(`${text ? text + ' · ' : ''}별이 ${after}단계로 밝아졌어요!`); say(after === 5 ? '와, 가장 밝은 별이에요!' : '별이 한층 밝아졌어요'); }
    else if (text) toast(text);
    save(); render(); renderDetail();
    if (after > before) sparkleAt(gBooks.querySelector(`[data-id="${b.id}"] .body`));
  }

  function renderDetail() {
    const b = S.books.find(x => x.id === sel); if (!b) return;
    const keep = dBody.scrollTop; const L = levelOf(b), K = kinds(b), gx = gi(b.genre);
    const rate = h('div', { class: 'd-rate', role: 'radiogroup', 'aria-label': '별점' },
      [1, 2, 3, 4, 5].map(v => h('button', { type: 'button', class: v <= b.rating ? 'on' : '', 'aria-label': v + '점', 'aria-checked': String(v === b.rating), role: 'radio', onclick: () => { b.rating = v; save(); render(); renderDetail(); } }, '★')));
    const genreSel = h('select', { 'aria-label': '장르', class: 'mini ghost', onchange: e => { b.genre = e.target.value; save(); render(); renderDetail(); } },
      GENRES.map(([n], i) => h('option', { value: i === 12 ? '' : String(i), selected: i === gx }, n)));
    const acts = ACTS.map(a => actEl(b, a));
    const allow = Math.floor(S.books.length / 5), bigN = S.books.filter(x => x.big).length;
    const bigInput = h('input', { type: 'text', maxlength: 30, value: b.bigReason, placeholder: '한 줄 이유 (30자 이내)', 'aria-label': '큰 별 이유' });
    const bigChk = h('input', { type: 'checkbox', checked: b.big, onchange: e => {
      if (e.target.checked) {
        if (bigN >= allow) { e.target.checked = false; toast(allow === 0 ? '큰 별은 책 5권을 읽으면 1개 지정할 수 있어요' : '큰 별 한도예요. 다른 큰 별을 작게 바꿔 주세요'); return; }
        if (!bigInput.value.trim()) { e.target.checked = false; bigInput.focus(); toast('큰 별로 키우려면 한 줄 이유를 적어 주세요'); return; }
        b.big = true; b.bigReason = bigInput.value.trim(); toast('마음에 남은 큰 별이 되었어요'); sparkleAt(gBooks.querySelector(`[data-id="${b.id}"] .body`));
      } else { b.big = false; }
      save(); render(); renderDetail();
    } });
    dBody.replaceChildren(
      h('div', { class: 'd-genre' }, h('i', { style: `background:${GENRES[gx][1]}` }), genreSel),
      h('h2', { class: 'd-title' }, b.title), h('p', { class: 'd-author' }, b.author),
      h('div', { class: 'd-meta' }, rate,
        h('div', { class: 'stamp', 'aria-label': `밝기 ${L}단계` }, h('div', {}, '밝기', h('b', {}, L + '/5')))),
      h('div', { class: 'lvl-dots', 'aria-hidden': 'true' }, [1, 2, 3, 4, 5].map(i => h('i', { class: i <= L ? 'on' : '' }))),
      h('p', { class: 'help', style: 'margin-top:6px;color:var(--muted);font-size:13px' }, `남긴 활동 ${K}종 · 종류가 많을수록 별이 밝아져요`),
      h('div', { class: 'd-sec' }, '읽고 남기기'), h('div', { class: 'acts' }, acts),
      h('div', { class: 'bigbox' }, h('label', {}, bigChk, '마음에 남은 큰 별로 키우기'), bigInput,
        h('p', { class: 'help' }, `큰 별은 책 5권마다 1개 (지금 ${bigN}/${allow})`)),
      h('div', { class: 'dfoot' }, h('small', { style: 'color:var(--muted)' }, b.regPaid ? `등록 +${b.regPaid}` : ''),
        h('button', { class: 'mini danger', type: 'button', onclick: () => { if (confirm('이 책의 별을 지울까요? 받은 별가루도 함께 회수돼요.')) { refund(paidSum(b)); S.books = S.books.filter(x => x !== b); save(); closeDetail(); render(); toast('별을 지웠어요'); } } }, '이 별 지우기')),
    );
    dBody.scrollTop = keep;
  }

  function actEl(b, a) {
    const done = a.k === 'sentence' ? b.sentences.length > 0 : a.k === 'reread' ? b.rereads.length > 0 : !!b[a.k];
    const isOpen = openAct[b.id] === a.k;
    const el = h('div', { class: 'act' + (done ? ' done' : '') + (isOpen ? ' open' : '') });
    const head = h('button', { type: 'button', class: 'ah', 'aria-expanded': String(isOpen), onclick: () => { openAct[b.id] = isOpen ? null : a.k; renderDetail(); } },
      h('span', { class: 'ico', 'aria-hidden': 'true' }, '✓'), a.n,
      h('span', { class: 'tag' + (a.deep ? ' deep' : '') }, `${a.deep ? '깊은' : '가벼운'} · +${a.amt}`));
    const form = h('div', { class: 'af' });
    if (a.k === 'sentence') {
      const ta = h('textarea', { maxlength: 300, placeholder: '마음에 남은 문장을 그대로 옮겨 적어요', 'aria-label': '문장' });
      const pg = h('input', { type: 'text', maxlength: 12, placeholder: '쪽수 (예: 12-15)', 'aria-label': '쪽수' });
      form.append(
        h('ul', { class: 'slist' }, b.sentences.map(s => h('li', {}, h('span', {}, '“' + s.text + '” ', s.page ? h('small', {}, s.page + '쪽') : ''),
          h('button', { type: 'button', 'aria-label': '문장 지우기', onclick: () => { refund(s.paid); b.sentences = b.sentences.filter(x => x !== s); commit(b, levelOf(b)); } }, '✕')))),
        ta, h('div', { class: 'r2' }, pg, h('button', { class: 'mini', type: 'button', onclick: () => {
          const t = ta.value.trim(); if (!t) { ta.focus(); return; }
          const dup = S.books.some(x => x.sentences.some(s => norm(s.text) === norm(t)));
          const before = levelOf(b); const paid = dup ? 0 : pay(a.amt);
          b.sentences.push({ id: uid(), text: t, page: pg.value.trim(), paid });
          commit(b, before, dup ? '같은 문장은 별가루를 한 번만 받아요' : paid ? `+${paid} 별가루` : '');
        } }, '문장 추가')),
        h('p', { class: 'help' }, '문장은 여러 개 남길 수 있고, 같은 문장은 별가루를 한 번만 받아요.'));
    } else if (a.k === 'reread') {
      const doneToday = b.rereads.includes(kst());
      form.append(h('p', {}, `다시 읽은 횟수 ${b.rereads.length}회`),
        h('button', { class: 'mini', type: 'button', disabled: doneToday, onclick: () => {
          const before = levelOf(b); const paid = pay(a.amt); b.rereads.push(kst()); b.rereadPaid += paid;
          commit(b, before, paid ? `+${paid} 별가루` : '');
        } }, doneToday ? '오늘은 이미 기록했어요' : '다시 읽었어요'),
        h('p', { class: 'help' }, '다시 읽음은 하루에 한 번 기록해요.'));
    } else if (a.k === 'photo') {
      const file = h('input', { type: 'file', accept: 'image/*', 'aria-label': '필사 사진 올리기', onchange: async e => {
        const f = e.target.files[0]; if (!f) return;
        try {
          const url = await shrink(f); const before = levelOf(b);
          if (b.photo) refund(b.photoPaid);
          b.photo = url; b.photoPaid = pay(a.amt); commit(b, before, b.photoPaid ? `+${b.photoPaid} 별가루` : '');
        } catch (err) { toast('사진을 불러오지 못했어요. 다른 사진으로 해 볼까요?'); }
      } });
      form.append(b.photo ? h('img', { class: 'photo', src: b.photo, alt: '올린 필사 사진' }) : '', file,
        b.photo ? h('button', { class: 'mini danger', type: 'button', onclick: () => { refund(b.photoPaid); b.photo = ''; b.photoPaid = 0; commit(b, levelOf(b)); } }, '사진 지우기') : '',
        h('p', { class: 'help' }, '글씨 부분만 찍어 주세요. 얼굴이나 이름이 보이지 않게! 사진은 크기를 줄여 저장하고 위치 정보는 지워요.'));
    } else {
      const max = a.k === 'question' ? 100 : 1000;
      const ph = { reason: '이 책을 읽게 된 계기는?', summary: '핵심 내용을 내 말로 정리해 봐요', feeling: '읽고 난 뒤 어떤 마음이 들었나요?', question: '읽고 더 알고 싶어진 것 한 줄' }[a.k];
      const ta = h('textarea', { maxlength: max, placeholder: ph, 'aria-label': a.n }); ta.value = b[a.k];
      form.append(ta, h('div', { class: 'r2' }, h('button', { class: 'mini', type: 'button', onclick: () => {
        const before = levelOf(b), t = ta.value.trim();
        if (t) { b[a.k] = t; if (!b[a.k + 'Paid']) { const p = pay(a.amt); b[a.k + 'Paid'] = p; commit(b, before, p ? `+${p} 별가루` : '저장했어요'); } else commit(b, before, '저장했어요'); }
        else { refund(b[a.k + 'Paid']); b[a.k] = ''; b[a.k + 'Paid'] = 0; commit(b, before, '지웠어요'); }
      } }, '저장'), a.k === 'question' ? h('small', { class: 'help' }, '100자 이내') : ''));
    }
    el.append(head, form); return el;
  }

  function shrink(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file), im = new Image();
      im.onload = () => {
        let m = 640, out = '';
        for (let k = 0; k < 3; k++) {
          const r = Math.min(1, m / Math.max(im.width, im.height)), c = document.createElement('canvas');
          c.width = Math.round(im.width * r); c.height = Math.round(im.height * r);
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); // 다시 그리면 위치 등 메타 정보가 사라져요
          out = c.toDataURL('image/jpeg', .7 - k * .15); if (out.length < 300000) break; m *= .7;
        }
        URL.revokeObjectURL(url); res(out);
      };
      im.onerror = () => { URL.revokeObjectURL(url); rej(); };
      im.src = url;
    });
  }

  /* ───────── 책 등록 ───────── */
  const dlgBook = $('#dlgBook'); let rating = 0;
  const fRate = $('#fRate');
  [1, 2, 3, 4, 5].forEach(v => fRate.append(h('button', { type: 'button', role: 'radio', 'aria-label': v + '점', 'aria-checked': 'false', onclick: () => { rating = v; paintRate(); validate(); } }, '★')));
  const paintRate = () => [...fRate.children].forEach((b, i) => { b.classList.toggle('on', i < rating); b.setAttribute('aria-checked', String(i + 1 === rating)); });
  const fGenre = $('#fGenre');
  GENRES.forEach(([n], i) => fGenre.append(h('option', { value: i === 12 ? '' : String(i) }, n)));
  function validate() {
    const miss = []; if (!$('#fTitle').value.trim()) miss.push('제목'); if (!$('#fAuthor').value.trim()) miss.push('저자'); if (!rating) miss.push('별점');
    $('#fMiss').textContent = miss.length ? `${miss.join(', ')}을(를) 채워 주세요. 제목, 저자, 별점만 있어도 별이 생겨요.` : '';
    return miss.length === 0;
  }
  $('#btnAdd').addEventListener('click', () => { $('#fTitle').value = ''; $('#fAuthor').value = ''; fGenre.value = ''; rating = 0; paintRate(); $('#fMiss').textContent = ''; dlgBook.showModal(); $('#fTitle').focus(); });
  $('#fCancel').addEventListener('click', () => dlgBook.close());
  ['#fTitle', '#fAuthor'].forEach(s => $(s).addEventListener('input', () => { if ($('#fMiss').textContent) validate(); }));
  $('#formBook').addEventListener('submit', e => {
    e.preventDefault(); if (!validate()) return;
    const title = $('#fTitle').value.trim(), author = $('#fAuthor').value.trim();
    const dup = S.books.find(b => norm(b.title) === norm(title) && norm(b.author) === norm(author));
    dlgBook.close();
    if (dup) { toast('이미 있는 책이에요. 기존 별에 활동을 더해 볼까요?'); openDetail(dup.id); return; }
    const b = newBook(title, author, rating, fGenre.value); S.books.push(b);
    b.regPaid = pay(REG.base + REG.rate); popId = b.id; sel = b.id;
    save(); render(); openDetail(b.id);
    toast(b.regPaid ? `새 별이 떠올랐어요 · +${b.regPaid} 별가루` : '새 별이 떠올랐어요'); say('첫 번째 별이에요, 멋져요!'.replace('첫 번째', S.books.length + '번째'));
    setTimeout(() => sparkleAt(gBooks.querySelector(`[data-id="${b.id}"] .body`)), 120);
  });

  /* ───────── 온보딩 ───────── */
  const dlgOn = $('#dlgOnboard'); let pickZ = -1;
  const oMon = $('#oMon'), oDay = $('#oDay');
  oMon.append(h('option', { value: '' }, '월'), ...Array.from({ length: 12 }, (_, i) => h('option', { value: i + 1 }, (i + 1) + '월')));
  oDay.append(h('option', { value: '' }, '일'), ...Array.from({ length: 31 }, (_, i) => h('option', { value: i + 1 }, (i + 1) + '일')));
  const oZ = $('#oZ');
  Z.forEach((z, i) => oZ.append(h('button', { type: 'button', role: 'radio', 'aria-checked': 'false', onclick: () => { pickZ = i; paintZ(); } }, z.n.replace('자리', ''))));
  const paintZ = () => [...oZ.children].forEach((b, i) => b.setAttribute('aria-checked', String(i === pickZ)));
  [oMon, oDay].forEach(s => s.addEventListener('change', () => { if (oMon.value && oDay.value) { pickZ = zodiacOf(+oMon.value, +oDay.value); paintZ(); } }));
  dlgOn.addEventListener('cancel', e => e.preventDefault());
  $('#formOn').addEventListener('submit', e => {
    e.preventDefault(); const nick = $('#oNick').value.trim();
    if (!nick) { $('#oMiss').textContent = '닉네임을 적어 주세요.'; return; }
    if (pickZ < 0) { $('#oMiss').textContent = '별자리를 하나 골라 주세요. 생일을 넣으면 자동으로 골라져요.'; return; }
    S.nick = nick; S.zodiac = pickZ; oMon.value = oDay.value = ''; // 생일 값은 저장하지 않아요
    save(); dlgOn.close(); render({ intro: true }); say('이제 첫 책을 등록해 볼까요?');
  });

  /* ───────── 상점·시연 도구·범례 ───────── */
  const dlgShop = $('#dlgShop');
  $('#btnShop').addEventListener('click', () => dlgShop.showModal());
  $('#shopClose').addEventListener('click', () => dlgShop.close());
  $('#btnReset').addEventListener('click', () => { if (confirm('모든 기록을 지우고 처음부터 시작할까요?')) { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); } });
  $('#btnSample').addEventListener('click', () => {
    const D = kst(); const mk = (t, a, r, g, o = {}) => Object.assign(newBook(t, a, r, g), o);
    const S1 = (t, p) => ({ id: uid(), text: t, page: p || '', paid: 0 });
    const sample = [
      mk('소년이 온다', '한강', 5, '0', { sentences: [S1('살아남은 자의 슬픔은 어떻게 말해져야 하는가', '24'), S1('우리는 서로의 이름을 불렀다', '61')], reason: '수업 시간에 추천받았다', summary: '1980년 5월의 광주를 다룬 소설', feeling: '오래 먹먹했다' }),
      mk('어린 왕자', '생텍쥐페리', 5, '1', { sentences: [S1('가장 중요한 것은 눈에 보이지 않아', '72')], reason: '친구가 선물해 줬다', rereads: [D], summary: '장미와 여우를 만난 어린 왕자의 여행', feeling: '어른이 되면 잊는 것들', question: '길들인다는 건 정확히 무슨 뜻일까?' }),
      mk('해리 포터와 마법사의 돌', 'J.K. 롤링', 4, '2', { rereads: [D] }),
      mk('구름빵', '백희나', 4, '3'),
      mk('하늘과 바람과 별과 시', '윤동주', 5, '4', { sentences: [S1('죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를', '')], reason: '별 이야기가 좋아서', big: true, bigReason: '별 헤는 밤이 좋아서' }),
      mk('사피엔스', '유발 하라리', 4, '6', { sentences: [S1('허구를 믿는 능력이 협력을 가능하게 했다', '41')] }),
      mk('정의란 무엇인가', '마이클 샌델', 3, '5', { reason: '사회 시간 토론 준비', summary: '정의에 대한 세 가지 관점' }),
      mk('넛지', '리처드 탈러', 3, '7'),
      mk('코스모스', '칼 세이건', 5, '8', { sentences: [S1('우리는 별의 먼지로 만들어졌다', '')], reason: '별자리에 관심이 생겨서', feeling: '밤하늘이 달리 보인다', question: '우주의 끝은 있을까?' }),
      mk('곰브리치 서양미술사', '에른스트 곰브리치', 4, '9'),
      mk('나는 나로 살기로 했다', '김수현', 3, '10'),
      mk('슬램덩크', '이노우에 다케히코', 5, '11', { rereads: [D] }),
    ];
    let add = 0; sample.forEach(b => { if (!S.books.some(x => norm(x.title) === norm(b.title))) { S.books.push(b); add++; } });
    S.balance += add ? 120 : 0; save(); dlgShop.close(); closeDetail(); render({ intro: true }); toast(add ? `샘플 책 ${add}권을 채웠어요` : '이미 모두 채워져 있어요'); say('별들이 모였어요. 하나 눌러 볼까요?');
  });
  (() => {
    const lg = $('#legend'); GENRES.forEach(([n, c]) => lg.append(h('li', {}, h('i', { style: `background:${c}` }), n)));
    $('#btnLegend').addEventListener('click', e => { const o = lg.hidden; lg.hidden = !o; e.currentTarget.setAttribute('aria-expanded', String(o)); });
  })();

  /* ───────── 시작 ───────── */
  addEventListener('resize', () => { sizeCanvas(); });
  let rt, roFirst = true;
  new ResizeObserver(() => { if (roFirst) { roFirst = false; return; } clearTimeout(rt); rt = setTimeout(() => { sizeCanvas(); render(); }, 150); }).observe($('.glass'));
  sizeCanvas();
  if (S.zodiac < 0) { dlgOn.showModal(); } else { render({ intro: true }); if (S.books.length) say(`${S.nick}님의 별이 ${S.books.length}개예요`); }
})();
