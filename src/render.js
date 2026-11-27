// ===== render.js : 장면 합성, 전환 효과, L바 미리보기, 경고 =====
const AREAS = {
  full: { x: 470, y: 170, w: 1350, h: 660 },   // L바 안쪽 (x449~1843, y108~957) 중 실제 배치 영역
  bottom: { x: 150, y: 150, w: 1620, h: 680 }, // 하단바만 있는 형태
  none: { x: 120, y: 110, w: 1680, h: 820 },
};
for (const a of Object.values(AREAS)) { a.cx = a.x + a.w / 2; a.cy = a.y + a.h / 2; }
const SAFE = { full: { x: 449, y: 108, w: 1394, h: 849 }, bottom: { x: 72, y: 108, w: 1775, h: 849 }, none: { x: 0, y: 0, w: W, h: H } };
const ZONES = {
  full: [{ x: 1730, y: 40, w: 125, h: 158, n: 'QR 코드' }, { x: 1300, y: 835, w: 550, h: 125, n: '[선택] 구성표 자리' }, { x: 455, y: 900, w: 845, h: 60, n: '단서자막 자리' }],
  bottom: [{ x: 72, y: 45, w: 280, h: 60, n: '로고' }, { x: 1730, y: 40, w: 125, h: 158, n: 'QR 코드' }, { x: 455, y: 900, w: 1000, h: 60, n: '단서자막 자리' }],
  none: [],
};

const R = { layers: [], lbarImg: null };
function layer(i) {
  let c = R.layers[i];
  if (!c) { c = document.createElement('canvas'); R.layers[i] = c; }
  if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
  return c;
}
// 통강조: 머리(위 고정 띠)·꼬리(아래 고정 띠)를 뺀 나머지가 장면 영역
const TONG = { pad: 80, head: 270, foot: 300, gap: 70 };
function tongArea(proj) {
  const top = (proj.head ? TONG.head : 0) + TONG.gap, bot = H - (proj.foot ? TONG.foot : 0) - TONG.gap;
  const a = { x: TONG.pad, y: top, w: W - TONG.pad * 2, h: bot - top }; a.cx = a.x + a.w / 2; a.cy = a.y + a.h / 2; return a;
}
function areaFor(proj) { return STAGE === 'tong' ? tongArea(proj) : Object.assign({}, AREAS[proj.lbar] || AREAS.full); }
function safeFor(proj) {
  if (STAGE !== 'tong') return SAFE[proj.lbar] || SAFE.full;
  const top = proj.head ? TONG.head : 0, bot = H - (proj.foot ? TONG.foot : 0);
  return { x: 24, y: top + 12, w: W - 48, h: bot - top - 24 };
}
function zonesFor(proj) { return STAGE === 'tong' ? [] : (ZONES[proj.lbar] || ZONES.full); }

function sceneEnv(proj, i, t) {
  const sc = proj.scenes[i]; const th = THEMES[proj.theme] || THEMES.spring;
  const autoV = [0, 1, 0, 2][i % 4];
  const v = sc.opts.배경 ? clamp((parseInt(sc.opts.배경) || 1) - 1, 0, 2) : autoV;
  const P = Object.assign({}, th.pal[v]);
  if (sc.opts.색) P.em = sc.opts.색;
  const fontId = fontFromName(sc.opts.폰트) || proj.font || th.font;
  let A = areaFor(proj);
  const motion = MOTIONS[sc.opts.모션] || proj.motion || 'pop';
  return { sc, th, v, P, F: FONTS[fontId] || FONTS.blackhan, A, lt: t - sc.start, D: sc.dur, t, motion, opts: sc.opts, img: n => { const a = n && proj.assets[n]; if (!a) return null; a.img.hfScale = (a.scale || 100) / 100; return a.img; } };
}

function blockFor(type) { return (STAGE === 'tong' && TONG_BLOCKS[type]) || BLOCKS[type] || BLOCKS.hook; }
const LAYERED = ['줌', '디졸브', '밀기', '글리치', '스핀'];
function sceneFx(proj, sc) {
  const own = sc.opts.효과; if (own === '없음') return [];
  return [...new Set([...(proj.fx || []), ...parseFxList(own)])];
}
function runFx(ctx, list, layer, t, e) { for (const n of list) { const f = EFFECTS[n]; if (f && f.layer === layer) { ctx.save(); try { f.fn(ctx, t, e.lt, e); } catch (err) { console.warn(n, err); } ctx.restore(); } } }
function renderScene(ctx, proj, i, t) {
  const e = sceneEnv(proj, i, t);
  const u = e.D > 0 ? clamp(e.lt / e.D) : 0;
  // 배경: 아주 느린 켄번스 줌
  ctx.save();
  if (FEEL.drift) { const s = 1 + FEEL.drift * 1.6 * u; ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2); }
  e.th.bg(ctx, t, e.v);
  ctx.restore();
  const fxList = sceneFx(proj, e.sc);
  if (e.th.panel) { ctx.save(); e.th.panel(ctx, t, e.v, e.A); ctx.restore(); }
  if (STAGE === 'tong') tongFrameBack(ctx, proj, e);
  runFx(ctx, fxList, 'back', t, e);
  // 글자·이미지는 별도 레이어에 그린 뒤 살짝 떠다니듯 합성
  IMG_K = clamp((parseFloat(e.opts.크기) || 100) / 100 * (proj.imgK || 100) / 100, .3, 3);
  const cl = layer(3), c = cl.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.filter = 'none'; c.clearRect(0, 0, W, H);
  c.save();
  const tvOn = (e.opts.소품 || '').includes('TV') && STAGE === 'wide';
  if (tvOn) {
    const r = { x: e.A.x + 30, y: e.A.y - 10, w: e.A.w - 60, h: e.A.h - 30 };
    const ap = prog(e.lt, 0, .35);
    c.save(); c.globalAlpha = ap; Props.tvScreen(c, r, e.P.accent2 === '#ffffff' ? e.P.accent : e.P.accent2, t); c.restore();
    e.A = { x: r.x + 40, y: r.y + 30, w: r.w - 80, h: r.h - 60 }; e.A.cx = e.A.x + e.A.w / 2; e.A.cy = e.A.y + e.A.h / 2;
    c.save(); c.beginPath(); c.rect(r.x, r.y, r.w, r.h); c.clip();
    blockFor(e.sc.type).render(c, e.sc, e);
    c.restore();
    Props.tv(c, r, 1);
  } else blockFor(e.sc.type).render(c, e.sc, e);
  IMG_K = 1;
  c.restore();
  // 퇴장: 다음 전환이 컷/교차가 아니면 마지막 순간 살짝 떠오르며 사라짐
  let ex = 0;
  if (FEEL.exit && i < proj.scenes.length - 1) {
    const k = transKind(e.sc, i);
    if (k !== '컷' && !LAYERED.includes(k)) ex = Ease.inCubic(prog(e.lt, e.D - FEEL.win - .12, FEEL.win + .12));
  }
  const drift = FEEL.drift ? 1 + FEEL.drift * .5 * u : 1;
  const sc = drift * (1 + ex * .05);
  ctx.save(); ctx.globalAlpha = 1 - ex;
  ctx.translate(e.A.cx, e.A.cy - ex * 24); ctx.scale(sc, sc); ctx.translate(-e.A.cx, -e.A.cy);
  ctx.drawImage(cl, 0, 0);
  ctx.restore();
  ctx.save(); e.th.fx(ctx, t, e.v); ctx.restore();
  runFx(ctx, fxList, 'front', t, e);
  runFx(ctx, fxList, 'post', t, e);
  return e;
}

function transKind(sc, i) {
  const k = sc.opts.전환 || '자동';
  return k === '자동' ? FEEL.auto[i % FEEL.auto.length] : k;
}

// 전환 오버레이: p 0→1 (0.5 지점이 장면 경계)
function drawTransition(ctx, kind, p, e, nextE) {
  const P = e.P, P2 = nextE ? nextE.P : P;
  if (kind === '플래시') {
    const a = 1 - Math.abs(p - .5) * 2; ctx.save(); ctx.globalAlpha = Ease.outCubic(a); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore();
  } else if (kind === '와이프') {
    const cols = [P2.accent, P2.text === '#ffffff' ? P2.accent2 : P2.text, P2.emBox];
    ctx.save();
    cols.forEach((c, k) => {
      const lag = k * .07; const q = clamp((p - lag) / (1 - .14));
      const x = lerp(W + 600, -W - 900, Ease.inOutCubic(q));
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + W + 500, 0); ctx.lineTo(x + W + 100, H); ctx.lineTo(x - 400, H); ctx.closePath(); ctx.fill();
    });
    ctx.restore();
  } else if (kind === '원형') {
    const cx = e.A.cx, cy = e.A.cy, maxR = Math.hypot(W, H);
    ctx.save(); ctx.fillStyle = P2.accent;
    if (p < .5) { const r = maxR * Ease.inCubic(p * 2); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); }
    else { const r = maxR * Ease.outCubic((p - .5) * 2); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(cx, cy, r, 0, Math.PI * 2, true); ctx.fill('evenodd'); }
    ctx.restore();
  } else if (kind === '블라인드') {
    ctx.save(); ctx.fillStyle = P2.accent; const n = 9, bh = H / n;
    for (let k = 0; k < n; k++) { const q = clamp((p < .5 ? p * 2 : (1 - p) * 2) * 1.3 - k * .03); const h = bh * Ease.inOutCubic(q); ctx.fillRect(0, k * bh + (bh - h) / 2, W, h); }
    ctx.restore();
  } else if (kind === '타이포') {
    const word = nextE ? plain(nextE.sc.lines.find(l => l) || '').replace(/[\s\/|]/g, '').slice(0, 2) : '!';
    const x = lerp(W + 200, -2400, Ease.inOutCubic(p));
    ctx.save(); setFont(ctx, nextE ? nextE.F : e.F, 1250); ctx.textAlign = 'left'; ctx.fillStyle = P2.text === '#ffffff' ? '#ffffff' : P2.accent;
    ctx.fillText(word, x, H * .5 + 450);
    ctx.fillStyle = P2.accent; ctx.globalAlpha = .9; ctx.fillRect(x - 600, 0, 600, H);
    ctx.restore();
  }
}

/* view: { lbar:'full'|'bottom'|'none', showLbar, showSafe, warn } */
function renderFrame(ctx, proj, t, view = {}) {
  const S = proj.scenes; setStage(stageOf(proj));
  ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  if (!S.length) { ctx.restore(); drawOverlay(ctx, proj, view); return; }
  t = clamp(t, 0, proj.total - 1e-4);
  let i = S.findIndex(s => t >= s.start && t < s.start + s.dur); if (i < 0) i = S.length - 1;
  setFeel(proj.feel); if (proj.theme === 'key') setKeyColor(proj.key);
  const H2 = FEEL.win;
  // 경계 근처인지
  let ti = -1, p = 0;
  if (i < S.length - 1 && t >= S[i + 1].start - H2) { ti = i; p = .5 * (t - (S[i + 1].start - H2)) / H2; }
  else if (i > 0 && t < S[i].start + H2) { ti = i - 1; p = .5 + .5 * (t - S[i].start) / H2; }
  Collector.boxes = []; Collector.on = !!view.warn;
  const kind = ti >= 0 ? transKind(S[ti], ti) : null;
  if (LAYERED.includes(kind) && ti >= 0) {
    // 두 장면 교차
    Collector.on = false;
    renderScene(layer(0).getContext('2d'), proj, ti, t); renderScene(layer(1).getContext('2d'), proj, ti + 1, t);
    const q = Ease.inOutCubic(p);
    if (kind === '줌') {
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(1 + q * .35, 1 + q * .35); ctx.translate(-W / 2, -H / 2); ctx.drawImage(layer(0), 0, 0); ctx.restore();
      ctx.save(); ctx.globalAlpha = q; ctx.translate(W / 2, H / 2); const s2 = lerp(.82, 1, q); ctx.scale(s2, s2); ctx.translate(-W / 2, -H / 2);
      ctx.filter = `blur(${((1 - q) * 14).toFixed(1)}px)`; ctx.drawImage(layer(1), 0, 0); ctx.restore();
    } else if (kind === '디졸브') {
      ctx.drawImage(layer(0), 0, 0);
      ctx.save(); ctx.globalAlpha = q; ctx.translate(W / 2, H / 2); const s2 = lerp(1.04, 1, q); ctx.scale(s2, s2); ctx.translate(-W / 2, -H / 2); ctx.drawImage(layer(1), 0, 0); ctx.restore();
    } else if (kind === '글리치') {
      const src = p < .5 ? layer(0) : layer(1); ctx.drawImage(src, 0, 0); const k = Math.floor(t * 40), amt = 1 - Math.abs(p - .5) * 2;
      for (let s2 = 0; s2 < 12; s2++) { const y = rnd(s2, k) * H, h = 20 + rnd(s2, k + 1) * 120, dx = (rnd(s2, k + 2) - .5) * 300 * amt; ctx.drawImage(rnd(s2, k + 3) > .5 ? layer(0) : layer(1), 0, y, W, h, dx, y, W, h); }
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .35 * amt; ctx.fillStyle = '#00f0ff'; ctx.fillRect(-12 * amt, 0, W, H); ctx.fillStyle = '#ff2a6d'; ctx.globalAlpha = .2 * amt; ctx.fillRect(0, rnd(k, 9) * H, W, 90); ctx.restore();
    } else if (kind === '스핀') {
      const out = p < .5, q2 = out ? Ease.inCubic(p * 2) : 1 - Ease.outCubic((p - .5) * 2);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate((out ? 1 : -1) * q2 * .9); ctx.scale(1 - q2 * .7, 1 - q2 * .7); ctx.globalAlpha = 1 - q2 * .6; ctx.translate(-W / 2, -H / 2);
      ctx.filter = `blur(${(q2 * 10).toFixed(1)}px)`; ctx.drawImage(out ? layer(0) : layer(1), 0, 0); ctx.restore();
    } else { // 밀기
      const x = -W * q;
      ctx.drawImage(layer(0), x, 0); ctx.drawImage(layer(1), x + W, 0);
      ctx.save(); ctx.globalAlpha = .18 * Math.sin(q * Math.PI); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
    Collector.on = !!view.warn; if (view.warn) { const c2 = layer(2).getContext('2d'); renderScene(c2, proj, i, t); }
  } else {
    const e = renderScene(ctx, proj, i, t);
    if (ti >= 0 && kind !== '컷') {
      Collector.on = false;
      const eA = sceneEnv(proj, ti, t), eB = sceneEnv(proj, ti + 1, t);
      drawTransition(ctx, kind, p, eA, eB);
    }
  }
  Collector.on = false;
  ctx.restore();
  if (STAGE === 'tong') drawTongChrome(ctx, proj, t); else drawDisclaimer(ctx, proj);
  drawOverlay(ctx, proj, view);
}

function drawOverlay(ctx, proj, view) {
  const mode = proj.lbar || 'full';
  if (view.showLbar && R.lbarImg && mode !== 'none' && STAGE === 'wide') {
    if (mode === 'full') ctx.drawImage(R.lbarImg, 0, 0, W, H);
    else { // 하단바: 가이드에서 하단바·로고·QR만 잘라서 표시
      const g = R.lbarImg, sx = g.width / W, sy = g.height / H;
      ctx.drawImage(g, 0, 958 * sy, g.width, 122 * sy, 0, 958, W, 122);
      ctx.drawImage(g, 72 * sx, 45 * sy, 280 * sx, 60 * sy, 72, 45, 280, 60);
      ctx.drawImage(g, 1730 * sx, 50 * sy, 125 * sx, 145 * sy, 1730, 50, 125, 145);
    }
  }
  if (view.showSafe) {
    const s = safeFor(proj), a = areaFor(proj);
    ctx.save(); ctx.strokeStyle = 'rgba(0,255,170,.9)'; ctx.lineWidth = 3; ctx.setLineDash([16, 10]); ctx.strokeRect(s.x, s.y, s.w, s.h);
    ctx.strokeStyle = 'rgba(0,200,255,.7)'; ctx.setLineDash([6, 8]); ctx.strokeRect(a.x, a.y, a.w, a.h);
    ctx.setLineDash([]); ctx.fillStyle = 'rgba(255,200,0,.18)';
    for (const z of zonesFor(proj)) ctx.fillRect(z.x, z.y, z.w, z.h);
    ctx.restore();
  }
  if (view.warn) {
    const bad = findViolations(proj);
    ctx.save(); ctx.strokeStyle = '#ff2020'; ctx.lineWidth = 5;
    for (const b of bad) ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.restore();
    return bad;
  }
}

function intersects(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function findViolations(proj) {
  setStage(stageOf(proj)); const s = safeFor(proj), zones = zonesFor(proj); const out = [];
  for (const b of Collector.boxes) {
    if (!b.label || b.label.startsWith('_')) continue;
    const pad = 4;
    const outside = b.x < s.x - pad || b.y < s.y - pad || b.x + b.w > s.x + s.w + pad || b.y + b.h > s.y + s.h + pad;
    const zone = zones.find(z => intersects(b, z));
    if (outside || zone) out.push(Object.assign({}, b, { why: outside ? (STAGE === 'tong' ? '화면 밖으로 잘림' : '안전영역 밖') : zone.n + ' 영역과 겹침' }));
  }
  return out;
}
