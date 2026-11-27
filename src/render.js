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
const TONG = { pad: 80, head: 270, foot: 300, gap: 70, dan: 150 };
// 단서 자막: 장면에 따로 쓴 게 있으면 그것, 없으면 전체(첫 줄 '단서:'). '없음'이면 그 장면은 안 보임
// 단서 자막 글자 배경: 장면 옵션 {단서배경: 있음|없음} > 설정 줄 '단서배경: 없음' > 기본(검은 띠)
function danBgFor(proj, sc) { const o = sc && sc.opts && sc.opts.단서배경; if (o === '있음') return true; if (o === '없음') return false; return proj.danBg !== false; }
function danFor(proj, sc) {
  const own = sc && sc.opts && sc.opts.단서 !== undefined ? String(sc.opts.단서).trim() : null;
  const v = own !== null && own !== '' ? own : String(proj.dan || '').trim();
  return v === '없음' ? '' : v;
}
function tongArea(proj, sc) {
  const top = (proj.head ? TONG.head : 0) + TONG.gap, bot = H - (proj.foot ? TONG.foot : 0) - TONG.gap - (danFor(proj, sc) ? TONG.dan : 0);
  const a = { x: TONG.pad, y: top, w: W - TONG.pad * 2, h: bot - top }; a.cx = a.x + a.w / 2; a.cy = a.y + a.h / 2; return a;
}
function areaFor(proj, sc) { return STAGE === 'tong' ? tongArea(proj, sc) : Object.assign({}, AREAS[proj.lbar] || AREAS.full); }
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
  let A = areaFor(proj, sc);
  const motion = MOTIONS[sc.opts.모션] || proj.motion || 'pop';
  return { sc, th, v, P, F: FONTS[fontId] || FONTS.blackhan, A, lt: t - sc.start, D: sc.dur, t, motion, opts: sc.opts, img: n => { const a = n && proj.assets[n]; if (!a) return null; a.img.hfScale = (a.scale || 100) / 100; return a.img; } };
}

function blockFor(type) { return (STAGE === 'tong' && TONG_BLOCKS[type]) || BLOCKS[type] || BLOCKS.hook; }
const LAYERED = ['줌', '디졸브', '밀기', '글리치', '스핀'];
function sceneFx(proj, sc) {
  const own = sc.opts.효과; if (own === '없음') return [];
  return [...new Set([...(proj.fx || []), ...parseFxList(own)])];
}
// 전체 효과 옵션(위치·속도·반복)은 renderScene이 장면마다 FX_OPT에 넣어 둠
let FX_OPT = {}, FX_TOTAL = 20;
// 반복 N번: 영상 길이를 N칸으로 나눠 칸마다 한 번씩 (효과 시간은 그때마다 처음부터)
function fxWindow(o, t) {
  const N = o.rep | 0; if (!N) return { start: null, a: 1, k: 0 };
  const seg = FX_TOTAL / N, len = clamp(seg * .72, 1.2, 4.5), k = Math.min(N - 1, Math.floor(t / seg)), ws = k * seg + Math.min(.15, seg * .05), we = ws + len;
  if (t < ws || t > we) return null;
  return { start: ws, a: clamp(Math.min((t - ws) / .25, (we - t) / .35)), k };
}
function fxMask(g, pos, e) {
  const A = e.A, f = Math.max(60, Math.min(A.w, A.h) * .12);
  if (pos === '가운데') { const r = Math.min(A.w, A.h) * .62; const gr = g.createRadialGradient(A.cx, A.cy, r * .35, A.cx, A.cy, r); gr.addColorStop(0, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); return; }
  const vert = pos === '위' || pos === '아래', mid = vert ? A.y + A.h / 2 : A.x + A.w / 2, len = vert ? H : W;
  const gr = vert ? g.createLinearGradient(0, 0, 0, H) : g.createLinearGradient(0, 0, W, 0);
  const a = clamp((mid - f) / len), b = clamp((mid + f) / len), first = pos === '위' || pos === '왼쪽';
  gr.addColorStop(0, first ? '#000' : 'rgba(0,0,0,0)'); gr.addColorStop(a, first ? '#000' : 'rgba(0,0,0,0)'); gr.addColorStop(b, first ? 'rgba(0,0,0,0)' : '#000'); gr.addColorStop(1, first ? 'rgba(0,0,0,0)' : '#000');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
function fxClip(ctx, pos, e) {
  const A = e.A; ctx.beginPath();
  if (pos === '위') ctx.rect(0, 0, W, A.y + A.h / 2); else if (pos === '아래') ctx.rect(0, A.y + A.h / 2, W, H);
  else if (pos === '왼쪽') ctx.rect(0, 0, A.x + A.w / 2, H); else if (pos === '오른쪽') ctx.rect(A.x + A.w / 2, 0, W, H);
  else ctx.ellipse(A.cx, A.cy, A.w * .4, A.h * .45, 0, 0, TAU);
  ctx.clip();
}
function runFx(ctx, list, layerName, t, e) {
  for (const n of list) {
    const f = EFFECTS[n]; if (!f || f.layer !== layerName) continue;
    const o = FX_OPT[n];
    if (!o) { ctx.save(); try { f.fn(ctx, t, e.lt, e); } catch (err) { console.warn(n, err); } ctx.restore(); continue; }
    const w = fxWindow(o, t); if (!w) continue;
    const sp = o.speed || 1, tt = w.start === null ? t * sp : (t - w.start) * sp + w.k * 7.3, lt = w.start === null ? e.lt * sp : (t - w.start) * sp;
    const pos = o.pos && o.pos !== '전체' ? o.pos : null;
    try {
      if (layerName === 'post' || (!pos && w.a >= 1)) {
        ctx.save(); if (pos) fxClip(ctx, pos, e); if (w.a < 1) ctx.globalAlpha = w.a; f.fn(ctx, tt, lt, e); ctx.restore();
      } else {
        const off = layer(5), g = off.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
        g.save(); f.fn(g, tt, lt, e); g.restore();
        if (pos) { g.save(); g.globalCompositeOperation = 'destination-in'; fxMask(g, pos, e); g.restore(); }
        ctx.save(); ctx.globalAlpha = w.a; ctx.drawImage(off, 0, 0); ctx.restore();
      }
    } catch (err) { console.warn(n, err); }
  }
}
// ---------- v10 영상 소스 ----------
// 장면 옵션 '영상: 이름'은 배경을 꽉 채우고(글자가 보이게 어둡게), '이미지: 영상이름'·@영상이름은 상품 컷 자리에서 재생
function drawVideoCover(ctx, img) {
  const s = Math.max(W / img.width, H / img.height), w = img.width * s, h = img.height * s;
  ctx.save(); ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h); ctx.fillStyle = 'rgba(0,0,0,.38)'; ctx.fillRect(0, 0, W, H); ctx.restore();
}
function sceneVideoNames(sc) { const n = [sc.opts.영상, sc.opts.이미지, ...((sc.lines || []).join(' ').match(/@([^\s,+/]+)/g) || []).map(x => x.slice(1))]; return [...new Set(n.filter(Boolean))]; }
function videoUses(proj, t) {
  const uses = new Map();
  (proj.scenes || []).forEach(sc => {
    const cur = t >= sc.start && t < sc.start + sc.dur; if (!cur && (t < sc.start - .8 || t > sc.start + sc.dur + .8)) return;
    sceneVideoNames(sc).forEach(n => {
      const a = proj.assets && proj.assets[n]; if (!a || !a.video || (uses.has(a) && !cur)) return;
      const d = a.dur || a.video.duration || 1; let tt = Math.max(0, t - sc.start) + (parseFloat(sc.opts.시작) || 0); tt = d > .2 ? tt % d : 0; uses.set(a, tt);
    });
  });
  return uses;
}
function paintVideo(a) { try { a.img.getContext('2d').drawImage(a.video, 0, 0, a.img.width, a.img.height); } catch (_) { } }
function projHasVideo(proj) { return (proj.scenes || []).some(sc => sceneVideoNames(sc).some(n => proj.assets && proj.assets[n] && proj.assets[n].video)); }
// 미리보기: 재생 중엔 영상도 같이 틀고(많이 어긋나면 맞춤), 멈추면 그 시점으로 찾아감
function syncVideosPreview(proj, t, playing) {
  const uses = videoUses(proj, t);
  Object.values(proj.assets || {}).forEach(a => { if (a.video && !uses.has(a) && !a.video.paused) a.video.pause(); });
  uses.forEach((tt, a) => {
    const v = a.video; if (v.readyState < 2) return;
    if (playing) { if (v.paused) v.play().catch(() => { }); if (Math.abs(v.currentTime - tt) > .3) v.currentTime = tt; }
    else { if (!v.paused) v.pause(); if (Math.abs(v.currentTime - tt) > .03 && !v.seeking) v.currentTime = tt; }
    paintVideo(a);
  });
}
// 내보내기: 프레임마다 정확한 시점으로 찾아간 뒤 그림
const waitEv = (el, ev, ms) => new Promise(res => { const done = () => { el.removeEventListener(ev, done); clearTimeout(to); res(); }; const to = setTimeout(done, ms); el.addEventListener(ev, done); });
async function syncVideosExact(proj, t) {
  for (const [a, tt] of videoUses(proj, t)) {
    const v = a.video; if (!v.paused) v.pause();
    if (v.readyState < 2) await waitEv(v, 'loadeddata', 3000);
    if (Math.abs(v.currentTime - tt) > .001) { const p = waitEv(v, 'seeked', 3000); v.currentTime = tt; await p; }
    paintVideo(a);
  }
}
function renderScene(ctx, proj, i, t) {
  FX_OPT = proj.fxOpt || {}; FX_TOTAL = proj.total || 20;
  const e = sceneEnv(proj, i, t);
  const u = e.D > 0 ? clamp(e.lt / e.D) : 0;
  // 배경: 아주 느린 켄번스 줌
  const cam = motionCam(e.motion, e.lt);
  ctx.save();
  if (cam && cam.bg) { ctx.translate(W / 2 + cam.dx * .6, H / 2 + cam.dy * .6); ctx.scale(cam.s + .02, cam.s + .02); ctx.translate(-W / 2, -H / 2); }
  if (FEEL.drift) { const s = 1 + FEEL.drift * 1.6 * u; ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2); }
  e.th.bg(ctx, t, e.v);
  const bgv = e.opts.영상 && proj.assets && proj.assets[e.opts.영상];
  if (bgv && bgv.img) drawVideoCover(ctx, bgv.img);
  ctx.restore();
  const fxList = sceneFx(proj, e.sc);
  if (e.th.panel) { ctx.save(); e.th.panel(ctx, t, e.v, e.A); ctx.restore(); }
  if (STAGE === 'tong') tongFrameBack(ctx, proj, e);
  runFx(ctx, fxList, 'back', t, e);
  // 글자·이미지는 별도 레이어에 그린 뒤 살짝 떠다니듯 합성
  IMG_K = clamp((parseFloat(e.opts.크기) || 100) / 100 * (proj.imgK || 100) / 100, .3, 3);
  setSpacing(proj, e.opts);
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
    drawBlock(c, e);
    c.restore();
    Props.tv(c, r, 1);
  } else drawBlock(c, e);
  IMG_K = 1; TRACK_ADD = 0; LEAD = 1;
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
  ctx.translate(e.A.cx, e.A.cy - ex * 24); ctx.scale(sc, sc);
  if (cam) { ctx.translate(cam.dx, cam.dy); ctx.rotate(cam.rot || 0); ctx.scale(cam.s, cam.s); }
  ctx.translate(-e.A.cx, -e.A.cy);
  ctx.drawImage(cl, 0, 0);
  ctx.restore();
  ctx.save(); e.th.fx(ctx, t, e.v); ctx.restore();
  runFx(ctx, fxList, 'front', t, e);
  runFx(ctx, fxList, 'post', t, e);
  return e;
}

// 미리보기에서만 보이는 안내(빈 장면 자리 표시 등). 영상·PNG로 내보낼 때는 끔
let SHOW_HINTS = true;
// 자간·행간: 장면 옵션이 있으면 그 값, 없으면 전체 설정
function setSpacing(proj, opts) {
  const tk = opts && opts.자간 !== undefined && opts.자간 !== '' && !isNaN(parseFloat(opts.자간)) ? parseFloat(opts.자간) : (proj.track || 0);
  const ld = opts && parseFloat(opts.행간) > 0 ? parseFloat(opts.행간) : (proj.lead || 100);
  TRACK_ADD = clamp(tk / 100, -.2, .6); LEAD = clamp(ld / 100, .5, 2.2);
}
// 문구가 하나도 없는 장면 (이미지만 쓰는 상품·로고 장면은 빼고)
function sceneEmpty(sc) {
  if (sc.type === 'outro' || sc.opts.이미지) return false;
  return !sc.lines.some(l => plain(lineTag(l).text).replace(/[|\s]/g, '') !== '');
}
function drawBlock(c, e) {
  if (sceneEmpty(e.sc)) { if (SHOW_HINTS) drawHint(c, e.A, `✏️ ${BLOCK_LABEL[e.sc.type] || ''} 장면 · 왼쪽에서 문구를 써 주세요`); return; }
  try { blockFor(e.sc.type).render(c, e.sc, e); }
  catch (err) { console.warn('장면 그리기 실패', e.sc, err); if (SHOW_HINTS) drawHint(c, e.A, '이 장면은 문구 형식이 맞지 않아 그릴 수 없어요'); }
}
function drawHint(c, A, msg) {
  c.save(); const s = Math.max(30, Math.min(56, A.w / 22));
  c.setLineDash([s * .5, s * .35]); c.lineWidth = Math.max(3, s * .08); c.strokeStyle = 'rgba(255,255,255,.75)';
  c.fillStyle = 'rgba(0,0,0,.35)'; roundRect(c, A.x + A.w * .06, A.cy - s * 1.6, A.w * .88, s * 3.2, s * .6); c.fill(); c.stroke();
  c.setLineDash([]); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
  setFont(c, SUBFONT, s); let fs = s; while (c.measureText(msg).width > A.w * .82 && fs > 14) { fs -= 2; setFont(c, SUBFONT, fs); }
  c.fillText(msg, A.cx, A.cy); c.restore();
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
  const S = proj.scenes; setStage(stageOf(proj)); SHOW_HINTS = view.hints !== false;
  ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  if (!S.length) { // 아직 장면이 없을 때: 테마 배경과 안내만
    const th = THEMES[proj.theme] || THEMES.ns; if (proj.theme === 'key') setKeyColor(proj.key);
    try { th.bg(ctx, t, 0); } catch (_) { }
    ctx.restore();
    if (SHOW_HINTS) drawHint(ctx, areaFor(proj), STAGE === 'tong' ? '왼쪽 ⚡ 자동으로 채우기를 눌러 보세요' : '왼쪽 ‘직접 만들기’에서 장면을 골라 쌓아 보세요');
    drawOverlay(ctx, proj, view); return;
  }
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
  if (STAGE === 'tong') drawTongChrome(ctx, proj, t);
  drawDisclaimer(ctx, proj, S[i]);
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
