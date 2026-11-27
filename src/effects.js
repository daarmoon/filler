// ===== effects.js : 꾸미기 효과(파티클·광원·화면 효과)와 새 배경 요소 =====
// 모든 효과는 시간 t만으로 결정돼서 스크러빙·내보내기 때 똑같이 나옴

const TAU = Math.PI * 2;
function star5(ctx, x, y, r, rot = 0) {
  ctx.beginPath();
  for (let k = 0; k < 10; k++) { const rr = k % 2 ? r * .45 : r, a = rot + k * Math.PI / 5 - Math.PI / 2; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath();
}
function heartPath(ctx, x, y, s) {
  ctx.beginPath(); ctx.moveTo(x, y + s * .35);
  ctx.bezierCurveTo(x - s * 1.1, y - s * .35, x - s * .45, y - s * 1.05, x, y - s * .45);
  ctx.bezierCurveTo(x + s * .45, y - s * 1.05, x + s * 1.1, y - s * .35, x, y + s * .35); ctx.closePath();
}
let NOISE = null;
function noiseTile() {
  if (NOISE) return NOISE;
  NOISE = document.createElement('canvas'); NOISE.width = NOISE.height = 256; const g = NOISE.getContext('2d'); const id = g.createImageData(256, 256);
  for (let i = 0; i < id.data.length; i += 4) { const v = Math.floor(hash(i * 13 + 7) * 255); id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  g.putImageData(id, 0, 0); return NOISE;
}

Object.assign(FX, {
  // 원근 네온 격자 바닥 (신스웨이브)
  neonGrid(ctx, t, color = '#ff2bd6', horizon = H * .58, alpha = .8) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.shadowColor = color; ctx.shadowBlur = 14; ctx.globalAlpha = alpha;
    const vx = W * .62;
    for (let k = -18; k <= 18; k++) { ctx.beginPath(); ctx.moveTo(vx + k * 18, horizon); ctx.lineTo(vx + k * 260, H + 40); ctx.stroke(); }
    const ph = (t * .6) % 1;
    for (let k = 0; k < 14; k++) { const z = (k + ph) / 14; const y = horizon + Math.pow(z, 2.2) * (H - horizon + 60); ctx.globalAlpha = alpha * z; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.restore();
  },
  // 줄무늬 지는 해
  synthSun(ctx, x, y, r, c1 = '#ffd319', c2 = '#ff2975') {
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
    const g = ctx.createLinearGradient(0, y - r, 0, y + r); g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.globalCompositeOperation = 'destination-out';
    for (let k = 0; k < 7; k++) { const yy = y + r * (.1 + k * .13), h = 4 + k * 3.2; ctx.fillRect(x - r, yy, r * 2, h); }
    ctx.restore();
  },
  // 빛나는 네온 막대
  neonBars(ctx, t, colors) {
    ctx.save(); ctx.lineCap = 'round';
    colors.forEach((c, k) => {
      const y = H * (.15 + k * .3) + Math.sin(t * .7 + k) * 30, x0 = -200 + ((t * 80 + k * 400) % (W + 600)) - 300;
      ctx.strokeStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 30; ctx.lineWidth = 10; ctx.globalAlpha = .75;
      ctx.beginPath(); ctx.moveTo(x0, y + 240); ctx.lineTo(x0 + 700, y - 240); ctx.stroke();
    });
    ctx.restore();
  },
  // 망점 (팝아트)
  halftone(ctx, t, color, alpha = .35, step = 26, dir = 1) {
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = alpha; const off = (t * 12 * dir) % step;
    for (let y = -step; y < H + step; y += step) for (let x = -step; x < W + step; x += step) {
      const k = clamp((x / W) * .8 + (y / H) * .4); const r = step * .48 * k; if (r < 1) continue;
      ctx.beginPath(); ctx.arc(x + off + ((y / step) % 2 ? step / 2 : 0), y, r, 0, TAU); ctx.fill();
    }
    ctx.restore();
  },
  // 만화 폭발 말풍선 모양
  burst(ctx, x, y, r, color, spikes = 14, rot = 0, stroke = '#111') {
    ctx.save(); ctx.beginPath();
    for (let k = 0; k < spikes * 2; k++) { const rr = k % 2 ? r * .72 : r * (1 + .08 * Math.sin(k * 3.1)); const a = rot + k * Math.PI / spikes; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = color; ctx.fill(); if (stroke) { ctx.lineWidth = 8; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.stroke(); }
    ctx.restore();
  },
  // 금색 얇은 테두리
  goldFrame(ctx, t, color = '#d8b56a') {
    ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = .7; ctx.lineWidth = 2;
    ctx.strokeRect(60, 50, W - 120, H - 100); ctx.globalAlpha = .35; ctx.strokeRect(78, 68, W - 156, H - 136);
    const p = (t * .15) % 1; const L = 2 * (W - 120 + H - 100); let d = p * L; let x = 60, y = 50;
    if (d < W - 120) x += d; else if ((d -= W - 120) < H - 100) { x = W - 60; y += d; } else if ((d -= H - 100) < W - 120) { x = W - 60 - d; y = H - 50; } else { d -= W - 120; x = 60; y = H - 50 - d; }
    const g = ctx.createRadialGradient(x, y, 0, x, y, 80); g.addColorStop(0, rgba('#fff3c8', .9)); g.addColorStop(1, rgba('#fff3c8', 0));
    ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(x - 80, y - 80, 160, 160);
    ctx.restore();
  },
  // 대리석 느낌 연기 결
  marble(ctx, t, base, vein, alpha = .18) {
    ctx.fillStyle = base; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.strokeStyle = vein; ctx.globalAlpha = alpha; ctx.lineWidth = 2;
    for (let k = 0; k < 22; k++) {
      ctx.beginPath(); const y0 = rnd(k, 81) * H * 1.4 - H * .2;
      for (let x = -50; x <= W + 50; x += 40) { const y = y0 + Math.sin(x * .004 + k + t * .1) * 90 + Math.sin(x * .013 + k * 2) * 25 + x * .25 * (rnd(k, 82) - .5); x === -50 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.restore();
  },
  // 오로라 커튼
  aurora(ctx, t, colors, alpha = .5) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    colors.forEach((c, k) => {
      const base = H * (.25 + k * .12);
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 30) ctx.lineTo(x, base + Math.sin(x * .003 + t * .5 + k * 1.7) * 90 + Math.sin(x * .009 - t * .8 + k) * 35);
      ctx.lineTo(W, H); ctx.closePath();
      const g = ctx.createLinearGradient(0, base - 120, 0, base + 420); g.addColorStop(0, rgba(c, 0)); g.addColorStop(.2, rgba(c, alpha)); g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g; ctx.fill();
    });
    ctx.restore();
  },
  // 유리 패널 (반투명 카드)
  glassPanel(ctx, A, alpha = .35, tint = '#ffffff') {
    ctx.save(); roundRect(ctx, A.x - 10, A.y - 20, A.w + 20, A.h + 40, 36);
    ctx.fillStyle = rgba(tint, alpha); ctx.fill(); ctx.strokeStyle = rgba('#ffffff', .6); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  },
  // 크롬 띠
  chrome(ctx, t) {
    const g = ctx.createLinearGradient(0, 0, W * .3, H); const ph = Math.sin(t * .4) * .08;
    [['#f6f7fb', 0], ['#b9bfd0', .25 + ph], ['#ffffff', .45 + ph], ['#8e95a8', .62 + ph], ['#eef0f6', .85], ['#c7ccda', 1]].forEach(([c, o]) => g.addColorStop(clamp(o), c));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  },
  // 공사장 경고 테이프
  cautionTape(ctx, t, y, rot, color = '#ffe600', dark = '#111', text = 'SALE') {
    ctx.save(); ctx.translate(W / 2, y); ctx.rotate(rot); const h = 70, off = (t * 160) % 120;
    ctx.fillStyle = color; ctx.fillRect(-W, -h / 2, W * 2, h);
    ctx.fillStyle = dark; for (let x = -W - 120 + off; x < W; x += 120) { ctx.beginPath(); ctx.moveTo(x, -h / 2); ctx.lineTo(x + 50, -h / 2); ctx.lineTo(x + 20, h / 2); ctx.lineTo(x - 30, h / 2); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  },
  // 사선 판넬
  slashes(ctx, t, colors) {
    ctx.save();
    colors.forEach((c, k) => {
      const x = ((t * (120 + k * 60) + k * 700) % (W + 1400)) - 700;
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 160 + k * 40, 0); ctx.lineTo(x - 260 + k * 40, H); ctx.lineTo(x - 420, H); ctx.closePath(); ctx.fill();
    });
    ctx.restore();
  },
  // 흔들리는 오너먼트
  ornaments(ctx, t, colors) {
    ctx.save();
    for (let k = 0; k < 7; k++) {
      const x = W * (.08 + k * .145), len = 90 + rnd(k, 91) * 160, sw = Math.sin(t * 1.4 + k) * .12;
      const ex = x + Math.sin(sw) * len, ey = Math.cos(sw) * len;
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(ex, ey); ctx.stroke();
      const r = 24 + rnd(k, 92) * 18, c = colors[k % colors.length];
      const g = ctx.createRadialGradient(ex - r * .3, ey + r * .6, r * .1, ex, ey + r, r); g.addColorStop(0, mix(c, '#ffffff', .6)); g.addColorStop(1, c);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ex, ey + r, r, 0, TAU); ctx.fill();
      ctx.fillStyle = '#d8c070'; ctx.fillRect(ex - 6, ey - 4, 12, 8);
    }
    ctx.restore();
  },
  // 한지 결
  paper(ctx, t, base = '#f3ead8') {
    ctx.fillStyle = base; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = .07; ctx.globalCompositeOperation = 'multiply'; const n = noiseTile();
    for (let y = 0; y < H; y += 256) for (let x = 0; x < W; x += 256) ctx.drawImage(n, x, y);
    ctx.restore();
    ctx.save(); ctx.strokeStyle = 'rgba(120,90,40,.08)'; ctx.lineWidth = 1.5;
    for (let k = 0; k < 40; k++) { const x = rnd(k, 95) * W, y = rnd(k, 96) * H; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 40, y + 10, x + 70 + rnd(k, 97) * 60, y - 8); ctx.stroke(); }
    ctx.restore();
  },
  // 먹물 번짐
  inkBlots(ctx, t, color = '#1a1a1a', alpha = .12) {
    // 수묵 번짐: 가장자리 쪽에 부드러운 먹 번짐 + 작은 먹물 방울 (글자 자리인 가운데는 비움)
    ctx.save();
    for (let k = 0; k < 5; k++) {
      const right = k % 2 === 1, top = k < 2;
      const x = W * (right ? .8 + .16 * rnd(k, 101) : .04 + .16 * rnd(k, 101)), y = H * (k === 4 ? .45 + .1 * rnd(k, 102) : top ? .06 + .2 * rnd(k, 102) : .7 + .22 * rnd(k, 102));
      const r = 150 + rnd(k, 103) * 200, p1 = rnd(k, 105) * TAU, p2 = rnd(k, 106) * TAU, p3 = rnd(k, 107) * TAU, a = alpha * (.6 + .6 * rnd(k, 104));
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 1.15); g.addColorStop(0, rgba(color, a)); g.addColorStop(.55, rgba(color, a * .55)); g.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = g; ctx.beginPath();
      for (let s = 0; s <= 60; s++) { const ang = s / 60 * TAU, rr = r * (1 + .14 * Math.sin(3 * ang + p1) + .08 * Math.sin(5 * ang + p2) + .05 * Math.sin(11 * ang + p3)); ctx.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr); }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = rgba(color, a * 1.4);
      for (let d = 0; d < 7; d++) { const ang = rnd(k * 10 + d, 108) * TAU, dist = r * (1.05 + rnd(k * 10 + d, 109) * .5), dr = 3 + rnd(k * 10 + d, 110) * 10; ctx.beginPath(); ctx.arc(x + Math.cos(ang) * dist, y + Math.sin(ang) * dist, dr, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  },
});

/* ---- 꾸미기 효과: 장면 위(또는 뒤)에 얹는 레이어 ----
   fn(ctx, t, lt, e)  t: 전체 시간, lt: 장면 안 시간, e: 장면 정보 (A 영역, P 색)
   layer: back(글자 뒤) / front(글자 앞) / post(화면 전체 후처리) */
const EFFECTS = {
  반짝이: { layer: 'front', fn(ctx, t, lt, e) { FX.sparkles(ctx, t, 24, '#ffffff', { x: e.A.x, y: e.A.y, w: e.A.w, h: e.A.h }); } },
  금가루: { layer: 'front', fn(ctx, t) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 70; i++) {
      const sp = 12 + rnd(i, 11) * 30, x = (rnd(i, 12) * W + Math.sin(t * .6 + i) * 40), y = (rnd(i, 13) * H - t * sp) % H; const yy = y < 0 ? y + H : y;
      const tw = .4 + .6 * Math.abs(Math.sin(t * (1 + rnd(i, 14) * 3) + i)); const r = 1.5 + rnd(i, 15) * 3.5;
      ctx.globalAlpha = tw; ctx.fillStyle = i % 3 ? '#ffd877' : '#fff1c2'; ctx.beginPath(); ctx.arc(x, yy, r, 0, TAU); ctx.fill();
      if (r > 4 && tw > .9) { ctx.fillRect(x - r * 3, yy - .6, r * 6, 1.2); ctx.fillRect(x - .6, yy - r * 3, 1.2, r * 6); }
    }
    ctx.restore();
  } },
  코인: { layer: 'back', fn(ctx, t, lt) {
    ctx.save();
    for (let i = 0; i < 22; i++) {
      const st = rnd(i, 21) * 1.2, ft = lt - st; if (ft < 0) continue;
      const x = W * (.25 + .7 * rnd(i, 22)), y = -80 + ft * ft * 420 + ft * 200 * rnd(i, 23); if (y > H + 80) continue;
      const spin = Math.cos(t * (5 + rnd(i, 24) * 4) + i), r = 34 + rnd(i, 25) * 20, w = Math.max(.12, Math.abs(spin));
      ctx.save(); ctx.translate(x, y); ctx.rotate((rnd(i, 26) - .5) * .8); ctx.scale(w, 1);
      const g = ctx.createLinearGradient(-r, -r, r, r); g.addColorStop(0, '#fff3a8'); g.addColorStop(.5, '#f5b821'); g.addColorStop(1, '#b8780a');
      ctx.fillStyle = '#a86a06'; ctx.beginPath(); ctx.arc(4, 4, r, 0, TAU); ctx.fill();
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r * .72, 0, TAU); ctx.stroke();
      if (w > .45) { ctx.fillStyle = '#b8780a'; ctx.font = `900 ${r * 1.05}px 'Noto Sans KR'`; ctx.textAlign = 'center'; ctx.fillText('₩', 0, r * .36); }
      ctx.restore();
    }
    ctx.restore();
  } },
  하트: { layer: 'front', fn(ctx, t, lt, e) {
    ctx.save();
    for (let i = 0; i < 18; i++) {
      const sp = 70 + rnd(i, 31) * 90, life = (H + 200) / sp, ph = ((t + rnd(i, 32) * life) % life) / life;
      const x = W * (.3 + .68 * rnd(i, 33)) + Math.sin(t * 2 + i) * 30, y = H + 80 - ph * (H + 200), s = 18 + rnd(i, 34) * 26;
      ctx.globalAlpha = Math.sin(ph * Math.PI) * .9; ctx.fillStyle = [e.P.em, '#ff5c8a', '#ff9db8'][i % 3];
      heartPath(ctx, x, y, s); ctx.fill();
    }
    ctx.restore();
  } },
  별: { layer: 'front', fn(ctx, t, lt, e) {
    ctx.save();
    for (let i = 0; i < 16; i++) {
      const x = e.A.x + rnd(i, 41) * e.A.w, y = e.A.y + rnd(i, 42) * e.A.h, r = 10 + rnd(i, 43) * 22, tw = Math.max(0, Math.sin(t * (1.5 + rnd(i, 44) * 2) + i * 2));
      ctx.globalAlpha = tw; ctx.fillStyle = i % 2 ? '#ffe45c' : '#ffffff'; star5(ctx, x, y, r * (.6 + .4 * tw), t * .5 + i); ctx.fill();
    }
    ctx.restore();
  } },
  꽃잎: { layer: 'front', fn(ctx, t) { FX.petals(ctx, t, 26, ['#ffb3cf', '#ff8fb8', '#ffd1e1']); } },
  눈: { layer: 'front', fn(ctx, t) {
    FX.snow(ctx, t, 40, '#ffffff');
    ctx.save(); ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 80; i++) {
      const z = rnd(i, 91), r = 2 + z * 6, x = (rnd(i, 92) * W + Math.sin(t * (.6 + z) + i) * 26 + W) % W, y = (rnd(i, 93) * (H + 40) + t * (30 + z * 70)) % (H + 40) - 20;
      ctx.globalAlpha = .45 + z * .5; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
    ctx.restore();
  } },
  컨페티: { layer: 'front', fn(ctx, t, lt, e) { FX.confetti(ctx, lt, 90, [e.P.accent, e.P.em, '#ffd84f', '#4ff5c8', '#ffffff'], { burst: .15, x: e.A.cx, y: e.A.cy }); FX.confetti(ctx, t, 40, [e.P.accent, '#ffd84f', '#ffffff']); } },
  폭죽: { layer: 'back', fn(ctx, t) { FX.fireworks(ctx, t, ['#ffd84f', '#4ff5c8', '#ff6bd0', '#ffffff']); } },
  불꽃: { layer: 'front', fn(ctx, t) { FX.flames(ctx, t, .7); FX.embers(ctx, t, 40); } },
  거품: { layer: 'front', fn(ctx, t) { FX.bubbles(ctx, t, 26, '#ffffff', .55); } },
  풍선: { layer: 'back', fn(ctx, t, lt) {
    ctx.save(); const cols = ['#ff4f6d', '#ffd84f', '#4fb0ff', '#7be07b', '#ff8fd0'];
    for (let i = 0; i < 9; i++) {
      const x = W * (.12 + .8 * rnd(i, 51)) + Math.sin(t + i) * 25, y = H + 160 - (lt * (110 + rnd(i, 52) * 70) + rnd(i, 53) * 200), r = 40 + rnd(i, 54) * 22;
      if (y < -200) continue;
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + r * 1.15); ctx.quadraticCurveTo(x + 15, y + r * 2, x - 5, y + r * 3); ctx.stroke();
      const g = ctx.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r * 1.2); g.addColorStop(0, mix(cols[i % 5], '#ffffff', .55)); g.addColorStop(1, cols[i % 5]);
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, r * .85, r * 1.05, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();
  } },
  리본: { layer: 'back', fn(ctx, t, lt, e) {
    ctx.save(); ctx.lineCap = 'round'; const cols = [e.P.accent, '#ffd84f', '#4ff5c8', '#ff6bd0'];
    for (let i = 0; i < 14; i++) {
      const x0 = W * rnd(i, 61), y0 = -100 + ((lt * (180 + rnd(i, 62) * 120) + rnd(i, 63) * H) % (H + 200));
      ctx.strokeStyle = cols[i % 4]; ctx.lineWidth = 7; ctx.beginPath();
      for (let k = 0; k < 12; k++) { const x = x0 + Math.sin(k * .7 + t * 4 + i) * 22, y = y0 + k * 9; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    }
    ctx.restore();
  } },
  집중선: { layer: 'back', fn(ctx, t, lt, e) {
    ctx.save(); const cx = e.A.cx, cy = e.A.cy, R = Math.hypot(W, H);
    ctx.fillStyle = e.v === 0 && luma(e.P.text) < .3 ? 'rgba(0,0,0,.16)' : 'rgba(255,255,255,.22)';
    const k0 = Math.floor(t * 12);
    for (let i = 0; i < 90; i++) {
      const a = (i / 90) * TAU + rnd(i, k0) * .04, w = .006 + rnd(i, 71 + k0) * .012, inner = 360 + rnd(i, 72 + k0) * 240;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner * .6); ctx.lineTo(cx + Math.cos(a - w) * R, cy + Math.sin(a - w) * R); ctx.lineTo(cx + Math.cos(a + w) * R, cy + Math.sin(a + w) * R); ctx.fill();
    }
    ctx.restore();
  } },
  스피드라인: { layer: 'back', fn(ctx, t) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 40; i++) {
      const y = rnd(i, 81) * H, len = 200 + rnd(i, 82) * 500, sp = 1400 + rnd(i, 83) * 1600, x = W + 200 - ((t * sp + rnd(i, 84) * 3000) % (W + 900));
      const g = ctx.createLinearGradient(x, 0, x + len, 0); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(x, y, len, 2 + rnd(i, 85) * 4);
    }
    ctx.restore();
  } },
  빛번짐: { layer: 'front', fn(ctx, t) {
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    [['#ff9a3c', .0], ['#ff3c7a', 2.1], ['#ffd36b', 4.2]].forEach(([c, o], k) => {
      const x = W * (.5 + .55 * Math.sin(t * .35 + o)), y = H * (.3 + .4 * Math.cos(t * .27 + o)), r = 520 + 140 * Math.sin(t * .5 + k);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(c, .32)); g.addColorStop(1, rgba(c, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    });
    ctx.restore();
  } },
  렌즈플레어: { layer: 'front', fn(ctx, t) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const lx = W * (.2 + .25 * Math.sin(t * .3)), ly = H * .18, cx = W / 2, cy = H / 2;
    const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, 260); g.addColorStop(0, 'rgba(255,255,240,.9)'); g.addColorStop(.15, 'rgba(255,230,180,.35)'); g.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = g; ctx.fillRect(lx - 260, ly - 260, 520, 520);
    [[.4, 40, '#7fd0ff'], [.7, 70, '#ffb36b'], [1.2, 30, '#b48cff'], [1.5, 110, '#7fffd0']].forEach(([k, r, c]) => {
      const x = lerp(lx, cx, k * 2) , y = lerp(ly, cy, k * 2); ctx.globalAlpha = .22; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    });
    ctx.restore();
  } },
  무지개빛: { layer: 'front', fn(ctx, t) {
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .35;
    const o = (t * 260) % (W * 2) - W; const g = ctx.createLinearGradient(o, 0, o + W, H);
    ['#ff7ad9', '#ffe36e', '#7affc6', '#7ab8ff', '#c77aff', '#ff7ad9'].forEach((c, k) => g.addColorStop(k / 5, c));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  } },
  스포트라이트: { layer: 'back', fn(ctx, t, lt, e) {
    ctx.save(); const x = e.A.cx + Math.sin(t * .9) * e.A.w * .3, y = e.A.cy;
    const g = ctx.createRadialGradient(x, y, 120, x, y, 900); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.6)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter'; const g2 = ctx.createRadialGradient(x, y, 0, x, y, 520); g2.addColorStop(0, 'rgba(255,255,255,.12)'); g2.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  } },
  네온테두리: { layer: 'front', fn(ctx, t, lt, e) {
    const A = e.A, c = e.P.glow || e.P.em || e.P.accent, per = 2 * (A.w + A.h) + 80; const p = Ease.outCubic(prog(lt, .1, .9));
    ctx.save(); ctx.strokeStyle = c; ctx.lineWidth = 6; ctx.shadowColor = c; ctx.shadowBlur = 28; ctx.globalAlpha = rnd(Math.floor(t * 10), 3) > .97 ? .4 : 1;
    ctx.setLineDash([per * p, per]); roundRect(ctx, A.x - 10, A.y - 20, A.w + 20, A.h + 40, 28); ctx.stroke(); ctx.restore();
  } },
  글리치: { layer: 'post', fn(ctx, t, lt) {
    const k = Math.floor(t * 12); const on = lt < .35 || (t * .5 % 1) < .07; if (!on) return;
    const cv = ctx.canvas; ctx.save();
    for (let i = 0; i < 7; i++) { const y = rnd(i, k) * H, h = 10 + rnd(i, k + 1) * 70, dx = (rnd(i, k + 2) - .5) * 120; ctx.drawImage(cv, 0, y, W, h, dx, y, W, h); }
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .18; ctx.fillStyle = rnd(k, 5) > .5 ? '#00f0ff' : '#ff2a6d'; ctx.fillRect(0, rnd(k, 6) * H, W, 40 + rnd(k, 7) * 80);
    ctx.restore();
  } },
  스캔라인: { layer: 'post', fn(ctx, t) {
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.14)'; for (let y = (t * 30) % 4; y < H; y += 4) ctx.fillRect(0, y, W, 1.5);
    const y = ((t * 220) % (H + 200)) - 100; const g = ctx.createLinearGradient(0, y - 60, 0, y + 60); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.06)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, y - 60, W, 120); ctx.restore();
  } },
  필름그레인: { layer: 'post', fn(ctx, t) {
    const n = noiseTile(), k = Math.floor(t * 24); const ox = Math.floor(rnd(k, 1) * 256), oy = Math.floor(rnd(k, 2) * 256);
    ctx.save(); ctx.globalAlpha = .07; ctx.globalCompositeOperation = 'overlay';
    for (let y = -oy; y < H; y += 256) for (let x = -ox; x < W; x += 256) ctx.drawImage(n, x, y);
    ctx.restore();
  } },
  비네팅: { layer: 'post', fn(ctx) { FX.vignette(ctx, .55); } },
};
const EFFECT_NAMES = Object.keys(EFFECTS);
function parseFxList(v) { return String(v || '').replace(/\([^)]*\)/g, '').split(/[+·,\s]+/).map(s => s.trim()).filter(s => EFFECTS[s]); }
// 전체 효과 + 효과마다 옵션: '효과: 금가루(위, 2배, 3회)+스캔라인'
//  위치 전체·위·아래·왼쪽·오른쪽·가운데 / 속도 0.5배~2배 (느리게·빠르게도 됨) / 반복 계속·1회~9회 (영상 안에서 몇 번 나올지)
const FX_POS = ['전체', '위', '아래', '왼쪽', '오른쪽', '가운데'];
const FX_SPEEDS = [[.5, '느리게 (0.5배)'], [.75, '조금 느리게'], [1, '보통 속도'], [1.5, '빠르게 (1.5배)'], [2, '아주 빠르게 (2배)']];
const FX_REPS = [[0, '계속'], [1, '1번'], [2, '2번'], [3, '3번'], [4, '4번'], [5, '5번']];
function parseFxSpec(v) {
  const list = [], opt = {}; v = String(v || '');
  if (!v.includes('(')) return { list: parseFxList(v), opt };
  for (const m of v.matchAll(/([^+·()]+?)\s*(?:\(([^)]*)\))?\s*(?:[+·]|$)/g)) {
    const name = m[1].trim(); if (!EFFECTS[name] || list.includes(name)) continue; list.push(name);
    if (!m[2]) continue; const o = {};
    for (const tk of m[2].split(/[,\s]+/).map(x => x.trim()).filter(Boolean)) {
      if (FX_POS.includes(tk)) o.pos = tk;
      else if (/^[\d.]+배$/.test(tk)) o.speed = clamp(parseFloat(tk), .25, 4);
      else if (tk === '느리게') o.speed = .5; else if (tk === '빠르게') o.speed = 1.5;
      else if (/^\d+(회|번)$/.test(tk)) o.rep = clamp(parseInt(tk), 1, 9);
      else if (tk === '계속') o.rep = 0;
    }
    if ((o.pos && o.pos !== '전체') || (o.speed && o.speed !== 1) || o.rep) opt[name] = o;
  }
  return { list, opt };
}
function serializeFx(list, opt = {}) {
  return list.map(n => { const o = opt[n] || {}, parts = [];
    if (o.pos && o.pos !== '전체') parts.push(o.pos); if (o.speed && o.speed !== 1) parts.push(o.speed + '배'); if (o.rep) parts.push(o.rep + '번');
    return parts.length ? `${n}(${parts.join(', ')})` : n; }).join('+');
}
