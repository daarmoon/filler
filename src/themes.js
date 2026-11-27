// ===== themes.js : 테마(배경, 파티클, 색, 폰트) =====
const FONTS = {
  blackhan: { family: "'Black Han Sans', 'Noto Sans KR', sans-serif", weight: 400, name: '블랙한산스 (두꺼운 고딕)' },
  notoblack: { family: "'Noto Sans KR', sans-serif", weight: 900, name: '본고딕 Black' },
  notobold: { family: "'Noto Sans KR', sans-serif", weight: 700, name: '본고딕B (Bold)' },
  dohyeon: { family: "'Do Hyeon', 'Noto Sans KR', sans-serif", weight: 400, name: '도현 (각진 고딕)' },
  jua: { family: "'Jua', 'Noto Sans KR', sans-serif", weight: 400, name: '주아 (둥근 고딕)' },
  myeongjo: { family: "'Nanum Myeongjo', serif", weight: 800, name: '나눔명조 ExtraBold' },
  gothica1: { family: "'Gothic A1', 'Noto Sans KR', sans-serif", weight: 900, name: '고딕 A1 Black' },
  gasoek: { family: "'Gasoek One', 'Black Han Sans', sans-serif", weight: 400, name: '가석체 (초굵은 임팩트)' },
  bagel: { family: "'Bagel Fat One', 'Jua', sans-serif", weight: 400, name: '베이글 (통통한 둥근)' },
  notoserif: { family: "'Noto Serif KR', serif", weight: 900, name: '본명조 Black' },
  hahmlet: { family: "'Hahmlet', serif", weight: 900, name: '함렛 (모던 명조)' },
  songmyung: { family: "'Song Myung', serif", weight: 400, name: '송명체 (붓 명조)' },
  sunflower: { family: "'Sunflower', 'Noto Sans KR', sans-serif", weight: 700, name: '해바라기 (깔끔 고딕)' },
  gugi: { family: "'Gugi', 'Do Hyeon', sans-serif", weight: 400, name: '구기체 (레트로)' },
  orbit: { family: "'Orbit', 'Noto Sans KR', sans-serif", weight: 400, name: '오르빗 (테크)' },
  yeonsung: { family: "'Yeon Sung', 'Jua', sans-serif", weight: 400, name: '연성체 (레트로 손글씨)', scale: 1.08 },
  dokdo: { family: "'East Sea Dokdo', 'Jua', sans-serif", weight: 400, name: '독도체 (거친 붓)', scale: 1.25 },
  brush: { family: "'Nanum Brush Script', cursive", weight: 400, name: '나눔붓 (붓글씨)', scale: 1.25 },
  pen: { family: "'Nanum Pen Script', cursive", weight: 400, name: '나눔펜 (손글씨)', scale: 1.3 },
  dongle: { family: "'Dongle', 'Jua', sans-serif", weight: 700, name: '동글 (귀여운)', scale: 1.55 },
  bwpicture: { family: "'Black And White Picture', 'Jua', sans-serif", weight: 400, name: '흑백사진 (빈티지)', scale: 1.1 },
  moirai: { family: "'Moirai One', 'Black Han Sans', sans-serif", weight: 400, name: '모이라이 (장식)' },
};
const SUBFONT = { family: "'Noto Sans KR', sans-serif", weight: 500 };

// ---- 스프라이트 캐시 (빛 번짐 원) ----
const _spr = {};
function glowSprite(color, size = 128, hard = 0) {
  const key = color + size + hard;
  if (_spr[key]) return _spr[key];
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, rgba(color, 1)); gr.addColorStop(hard || 0.25, rgba(color, 0.55)); gr.addColorStop(1, rgba(color, 0));
  g.fillStyle = gr; g.fillRect(0, 0, size, size); _spr[key] = c; return c;
}

const FX = {
  gradient(ctx, stops, angle = 90) {
    const a = angle * Math.PI / 180, dx = Math.cos(a) * W / 2, dy = Math.sin(a) * H / 2;
    const g = ctx.createLinearGradient(W / 2 - dx, H / 2 - dy, W / 2 + dx, H / 2 + dy);
    stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  },
  radial(ctx, x, y, r, c1, c2) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  },
  bokeh(ctx, t, n, color, alpha = .35) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const r = 40 + rnd(i, 1) * 160, x = (rnd(i, 2) * W + Math.sin(t * .3 + i) * 40), y = (rnd(i, 3) * H + Math.cos(t * .25 + i * 2) * 30);
      ctx.globalAlpha = alpha * (0.4 + 0.6 * Math.abs(Math.sin(t * .5 + i)));
      ctx.drawImage(glowSprite(color, 128, .6), x - r, y - r, r * 2, r * 2);
    }
    ctx.restore();
  },
  petals(ctx, t, n, colors) {
    ctx.save();
    for (let i = 0; i < n; i++) {
      const sp = 70 + rnd(i, 1) * 120, x = (rnd(i, 2) * (W + 300) + t * (40 + rnd(i, 5) * 60) + Math.sin(t * 1.3 + i) * 50) % (W + 300) - 150;
      const y = (rnd(i, 3) * (H + 200) + t * sp) % (H + 200) - 100;
      const s = 10 + rnd(i, 4) * 22, rot = t * (1 + rnd(i, 6) * 2) + i;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, 0.55 + 0.45 * Math.sin(t * 3 + i));
      ctx.fillStyle = colors[i % colors.length]; ctx.globalAlpha = .85;
      ctx.beginPath(); ctx.ellipse(0, 0, s, s * .62, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    ctx.restore();
  },
  confetti(ctx, t, n, colors, opt = {}) {
    ctx.save();
    const fallT = opt.burst != null ? Math.max(0, t - opt.burst) : t;
    if (opt.burst != null && t < opt.burst) { ctx.restore(); return; }
    for (let i = 0; i < n; i++) {
      let x, y;
      if (opt.burst != null) {
        const ang = rnd(i, 1) * Math.PI * 2, v = 400 + rnd(i, 2) * 1100;
        const k = 1 - Math.exp(-fallT * 2.2);
        x = (opt.x ?? W / 2) + Math.cos(ang) * v * k * .9; y = (opt.y ?? H / 2) + Math.sin(ang) * v * k * .6 + fallT * fallT * 160;
        if (fallT > 3.5) continue;
      } else {
        x = (rnd(i, 2) * W + Math.sin(t * 2 + i) * 30); y = (rnd(i, 3) * (H + 100) + t * (90 + rnd(i, 4) * 140)) % (H + 100) - 50;
      }
      const s = 8 + rnd(i, 5) * 12;
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 4 * (rnd(i, 6) - .5) + i); ctx.scale(Math.cos(t * 6 + i), 1);
      ctx.fillStyle = colors[i % colors.length]; ctx.globalAlpha = opt.alpha ?? .9;
      ctx.fillRect(-s / 2, -s / 3, s, s * .66); ctx.restore();
    }
    ctx.restore();
  },
  stars(ctx, t, n, color = '#ffffff') {
    ctx.save();
    for (let i = 0; i < n; i++) {
      const x = rnd(i, 1) * W, y = rnd(i, 2) * H * .85, s = .6 + rnd(i, 3) * 2.2;
      ctx.globalAlpha = .25 + .75 * Math.abs(Math.sin(t * (0.6 + rnd(i, 4) * 2) + i));
      ctx.fillStyle = color; ctx.fillRect(x, y, s, s);
    }
    ctx.restore();
  },
  sparkles(ctx, t, n, color = '#ffffff', area) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const life = 1.6, ph = (t / life + rnd(i, 7)) % 1, cyc = Math.floor(t / life + rnd(i, 7));
      const x = (area ? area.x + rnd(i * 31 + cyc, 1) * area.w : rnd(i * 31 + cyc, 1) * W);
      const y = (area ? area.y + rnd(i * 31 + cyc, 2) * area.h : rnd(i * 31 + cyc, 2) * H);
      const s = (10 + rnd(i, 3) * 26) * Math.sin(ph * Math.PI);
      ctx.globalAlpha = Math.sin(ph * Math.PI);
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s * .28, y); ctx.quadraticCurveTo(x, y, x, y + s);
      ctx.quadraticCurveTo(x, y, x - s * .28, y); ctx.quadraticCurveTo(x, y, x, y - s); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - s * .7, y); ctx.quadraticCurveTo(x, y, x, y + s * .2); ctx.quadraticCurveTo(x, y, x + s * .7, y);
      ctx.quadraticCurveTo(x, y, x, y - s * .2); ctx.quadraticCurveTo(x, y, x - s * .7, y); ctx.fill();
    }
    ctx.restore();
  },
  flames(ctx, t, intensity = 1, y0 = H) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const cols = ['#ff3a00', '#ff7a00', '#ffb000'];
    const n = Math.round(140 * intensity);
    for (let i = 0; i < n; i++) {
      const life = .9 + rnd(i, 1) * .9, ph = (t / life + rnd(i, 2)) % 1;
      const bx = rnd(i, 3) * (W + 200) - 100;
      const x = bx + Math.sin(t * 3 + i) * 30 * ph;
      const y = y0 + 40 - ph * (260 + rnd(i, 4) * 380) * intensity;
      const r = (90 + rnd(i, 5) * 120) * (1 - ph * .7);
      ctx.globalAlpha = (1 - ph) * .5;
      ctx.drawImage(glowSprite(cols[i % 3], 128, .2), x - r, y - r, r * 2, r * 2);
    }
    ctx.restore();
  },
  embers(ctx, t, n, color = '#ffb347') {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const life = 2 + rnd(i, 1) * 3, ph = (t / life + rnd(i, 2)) % 1;
      const x = rnd(i, 3) * W + Math.sin(t * 2 + i) * 40, y = H - ph * H * (0.6 + rnd(i, 4) * .6);
      ctx.globalAlpha = Math.sin(ph * Math.PI) * .9; ctx.fillStyle = color;
      const s = 2 + rnd(i, 5) * 4; ctx.fillRect(x, y, s, s);
    }
    ctx.restore();
  },
  fireworks(ctx, t, colors) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const period = 1.1;
    for (let k = 0; k < 6; k++) {
      const cyc = Math.floor((t + k * .37) / period), ph = ((t + k * .37) / period) % 1;
      const cx = 200 + rnd(cyc * 7 + k, 1) * (W - 400), cy = 120 + rnd(cyc * 7 + k, 2) * 520;
      const col = colors[(cyc + k) % colors.length], R = 160 + rnd(cyc + k, 3) * 200;
      const e = Ease.outCubic(ph);
      for (let j = 0; j < 36; j++) {
        const a = j / 36 * Math.PI * 2, r = R * e;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r + ph * ph * 60;
        ctx.globalAlpha = (1 - ph) * .9;
        ctx.drawImage(glowSprite(col, 32, .3), x - 9, y - 9, 18, 18);
        ctx.strokeStyle = rgba(col, (1 - ph) * .5); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r * .6, cy + Math.sin(a) * r * .6); ctx.lineTo(x, y); ctx.stroke();
      }
    }
    ctx.restore();
  },
  rays(ctx, t, cx, cy, color, n = 16, alpha = .12) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * .15); ctx.fillStyle = rgba(color, alpha);
    for (let i = 0; i < n; i++) {
      ctx.rotate(Math.PI * 2 / n); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1600, -90); ctx.lineTo(1600, 90); ctx.fill();
    }
    ctx.restore();
  },
  smoke(ctx, t, color = '#9a9a9a', n = 18) {
    ctx.save();
    for (let i = 0; i < n; i++) {
      const x = (rnd(i, 1) * (W + 600) + t * (20 + rnd(i, 2) * 40)) % (W + 600) - 300, y = rnd(i, 3) * H + Math.sin(t * .4 + i) * 40;
      const r = 220 + rnd(i, 4) * 300; ctx.globalAlpha = .16;
      ctx.drawImage(glowSprite(color, 128, .1), x - r, y - r, r * 2, r * 2);
    }
    ctx.restore();
  },
  snow(ctx, t, n, color = '#9fc4ff') {
    ctx.save();
    for (let i = 0; i < n; i++) {
      const x = (rnd(i, 1) * W + Math.sin(t + i) * 20), y = (rnd(i, 2) * (H + 50) + t * (20 + rnd(i, 3) * 40)) % (H + 50) - 25;
      const s = 3 + rnd(i, 4) * 9; ctx.globalAlpha = .25 + rnd(i, 5) * .4; ctx.strokeStyle = color; ctx.lineWidth = 1.5;
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * .5 + i);
      for (let k = 0; k < 3; k++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(s, 0); ctx.stroke(); }
      ctx.restore();
    }
    ctx.restore();
  },
  arrows(ctx, t, color, dir = -1, alpha = .25) {
    ctx.save(); ctx.fillStyle = rgba(color, alpha);
    for (let i = 0; i < 7; i++) {
      const x = 100 + rnd(i, 1) * (W - 200), sp = 120 + rnd(i, 2) * 180, s = 60 + rnd(i, 3) * 110;
      let y = (rnd(i, 4) * (H + 600) + t * sp) % (H + 600) - 300; if (dir < 0) y = H - y;
      ctx.save(); ctx.translate(x, y); if (dir > 0) ctx.rotate(Math.PI);
      ctx.beginPath(); ctx.moveTo(0, -s * 1.4); ctx.lineTo(s, -s * .3); ctx.lineTo(s * .38, -s * .3); ctx.lineTo(s * .38, s * 1.6);
      ctx.lineTo(-s * .38, s * 1.6); ctx.lineTo(-s * .38, -s * .3); ctx.lineTo(-s, -s * .3); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    ctx.restore();
  },
  stripes(ctx, t, colors, alpha = 1) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(W / 2, H / 2); ctx.rotate(-0.5);
    const bw = 260, off = (t * 160) % (bw * colors.length);
    for (let i = -14; i < 14; i++) { ctx.fillStyle = colors[((i % colors.length) + colors.length) % colors.length]; ctx.fillRect(i * bw + off - 2000 * 0, -1600, bw, 3200); }
    ctx.restore();
  },
  curtain(ctx, color, dark) {
    for (let i = 0; i < 24; i++) {
      const x = i * W / 24, g = ctx.createLinearGradient(x, 0, x + W / 24, 0);
      g.addColorStop(0, dark); g.addColorStop(.5, color); g.addColorStop(1, dark);
      ctx.fillStyle = g; ctx.fillRect(x, 0, W / 24 + 1, H);
    }
  },
  vignette(ctx, a = .5) {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, W * .75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  },
  // 크고 부드러운 색 덩어리가 천천히 떠다님
  blobs(ctx, t, colors, alpha = .5) {
    ctx.save();
    colors.forEach((c, k) => {
      const x = W * (.2 + .6 * rnd(k, 61)) + Math.sin(t * .35 + k * 2.1) * 160, y = H * (.2 + .6 * rnd(k, 62)) + Math.cos(t * .28 + k * 1.3) * 110;
      const r = 420 + 260 * rnd(k, 63);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(c, alpha)); g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    });
    ctx.restore();
  },
  // 위로 천천히 올라가는 동그란 빛 방울
  bubbles(ctx, t, n, color = '#ffffff', alpha = .5) {
    ctx.save();
    for (let i = 0; i < n; i++) {
      const sp = 30 + 50 * rnd(i, 71), r = 6 + 22 * rnd(i, 72);
      const y = H + 60 - ((t * sp + rnd(i, 73) * (H + 120)) % (H + 120)), x = W * rnd(i, 74) + Math.sin(t * .8 + i) * 30;
      ctx.globalAlpha = alpha * (.4 + .6 * rnd(i, 75)); ctx.strokeStyle = color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  },
  lightSweep(ctx, t, color = '#ffffff', period = 3) {
    const ph = (t % period) / period; const x = lerp(-600, W + 600, ph);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, H / 2); ctx.rotate(.35);
    const g = ctx.createLinearGradient(-200, 0, 200, 0); g.addColorStop(0, rgba(color, 0)); g.addColorStop(.5, rgba(color, .18)); g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g; ctx.fillRect(-200, -1200, 400, 2400); ctx.restore();
  },
};

/* 테마 정의
   pal: 배경 변형(0,1,2)별 색 { text, em, sub, stroke, shadow, emBox, emBoxText, accent, card, cardText } */
const THEMES = {
  ns: {
    name: 'NS 레드 (브랜드)', font: 'notoblack',
    pal: [
      { text: '#111111', em: '#F40013', sub: '#333333', stroke: null, shadow: 'rgba(244,0,19,.10)', emBox: '#F40013', emBoxText: '#ffffff', accent: '#F40013', accent2: '#111111', card: '#ffffff', cardText: '#F40013' },
      { text: '#ffffff', em: '#ffe24a', sub: '#ffe3e5', stroke: null, shadow: 'rgba(90,0,8,.35)', emBox: '#ffffff', emBoxText: '#F40013', accent: '#ffffff', accent2: '#ffe24a', card: '#ffffff', cardText: '#F40013' },
      { text: '#ffffff', em: '#ff3346', sub: '#d8d8d8', stroke: null, shadow: 'rgba(0,0,0,.6)', emBox: '#F40013', emBoxText: '#ffffff', accent: '#F40013', accent2: '#ffffff', card: '#ffffff', cardText: '#111111' },
    ],
    bg(ctx, t, v) {
      if (v === 0) { FX.gradient(ctx, ['#ffffff', '#fff3f4', '#ffe6e8'], 70); FX.blobs(ctx, t, ['#ff8a95', '#ffd0d4', '#ffb3ba'], .45); FX.bubbles(ctx, t, 16, '#F40013', .18); }
      else if (v === 1) { FX.gradient(ctx, ['#ff2a3a', '#F40013', '#c8000f'], 100); FX.blobs(ctx, t, ['#ff6a76', '#ff9aa2'], .35); FX.lightSweep(ctx, t, '#ffffff', 4.5); }
      else { FX.gradient(ctx, ['#1a1a1a', '#0a0a0a'], 90); FX.blobs(ctx, t, ['#F40013', '#7a000a'], .35); FX.vignette(ctx, .5); }
    },
    fx(ctx, t, v) { if (v) FX.sparkles(ctx, t, 8, '#ffffff'); },
  },
  spring: {
    name: '봄 파스텔', font: 'blackhan',
    pal: [
      { text: '#5b6fe0', em: '#f0487e', sub: '#5b6fe0', stroke: '#ffffff', shadow: 'rgba(120,60,140,.25)', emBox: '#f0487e', emBoxText: '#fff', accent: '#f0487e', accent2: '#7cc7f5', card: '#ffffff', cardText: '#5b4fc0' },
      { text: '#8a2d5e', em: '#ffffff', sub: '#8a2d5e', stroke: '#c0306a', shadow: 'rgba(120,20,60,.3)', emBox: '#ffffff', emBoxText: '#e03a72', accent: '#ffe066', accent2: '#ffffff', card: '#ffffff', cardText: '#c0306a' },
      { text: '#ffffff', em: '#ffe36e', sub: '#ffffff', stroke: '#6b4bd8', shadow: 'rgba(60,30,120,.35)', emBox: '#ffe36e', emBoxText: '#5b3bc8', accent: '#ffe36e', accent2: '#ff8fc6', card: '#ffffff', cardText: '#6b4bd8' },
    ],
    bg(ctx, t, v) {
      if (v === 0) FX.gradient(ctx, ['#bfe6ff', '#fde3ef', '#ffd2e6'], 75);
      else if (v === 1) FX.gradient(ctx, ['#ff9cc4', '#ffc2da', '#ff8ab9'], 60);
      else FX.gradient(ctx, ['#a98bff', '#c6a7ff', '#7fb6ff'], 45);
      FX.bokeh(ctx, t, 14, '#ffffff', .35);
    },
    fx(ctx, t) { FX.petals(ctx, t, 26, ['#ffb3cf', '#ff8fb8', '#ffd1e1']); },
  },
  fire: {
    name: '물가격파 (불꽃)', font: 'blackhan',
    pal: [
      { text: '#ffffff', em: '#ff2b2b', sub: '#ffffff', stroke: null, shadow: 'rgba(0,0,0,.6)', emBox: '#e00000', emBoxText: '#fff', accent: '#ff2b2b', accent2: '#ffb000', card: '#f2f2f2', cardText: '#c00000' },
      { text: '#ffffff', em: '#fff16a', sub: '#ffe0d6', stroke: null, shadow: 'rgba(90,0,0,.5)', emBox: '#ffffff', emBoxText: '#d40000', accent: '#ffffff', accent2: '#ffd000', card: '#ffffff', cardText: '#c00000' },
      { text: '#222222', em: '#e00000', sub: '#444444', stroke: null, shadow: 'rgba(0,0,0,.12)', emBox: '#e00000', emBoxText: '#fff', accent: '#e00000', accent2: '#222222', card: '#ffffff', cardText: '#e00000' },
    ],
    bg(ctx, t, v) {
      if (v === 0) { ctx.fillStyle = '#080404'; ctx.fillRect(0, 0, W, H); FX.radial(ctx, W * .6, H * .3, 900, 'rgba(170,10,10,.55)', 'rgba(0,0,0,0)'); FX.flames(ctx, t, 1); FX.embers(ctx, t, 50); }
      else if (v === 1) { FX.gradient(ctx, ['#e8262a', '#c3121a'], 90); FX.radial(ctx, W * .6, H * .45, 700, 'rgba(255,90,80,.45)', 'rgba(0,0,0,0)'); FX.arrows(ctx, t, '#ff5a4a', -1, .35); }
      else { FX.gradient(ctx, ['#f6f6f6', '#e4e4e4'], 90); FX.radial(ctx, W * .62, H * .5, 520, 'rgba(255,255,255,1)', 'rgba(255,255,255,0)'); }
    },
    fx(ctx, t, v) { if (v === 0) FX.embers(ctx, t, 30, '#ffd27a'); },
  },
  purple: {
    name: '프리미엄 보라', font: 'blackhan',
    pal: [
      { text: '#ffffff', em: '#ff6bd0', sub: '#e6dcff', stroke: null, shadow: 'rgba(30,0,60,.55)', emBox: '#ff4fc4', emBoxText: '#fff', accent: '#ff6bd0', accent2: '#b28cff', card: '#ffffff', cardText: '#6a2bd0' },
      { text: '#ffffff', em: '#ff7ad9', sub: '#f0e4ff', stroke: null, shadow: 'rgba(30,0,40,.6)', emBox: '#ff4fc4', emBoxText: '#fff', accent: '#ff7ad9', accent2: '#ffffff', card: '#ffffff', cardText: '#7a1d9e' },
      { text: '#5a35c8', em: '#9b4dff', sub: '#6a50b8', stroke: null, shadow: 'rgba(90,50,200,.18)', emBox: '#8a44ff', emBoxText: '#fff', accent: '#9b4dff', accent2: '#d4b8ff', card: '#ffffff', cardText: '#5a35c8' },
    ],
    bg(ctx, t, v) {
      if (v === 0) { FX.gradient(ctx, ['#14062e', '#3a0f6e', '#6d1fa0'], 100); FX.stars(ctx, t, 220); FX.radial(ctx, W * .62, H * .95, 900, 'rgba(190,80,255,.45)', 'rgba(0,0,0,0)'); FX.lightSweep(ctx, t, '#d9b3ff', 4); }
      else if (v === 1) { FX.curtain(ctx, '#7a1fa0', '#2a0640'); FX.radial(ctx, W * .6, H * .45, 700, 'rgba(255,140,220,.35)', 'rgba(0,0,0,0)'); FX.vignette(ctx, .6); }
      else { FX.gradient(ctx, ['#f4efff', '#e3d6ff', '#f7f2ff'], 80); FX.bokeh(ctx, t, 12, '#c9a8ff', .3); }
    },
    fx(ctx, t, v) { FX.sparkles(ctx, t, v === 2 ? 10 : 16, v === 2 ? '#b48cff' : '#ffffff'); },
  },
  clean: {
    name: '클린 화이트/네이비', font: 'blackhan',
    pal: [
      { text: '#1b1446', em: '#d60000', sub: '#3a3a4a', stroke: null, shadow: null, emBox: '#d60000', emBoxText: '#fff', accent: '#d60000', accent2: '#1b1446', card: '#ffffff', cardText: '#1b1446' },
      { text: '#ffffff', em: '#ff3b3b', sub: '#d8d8e8', stroke: null, shadow: null, emBox: '#d60000', emBoxText: '#fff', accent: '#ff3b3b', accent2: '#ffffff', card: '#ffffff', cardText: '#1b1446' },
      { text: '#1b1446', em: '#ffffff', sub: '#1b1446', stroke: null, shadow: null, emBox: '#d60000', emBoxText: '#fff', accent: '#d60000', accent2: '#1b1446', card: '#ffffff', cardText: '#1b1446' },
    ],
    bg(ctx, t, v) {
      if (v === 0) { ctx.fillStyle = '#dcdcdc'; ctx.fillRect(0, 0, W, H); }
      else if (v === 1) { ctx.fillStyle = '#100a33'; ctx.fillRect(0, 0, W, H); }
      else { ctx.fillStyle = '#dcdcdc'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#100a33'; ctx.fillRect(0, 0, W, H * .56); }
    },
    fx(ctx, t, v) { if (v === 0) FX.confetti(ctx, t, 50, ['#ff3b3b', '#ffcf2b', '#3bb4ff', '#3bd16f', '#c43bff'], { alpha: .8 }); },
  },
  blue: {
    name: '블루 초특가', font: 'blackhan',
    pal: [
      { text: '#ffffff', em: '#ffe000', sub: '#cfe0ff', stroke: null, shadow: 'rgba(0,0,60,.5)', emBox: '#ffe000', emBoxText: '#0a1a8a', accent: '#ffe000', accent2: '#3ad8ff', card: '#ffffff', cardText: '#0a1a8a' },
      { text: '#111111', em: '#0a2ad0', sub: '#222222', stroke: '#ffffff', shadow: null, emBox: '#0a2ad0', emBoxText: '#fff', accent: '#ffcc00', accent2: '#0a2ad0', card: '#ffffff', cardText: '#0a2ad0' },
      { text: '#e8e8e8', em: '#7fe0ff', sub: '#bbbbbb', stroke: null, shadow: 'rgba(0,0,0,.6)', emBox: '#ffffff', emBoxText: '#111', accent: '#7fe0ff', accent2: '#ffffff', card: '#ffffff', cardText: '#111111' },
    ],
    bg(ctx, t, v) {
      if (v === 0) { FX.gradient(ctx, ['#031070', '#0a22b8', '#061590'], 90); FX.snow(ctx, t, 60); FX.radial(ctx, W * .62, H * .55, 800, 'rgba(60,120,255,.35)', 'rgba(0,0,0,0)'); }
      else if (v === 1) { ctx.fillStyle = '#e9e9e9'; ctx.fillRect(0, 0, W, H); FX.stripes(ctx, t, ['#ffcc00', '#e9e9e9', '#ffffff', '#e9e9e9'], .9); }
      else { ctx.fillStyle = '#121212'; ctx.fillRect(0, 0, W, H); FX.smoke(ctx, t, '#8a8a8a', 20); FX.vignette(ctx, .7); }
    },
    fx(ctx, t, v) { if (v === 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const y = H * .7 + Math.sin(t) * 20; const g = ctx.createLinearGradient(0, y - 6, 0, y + 6); g.addColorStop(0, 'rgba(120,180,255,0)'); g.addColorStop(.5, 'rgba(180,220,255,.8)'); g.addColorStop(1, 'rgba(120,180,255,0)'); ctx.fillStyle = g; ctx.translate(0, 0); ctx.rotate(-0.06); ctx.fillRect(0, y - 6, W * 1.2, 12); ctx.restore(); } },
  },
  celebrate: {
    name: '축하/결산 (폭죽)', font: 'blackhan',
    pal: [
      { text: '#ffffff', em: '#4ff5c8', sub: '#e6e0ff', stroke: null, shadow: 'rgba(20,0,80,.55)', emBox: '#36e0b4', emBoxText: '#1a0a6a', accent: '#4ff5c8', accent2: '#ffd84f', card: '#ffffff', cardText: '#1a3a9a' },
      { text: '#ffffff', em: '#ffe14f', sub: '#d6e6ff', stroke: null, shadow: 'rgba(0,20,80,.55)', emBox: '#ffffff', emBoxText: '#0a3ab8', accent: '#ffe14f', accent2: '#4ff5c8', card: '#ffffff', cardText: '#0a3ab8' },
      { text: '#ffffff', em: '#20e0c0', sub: '#d0f4ff', stroke: null, shadow: 'rgba(0,40,60,.5)', emBox: '#20e0c0', emBoxText: '#06304a', accent: '#20e0c0', accent2: '#ffffff', card: '#ffffff', cardText: '#06506a' },
    ],
    bg(ctx, t, v) {
      if (v === 0) { FX.gradient(ctx, ['#4a10c8', '#2a0a9a', '#180a70'], 100); FX.fireworks(ctx, t, ['#ffd84f', '#4ff5c8', '#ff6bd0', '#ffffff']); }
      else if (v === 1) { FX.gradient(ctx, ['#0a3ab8', '#0a50d8', '#0a2a90'], 90); FX.rays(ctx, t, W * .6, H * .5, '#ffffff', 18, .06); }
      else { FX.gradient(ctx, ['#0a6a8a', '#0a4a7a', '#06304a'], 90); FX.bokeh(ctx, t, 10, '#40e0d0', .25); }
    },
    fx(ctx, t) { FX.confetti(ctx, t, 60, ['#ffd84f', '#4ff5c8', '#ff6bd0', '#ffffff', '#6bb5ff']); },
  },
  fresh: {
    name: '신선 (주황/명조)', font: 'myeongjo',
    pal: [
      { text: '#ffffff', em: '#ffe27a', sub: '#ffe8dc', stroke: null, shadow: 'rgba(90,20,0,.35)', emBox: '#ffffff', emBoxText: '#c83a10', accent: '#ffe27a', accent2: '#ff7a3a', card: '#ffffff', cardText: '#c83a10' },
      { text: '#c83a10', em: '#2a9a2a', sub: '#7a4a3a', stroke: null, shadow: null, emBox: '#c83a10', emBoxText: '#fff', accent: '#c83a10', accent2: '#2a9a2a', card: '#ffffff', cardText: '#c83a10' },
      { text: '#ffffff', em: '#fff27a', sub: '#e6ffe6', stroke: null, shadow: 'rgba(0,60,0,.35)', emBox: '#ffffff', emBoxText: '#1f8a1f', accent: '#fff27a', accent2: '#8aff8a', card: '#ffffff', cardText: '#1f8a1f' },
    ],
    bg(ctx, t, v) {
      if (v === 0) { FX.gradient(ctx, ['#d8481a', '#c3360c', '#b02a06'], 90); FX.arrows(ctx, t, '#ff5a20', -1, .5); }
      else if (v === 1) { FX.gradient(ctx, ['#fbfbf8', '#ececE6'], 90); }
      else { FX.gradient(ctx, ['#3ab83a', '#228a22'], 90); FX.arrows(ctx, t, '#4ad84a', 1, .45); }
    },
    fx(ctx, t, v) { if (v === 0) FX.confetti(ctx, t, 30, ['#ffe27a', '#ffffff', '#ff9a6a'], { alpha: .7 }); },
  },
};

// ===== 새 스타일 테마 (예시 영상에 없던 스타일) =====
Object.assign(THEMES, {
  neon: {
    name: '네온 나이트', font: 'dohyeon',
    pal: [
      { text: '#ffffff', em: '#29f0ff', sub: '#ffb8f2', stroke: null, shadow: null, glow: '#ff2bd6', emBox: '#ff2bd6', emBoxText: '#ffffff', accent: '#ff2bd6', accent2: '#29f0ff', card: '#1a0b33', cardText: '#29f0ff' },
      { text: '#ffffff', em: '#fffb5c', sub: '#9ff8ff', stroke: null, shadow: null, glow: '#29f0ff', emBox: '#29f0ff', emBoxText: '#0b0420', accent: '#29f0ff', accent2: '#ff2bd6', card: '#0b0420', cardText: '#fffb5c' },
      { text: '#ffffff', em: '#ff4fd8', sub: '#c8b8ff', stroke: null, shadow: null, glow: '#8a5cff', emBox: '#8a5cff', emBoxText: '#ffffff', accent: '#8a5cff', accent2: '#29f0ff', card: '#120830', cardText: '#ff4fd8' },
    ],
    bg(ctx, t, v) {
      if (v === 0) { FX.gradient(ctx, ['#0b0420', '#2a0b4a', '#4a0f5e'], 180); FX.synthSun(ctx, W * .62, H * .5, 260); FX.neonGrid(ctx, t, '#ff2bd6'); FX.stars(ctx, t, 120); }
      else if (v === 1) { ctx.fillStyle = '#05030f'; ctx.fillRect(0, 0, W, H); FX.neonBars(ctx, t, ['#29f0ff', '#ff2bd6', '#fffb5c']); FX.vignette(ctx, .6); }
      else { FX.gradient(ctx, ['#0a0830', '#160a40'], 90); FX.bokeh(ctx, t, 16, '#ff4fd8', .25); FX.bokeh(ctx, t + 9, 12, '#29f0ff', .2); }
    },
    fx(ctx, t, v) { FX.sparkles(ctx, t, 8, v === 1 ? '#29f0ff' : '#ff9cf0'); },
  },
  popart: {
    name: '팝아트 코믹', font: 'bagel',
    pal: [
      { text: '#ffffff', em: '#ff2a6d', sub: '#ffffff', stroke: '#111111', strokeK: .2, shadow: '#111111', shadowOff: 3.2, emBox: '#111111', emBoxText: '#ffe600', accent: '#ff2a6d', accent2: '#111111', card: '#ffffff', cardText: '#111111' },
      { text: '#ffe600', em: '#ffffff', sub: '#ffffff', stroke: '#111111', strokeK: .2, shadow: '#111111', shadowOff: 3.2, emBox: '#ff2a6d', emBoxText: '#ffffff', accent: '#ffe600', accent2: '#111111', card: '#ffffff', cardText: '#111111' },
      { text: '#ffffff', em: '#ffe600', sub: '#ffffff', stroke: '#111111', strokeK: .2, shadow: '#111111', shadowOff: 3.2, emBox: '#ffe600', emBoxText: '#111111', accent: '#ffe600', accent2: '#00c2ff', card: '#ffffff', cardText: '#111111' },
    ],
    bg(ctx, t, v) {
      if (v === 0) { ctx.fillStyle = '#ffe600'; ctx.fillRect(0, 0, W, H); FX.rays(ctx, t, W * .62, H * .5, '#ffffff', 22, .35); FX.halftone(ctx, t, '#ff2a6d', .3); }
      else if (v === 1) { ctx.fillStyle = '#00b8f0'; ctx.fillRect(0, 0, W, H); FX.halftone(ctx, t, '#0a4a9a', .35, 30, -1); FX.burst(ctx, W * .62, H * .5, 560, 'rgba(255,255,255,.18)', 16, t * .1, null); }
      else { ctx.fillStyle = '#ff2a6d'; ctx.fillRect(0, 0, W, H); FX.rays(ctx, t, W * .62, H * .5, '#ff7aa5', 18, .5); FX.halftone(ctx, t, '#7a0030', .25); }
    },
    fx() { },
  },
  luxe: {
    name: '블랙 골드 럭셔리', font: 'notoserif',
    pal: [
      { text: '#f6ead0', em: '#e8c26a', sub: '#bfae8a', stroke: null, shadow: 'rgba(0,0,0,.6)', gradient: ['#fff6dc', '#d6ad5a'], emBox: '#c9a24c', emBoxText: '#111111', accent: '#c9a24c', accent2: '#f6ead0', card: '#1a1712', cardText: '#e8c26a' },
      { text: '#ffffff', em: '#f0cf7e', sub: '#d8d0c0', stroke: null, shadow: 'rgba(0,0,0,.6)', gradient: ['#ffffff', '#e2cfa4'], emBox: '#d6b25e', emBoxText: '#111111', accent: '#d6b25e', accent2: '#ffffff', card: '#1f1d1a', cardText: '#f0cf7e' },
      { text: '#2a2015', em: '#a8792a', sub: '#6a5a40', stroke: null, shadow: null, emBox: '#2a2015', emBoxText: '#f0cf7e', accent: '#b08a3e', accent2: '#2a2015', card: '#ffffff', cardText: '#2a2015' },
    ],
    bg(ctx, t, v) {
      if (v === 0) { FX.gradient(ctx, ['#0c0b09', '#1c1812', '#0c0b09'], 120); FX.radial(ctx, W * .62, H * .45, 760, 'rgba(201,162,76,.22)', 'rgba(0,0,0,0)'); FX.goldFrame(ctx, t); }
      else if (v === 1) { FX.marble(ctx, t, '#15130f', '#c9a24c', .16); FX.lightSweep(ctx, t, '#f0cf7e', 5); FX.vignette(ctx, .6); }
      else { FX.gradient(ctx, ['#f7f1e6', '#ece1cd'], 90); FX.goldFrame(ctx, t, '#b08a3e'); }
    },
    fx(ctx, t, v) { if (v < 2) FX.sparkles(ctx, t, 6, '#f0cf7e'); },
  },
  holo: {
    name: 'Y2K 홀로그램', font: 'gugi',
    pal: [
      { text: '#1d1b4a', em: '#ff2fb9', sub: '#4a3f8a', stroke: '#ffffff', strokeK: .14, shadow: 'rgba(80,40,160,.25)', emBox: '#1d1b4a', emBoxText: '#ffffff', accent: '#ff2fb9', accent2: '#5a3cff', card: '#ffffff', cardText: '#5a3cff' },
      { text: '#14142b', em: '#5a3cff', sub: '#3a3a5a', stroke: '#ffffff', strokeK: .14, shadow: 'rgba(0,0,0,.2)', emBox: '#ff2fb9', emBoxText: '#ffffff', accent: '#5a3cff', accent2: '#ff2fb9', card: '#ffffff', cardText: '#14142b' },
      { text: '#ffffff', em: '#9dffea', sub: '#d8c8ff', stroke: null, shadow: null, glow: '#b48cff', emBox: '#ff2fb9', emBoxText: '#ffffff', accent: '#9dffea', accent2: '#ff9cf0', card: '#120a2a', cardText: '#9dffea' },
    ],
    bg(ctx, t, v) {
      if (v === 0) { FX.gradient(ctx, ['#ffd6f5', '#d9d2ff', '#c6f7ff'], 60); FX.blobs(ctx, t, ['#ff9ce6', '#a99cff', '#8ff5e4', '#fff08a'], .45); }
      else if (v === 1) { FX.chrome(ctx, t); FX.lightSweep(ctx, t, '#ffffff', 3.5); }
      else { FX.gradient(ctx, ['#0d0820', '#1c0f3a'], 90); FX.blobs(ctx, t, ['#7a4dff', '#ff4fd8', '#29e0d0'], .3); FX.stars(ctx, t, 140); }
    },
    fx(ctx, t, v) { FX.sparkles(ctx, t, 12, '#ffffff'); },
  },
  aurora: {
    name: '오로라 글래스', font: 'sunflower',
    pal: [
      { text: '#ffffff', em: '#8affd6', sub: '#d8f6ff', stroke: null, shadow: 'rgba(0,20,40,.35)', emBox: '#ffffff', emBoxText: '#123a4a', accent: '#8affd6', accent2: '#b28cff', card: 'rgba(255,255,255,.18)', cardText: '#ffffff' },
      { text: '#1e2240', em: '#6a4dff', sub: '#4a4f70', stroke: null, shadow: null, emBox: '#6a4dff', emBoxText: '#ffffff', accent: '#6a4dff', accent2: '#ff8fb8', card: '#ffffff', cardText: '#6a4dff' },
      { text: '#ffffff', em: '#c9ff8a', sub: '#cfe8ff', stroke: null, shadow: 'rgba(0,0,0,.4)', emBox: '#c9ff8a', emBoxText: '#0a2a2a', accent: '#c9ff8a', accent2: '#5af0ff', card: 'rgba(255,255,255,.15)', cardText: '#ffffff' },
    ],
    bg(ctx, t, v) {
      if (v === 0) { FX.gradient(ctx, ['#061a2e', '#0d2a4a', '#2a1650'], 160); FX.aurora(ctx, t, ['#2affb0', '#5ab8ff', '#b06bff'], .45); FX.stars(ctx, t, 90); }
      else if (v === 1) { FX.gradient(ctx, ['#ffe2d6', '#efe0ff', '#d6ecff'], 50); FX.blobs(ctx, t, ['#ffb39c', '#c9a8ff', '#9ce0ff'], .5); }
      else { FX.gradient(ctx, ['#03140f', '#062a24', '#0a1a30'], 170); FX.aurora(ctx, t, ['#7dff6a', '#2affd0'], .5); FX.stars(ctx, t, 120); }
    },
    panel(ctx, t, v, A) { FX.glassPanel(ctx, A, v === 1 ? .45 : .1, '#ffffff'); },
    fx() { },
  },
  blackfriday: {
    name: '블랙프라이데이', font: 'gasoek',
    pal: [
      { text: '#ffffff', em: '#ffe600', sub: '#cccccc', stroke: null, shadow: 'rgba(0,0,0,.6)', emBox: '#ffe600', emBoxText: '#111111', accent: '#ffe600', accent2: '#ffffff', card: '#1a1a1a', cardText: '#ffe600' },
      { text: '#111111', em: '#e8000f', sub: '#222222', stroke: null, shadow: null, emBox: '#111111', emBoxText: '#ffe600', accent: '#111111', accent2: '#e8000f', card: '#ffffff', cardText: '#111111' },
      { text: '#ffffff', em: '#ff2a3a', sub: '#dddddd', stroke: null, shadow: 'rgba(0,0,0,.6)', emBox: '#ff2a3a', emBoxText: '#ffffff', accent: '#ff2a3a', accent2: '#ffe600', card: '#1a1a1a', cardText: '#ff2a3a' },
    ],
    bg(ctx, t, v) {
      if (v === 0) { ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, W, H); FX.radial(ctx, W * .62, H * .5, 700, 'rgba(255,230,0,.12)', 'rgba(0,0,0,0)'); FX.cautionTape(ctx, t, 60, -.06); FX.cautionTape(ctx, -t, H - 50, .05); }
      else if (v === 1) { ctx.fillStyle = '#ffe600'; ctx.fillRect(0, 0, W, H); FX.halftone(ctx, t, '#111111', .12, 22); FX.slashes(ctx, t, ['rgba(0,0,0,.08)', 'rgba(0,0,0,.05)']); }
      else { ctx.fillStyle = '#0d0d0d'; ctx.fillRect(0, 0, W, H); const pulse = .5 + .5 * Math.sin(t * 6); FX.radial(ctx, W * .5, H * .5, 1100, `rgba(232,0,15,${.12 + .14 * pulse})`, 'rgba(0,0,0,0)'); FX.vignette(ctx, .7); }
    },
    fx() { },
  },
  speed: {
    name: '스피드 다이내믹', font: 'blackhan', skew: -.16,
    pal: [
      { text: '#ffffff', em: '#ffde1a', sub: '#cfe3ff', stroke: null, shadow: 'rgba(0,10,50,.5)', emBox: '#ffde1a', emBoxText: '#0a1a6a', accent: '#ffde1a', accent2: '#ff3b2f', card: '#ffffff', cardText: '#0a1a6a' },
      { text: '#ffffff', em: '#111111', sub: '#fff1e0', stroke: null, shadow: 'rgba(80,0,0,.35)', emBox: '#111111', emBoxText: '#ffffff', accent: '#111111', accent2: '#ffffff', card: '#ffffff', cardText: '#ff3b2f' },
      { text: '#111111', em: '#ff3b2f', sub: '#444444', stroke: null, shadow: null, emBox: '#ff3b2f', emBoxText: '#ffffff', accent: '#ff3b2f', accent2: '#111111', card: '#ffffff', cardText: '#ff3b2f' },
    ],
    bg(ctx, t, v) {
      if (v === 0) { FX.gradient(ctx, ['#061a8a', '#0a2ad0', '#04126a'], 100); FX.slashes(ctx, t * 1.5, ['rgba(255,255,255,.07)', 'rgba(255,222,26,.12)', 'rgba(255,255,255,.05)']); EFFECTS.스피드라인.fn(ctx, t); }
      else if (v === 1) { FX.gradient(ctx, ['#ff6a1a', '#ff3b2f', '#d81a1a'], 110); FX.slashes(ctx, t * 2, ['rgba(255,255,255,.12)', 'rgba(0,0,0,.08)']); }
      else { ctx.fillStyle = '#f2f2f2'; ctx.fillRect(0, 0, W, H); FX.slashes(ctx, t * 1.8, ['rgba(255,59,47,.85)', 'rgba(17,17,17,.08)']); }
    },
    fx() { },
  },
  winter: {
    name: '윈터 홀리데이', font: 'jua',
    pal: [
      { text: '#ffffff', em: '#ffd84f', sub: '#d8ecff', stroke: null, shadow: 'rgba(0,20,60,.45)', emBox: '#e8283a', emBoxText: '#ffffff', accent: '#e8283a', accent2: '#2aa45a', card: '#ffffff', cardText: '#c81e2e' },
      { text: '#ffffff', em: '#fff2a8', sub: '#ffe0e0', stroke: null, shadow: 'rgba(80,0,0,.35)', emBox: '#ffffff', emBoxText: '#c81e2e', accent: '#ffffff', accent2: '#2aa45a', card: '#ffffff', cardText: '#c81e2e' },
      { text: '#1f6a3a', em: '#e8283a', sub: '#3a5a4a', stroke: '#ffffff', strokeK: .1, shadow: null, emBox: '#e8283a', emBoxText: '#ffffff', accent: '#e8283a', accent2: '#1f6a3a', card: '#ffffff', cardText: '#e8283a' },
    ],
    bg(ctx, t, v) {
      if (v === 0) { FX.gradient(ctx, ['#0a1a40', '#12306a', '#0a1a40'], 90); FX.bokeh(ctx, t, 18, '#ffd84f', .25); FX.bokeh(ctx, t + 4, 10, '#ff6a6a', .2); }
      else if (v === 1) { FX.gradient(ctx, ['#d8283a', '#b01a2a'], 90); FX.ornaments(ctx, t, ['#ffd84f', '#ffffff', '#2aa45a', '#4fb0ff']); }
      else { FX.gradient(ctx, ['#f6fbff', '#e2f0fa'], 90); FX.bokeh(ctx, t, 12, '#9fd0ff', .3); }
    },
    fx(ctx, t, v) { FX.snow(ctx, t, v === 2 ? 50 : 80, v === 2 ? '#9fc4ff' : '#ffffff'); },
  },
  paper: {
    name: '한지 붓글씨', font: 'dokdo',
    pal: [
      { text: '#1a1a1a', em: '#c8102e', sub: '#4a3f30', stroke: null, shadow: null, emBox: '#c8102e', emBoxText: '#fff6e6', accent: '#c8102e', accent2: '#1a1a1a', card: '#fffaf0', cardText: '#1a1a1a' },
      { text: '#fff6e6', em: '#ffcf5a', sub: '#e8dcc8', stroke: null, shadow: 'rgba(0,0,0,.4)', emBox: '#c8102e', emBoxText: '#fff6e6', accent: '#c8102e', accent2: '#fff6e6', card: '#fffaf0', cardText: '#1a1a1a' },
      { text: '#1a1a1a', em: '#2a6a3a', sub: '#4a3f30', stroke: null, shadow: null, emBox: '#2a6a3a', emBoxText: '#fff6e6', accent: '#c8102e', accent2: '#2a6a3a', card: '#fffaf0', cardText: '#1a1a1a' },
    ],
    bg(ctx, t, v) {
      if (v === 0) { FX.paper(ctx, t); FX.inkBlots(ctx, t, '#1a1a1a', .07); }
      else if (v === 1) { FX.gradient(ctx, ['#1c1a17', '#2a2620'], 90); FX.inkBlots(ctx, t, '#000000', .3); FX.radial(ctx, W * .62, H * .5, 700, 'rgba(255,207,90,.08)', 'rgba(0,0,0,0)'); }
      else { FX.paper(ctx, t, '#eef0e4'); FX.inkBlots(ctx, t, '#2a6a3a', .06); }
    },
    fx() { },
  },
});

// ===== 키컬러 맞춤 테마: 색 하나로 배경 3종·글자색을 만들어 냄 =====
THEMES.key = { name: '키컬러 (맞춤)', font: 'notoblack', hex: '', pal: [], bg() { }, fx() { } };
function setKeyColor(hex) {
  hex = /^#[0-9a-f]{6}$/i.test(hex || '') ? hex.toLowerCase() : '#f40013';
  const T = THEMES.key; if (T.hex === hex) return T;
  const [h, s, l] = hexHsl(hex);
  const vivid = hslToHex(h, Math.max(s, .55), clamp(l, .38, .55));          // 글자·강조용으로 쓸 만한 진하기
  const deep = hslToHex(h, Math.min(1, s * 1.05), Math.min(l, .5) * .55);  // 어두운 쪽
  const tint = hslToHex(h, Math.min(s, .9), .965), tint2 = hslToHex(h, Math.min(s, .85), .9);
  const glow = hslToHex(h, Math.max(s, .6), .66);
  const lightKey = luma(hex) > .45;                                         // 노랑·민트처럼 밝은 키컬러
  const onKey = lightKey ? hslToHex(h, .5, .14) : '#ffffff';
  const em2 = lightKey ? hslToHex(h + 180, .7, .35) : (Math.abs(((h - 52 + 540) % 360) - 180) < 40 ? '#ffffff' : '#ffe24a');
  T.hex = hex;
  T.pal = [
    { text: hslToHex(h, Math.min(s, .5), .14), em: vivid, sub: hslToHex(h, Math.min(s, .25), .3), stroke: null, shadow: rgba(vivid, .12), emBox: vivid, emBoxText: '#ffffff', accent: vivid, accent2: hslToHex(h, .3, .15), card: '#ffffff', cardText: vivid },
    { text: onKey, em: em2, sub: lightKey ? hslToHex(h, .4, .22) : hslToHex(h, .5, .93), stroke: null, shadow: rgba(deep, .35), emBox: lightKey ? hslToHex(h, .5, .14) : '#ffffff', emBoxText: lightKey ? '#ffffff' : vivid, accent: lightKey ? hslToHex(h, .5, .14) : '#ffffff', accent2: em2, card: '#ffffff', cardText: vivid },
    { text: '#ffffff', em: glow, sub: hslToHex(h, .15, .82), stroke: null, shadow: 'rgba(0,0,0,.6)', emBox: vivid, emBoxText: '#ffffff', accent: vivid, accent2: '#ffffff', card: '#ffffff', cardText: hslToHex(h, .3, .15) },
  ];
  const kL = hslToHex(h, s, Math.min(.85, l + .1)), kD = hslToHex(h, s, Math.max(.12, l - .14));
  const blobA = hslToHex(h, Math.max(s, .5), .75), blobB = hslToHex(h + 25, Math.max(s, .4), .85);
  T.bg = (ctx, t, v) => {
    if (v === 0) { FX.gradient(ctx, ['#ffffff', tint, tint2], 70); FX.blobs(ctx, t, [blobA, blobB, glow], .4); FX.bubbles(ctx, t, 14, vivid, .16); }
    else if (v === 1) { FX.gradient(ctx, [kL, hex, kD], 100); FX.blobs(ctx, t, [kL, glow], .3); FX.lightSweep(ctx, t, '#ffffff', 4.5); }
    else { FX.gradient(ctx, [hslToHex(h, Math.min(s, .5), .1), '#0a0a0c'], 90); FX.blobs(ctx, t, [vivid, deep], .35); FX.vignette(ctx, .5); }
  };
  T.fx = (ctx, t, v) => { if (v) FX.sparkles(ctx, t, 8, '#ffffff'); };
  return T;
}
setKeyColor('#f40013');

// 키컬러로 분위기 판단 → 모션 느낌·폰트 추천
function toneFromColor(hex) {
  const [h, s, l] = hexHsl(hex);
  if (s < .2 || l < .18) return { label: '모던·고급', feel: '보통', font: 'gothica1' };
  if (l > .72) return { label: '산뜻·부드러운 파스텔', feel: '부드럽게', font: 'jua' };
  if ((h < 45 || h >= 340) && s > .55) return { label: '강렬·임팩트', feel: '강하게', font: 'blackhan' };
  if (h < 70) return { label: '활기·따뜻함', feel: '보통', font: 'dohyeon' };
  if (h < 175) return { label: '신선·내추럴', feel: '보통', font: 'notoblack' };
  if (h < 255) return { label: '신뢰·깔끔', feel: '보통', font: 'notoblack' };
  return { label: '프리미엄·감성', feel: '부드럽게', font: 'gothica1' };
}
