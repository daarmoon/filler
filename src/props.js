// ===== props.js : 소품 그래픽 (사이렌, 알람시계, TV, 선물상자, 말풍선, 화살표) =====
const Props = {
  siren(ctx, x, y, s, t, appear = 1) {
    if (appear <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * Ease.outBack(appear), s * Ease.outBack(appear));
    const pulse = .5 + .5 * Math.sin(t * 14);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = .5 + .5 * pulse;
    ctx.drawImage(glowSprite('#ff2020', 128, .15), -200, -230, 400, 400);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    // 회전 광선
    ctx.save(); ctx.rotate(t * 6); ctx.fillStyle = 'rgba(255,80,60,.25)';
    for (let i = 0; i < 2; i++) { ctx.rotate(Math.PI); ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(260, -110); ctx.lineTo(260, 30); ctx.fill(); }
    ctx.restore();
    // 받침
    ctx.fillStyle = '#2a2a2a'; roundRect(ctx, -70, 30, 140, 34, 8); ctx.fill();
    // 돔
    const g = ctx.createLinearGradient(-60, -80, 60, 30); g.addColorStop(0, '#ff8a7a'); g.addColorStop(.4, '#ff1a1a'); g.addColorStop(1, '#a00000');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-58, 32); ctx.lineTo(-58, -20); ctx.arc(0, -20, 58, Math.PI, 0); ctx.lineTo(58, 32); ctx.closePath(); ctx.fill();
    ctx.fillStyle = `rgba(255,255,255,${.35 + .4 * pulse})`; ctx.beginPath(); ctx.ellipse(-22, -30, 12, 30, -.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  clock(ctx, x, y, s, t, appear = 1, color = '#ff6a1a') {
    if (appear <= 0) return;
    const shake = Math.sin(t * 40) * .08;
    ctx.save(); ctx.translate(x, y); ctx.rotate(shake); const sc = s * Ease.outBack(appear); ctx.scale(sc, sc);
    ctx.fillStyle = color; // 종
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(d * 62, -78, 34, Math.PI, 0); ctx.fill(); }
    ctx.fillStyle = '#333'; ctx.fillRect(-5, -118, 10, 20);
    for (const d of [-1, 1]) { ctx.save(); ctx.translate(d * 55, 92); ctx.rotate(d * .5); ctx.fillRect(-6, 0, 12, 30); ctx.restore(); }
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, 100, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 80, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#222'; ctx.lineWidth = 5;
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 66, Math.sin(a) * 66); ctx.lineTo(Math.cos(a) * 74, Math.sin(a) * 74); ctx.stroke(); }
    ctx.lineCap = 'round';
    ctx.save(); ctx.rotate(t * 1.2); ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -42); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.rotate(t * 9); ctx.lineWidth = 4; ctx.strokeStyle = '#e00'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -62); ctx.stroke(); ctx.restore();
    ctx.restore();
  },
  // TV 프레임: 내용 영역 rect 주위 베젤 + 받침대. 프레임 안은 투명(씬 내용이 비침)
  tv(ctx, r, appear = 1) {
    if (appear <= 0) return;
    const e = Ease.outCubic(appear);
    ctx.save(); ctx.globalAlpha = e;
    const b = 22; ctx.fillStyle = '#16161a';
    ctx.beginPath(); ctx.rect(r.x - b, r.y - b, r.w + b * 2, r.h + b * 2); ctx.rect(r.x, r.y, r.w, r.h); ctx.fill('evenodd');
    ctx.fillStyle = '#2a2a30'; ctx.fillRect(r.x + r.w / 2 - 120, r.y + r.h + b, 240, 16);
    ctx.fillStyle = '#16161a'; ctx.fillRect(r.x + r.w / 2 - 220, r.y + r.h + b + 16, 440, 10);
    ctx.restore();
  },
  tvScreen(ctx, r, color, t) { // TV 화면 배경
    const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
    g.addColorStop(0, mix(color, '#ffffff', .25)); g.addColorStop(1, color);
    ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip(); FX.lightSweep(ctx, t, '#ffffff', 2.5); ctx.restore();
  },
  gift(ctx, x, y, s, t, appear = 1, color = '#e8202a') {
    if (appear <= 0) return;
    ctx.save(); ctx.translate(x, y + Math.sin(t * 3) * 6); ctx.rotate(Math.sin(t * 2) * .08); const sc = s * Ease.outBack(appear); ctx.scale(sc, sc);
    ctx.fillStyle = color; ctx.fillRect(-80, -40, 160, 120); ctx.fillStyle = mix(color, '#000000', .2); ctx.fillRect(-90, -70, 180, 40);
    ctx.fillStyle = '#ffd34a'; ctx.fillRect(-14, -70, 28, 150); ctx.fillRect(-80, 8, 160, 22);
    ctx.beginPath(); ctx.ellipse(-30, -84, 34, 18, -.4, 0, Math.PI * 2); ctx.ellipse(30, -84, 34, 18, .4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  bubble(ctx, x, y, r, text, font, bg, fg, appear = 1) { // 동그란 말풍선 (예: "단,")
    if (appear <= 0) return;
    ctx.save(); ctx.translate(x, y); const sc = Ease.outBack(appear); ctx.scale(sc, sc);
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(r * .35, r * .8); ctx.lineTo(r * .9, r * 1.25); ctx.lineTo(r * .78, r * .45); ctx.fill();
    setFont(ctx, font, r * 1.05); ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, r * .06); ctx.restore();
    reportBox(x - r, y - r, r * 2, r * 2.2, text);
  },
  arrow(ctx, x, y, s, dir, color, t, appear = 1) {
    if (appear <= 0) return;
    ctx.save(); ctx.translate(x, y + Math.sin(t * 6) * 10 * dir); if (dir > 0) ctx.rotate(Math.PI); const sc = s * Ease.outBack(appear); ctx.scale(sc, sc);
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, -90); ctx.lineTo(70, -10); ctx.lineTo(26, -10); ctx.lineTo(26, 90); ctx.lineTo(-26, 90); ctx.lineTo(-26, -10); ctx.lineTo(-70, -10); ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  bracket(ctx, r, color, appear = 1, lw = 10) {
    if (appear <= 0) return;
    const e = Ease.outCubic(appear), arm = 50;
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.globalAlpha = e;
    const dx = (1 - e) * 60;
    ctx.beginPath(); ctx.moveTo(r.x - dx + arm, r.y); ctx.lineTo(r.x - dx, r.y); ctx.lineTo(r.x - dx, r.y + r.h); ctx.lineTo(r.x - dx + arm, r.y + r.h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(r.x + r.w + dx - arm, r.y); ctx.lineTo(r.x + r.w + dx, r.y); ctx.lineTo(r.x + r.w + dx, r.y + r.h); ctx.lineTo(r.x + r.w + dx - arm, r.y + r.h); ctx.stroke();
    ctx.restore();
  },
  // 이미지가 없을 때 쓰는 기본 상품 실루엣 (박스)
  placeholder(ctx, cx, cy, w, h, color, label) {
    ctx.save(); ctx.fillStyle = rgba('#ffffff', .9); roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 18); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.setLineDash([12, 10]); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = color; ctx.font = `700 ${Math.min(w, h) * .14}px 'Noto Sans KR', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label || 'IMAGE', cx, cy); ctx.restore();
  },
};
