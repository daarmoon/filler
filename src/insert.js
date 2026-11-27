// ===== insert.js : 인서트(키네틱 타이포) 장면 · 배경 효과 · 테마 · 단서 자막 =====
// 참고: DB0 인서트 예시(최저가 찬스 / 반값 세일 / 50% 회차세일). L바 안쪽에 큰 글자를 1~2초마다 바꿔 보여주는 구성.

// 줄 앞 (외곽) (박스) (테이프) (입체) (자간) (작게) (크게) 표시로 줄마다 글자 꾸밈
const LINE_TAG_RE = /^\s*\((외곽|박스|테이프|입체|자간|작게|크게)\)\s*/;
function lineTag(l) { const m = LINE_TAG_RE.exec(l); return m ? { tag: m[1], text: l.slice(m[0].length) } : { tag: '', text: l }; }
function darker(hex, k = .45) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return 'rgba(0,0,0,.55)';
  const n = parseInt(m[1], 16), f = c => Math.round(c * (1 - k));
  return `rgb(${f(n >> 16 & 255)},${f(n >> 8 & 255)},${f(n & 255)})`;
}
function patternWord(sc, opts) {
  if (opts && opts.패턴) return opts.패턴;
  const all = sc.lines.join(' / '); const m = /\*([^*]+)\*/.exec(all);
  const w = plain(m ? m[1] : (sc.lines.map(l => lineTag(l).text).find(l => l.trim()) || 'SALE')).replace(/[\s|/]+/g, ' ').trim();
  return w.slice(0, 10) || 'SALE';
}

// 타이포 줄 하나 그리기 (꾸밈 표시 반영)
function typoLine(ctx, e, it, x, y, size, o) {
  const P = e.P, tag = it.tag;
  const st = Object.assign(roleStyle(e, tag === '작게' ? 'sub' : 'main', size), { x, y, size, maxW: o.maxW, motion: o.motion, t: o.t, delay: o.delay, label: o.label });
  st.emBox = null;
  if (tag === '외곽') Object.assign(st, { outline: Math.max(3, size * .022), stroke: null, shadow: null, glow: null, gradient: null });
  if (tag === '입체') Object.assign(st, { extrude: .07, extrudeColor: darker(P.em === P.text ? P.accent : P.em, .55), shadow: null });
  if (tag === '자간') st.tracking = .16;
  if (tag === '박스' || tag === '테이프') {
    const s = Math.min(size, fitSize(ctx, it.text, e.F, size, o.maxW * .9, TRACK_ADD));
    const w = layoutLine(ctx, parseRich(it.text), e.F, s, TRACK_ADD).width + s * .6, h = s * 1.22;
    const p = Ease.outCubic(prog(o.t, o.delay, .3)); if (p <= 0) return null;
    ctx.save(); ctx.translate(x, y); if (tag === '테이프') ctx.rotate(-.075);
    ctx.fillStyle = tag === '테이프' ? (P.card || '#ffffff') : P.emBox;
    if (tag === '테이프') { ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8; }
    ctx.fillRect(-w / 2, -h / 2, w * p, h); ctx.restore();
    ctx.save(); ctx.translate(x, y); if (tag === '테이프') ctx.rotate(-.075); ctx.translate(-x, -y);
    const col = tag === '테이프' ? (P.cardText || P.accent) : P.emBoxText;
    const b = drawText(ctx, it.text, { font: e.F, x, y, size: s, color: col, em: tag === '테이프' ? (P.accent === col ? P.text : P.accent) : col, motion: 'slide', t: o.t, delay: o.delay + .08, label: o.label });
    ctx.restore(); return b;
  }
  return drawText(ctx, it.text, st);
}

function typoItems(sc) { return sc.lines.filter(l => l.trim() !== '').map(lineTag); }
function typoBase(n) { return n <= 1 ? 300 : n === 2 ? 230 : n === 3 ? 190 : 150; }
function typoSize(it, base) {
  const len = plain(it.text).replace(/\s/g, '').length;
  let s = base; if (it.tag === '작게') s = base * .42; else if (it.tag === '크게') s = base * 1.3; else if (len <= 3) s = base * 1.22; else if (/\*/.test(it.text)) s = base * 1.06;
  return s;
}

BLOCKS.typo = {
  name: '키네틱 타이포', weight: 2.2, help: '줄마다 차례로 등장  {스타일: 쌓기|교체}  줄 앞 (외곽)(박스)(테이프)(입체)(자간)(작게)(크게)',
  sample: '[타이포] (작게)지금 이 방송 / *찬란한 혜택!* {스타일: 쌓기, 효과: 폭죽}',
  weightFn: sc => { const n = typoItems(sc).filter(i => i.tag !== '작게').length; return (sc.opts.스타일 === '교체' ? .75 : .55) * n + 1; },
  render(ctx, sc, e) {
    const items = typoItems(sc), A = e.A; if (!items.length) return;
    const own = !!e.opts.모션;
    if (e.opts.스타일 === '교체') {
      // 한 줄씩 화면 가득 → 다음 줄로 컷. (작게) 줄은 다음 큰 줄 위에 함께 붙음
      const groups = []; let pend = [];
      for (const it of items) { if (it.tag === '작게') pend.push(it); else { groups.push({ head: pend, main: it }); pend = []; } }
      if (pend.length) groups.push({ head: pend.slice(0, -1), main: pend[pend.length - 1] });
      const per = e.D / groups.length, gi = clamp(Math.floor(e.lt / per), 0, groups.length - 1), g = groups[gi], lt = e.lt - gi * per;
      const len = plain(g.main.text).replace(/\s/g, '').length;
      const big = (len <= 3 ? 400 : len <= 6 ? 300 : 230) * (g.main.tag === '크게' ? 1.15 : 1);
      const hs = big * .3, gap = 26 + (LEAD - 1) * (hs + 26), totalH = g.head.length * (hs + gap) + big;
      let y = A.cy - totalH / 2;
      g.head.forEach((h, k) => { typoLine(ctx, e, h, A.cx, y + hs / 2, hs, { maxW: A.w, motion: 'slide', t: lt, delay: 0, label: '타이포' }); y += hs + gap; });
      const mo = own ? e.motion : ['stamp', 'zoom', 'pop', 'slide'][gi % 4];
      ctx.save(); const punch = 1 + (1 - Ease.outCubic(prog(lt, 0, .25))) * .06; ctx.translate(A.cx, y + big / 2); ctx.scale(punch, punch); ctx.translate(-A.cx, -(y + big / 2));
      typoLine(ctx, e, g.main, A.cx, y + big / 2, big, { maxW: A.w, motion: mo, t: lt, delay: g.head.length ? .12 : 0, label: '타이포' });
      ctx.restore();
      return;
    }
    // 쌓기: 줄이 하나씩 쌓이며 남음
    const base = typoBase(items.filter(i => i.tag !== '작게').length);
    let sizes = items.map(it => typoSize(it, base));
    const gap = .14 + (LEAD - 1) * 1.14; let total = sizes.reduce((a, s) => a + s * (1 + gap), 0) - sizes[sizes.length - 1] * gap;
    if (total > A.h * .88) { const k = A.h * .88 / total; sizes = sizes.map(s => s * k); total *= k; }
    const per = Math.min(.42, (e.D * .45) / items.length);
    let y = A.cy - total / 2;
    items.forEach((it, i) => {
      const s = sizes[i]; const mo = own ? e.motion : it.tag === '작게' ? 'slide' : (s >= base * 1.1 ? 'stamp' : 'pop');
      typoLine(ctx, e, it, A.cx, y + s / 2, s, { maxW: A.w, motion: mo, t: e.lt, delay: .05 + i * per, label: '타이포' });
      y += s * (1 + gap);
    });
  },
};
BLOCK_LABEL.typo = '타이포';

// ---------- 인서트 배경 효과 ----------
function arrowShape(ctx, x, y, w, len, dir) { // dir 1=아래, -1=위, (x,y)=머리 끝
  const hw = w * 1.15, hl = w * 1.05;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - hw, y - dir * hl); ctx.lineTo(x - w / 2, y - dir * hl); ctx.lineTo(x - w / 2, y - dir * len);
  ctx.lineTo(x + w / 2, y - dir * len); ctx.lineTo(x + w / 2, y - dir * hl); ctx.lineTo(x + hw, y - dir * hl); ctx.closePath();
}
function bigArrows(ctx, t, lt, e, dir) { // dir 1=가격 하락(아래로), -1=가격 상승(위로)
  const c1 = e.P.accent, c2 = darker(c1, .55);
  [[.07, .8, 200], [.3, .55, 140], [.53, 1, 250], [.76, .65, 170], [.95, .9, 220]].forEach(([fx, sp, w], k) => {
    const len = H * (.7 + hash(k * 7 + 3) * .45), cycle = H + len * 2, pos = ((lt + 2) * 140 * sp + k * 330) % cycle;
    const head = dir > 0 ? pos - len : H + len - pos, x = W * fx, ap = Ease.outCubic(prog(lt, k * .05, .35));
    ctx.save(); const tail = head - dir * len; const g = ctx.createLinearGradient(0, tail, 0, head);
    g.addColorStop(0, rgba(c1, 0)); g.addColorStop(.5, rgba(c1, .6)); g.addColorStop(1, c1);
    ctx.globalAlpha = .85 * ap; ctx.fillStyle = g; ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 30; arrowShape(ctx, x, head, w, len, dir); ctx.fill();
    ctx.shadowBlur = 0; ctx.globalAlpha = .3 * ap; ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(x, head); ctx.lineTo(x + w * 1.15, head - dir * w * 1.05); ctx.lineTo(x + w / 2, head - dir * w * 1.05); ctx.lineTo(x + w / 2, tail); ctx.lineTo(x + w * .15, tail); ctx.closePath(); ctx.fill();
    ctx.restore();
  });
}
Object.assign(EFFECTS, {
  글자패턴: { layer: 'back', fn(ctx, t, lt, e) {
    const word = patternWord(e.sc, e.opts) + '   ';
    const rows = 8, rh = H / (rows - 1); setFont(ctx, e.F, rh * .8); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    const ww = Math.max(80, ctx.measureText(word).width), col = e.P.text, ap = prog(lt, 0, .35);
    for (let r = 0; r < rows; r++) {
      const y = r * rh + rh * .3, dir = r % 2 ? 1 : -1, off = (((lt + 3) * 160 * dir) % ww + ww) % ww - ww;
      ctx.save(); ctx.globalAlpha = (r % 2 ? .22 : .12) * ap;
      if (r % 2) { ctx.strokeStyle = col; ctx.lineWidth = 2.5; for (let x = off - ww; x < W + ww; x += ww) ctx.strokeText(word, x, y); }
      else { ctx.fillStyle = col; for (let x = off - ww; x < W + ww; x += ww) ctx.fillText(word, x, y); }
      ctx.restore();
    }
  } },
  화살표하락: { layer: 'back', fn(ctx, t, lt, e) { bigArrows(ctx, t, lt, e, 1); } },
  화살표상승: { layer: 'back', fn(ctx, t, lt, e) { bigArrows(ctx, t, lt, e, -1); } },
  대각분할: { layer: 'back', fn(ctx, t, lt, e) {
    const dark = /^#(f|e|d)/i.test(e.P.text) || e.P.text === '#ffffff'; const col = dark ? 'rgba(10,10,12,.92)' : e.P.accent;
    const p = Ease.outCubic(prog(lt, 0, .45)), yL = H * .52 * p, yR = H * .22 * p;
    ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, yR); ctx.lineTo(0, yL); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = .9; ctx.fillStyle = e.P.em; ctx.beginPath(); ctx.moveTo(0, yL); ctx.lineTo(W, yR); ctx.lineTo(W, yR + 10 * p); ctx.lineTo(0, yL + 10 * p); ctx.closePath(); ctx.fill(); ctx.restore();
  } },
  원형스포트: { layer: 'back', fn(ctx, t, lt, e) {
    const p = Ease.outBack(prog(lt, 0, .5)), r = H * .46 * p * (1 + Math.sin(t * 2) * .01);
    ctx.save(); ctx.shadowColor = rgba(e.P.accent, .8); ctx.shadowBlur = 80; ctx.fillStyle = 'rgba(8,8,10,.9)'; ctx.beginPath(); ctx.arc(e.A.cx, e.A.cy, r, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = rgba(e.P.accent, .5); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(e.A.cx, e.A.cy, r + 18, -1.2 + t * .6, .9 + t * .6); ctx.stroke(); ctx.restore();
    FX.embers(ctx, t, 26, e.P.accent);
  } },
  종이질감: { layer: 'post', fn(ctx, t) {
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .16; const n = noiseTile();
    const ox = Math.floor(hash(Math.floor(t * 12)) * 256); ctx.fillStyle = ctx.createPattern(n, 'repeat'); ctx.translate(-ox, 0); ctx.scale(2, 2); ctx.fillRect(0, 0, W, H); ctx.restore();
    ctx.save(); ctx.globalAlpha = .1; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
    for (let k = 0; k < 7; k++) { const x = hash(k * 31 + Math.floor(t * 8)) * W; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + (hash(k) - .5) * 60, H); ctx.stroke(); }
    ctx.restore();
  } },
  플래시: { layer: 'post', fn(ctx, t, lt) { const a = (1 - clamp(lt / .2)) * .85; if (a > 0) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H); ctx.restore(); } } },
});
EFFECT_NAMES.length = 0; EFFECT_NAMES.push(...Object.keys(EFFECTS));

// ---------- 인서트 테마 3종 ----------
Object.assign(THEMES, {
  impact: {
    name: '임팩트 블랙레드 (타이포)', font: 'blackhan',
    pal: [
      { text: '#ffffff', em: '#ff2b1c', sub: '#e6e6e6', stroke: null, shadow: 'rgba(0,0,0,.55)', emBox: '#e5120a', emBoxText: '#ffffff', accent: '#e5120a', accent2: '#ffffff', card: '#ffffff', cardText: '#e5120a' },
      { text: '#ffffff', em: '#111111', sub: '#ffe1de', stroke: null, shadow: 'rgba(80,0,0,.4)', emBox: '#111111', emBoxText: '#ffffff', accent: '#ffffff', accent2: '#111111', card: '#ffffff', cardText: '#c80d05' },
      { text: '#141414', em: '#e5120a', sub: '#444444', stroke: null, shadow: 'rgba(0,0,0,.12)', emBox: '#e5120a', emBoxText: '#ffffff', accent: '#e5120a', accent2: '#141414', card: '#141414', cardText: '#ffffff' },
    ],
    bg(ctx, t, v) {
      if (v === 0) { FX.gradient(ctx, ['#1a1414', '#070707'], 90); FX.radial(ctx, W * .62, H * .45, H * .9, 'rgba(160,20,10,.35)', 'rgba(0,0,0,0)'); FX.smoke(ctx, t, '#5a2a24', 10); }
      else if (v === 1) { FX.gradient(ctx, ['#e8180c', '#c50c04', '#9a0802'], 110); FX.slashes(ctx, t, ['rgba(255,255,255,.07)', 'rgba(0,0,0,.08)']); }
      else { FX.paper(ctx, t, '#ecebe7'); }
    },
    fx(ctx, t, v) { if (v === 0) FX.embers(ctx, t, 18, '#ff5a2a'); },
  },
  halfsale: {
    name: '반값 오렌지 (타이포)', font: 'gasoek',
    pal: [
      { text: '#ffffff', em: '#ffe14a', sub: '#fff1e0', stroke: null, shadow: 'rgba(90,30,0,.55)', shadowOff: 3, emBox: '#1a1a1a', emBoxText: '#ffffff', accent: '#1a1a1a', accent2: '#ffe14a', card: '#ffffff', cardText: '#f05a0a' },
      { text: '#ffffff', em: '#ffe600', sub: '#ffd9cf', stroke: null, shadow: 'rgba(0,0,0,.45)', emBox: '#ffe600', emBoxText: '#7a0000', accent: '#ff1e10', accent2: '#ffe600', card: '#ffe600', cardText: '#7a0000' },
      { text: '#222222', em: '#f05a0a', sub: '#555555', stroke: null, shadow: 'rgba(240,90,10,.12)', emBox: '#f05a0a', emBoxText: '#ffffff', accent: '#f05a0a', accent2: '#ff2f7a', card: '#f05a0a', cardText: '#ffffff' },
    ],
    bg(ctx, t, v) {
      if (v === 0) { FX.gradient(ctx, ['#ff7a1a', '#f05a0a', '#d94a04'], 100); FX.arrows(ctx, t, '#ffffff', 1, .1); }
      else if (v === 1) { FX.gradient(ctx, ['#5c0000', '#3a0000'], 90); FX.radial(ctx, W * .62, H * .9, H, 'rgba(255,40,20,.35)', 'rgba(0,0,0,0)'); }
      else { FX.gradient(ctx, ['#fdeccc', '#fbe2b8'], 90); FX.confetti(ctx, t, 40, ['#f05a0a', '#ff2f7a', '#ffb000']); }
    },
    fx() { },
  },
  salered: {
    name: '세일 레드/네이비 (타이포)', font: 'notoblack',
    pal: [
      { text: '#ffffff', em: '#ff3348', sub: '#dfe4ff', stroke: null, shadow: 'rgba(0,0,40,.45)', emBox: '#e8102e', emBoxText: '#ffffff', accent: '#e8102e', accent2: '#ffffff', card: '#e8102e', cardText: '#ffffff' },
      { text: '#ffffff', em: '#ffe0e4', sub: '#ffd0d6', stroke: null, shadow: 'rgba(60,0,10,.4)', emBox: '#ffffff', emBoxText: '#c8001e', accent: '#ffffff', accent2: '#1f2a5a', card: '#ffffff', cardText: '#c8001e' },
      { text: '#1b1b1b', em: '#c8001e', sub: '#555555', stroke: null, shadow: 'rgba(0,0,0,.08)', emBox: '#c8001e', emBoxText: '#ffffff', accent: '#c8001e', accent2: '#1f2a5a', card: '#c8001e', cardText: '#ffffff' },
    ],
    bg(ctx, t, v) {
      if (v === 0) { FX.gradient(ctx, ['#26326a', '#1a2350'], 100); FX.stars(ctx, t, 50, '#ffffff'); }
      else if (v === 1) { FX.gradient(ctx, ['#d6001f', '#b0001a'], 120); FX.lightSweep(ctx, t, '#ffffff', 3); }
      else { FX.gradient(ctx, ['#f7f7f7', '#e9e9ec'], 90); FX.bokeh(ctx, t, 10, '#c8001e', .08); }
    },
    fx() { },
  },
});

// ---------- 단서 자막 (`단서: 제목 | 내용`) : L바 가이드의 단서자막 자리에 작게 (장면마다 따로 쓸 수 있음) ----------
function drawDisclaimer(ctx, proj, sc) {
  const d = danFor(proj, sc); if (!d) return;
  let [title, body] = d.includes('|') ? d.split('|').map(s => s.trim()) : ['', d];
  if (!body) { body = title; title = ''; }
  if (STAGE === 'tong') { drawTongDisclaimer(ctx, proj, title, body); return; }
  const x = proj.lbar === 'none' ? 110 : 463, yB = proj.lbar === 'none' ? H - 70 : 943;
  ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  if (title) { ctx.font = `900 30px ${SUBFONT.family}`; ctx.fillStyle = '#ff5a1f'; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.strokeText(title, x, yB - 36); ctx.fillText(title, x, yB - 36); }
  ctx.font = `500 22px ${SUBFONT.family}`; const w = Math.min(ctx.measureText(body).width + 18, 830);
  ctx.fillStyle = 'rgba(0,0,0,.62)'; ctx.fillRect(x - 6, yB - 15, w, 30); ctx.fillStyle = '#ffffff';
  ctx.save(); ctx.beginPath(); ctx.rect(x - 6, yB - 16, w, 32); ctx.clip(); ctx.fillText(body, x + 3, yB + 1); ctx.restore();
  ctx.restore();
}
// 통강조: 아래 띠(꼬리) 바로 위에 작게 (영상 크기 376×790 기준 약 13px)
function drawTongDisclaimer(ctx, proj, title, body) {
  const yB = H - (proj.foot ? TONG.foot : 0) - 52, x = 60, maxW = W - 120;
  ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  if (title) { ctx.font = `900 50px ${SUBFONT.family}`; ctx.fillStyle = '#ff5a1f'; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 8; ctx.lineJoin = 'round'; ctx.strokeText(title, x, yB - 62, maxW); ctx.fillText(title, x, yB - 62, maxW); }
  ctx.font = `500 38px ${SUBFONT.family}`; const w = Math.min(ctx.measureText(body).width + 28, maxW + 12);
  ctx.fillStyle = 'rgba(0,0,0,.62)'; ctx.fillRect(x - 8, yB - 26, w, 52); ctx.fillStyle = '#ffffff';
  ctx.save(); ctx.beginPath(); ctx.rect(x - 8, yB - 27, w, 54); ctx.clip(); ctx.fillText(body, x + 6, yB + 1); ctx.restore();
  ctx.restore();
}
