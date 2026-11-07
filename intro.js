(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = $('#stage'), glass = $('#glass');
  const gLadder = $('#ladder'), gDipper = $('#dipper');
  const climber = $('#climber'), cimg = $('#climberImg');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const el = (t, a = {}) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };

  /* ───────── 장면 좌표 (viewBox 100x130) ───────── */
  const A = [24, 124], B = [57, 67];                       // 사다리 아래·위 끝
  const D = [B[0] - A[0], B[1] - A[1]], len = Math.hypot(...D);
  const N = [-D[1] / len, D[0] / len];                     // 단위 법선 (사다리 폭 방향)
  const at = t => [A[0] + D[0] * t, A[1] + D[1] * t];
  const RUNGS = [.07, .23, .39, .55, .71, .87];
  const ST = {                                              // 북두칠성 일곱 별
    Alkaid: [8, 30, 1.0], Mizar: [22, 22, 1.05], Alioth: [38, 32, 1.15], Megrez: [54, 40, .95],
    Dubhe: [84, 36, 1.3], Merak: [84, 60, 1.1], Phecda: [58, 62, 1.0],
  };
  const STROKES = [['Phecda', 'Megrez', 'Alioth', 'Mizar', 'Alkaid'], ['Megrez', 'Dubhe', 'Merak', 'Phecda']];

  let ladderStars = [], dipperStars = {}, rails = [], rungEls = [], strokeEls = [], pen;
  function build() {
    gLadder.replaceChildren(); gDipper.replaceChildren();
    ladderStars = []; rungEls = []; rails = []; strokeEls = []; dipperStars = {};
    [1, -1].forEach(sd => {
      const p0 = [A[0] + N[0] * 4.2 * sd, A[1] + N[1] * 4.2 * sd], p1 = [B[0] + N[0] * 4.2 * sd, B[1] + N[1] * 4.2 * sd];
      const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + 1;
      const r = el('line', { class: 'rail drawn', x1: p0[0], y1: p0[1], x2: p1[0], y2: p1[1] });
      r.style.setProperty('--l', L); r.style.setProperty('--t', '1.3s'); rails.push(r); gLadder.append(r);
    });
    RUNGS.forEach((t, i) => {
      const c = at(t);
      const r = el('line', { class: 'rung drawn', x1: c[0] + N[0] * 4.2, y1: c[1] + N[1] * 4.2, x2: c[0] - N[0] * 4.2, y2: c[1] - N[1] * 4.2 });
      r.style.setProperty('--l', 9.5); r.style.setProperty('--t', '.5s'); r.style.setProperty('--d', (.25 + i * .12) + 's'); rungEls.push(r); gLadder.append(r);
      const g = el('g', { transform: `translate(${c[0] + N[0] * 4.2 * (i % 2 ? 1 : -1)} ${c[1] + N[1] * 4.2 * (i % 2 ? 1 : -1)}) scale(.62)` });
      const s = el('use', { href: '#s5', class: 'ls' }); g.append(s); gLadder.append(g); ladderStars.push(s);
    });
    STROKES.forEach(() => { const p = el('polyline', { class: 'dl', points: '' }); strokeEls.push(p); gDipper.append(p); });
    Object.entries(ST).forEach(([k, [x, y, s]]) => {
      const g = el('g', { transform: `translate(${x} ${y}) scale(${(s * 1.25).toFixed(2)})` });
      const u = el('use', { href: '#s5', class: 'dst' }); g.append(u); gDipper.append(g); dipperStars[k] = u;
    });
    pen = el('circle', { class: 'pen', r: 1.5 }); gDipper.append(pen);
  }
  const pct = (x, y) => [x + '%', (y / 130 * 100) + '%'];
  function placeClimber(i, instant) {
    const c = at(RUNGS[i]); const [l, t] = pct(c[0] - 7.5, c[1] + 4);
    if (instant) { climber.style.transition = 'none'; }
    climber.style.left = l; climber.style.top = t;
    if (instant) { void climber.offsetWidth; climber.style.transition = ''; }
  }
  function hop() { climber.classList.remove('hop'); void climber.offsetWidth; climber.classList.add('hop'); }

  /* ───────── 펜으로 그리기 ───────── */
  let token = 0, lastSp = 0;
  function spark(x, y) {
    const c = el('circle', { class: 'sp', r: (Math.random() * .5 + .25).toFixed(2), cx: (x + (Math.random() - .5) * 3).toFixed(2), cy: (y + (Math.random() - .5) * 3).toFixed(2) });
    c.addEventListener('animationend', () => c.remove()); gDipper.insertBefore(c, pen);
  }
  function movePen(tok, from, to, ms, draw, poly, pts, vertex) {
    return new Promise(res => {
      const t0 = performance.now();
      (function f(now) {
        if (tok !== token) return res(false);
        const k = Math.min(1, (now - t0) / ms), x = from[0] + (to[0] - from[0]) * k, y = from[1] + (to[1] - from[1]) * k;
        pen.setAttribute('cx', x); pen.setAttribute('cy', y);
        if (draw) poly.setAttribute('points', [...pts, [x, y]].map(p => p[0] + ',' + p[1]).join(' '));
        if (now - lastSp > 55) { lastSp = now; spark(x, y); }
        if (k < 1) requestAnimationFrame(f); else res(true);
      })(t0);
    });
  }
  async function drawDipper(tok) {
    pen.classList.add('on');
    const lit = new Set();
    const light = k => { if (!lit.has(k)) { lit.add(k); dipperStars[k].classList.add('on'); setTimeout(() => dipperStars[k] && dipperStars[k].classList.add('tw'), 900); burst(ST[k]); } };
    let pos = null;
    for (let si = 0; si < STROKES.length; si++) {
      const names = STROKES[si], pts = [];
      const start = ST[names[0]];
      if (pos) { if (!await movePen(tok, pos, start, 420, false)) return false; }  // 펜을 들고 이동
      pen.setAttribute('cx', start[0]); pen.setAttribute('cy', start[1]); pts.push(start); light(names[0]);
      for (let i = 1; i < names.length; i++) {
        const to = ST[names[i]];
        if (!await movePen(tok, pts[pts.length - 1], to, 430, true, strokeEls[si], pts)) return false;
        pts.push(to); strokeEls[si].setAttribute('points', pts.map(p => p[0] + ',' + p[1]).join(' ')); light(names[i]);
      }
      pos = pts[pts.length - 1];
    }
    pen.classList.remove('on'); return true;
  }

  /* ───────── 배경: 창 안의 별하늘 ───────── */
  const cv = $('#sky'), cx = cv.getContext('2d');
  let W = 0, H = 0, dots = [], shoot = [], bursts = [];
  function size() {
    const r = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0);
    dots = Array.from({ length: Math.round(Math.min(120, W * H / 2600)) }, () => ({ x: Math.random() * W, y: Math.random() * H * .85, r: Math.random() * 1.2 + .3, p: Math.random() * 6.28, s: Math.random() * 1.6 + .4, c: Math.random() < .2 ? '#FFD66B' : '#fff' }));
  }
  function burst([x, y]) {
    if (reduce || !W) return;
    const px = x / 100 * W, py = y / 130 * H;
    for (let i = 0; i < 18; i++) { const a = Math.random() * 6.28, v = Math.random() * 2.6 + .6; bursts.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 1, r: Math.random() * 1.7 + .5 }); }
  }
  function shootingStar() { shoot.push({ x: W * (.45 + Math.random() * .5), y: H * Math.random() * .25, vx: -(3 + Math.random() * 2), vy: 1.4 + Math.random(), l: 1 }); }
  let nextShoot = 3000;
  const t0 = performance.now();
  (function loop(now) {
    cx.clearRect(0, 0, W, H); const t = (now - t0) / 1000;
    for (const s of dots) { cx.globalAlpha = reduce ? .75 : .25 + .65 * (.5 + .5 * Math.sin(t * s.s + s.p)); cx.fillStyle = s.c; cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, 6.283); cx.fill(); }
    if (!reduce) {
      if (now > nextShoot && stage.classList.contains('s-open')) { shootingStar(); nextShoot = now + 5000 + Math.random() * 5000; }
      for (let i = shoot.length - 1; i >= 0; i--) {
        const s = shoot[i]; s.x += s.vx; s.y += s.vy; s.l -= .016; if (s.l <= 0) { shoot.splice(i, 1); continue; }
        const g = cx.createLinearGradient(s.x, s.y, s.x - s.vx * 10, s.y - s.vy * 10); g.addColorStop(0, `rgba(255,236,170,${s.l})`); g.addColorStop(1, 'rgba(255,236,170,0)');
        cx.globalAlpha = 1; cx.strokeStyle = g; cx.lineWidth = 2; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(s.x, s.y); cx.lineTo(s.x - s.vx * 10, s.y - s.vy * 10); cx.stroke();
      }
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i]; b.x += b.vx; b.y += b.vy; b.vx *= .94; b.vy = b.vy * .94 + .03; b.l -= .02; if (b.l <= 0) { bursts.splice(i, 1); continue; }
        cx.globalAlpha = b.l; cx.fillStyle = '#FFD66B'; cx.beginPath(); cx.arc(b.x, b.y, b.r * b.l + .3, 0, 6.283); cx.fill();
      }
    }
    cx.globalAlpha = 1; if (!document.hidden) requestAnimationFrame(loop);
  })(t0);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) requestAnimationFrame(function f(n) { /* 재개 */ }); });
  addEventListener('resize', size);

  /* ───────── 캐릭터(서가) ───────── */
  const chEls = [...document.querySelectorAll('.ch')];
  chEls.forEach(e => {
    const bob = document.createElement('div'); bob.className = 'bob'; bob.style.setProperty('--dl', (-Math.random() * 3).toFixed(1) + 's');
    ['a', 'b'].forEach(k => { const im = new Image(); im.className = k; im.alt = ''; im.src = `assets/char/${e.dataset[k]}.webp`; bob.append(im); });
    e.append(bob);
  });
  let poseTimer;
  const startPose = () => { clearInterval(poseTimer); if (reduce) return; let i = 0; poseTimer = setInterval(() => chEls[i++ % chEls.length].classList.toggle('alt'), 2100); };

  /* ───────── 타임라인 ───────── */
  const skipBtn = $('#skip'), replayBtn = $('#replay');
  const S = c => stage.classList.add(c);
  function reset() {
    token++; clearInterval(poseTimer);
    ['s-open', 's-title', 's-sub', 's-chars', 's-cta'].forEach(c => stage.classList.remove(c));
    chEls.forEach(c => c.classList.remove('show', 'alt'));
    build(); climber.className = 'climber'; cimg.src = 'assets/char/green-wave.webp'; placeClimber(0, true);
    skipBtn.hidden = false; replayBtn.hidden = true;
  }
  function done() { climber.classList.add('idle'); skipBtn.hidden = true; replayBtn.hidden = false; startPose(); }
  function finish() {
    token++;
    ['s-open', 's-title', 's-sub', 's-chars', 's-cta'].forEach(S);
    build();
    [...rails, ...rungEls].forEach(e => { e.style.setProperty('--t', '0s'); e.style.setProperty('--d', '0s'); e.classList.add('go'); });
    ladderStars.forEach(s => s.classList.add('on'));
    strokeEls[0].setAttribute('points', STROKES[0].map(k => ST[k].slice(0, 2).join(',')).join(' '));
    strokeEls[1].setAttribute('points', STROKES[1].map(k => ST[k].slice(0, 2).join(',')).join(' '));
    Object.values(dipperStars).forEach(u => u.classList.add('on', 'tw'));
    cimg.src = 'assets/char/green-wow.webp'; placeClimber(RUNGS.length - 1, true); climber.classList.add('show');
    chEls.forEach(c => c.classList.add('show')); done();
  }
  async function play() {
    reset(); if (reduce) { finish(); return; }
    const tok = token, alive = () => tok === token;
    await wait(200); if (!alive()) return; S('s-open');
    await wait(1100); if (!alive()) return;
    [...rails, ...rungEls].forEach(e => e.classList.add('go'));                       // 사다리가 위로 뻗어요
    await wait(1100); if (!alive()) return;
    climber.classList.add('show'); ladderStars[0].classList.add('on');                // 초록이 등장
    for (let i = 1; i < RUNGS.length; i++) {                                            // 한 칸씩 오르기
      await wait(700); if (!alive()) return;
      placeClimber(i); hop(); setTimeout(() => ladderStars[i].classList.add('on'), 420);
    }
    await wait(800); if (!alive()) return;
    cimg.src = 'assets/char/green-wow.webp'; S('s-title');                              // 놀라는 포즈 + 제목이 써져요
    const ok = await drawDipper(tok); if (!ok || !alive()) return;                      // 북두칠성을 그려요
    S('s-sub'); await wait(500); if (!alive()) return;
    S('s-chars'); chEls.forEach((c, i) => setTimeout(() => alive() && c.classList.add('show'), i * 240));
    await wait(1100); if (!alive()) return; S('s-cta');
    await wait(500); if (!alive()) return; done();
  }
  skipBtn.addEventListener('click', finish);
  replayBtn.addEventListener('click', play);

  size();
  new ResizeObserver(() => size()).observe(glass);
  const imgs = [...document.images, new Image()]; imgs[imgs.length - 1].src = 'assets/char/green-wow.webp';
  Promise.all(imgs.map(i => i.decode ? i.decode().catch(() => {}) : 0)).then(play);
})();
