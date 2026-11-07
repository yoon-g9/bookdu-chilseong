(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const KEY = 'bukdu_my_v1', CKEY = 'bukdu_cheer_v1', CAP = 30;

  const GENRES = [
    ['한국소설', '#FF6B6B'], ['외국소설', '#FFA05A'], ['장르소설', '#B58CFF'], ['동화·그림책', '#FFE066'],
    ['시·에세이', '#FFB3E6'], ['인문·철학·심리', '#7F9CFF'], ['역사·문화', '#C9A27A'], ['사회·경제', '#4FD1B5'],
    ['과학·수학·IT', '#4FC3F7'], ['예술·체육·취미', '#A5E05A'], ['자기계발·진로', '#E85BB0'], ['만화·학습만화', '#9AE3FF'],
  ];
  const gi = g => (g === '' || g == null || isNaN(+g)) ? -1 : +g;

  const el = (t, a = {}) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const h = (t, a = {}, ...c) => { const e = document.createElement(t); for (const [k, v] of Object.entries(a)) { if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v === true) e.setAttribute(k, ''); else if (v !== false && v != null) e.setAttribute(k, v); } c.flat(9).forEach(x => { if (x == null || x === false) return; e.append(x.nodeType ? x : document.createTextNode(x)); }); return e; };
  const norm = s => s.replace(/[\s.,!?'"“”‘’~·…\-—()\[\]]/g, '').toLowerCase();
  const kst = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* ───────── 내 기록 읽기 ───────── */
  const readMine = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; } };
  let ME = readMine() || { nick: '나', books: [], balance: 0, ledger: {} };
  const myNick = ME.nick || '나';
  function pay(n) {                                              // 별가루 적립 (하루 상한 공유)
    const cur = readMine() || ME; cur.ledger = cur.ledger || {};
    const today = cur.ledger[kst()] || 0, got = Math.min(n, Math.max(0, CAP - today));
    if (got > 0) { cur.ledger[kst()] = today + got; cur.balance = (cur.balance || 0) + got; try { localStorage.setItem(KEY, JSON.stringify(cur)); } catch (e) {} }
    ME = cur; head(); return got;
  }
  const kinds = b => (b.sentences?.length ? 1 : 0) + (b.reason ? 1 : 0) + (b.rereads?.length ? 1 : 0) + (b.summary ? 1 : 0) + (b.feeling ? 1 : 0) + (b.question ? 1 : 0) + (b.photo ? 1 : 0);
  const levelOf = b => { const n = kinds(b); return n === 0 ? 1 : n === 1 ? 2 : n === 2 ? 3 : n <= 4 ? 4 : 5; };

  /* ───────── 샘플 학급 (AI·서버 연결 전 시연용) ───────── */
  const NICKS = ['별빛', '달토끼', '구름빵', '은하수', '새벽', '햇살', '파랑새', '도토리', '온새미', '무지개', '하늘', '솔바람'];
  const TITLES = [
    ['소년이 온다', '채식주의자', '아몬드', '불편한 편의점', '완득이', '우리들의 일그러진 영웅'],
    ['어린 왕자', '데미안', '1984', '위대한 개츠비', '변신', '앵무새 죽이기'],
    ['해리 포터와 마법사의 돌', '셜록 홈즈', '나니아 연대기', '삼체', '모험의 시작'],
    ['구름빵', '마당을 나온 암탉', '강아지똥', '지각대장 존'],
    ['하늘과 바람과 별과 시', '풀꽃', '언어의 온도', '모든 순간이 너였다'],
    ['정의란 무엇인가', '미움받을 용기', '생각에 관한 생각', '니체의 말'],
    ['사피엔스', '총, 균, 쇠', '난중일기'],
    ['넛지', '자본주의 쫌 아는 10대', '시장은 정의로운가'],
    ['코스모스', '이기적 유전자', '과학 콘서트', '엔트로피'],
    ['곰브리치 서양미술사', '미술관에 간 화학자'],
    ['아주 작은 습관의 힘', '나는 나로 살기로 했다', '그릿'],
    ['슬램덩크', 'Why? 시리즈', '나루토', '원피스'],
  ];
  const WEIGHT = [16, 10, 7, 3, 7, 6, 5, 5, 7, 3, 5, 6];
  const SHARED = [                                                // 같은 문장에 밑줄 친 친구 (시연용)
    { g: 1, t: '어린 왕자', text: '가장 중요한 것은 눈에 보이지 않아', who: [0, 3, 7] },
    { g: 8, t: '코스모스', text: '우리는 별의 먼지로 만들어졌다', who: [1, 5] },
    { g: 4, t: '하늘과 바람과 별과 시', text: '죽는 날까지 하늘을 우러러 한 점 부끄럼이 없기를', who: [2, 9] },
    { g: 0, t: '소년이 온다', text: '우리는 서로의 이름을 불렀다', who: [4, 10] },
  ];
  const STARS = [];                                               // {id, owner, mine, title, genre, level, keys:Set}
  (() => {
    const R = rng(2026), cum = WEIGHT.reduce((a, w, i) => (a.push((a[i - 1] || 0) + w), a), []);
    const pickG = () => { const x = R() * cum[cum.length - 1]; return cum.findIndex(c => x < c); };
    NICKS.forEach((nick, si) => {
      const n = 5 + Math.floor(R() * 8), used = new Set();
      SHARED.forEach(s => { if (s.who.includes(si)) { used.add(s.t); STARS.push({ id: `s${si}-${used.size}`, owner: nick, mine: false, title: s.t, genre: s.g, level: 3 + Math.floor(R() * 3), keys: new Set([norm(s.text)]) }); } });
      for (let k = 0; STARS.filter(x => x.owner === nick).length < n && k < 50; k++) {
        const g = pickG(), t = TITLES[g][Math.floor(R() * TITLES[g].length)];
        if (used.has(t)) continue; used.add(t);
        const L = R() < .35 ? 1 : R() < .5 ? 2 : R() < .6 ? 3 : R() < .7 ? 4 : 5;
        STARS.push({ id: `s${si}-${used.size}`, owner: nick, mine: false, title: t, genre: g, level: L, keys: new Set() });
      }
    });
    (ME.books || []).forEach(b => {
      const g = gi(b.genre); if (g < 0) return;                   // '장르 미정'은 성운에서 흰빛으로 따로 표시하지 않고 제외
      STARS.push({ id: 'me-' + b.id, owner: myNick, mine: true, title: b.title, genre: g, level: levelOf(b), keys: new Set((b.sentences || []).map(s => norm(s.text))) });
    });
  })();
  const unplaced = (ME.books || []).filter(b => gi(b.genre) < 0).length;
  const myBooks = (ME.books || []).length;

  /* ───────── 배경 반짝임 ───────── */
  const cv = $('#bgsky'), cx = cv.getContext('2d'), glass = $('#glass');
  let CW = 0, CH = 0, dots = [];
  function sizeCanvas() {
    const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    CW = r.width; CH = r.height; cv.width = CW * d; cv.height = CH * d; cx.setTransform(d, 0, 0, d, 0, 0);
    dots = Array.from({ length: Math.round(Math.min(150, CW * CH / 4500)) }, () => ({ x: Math.random() * CW, y: Math.random() * CH, r: Math.random() * 1.1 + .3, p: Math.random() * 6.28, s: Math.random() * 1.5 + .4 }));
  }
  const t0 = performance.now();
  (function loop(now) {
    cx.clearRect(0, 0, CW, CH); const t = (now - t0) / 1000;
    for (const d of dots) { cx.globalAlpha = reduce ? .6 : .2 + .55 * (.5 + .5 * Math.sin(t * d.s + d.p)); cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(d.x, d.y, d.r, 0, 6.283); cx.fill(); }
    cx.globalAlpha = 1; requestAnimationFrame(loop);
  })(t0);

  /* ───────── 성운 그리기 ───────── */
  const neb = $('#neb'), defs = $('#defs'), gCl = $('#clusters'), gLk = $('#links');
  GENRES.forEach(([, c], i) => {
    const g = el('radialGradient', { id: 'n' + i });
    g.append(el('stop', { offset: '0', 'stop-color': c, 'stop-opacity': '.55' }), el('stop', { offset: '.55', 'stop-color': c, 'stop-opacity': '.16' }), el('stop', { offset: '1', 'stop-color': c, 'stop-opacity': '0' }));
    const d = el('radialGradient', { id: 'd' + i });
    d.append(el('stop', { offset: '0', 'stop-color': '#fff' }), el('stop', { offset: '.35', 'stop-color': c }), el('stop', { offset: '1', 'stop-color': c, 'stop-opacity': '.75' }));
    defs.append(g, d);
  });
  [['core', [['0', '#fff', 1], ['.12', '#e4f0ff', .8], ['.35', '#8fb0ff', .3], ['.7', '#5c78e0', .1], ['1', '#5c78e0', 0]]],
   ['hal', [['0', '#b8ccff', .38], ['.6', '#9fb8ff', .12], ['1', '#9fb8ff', 0]]],
   ['halme', [['0', '#FFD66B', .5], ['.6', '#FFD66B', .16], ['1', '#FFD66B', 0]]]].forEach(([id, st]) => {
    const g = el('radialGradient', { id }); st.forEach(([o, c, a]) => g.append(el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }))); defs.append(g);
  });
  let sel = null, first = true, mode = 'galaxy'; const pos = {};

  // 동그란 별: 부드러운 빛무리 + 구슬 같은 알맹이 + 하이라이트 (밝을수록 바깥 고리)
  function starDot(s, sr, col, gidx, i) {
    const body = el('g', { class: 'body' });
    body.append(el('circle', { r: sr * 2.7, fill: `url(#n${gidx})`, opacity: .55 + s.level * .09 }));
    if (s.level >= 4) body.append(el('circle', { class: 'tw', r: sr * 1.75, fill: 'none', stroke: col, 'stroke-width': 1, 'stroke-opacity': .6, style: `--td:${(i % 7) * .4}s` }));
    body.append(el('circle', { r: sr, fill: `url(#d${gidx})`, stroke: '#fff', 'stroke-opacity': .5 + s.level * .08, 'stroke-width': .9 }));
    body.append(el('circle', { cx: -sr * .32, cy: -sr * .34, r: sr * .3, fill: '#fff', opacity: .85 }));
    return body;
  }

  function draw() {
    Object.keys(pos).forEach(k => delete pos[k]);
    (mode === 'galaxy' ? drawGalaxy : drawGenre)();
    first = false;
  }

  /* 우리 반 은하: 학생마다 작은 별자리가 나선팔을 따라 모여요 */
  function drawGalaxy() {
    const W = Math.max(280, glass.clientWidth), H = Math.max(360, glass.clientHeight);
    neb.setAttribute('viewBox', `0 0 ${W} ${H}`); neb.setAttribute('height', H);
    gCl.replaceChildren(); gLk.replaceChildren();
    const cx0 = W / 2, cy0 = H / 2 - 4, base = Math.min(W, H * 1.05), Rmax = base * .45, ky = Math.min(1, H / W * 1.05 + .3);
    const total = STARS.reduce((a, s) => a + s.level, 0);
    const bg = el('g', { class: 'gx-bg' });
    // 은하 중심의 빛
    bg.append(el('ellipse', { cx: cx0, cy: cy0, rx: base * (.3 + Math.min(.08, total / 4000)), ry: base * (.3 + Math.min(.08, total / 4000)) * ky, fill: 'url(#core)', class: 'corepulse' }));
    // 나선팔 먼지와 점선
    const R = rng(5), pal = ['#bcd4ff', '#ffd9a8', '#ffb3e6', '#ffffff', '#9ae3ff'];
    const spiral = (arm, t, th = 0) => { const a = arm * Math.PI + t * 2.9 + th; const r = Rmax * (.1 + .95 * t); return [cx0 + r * Math.cos(a), cy0 + r * Math.sin(a) * ky]; };
    gal = { cx0, cy0, ky, spiral, bg, orbs: [] };
    for (let k = 0; k < 620; k++) {
      const arm = k % 2, t = Math.pow(R(), .8), a = arm * Math.PI + t * 2.9 + (R() - .5) * (.7 - t * .35), r = Rmax * (.06 + .98 * t) * (1 + (R() - .5) * .1);
      bg.append(el('circle', { cx: cx0 + r * Math.cos(a), cy: cy0 + r * Math.sin(a) * ky, r: (R() * 1.2 + .4).toFixed(2), fill: pal[Math.floor(R() * pal.length)], opacity: Math.min(.9, .25 + R() * .55 + (1 - t) * .3).toFixed(2) }));
    }
    [0, 1].forEach(arm => { let d = ''; for (let i = 0; i <= 40; i++) { const [x, y] = spiral(arm, i / 40); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); } bg.append(el('path', { d, class: 'arm' })); });
    gCl.append(bg);
    // 학생별 별자리
    const owners = []; STARS.forEach(s => { if (!owners.includes(s.owner)) owners.push(s.owner); });
    const meIdx = owners.indexOf(myNick); if (meIdx > 0) { owners.splice(meIdx, 1); owners.unshift(myNick); }
    const N = owners.length, sc = Math.max(.7, Math.min(1.25, base / 640));
    owners.forEach((nick, oi) => {
      const list = STARS.filter(s => s.owner === nick), n = list.length, Rr = rng(oi * 53 + 9);
      const arm = oi % 2, t = ((oi >> 1) + .9) / (Math.ceil(N / 2) + .6), [px, py] = spiral(arm, .12 + .88 * t);
      const rho = Math.min(base * .085, (9 + n * 1.9) * sc), mine = list.some(s => s.mine);
      const g = el('g', { class: 'gx' + (first && !reduce ? ' in' : ''), style: `--cd:${(oi * .12).toFixed(2)}s` });
      const pts = list.map((s, j) => { const rr = rho * Math.sqrt((j + .5) / n), a = j * 2.39996 + oi + (Rr() - .5) * .8; return [px + Math.cos(a) * rr * 1.15, py + Math.sin(a) * rr * .85]; });
      let d = ''; pts.forEach((p, j) => { if (!j) return; let b = 0, bd = 1e9; for (let q = 0; q < j; q++) { const dd = Math.hypot(p[0] - pts[q][0], p[1] - pts[q][1]); if (dd < bd) { bd = dd; b = q; } } d += `M${pts[b][0].toFixed(1)} ${pts[b][1].toFixed(1)}L${p[0].toFixed(1)} ${p[1].toFixed(1)}`; });
      g.append(el('circle', { class: 'halo', cx: px, cy: py, r: rho * 2 + 10, fill: mine ? 'url(#halme)' : 'url(#hal)' }), el('path', { d, class: 'cline' }));
      list.forEach((s, j) => {
        const [x, y] = pts[j]; pos[s.id] = [x, y]; const gidx = s.genre, col = GENRES[gidx][1], sr = (1.5 + s.level * .42) * sc;
        const ns = el('g', { class: 'ns' + (s.id === sel ? ' sel' : ''), transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})`, tabindex: 0, role: 'button', 'data-id': s.id,
          'aria-label': `${s.owner}의 ${GENRES[gidx][0]} 별, ${s.title}, 밝기 ${s.level}단계${s.mine ? ', 내 별' : ''}` });
        const body = starDot(s, sr, col, gidx, j); if (s.mine) body.append(el('circle', { class: 'me', r: sr + 3 }));
        ns.append(body, el('circle', { class: 'ring', r: sr + 6 }), el('circle', { r: 13, fill: 'transparent' }));
        ns.addEventListener('click', () => pick(s.id)); ns.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(s.id); } });
        g.append(ns);
      });
      const lab = el('text', { class: 'gxlab' + (mine ? ' me' : ''), x: px, y: py + rho * .85 + 16 * sc, 'text-anchor': 'middle' }); lab.textContent = mine ? `${nick} (나)` : nick;
      g.append(lab);
      const orb = el('g', { class: 'orb' }); orb.append(g); gCl.append(orb);     // 바깥 그룹만 움직여요 (등장 애니메이션과 겹치지 않게)
      gal.orbs.push({ orb, arm, t: .12 + .88 * t, base: [px, py], stars: list.map((s, j) => ({ id: s.id, p0: pts[j] })) });
    });
    drawLinks(); spin(0);
  }

  /* 은하 회전: 나선팔·먼지는 통째로, 학생 별자리는 궤도를 따라 이동 (글자와 별 모양은 바로 선 채로) */
  let gal = null, theta = 0, hov = false;
  function spin(dt) {
    if (!gal) return; theta += dt;
    const { cx0, cy0, ky, spiral, bg, orbs } = gal, c = Math.cos(theta), s = Math.sin(theta);
    bg.setAttribute('transform', `matrix(${c.toFixed(5)} ${(ky * s).toFixed(5)} ${(-s / ky).toFixed(5)} ${c.toFixed(5)} ${(cx0 - c * cx0 + s / ky * cy0).toFixed(2)} ${(cy0 - ky * s * cx0 - c * cy0).toFixed(2)})`);
    orbs.forEach(o => {
      const [nx, ny] = spiral(o.arm, o.t, theta), dx = nx - o.base[0], dy = ny - o.base[1];
      o.orb.setAttribute('transform', `translate(${dx.toFixed(2)} ${dy.toFixed(2)})`);
      o.stars.forEach(st => { pos[st.id] = [st.p0[0] + dx, st.p0[1] + dy]; });
    });
    updateLinks();
  }
  neb.addEventListener('pointerover', e => { hov = !!(e.target.closest && e.target.closest('.ns')); });
  neb.addEventListener('pointerleave', () => { hov = false; });
  let lastT = performance.now();
  (function spinLoop(now) {
    const dt = Math.min(.25, (now - lastT) / 1000); lastT = now;
    if (mode === 'galaxy' && !reduce && !sel && !hov && !document.hidden) spin(dt * .07);   // 약 90초에 한 바퀴
    requestAnimationFrame(spinLoop);
  })(lastT);

  function drawGenre() {
    const W = Math.max(280, glass.clientWidth), Hh = glass.clientHeight;
    const cols = W < 520 ? 2 : W < 900 ? 3 : 4, rows = Math.ceil(12 / cols);
    const cw = W / cols, ch = Math.max(Hh / rows, W < 520 ? 190 : 150), H = ch * rows;
    neb.setAttribute('viewBox', `0 0 ${W} ${H}`); neb.setAttribute('height', H);
    gCl.replaceChildren(); gLk.replaceChildren();
    const byG = GENRES.map(() => []); STARS.forEach(s => byG[s.genre].push(s));
    const maxN = Math.max(...byG.map(a => a.length), 1);
    const Rc = Math.min(cw * .42, ch * .36), c0 = Math.max(9, Math.min(24, Rc / Math.sqrt(maxN + 1)));
    const myG = new Set(STARS.filter(s => s.mine).map(s => s.genre)), dimOn = myBooks > 0;
    const done = readCheer().done;
    GENRES.forEach(([name, col], gidx) => {
      const R = rng(gidx * 131 + 7), r = Math.floor(gidx / cols), c = gidx % cols;
      const cxp = (c + .5) * cw + (R() - .5) * cw * .08, cyp = r * ch + ch * .6 + (R() - .5) * ch * .06;
      const list = byG[gidx], n = list.length, tot = list.reduce((a, s) => a + s.level, 0);
      const g = el('g', { class: 'cl' + (dimOn && !myG.has(gidx) ? ' dim' : '') + (first && !reduce ? ' in' : ''), style: `--cd:${(gidx * .09).toFixed(2)}s` });
      const gr = Math.max(c0 * Math.sqrt(n + 3) * 1.15, 40) + tot * .6;
      g.append(el('circle', { class: 'glow', cx: cxp, cy: cyp, r: gr * 1.5, fill: `url(#n${gidx})` }));
      list.forEach((s, i) => {
        const rr = c0 * Math.sqrt(i + .5), a = i * 2.39996 + gidx, x = cxp + Math.cos(a) * rr, y = cyp + Math.sin(a) * rr * .92;
        pos[s.id] = [x, y];
        const sr = 2.7 + s.level * .62;
        const ns = el('g', { class: 'ns' + (s.id === sel ? ' sel' : '') + (first && !reduce ? ' pop' : ''), transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})`, tabindex: 0, role: 'button', 'data-id': s.id, style: `--sd:${(.5 + gidx * .09 + i * .03).toFixed(2)}s`,
          'aria-label': `${s.owner}의 ${name} 별, ${s.title}, 밝기 ${s.level}단계${s.mine ? ', 내 별' : ''}` });
        const body = starDot(s, sr, col, gidx, i);
        if (s.mine) body.append(el('circle', { class: 'me', r: sr + 3.5 }));
        ns.append(body, el('circle', { class: 'ring', r: sr + 7 }));
        if (done[s.id]) { const t = el('text', { class: 'heart', x: sr + 2, y: -sr }); t.textContent = '♥'; ns.append(t); }
        ns.append(el('circle', { r: 15, fill: 'transparent' }));
        ns.addEventListener('click', () => pick(s.id));
        ns.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(s.id); } });
        g.append(ns);
      });
      // 라벨: 장르 색 알약 + 권수
      const label = `${name}`, cnt = ` ${n}권`, w = Math.min(cw - 8, (label.length * 13 + cnt.length * 8 + 36)), ly = r * ch + 20;
      const pill = el('g', { transform: `translate(${cxp.toFixed(1)} ${ly})` });
      pill.append(el('rect', { class: 'pill', x: -w / 2, y: -15, width: w, height: 30, rx: 15, stroke: col, 'stroke-width': 1.6 }), el('circle', { cx: -w / 2 + 14, cy: 0, r: 4.5, fill: col }));
      const tx = el('text', { class: 'pilltxt', x: 8, y: 4.5, 'text-anchor': 'middle' }); tx.textContent = label;
      const sp = el('tspan', { class: 'n' }); sp.textContent = cnt; tx.append(sp); pill.append(tx);
      g.append(pill);
      if (dimOn && !myG.has(gidx)) { const u = el('text', { class: 'unread', x: cxp, y: ly + 22, 'text-anchor': 'middle' }); u.textContent = '아직 안 읽은 구역'; g.append(u); }
      gCl.append(g);
    });
    drawLinks();
  }

  // 같은 문장 연결선
  let linkCount = 0;
  function groups() {
    const m = new Map();
    STARS.forEach(s => s.keys.forEach(k => { if (!m.has(k)) m.set(k, []); m.get(k).push(s); }));
    return [...m.values()].filter(a => new Set(a.map(s => s.owner)).size > 1);
  }
  const linkD = (a, b) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - Math.hypot(a[0] - b[0], a[1] - b[1]) * .18; return `M${a[0].toFixed(1)} ${a[1].toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`; };
  function updateLinks() { gLk.querySelectorAll('.lk').forEach(p => { const a = pos[p.dataset.a], b = pos[p.dataset.b]; if (a && b) p.setAttribute('d', linkD(a, b)); }); }
  function drawLinks() {
    gLk.replaceChildren(); linkCount = 0;
    groups().forEach(grp => {
      for (let i = 0; i < grp.length - 1; i++) {
        const a = pos[grp[i].id], b = pos[grp[i + 1].id]; if (!a || !b) continue;
        if (grp[i].owner === grp[i + 1].owner) continue;
        const L = Math.hypot(a[0] - b[0], a[1] - b[1]) * 1.2 + 10;
        const p = el('path', { d: linkD(a, b), class: 'lk' + (first && !reduce ? ' draw' : ''), 'data-a': grp[i].id, 'data-b': grp[i + 1].id });
        if (first && !reduce) { p.style.setProperty('--l', L.toFixed(0)); p.addEventListener('animationend', () => p.classList.add('fin')); }
        gLk.append(p); linkCount++;
      }
    });
    summary();
  }
  function summary() {
    const unread = myBooks > 0 ? 12 - new Set(STARS.filter(s => s.mine).map(s => s.genre)).size : 0;
    $('#summary').replaceChildren('우리 반 별 ', h('b', {}, STARS.length), '개 · 같은 문장 ', h('b', {}, linkCount), '쌍', unread ? ` · 안 읽은 구역 ${unread}곳` : '');
  }

  /* ───────── 헤더 · 랭킹 ───────── */
  function head() { $('#dustBal').textContent = ME.balance || 0; $('#dustToday').textContent = `오늘 ${(ME.ledger || {})[kst()] || 0}/${CAP}`; }
  function ranking() {
    const R = rng(77); const rows = NICKS.map(n => ({ n, v: 40 + Math.floor(R() * 160), me: false }));
    const week = Object.entries(ME.ledger || {}).filter(([d]) => (Date.now() - new Date(d)) < 7 * 864e5).reduce((a, [, v]) => a + v, 0);
    rows.push({ n: myNick, v: week, me: true });
    rows.sort((a, b) => b.v - a.v);
    const top = rows.slice(0, 5), myRank = rows.findIndex(r => r.me) + 1;
    $('#rankList').replaceChildren(...top.map(r => h('li', { class: r.me ? 'me' : '' }, r.n)));
    $('#rankMine').textContent = myRank <= 5 ? '와, 상위 5명에 들었어요!' : `내 순위는 ${myRank}위예요. (나에게만 보여요)`;
  }
  $('#btnRank').addEventListener('click', e => { const r = $('#rank'); const o = r.hidden; r.hidden = !o; e.currentTarget.setAttribute('aria-expanded', String(o)); if (o) ranking(); });

  /* ───────── 별 정보 · 응원 ───────── */
  const PHRASES = ['응원해요!', '나도 읽어 볼래요', '같은 마음이에요'];
  const readCheer = () => { try { const c = JSON.parse(localStorage.getItem(CKEY)) || {}; if (c.d !== kst()) return { d: kst(), cheer: 0, heart: 0, done: c.done || {} }; return c; } catch (e) { return { d: kst(), cheer: 0, heart: 0, done: {} }; } };
  const saveCheer = c => { try { localStorage.setItem(CKEY, JSON.stringify(c)); } catch (e) {} };
  let toastT; const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2400); };

  function pick(id) {
    sel = id; const s = STARS.find(x => x.id === id); if (!s) return;
    document.querySelectorAll('.ns').forEach(n => n.classList.toggle('sel', n.dataset.id === id));
    document.querySelectorAll('.lk').forEach(l => l.classList.toggle('hi', l.dataset.a === id || l.dataset.b === id));
    const c = readCheer(), sent = c.done[id];
    const mates = groups().filter(g => g.includes(s)).flat().filter(x => x.owner !== s.owner);
    const [gn, col] = GENRES[s.genre];
    const mk = (label, kind, amt) => h('button', { type: 'button', disabled: !!sent || s.mine || (kind === 'c' ? c.cheer >= 3 : c.heart >= 5), onclick: () => {
      const cc = readCheer(); if (cc.done[id]) return;
      const got = pay(amt); cc.done[id] = kind; kind === 'c' ? cc.cheer++ : cc.heart++; saveCheer(cc);
      toast(got ? `+${got} 별가루 · ${kind === 'c' ? '응원을 남겼어요' : '하트를 남겼어요'}` : '오늘 별가루를 다 모았어요 (응원은 전해졌어요)');
      draw(); pick(id);
    } }, label);
    $('#pickBody').replaceChildren(
      h('div', { class: 'pk-genre' }, h('i', { style: `background:${col}` }), gn),
      h('h2', { class: 'pk-title' }, s.title),
      h('p', { class: 'pk-by' }, s.mine ? `${s.owner} (나)의 별` : `${s.owner}님의 별`),
      h('div', { class: 'pk-lv', 'aria-label': `밝기 ${s.level}단계` }, [1, 2, 3, 4, 5].map(i => h('i', { class: i <= s.level ? 'on' : '' })), ` 밝기 ${s.level}/5`),
      mates.length ? h('p', { class: 'pk-link' }, `같은 문장에 밑줄 친 친구: ${[...new Set(mates.map(m => m.owner))].join(', ')}`) : '',
      s.mine ? h('p', { class: 'pk-note' }, '내 별이에요. 내 별자리 화면에서 활동을 더 남길 수 있어요.') : h('div', {},
        h('div', { class: 'pk-act' }, mk('♥ 하트 +1', 'h', 1), PHRASES.map(p => mk(`${p} +3`, 'c', 3))),
        h('p', { class: 'pk-note' }, sent ? '이 별에는 이미 마음을 남겼어요. (별마다 한 번)' : `정해진 응원 문구만 고를 수 있어요. 오늘 응원 ${c.cheer}/3 · 하트 ${c.heart}/5`)));
    $('#pick').classList.add('open'); $('#pick').setAttribute('aria-hidden', 'false');
  }
  function closePick() { sel = null; $('#pick').classList.remove('open'); $('#pick').setAttribute('aria-hidden', 'true'); document.querySelectorAll('.ns.sel').forEach(n => n.classList.remove('sel')); document.querySelectorAll('.lk.hi').forEach(l => l.classList.remove('hi')); }
  $('#pickClose').addEventListener('click', closePick);
  addEventListener('keydown', e => { if (e.key === 'Escape') closePick(); });

  /* ───────── 탭 · 범례 ───────── */
  document.querySelectorAll('.tab[data-mode]').forEach(b => b.addEventListener('click', () => {
    mode = b.dataset.mode; first = true; closePick();
    document.querySelectorAll('.tab[data-mode]').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', String(on)); });
    $('#scroll').scrollTop = 0; draw();
  }));
  (() => {
    const lg = $('#legend'); GENRES.forEach(([n, c]) => lg.append(h('li', {}, h('i', { style: `background:${c}` }), n)));
    $('#btnLegend').addEventListener('click', e => { const o = lg.hidden; lg.hidden = !o; e.currentTarget.setAttribute('aria-expanded', String(o)); });
  })();

  /* ───────── 시작 ───────── */
  head(); sizeCanvas(); draw();
  if (unplaced) toast(`장르 미정인 책 ${unplaced}권은 성운에 아직 들어가지 않았어요`);
  let rt, ro1 = true;
  new ResizeObserver(() => { if (ro1) { ro1 = false; return; } clearTimeout(rt); rt = setTimeout(() => { sizeCanvas(); draw(); }, 150); }).observe(glass);
})();
