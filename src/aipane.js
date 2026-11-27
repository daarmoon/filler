// ===== aipane.js : v10 메인 탭 'AI 스토리보드' — 글 몇 줄 → 3안 → 고르고 장면별로 다시 =====
const BOARD = { vers: [], sel: -1, busy: false, ai: false, seed: 1, text: '' };
const BOARD_SAMPLE = `상품: 쿨링 이불 / 정가: 59,000원 / 가격: 39,900원
# 여름밤처럼 시원하고 깔끔하게
오늘 밤부터 / [시원하게] (휙)
냉감 원단 [Q-max 0.4] (쾅)
[3중 구조]로 / 땀 걱정 없이 (스르르)
단, [39,900원] (두둥)
※ 냉감 기준 | 자사 시험 결과, 개인차 있음`;

function bindAiPane() {
  const ta = $('aiBoard');
  try { ta.value = localStorage.getItem('hfm.board') || ''; } catch (_) { }
  let t = 0;
  ta.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { try { localStorage.setItem('hfm.board', ta.value); } catch (_) { } boardHint(); }, 300); });
  $('onoChips').innerHTML = ONO_CHIPS.map(w => `<button class="small" data-ono="${w}" title="${esc(onoTitle(w))}">(${w})</button>`).join('');
  $('boardTools').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.ono) boardInsert(`(${b.dataset.ono})`);
    else if (b.dataset.ins === '[]') boardWrap();
    else boardInsertLine(b.dataset.ins);
  };
  $('boardSample').onclick = () => { if (ta.value.trim() && !confirm('지금 쓴 글을 예시로 바꿀까요?')) return; ta.value = BOARD_SAMPLE; ta.dispatchEvent(new Event('input')); ta.focus(); };
  $('boardAI').onclick = () => runBoard(true);
  $('boardRule').onclick = () => runBoard(false);
  $('folderPick').onclick = connectFolder; $('folderReload').onclick = reloadFolder;
  renderFolderCard(); renderPrefs(); boardHint();
}
function onoTitle(w) { const f = ONO[w]; return f ? Object.entries(f).map(([k, v]) => `${k} ${v}`).join(' · ') : ''; }
// 글자 넣기: 의성어·@소스는 커서 자리에, ※·#은 새 줄로
function boardInsert(s) {
  const ta = $('aiBoard'); if (PANE !== 'ai') showPane('ai');
  const v = ta.value, a = ta.selectionStart ?? v.length, b = ta.selectionEnd ?? v.length;
  const pre = a > 0 && !/\s/.test(v[a - 1]) ? ' ' : '';
  ta.value = v.slice(0, a) + pre + s + v.slice(b); const p = a + pre.length + s.length;
  ta.focus(); ta.setSelectionRange(p, p); ta.dispatchEvent(new Event('input'));
}
function boardInsertLine(s) {
  const ta = $('aiBoard'), v = ta.value, pos = ta.selectionEnd ?? v.length;
  const end = v.indexOf('\n', pos), at = end < 0 ? v.length : end, nl = at > 0 ? '\n' : '';
  ta.value = v.slice(0, at) + nl + s + v.slice(at); const p = at + nl.length + s.length;
  ta.focus(); ta.setSelectionRange(p, p); ta.dispatchEvent(new Event('input'));
}
function boardWrap() {
  const ta = $('aiBoard'), v = ta.value, a = ta.selectionStart ?? v.length, b = ta.selectionEnd ?? v.length;
  ta.value = v.slice(0, a) + '[' + v.slice(a, b) + ']' + v.slice(b);
  const p = b > a ? b + 2 : a + 1; ta.focus(); ta.setSelectionRange(p, p); ta.dispatchEvent(new Event('input'));
}
// 쓰는 동안 아래에 짧게: 장면 몇 개 · 모르는 의성어 · 없는 소스
function boardHint() {
  if (BOARD.busy) return;
  const bd = parseAiBoard($('aiBoard').value), n = bd.beats.length;
  if (!n && !bd.info.product) { $('boardMsg').textContent = ''; return; }
  const miss = [...new Set(bd.beats.flatMap(b => b.srcs))].filter(x => !S.assets[x]);
  const parts = [`장면 재료 ${n}줄`];
  if (bd.info.product) parts.push(`상품 ${bd.info.product}`);
  if (bd.unknownOno.length) parts.push(`사전에 없는 효과: ${bd.unknownOno.join(', ')} (AI가 판단, 바로 만들기는 기본 모션)`);
  if (miss.length) parts.push(`없는 소스: ${miss.map(x => '@' + x).join(' ')}`);
  $('boardMsg').textContent = parts.join(' · ');
}
// 지금 설정(테마·폰트·L바 등)을 설정 줄 객체로
function boardCtx(bd, seed) {
  return { fmt: normFmt(bd.info.fmt || S.fmt), dur: S.dur, head: settingsObj(), assets: S.assets, feel: S.feel, seed };
}
// AI가 낸 스토리보드 정리: 형식·단서가 빠졌으면 채움
function fixBoardOutput(text, bd, fmt) {
  const lines = String(text || '').replace(/```[a-z]*|```/g, '').split('\n').map(l => l.replace(/\s+$/, ''));
  const hi = lines.findIndex(l => l.trim() && !l.trim().startsWith('#') && !l.trim().startsWith('['));
  const st = hi >= 0 && lines[hi].includes(':') ? parseStoryboard(lines[hi]).settings : {};
  if (!st.형식) st.형식 = fmt; if (bd.dan && !st.단서) st.단서 = bd.dan;
  const head = serializeSettings(st);
  if (hi >= 0 && lines[hi].includes(':')) lines[hi] = head; else lines.unshift(head);
  return lines.filter(l => l.trim()).join('\n');
}
// 규칙판 3안: 느낌과 테마를 다르게
function ruleVersions(bd) {
  const base = boardCtx(bd), cur = S.theme;
  const pool = Object.keys(THEMES).filter(k => k !== 'key' && k !== cur && !(THEMES[k].tongOnly && base.fmt !== '통강조'));
  const shuffled = pool.sort(() => Math.random() - .5);
  const plan = [
    { name: '기본 리듬', feel: S.feel, theme: cur, concept: '쓴 의성어대로, 지금 테마로 또박또박 리듬을 살린 안' },
    { name: '세게', feel: '강하게', theme: shuffled[0], concept: '임팩트 모션과 강한 전환으로 시선을 붙잡는 안' },
    { name: '부드럽게', feel: '부드럽게', theme: shuffled[1], concept: '블러·슬라이드로 고급스럽고 차분하게 흐르는 안' },
  ];
  return plan.map((p, i) => {
    const ctx = Object.assign({}, base, { feel: p.feel, seed: BOARD.seed * 7 + i * 3 });
    ctx.head = Object.assign({}, base.head, { 테마: (THEMES[p.theme] || THEMES[cur]).name }); if (p.feel !== '보통') ctx.head.느낌 = p.feel; else delete ctx.head.느낌;
    if (ctx.head.키컬러 && p.theme !== 'key') delete ctx.head.키컬러;
    return { name: p.name, concept: p.concept, storyboard: directBoard(bd, ctx) };
  });
}
async function runBoard(useAI) {
  if (BOARD.busy) return;
  const text = $('aiBoard').value, bd = parseAiBoard(text), msg = $('boardMsg');
  if (!bd.beats.length && !bd.info.product) { msg.textContent = '한 줄에 한 장면씩 문구를 써 주세요. 예시 넣기를 눌러 보면 쉬워요.'; $('aiBoard').focus(); return; }
  const key = $('aiKey').value.trim();
  if (useAI && !key) { $('aiKeyBox').open = true; $('aiKey').focus(); msg.textContent = 'AI로 만들려면 API 키를 넣어 주세요. 키 없이 ⚡ 바로 만들기도 돼요.'; return; }
  BOARD.seed++;
  let vers;
  if (!useAI) vers = ruleVersions(bd);
  else {
    BOARD.busy = true; const btn = $('boardAI'); btn.disabled = true; const t0 = Date.now();
    const tick = setInterval(() => { msg.textContent = `AI가 3안을 연출하고 있어요… ${Math.round((Date.now() - t0) / 1000)}초 (보통 30초~1분)`; }, 500);
    try {
      const ctx = boardCtx(bd);
      const out = await aiBoardDirect({ apiKey: key, boardText: text, fmt: ctx.fmt, dur: ctx.dur, head: ctx.head, sources: sourcesForAI(), trends: activeTrends(), prefs: getPrefs(), n: 3 });
      vers = out.map(v => Object.assign(v, { storyboard: fixBoardOutput(v.storyboard, bd, ctx.fmt) })).filter(v => parseStoryboard(v.storyboard).scenes.length);
      if (!vers.length) throw new Error('AI가 만든 안을 읽지 못했어요. 다시 시도해 주세요.');
      msg.textContent = '';
    } catch (e) { msg.textContent = e.message; console.error(e); vers = null; }
    clearInterval(tick); btn.disabled = false; BOARD.busy = false;
    if (!vers) return;
  }
  BOARD.vers = vers; BOARD.ai = useAI; BOARD.text = text; BOARD.sel = -1;
  applyBoardVersion(0); renderBoardResults();
  if (!useAI) msg.textContent = '규칙으로 3안을 만들었어요. API 키를 넣으면 AI가 소스·트렌드까지 보고 연출해요.';
}
function renderBoardResults() {
  const out = $('boardOut'); out.hidden = !BOARD.vers.length; if (!BOARD.vers.length) return;
  $('boardOutBadge').textContent = BOARD.ai ? 'AI 연출 3안' : '규칙 연출 3안';
  const tall = fmtOfText(BOARD.vers[0].storyboard) === '통강조', cw = tall ? 160 : 320, ch = tall ? 336 : 180;
  const liked = new Set(getPrefs().filter(p => p.kind === 'like').map(p => p.storyboard));
  $('boardVers').innerHTML = BOARD.vers.map((v, i) => `<div class="bver${i === BOARD.sel ? ' sel' : ''}" data-i="${i}"><canvas width="${cw}" height="${ch}" data-i="${i}" title="눌러서 이 안 쓰기"></canvas>
    <div class="bvb"><b>${i + 1}안 · ${esc(v.name)}</b><div class="dim">✦ ${esc(v.concept)}</div>
    <div class="bvA"><button class="small${i === BOARD.sel ? ' primary' : ''}" data-use="${i}">${i === BOARD.sel ? '쓰는 중' : '이 안 쓰기'}</button><button class="small" data-like="${i}" title="이런 연출이 좋아요 (다음 AI 연출에 반영)">${liked.has(v.storyboard) ? '👍 좋아요' : '👍'}</button></div></div></div>`).join('');
  $('boardVers').querySelectorAll('[data-use], canvas').forEach(b => b.onclick = () => { const i = +(b.dataset.use ?? b.dataset.i); applyBoardVersion(i); renderBoardResults(); });
  $('boardVers').querySelectorAll('[data-like]').forEach(b => b.onclick = () => likeVersion(+b.dataset.like));
  drawBoardThumbs(); renderBoardScenes();
}
async function drawBoardThumbs() {
  const cs = [...$('boardVers').querySelectorAll('canvas')], vers = BOARD.vers;
  for (let i = 0; i < vers.length; i++) {
    await loadFontsFor(vers[i].storyboard); await new Promise(r => setTimeout(r, 0)); if (vers !== BOARD.vers) return;
    const p = projFromText(vers[i].storyboard); const k = Math.max(0, p.scenes.findIndex(s => s.type === 'price')); const sc = p.scenes[k] || p.scenes[Math.floor(p.scenes.length / 2)]; if (!sc) continue;
    setStage(stageOf(p)); const big = document.createElement('canvas'); big.width = W; big.height = H;
    renderFrame(big.getContext('2d'), p, sc.start + Math.min(sc.dur * .7, sc.dur - .4), { showLbar: $('lbarChk').checked && STAGE === 'wide', hints: false });
    if (cs[i]) { const g = cs[i].getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(big, 0, 0, cs[i].width, cs[i].height); }
  }
  S.dirty = true;
}
function applyBoardVersion(i) {
  const v = BOARD.vers[i]; if (!v) return;
  if (S.aiBase && BOARD.sel >= 0 && BOARD.vers[BOARD.sel]) recordEdits();
  BOARD.sel = i; setText(v.storyboard, `${i + 1}안 '${v.name}'을 적용했어요`);
  S.aiBase = { text: v.storyboard, recorded: false };
  if (S.scenes[0]) { S.t = Math.min(1.4, S.scenes[0].dur * .6); S.dirty = true; }
}
function likeVersion(i) {
  const v = BOARD.vers[i]; if (!v) return;
  if (getPrefs().some(p => p.kind === 'like' && p.storyboard === v.storyboard)) { toast('이미 스타일 노트에 있어요'); return; }
  addPref({ kind: 'like', name: v.name, concept: v.concept, storyboard: v.storyboard, head: v.storyboard.split('\n').filter(l => /^\s*\[/.test(l)).map(l => (l.match(/\{([^}]*)\}/) || [, ''])[1]).join(' | ').slice(0, 400) });
  toast(`'${v.name}' 연출을 내 스타일 노트에 담았어요`); renderBoardResults();
}
// 지금 스토리보드의 장면 목록 + 장면별 다시 + 심의 체크
function renderBoardScenes() {
  const box = $('boardScenes'); if (!box || $('boardOut').hidden) return;
  box.innerHTML = S.scenes.map((sc, i) => `<div class="bsc" data-i="${i}"><span class="no">${i + 1}</span><span class="tx">${esc(BLOCK_LABEL[sc.type] || '')} · ${esc(sceneText(sc) || (sc.opts.이미지 ? '@' + sc.opts.이미지 : ''))}</span><span class="mo">${esc([sc.opts.모션, sc.opts.전환, sc.opts.효과, sc.opts.영상 ? '🎬' + sc.opts.영상 : ''].filter(Boolean).join(' · '))}</span><button class="small" data-redo="${i}" title="이 장면만 다른 연출로">↻ 다시</button></div>`).join('');
  box.querySelectorAll('.bsc').forEach(el => el.onclick = e => { if (e.target.closest('button')) return; const i = +el.dataset.i, sc = S.scenes[i]; if (!sc) return; S.sel = i; S.t = sc.start + Math.min(sc.dur * .6, 1.6); S.dirty = true; buildTimeline(); });
  box.querySelectorAll('[data-redo]').forEach(b => b.onclick = () => redoScene(+b.dataset.redo, b));
  renderRisk();
}
function renderRisk() {
  const box = $('riskBox'); if (!box) return;
  const text = S.scenes.map(sc => sceneText(sc, ' ')).join(' / ');
  const hasDan = !!S.dan || S.scenes.some(sc => sc.opts.단서);
  const list = riskCheck(text, hasDan);
  box.hidden = !list.length; if (!list.length) return;
  box.innerHTML = `<b>⚠ 심의 표현 확인</b> <span class="dim">(법률 판단이 아니라 검토를 돕는 알림이에요)</span>` + list.map((r, i) => `<div class="rk">"${esc(r.word)}" ${esc(r.why)}${r.dan ? ` <button class="small" data-dan="${i}">단서 넣기</button>` : ''}</div>`).join('');
  box.querySelectorAll('[data-dan]').forEach(b => b.onclick = () => { const r = list[+b.dataset.dan]; S.dan = r.dan; writeSettings(); toast('단서 자막을 넣었어요. 내용은 실제 근거에 맞게 고쳐 주세요', true); renderBoardScenes(); });
}
function sceneLineIndex(text, index) { const lines = text.split('\n'); let k = -1; for (let i = 0; i < lines.length; i++) if (/^\s*\[/.test(lines[i]) && ++k === index) return i; return -1; }
async function redoScene(i, btn) {
  const cur = $('sb').value, key = $('aiKey').value.trim();
  let next = null;
  if (BOARD.ai && key) {
    btn.disabled = true; btn.textContent = '…';
    try {
      const r = await aiRedoScene({ apiKey: key, storyboard: cur, index: i, boardText: BOARD.text, sources: sourcesForAI(8), trends: activeTrends(), prefs: getPrefs() });
      const p = parseStoryboard(r.line); if (p.scenes.length !== 1) throw new Error('AI가 고친 장면을 읽지 못했어요');
      const li = sceneLineIndex(cur, i); if (li < 0) throw new Error('장면을 찾지 못했어요');
      const lines = cur.split('\n'); lines[li] = r.line; next = lines.join('\n');
      if (r.why) toast(`${i + 1}번 장면: ${r.why}`, true);
    } catch (e) { toast(e.message); }
    btn.disabled = false; btn.textContent = '↻ 다시';
  } else next = redoSceneRule(cur, i, ++BOARD.seed);
  if (!next || next === cur) return;
  setText(next); S.sel = i;
  // 다시 만든 장면은 '사용자가 고친 내용'으로 치지 않음
  if (S.aiBase) S.aiBase.text = next;
  if (BOARD.vers[BOARD.sel]) BOARD.vers[BOARD.sel].storyboard = next;
  const sc = S.scenes[i]; if (sc) { S.t = sc.start + Math.min(sc.dur * .6, 1.6); S.dirty = true; }
  buildTimeline(); renderBoardScenes();
}

// ---------- 납품 검수: 내보내기 전에 한눈에 ----------
function deliveryChecks() {
  const P = proj(), tong = S.fmt === '통강조', F = FORMATS[S.fmt], out = [];
  const add = (lv, t) => out.push({ lv, t });
  const minD = tong ? 3 : Math.min(10, F.dur * .5);
  add(S.total > F.max + .05 ? 'bad' : S.total < minD ? 'warn' : 'ok', `길이 ${S.total.toFixed(1)}초 (${S.fmt} 권장 ${F.dur}초 · 최대 ${F.max}초)`);
  // 장면마다 가장 글자가 많이 보이는 순간에 L바·안전영역 확인
  const bad = [];
  try {
    setStage(stageOf(P)); const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    P.scenes.forEach((sc, i) => { renderFrame(g, P, sc.start + Math.min(sc.dur * .7, sc.dur - .3), { warn: true, hints: false }); if (findViolations(P).length) bad.push(i + 1); });
  } catch (_) { }
  S.dirty = true; lastWarnKey = null;
  add(bad.length ? 'warn' : 'ok', bad.length ? `${bad.join('·')}번 장면 글자가 ${tong ? '화면 밖으로' : 'L바·안전영역에'} 걸려요` : (tong ? '글자가 화면 안에 다 들어가요' : 'L바·안전영역과 겹치지 않아요'));
  const hasDan = !!S.dan || S.scenes.some(sc => sc.opts.단서);
  const risk = riskCheck(S.scenes.map(sc => sceneText(sc, ' ')).join(' / '), hasDan);
  if (risk.length) add(hasDan ? 'warn' : 'bad', `심의 표현 ${risk.map(r => '"' + r.word + '"').join(' ')}${hasDan ? ' · 단서 내용이 맞는지 확인' : ' · 단서 자막이 없어요'}`);
  else add('ok', hasDan ? '단서 자막 있음' : '단서가 필요한 표현은 안 보여요');
  const empties = S.scenes.map((sc, i) => sceneEmpty(sc) ? i + 1 : 0).filter(Boolean);
  if (empties.length) add('warn', `${empties.join('·')}번 장면은 문구가 비어 있어요`);
  const miss = [...new Set(S.scenes.flatMap(sc => sceneVideoNames(sc)))].filter(n => !S.assets[n]);
  if (miss.length) add('warn', `없는 소스: ${miss.join(', ')} (소스 탭이나 상품 폴더에서 넣어 주세요)`);
  if (projHasVideo(P)) add('ok', '영상 소스가 들어 있어 프레임마다 맞춰 그려요 (조금 더 걸려요)');
  add('ok', tong ? '규격 376×790 · MP4' : APP && APP_INFO.ffmpeg ? '규격 1920×1080 · MP4 저장 후 MXF(XDCAM HD422 1080i) 자동 변환 가능' : '규격 1920×1080 · MP4 (MXF는 아래 변환 명령으로)');
  return out;
}
function renderDeliveryChecks() {
  const box = $('expCheck'); if (!box) return;
  const l = deliveryChecks(); const icon = { ok: '✓', warn: '⚠', bad: '✕' };
  box.innerHTML = `<b style="font-size:12.5px">납품 검수</b>` + l.map(x => `<div class="${x.lv}">${icon[x.lv]} ${esc(x.t)}</div>`).join('');
}
