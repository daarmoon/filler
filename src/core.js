// ===== core.js : 공통 유틸, 이징, 난수, 텍스트 렌더링 =====
// 그리는 판 크기: 하드필러·오프닝필러는 1920×1080, 통강조는 376×790을 3배로 그려서(1128×2370) 줄여 내보냄
let W = 1920, H = 1080;
const STAGES = { wide: { w: 1920, h: 1080, out: [1920, 1080] }, tong: { w: 1128, h: 2370, out: [376, 790] } };
let STAGE = 'wide';
function stageOf(p) { return p && (p.fmt === '통강조' || p.lbar === 'tong') ? 'tong' : 'wide'; }
function setStage(name) { if (name === STAGE) return; STAGE = name; W = STAGES[name].w; H = STAGES[name].h; }

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, start, dur) => dur <= 0 ? (t >= start ? 1 : 0) : clamp((t - start) / dur);

// 모션 느낌 (부드럽게/보통/강하게) — renderFrame에서 프로젝트 설정으로 바뀜
const FEELS = {
  부드럽게: { back: .9, dur: 1.55, stag: 1.3, drift: .03, win: .45, stamp: 1.6, rise: .22, exit: true, auto: ['디졸브', '줌', '밀기', '디졸브', '와이프'] },
  보통: { back: 1.4, dur: 1.2, stag: 1.12, drift: .018, win: .34, stamp: 2.0, rise: .12, exit: true, auto: ['와이프', '디졸브', '줌', '원형', '밀기'] },
  강하게: { back: 1.9, dur: 1, stag: 1, drift: 0, win: .28, stamp: 2.6, rise: 0, exit: false, auto: ['와이프', '플래시', '줌', '원형', '타이포'] },
};
const FEEL = Object.assign({ name: '보통' }, FEELS.보통);
function setFeel(name) { if (!FEELS[name]) name = '보통'; if (FEEL.name !== name) Object.assign(FEEL, FEELS[name], { name }); }

const Ease = {
  linear: t => t,
  inCubic: t => t * t * t,
  outCubic: t => 1 - Math.pow(1 - t, 3),
  outQuart: t => 1 - Math.pow(1 - t, 4),
  inOutCubic: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outBack: t => { const c1 = FEEL.back, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outBounce: t => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; },
  outElastic: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI) / 3) + 1,
};

// 결정적 난수 (스크러빙해도 같은 결과)
// 정수 곱셈 오버플로를 Math.imul로 처리해야 0~1에 고르게 퍼진다 (일반 곱셈은 정밀도가 깨져 거의 0만 나옴)
function hash(n) { n = (n << 13) ^ n; n = (Math.imul(n, (Math.imul(Math.imul(n, n), 15731) + 789221) | 0) + 1376312589) | 0; return (n & 0x7fffffff) / 0x7fffffff; }
function rnd(i, k = 0) { return hash((i * 7919 + k * 104729 + 12345) | 0); }

function hexToRgb(h) {
  h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); const l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360; s = clamp(s); l = clamp(l);
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return '#' + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
}
const hexHsl = hx => rgbToHsl(...hexToRgb(hx));
// 상대 밝기 (글자색을 흰/검정 중 고를 때)
function luma(hx) { const [r, g, b] = hexToRgb(hx).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; }
function rgba(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }
function mix(h1, h2, t) {
  const a = hexToRgb(h1), b = hexToRgb(h2);
  return '#' + a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, '0')).join('');
}

// ---- 리치 텍스트: *강조* 구간 파싱 ----
function parseRich(str) {
  const segs = []; let em = false, buf = '';
  for (const ch of String(str)) {
    if (ch === '*') { if (buf) segs.push({ text: buf, em }); buf = ''; em = !em; }
    else buf += ch;
  }
  if (buf) segs.push({ text: buf, em });
  return segs;
}
const plain = s => String(s).replace(/\*/g, '');

// ---- 레이아웃 경고용 박스 수집 ----
const Collector = { boxes: [], on: false };
function reportBox(x, y, w, h, label) { if (Collector.on) Collector.boxes.push({ x, y, w, h, label }); }

// ---- 텍스트 측정/그리기 ----
// 자간·행간 (전체 설정 '자간:' '행간:' 또는 장면 옵션) — render가 장면마다 바꿔 넣음
// TRACK_ADD: 글자 크기 대비 추가 간격(0.05 = 5%), LEAD: 줄 간격 배율(1 = 기본)
let TRACK_ADD = 0, LEAD = 1;
function setFont(ctx, font, size) { ctx.font = `${font.weight || 400} ${size * (font.scale || 1)}px ${font.family}`; }

// 줄 단위 레이아웃: 각 글자 위치를 계산
function layoutLine(ctx, segs, font, size, tracking = 0) {
  setFont(ctx, font, size);
  const chars = []; let x = 0;
  for (const s of segs) for (const ch of s.text) {
    const w = ctx.measureText(ch).width;
    chars.push({ ch, em: s.em, x, w }); x += w + tracking * size;
  }
  const width = Math.max(0, x - tracking * size);
  return { chars, width, size };
}

// 최대 너비에 맞게 크기 자동 축소
function fitSize(ctx, text, font, size, maxW, tracking = 0) {
  const l = layoutLine(ctx, parseRich(text), font, size, tracking);
  return l.width > maxW ? Math.floor(size * maxW / l.width) : size;
}

/*
 drawText: 글자 단위 모션 텍스트
 opt: { x, y(baseline 중앙 기준 y), size, font, color, em, stroke, strokeW, shadow, align:'center'|'left'|'right',
        motion:'pop'|'type'|'slide'|'stamp'|'blur'|'none', t(로컬시간), delay, stagger, dur, exit(0..1), maxW, tracking,
        emBox(강조 배경박스 색), emBoxText, alpha, label }
*/
function drawText(ctx, text, o) {
  const font = o.font;
  let size = o.size;
  const tracking = (o.tracking || 0) + TRACK_ADD;
  if (o.maxW) size = Math.min(size, fitSize(ctx, text, font, size, o.maxW, tracking));
  const L = layoutLine(ctx, parseRich(text), font, size, tracking);
  let x0 = o.x;
  if (o.align === 'center' || !o.align) x0 = o.x - L.width / 2;
  else if (o.align === 'right') x0 = o.x - L.width;
  const yC = o.y; // 글자 세로 중앙
  const baseY = yC + size * 0.36;
  const n = L.chars.length;
  const motion = o.motion || 'pop';
  const t = o.t ?? 99, delay = o.delay || 0;
  const stagger = o.stagger ?? (motion === 'type' ? 0.045 : motion === 'stamp' ? 0.0 : 0.035 * FEEL.stag);
  const dur = o.dur ?? (motion === 'type' ? 0.01 : 0.38 * FEEL.dur);
  const exit = o.exit || 0;
  const alphaAll = (o.alpha ?? 1) * (1 - exit);
  reportBox(x0, yC - size * 0.6, L.width, size * 1.2, o.label || plain(text));

  // 강조 배경 박스 (타이핑처럼 늘어나며 채워짐)
  if (o.emBox) {
    let i = 0;
    while (i < n) {
      if (!L.chars[i].em) { i++; continue; }
      let j = i; while (j < n && L.chars[j].em) j++;
      const bx = x0 + L.chars[i].x - size * 0.12, bw = (L.chars[j - 1].x + L.chars[j - 1].w) - L.chars[i].x + size * 0.24;
      const p = Ease.outCubic(prog(t, delay + i * stagger, 0.35 + (j - i) * stagger));
      ctx.save(); ctx.globalAlpha = alphaAll;
      ctx.fillStyle = o.emBox;
      ctx.fillRect(bx, yC - size * 0.58, bw * p, size * 1.12);
      ctx.restore();
      i = j;
    }
  }

  for (let i = 0; i < n; i++) {
    const c = L.chars[i];
    if (c.ch === ' ') continue;
    const p = prog(t, delay + i * stagger, dur);
    if (p <= 0) continue;
    let sc = 1, dy = 0, dx = 0, a = 1, blur = 0, rot = 0, sy = 1, glitch = 0, glow = o.glow || null;
    switch (motion) {
      case 'pop': sc = Ease.outBack(p); a = clamp(p * (FEEL.rise ? 2 : 3)); dy = (1 - Ease.outCubic(p)) * size * FEEL.rise; break;
      case 'slide': { const e = Ease.outCubic(p); dy = (1 - e) * size * 0.6; a = e; break; }
      case 'stamp': { const e = Ease.outCubic(p); sc = lerp(FEEL.stamp, 1, e); a = clamp(p * 2.5); break; }
      case 'blur': { const e = Ease.outCubic(p); blur = (1 - e) * 24; a = e; sc = lerp(1.15, 1, e); break; }
      case 'drop': { const e = Ease.outBack(p); dy = -(1 - e) * size * (FEEL.rise ? .8 : 1.2); a = clamp(p * 3); rot = (1 - e) * (rnd(i, 3) - .5) * .6; break; }
      case 'type': a = 1; break;
      case 'wave': { const e = Ease.outCubic(p); dy = (1 - e) * size * .5 + Math.sin(t * 4.2 - i * .55) * size * .045 * e; a = e; break; }
      case 'bounce': { dy = -(1 - Ease.outBounce(p)) * size * 1.1; a = clamp(p * 4); break; }
      case 'flip': { sy = Ease.outBack(p); a = clamp(p * 3); dy = (1 - p) * size * .1; break; }
      case 'zoom': { const e = Ease.outCubic(p); sc = lerp(2.8, 1, e); blur = (1 - e) * 18; a = e; break; }
      case 'spin': { const e = Ease.outBack(p); rot = (1 - e) * -1.4; sc = lerp(.3, 1, Ease.outCubic(p)); a = clamp(p * 3); break; }
      case 'glitch': {
        a = p > 0 ? 1 : 0; const burst = ((t * .45 + rnd(i, 9) * .02) % 1) < .05 ? .6 : 0; glitch = Math.max(1 - p, burst);
        if (glitch > 0) { const k = Math.floor(t * 30); dx = (rnd(i, k) - .5) * size * .35 * glitch; dy = (rnd(i, k + 7) - .5) * size * .1 * glitch; a = p < 1 && rnd(i, k + 3) < .25 ? .3 : 1; }
        break;
      }
      case 'neon': {
        const k = Math.floor(t * 18); a = p < 1 ? (rnd(i, k) > .45 ? 1 : .15) : (rnd(i, Math.floor(t * 6)) > .985 ? .55 : 1);
        glow = glow || (c.em ? (o.em || o.color) : o.color); break;
      }
      default: break;
    }
    if (exit > 0) { sc *= 1 + exit * 0.15; }
    const cx = x0 + c.x + c.w / 2;
    ctx.save();
    ctx.globalAlpha = a * alphaAll;
    if (blur > 0.5) ctx.filter = `blur(${blur.toFixed(1)}px)`;
    ctx.translate(cx + dx, yC + dy); ctx.rotate(rot); if (o.skew) ctx.transform(1, 0, o.skew, 1, 0, 0); ctx.scale(sc, sc * sy); ctx.translate(-cx, -yC);
    setFont(ctx, font, size);
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    const fill = c.em ? (o.emBox ? (o.emBoxText || '#fff') : (o.em || o.color)) : o.color;
    if (o.shadow) {
      ctx.save(); ctx.fillStyle = o.shadow; const so = o.shadowOff || 1;
      if (so > 1 && o.stroke) { ctx.lineJoin = 'round'; ctx.strokeStyle = o.shadow; ctx.lineWidth = o.strokeW || size * .12; ctx.strokeText(c.ch, cx + size * .035 * so, baseY + size * .05 * so); }
      ctx.fillText(c.ch, cx + size * 0.035 * so, baseY + size * 0.05 * so); ctx.restore();
    }
    if (o.stroke) {
      ctx.lineJoin = 'round'; ctx.miterLimit = 2;
      ctx.strokeStyle = o.stroke; ctx.lineWidth = o.strokeW || size * 0.12;
      ctx.strokeText(c.ch, cx, baseY);
    }
    if (glitch > 0) { // RGB 어긋남
      ctx.save(); ctx.globalAlpha *= .85; ctx.fillStyle = '#00f0ff'; ctx.fillText(c.ch, cx - size * .05 * glitch - 3, baseY); ctx.fillStyle = '#ff2a6d'; ctx.fillText(c.ch, cx + size * .05 * glitch + 3, baseY); ctx.restore();
    }
    if (o.extrude) { // 입체(길게 늘어진 그림자 글자)
      ctx.save(); ctx.fillStyle = o.extrudeColor || 'rgba(0,0,0,.5)'; const ne = Math.max(4, Math.round(size * o.extrude)), st = size / 160;
      for (let k = ne; k > 0; k--) ctx.fillText(c.ch, cx + k * st * .8, baseY + k * st); ctx.restore();
    }
    if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = size * .28; }
    if (o.outline) { // 외곽선만 (속 빈 글자)
      ctx.strokeStyle = fill; ctx.lineWidth = o.outline; ctx.strokeText(c.ch, cx, baseY);
    } else {
      if (o.gradient && !c.em) {
        const g = ctx.createLinearGradient(0, yC - size * .5, 0, yC + size * .5);
        g.addColorStop(0, o.gradient[0]); g.addColorStop(1, o.gradient[1]); ctx.fillStyle = g;
      } else ctx.fillStyle = fill;
      ctx.fillText(c.ch, cx, baseY);
    }
    ctx.restore();
  }
  // 타이핑 커서
  if (motion === 'type') {
    const shown = clamp(Math.floor((t - delay) / stagger) + 1, 0, n);
    if (shown < n && t > delay && Math.floor(t * 4) % 2 === 0) {
      const cx = shown > 0 ? x0 + L.chars[shown - 1].x + L.chars[shown - 1].w + 6 : x0;
      ctx.save(); ctx.globalAlpha = alphaAll; ctx.fillStyle = o.em || o.color; ctx.fillRect(cx, yC - size * .5, size * .08, size); ctx.restore();
    }
  }
  return { x: x0, y: yC - size * 0.6, w: L.width, h: size * 1.2, size };
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// 이미지를 박스 안에 비율 유지해서 그림
// 이미지 크기 배율: 이미지마다(소스 탭) × 장면마다({크기: 130}) — render가 장면마다 IMG_K를 설정
let IMG_K = 1;
function drawImageFit(ctx, img, cx, cy, maxW, maxH, opt = {}) {
  if (!img) return null;
  const kk = (img.hfScale || 1) * IMG_K; maxW *= kk; maxH *= kk;
  const s = Math.min(maxW / img.width, maxH / img.height);
  const w = img.width * s, h = img.height * s;
  ctx.save();
  if (opt.alpha != null) ctx.globalAlpha *= opt.alpha;
  ctx.translate(cx, cy); if (opt.scale) ctx.scale(opt.scale, opt.scale); if (opt.rot) ctx.rotate(opt.rot);
  if (opt.shadow) { ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14; }
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
  reportBox(cx - w / 2, cy - h / 2, w, h, '이미지');
  return { w, h };
}
