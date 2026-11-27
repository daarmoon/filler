// ===== blocks.js : 씬 블록 10+1종 =====
// e = { A:영역, P:팔레트, F:폰트, lt:씬 로컬시간, D:씬 길이, t:전체시간, v:배경변형, img(name), motion, opts }

function roleStyle(e, role, size) {
  const P = e.P;
  const sk = e.th.skew || 0;
  if (role === 'sub') return { font: e.F, color: P.sub, em: P.em, shadow: P.shadow, stroke: P.stroke, strokeW: size * (P.strokeK || .12), shadowOff: P.shadowOff, glow: P.glow, skew: sk };
  if (role === 'note') return { font: SUBFONT, color: P.sub, em: P.em, alpha: .92 };
  if (role === 'box') return { font: e.F, color: P.text, em: P.em, emBox: P.emBox, emBoxText: P.emBoxText, shadow: null, stroke: null };
  return { font: e.F, color: P.text, em: P.em, shadow: P.shadow, stroke: P.stroke, strokeW: size * (P.strokeK || .13), shadowOff: P.shadowOff, emBox: e.opts.강조박스 === '켬' ? P.emBox : null, emBoxText: P.emBoxText, glow: P.glow, gradient: P.gradient, skew: sk };
}

// 여러 줄 세로 스택 (영역 중앙 정렬)
function drawStack(ctx, e, items, cx, cy, maxW, align = 'center', maxH) {
  const gap = .16; maxH = maxH || e.A.h;
  let sizes = items.map(it => Math.min(it.size, fitSize(ctx, it.text, it.font || (it.role === 'note' ? SUBFONT : e.F), it.size, maxW)));
  let total = sizes.reduce((a, s, i) => a + s * 1.1 + (i ? s * gap : 0), 0);
  if (total > maxH) { const k = maxH / total; sizes = sizes.map(s => s * k); total = maxH; }
  let y = cy - total / 2;
  const out = [];
  items.forEach((it, i) => {
    const s = sizes[i]; if (i) y += s * gap;
    const st = roleStyle(e, it.role || 'main', s);
    const r = drawText(ctx, it.text, Object.assign(st, { x: cx, y: y + s * .55, size: s, align, motion: it.motion || e.motion, t: e.lt, delay: it.delay ?? (0.08 + i * 0.32), maxW }, it.extra || {}));
    out.push(r); y += s * 1.1;
  });
  return out;
}

function sideProps(ctx, e, box, kind, appearT = 0.5) {
  if (!kind || kind === '없음' || !box) return;
  const ap = prog(e.lt, appearT, .4), s = clamp(box.h / 190, .55, 1.1);
  const lx = Math.max(box.x - 130 * s, e.A.x + 60 * s), rx = Math.min(box.x + box.w + 130 * s, e.A.x + e.A.w - 60 * s), y = box.y + box.h / 2;
  if (kind.includes('사이렌')) { Props.siren(ctx, lx, y, s * .9, e.t, ap); Props.siren(ctx, rx, y, s * .9, e.t, ap); }
  if (kind.includes('시계')) { Props.clock(ctx, lx - 10, y + 30, s * .8, e.t, ap, e.P.accent2 === '#ffffff' ? '#ff6a1a' : '#ff6a1a'); Props.clock(ctx, rx + 10, y + 60, s * .55, e.t + .3, prog(e.lt, appearT + .2, .4)); }
  if (kind.includes('선물')) { Props.gift(ctx, lx, y + 20, s * .8, e.t, ap); Props.gift(ctx, rx, y + 40, s * .6, e.t + 1, prog(e.lt, appearT + .15, .4), '#3a7bff'); }
  if (kind.includes('화살표위')) { Props.arrow(ctx, rx, y, s * .9, -1, e.P.accent, e.t, ap); }
  if (kind.includes('화살표아래')) { Props.arrow(ctx, lx, y, s * .9, 1, e.P.accent, e.t, ap); }
}

function splitLines(sc) { return sc.lines.filter(l => l.trim() !== '').map(l => l.replace(/^\s*\((외곽|박스|테이프|입체|자간|작게|크게)\)\s*/, '')); }

const BLOCKS = {
  hook: {
    name: '훅 카피', weight: 2.6, help: '줄1 작은 문구 / 줄2 큰 문구 …  (한 줄이면 전부 크게)',
    sample: '[훅] 살랑살랑~ / *봄바람* 몰고',
    render(ctx, sc, e) {
      const L = splitLines(sc); const same = e.opts.크기 === '동일' || L.length === 1;
      const items = L.map((t, i) => ({ text: t, size: same ? (L.length > 2 ? 170 : 220) : (i === 0 ? 92 : 210), role: !same && i === 0 ? 'sub' : 'main' }));
      const bx = drawStack(ctx, e, items, e.A.cx, e.A.cy, e.A.w);
      sideProps(ctx, e, bx[bx.length - 1], e.opts.소품, .1 + L.length * .32);
    },
  },
  counter: {
    name: '실적 카운트업', weight: 3.2, help: '위 문구 / 숫자+단위 (자동으로 0부터 올라감) / 아래 문구',
    sample: '[실적] 마데카크림 / 100,000,000통 / *판매 돌파!*',
    render(ctx, sc, e) {
      const L = splitLines(sc);
      let ni = L.findIndex(l => /\d/.test(l)); if (ni < 0) ni = 0;
      const line = plain(L[ni]); const m = line.match(/[\d][\d,\.]*/);
      const target = m ? parseFloat(m[0].replace(/,/g, '')) : 0; const decimals = m && m[0].includes('.') ? m[0].split('.')[1].length : 0;
      const p = Ease.outQuart(prog(e.lt, .35, 1.3));
      const cur = (target * p).toLocaleString('ko-KR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      const numText = m ? line.slice(0, m.index) + '*' + cur + '*' + line.slice(m.index + m[0].length) : line;
      const items = [];
      L.forEach((t, i) => {
        if (i < ni) items.push({ text: t, size: 92, role: 'sub', delay: .05 });
        else if (i === ni) items.push({ text: numText, size: 230, role: 'main', motion: 'none', delay: 0, extra: { tracking: -.02 } });
        else items.push({ text: t, size: 170, role: 'main', delay: 1.6 + (i - ni - 1) * .3, motion: 'stamp' });
      });
      // 숫자 줄 펀치
      const settle = prog(e.lt, 1.6, .35);
      ctx.save();
      const punch = 1 + Math.sin(settle * Math.PI) * .08;
      ctx.translate(e.A.cx, e.A.cy); ctx.scale(punch, punch); ctx.translate(-e.A.cx, -e.A.cy);
      const a0 = prog(e.lt, .2, .3); ctx.globalAlpha = a0;
      const bx = drawStack(ctx, e, items, e.A.cx, e.A.cy, e.A.w);
      ctx.restore();
      FX.confetti(ctx, e.lt, 70, [e.P.accent, e.P.accent2, '#ffffff', '#ffd84f'], { burst: 1.62, x: e.A.cx, y: bx[Math.min(ni, bx.length - 1)].y + 80 });
    },
  },
  product: {
    name: '상품/브랜드 소개', weight: 3, help: '문구 줄들  {이미지: 이름, 위치: 좌|우}',
    sample: '[상품] 더 커진 *왕특대형* / *업그레이드* / *최신상!* {이미지: 상품1, 위치: 우}',
    render(ctx, sc, e) {
      const L = splitLines(sc); const img = e.img(e.opts.이미지);
      if (!img) {
        const items = L.map((t, i) => ({ text: t, size: L.length > 2 ? 160 : 200, role: 'main' }));
        drawStack(ctx, e, items, e.A.cx, e.A.cy, e.A.w); return;
      }
      const right = e.opts.위치 !== '좌';
      const iw = e.A.w * .46, tw = e.A.w * .5;
      const icx = right ? e.A.x + e.A.w - iw / 2 : e.A.x + iw / 2;
      const tcx = right ? e.A.x + tw / 2 : e.A.x + e.A.w - tw / 2;
      const ap = Ease.outCubic(prog(e.lt, .05, .6));
      drawImageFit(ctx, img, icx + (1 - ap) * (right ? 300 : -300), e.A.cy + Math.sin(e.t * 1.5) * 8, iw, e.A.h * .95, { alpha: ap, shadow: true });
      const items = L.map((t, i) => ({ text: t, size: i === 0 && L.length > 2 ? 84 : 150, role: i === 0 && L.length > 2 ? 'sub' : 'main', delay: .35 + i * .3 }));
      drawStack(ctx, e, items, tcx, e.A.cy, tw);
    },
  },
  impact: {
    name: '강조 타이포', weight: 2.8, help: '스타일: 분리(최|다|구|성), 반복, 기울임, 박스',
    sample: '[강조] 방송에서만 / 최|다|구|성 {스타일: 분리, 소품: TV}',
    render(ctx, sc, e) {
      const L = splitLines(sc);
      let style = e.opts.스타일 || (L.some(l => l.includes('|')) ? '분리' : '기울임');
      const A = e.A;
      if (style === '분리') {
        const rows = L.map(l => l.includes('|') ? { parts: l.split('|'), size: 200 } : { text: l, size: 84 });
        const total = rows.reduce((a, r) => a + r.size * 1.25, 0); let y = A.cy - total / 2; let k = 0;
        rows.forEach((r, ri) => {
          const s0 = r.size; y += s0 * .62;
          if (r.text) { drawText(ctx, r.text, Object.assign(roleStyle(e, 'sub', s0), { x: A.cx, y, size: s0, motion: e.motion, t: e.lt, delay: .05 + ri * .3, maxW: A.w })); }
          else {
            const pieces = r.parts.map(p => p.trim());
            const joined = pieces.join('/');
            const s = Math.min(s0, fitSize(ctx, joined, e.F, s0, A.w * .95));
            setFont(ctx, e.F, s); const slashW = ctx.measureText('/').width;
            const ws = pieces.map(p => ctx.measureText(plain(p)).width); const tot = ws.reduce((a, b) => a + b, 0) + slashW * (pieces.length - 1);
            let x = A.cx - tot / 2;
            pieces.forEach((p, i) => {
              const st = roleStyle(e, 'main', s);
              drawText(ctx, (p.includes('*') ? p : '*' + p + '*'), Object.assign(st, { x: x + ws[i] / 2, y, size: s, motion: 'stamp', t: e.lt, delay: .15 + k * .13 }));
              x += ws[i]; k++;
              if (i < pieces.length - 1) {
                const ap = prog(e.lt, .15 + k * .13 - .05, .2);
                ctx.save(); ctx.globalAlpha = ap; setFont(ctx, e.F, s); ctx.fillStyle = e.P.text; ctx.textAlign = 'center'; ctx.fillText('/', x + slashW / 2, y + s * .36); ctx.restore();
                x += slashW;
              }
            });
            reportBox(A.cx - tot / 2, y - s * .6, tot, s * 1.2, joined);
          }
          y += s0 * .63;
        });
      } else if (style === '반복') {
        const main = L[L.length - 1]; const s = Math.min(170, fitSize(ctx, main, e.F, 170, A.w));
        const step = s * 1.05, off = (e.lt * 40) % step;
        ctx.save(); ctx.beginPath(); ctx.rect(A.x - 40, A.y - 60, A.w + 80, A.h + 120); ctx.clip();
        for (let i = -3; i <= 3; i++) {
          if (i === 0) continue;
          drawText(ctx, plain(main), { font: e.F, x: A.cx, y: A.cy + i * step - off * Math.sign(i), size: s, color: e.P.em, outline: 2.5, motion: 'slide', t: e.lt, delay: .05 + Math.abs(i) * .08, alpha: .55 - Math.abs(i) * .06, label: '_bg' });
        }
        ctx.restore();
        const bg = e.P.text; // 가운데 채운 글자
        drawText(ctx, main, Object.assign(roleStyle(e, 'main', s), { x: A.cx, y: A.cy, size: s, motion: 'stamp', t: e.lt, delay: .5, maxW: A.w }));
        if (L.length > 1) drawText(ctx, L[0], Object.assign(roleStyle(e, 'sub', 64), { x: A.cx, y: A.cy - s * 1.0, size: 64, motion: e.motion, t: e.lt, delay: .8, maxW: A.w }));
      } else if (style === '기울임') {
        ctx.save(); ctx.translate(A.cx, A.cy); ctx.rotate(-0.12); ctx.translate(-A.cx, -A.cy);
        const wp = Ease.outCubic(prog(e.lt, 0, .35));
        ctx.fillStyle = rgba(e.P.accent, .9); ctx.save(); ctx.translate(A.cx, A.cy); ctx.transform(1, 0, -.45, 1, 0, 0);
        ctx.globalAlpha = .55; ctx.fillRect(-A.w * .4, -A.h * .05, A.w * .8 * wp, A.h * .32); ctx.restore();
        const items = L.map((t, i) => ({ text: t, size: i === 0 && L.length > 1 ? 70 : 230, role: i === 0 && L.length > 1 ? 'box' : 'main', motion: i === 0 && L.length > 1 ? 'slide' : 'stamp', delay: .1 + i * .22 }));
        if (items[0].role === 'box' && !items[0].text.includes('*')) items[0].text = '*' + items[0].text + '*';
        drawStack(ctx, e, items, A.cx, A.cy, A.w * .95);
        ctx.restore();
      } else { // 박스
        const items = L.map((t, i) => {
          const isBox = t.includes('*');
          return { text: t, size: isBox ? 230 : 120, role: isBox ? 'box' : 'main', motion: isBox ? 'pop' : e.motion, delay: .1 + i * .3 };
        });
        drawStack(ctx, e, items, A.cx, A.cy, A.w);
      }
    },
  },
  list: {
    name: '목록 연속', weight: 0, help: '제목(선택) / 항목1 @이미지, 항목2 @이미지, …  (항목마다 차례로)',
    sample: '[목록] 26년 상반기 인기 차종 / 카니발 @차1, 쏘렌토 @차2, 그랜저 @차3',
    weightFn: sc => { const it = listItems(sc); return .4 + it.items.length * 1.1; },
    render(ctx, sc, e) {
      const { title, items } = listItems(sc); const A = e.A;
      if (!items.length) return;
      const t0 = title ? .3 : 0; const per = (e.D - t0) / items.length;
      const i = clamp(Math.floor((e.lt - t0) / per), 0, items.length - 1); const lt = e.lt - t0 - i * per;
      const it = items[i]; const img = e.img(it.img);
      const ap = Ease.outCubic(prog(lt, 0, .35));
      // 배경 큰 외곽선 글자
      ctx.save(); ctx.globalAlpha = .18 * ap; setFont(ctx, e.F, 330); ctx.strokeStyle = e.P.text; ctx.lineWidth = 3; ctx.textAlign = 'center';
      ctx.strokeText(plain(it.text), A.cx - lt * 120, A.cy + 200); ctx.restore();
      const topY = A.y + (title ? 150 : 110);
      if (title) drawText(ctx, title, Object.assign(roleStyle(e, 'sub', 56), { x: A.cx, y: A.y + 40, size: 56, motion: 'slide', t: e.lt, delay: 0, maxW: A.w }));
      const nameX = img ? A.x + A.w * .3 : A.cx;
      drawText(ctx, it.text, Object.assign(roleStyle(e, 'main', 160), { x: nameX + (1 - ap) * 200, y: img ? topY : A.cy, size: 160, motion: 'none', alpha: ap, maxW: img ? A.w * .55 : A.w }));
      if (img) drawImageFit(ctx, img, A.x + A.w * .62 + (1 - ap) * 400, A.cy + 110, A.w * .7, A.h * .62, { alpha: ap, shadow: true });
    },
  },
  composition: {
    name: '구성표', weight: 4, help: '제목 / 항목 @이미지 x수량 + 항목 @이미지 x수량 / 아래 문구(선택)',
    sample: '[구성표] 총 *2개* 구성! / 16L 거실 추천 @휴지통1 + 12L 주방 추천 @휴지통2',
    render(ctx, sc, e) {
      const L = splitLines(sc); const A = e.A;
      let ii = L.findIndex(l => l.includes('+') || l.includes('@'));
      const title = ii === 0 ? null : L[0]; if (ii < 0) ii = 1;
      const note = L.slice(ii + 1).join(' ');
      const items = (L[ii] || '').split('+').map(s => parseItem(s)).filter(x => x.label || x.img);
      const titleS = 96; let top = A.y;
      if (title) { drawText(ctx, title, Object.assign(roleStyle(e, 'main', titleS), { x: A.cx, y: A.y + titleS * .55, size: titleS, motion: e.motion, t: e.lt, delay: .05, maxW: A.w })); top += titleS * 1.25; }
      const bottom = A.y + A.h - (note ? 60 : 0);
      const n = Math.max(items.length, 1), plusW = 70, cw = (A.w - 80 - plusW * (n - 1)) / n, ch = bottom - top - 30;
      const frame = { x: A.x + 20, y: top + 10, w: A.w - 40, h: ch + 10 };
      Props.bracket(ctx, frame, rgba(e.P.text, .6), prog(e.lt, .2, .5), 8);
      items.forEach((it, i) => {
        const cx = A.x + 40 + cw / 2 + i * (cw + plusW), d = .45 + i * .4, ap = prog(e.lt, d, .5), ea = Ease.outBack(ap);
        if (ap <= 0) return;
        const cy = top + 20 + ch / 2;
        ctx.save(); ctx.globalAlpha = clamp(ap * 2); ctx.translate(0, (1 - ea) * -120);
        // 라벨 알약
        if (it.label) {
          const ls = Math.min(40, fitSize(ctx, it.label, SUBFONT, 40, cw - 40));
          setFont(ctx, { family: SUBFONT.family, weight: 700 }, ls); const lw = ctx.measureText(plain(it.label)).width + 40;
          ctx.fillStyle = e.P.emBox; roundRect(ctx, cx - lw / 2, top + 22, lw, ls + 22, 10); ctx.fill();
          drawText(ctx, it.label, { font: { family: SUBFONT.family, weight: 700 }, x: cx, y: top + 22 + (ls + 22) / 2, size: ls, color: e.P.emBoxText, em: e.P.emBoxText, motion: 'none' });
        }
        const imgTop = top + 90, imgH = ch - 80, img = e.img(it.img);
        const q = Math.max(1, it.qty);
        if (img) {
          const cols = q <= 4 ? q : Math.ceil(Math.sqrt(q * 1.6)), rows = Math.ceil(q / cols);
          const gw = (cw - 20) / cols, gh = imgH / rows;
          for (let k = 0; k < q; k++) {
            const r = Math.floor(k / cols), c = k % cols, kp = prog(e.lt, d + .1 + k * .06, .3);
            if (kp <= 0) continue;
            drawImageFit(ctx, img, cx - (cw - 20) / 2 + gw * (c + .5), imgTop + gh * (r + .5), gw * .95, gh * .92, { scale: Ease.outBack(kp), shadow: true });
          }
          if (q > 1) drawText(ctx, `×${q}`, { font: e.F, x: cx + cw / 2 - 40, y: imgTop + imgH - 30, size: 64, color: e.P.em, stroke: '#ffffff', strokeW: 10, motion: 'pop', t: e.lt, delay: d + .3 });
        } else Props.placeholder(ctx, cx, imgTop + imgH / 2, cw * .8, imgH * .8, e.P.text, it.label ? plain(it.label).slice(0, 8) : '상품');
        ctx.restore();
        if (i < items.length - 1) {
          const pa = prog(e.lt, d + .3, .3);
          if (pa > 0) { const px = cx + cw / 2 + plusW / 2; ctx.save(); ctx.globalAlpha = pa; ctx.fillStyle = e.P.accent; ctx.beginPath(); ctx.arc(px, cy, 30 * Ease.outBack(pa), 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.fillRect(px - 15, cy - 4, 30, 8); ctx.fillRect(px - 4, cy - 15, 8, 30); ctx.restore(); }
        }
      });
      reportBox(frame.x, frame.y, frame.w, frame.h, '구성표');
      if (note) drawText(ctx, note, Object.assign(roleStyle(e, 'note', 36), { x: A.cx, y: A.y + A.h - 26, size: 36, motion: 'slide', t: e.lt, delay: .9, maxW: A.w }));
    },
  },
  benefits: {
    name: '혜택 리스트', weight: 3.6, help: '제목 / 혜택1 / 혜택2 / … (한 줄씩 카드로)',
    sample: '[혜택] *렌터카샵* 혜택 / 운전자보험 3년 지원 / 순회정비 서비스 3회 / 블랙박스 장착',
    render(ctx, sc, e) {
      const L = splitLines(sc); const A = e.A; const title = L.length > 1 ? L[0] : null; const rows = title ? L.slice(1) : L;
      let top = A.y;
      if (title) { drawText(ctx, title, Object.assign(roleStyle(e, 'main', 84), { x: A.cx, y: A.y + 46, size: 84, motion: e.motion, t: e.lt, delay: .05, maxW: A.w })); top += 115; }
      const n = rows.length, gap = 22, rh = Math.min(118, (A.y + A.h - top - gap * (n - 1)) / n), rw = A.w * .86;
      rows.forEach((r, i) => {
        const y = top + i * (rh + gap), d = .3 + i * .28, p = Ease.outCubic(prog(e.lt, d, .45));
        if (p <= 0) return;
        ctx.save(); ctx.beginPath(); ctx.rect(A.cx - rw / 2 - 10, y - 10, (rw + 20) * p, rh + 20); ctx.clip();
        ctx.fillStyle = e.P.card; ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
        roundRect(ctx, A.cx - rw / 2, y, rw, rh, 14); ctx.fill(); ctx.shadowColor = 'transparent';
        ctx.strokeStyle = rgba(e.P.cardText, .5); ctx.lineWidth = 3; ctx.setLineDash([10, 8]); roundRect(ctx, A.cx - rw / 2 + 10, y + 10, rw - 20, rh - 20, 10); ctx.stroke(); ctx.setLineDash([]);
        const s = Math.min(rh * .46, 56);
        drawText(ctx, r, { font: e.F, x: A.cx, y: y + rh / 2, size: s, color: e.P.cardText, em: e.P.accent === '#ffffff' ? '#d40000' : e.P.accent, motion: 'none', maxW: rw - 60 });
        ctx.restore();
        if (i < n - 1 && p > .9) { ctx.fillStyle = e.P.accent2; ctx.beginPath(); ctx.arc(A.cx, y + rh + gap / 2, 9, 0, Math.PI * 2); ctx.fill(); }
      });
    },
  },
  price: {
    name: '가격 공개', weight: 3.6, help: '앞 문구(예: 단,) / 가격 (예: 29,700원) / 조건 문구  {정가: 99,000원, 할인: 23%}',
    sample: '[가격] 단, / 29,700원 / (모바일 10% 할인 시)',
    render(ctx, sc, e) {
      const L = splitLines(sc); const A = e.A;
      let pi = L.findIndex(l => /\d[\d,]*\s*원/.test(plain(l))); if (pi < 0) pi = L.findIndex(l => /\d/.test(l)); if (pi < 0) pi = 0;
      const pre = L.slice(0, pi), post = L.slice(pi + 1);
      const raw = plain(L[pi]); const m = raw.match(/\d[\d,]*/);
      const before = m ? raw.slice(0, m.index) : '', num = m ? m[0] : raw, after = m ? raw.slice(m.index + num.length) : '';
      // 슬롯 회전
      const rollStart = .35, settleAt = 1.25;
      let shown = '';
      let di = 0;
      for (const ch of num) {
        if (/\d/.test(ch)) {
          const st = rollStart + .12 + di * .07, fin = settleAt + di * .05;
          if (e.lt < st) shown += ' '; else if (e.lt < fin) shown += String(Math.floor(rnd(Math.floor(e.lt * 24), di) * 10)); else shown += ch;
          di++;
        } else shown += e.lt < rollStart + .12 ? ' ' : ch;
      }
      const lastSettle = settleAt + Math.max(0, di - 1) * .05;
      const punch = prog(e.lt, lastSettle, .3);
      const bigS0 = 270;
      const sufS = .55;
      setFont(ctx, e.F, bigS0); const wNum = ctx.measureText(num.replace(/\d/g, '0')).width;
      setFont(ctx, e.F, bigS0 * sufS); const wPre = before ? ctx.measureText(before).width + 14 : 0;
      setFont(ctx, e.F, bigS0 * sufS); const wSuf = ctx.measureText(after).width;
      const totW0 = wPre + wNum + wSuf + 10; const k = Math.min(1, (A.w * .92) / totW0); const bigS = bigS0 * k;
      const totW = totW0 * k;
      const orig = e.opts.정가 ? plain(e.opts.정가).replace(/^(\D*)(\d{4,})(\D*)$/, (m, a, n, b) => a + Number(n).toLocaleString('ko-KR') + (b || '원')) : '', oH = orig ? 62 : 0;
      const preH = pre.length ? (pre.join('').length <= 3 ? 0 : 90) : 0, postH = post.length ? 60 : 0;
      const cy = A.cy + (preH + oH - postH) / 2 + (pre.length && pre.join('').length <= 3 ? 30 : 0);
      const x0 = A.cx - totW / 2;
      // 강조 바
      const bp = Ease.outCubic(prog(e.lt, lastSettle, .4));
      ctx.fillStyle = rgba(e.P.accent, .55); ctx.fillRect(x0 - 20, cy + bigS * .18, (totW + 40) * bp, bigS * .22);
      ctx.save();
      const sc2 = 1 + (1 - Ease.outCubic(punch)) * (punch > 0 ? .25 : 0);
      ctx.translate(A.cx, cy); ctx.scale(sc2, sc2); ctx.translate(-A.cx, -cy);
      ctx.globalAlpha = prog(e.lt, rollStart, .15);
      const st = roleStyle(e, 'main', bigS);
      if (before) drawText(ctx, before, Object.assign({}, st, { x: x0, y: cy + bigS * (1 - sufS) * .38, size: bigS * sufS, align: 'left', motion: 'none' }));
      // 숫자: 고정폭 배치로 흔들림 방지
      setFont(ctx, e.F, bigS); let x = x0 + wPre * k;
      for (const ch of shown) {
        const cw = ctx.measureText(/\d| /.test(ch) ? '0' : ch).width;
        if (ch !== ' ') drawText(ctx, '*' + ch + '*', Object.assign({}, st, { x: x + cw / 2, y: cy, size: bigS, motion: 'none', label: '_d' }));
        x += cw;
      }
      if (after) drawText(ctx, after, Object.assign({}, st, { x: x + 8, y: cy + bigS * (1 - sufS) * .38, size: bigS * sufS, align: 'left', motion: 'pop', t: e.lt, delay: lastSettle - .1 }));
      reportBox(x0, cy - bigS * .6, totW, bigS * 1.2, raw);
      ctx.restore();
      // 정가 (취소선) : 숫자가 굴러가기 전에 먼저 보이고, 가격이 멈추면 줄이 그어짐
      if (orig) {
        const os = 50, oy = cy - bigS * .62 - 22, oa = prog(e.lt, .1, .35);
        const ot = /정가/.test(orig) ? orig : '정가 ' + orig;
        const r = drawText(ctx, ot, Object.assign(roleStyle(e, 'note', os), { x: A.cx, y: oy, size: os, motion: 'slide', t: e.lt, delay: .1, maxW: A.w * .6 }));
        const sp = Ease.outCubic(prog(e.lt, lastSettle - .25, .35));
        if (sp > 0) { ctx.save(); ctx.globalAlpha = oa; ctx.strokeStyle = e.P.em; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(r.x - 8, oy + 2); ctx.lineTo(r.x - 8 + (r.w + 16) * sp, oy - 4); ctx.stroke(); ctx.restore(); }
      }
      // 할인율 동그라미 배지 (원 단위 위쪽)
      if (e.opts.할인) {
        const dp = prog(e.lt, lastSettle + .05, .45); if (dp > 0) {
          const pct = plain(e.opts.할인).replace(/\s/g, ''), label = /%|할인/.test(pct) ? pct.replace('할인', '') : pct + '%';
          const R = 64, bx = Math.min(x0 + totW - wSuf * k / 2, A.x + A.w - R), by = cy - bigS * .52 - (orig ? 6 : 0);
          ctx.save(); ctx.translate(bx, by); ctx.rotate(-.12 * (1 - Ease.outCubic(dp)) + .08); const s3 = Ease.outBack(dp); ctx.scale(s3, s3);
          ctx.fillStyle = e.P.emBox; ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill(); ctx.shadowColor = 'transparent';
          ctx.fillStyle = e.P.emBoxText; ctx.textAlign = 'center'; setFont(ctx, e.F, label.length > 3 ? 36 : 44); ctx.fillText(label, 0, 8); setFont(ctx, SUBFONT, 20); ctx.fillText('할인', 0, 36);
          ctx.restore(); reportBox(bx - R, by - R, R * 2, R * 2, '할인 ' + label);
        }
      }
      if (pre.length) {
        const ptxt = pre.join(' ');
        if (plain(ptxt).length <= 3) Props.bubble(ctx, x0 + 40, cy - bigS * .72 - oH, 78, plain(ptxt), e.F, e.P.emBox, e.P.emBoxText, prog(e.lt, .05, .4));
        else drawText(ctx, ptxt, Object.assign(roleStyle(e, 'sub', 76), { x: A.cx, y: cy - bigS * .7 - 30 - oH, size: 76, motion: e.motion, t: e.lt, delay: .05, maxW: A.w }));
      }
      if (post.length) drawText(ctx, post.join(' '), Object.assign(roleStyle(e, 'note', 44), { x: A.cx, y: cy + bigS * .62 + 40, size: 44, motion: 'slide', t: e.lt, delay: lastSettle + .2, maxW: A.w }));
      FX.confetti(ctx, e.lt, 80, [e.P.accent, e.P.accent2, '#ffffff', '#ffd84f'], { burst: lastSettle, x: A.cx, y: cy });
      if (punch > 0) FX.sparkles(ctx, e.t, 8, '#ffffff', { x: x0, y: cy - bigS * .6, w: totW, h: bigS * 1.2 });
    },
  },
  urgent: {
    name: '한정/긴급', weight: 3, help: '작은 문구 / 큰 문구 / 큰 문구  {소품: 사이렌|시계|선물|없음}',
    sample: '[한정] 놓치면 *후회해요!* / 보셨을때 / 구매필수 {소품: 사이렌}',
    render(ctx, sc, e) {
      const L = splitLines(sc); const A = e.A;
      const items = L.map((t, i) => ({ text: t, size: L.length >= 2 && i === 0 ? 84 : 200, role: L.length >= 2 && i === 0 ? 'sub' : 'main', motion: i === 0 ? e.motion : 'stamp', delay: .05 + i * .28 }));
      const shake = e.lt < 1.2 ? Math.sin(e.lt * 60) * 6 * (1 - e.lt / 1.2) : 0;
      ctx.save(); ctx.translate(shake, 0);
      const bx = drawStack(ctx, e, items, A.cx, A.cy, A.w * .78);
      ctx.restore();
      const kind = e.opts.소품 ?? '사이렌';
      sideProps(ctx, e, bx[Math.min(1, bx.length - 1)], kind, .3);
    },
  },
  cta: {
    name: '마무리 CTA', weight: 3, help: '문구 줄들  {이미지: 로고, 소품: 시계}',
    sample: '[CTA] 쇼핑은 / *타이밍* {소품: 시계}',
    render(ctx, sc, e) {
      const L = splitLines(sc); const A = e.A; const img = e.img(e.opts.이미지);
      const pulse = 1 + Math.sin(e.lt * 4) * .015;
      ctx.save(); ctx.translate(A.cx, A.cy); ctx.scale(pulse, pulse); ctx.translate(-A.cx, -A.cy);
      let cy = A.cy;
      if (img) { drawImageFit(ctx, img, A.cx, A.y + A.h * .2, A.w * .5, A.h * .3, { alpha: prog(e.lt, 0, .4), scale: Ease.outBack(prog(e.lt, 0, .5)) }); cy = A.cy + A.h * .15; }
      const items = L.map((t, i) => ({ text: t, size: L.length > 1 && i === 0 ? 150 : 210, role: 'main', motion: e.opts.모션 ? e.motion : 'slide', delay: .05 + i * .3 }));
      const bx = drawStack(ctx, e, items, A.cx, cy, A.w * .8);
      ctx.restore();
      sideProps(ctx, e, bx[bx.length - 1], e.opts.소품, .5);
    },
  },
  outro: {
    name: '로고 엔딩', weight: 3, help: '브랜드명(이미지 없을 때)  {이미지: 로고}',
    sample: '[로고] 브랜드명 {이미지: 로고}',
    render(ctx, sc, e) {
      const A = e.A; const img = e.img(e.opts.이미지); const ap = prog(e.lt, .2, .8);
      ctx.save(); ctx.globalAlpha = Ease.outCubic(ap) * (1 - prog(e.lt, e.D - .5, .5) * .0);
      if (img) drawImageFit(ctx, img, A.cx, A.cy, A.w * .5, A.h * .4, { scale: lerp(.9, 1, Ease.outCubic(ap)) });
      else drawStack(ctx, e, splitLines(sc).map((t, i) => ({ text: t, size: i ? 60 : 130, role: i ? 'sub' : 'main', motion: 'blur', delay: .2 + i * .3 })), A.cx, A.cy, A.w);
      ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip(); FX.lightSweep(ctx, e.lt + 1.5, '#ffffff', 2.5); ctx.restore();
    },
  },
};

function parseItem(s) {
  let img = null, qty = 1; s = s.replace(/@([^\s,+]+)/, (_, n) => { img = n; return ''; });
  s = s.replace(/[x×]\s*(\d+)\b/i, (_, n) => { qty = +n; return ''; });
  return { label: s.trim(), img, qty };
}
function listItems(sc) {
  const L = splitLines(sc); let ii = L.findIndex(l => l.includes(',') || l.includes('@'));
  if (ii < 0) ii = L.length - 1;
  const title = ii > 0 ? L.slice(0, ii).join(' ') : null;
  const items = L.slice(ii).join(',').split(',').map(s => { const p = parseItem(s); return { text: p.label, img: p.img }; }).filter(x => x.text);
  return { title, items };
}
