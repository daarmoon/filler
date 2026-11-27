// ===== themes2.js : v8 새 테마 9종 + 어울리는 스타일 프리셋 =====
// 기존 예시(봄 파스텔·물가격파·블루 초특가·인서트 등)의 구성(배경 3종 + 포인트 색 + 움직이는 배경 요소)은 그대로 두고,
// 홈쇼핑에서 자주 쓰는 다른 분위기(미니멀·선셋·과일·자연·바다·키즈·가전·명절·속보)로 새로 디자인함.

Object.assign(FX, {
  // 겹겹이 출렁이는 물결 (아래쪽)
  waves(ctx, t, colors, baseY = H * .74, amp = 34) {
    ctx.save();
    colors.forEach((c, k) => {
      const y0 = baseY + k * H * .065, sp = .6 + k * .25, len = W * (.2 + k * .05), dir = k % 2 ? -1 : 1;
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W + 20; x += 20) ctx.lineTo(x, y0 + Math.sin(x / len * TAU + t * sp * dir + k) * amp + Math.sin(x / (len * .37) + t * 1.3 + k * 2) * amp * .25);
      ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = c; ctx.fill();
    });
    ctx.restore();
  },
  // 물방울 무늬 (천천히 흘러감)
  dots(ctx, t, color, alpha = .3, step = 120, r = 16, drift = 16) {
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = alpha; const off = (t * drift) % step;
    for (let y = -step, row = 0; y < H + step; y += step / 2, row++) for (let x = -step; x < W + step; x += step) {
      ctx.beginPath(); ctx.arc(x + (row % 2 ? step / 2 : 0) + off, y + off / 2, r, 0, TAU); ctx.fill();
    }
    ctx.restore();
  },
  // 설계도 격자 + 위에서 아래로 훑는 스캔선
  blueprint(ctx, t, color = '#5ad1ff', alpha = .16, step = 60) {
    ctx.save(); ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = 1; ctx.beginPath();
    for (let x = 0; x <= W; x += step) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); }
    for (let y = 0; y <= H; y += step) { ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); }
    ctx.stroke();
    ctx.strokeStyle = rgba(color, Math.min(1, alpha * 2)); ctx.lineWidth = 2; ctx.beginPath();
    for (let x = 0; x <= W; x += step * 5) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 0; y <= H; y += step * 5) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
    const sy = (t * H * .2) % (H + 400) - 200, g = ctx.createLinearGradient(0, sy - 140, 0, sy);
    g.addColorStop(0, rgba(color, 0)); g.addColorStop(1, rgba(color, .2)); ctx.fillStyle = g; ctx.fillRect(0, sy - 140, W, 140);
    ctx.fillStyle = rgba(color, .55); ctx.fillRect(0, sy, W, 2);
    ctx.restore();
  },
  // 회로선 위로 빛이 달림
  circuit(ctx, t, color = '#29e0ff', alpha = .3) {
    ctx.save(); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let k = 0; k < 14; k++) {
      const left = k % 2 === 0, y = H * (.06 + .88 * rnd(k, 201)), l1 = W * (.06 + rnd(k, 202) * .2), dy = (rnd(k, 203) - .5) * H * .24, l2 = W * (.04 + rnd(k, 204) * .16);
      const sx = left ? 0 : W, d = left ? 1 : -1, ady = Math.abs(dy);
      const pts = [[sx, y], [sx + d * l1, y], [sx + d * (l1 + ady), y + dy], [sx + d * (l1 + ady + l2), y + dy]];
      ctx.strokeStyle = rgba(color, alpha); ctx.beginPath(); pts.forEach(([x, yy], i) => i ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy)); ctx.stroke();
      ctx.fillStyle = rgba(color, Math.min(1, alpha * 1.8)); ctx.beginPath(); ctx.arc(pts[3][0], pts[3][1], 8, 0, TAU); ctx.fill();
      const segs = [[pts[0], pts[1]], [pts[1], pts[2]], [pts[2], pts[3]]], lens = segs.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]));
      let dd = ((t * .45 + rnd(k, 205)) % 1) * lens.reduce((a, b) => a + b, 0), px = null, py = null;
      for (let s = 0; s < 3; s++) { if (dd <= lens[s]) { const [a, b] = segs[s]; px = a[0] + (b[0] - a[0]) * dd / lens[s]; py = a[1] + (b[1] - a[1]) * dd / lens[s]; break; } dd -= lens[s]; }
      if (px !== null) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glowSprite(color, 64, .3), px - 28, py - 28, 56, 56); ctx.restore(); }
    }
    ctx.restore();
  },
  // 흩날리는 작은 잎
  leaves(ctx, t, n, colors, alpha = .8) {
    ctx.save();
    for (let i = 0; i < n; i++) {
      const sp = 45 + rnd(i, 211) * 60, x = ((rnd(i, 212) * (W + 200) + Math.sin(t * .8 + i) * 70 + t * 22) % (W + 200)) - 100;
      const y = ((rnd(i, 213) * (H + 200) + t * sp) % (H + 200)) - 100, s = 16 + rnd(i, 214) * 24, rot = Math.sin(t * 1.1 + i) * 1.2 + i;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = alpha; ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(s * .75, -s * .1, 0, s); ctx.quadraticCurveTo(-s * .75, -s * .1, 0, -s); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -s * .8); ctx.lineTo(0, s * .9); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  },
  // 화면 모서리의 큰 잎 실루엣
  bigLeaves(ctx, t, color, alpha = .25) {
    ctx.save(); ctx.fillStyle = rgba(color, alpha);
    [[W * .2, -H * .04, 1.1, .75], [W * .26, H * 1.03, 1.3, -.6], [W * 1.02, H * .06, 1.1, 2.5], [W * .98, H * 1.04, 1.4, -2.3]].forEach(([x, y, k, r], j) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(r + Math.sin(t * .6 + j) * .05); const s = Math.min(W, H) * .32 * k;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s * .45, -s * .36, s, 0); ctx.quadraticCurveTo(s * .45, s * .36, 0, 0); ctx.fill();
      ctx.strokeStyle = rgba('#ffffff', alpha * .8); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(s * .05, 0); ctx.lineTo(s * .92, 0); ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  },
  // 과일 단면 (오렌지·레몬·라임)
  citrus(ctx, t, n, colors, alpha = .55) {
    ctx.save();
    for (let i = 0; i < n; i++) {
      const r = Math.min(W, H) * (.05 + rnd(i, 221) * .06), span = H + r * 4;
      const x = W * (.3 + .68 * rnd(i, 222)) + Math.sin(t * .5 + i) * 30, y = (((rnd(i, 223) * span - t * (22 + rnd(i, 224) * 26)) % span) + span) % span - r * 2;
      const c = colors[i % colors.length], rot = t * (.2 + rnd(i, 225) * .3) * (i % 2 ? 1 : -1);
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = alpha;
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(0, 0, r * .86, 0, TAU); ctx.fill();
      ctx.fillStyle = mix(c, '#ffffff', .22);
      for (let k = 0; k < 8; k++) { const a0 = k / 8 * TAU + .07, a1 = (k + 1) / 8 * TAU - .07; ctx.beginPath(); ctx.moveTo(Math.cos((a0 + a1) / 2) * r * .1, Math.sin((a0 + a1) / 2) * r * .1); ctx.arc(0, 0, r * .78, a0, a1); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    }
    ctx.restore();
  },
  // 청해파(물결 비늘) 전통 문양 띠
  seigaiha(ctx, t, base, line, r = 80, y0 = 0, y1 = H) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, y0, W, y1 - y0); ctx.clip(); ctx.lineWidth = 3;
    const off = (t * 10) % (r * 2);
    for (let row = 0, y = y0 - r * .5; y < y1 + r; row++, y += r / 2) {
      for (let x = -r * 2 + (row % 2 ? r : 0) - off; x < W + r * 2; x += r * 2) {
        ctx.fillStyle = base; ctx.beginPath(); ctx.arc(x, y, r, Math.PI, TAU); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = line; for (let k = 4; k >= 1; k--) { ctx.beginPath(); ctx.arc(x, y, r * k / 4.4, Math.PI, TAU); ctx.stroke(); }
      }
    }
    ctx.restore();
  },
  // 보름달
  moon(ctx, x, y, r, color = '#fff2c2') {
    ctx.save(); const g = ctx.createRadialGradient(x, y, r * .3, x, y, r * 2.6); g.addColorStop(0, rgba(color, .5)); g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g; ctx.fillRect(x - r * 2.6, y - r * 2.6, r * 5.2, r * 5.2);
    const g2 = ctx.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r); g2.addColorStop(0, '#fffdf2'); g2.addColorStop(1, color);
    ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // 흐르는 구름 띠
  clouds(ctx, t, color, alpha = .3) {
    ctx.save(); ctx.fillStyle = rgba(color, alpha);
    for (let k = 0; k < 5; k++) {
      const s = Math.min(W, H) * .045, y = H * (.14 + k * .18), x = ((t * (14 + k * 6) + rnd(k, 231) * W) % (W + s * 16)) - s * 8;
      ctx.beginPath(); roundRect(ctx, x - s, y, s * 8.5, s * .9, s * .45); ctx.fill();
      for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.arc(x + j * s * 1.7 + s * .6, y - (j % 2) * s * .4 + s * .1, s * (1 + (j % 2) * .3), 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  },
  // 위쪽에 흐르는 속보 띠
  newsTicker(ctx, t, y, h, bg, fg, text = '긴급 속보 · SPECIAL NEWS · 방송 단독 · ') {
    ctx.save(); ctx.fillStyle = bg; ctx.fillRect(0, y, W, h);
    ctx.font = `900 ${Math.round(h * .52)}px 'Noto Sans KR', sans-serif`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = fg;
    const w = ctx.measureText(text).width || 400, off = (t * 150) % w;
    for (let x = -off; x < W; x += w) ctx.fillText(text, x, y + h / 2 + 1);
    ctx.restore();
  },
  // 점으로 된 돌아가는 지구본
  dotGlobe(ctx, t, x, y, r, color, alpha = .4) {
    ctx.save(); ctx.fillStyle = color;
    for (let la = -80; la <= 80; la += 10) for (let lo = 0; lo < 360; lo += 10) {
      const a = (lo + t * 12) * Math.PI / 180, b = la * Math.PI / 180, z = Math.cos(b) * Math.cos(a); if (z < 0) continue;
      ctx.globalAlpha = alpha * (.25 + .75 * z); ctx.fillRect(x + r * Math.cos(b) * Math.sin(a) - 2.5, y - r * Math.sin(b) - 2.5, 5, 5);
    }
    ctx.restore();
  },
  // 고운 입자감
  grain(ctx, t, alpha = .06) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.globalCompositeOperation = 'overlay'; const n = noiseTile(), ox = Math.floor(hash(Math.floor(t * 10)) * 256);
    ctx.translate(-ox, 0); ctx.fillStyle = ctx.createPattern(n, 'repeat'); ctx.fillRect(0, 0, W + 256, H); ctx.restore();
  },
  // 아주 얇은 가로줄 (미니멀)
  hairlines(ctx, color, alpha = .07, step = 120) {
    ctx.save(); ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = 1.5; ctx.beginPath();
    for (let y = step; y < H; y += step) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke(); ctx.restore();
  },
});

Object.assign(THEMES, {
  mono: {
    name: '미니멀 모노', font: 'gothica1',
    pal: [
      { text: '#111111', em: '#ff3b30', sub: '#555555', stroke: null, shadow: null, emBox: '#111111', emBoxText: '#ffffff', accent: '#ff3b30', accent2: '#111111', card: '#ffffff', cardText: '#111111' },
      { text: '#ffffff', em: '#ff453a', sub: '#a8a8a8', stroke: null, shadow: null, emBox: '#ffffff', emBoxText: '#111111', accent: '#ff453a', accent2: '#ffffff', card: '#1c1c1c', cardText: '#ffffff' },
      { text: '#ffffff', em: '#111111', sub: '#ffe5e3', stroke: null, shadow: null, emBox: '#111111', emBoxText: '#ffffff', accent: '#111111', accent2: '#ffffff', card: '#ffffff', cardText: '#ff3b30' },
    ],
    bg(ctx, t, v) {
      if (v === 0) {
        ctx.fillStyle = '#f4f4f2'; ctx.fillRect(0, 0, W, H); FX.hairlines(ctx, '#000000', .06);
        const cx = W * .74, cy = H * .5, r = Math.min(W, H) * .36; ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,.09)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
        const a = t * .5; ctx.fillStyle = '#ff3b30'; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 9, 0, TAU); ctx.fill(); ctx.restore();
      } else if (v === 1) {
        ctx.fillStyle = '#121212'; ctx.fillRect(0, 0, W, H);
        ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 2; const m = Math.min(W, H) * .07; ctx.strokeRect(m, m, W - m * 2, H - m * 2); ctx.restore();
        FX.lightSweep(ctx, t, '#ffffff', 6);
      } else { ctx.fillStyle = '#ff3b30'; ctx.fillRect(0, 0, W, H); FX.stripes(ctx, t * .4, ['rgba(255,255,255,.06)', 'rgba(255,255,255,0)'], 1); }
    },
    fx() { },
  },
  sunset: {
    name: '선셋 그라데이션', font: 'sunflower',
    pal: [
      { text: '#ffffff', em: '#fff27a', sub: '#ffe6ef', stroke: null, shadow: 'rgba(90,20,60,.35)', emBox: '#ffffff', emBoxText: '#e0457b', accent: '#fff27a', accent2: '#ffffff', card: '#ffffff', cardText: '#d6336c' },
      { text: '#ffffff', em: '#ffb86b', sub: '#f3d9ff', stroke: null, shadow: 'rgba(0,0,0,.4)', emBox: '#ffb86b', emBoxText: '#2b0f4c', accent: '#ff8a5b', accent2: '#ffd36e', card: '#ffffff', cardText: '#5a1a6e' },
      { text: '#4a1f3d', em: '#ff4f7b', sub: '#7a4a63', stroke: null, shadow: null, emBox: '#ff4f7b', emBoxText: '#ffffff', accent: '#ff4f7b', accent2: '#8a5cf6', card: '#ffffff', cardText: '#ff4f7b' },
    ],
    bg(ctx, t, v) {
      if (v === 0) { FX.gradient(ctx, ['#ff9a5a', '#ff5e7e', '#a24bd6'], 60); FX.blobs(ctx, t, ['#ffd36e', '#ff7aa8', '#7b5cff'], .35); FX.grain(ctx, t, .08); }
      else if (v === 1) { FX.gradient(ctx, ['#2b0f4c', '#5a1a6e', '#ff6a5a'], 90); FX.radial(ctx, W * .62, H * .98, H * .75, 'rgba(255,190,110,.55)', 'rgba(0,0,0,0)'); FX.bokeh(ctx, t, 10, '#ffb3d0', .2); }
      else { FX.gradient(ctx, ['#fff1e6', '#ffd9cf', '#f8cde6'], 50); FX.blobs(ctx, t, ['#ffc2a8', '#ffb3d0', '#d6c2ff'], .45); }
    },
    fx(ctx, t, v) { if (v === 1) FX.sparkles(ctx, t, 6, '#ffe3b0'); },
  },
  citrus: {
    name: '비타민 시트러스', font: 'jua',
    pal: [
      { text: '#24520a', em: '#ff5a00', sub: '#3d6b12', stroke: '#ffffff', strokeK: .1, shadow: 'rgba(120,80,0,.18)', emBox: '#ff5a00', emBoxText: '#ffffff', accent: '#ff5a00', accent2: '#2f8a1a', card: '#ffffff', cardText: '#ff5a00' },
      { text: '#ffffff', em: '#fff35c', sub: '#efffd8', stroke: null, shadow: 'rgba(30,70,0,.35)', emBox: '#fff35c', emBoxText: '#2f6b00', accent: '#fff35c', accent2: '#ff8a1e', card: '#ffffff', cardText: '#3f8f00' },
      { text: '#ffffff', em: '#fff27a', sub: '#fff0dc', stroke: null, shadow: 'rgba(120,40,0,.35)', emBox: '#ffffff', emBoxText: '#ff6a00', accent: '#fff27a', accent2: '#7cc41f', card: '#ffffff', cardText: '#ff6a00' },
    ],
    bg(ctx, t, v) {
      if (v === 0) { FX.gradient(ctx, ['#ffe45c', '#ffcf26'], 80); FX.citrus(ctx, t, 7, ['#ff8a1e', '#7cc41f', '#ff5a5a'], .5); }
      else if (v === 1) { FX.gradient(ctx, ['#9ad94a', '#5fb82a'], 100); FX.dots(ctx, t, '#ffffff', .16, 110, 14); FX.bubbles(ctx, t, 18, '#ffffff', .4); }
      else { FX.gradient(ctx, ['#ffa43a', '#ff7410'], 100); FX.citrus(ctx, t, 6, ['#ffd000', '#7cc41f', '#ffb000'], .45); FX.bubbles(ctx, t, 14, '#ffffff', .35); }
    },
    fx(ctx, t, v) { if (v === 0) FX.sparkles(ctx, t, 6, '#ffffff'); },
  },
  natural: {
    name: '내추럴 그린', font: 'hahmlet',
    pal: [
      { text: '#2f4a2a', em: '#4f8a3a', sub: '#6a6a55', stroke: null, shadow: null, emBox: '#4f7a3a', emBoxText: '#ffffff', accent: '#7aa35a', accent2: '#c9a46a', card: '#ffffff', cardText: '#3d6b2f' },
      { text: '#f3f0e4', em: '#c8e6a0', sub: '#cfd8c4', stroke: null, shadow: 'rgba(0,0,0,.45)', emBox: '#c8e6a0', emBoxText: '#173b2a', accent: '#c8e6a0', accent2: '#e8d6a8', card: '#f3f0e4', cardText: '#173b2a' },
      { text: '#24391e', em: '#c2551a', sub: '#3e5434', stroke: null, shadow: 'rgba(36,57,30,.15)', emBox: '#2f5a2a', emBoxText: '#ffffff', accent: '#2f5a2a', accent2: '#c2551a', card: '#ffffff', cardText: '#2f5a2a' },
    ],
    bg(ctx, t, v) {
      if (v === 0) { FX.paper(ctx, t, '#f4efe3'); FX.bigLeaves(ctx, t, '#8fb27a', .3); FX.leaves(ctx, t, 8, ['#8fb27a', '#b7c98f', '#c9a46a'], .7); }
      else if (v === 1) { FX.gradient(ctx, ['#1b4430', '#0f2a1e'], 110); FX.radial(ctx, W * .85, H * .05, H * .9, 'rgba(255,230,170,.18)', 'rgba(0,0,0,0)'); FX.bigLeaves(ctx, t, '#3f8a5a', .45); }
      else { FX.gradient(ctx, ['#d3e0c2', '#b9cca2'], 90); FX.bigLeaves(ctx, t, '#ffffff', .3); FX.leaves(ctx, t, 6, ['#6f9a55', '#ffffff'], .6); }
    },
    fx() { },
  },
  ocean: {
    name: '여름 바다', font: 'blackhan',
    pal: [
      { text: '#0a3d7a', em: '#ff5a5f', sub: '#1d5e9e', stroke: '#ffffff', strokeK: .12, shadow: 'rgba(0,60,120,.2)', emBox: '#ff5a5f', emBoxText: '#ffffff', accent: '#ff5a5f', accent2: '#0a6fd0', card: '#ffffff', cardText: '#0a6fd0' },
      { text: '#ffffff', em: '#7ff3ff', sub: '#cfeaff', stroke: null, shadow: 'rgba(0,20,60,.45)', emBox: '#7ff3ff', emBoxText: '#04265a', accent: '#7ff3ff', accent2: '#ffe36e', card: '#ffffff', cardText: '#0a4fa0' },
      { text: '#0b4a8a', em: '#ff7a1a', sub: '#2f6aa0', stroke: null, shadow: null, emBox: '#0aa0e0', emBoxText: '#ffffff', accent: '#0aa0e0', accent2: '#ff7a1a', card: '#ffffff', cardText: '#0b4a8a' },
    ],
    bg(ctx, t, v) {
      if (v === 0) { FX.gradient(ctx, ['#7fd8ff', '#c4f1ff'], 90); FX.radial(ctx, W * .82, H * .12, H * .5, 'rgba(255,255,220,.7)', 'rgba(255,255,255,0)'); FX.waves(ctx, t, ['rgba(0,170,230,.45)', 'rgba(0,130,210,.6)', 'rgba(0,100,190,.8)']); }
      else if (v === 1) { FX.gradient(ctx, ['#0a74d8', '#063e8a', '#04265a'], 90); FX.rays(ctx, t * .5, W * .6, -H * .25, '#bff4ff', 14, .07); FX.bubbles(ctx, t, 26, '#ffffff', .45); }
      else { FX.gradient(ctx, ['#e6fbff', '#d4f3ff', '#fff1d6'], 90); FX.waves(ctx, t, ['rgba(120,220,255,.35)', 'rgba(80,200,240,.3)'], H * .8, 26); }
    },
    fx(ctx, t, v) { if (v !== 1) FX.sparkles(ctx, t, 6, '#ffffff'); },
  },
  candy: {
    name: '캔디 도트', font: 'bagel',
    pal: [
      { text: '#ffffff', em: '#fff36e', sub: '#ffffff', stroke: '#e0418a', strokeK: .14, shadow: 'rgba(150,20,80,.3)', emBox: '#ffffff', emBoxText: '#ff3f8e', accent: '#fff36e', accent2: '#7fd8ff', card: '#ffffff', cardText: '#ff3f8e' },
      { text: '#ffffff', em: '#ff5fa2', sub: '#ffffff', stroke: '#1f9d8a', strokeK: .14, shadow: 'rgba(0,90,80,.25)', emBox: '#ff5fa2', emBoxText: '#ffffff', accent: '#ff5fa2', accent2: '#fff36e', card: '#ffffff', cardText: '#1f9d8a' },
      { text: '#5a3dc8', em: '#ff4f9a', sub: '#5a3dc8', stroke: '#ffffff', strokeK: .14, shadow: 'rgba(90,60,200,.2)', emBox: '#5a3dc8', emBoxText: '#ffffff', accent: '#ff4f9a', accent2: '#5a3dc8', card: '#ffffff', cardText: '#5a3dc8' },
    ],
    bg(ctx, t, v) {
      if (v === 0) { ctx.fillStyle = '#ff8fc0'; ctx.fillRect(0, 0, W, H); FX.dots(ctx, t, '#ffffff', .32, 130, 20); }
      else if (v === 1) { ctx.fillStyle = '#7fe3d0'; ctx.fillRect(0, 0, W, H); FX.stripes(ctx, t * .6, ['rgba(255,255,255,.3)', 'rgba(255,255,255,0)'], 1); }
      else { FX.gradient(ctx, ['#d8c8ff', '#c2adff'], 90); FX.confetti(ctx, t, 60, ['#ff4f9a', '#fff36e', '#7fe3d0', '#ffffff'], { alpha: .85 }); }
    },
    fx(ctx, t, v) { if (v === 0) FX.sparkles(ctx, t, 6, '#ffffff'); },
  },
  tech: {
    name: '테크 블루프린트', font: 'dohyeon',
    pal: [
      { text: '#ffffff', em: '#4fe3ff', sub: '#a9c8ff', stroke: null, shadow: 'rgba(0,0,0,.4)', emBox: '#4fe3ff', emBoxText: '#071a3a', accent: '#4fe3ff', accent2: '#ffffff', card: '#0f2a55', cardText: '#4fe3ff' },
      { text: '#ffffff', em: '#29ffb8', sub: '#9fb3c8', stroke: null, shadow: 'rgba(0,0,0,.5)', emBox: '#29ffb8', emBoxText: '#05070d', accent: '#29ffb8', accent2: '#4fa3ff', card: '#0d131f', cardText: '#29ffb8' },
      { text: '#0b1f3f', em: '#1f6fff', sub: '#3a4f6a', stroke: null, shadow: null, emBox: '#0b1f3f', emBoxText: '#ffffff', accent: '#1f6fff', accent2: '#0b1f3f', card: '#ffffff', cardText: '#1f6fff' },
    ],
    bg(ctx, t, v) {
      if (v === 0) { FX.gradient(ctx, ['#071a3a', '#0b2a5a'], 120); FX.blueprint(ctx, t, '#5ad1ff', .14); FX.radial(ctx, W * .62, H * .5, H * .8, 'rgba(60,160,255,.2)', 'rgba(0,0,0,0)'); }
      else if (v === 1) { ctx.fillStyle = '#05070d'; ctx.fillRect(0, 0, W, H); FX.circuit(ctx, t, '#29ffb8', .28); FX.vignette(ctx, .55); }
      else { FX.gradient(ctx, ['#eef3f9', '#dde7f3'], 90); FX.blueprint(ctx, t, '#2a6ad0', .1); }
    },
    fx() { },
  },
  hanga: {
    name: '명절 한가위', font: 'myeongjo',
    pal: [
      { text: '#fff6e0', em: '#f2c86a', sub: '#f3d9b0', stroke: null, shadow: 'rgba(0,0,0,.45)', emBox: '#f2c86a', emBoxText: '#5e0710', accent: '#f2c86a', accent2: '#fff6e0', card: '#fff6e0', cardText: '#8a0f1a' },
      { text: '#fff6e0', em: '#ffd77a', sub: '#cfd6ee', stroke: null, shadow: 'rgba(0,0,0,.5)', emBox: '#c8102e', emBoxText: '#fff6e0', accent: '#ffd77a', accent2: '#c8102e', card: '#fff6e0', cardText: '#0d1838' },
      { text: '#3a1a10', em: '#c8102e', sub: '#6a4a30', stroke: null, shadow: null, emBox: '#c8102e', emBoxText: '#fff6e0', accent: '#c8102e', accent2: '#b8862e', card: '#ffffff', cardText: '#c8102e' },
    ],
    bg(ctx, t, v) {
      if (v === 0) { FX.gradient(ctx, ['#931320', '#5e0710'], 100); FX.seigaiha(ctx, t, '#6e0a14', 'rgba(232,194,106,.4)', Math.min(W, H) * .075, H * .72, H); FX.goldFrame(ctx, t, '#e2b25a'); }
      else if (v === 1) { FX.gradient(ctx, ['#0d1838', '#16264f'], 90); FX.stars(ctx, t, 90); FX.moon(ctx, W * .8, H * .27, Math.min(W, H) * .14); FX.clouds(ctx, t, '#e2b25a', .22); }
      else { FX.paper(ctx, t, '#f7efdc'); FX.seigaiha(ctx, t, '#f7efdc', 'rgba(200,16,46,.2)', Math.min(W, H) * .07, 0, H * .2); }
    },
    fx(ctx, t, v) { if (v === 0) FX.sparkles(ctx, t, 6, '#ffe7a8'); },
  },
  news: {
    name: '긴급 속보', font: 'blackhan',
    pal: [
      { text: '#ffffff', em: '#ffde2a', sub: '#c8d0e0', stroke: null, shadow: 'rgba(0,0,0,.5)', emBox: '#e8101e', emBoxText: '#ffffff', accent: '#e8101e', accent2: '#ffde2a', card: '#ffffff', cardText: '#e8101e' },
      { text: '#ffffff', em: '#ffde2a', sub: '#ffe0e0', stroke: null, shadow: 'rgba(70,0,0,.4)', emBox: '#111111', emBoxText: '#ffde2a', accent: '#111111', accent2: '#ffde2a', card: '#ffffff', cardText: '#e8101e' },
      { text: '#111827', em: '#e8101e', sub: '#374151', stroke: null, shadow: null, emBox: '#e8101e', emBoxText: '#ffffff', accent: '#e8101e', accent2: '#1d3b8a', card: '#ffffff', cardText: '#e8101e' },
    ],
    bg(ctx, t, v) {
      const ty = STAGE === 'tong' ? H * .14 : 110, th = STAGE === 'tong' ? 90 : 50;
      if (v === 0) { FX.gradient(ctx, ['#0a0f1f', '#16203a'], 110); FX.dotGlobe(ctx, t, W * .78, H * .56, Math.min(W, H) * .42, '#4f7dff', .35); FX.lightSweep(ctx, t, '#9fb8ff', 5); FX.newsTicker(ctx, t, ty, th, '#e8101e', '#ffffff'); }
      else if (v === 1) { FX.gradient(ctx, ['#ec1b28', '#b5000f'], 100); FX.halftone(ctx, t, '#000000', .1, 28); FX.newsTicker(ctx, t, ty, th, '#111111', '#ffde2a'); }
      else { ctx.fillStyle = '#f4f5f7'; ctx.fillRect(0, 0, W, H); FX.hairlines(ctx, '#1d3b8a', .07, 90); FX.newsTicker(ctx, t, ty, th, '#e8101e', '#ffffff'); }
    },
    fx() { },
  },
});

// 새 테마에 어울리는 스타일 프리셋 (오른쪽 '스타일'과 '여러 스타일로 한 번에 뽑기'에 들어감)
Object.assign(STYLES, {
  mono: { name: '미니멀 모노', theme: 'mono', font: 'gothica1', feel: '보통', motions: ['슬라이드', '블러', '타이핑', '슬라이드'], trans: ['밀기', '컷', '디졸브'], fx: [], blockFx: { 가격: ['스포트라이트'] }, impact: ['기울임', '박스'], props: false,
    copy: { hookA: ['군더더기 없이', '딱 필요한 것만', '오늘의 제안'], hookB: ['*심플한* 특가', '*정답*은 하나', '*지금* 이 가격'], impact: ['정가 파괴', '단독가', '최저가'] } },
  sunset: { name: '선셋 그라데이션', theme: 'sunset', font: 'sunflower', feel: '부드럽게', motions: ['블러', '웨이브', '슬라이드', '팝'], trans: ['디졸브', '줌', '밀기'], fx: [], blockFx: { 가격: ['빛번짐'], 상품: ['렌즈플레어'] },
    copy: { hookA: ['떠나고 싶은 날', '여행 같은 하루', '오늘의 설렘'], hookB: ['*설레는* 특가', '*황금빛* 혜택', '*단 하루* 찬스'], impact: ['특가', '한정', '단독'] } },
  citrus: { name: '비타민 시트러스', theme: 'citrus', font: 'jua', feel: '보통', motions: ['바운스', '팝', '드롭', '웨이브'], trans: ['원형', '와이프', '줌'], fx: [], blockFx: { 가격: ['거품'], 훅: ['반짝이'] }, impact: ['박스', '반복'],
    copy: { hookA: ['상큼하게', '톡 쏘는', '비타민 충전'], hookB: ['*상큼한* 가격', '*과즙 팡팡* 특가', '*싱싱한* 찬스'], impact: ['상큼특가', '제철', '산지직송'] } },
  natural: { name: '내추럴 그린', theme: 'natural', font: 'hahmlet', feel: '부드럽게', motions: ['블러', '슬라이드', '타이핑', '블러'], trans: ['디졸브', '밀기'], fx: [], blockFx: { 가격: ['빛번짐'] }, impact: ['기울임', '박스'], props: false,
    copy: { hookA: ['자연 그대로', '몸이 먼저 아는', '건강한 습관'], hookB: ['*자연*을 담았다', '*건강한* 선택', '*깨끗한* 성분'], impact: ['유기농', '무첨가', '자연주의'] } },
  ocean: { name: '여름 바다', theme: 'ocean', font: 'blackhan', feel: '보통', motions: ['웨이브', '드롭', '팝', '슬라이드'], trans: ['밀기', '원형', '와이프'], fx: [], blockFx: { 가격: ['거품'], 훅: ['반짝이'] }, impact: ['박스', '분리'],
    copy: { hookA: ['더위 탈출', '이 여름', '시원하게'], hookB: ['*쿨한* 가격', '*시원한* 특가', '*여름* 한정'], impact: ['쿨특가', '여름한정', '초특가'] } },
  candy: { name: '캔디 도트', theme: 'candy', font: 'bagel', feel: '강하게', motions: ['바운스', '팝', '회전', '드롭'], trans: ['원형', '블라인드', '와이프'], fx: [], blockFx: { 가격: ['하트', '별'], 훅: ['풍선'], 한정: ['풍선'] }, impact: ['박스', '반복'],
    copy: { hookA: ['우리 아이', '달콤한', '두근두근'], hookB: ['*달콤한* 가격', '*깜짝* 특가', '*선물* 같은 구성'], impact: ['깜짝특가', '선물', '대박'] } },
  tech: { name: '테크 블루프린트', theme: 'tech', font: 'dohyeon', feel: '보통', motions: ['슬라이드', '타이핑', '줌인', '글리치'], trans: ['밀기', '글리치', '와이프'], fx: [], blockFx: { 가격: ['스캔라인'], 강조: ['네온테두리'] }, impact: ['박스', '기울임'],
    copy: { hookA: ['스펙으로 증명', '똑똑한 선택', '신제품 출시'], hookB: ['*스마트* 특가', '*역대급* 스펙', '*최신형* 찬스'], impact: ['최신형', '신모델', '역대급'] } },
  hanga: { name: '명절 한가위', theme: 'hanga', font: 'myeongjo', feel: '부드럽게', motions: ['블러', '슬라이드', '팝', '블러'], trans: ['디졸브', '와이프', '줌'], fx: [], blockFx: { 가격: ['금가루'], 상품: ['빛번짐'] }, impact: ['박스', '기울임'], props: false,
    copy: { hookA: ['마음을 전하는', '풍성한 한가위', '정성 가득'], hookB: ['*명절* 선물 특가', '*감사*의 마음', '*풍성한* 구성'], impact: ['명절특가', '선물세트', '감사특가'] } },
  news: { name: '긴급 속보', theme: 'news', font: 'blackhan', feel: '강하게', motions: ['슬라이드', '스탬프', '줌인', '글리치'], trans: ['컷', '플래시', '밀기'], fx: [], blockFx: { 훅: ['플래시'], 가격: ['집중선'], 한정: ['글리치'] }, impact: ['박스', '반복'],
    copy: { hookA: ['긴급 속보', '방금 들어온 소식', '지금 확인하세요'], hookB: ['*역대 최저가* 등장', '*단독* 특가 편성', '*가격 붕괴*'], impact: ['속보', '최저가', '가격붕괴'] } },
});
Object.assign(TONG_STYLE_FRAME, { mono: '테두리', sunset: '카드', citrus: '코너', natural: '없음', ocean: '카드', candy: '코너', tech: '네온', hanga: '테두리', news: '테두리' });
// 상품 정보에 이런 말이 있으면 자동으로 이 테마 (기존 규칙보다 먼저 봄)
MOOD_RULES.unshift(
  [/명절|추석|설날|한가위|선물세트|효도/, 'hanga'],
  [/속보|긴급편성|가격붕괴/, 'news'],
  [/비타민|오렌지|레몬|귤|한라봉|자몽|주스|상큼/, 'citrus'],
  [/여름|바다|시원|냉감|쿨링|아쿠아|물놀이|선풍기/, 'ocean'],
  [/유기농|친환경|비건|자연|허브|녹차|건강|영양제|홍삼|유산균/, 'natural'],
  [/노트북|태블릿|스마트|휴대폰|이어폰|블루투스|로봇|전자|무선/, 'tech'],
  [/키즈|유아|어린이|장난감|간식|젤리|사탕|아기/, 'candy'],
  [/여행|휴가|호텔|리조트|패키지|크루즈/, 'sunset'],
  [/미니멀|모던|심플|가구|인테리어|조명/, 'mono'],
);
