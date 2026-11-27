// ===== tong.js : 통강조 (L바 왼쪽 네모 안에 들어가는 세로 영상 376×790) =====
// 판은 3배(1128×2370)로 그리고 내보낼 때 줄임. 장면 블록은 세로 배치용으로 따로 둠 (없는 블록은 일반 블록을 그대로 씀)
// + 일반 하드필러에서도 쓰는 새 블록: 포인트 체크 · 배지 강조 · 정보 표

const TONG_FRAMES = ['없음', '카드', '테두리', '네온', '코너'];
const cardEm = P => (P.accent === '#ffffff' || P.accent === P.card ? (P.cardText || '#d40000') : P.accent);

// 체크 표시를 p(0~1)만큼 그림
function checkMark(ctx, R, p, color) {
  const pts = [[-R * .42, R * .02], [-R * .1, R * .32], [R * .46, -R * .3]];
  const l1 = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]), l2 = Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]);
  let d = p * (l1 + l2); if (d <= 0) return;
  ctx.strokeStyle = color; ctx.lineWidth = R * .22; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(...pts[0]);
  if (d <= l1) { const k = d / l1; ctx.lineTo(pts[0][0] + (pts[1][0] - pts[0][0]) * k, pts[0][1] + (pts[1][1] - pts[0][1]) * k); }
  else { ctx.lineTo(...pts[1]); const k = Math.min(1, (d - l1) / l2); ctx.lineTo(pts[1][0] + (pts[2][0] - pts[1][0]) * k, pts[1][1] + (pts[2][1] - pts[1][1]) * k); }
  ctx.stroke();
}
function titleLine(ctx, e, text, y, size, role = 'main', delay = .05) {
  return drawText(ctx, text, Object.assign(roleStyle(e, role, size), { x: e.A.cx, y, size, motion: e.motion, t: e.lt, delay, maxW: e.A.w }));
}

// ---------- 새 블록 (가로·세로 공통: 영역 크기에 맞춰 배치) ----------
BLOCKS.points = {
  name: '포인트 체크', weight: 3.4, help: '제목 / 포인트1 / 포인트2 / … (3줄 이상이면 첫 줄이 제목) · 체크가 하나씩 켜져요',
  sample: '[포인트] 이래서 *잘 팔려요* / 조리과정 한눈에 / 식기세척기 가능 / 밀폐테스트 완료',
  weightFn: sc => 1.6 + splitLines(sc).length * .6,
  render(ctx, sc, e) {
    const L = splitLines(sc), A = e.A, tall = A.h > A.w;
    const title = L.length >= 3 && e.opts.제목 !== '없음' ? L[0] : null, rows = title ? L.slice(1) : L;
    const ts = tall ? 112 : 88, th = title ? ts * 1.75 : 0;
    const n = Math.max(1, rows.length), gap = tall ? 50 : 24, rh = Math.min(tall ? 260 : 128, (A.h - th - gap * (n - 1)) / n);
    const tot = n * rh + gap * (n - 1), gy = A.y + (A.h - th - tot) / 2;
    if (title) titleLine(ctx, e, title, gy + ts * .62, ts);
    const y0 = gy + th, fs = Math.min(rh * .44, tall ? 106 : 78), R = rh * .36;
    setFont(ctx, e.F, fs); const tw = Math.min(A.w - R * 2 - 40, Math.max(...rows.map(r => ctx.measureText(plain(r)).width)));
    const x0 = A.cx - (R * 2 + 34 + tw) / 2;
    rows.forEach((r, i) => {
      const y = y0 + i * (rh + gap) + rh / 2, d = .35 + i * .42, p = prog(e.lt, d, .55); if (p <= 0) return;
      const cx = x0 + R;
      // 줄 바탕 (살짝 비치는 띠)
      ctx.save(); ctx.globalAlpha = .9 * Ease.outCubic(p); ctx.fillStyle = rgba(luma(e.P.text) > .5 ? '#000000' : '#ffffff', .16);
      roundRect(ctx, x0 - 20, y - rh / 2, (R * 2 + 74 + tw) * Ease.outCubic(p), rh, rh / 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(cx, y); const sp = Ease.outBack(clamp(p * 1.8)); ctx.scale(sp, sp);
      ctx.fillStyle = e.P.emBox; ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill(); ctx.shadowColor = 'transparent';
      checkMark(ctx, R, clamp((p - .2) / .55), e.P.emBoxText); ctx.restore();
      drawText(ctx, r, Object.assign(roleStyle(e, 'main', fs), { x: cx + R + 34, y, size: fs, align: 'left', motion: 'slide', t: e.lt, delay: d + .12, maxW: tw }));
    });
  },
};

BLOCKS.badge = {
  name: '배지 강조', weight: 2.6, help: '위 문구(선택) / 배지 안 문구 1~3줄 · *강조* 줄이 크게, 톱니 배지가 쾅 찍혀요',
  sample: '[배지] 방송 단독 / 역대급 / *최다구성*',
  render(ctx, sc, e) {
    const L = splitLines(sc), A = e.A;
    let above = null, inner = L;
    if (L.length >= 3 && !L[0].includes('*')) { above = L[0]; inner = L.slice(1); }
    inner = inner.slice(0, 3);
    const R = Math.min(A.w * .44, A.h * (above ? .36 : .44)), cx = A.cx, cy = A.cy + (above ? R * .2 : 0);
    const ap = prog(e.lt, .12, .5), sp = Ease.outBack(ap);
    if (above) titleLine(ctx, e, above, cy - R * 1.28, Math.min(96, R * .3), 'sub');
    if (sp > 0) {
      // 뒤에서 도는 빛살
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(e.t * .35); ctx.globalAlpha = .22 * ap; ctx.fillStyle = e.P.em;
      for (let k = 0; k < 16; k++) { ctx.rotate(TAU / 16); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R * 1.6, -R * .12); ctx.lineTo(R * 1.6, R * .12); ctx.fill(); }
      ctx.restore();
      ctx.save(); ctx.translate(cx, cy); ctx.scale(sp, sp); ctx.rotate(-.07 + Math.sin(e.t * 1.3) * .025);
      const spikes = 22; ctx.fillStyle = e.P.emBox; ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
      ctx.beginPath(); for (let k = 0; k <= spikes * 2; k++) { const a = k / (spikes * 2) * TAU, rr = k % 2 ? R * .9 : R; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.strokeStyle = rgba(e.P.emBoxText, .75); ctx.lineWidth = Math.max(3, R * .022); ctx.setLineDash([R * .06, R * .045]);
      ctx.beginPath(); ctx.arc(0, 0, R * .77, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    }
    const n = inner.length, sizes = inner.map((t, i) => (t.includes('*') || n === 1 || (i === n - 1 && !inner.some(x => x.includes('*')))) ? R * .4 : R * .2);
    let y = cy - sizes.reduce((a, s) => a + s * 1.14, 0) / 2;
    inner.forEach((t, i) => { const s = sizes[i]; y += s * .57; drawText(ctx, t, { font: e.F, x: cx, y, size: s, color: e.P.emBoxText, em: e.P.emBoxText, motion: 'stamp', t: e.lt, delay: .38 + i * .16, maxW: R * 1.32 }); y += s * .57; });
    if (ap >= 1) FX.sparkles(ctx, e.t, 10, '#ffffff', { x: cx - R, y: cy - R, w: R * 2, h: R * 2 });
  },
};

BLOCKS.info = {
  name: '정보 표', weight: 3, help: '제목(선택) / 항목: 내용 / 항목: 내용 … (원산지·용량·성분 같은 정보를 표처럼)',
  sample: '[정보] 상품 정보 / 원산지: 국내산 / 용량: 50ml x 10통 / 인증: 식약처 기능성',
  weightFn: sc => 1.4 + splitLines(sc).length * .5,
  render(ctx, sc, e) {
    const L = splitLines(sc), A = e.A, tall = A.h > A.w;
    const title = L[0] && !L[0].includes(':') && L.length > 1 ? L[0] : null;
    const rows = (title ? L.slice(1) : L).map(l => { const i = l.indexOf(':'); return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : [null, l]; });
    const ts = tall ? 112 : 84, th = title ? ts * 1.7 : 0;
    const n = Math.max(1, rows.length), rh = Math.min(tall ? 290 : 120, (A.h - th) / n), gy = A.y + (A.h - th - rh * n) / 2;
    if (title) titleLine(ctx, e, title, gy + ts * .62, ts);
    const y0 = gy + th;
    const pw = tall ? A.w : Math.min(A.w, 1180), x0 = A.cx - pw / 2;
    rows.forEach(([k, v], i) => {
      const y = y0 + i * rh, p = Ease.outCubic(prog(e.lt, .3 + i * .26, .45)); if (p <= 0) return;
      ctx.save(); ctx.globalAlpha = p;
      ctx.fillStyle = rgba(e.P.text, .32); ctx.fillRect(x0, y + rh - 3, pw * p, 3);
      if (k) {
        const ks = tall ? Math.min(rh * .19, 56) : Math.min(rh * .3, 40);
        setFont(ctx, { family: SUBFONT.family, weight: 700 }, ks); const kw = ctx.measureText(k).width + ks * 1.2;
        const ky = tall ? y + rh * .28 : y + rh / 2, kx = tall ? A.cx - kw / 2 : x0;
        ctx.fillStyle = e.P.emBox; roundRect(ctx, kx, ky - ks * .8, kw, ks * 1.6, ks * .8); ctx.fill();
        ctx.fillStyle = e.P.emBoxText; ctx.textAlign = 'center'; ctx.fillText(k, kx + kw / 2, ky + ks * .36);
        const vs = tall ? Math.min(rh * .32, 98) : Math.min(rh * .42, 60);
        drawText(ctx, v, Object.assign(roleStyle(e, 'main', vs), tall ? { x: A.cx, y: y + rh * .66, size: vs, motion: 'none', maxW: pw } : { x: x0 + kw + 30, y: y + rh / 2, size: vs, align: 'left', motion: 'none', maxW: pw - kw - 30 }));
      } else drawText(ctx, v, Object.assign(roleStyle(e, 'main', tall ? 80 : 56), { x: A.cx, y: y + rh / 2, size: tall ? 80 : 56, motion: 'none', maxW: pw }));
      ctx.restore();
    });
  },
};

// ---------- 세로(통강조)용 장면 배치 ----------
function tongProps(ctx, e, y, kind, appearT = .3) {
  if (!kind || kind === '없음' || kind === 'TV') return;
  const ap = prog(e.lt, appearT, .4), cx = e.A.cx;
  if (kind.includes('사이렌')) { Props.siren(ctx, cx - 230, y, 1, e.t, ap); Props.siren(ctx, cx + 230, y, 1, e.t, ap); }
  if (kind.includes('시계')) Props.clock(ctx, cx, y, .95, e.t, ap);
  if (kind.includes('선물')) { Props.gift(ctx, cx - 170, y, 1, e.t, ap); Props.gift(ctx, cx + 170, y + 20, .8, e.t + 1, prog(e.lt, appearT + .15, .4), '#3a7bff'); }
  if (kind.includes('화살표위')) Props.arrow(ctx, cx, y, 1, -1, e.P.accent, e.t, ap);
  if (kind.includes('화살표아래')) Props.arrow(ctx, cx, y, 1, 1, e.P.accent, e.t, ap);
}
// 줄 쌓기 + 위쪽 소품 + 밑줄 장식
function tongStack(ctx, e, items, opt = {}) {
  const A = e.A, kind = opt.props, off = kind && kind !== '없음' && kind !== 'TV' ? 130 : 0;
  const bx = drawStack(ctx, e, items, A.cx, A.cy + off, opt.maxW || A.w, 'center', A.h - off * 2 - 40);
  if (off && bx[0]) tongProps(ctx, e, bx[0].y - 175, kind, opt.propT ?? .3);
  if (opt.underline && bx.length) {
    const last = bx[bx.length - 1], p = Ease.outCubic(prog(e.lt, opt.underline, .5));
    if (p > 0) { ctx.fillStyle = e.P.em; const w = Math.min(last.w, A.w * .55) * p; roundRect(ctx, A.cx - w / 2, last.y + last.h + 26, w, 16, 8); ctx.fill(); }
  }
  return bx;
}
function rollDigits(num, lt, rollStart = .35, settleAt = 1.25) {
  let shown = '', di = 0;
  for (const ch of num) {
    if (/\d/.test(ch)) { const st = rollStart + .12 + di * .07, fin = settleAt + di * .05; shown += lt < st ? ' ' : lt < fin ? String(Math.floor(rnd(Math.floor(lt * 24), di) * 10)) : ch; di++; }
    else shown += lt < rollStart + .12 ? ' ' : ch;
  }
  return { shown, settle: settleAt + Math.max(0, di - 1) * .05 };
}

const TONG_BLOCKS = {
  hook: { render(ctx, sc, e) {
    const L = splitLines(sc), same = e.opts.크기 === '동일' || L.length === 1;
    const items = L.map((t, i) => ({ text: t, size: same ? (L.length > 2 ? 190 : 230) : (i === 0 ? 100 : 240), role: !same && i === 0 ? 'sub' : 'main' }));
    tongStack(ctx, e, items, { props: e.opts.소품, propT: .1 + L.length * .3, underline: .3 + L.length * .32 });
  } },
  cta: { render(ctx, sc, e) {
    const L = splitLines(sc), A = e.A, img = e.img(e.opts.이미지), pulse = 1 + Math.sin(e.lt * 4) * .015;
    ctx.save(); ctx.translate(A.cx, A.cy); ctx.scale(pulse, pulse); ctx.translate(-A.cx, -A.cy);
    if (img) { drawImageFit(ctx, img, A.cx, A.y + A.h * .22, A.w * .7, A.h * .34, { alpha: prog(e.lt, 0, .4), scale: Ease.outBack(prog(e.lt, 0, .5)) }); }
    const items = L.map((t, i) => ({ text: t, size: L.length > 1 && i === 0 ? 130 : 200, role: 'main', motion: e.opts.모션 ? e.motion : 'slide', delay: .05 + i * .3 }));
    if (img) drawStack(ctx, e, items, A.cx, A.y + A.h * .68, A.w, 'center', A.h * .5);
    else tongStack(ctx, e, items, { props: e.opts.소품, propT: .5 });
    ctx.restore();
  } },
  urgent: { render(ctx, sc, e) {
    const L = splitLines(sc);
    const items = L.map((t, i) => ({ text: t, size: L.length >= 2 && i === 0 ? 100 : 220, role: L.length >= 2 && i === 0 ? 'sub' : 'main', motion: i === 0 ? e.motion : 'stamp', delay: .05 + i * .28 }));
    const shake = e.lt < 1.2 ? Math.sin(e.lt * 60) * 6 * (1 - e.lt / 1.2) : 0;
    ctx.save(); ctx.translate(shake, 0); tongStack(ctx, e, items, { props: e.opts.소품 ?? '사이렌', maxW: e.A.w * .96 }); ctx.restore();
  } },
  product: { render(ctx, sc, e) {
    const L = splitLines(sc), A = e.A, img = e.img(e.opts.이미지);
    if (!img) return TONG_BLOCKS.hook.render(ctx, sc, e);
    const ih = A.h * .56, ap = Ease.outCubic(prog(e.lt, .05, .6)), icy = A.y + ih / 2;
    ctx.save(); ctx.globalAlpha = ap; const g = ctx.createRadialGradient(A.cx, icy, 0, A.cx, icy, A.w * .6);
    g.addColorStop(0, 'rgba(255,255,255,.38)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, A.y - 60, W, ih + 120); ctx.restore();
    drawImageFit(ctx, img, A.cx, icy + (1 - ap) * 140 + Math.sin(e.t * 1.5) * 10, A.w * .94, ih, { alpha: ap, shadow: true, scale: lerp(.88, 1, ap) });
    const items = L.map((t, i) => ({ text: t, size: i === 0 && L.length > 2 ? 80 : 150, role: i === 0 && L.length > 2 ? 'sub' : 'main', delay: .35 + i * .3 }));
    drawStack(ctx, e, items, A.cx, A.y + ih + (A.h - ih) / 2 + 10, A.w, 'center', A.h - ih - 40);
  } },
  impact: { render(ctx, sc, e) {
    const L = splitLines(sc), A = e.A;
    const style = e.opts.스타일 || (L.some(l => l.includes('|')) ? '분리' : '박스');
    if (style === '분리') { // 한 글자씩 세로로 쾅쾅
      const main = L.find(l => l.includes('|')) || L[L.length - 1], sub = L.filter(l => l !== main);
      const pieces = main.includes('|') ? main.split('|').map(s => s.trim()).filter(Boolean) : plain(main).split('');
      const subH = sub.length ? 150 : 0, s = Math.min(340, (A.h - subH - 40) / pieces.length / 1.08, A.w * .8);
      let y = A.cy - (pieces.length * s * 1.08 + subH) / 2;
      if (sub.length) { titleLine(ctx, e, sub.join(' '), y + 50, 86, 'sub'); y += subH; }
      const dark = luma(e.P.text) > .5;
      pieces.forEach((p, i) => {
        const cy = y + s * 1.08 * i + s * .54, ap = Ease.outBack(prog(e.lt, .15 + i * .16, .35));
        if (ap > 0) {
          ctx.save(); ctx.translate(A.cx + (i % 2 ? 1 : -1) * s * .08, cy); ctx.rotate((i % 2 ? 1 : -1) * .05); ctx.scale(ap, ap);
          ctx.fillStyle = rgba(dark ? '#000000' : '#ffffff', .22); roundRect(ctx, -s * .6, -s * .52, s * 1.2, s * 1.04, s * .16); ctx.fill();
          ctx.strokeStyle = e.P.em; ctx.lineWidth = s * .035; ctx.stroke(); ctx.restore();
        }
        drawText(ctx, p.includes('*') ? p : '*' + p + '*', Object.assign(roleStyle(e, 'main', s * .8), { x: A.cx + (i % 2 ? 1 : -1) * s * .08, y: cy, size: s * .8, motion: 'stamp', t: e.lt, delay: .2 + i * .16, maxW: A.w * .9 }));
      });
      return;
    }
    if (style === '반복') { // 세로로 흐르는 반복 글자 + 가운데 큰 글자
      const main = L[L.length - 1], s = Math.min(200, fitSize(ctx, main, e.F, 200, A.w * .95)), step = s * 1.15, n = Math.ceil(A.h / 2 / step) + 1;
      ctx.save(); ctx.beginPath(); ctx.rect(0, A.y - 40, W, A.h + 80); ctx.clip();
      for (let i = -n; i <= n; i++) {
        if (!i) continue; const dir = i % 2 ? 1 : -1;
        drawText(ctx, plain(main), { font: e.F, x: A.cx + dir * (e.lt * 60 - 80), y: A.cy + i * step, size: s, color: e.P.em, outline: 3, motion: 'slide', t: e.lt, delay: .05 + Math.abs(i) * .06, alpha: Math.max(.12, .55 - Math.abs(i) * .08), label: '_bg' });
      }
      ctx.restore();
      drawText(ctx, main, Object.assign(roleStyle(e, 'main', s), { x: A.cx, y: A.cy, size: s, motion: 'stamp', t: e.lt, delay: .5, maxW: A.w }));
      if (L.length > 1) titleLine(ctx, e, L[0], A.cy - s * 1.15, 80, 'box', .8);
      return;
    }
    if (style === '기울임') {
      ctx.save(); ctx.translate(A.cx, A.cy); ctx.rotate(-.1); ctx.translate(-A.cx, -A.cy);
      const wp = Ease.outCubic(prog(e.lt, 0, .35)); ctx.save(); ctx.globalAlpha = .6; ctx.fillStyle = e.P.accent; ctx.fillRect(-100, A.cy - 60, (W + 200) * wp, 300); ctx.restore();
      const items = L.map((t, i) => ({ text: i === 0 && L.length > 1 && !t.includes('*') ? '*' + t + '*' : t, size: i === 0 && L.length > 1 ? 80 : 210, role: i === 0 && L.length > 1 ? 'box' : 'main', motion: i === 0 && L.length > 1 ? 'slide' : 'stamp', delay: .1 + i * .22 }));
      drawStack(ctx, e, items, A.cx, A.cy, A.w * .95); ctx.restore(); return;
    }
    // 박스: *강조* 줄은 색 박스 안에, 줄마다 좌우에서 번갈아 들어옴
    const items = L.map((t, i) => { const isBox = t.includes('*'); return { text: t, size: isBox ? 190 : 110, role: isBox ? 'box' : 'main', motion: isBox ? 'pop' : e.motion, delay: .1 + i * .3 }; });
    tongStack(ctx, e, items, { props: e.opts.소품, maxW: A.w * .94 });
  } },
  composition: { render(ctx, sc, e) {
    const L = splitLines(sc), A = e.A;
    let ii = L.findIndex(l => l.includes('+') || l.includes('@')); const title = ii === 0 ? null : L[0]; if (ii < 0) ii = 1;
    const note = L.slice(ii + 1).join(' ');
    const items = (L[ii] || '').split('+').map(s => parseItem(s)).filter(x => x.label || x.img);
    const th = title ? 190 : 0, nh = note ? 120 : 0, n = Math.max(1, items.length), plus = 120;
    const rh = Math.min(500, (A.h - th - nh - plus * (n - 1)) / n), tot = rh * n + plus * (n - 1), gy = A.y + (A.h - th - nh - tot) / 2;
    if (title) titleLine(ctx, e, title, gy + 70, 120);
    let y = gy + th; const noteY = y + tot + 60;
    items.forEach((it, i) => {
      const p = Ease.outCubic(prog(e.lt, .3 + i * .35, .45));
      if (p > 0) {
        const x = A.x + (1 - p) * (i % 2 ? 160 : -160);
        ctx.save(); ctx.globalAlpha = p;
        ctx.fillStyle = e.P.card; ctx.shadowColor = 'rgba(0,0,0,.22)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; roundRect(ctx, x, y, A.w, rh, 34); ctx.fill(); ctx.shadowColor = 'transparent';
        const iw = Math.min(rh - 50, A.w * .42), img = e.img(it.img), icx = x + 30 + iw / 2;
        if (img) drawImageFit(ctx, img, icx, y + rh / 2, iw, rh - 50, {}); else Props.placeholder(ctx, icx, y + rh / 2, iw * .9, (rh - 50) * .9, e.P.cardText, it.label ? plain(it.label).slice(0, 6) : '상품');
        const tx = x + 60 + iw, tw = A.w - iw - 90;
        drawText(ctx, it.label || '', { font: e.F, x: tx, y: y + rh * (it.qty > 1 ? .36 : .5), size: Math.min(84, rh * .2), color: e.P.cardText, em: cardEm(e.P), align: 'left', motion: 'none', maxW: tw });
        if (it.qty > 1) drawText(ctx, '*x' + it.qty + '*', { font: e.F, x: tx, y: y + rh * .68, size: Math.min(130, rh * .3), color: e.P.cardText, em: cardEm(e.P), align: 'left', motion: 'pop', t: e.lt, delay: .5 + i * .35 });
        ctx.restore();
        if (i < n - 1 && p > .6) { const pa = Ease.outBack(clamp((p - .6) / .4)); ctx.save(); ctx.translate(A.cx, y + rh + plus / 2); ctx.scale(pa, pa); ctx.fillStyle = e.P.accent2 === e.P.card ? e.P.em : e.P.accent2; ctx.beginPath(); ctx.arc(0, 0, 54, 0, TAU); ctx.fill(); ctx.fillStyle = e.P.card === '#ffffff' && e.P.accent2 === '#ffffff' ? e.P.em : '#ffffff'; ctx.fillRect(-28, -8, 56, 16); ctx.fillRect(-8, -28, 16, 56); ctx.restore(); }
      }
      y += rh + plus;
    });
    if (note) drawText(ctx, note, Object.assign(roleStyle(e, 'note', 58), { x: A.cx, y: noteY, size: 58, motion: 'slide', t: e.lt, delay: .9, maxW: A.w }));
  } },
  benefits: { render(ctx, sc, e) {
    const L = splitLines(sc), A = e.A, title = L.length > 1 ? L[0] : null, rows = title ? L.slice(1) : L;
    const th = title ? 200 : 0, n = Math.max(1, rows.length), gap = 44, rh = Math.min(300, (A.h - th - gap * (n - 1)) / n), gy = A.y + (A.h - th - (n * rh + gap * (n - 1))) / 2;
    if (title) titleLine(ctx, e, title, gy + 72, 118);
    const y0 = gy + th;
    rows.forEach((r, i) => {
      const y = y0 + i * (rh + gap), p = Ease.outCubic(prog(e.lt, .3 + i * .28, .45)); if (p <= 0) return;
      const x = A.x + (1 - p) * 140; ctx.save(); ctx.globalAlpha = p;
      ctx.fillStyle = e.P.card; ctx.shadowColor = 'rgba(0,0,0,.22)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 6; roundRect(ctx, x, y, A.w, rh, 30); ctx.fill(); ctx.shadowColor = 'transparent';
      const R = rh * .3, cx = x + rh * .5;
      ctx.fillStyle = e.P.emBox === e.P.card ? e.P.em : e.P.emBox; ctx.beginPath(); ctx.arc(cx, y + rh / 2, R, 0, TAU); ctx.fill();
      ctx.fillStyle = e.P.emBox === e.P.card ? '#ffffff' : e.P.emBoxText; setFont(ctx, e.F, R * .95); ctx.textAlign = 'center'; ctx.fillText(String(i + 1).padStart(2, '0'), cx, y + rh / 2 + R * .34);
      drawText(ctx, r, { font: e.F, x: x + rh * .95, y: y + rh / 2, size: Math.min(rh * .34, 84), color: e.P.cardText, em: cardEm(e.P), align: 'left', motion: 'none', maxW: A.w - rh - 40 });
      ctx.restore();
    });
  } },
  price: { render(ctx, sc, e) {
    const L = splitLines(sc), A = e.A;
    let pi = L.findIndex(l => /\d[\d,]*\s*원/.test(plain(l))); if (pi < 0) pi = L.findIndex(l => /\d/.test(l)); if (pi < 0) pi = 0;
    const pre = L.slice(0, pi), post = L.slice(pi + 1), raw = plain(L[pi] || ''), m = raw.match(/\d[\d,]*/);
    const before = m ? raw.slice(0, m.index).trim() : '', num = m ? m[0] : raw, after = m ? raw.slice(m.index + num.length).trim() : '';
    const { shown, settle } = rollDigits(num, e.lt);
    const sufK = .46; setFont(ctx, e.F, 300); const wN = ctx.measureText(num.replace(/\d/g, '0')).width; setFont(ctx, e.F, 300 * sufK); const wA = after ? ctx.measureText(after).width + 16 : 0;
    const bigS = Math.min(320, 300 * (A.w * .95) / (wN + wA)), totW = (wN + wA) * bigS / 300;
    const orig = e.opts.정가 ? plain(e.opts.정가).replace(/^(\D*)(\d{4,})(\D*)$/, (_, a, n, b) => a + Number(n).toLocaleString('ko-KR') + (b || '원')) : '';
    const preTxt = pre.join(' '), bubble = preTxt && plain(preTxt).length <= 2;
    const hPre = preTxt ? (bubble ? 190 : 140) : 0, hOrig = orig ? 110 : 0, hBefore = before ? 100 : 0, hNum = bigS * 1.12, hPost = post.length ? 110 : 0;
    let y = A.cy - (hPre + hOrig + hBefore + hNum + hPost) / 2;
    if (preTxt) {
      if (bubble) Props.bubble(ctx, A.cx, y + 90, 88, plain(preTxt), e.F, e.P.emBox, e.P.emBoxText, prog(e.lt, .05, .4));
      else titleLine(ctx, e, preTxt, y + 60, 92, 'sub');
      y += hPre;
    }
    if (orig) {
      const ot = /정가/.test(orig) ? orig : '정가 ' + orig, oy = y + 50;
      const r = drawText(ctx, ot, Object.assign(roleStyle(e, 'note', 64), { x: A.cx, y: oy, size: 64, motion: 'slide', t: e.lt, delay: .1, maxW: A.w * .8 }));
      const sp = Ease.outCubic(prog(e.lt, settle - .25, .35));
      if (sp > 0) { ctx.save(); ctx.strokeStyle = e.P.em; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(r.x - 10, oy + 3); ctx.lineTo(r.x - 10 + (r.w + 20) * sp, oy - 5); ctx.stroke(); ctx.restore(); }
      y += hOrig;
    }
    if (before) { titleLine(ctx, e, before, y + 50, 84, 'sub', .3); y += hBefore; }
    const cy = y + hNum / 2, x0 = A.cx - totW / 2, punch = prog(e.lt, settle, .3);
    const bp = Ease.outCubic(prog(e.lt, settle, .4)); ctx.fillStyle = rgba(e.P.accent, .55); ctx.fillRect(x0 - 16, cy + bigS * .16, (totW + 32) * bp, bigS * .24);
    ctx.save(); const s2 = 1 + (punch > 0 ? (1 - Ease.outCubic(punch)) * .25 : 0); ctx.translate(A.cx, cy); ctx.scale(s2, s2); ctx.translate(-A.cx, -cy);
    ctx.globalAlpha = prog(e.lt, .35, .15); const st = roleStyle(e, 'main', bigS);
    setFont(ctx, e.F, bigS); let x = x0;
    for (const ch of shown) { const cw = ctx.measureText(/\d| /.test(ch) ? '0' : ch).width; if (ch !== ' ') drawText(ctx, '*' + ch + '*', Object.assign({}, st, { x: x + cw / 2, y: cy, size: bigS, motion: 'none', label: '_d' })); x += cw; }
    if (after) drawText(ctx, after, Object.assign({}, st, { x: x + 12, y: cy + bigS * (1 - sufK) * .36, size: bigS * sufK, align: 'left', motion: 'pop', t: e.lt, delay: settle - .1 }));
    reportBox(x0, cy - bigS * .6, totW, bigS * 1.2, raw); ctx.restore();
    y += hNum;
    if (e.opts.할인) { // 스티커처럼 숫자 오른쪽 위에 붙는 할인 배지
      const dp = prog(e.lt, settle + .05, .45); if (dp > 0) {
        const pct = plain(e.opts.할인).replace(/\s/g, ''), label = /%|할인/.test(pct) ? pct.replace('할인', '') : pct + '%';
        const R = 118, bx = Math.min(A.x + A.w - R * .55, x0 + totW - R * .2), by = cy - bigS * .62 - R * .35;
        ctx.save(); ctx.translate(bx, by); ctx.rotate(.12 - .2 * (1 - Ease.outCubic(dp))); const s3 = Ease.outBack(dp); ctx.scale(s3, s3);
        ctx.fillStyle = e.P.emBox; ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill(); ctx.shadowColor = 'transparent';
        ctx.fillStyle = e.P.emBoxText; ctx.textAlign = 'center'; setFont(ctx, e.F, label.length > 3 ? 70 : 84); ctx.fillText(label, 0, 14); setFont(ctx, { family: SUBFONT.family, weight: 700 }, 36); ctx.fillText('할인', 0, 66);
        ctx.restore(); reportBox(bx - R, by - R, R * 2, R * 2, '할인 ' + label);
      }
    }
    if (post.length) drawText(ctx, post.join(' '), Object.assign(roleStyle(e, 'note', 56), { x: A.cx, y: y + 55, size: 56, motion: 'slide', t: e.lt, delay: settle + .2, maxW: A.w }));
    FX.confetti(ctx, e.lt, 70, [e.P.accent, e.P.accent2, '#ffffff', '#ffd84f'], { burst: settle, x: A.cx, y: cy });
    if (punch > 0) FX.sparkles(ctx, e.t, 8, '#ffffff', { x: x0, y: cy - bigS * .6, w: totW, h: bigS * 1.2 });
  } },
};

// ---------- 틀 · 머리/꼬리 고정 띠 ----------
function tongFrameRect(proj) { const top = (proj.head ? TONG.head : 0) + 22, bot = H - (proj.foot ? TONG.foot : 0) - 22; return { x: 22, y: top, w: W - 44, h: bot - top }; }
// 카드 틀: 글자 뒤에 깔리는 반투명 판 (장면마다 같이 그려져 전환에 함께 움직임)
function tongFrameBack(ctx, proj, e) {
  if (proj.frame !== '카드') return;
  const r = tongFrameRect(proj), light = luma(e.P.text) > .5;
  ctx.save(); ctx.fillStyle = light ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.62)'; ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
  roundRect(ctx, r.x + 28, r.y + 28, r.w - 56, r.h - 56, 56); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = light ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.08)'; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
}
function drawTongChrome(ctx, proj, t) {
  const th = THEMES[proj.theme] || THEMES.ns, P = th.pal[0], F = FONTS[proj.font || th.font] || FONTS.blackhan, fr = proj.frame || '없음', r = tongFrameRect(proj);
  ctx.save();
  if (fr === '테두리') {
    ctx.strokeStyle = P.em; ctx.lineWidth = 10; ctx.strokeRect(r.x + 10, r.y + 10, r.w - 20, r.h - 20);
    ctx.strokeStyle = rgba(P.text, .55); ctx.lineWidth = 3; ctx.strokeRect(r.x + 34, r.y + 34, r.w - 68, r.h - 68);
    ctx.fillStyle = P.em; for (const [x, y] of [[r.x + 10, r.y + 10], [r.x + r.w - 10, r.y + 10], [r.x + 10, r.y + r.h - 10], [r.x + r.w - 10, r.y + r.h - 10]]) { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillRect(-18, -18, 36, 36); ctx.restore(); }
  } else if (fr === '네온') {
    const fl = .82 + .18 * Math.sin(t * 9) * Math.sin(t * 2.3);
    ctx.globalAlpha = fl; ctx.strokeStyle = P.glow || P.em; ctx.shadowColor = P.glow || P.em; ctx.shadowBlur = 50; ctx.lineWidth = 12;
    roundRect(ctx, r.x + 20, r.y + 20, r.w - 40, r.h - 40, 60); ctx.stroke(); ctx.shadowBlur = 0; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.stroke();
  } else if (fr === '코너') {
    const L = 170 + Math.sin(t * 3) * 10; ctx.strokeStyle = P.em; ctx.lineWidth = 16; ctx.lineCap = 'square';
    const c = [[r.x + 16, r.y + 16, 1, 1], [r.x + r.w - 16, r.y + 16, -1, 1], [r.x + 16, r.y + r.h - 16, 1, -1], [r.x + r.w - 16, r.y + r.h - 16, -1, -1]];
    for (const [x, y, dx, dy] of c) { ctx.beginPath(); ctx.moveTo(x + dx * L, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy * L); ctx.stroke(); }
  }
  ctx.restore();
  const sweep = (y0, h) => { const ph = (t % 5) / 5; if (ph >= .3) return; const x = -300 + (W + 600) * (ph / .3); const g = ctx.createLinearGradient(x - 170, 0, x + 170, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.32)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, y0, W, h); };
  const lines = s => String(s).split('|').map(x => x.trim()).filter(Boolean);
  if (proj.head) {
    const h = TONG.head, Ls = lines(proj.head);
    ctx.save(); ctx.fillStyle = P.emBox; ctx.fillRect(0, 0, W, h); sweep(0, h - 12);
    ctx.fillStyle = P.em === P.emBox ? P.text : P.em; ctx.fillRect(0, h - 12, W, 12);
    if (Ls.length === 1) drawText(ctx, Ls[0], { font: F, x: W / 2, y: h / 2 - 6, size: 130, color: P.emBoxText, em: P.emBoxText, motion: 'none', maxW: W - 120, label: '_head' });
    else { drawText(ctx, Ls[0], { font: { family: SUBFONT.family, weight: 700 }, x: W / 2, y: h * .3, size: 62, color: P.emBoxText, em: P.emBoxText, motion: 'none', maxW: W - 120, label: '_head' }); drawText(ctx, Ls[1], { font: F, x: W / 2, y: h * .66, size: 112, color: P.emBoxText, em: P.emBoxText, motion: 'none', maxW: W - 120, label: '_head' }); }
    ctx.restore();
  }
  if (proj.foot) {
    const h = TONG.foot, y0 = H - h, Ls = lines(proj.foot);
    ctx.save(); ctx.fillStyle = P.card; ctx.fillRect(0, y0, W, h); ctx.fillStyle = rgba(P.cardText, .18); ctx.fillRect(0, y0, W, 8);
    if (Ls.length === 1) drawText(ctx, Ls[0], { font: F, x: W / 2, y: y0 + h / 2, size: 100, color: P.cardText, em: cardEm(P), motion: 'none', maxW: W - 120, label: '_foot' });
    else { drawText(ctx, Ls[0], { font: { family: SUBFONT.family, weight: 700 }, x: W / 2, y: y0 + h * .32, size: 60, color: P.cardText, em: cardEm(P), motion: 'none', maxW: W - 120, label: '_foot' }); drawText(ctx, Ls[1], { font: F, x: W / 2, y: y0 + h * .66, size: 112, color: P.cardText, em: cardEm(P), motion: 'none', maxW: W - 120, label: '_foot' }); }
    ctx.restore();
  }
}
