// ===== app.js : 편집 화면 =====
const $ = id => document.getElementById(id);
const LBAR_NAMES = { 기본: 'full', 'L바': 'full', 하단바: 'bottom', 없음: 'none' };
const LBAR_LABEL = { full: '기본', bottom: '하단바', none: '없음', tong: '' };

const S = {
  text: '', texts: {}, fmt: '하드필러', head: '', foot: '', dan: '', imgK: 100, track: 0, lead: 100, frame: '없음', theme: 'ns', font: '', motion: 'pop', dur: 20, lbar: 'full', feel: '보통', key: '#f40013', fx: [], hist: [], seed: 1,
  scenes: [], total: 0, assets: {}, bgm: null,
  t: 0, playing: false, sel: -1, dirty: true, errors: [],
};
const proj = () => ({ fmt: S.fmt, head: S.head, foot: S.foot, dan: S.dan, imgK: S.imgK, track: S.track, lead: S.lead, frame: S.frame, fx: S.fx, key: S.key, feel: S.feel, scenes: S.scenes, theme: S.theme, font: S.font || null, motion: S.motion, lbar: S.lbar, total: S.total, assets: S.assets, bgm: S.bgm });

// ---------- 초기화 ----------
const tplFmt = t => t.fmt || fmtOfText(t.text);
// 화면에 보이는 문구만 (줄 앞 (외곽)·(박스) 같은 꾸밈 표시와 *별표*를 뺌)
const sceneText = (sc, sep = ' / ') => plain(sc.lines.map(l => lineTag(l).text).join(sep));
function fmtOfText(text) { const m = String(text).match(/형식:\s*([^/\n]+)/); return normFmt(m && m[1]); }
function init() {
  for (const [k, v] of Object.entries(MOTIONS)) $('motionSel').add(new Option(k, v));
  buildTplSel();
  for (const [id, b] of Object.entries(BLOCKS)) {
    if (id === 'benefits') continue; // 혜택 장면은 v7에서 뺌 (예전 스토리보드는 그대로 읽힘)
    const btn = document.createElement('button'); btn.textContent = '+ ' + b.name; btn.title = b.help;
    btn.onclick = () => insertLine(b.sample); $('blockChips').appendChild(btn);
  }
  // 가이드 이미지
  if (typeof LBAR_DATA !== 'undefined') { const i = new Image(); i.onload = () => { R.lbarImg = i; S.dirty = true; }; i.src = LBAR_DATA; }
  let saved = null; try { saved = JSON.parse(localStorage.getItem('hfm.v1') || 'null'); } catch (_) { }
  // 처음엔 예시 없이 빈 화면에서 시작. 예전 버전이 깔아 둔 예시(손대지 않은 것)는 지움
  const isTpl = t => !t || TEMPLATES.some(x => x.text.trim() === String(t).trim());
  if (saved && saved.texts) for (const [k, v] of Object.entries(saved.texts)) if (!isTpl(v)) S.texts[k] = v;
  // v8: 인서트 탭이 없어져서 예전 인서트 탭에 쓰던 글은 하드필러 탭으로 (하드필러 탭이 비어 있을 때)
  if (S.texts.인서트) { if (!S.texts.하드필러) S.texts.하드필러 = S.texts.인서트.replace(/형식:\s*인서트/, '형식: 하드필러'); delete S.texts.인서트; }
  const fmt0 = saved ? normFmt(saved.fmt) : '하드필러';
  $('sb').value = S.texts[fmt0] || (saved && !isTpl(saved.text) && fmtOfText(saved.text) === fmt0 ? saved.text : blankText(fmt0));
  const oldDemo = f => f && f.product === '마데카 크림' && f.price === '76090' && (f.comps || [])[0] && f.comps[0].name === '크림 50ml';
  loadForm(saved && saved.form && !oldDemo(saved.form) ? saved.form : {});
  try { $('aiKey').value = localStorage.getItem('hfm.key') || ''; } catch (_) { }
  bindUI(); bindQuick(); bindKey(); buildDesignDDs(); buildFxChips(); parseNow(); showPane('build');
  $('appVer').textContent = 'v' + APP_VERSION + (APP ? ' · 윈도우 앱' : '');
  if (APP) { document.body.classList.add('app'); APP.info().then(i => { APP_INFO = i; }).catch(() => { }); }
  loadFonts().then(() => { S.dirty = true; lastWarnKey = null; buildDesignDDs(); thumbsSoon(); });
  restoreAssets();
  // 예상 못 한 오류는 조용히 넘어가지 않고 알려 줌
  window.addEventListener('error', e => { if (e.message && !/ResizeObserver/.test(e.message)) toast('문제가 생겼어요: ' + e.message); });
  window.addEventListener('unhandledrejection', e => { const m = e.reason && e.reason.message; if (m) toast('문제가 생겼어요: ' + m); });
  requestAnimationFrame(loop);
}
// 빈 스토리보드: 설정 첫 줄만 (테마는 지금 고른 것 유지)
function blankText(fmt) {
  const s = { 형식: fmt, 테마: (THEMES[S.theme] || THEMES.ns).name, 길이: String(FORMATS[fmt].dur) };
  if (fmt !== '통강조') s.L바 = LBAR_LABEL[FORMATS[fmt].lbar];
  return serializeSettings(s);
}
function buildTplSel() {
  const sel = $('tplSel'); sel.innerHTML = ''; sel.add(new Option('📂 예시 스토리보드 불러오기…', ''));
  for (const f of Object.keys(FORMATS)) {
    const g = document.createElement('optgroup'); g.label = f + (f === '통강조' ? ' (376×790 세로)' : '');
    TEMPLATES.filter(t => tplFmt(t) === f).forEach(t => g.appendChild(new Option(t.name, t.id))); sel.appendChild(g);
  }
  sel.value = '';
}

function loadFonts() {
  const all = [...Object.values(FONTS), SUBFONT, { family: SUBFONT.family, weight: 700 }];
  return Promise.all(all.map(f => document.fonts.load(`${f.weight} 60px ${f.family}`, '가나다라특가할인0123456789원!%').catch(() => null))).then(() => document.fonts.ready);
}
// 스토리보드에 실제로 쓰인 글자를 그 폰트로 미리 받아 둠 (한글 폰트는 글자 묶음별로 나눠 받기 때문)
function loadFontsFor(text) {
  const chars = [...new Set(plain(text).replace(/\s/g, ''))].join('') + '0123456789,원%!?~.';
  const p = projFromText(text); const ids = new Set([p.font || (THEMES[p.theme] || {}).font]);
  p.scenes.forEach(sc => { const f = fontFromName(sc.opts.폰트); if (f) ids.add(f); });
  const fonts = [...ids].filter(id => FONTS[id]).map(id => FONTS[id]).concat([SUBFONT, { family: SUBFONT.family, weight: 700 }]);
  const spec = f => `${f.weight} 60px ${f.family}`;
  if (fonts.every(f => { try { return document.fonts.check(spec(f), chars); } catch (_) { return true; } })) return Promise.resolve(false);
  return Promise.all(fonts.map(f => document.fonts.load(spec(f), chars).catch(() => null))).then(() => true);
}
let fontTimer = 0;
function fontsSoon() { clearTimeout(fontTimer); fontTimer = setTimeout(() => loadFontsFor($('sb').value).then(changed => { if (changed) { S.dirty = true; thumbsSoon(); } }), 300); }
// 스토리보드 글만으로 렌더용 프로젝트를 만듦 (여러 버전 미리보기·일괄 내보내기용)
function projFromText(text) {
  const r = parseStoryboard(text); const st = r.settings;
  const fmt = normFmt(st.형식);
  const p = { scenes: r.scenes, theme: themeFromName(st.테마) || 'ns', font: fontFromName(st.폰트) || null, motion: MOTIONS[st.모션] || 'pop',
    lbar: LBAR_NAMES[st.L바] || FORMATS[fmt].lbar, feel: FEEL_NAMES.includes(st.느낌) ? st.느낌 : '보통', key: /^#[0-9a-f]{6}$/i.test(st.키컬러 || '') ? st.키컬러 : S.key,
    fx: parseFxList(st.효과), assets: S.assets, bgm: S.bgm, fmt, head: st.머리 || '', foot: st.꼬리 || '', dan: st.단서 || '', imgK: parseFloat(st.이미지크기) || 100, track: parseFloat(st.자간) || 0, lead: parseFloat(st.행간) || 100, frame: TONG_FRAMES.includes(st.틀) ? st.틀 : '없음' };
  if (fmt === '통강조') p.lbar = 'tong';
  p.total = computeTimeline(p.scenes, Math.min(FORMATS[fmt].max, parseFloat(st.길이) || FORMATS[fmt].dur)).total; return p;
}

// ---------- 스타일 갤러리 · 폰트 · 효과 ----------
function drawStyleThumb(c, themeId, fontId, word = '특가') {
  const th = THEMES[themeId], f = FONTS[fontId || th.font], P = th.pal[0]; const x = c.getContext('2d');
  x.save(); x.scale(c.width / W, c.height / H); try { th.bg(x, 1.4, 0); } catch (_) { } x.restore();
  const size = c.height * .36; x.textAlign = 'center'; x.font = `${f.weight} ${size * (f.scale || 1)}px ${f.family}`;
  if (P.glow) { x.shadowColor = P.glow; x.shadowBlur = 10; }
  if (P.stroke) { x.lineJoin = 'round'; x.lineWidth = size * .14; x.strokeStyle = P.stroke; x.strokeText(word, c.width * .55, c.height * .62); }
  x.fillStyle = P.em; x.fillText(word, c.width * .55, c.height * .62);
}
// ---------- 드롭다운 (미리보기가 들어가는 택1 메뉴) ----------
const DD = {};
function ddContent(it, where) {
  const f = document.createDocumentFragment();
  if (it.icon) { const d = document.createElement('div'); d.className = 'ico'; d.textContent = it.icon; f.appendChild(d); }
  else if (it.draw) {
    if (!it._img) { it._img = document.createElement('canvas'); it._img.width = 192; it._img.height = 108; try { setStage('wide'); it.draw(it._img); } catch (_) { } }
    const c = document.createElement('canvas'); c.width = 192; c.height = 108; c.getContext('2d').drawImage(it._img, 0, 0); f.appendChild(c);
  }
  const t = document.createElement('div'); t.className = 'ddTxt';
  if (it.font) { const sp = document.createElement('span'); sp.className = 'ddFont'; sp.style.fontFamily = it.font.family; sp.style.fontWeight = it.font.weight; sp.style.fontSize = Math.round((where === 'btn' ? 21 : 24) * (it.font.scale || 1)) + 'px'; sp.textContent = it.sample || '특가 세일 1,000원'; t.appendChild(sp); }
  const b = document.createElement(it.font ? 'small' : 'b'); b.textContent = it.label; t.appendChild(b);
  if (it.sub && where !== 'btn-compact') { const sm = document.createElement('small'); sm.textContent = it.sub; t.appendChild(sm); }
  f.appendChild(t); return f;
}
function makeDD(id, opt) {
  const host = $(id); host.innerHTML = '';
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'ddBtn';
  const panel = document.createElement('div'); panel.className = 'ddPanel' + (opt.grid ? ' grid' : ''); host.append(btn, panel);
  const dd = { items: [], value: DD[id] ? DD[id].value : null,
    setItems(items) {
      this.items = items; panel.innerHTML = '';
      items.forEach(it => { const d = document.createElement('div'); d.className = 'ddItem'; d.dataset.v = it.v; d.title = it.label; d.appendChild(ddContent(it, 'list')); d.onclick = () => { host.classList.remove('open'); opt.onChange(it.v); }; panel.appendChild(d); });
      this.set(this.value); return this;
    },
    set(v) {
      this.value = v; const it = this.items.find(x => x.v === v) || this.items[0]; btn.innerHTML = ''; if (it) btn.appendChild(ddContent(it, 'btn'));
      [...panel.children].forEach(c => c.classList.toggle('on', !!it && c.dataset.v === it.v));
    },
  };
  btn.onclick = e => {
    e.stopPropagation(); const open = !host.classList.contains('open');
    document.querySelectorAll('.dd.open').forEach(x => x.classList.remove('open'));
    if (open) { host.classList.add('open'); const on = panel.querySelector('.on'); if (on) on.scrollIntoView({ block: 'nearest' }); }
  };
  DD[id] = dd; return dd;
}
document.addEventListener('click', e => { if (!e.target.closest('.dd')) document.querySelectorAll('.dd.open').forEach(x => x.classList.remove('open')); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.dd.open').forEach(x => x.classList.remove('open')); });
function drawThemeThumb(c, id) {
  const th = THEMES[id], x = c.getContext('2d'); x.save(); x.scale(c.width / W, c.height / H); try { th.bg(x, 1.2, 0); } catch (_) { } x.restore();
  const f = FONTS[th.font]; x.font = `${f.weight} ${34 * (f.scale || 1)}px ${f.family}`; x.textAlign = 'center';
  if (th.pal[0].stroke) { x.lineJoin = 'round'; x.lineWidth = 5; x.strokeStyle = th.pal[0].stroke; x.strokeText('특가', 96, 68); }
  x.fillStyle = th.pal[0].em; x.fillText('특가', 96, 68);
}
const themeItems = () => Object.entries(THEMES).map(([id, th]) => ({ v: id, label: th.name, draw: c => drawThemeThumb(c, id) }));
function buildDesignDDs() {
  setStage('wide');
  makeDD('ddStyle', { grid: true, onChange: pickStyle }).setItems([
    { v: '', label: '자동', sub: '상품명·사진 색에 맞춰', icon: '✨' }, { v: 'theme', label: '지금 테마 그대로', sub: '내가 고른 테마·폰트', icon: '🎯' },
    ...Object.entries(STYLES).map(([id, st]) => ({ v: 'style:' + id, label: st.name, draw: c => drawStyleThumb(c, st.theme, st.font) }))]);
  makeDD('ddTheme', { grid: true, onChange: v => { S.theme = v; $('fTheme').value = 'theme'; persist(); writeSettings(); toast(`테마를 '${THEMES[v].name}'(으)로 바꿨어요`); } }).setItems(themeItems());
  makeDD('ddFont', { onChange: v => { S.font = v; writeSettings(); } }).setItems([
    { v: '', label: '테마 기본 폰트', font: { family: "'Noto Sans KR', sans-serif", weight: 700 }, sample: '테마에 맞춰 자동' },
    ...Object.entries(FONTS).map(([id, f]) => ({ v: id, label: f.name, font: f }))]);
  syncControls();
}
function buildThemeGrid() { if (DD.ddTheme) { setStage('wide'); DD.ddTheme.setItems(themeItems()); } }
// 오른쪽 '스타일': 고르면 지금 스토리보드에 바로 입히고, 자동 연출도 이 스타일로 만듦
function pickStyle(v) {
  $('fTheme').value = v; persist();
  if (v.startsWith('style:')) {
    const id = v.slice(6), st = STYLES[id];
    S.theme = st.theme; S.font = st.font; S.feel = st.feel; S.fx = st.fx.slice(); S.motion = MOTIONS[st.motions[0]] || 'pop';
    if (S.fmt === '통강조') S.frame = TONG_STYLE_FRAME[id] || S.frame;
    writeSettings(); toast(`'${st.name}' 스타일을 입혔어요 · 장면 구성까지 바꾸려면 ✨ 자동 연출`, true);
  } else if (!v) applyAutoStyle();
  syncControls();
}
// '자동': 상품명·포인트에 분위기 단어가 있으면 그 테마, 없으면 올린 상품 사진의 색(키컬러), 둘 다 없으면 NS 레드
function autoTheme(f) {
  f = f || readForm();
  const kw = guessThemeKw(f); if (kw) return { theme: kw, why: '상품명' };
  const img = ((f.comps || []).find(c => c.img && S.assets[c.img]) || {}).img || Object.keys(S.assets).find(n => n !== '로고');
  if (img && S.assets[img]) { const cols = extractColors(S.assets[img].img, 3); if (cols[0]) return { theme: 'key', key: cols[0], why: `'${img}' 사진 색` }; }
  return { theme: null, why: '기본' }; // 자동 연출은 연출 방식에 맞는 기본 테마를 씀
}
function applyAutoStyle() {
  const a = autoTheme(); S.fx = []; S.motion = 'pop';
  if (a.theme === 'key') { applyKey(a.key, true); $('fTheme').value = ''; persist(); }
  else { S.theme = a.theme || 'ns'; S.font = ''; S.feel = '보통'; writeSettings(); }
  toast(`자동: ${a.why}에 맞춰 '${THEMES[S.theme].name}'${a.theme === 'key' ? ` (${S.key})` : ''} 테마로 맞췄어요`, true);
}
function updateStyleNow() {
  const v = $('fTheme').value || '', name = v.startsWith('style:') && STYLES[v.slice(6)] ? STYLES[v.slice(6)].name : v === 'theme' ? `지금 테마 그대로 (${(THEMES[S.theme] || THEMES.ns).name})` : '자동 (상품명·사진 색에 맞춰)';
  $('styleNow').innerHTML = `스타일: <b>${name}</b> <span class="dim">· 오른쪽 '전체 디자인'에서 바꿔요</span>`;
}
function buildFxChips() {
  $('fxGlobal').innerHTML = EFFECT_NAMES.map(n => `<button data-n="${n}">${n}</button>`).join('');
  $('fxGlobal').onclick = e => { const n = e.target.dataset.n; if (!n) return; S.fx = S.fx.includes(n) ? S.fx.filter(x => x !== n) : [...S.fx, n]; writeSettings(); };
}
function persist() { S.texts[S.fmt] = $('sb').value; try { localStorage.setItem('hfm.v1', JSON.stringify({ text: $('sb').value, texts: S.texts, fmt: S.fmt, form: readForm() })); } catch (_) { } }

// ---------- 되돌리기 / 알림 ----------
function setText(text, msg) {
  const cur = $('sb').value; if (cur === text) return;
  if (fmtOfText(text) !== S.fmt) S.texts[S.fmt] = cur;
  S.hist.push(cur); if (S.hist.length > 40) S.hist.shift();
  $('sb').value = text; S.sel = -1; S.t = 0; parseNow(); $('undoBtn').disabled = false;
  if (msg) toast(msg, true);
}
function undo() {
  if (!S.hist.length) return; $('sb').value = S.hist.pop(); S.sel = -1; parseNow();
  $('undoBtn').disabled = !S.hist.length; toast('되돌렸어요');
}
let toastTimer = 0;
function toast(msg, withUndo) {
  $('toastMsg').textContent = msg; $('toastUndo').style.display = withUndo ? '' : 'none';
  $('toast').classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('on'), 3200);
}

// ---------- 간편 입력 ----------
const FORM_IDS = { tongHead: 'fTongHead', tongFoot: 'fTongFoot', dan: 'fDan', product: 'fProduct', hook: 'fHook', record: 'fRecord', listPrice: 'fListPrice', rate: 'fRate', price: 'fPrice', pricePre: 'fPricePre', unit: 'fUnit', qty: 'fQty', priceNote: 'fPriceNote', urgent: 'fUrgent', theme: 'fTheme', recipe: 'fRecipe', priceMotion: 'fPriceMotion' };
let formComps = [{ name: '', img: '', qty: '' }];
function readForm() {
  const f = {}; for (const [k, id] of Object.entries(FORM_IDS)) f[k] = $(id).value.trim();
  f.benefits = [];
  f.points = $('fPoints').value.split('\n').map(s => s.trim()).filter(Boolean);
  f.comps = formComps.filter(c => c.name.trim()); f.perScene = $('fPerScene').checked; return f;
}
function loadForm(f) {
  if (!f) return;
  for (const [k, id] of Object.entries(FORM_IDS)) if (f[k] != null) $(id).value = f[k];
  $('fPoints').value = (f.points || []).join('\n'); if (f.perScene === false) $('fPerScene').checked = false;
  if (f.comps && f.comps.length) formComps = f.comps.map(c => Object.assign({ name: '', img: '', qty: '' }, c));
  if (f.theme === '__img') $('fTheme').value = ''; // v7의 '상품 이미지 색'은 v8에서 '자동'에 합쳐짐
  if (!['product', 'typo'].includes($('fRecipe').value)) $('fRecipe').value = 'product';
  if (!$('fPriceMotion').value) $('fPriceMotion').value = '자동';
  syncRecipe();
}
const RECIPE_HINT = { product: '훅 → 상품 → 포인트 → 구성 → 가격 → 한정 순서로 상품을 차근차근 소개해요. (하드필러식)', typo: '큰 글자를 1~2초마다 바꿔 치며 할인율·최저가를 강하게 박아요. (예전 인서트 탭 방식)' };
function syncRecipe() { const v = $('fRecipe').value || 'product'; [...$('recipeSeg').children].forEach(b => b.classList.toggle('on', b.dataset.v === v)); $('recipeHint').textContent = RECIPE_HINT[v]; }
function renderComps() {
  const box = $('fComps'); box.innerHTML = ''; const imgs = Object.keys(S.assets);
  formComps.forEach((c, i) => {
    const row = document.createElement('div'); row.className = 'compRow';
    row.innerHTML = `<input type="text" placeholder="예: 크림 50ml" value="${c.name.replace(/"/g, '&quot;')}"><select><option value="">이미지 없음</option>${imgs.map(n => `<option ${n === c.img ? 'selected' : ''}>${n}</option>`).join('')}${c.img && !imgs.includes(c.img) ? `<option value="${c.img}" selected>${c.img} (올릴 예정)</option>` : ''}</select><input type="number" min="1" placeholder="수량" value="${c.qty}"><button title="빼기">✕</button>`;
    const [nm, sel, q, del] = row.children;
    nm.oninput = () => { c.name = nm.value; persist(); updateCalc(); }; sel.onchange = () => { c.img = sel.value; persist(); }; q.oninput = () => { c.qty = q.value; persist(); updateCalc(); };
    del.onclick = () => { formComps.splice(i, 1); if (!formComps.length) formComps.push({ name: '', img: '', qty: '' }); renderComps(); persist(); };
    box.appendChild(row);
  });
}
// 가격 계산 결과를 입력 칸 아래에 바로 보여줌
function updateCalc() {
  const P = calcPrice(readForm()); const box = $('fCalc');
  $('fPrice').placeholder = P.auto ? P.price.toLocaleString('ko-KR') + ' (자동)' : '76090';
  $('fQty').placeholder = P.qty ? `자동 ${P.qty}` : '자동';
  if (!P.price) { box.innerHTML = ''; return; }
  const parts = [`판매가 <b>${won(P.price)}</b>${P.auto ? ' <span class="dim">(정가×할인율로 계산)</span>' : ''}`];
  if (P.list) parts.push(`정가 ${won(P.list)}에서 <span class="pill">${P.rate}% 할인</span>`);
  if (P.per) parts.push(`${P.qty}${P.unit} 기준 <b>1${P.unit}당 약 ${won(P.per)}꼴</b>`);
  box.innerHTML = parts.join('<br>');
}
function formData() {
  const f = readForm();
  Object.assign(f, { fmt: S.fmt, dur: S.dur, feel: S.feel, logo: S.assets['로고'] ? '로고' : '' });
  if (String(f.theme).startsWith('style:')) { f.style = f.theme.slice(6); f.theme = ''; }
  // 자동: 상품명 분위기 → 상품 사진 색 → 기본 순서로 / 지금 테마 그대로: 오른쪽에서 고른 테마·폰트
  else if (!f.theme || f.theme === '__img') { const a = autoTheme(f); if (a.theme === 'key') { S.key = a.key; setKeyColor(S.key); } f.theme = a.theme || ''; }
  else if (f.theme === 'theme') { f.theme = S.theme; f.font = S.font || ''; }
  if (f.theme === 'key') { const tone = toneFromColor(S.key); f.key = S.key; f.feel = tone.feel; f.font = tone.font; showTone(); }
  return f;
}
const directFor = (d, seed) => (d.fmt === '통강조' ? directTong : d.recipe === 'typo' ? directInsert : directStoryboard)(d, seed);
function runDirector(newSeed) {
  const f = formData();
  if (!f.product && !f.price && !f.listPrice && !f.comps.length) { toast('상품명이나 가격을 먼저 넣어 주세요'); $('fProduct').focus(); return; }
  if (newSeed) S.seed = (S.seed % 997) + 1 + Math.floor(Math.random() * 50);
  setText(directFor(f, S.seed), newSeed ? '새 버전으로 바꿨어요' : '자동 연출을 만들었어요');
}
async function runAI() {
  const key = $('aiKey').value.trim();
  if (!key) { $('aiKeyBox').open = true; $('aiKey').focus(); $('aiMsg').textContent = 'Anthropic API 키를 넣어 주세요. (console.anthropic.com 에서 발급)'; return; }
  try { localStorage.setItem('hfm.key', key); } catch (_) { }
  const btn = $('aiBtn'); btn.disabled = true; const t0 = Date.now();
  const tick = setInterval(() => { $('aiMsg').textContent = `AI가 연출을 고민하고 있어요… ${Math.round((Date.now() - t0) / 1000)}초`; }, 500);
  try {
    const r = await aiDirect({ apiKey: key, form: Object.assign(readForm(), { 형식: S.fmt, 가격계산: calcPrice(readForm()), 키컬러: S.theme === 'key' ? S.key : undefined }), current: $('sb').value, request: $('aiReq').value.trim(), assets: Object.keys(S.assets) });
    const chk = parseStoryboard(r.storyboard);
    if (!chk.scenes.length) throw new Error('AI가 만든 스토리보드를 읽지 못했어요. 다시 시도해 주세요.');
    setText(r.storyboard, 'AI 연출을 적용했어요');
    $('aiConcept').textContent = '✦ ' + r.concept;
    $('aiMsg').textContent = chk.errors.length ? '일부 줄은 문법이 맞지 않아 빠졌어요. 스토리보드 탭에서 확인해 주세요.' : '';
  } catch (e) { $('aiMsg').textContent = e.message; console.error(e); }
  clearInterval(tick); btn.disabled = false;
}
// ---------- 여러 스타일로 한 번에 뽑기 · 일괄 내보내기 ----------
let VARS = [], batchCancel = false, batching = false;
function makeVariants() {
  const base = formData0();
  if (!base.product && !base.price && !base.listPrice && !base.comps.length) { toast('상품명이나 가격을 먼저 넣어 주세요'); $('fProduct').focus(); return; }
  const ids = Object.keys(STYLES); const cur = String($('fTheme').value).startsWith('style:') ? $('fTheme').value.slice(6) : null;
  const pickN = []; if (cur) pickN.push(cur);
  const pool = ids.filter(x => x !== cur).sort(() => Math.random() - .5);
  if (base.recipe === 'typo' && S.fmt !== '통강조') pool.sort((a, b) => (STYLES[b].insert ? 1 : 0) - (STYLES[a].insert ? 1 : 0));
  while (pickN.length < 4) pickN.push(pool.shift());
  VARS = pickN.map(id => { const d = Object.assign({}, base, { style: id, theme: '' }); const seed = 1 + Math.floor(Math.random() * 900); return { id, name: STYLES[id].name, text: directFor(d, seed), pick: true }; });
  renderVariants();
}
function formData0() { const f = readForm(); return Object.assign(f, { fmt: S.fmt, dur: S.dur, feel: S.feel, logo: S.assets['로고'] ? '로고' : '' }); }
function renderVariants() {
  const box = $('variants'); if (!VARS.length) { box.innerHTML = ''; return; }
  const tall = S.fmt === '통강조', cw = tall ? 188 : 384, ch = tall ? 395 : 216;
  box.innerHTML = `<div class="variants${tall ? ' tall' : ''}">${VARS.map((v, i) => `<div class="vcard"><label class="pick"><input type="checkbox" data-i="${i}" ${v.pick ? 'checked' : ''}>${tall ? '' : '내보내기'}</label><canvas width="${cw}" height="${ch}" data-i="${i}" title="눌러서 적용"></canvas><div class="vb">${v.name}<button class="small soft" data-apply="${i}">적용</button></div></div>`).join('')}</div>
    <div class="vbar"><button class="primary small" id="batchBtn">⬇ 선택한 버전 모두 내보내기</button><button class="small" id="varMore">🎲 다시 뽑기</button><span class="dim" id="batchMsg"></span></div>`;
  box.querySelectorAll('input[type=checkbox]').forEach(cb => cb.onchange = () => VARS[+cb.dataset.i].pick = cb.checked);
  box.querySelectorAll('[data-apply]').forEach(b => b.onclick = () => applyVariant(+b.dataset.apply));
  box.querySelectorAll('canvas').forEach(c => c.onclick = () => applyVariant(+c.dataset.i));
  $('batchBtn').onclick = () => batching ? (batchCancel = true) : batchExport();
  $('varMore').onclick = makeVariants;
  drawVariantThumbs();
}
async function drawVariantThumbs() {
  const cs = [...$('variants').querySelectorAll('canvas')];
  for (let i = 0; i < VARS.length; i++) {
    await loadFontsFor(VARS[i].text); await new Promise(r => setTimeout(r, 0));
    const p = projFromText(VARS[i].text); const k = Math.max(0, p.scenes.findIndex(s => s.type === 'price')); const sc = p.scenes[k]; if (!sc) continue;
    setStage(stageOf(p)); const big = document.createElement('canvas'); big.width = W; big.height = H;
    renderFrame(big.getContext('2d'), p, sc.start + Math.min(sc.dur * .7, sc.dur - .5), { showLbar: $('lbarChk').checked });
    if (cs[i]) { const g = cs[i].getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(big, 0, 0, cs[i].width, cs[i].height); }
  }
  S.dirty = true;
}
function applyVariant(i) { const v = VARS[i]; if (!v) return; setText(v.text, `'${v.name}' 버전을 적용했어요`); }
async function batchExport() {
  const list = VARS.filter(v => v.pick); if (!list.length) { toast('내보낼 버전을 체크해 주세요'); return; }
  // 크롬·엣지는 저장할 폴더를 한 번 고르면 파일 이름 그대로 연달아 저장 (여러 번 다운로드 허용 창이 안 뜸)
  let dir = null, appDir = null;
  if (APP) { appDir = await APP.pickFolder(); if (!appDir) return; }
  else if (window.showDirectoryPicker) {
    try { dir = await window.showDirectoryPicker({ id: 'hfm-batch', mode: 'readwrite' }); }
    catch (e) { if (e && e.name === 'AbortError') return; dir = null; }
  }
  batching = true; batchCancel = false; setPlaying(false); $('batchBtn').textContent = '■ 그만하기'; const msg = $('batchMsg');
  try {
    for (let k = 0; k < list.length; k++) {
      const v = list[k]; await loadFontsFor(v.text); const p = projFromText(v.text);
      const r = await exportVideo(p, { fps: 29.97, withLbar: false, audio: true, cancel: () => batchCancel }, q => { msg.textContent = `${k + 1}/${list.length} ${v.name} 렌더링 ${(q * 100).toFixed(0)}%`; });
      const first = (p.scenes[0] && sceneText(p.scenes[0], ' ').replace(/[^\w가-힣]/g, '').slice(0, 10)) || '하드필러';
      const fname = `${p.fmt}_${v.name.replace(/\s/g, '')}_${first}_${p.total.toFixed(0)}초.${r.ext}`;
      if (appDir) {
        const saved = await APP.writeFile(appDir, fname, await r.blob.arrayBuffer());
        if (APP_MXF() && p.fmt !== '통강조' && r.ext === 'mp4') await makeMxf(saved, 29.97, !!r.audio, p.total, m => { msg.textContent = `${k + 1}/${list.length} ${v.name} ${m}`; });
      } else if (dir) { const fh = await dir.getFileHandle(fname, { create: true }); const w = await fh.createWritable(); await w.write(r.blob); await w.close(); }
      else { downloadBlob(r.blob, fname); await new Promise(res => setTimeout(res, 600)); }
    }
    msg.textContent = `${list.length}개 버전을 모두 저장했어요${appDir ? ` (${appDir})` : dir ? ' (고른 폴더에 저장)' : ''}`;
  } catch (e) { msg.textContent = '중단: ' + e.message; }
  batching = false; const b = $('batchBtn'); if (b) b.textContent = '⬇ 선택한 버전 모두 내보내기';
}
function bindQuick() {
  renderComps();
  $('fAddComp').onclick = () => { formComps.push({ name: '', img: '', qty: '' }); renderComps(); };
  [...Object.values(FORM_IDS), 'fPoints'].forEach(id => $(id).addEventListener('input', persist));
  [...Object.values(FORM_IDS), 'fUnit'].forEach(id => $(id).addEventListener('input', updateCalc));
  $('fPerScene').onchange = persist; updateCalc();
  // 단서 자막은 쓰는 대로 화면에 반영 (스토리보드 첫 줄 '단서:'). 자동 연출 칸과 직접 만들기 칸은 같은 값
  let danT = 0;
  ['fDan', 'bDan'].forEach(id => { const el = $(id); const apply = () => { clearTimeout(danT); const v = el.value.trim(); if (v === S.dan) return; S.dan = v; writeSettings(); };
    el.addEventListener('input', () => { clearTimeout(danT); danT = setTimeout(apply, 400); }); el.addEventListener('change', apply); });
  $('recipeSeg').onclick = e => { const b = e.target.closest('button'); if (!b) return; $('fRecipe').value = b.dataset.v; syncRecipe(); persist(); };
  $('fPriceMotion').onchange = persist;
  $('dirBtn').onclick = () => runDirector(false);
  $('shuffleBtn').onclick = () => runDirector(true);
  $('aiBtn').onclick = runAI;
  $('multiBtn').onclick = makeVariants;
  $('aiKey').onchange = () => { try { localStorage.setItem('hfm.key', $('aiKey').value.trim()); } catch (_) { } };
}

// ---------- 스토리보드 파싱 ----------
let parseTimer = 0;
function parseSoon() { clearTimeout(parseTimer); parseTimer = setTimeout(parseNow, 250); }
function parseNow() {
  const r = parseStoryboard($('sb').value);
  const st = r.settings;
  S.fmt = normFmt(st.형식);
  S.head = st.머리 || ''; S.foot = st.꼬리 || ''; S.frame = TONG_FRAMES.includes(st.틀) ? st.틀 : '없음';
  S.dan = st.단서 || ''; S.imgK = clamp(parseFloat(st.이미지크기) || 100, 30, 300);
  S.track = clamp(parseFloat(st.자간) || 0, -20, 60); S.lead = clamp(parseFloat(st.행간) || 100, 50, 220);
  const th = themeFromName(st.테마); if (th) S.theme = th;
  if (st.길이 && !isNaN(parseFloat(st.길이))) S.dur = parseFloat(st.길이);
  if (S.fmt === '통강조') S.lbar = 'tong'; else if (st.L바 && LBAR_NAMES[st.L바]) S.lbar = LBAR_NAMES[st.L바]; else if (S.lbar === 'tong') S.lbar = FORMATS[S.fmt].lbar;
  if (st.폰트 !== undefined) S.font = fontFromName(st.폰트) || '';
  if (st.모션 && MOTIONS[st.모션]) S.motion = MOTIONS[st.모션];
  S.feel = FEEL_NAMES.includes(st.느낌) ? st.느낌 : '보통';
  S.fx = parseFxList(st.효과);
  if (/^#[0-9a-f]{6}$/i.test(st.키컬러 || '')) { const nk = st.키컬러.toLowerCase(); if (nk !== THEMES.key.hex) { S.key = nk; setKeyColor(nk); buildThemeGrid(); } S.key = nk; refreshKeyUI(); }
  S.scenes = r.scenes; S.errors = r.errors.slice();
  const mx = FORMATS[S.fmt].max; if (S.dur > mx) { S.dur = mx; S.errors.push(`${S.fmt}는 최대 ${mx}초라서 ${mx}초로 맞췄어요.`); }
  const tl = computeTimeline(S.scenes, S.dur); S.total = tl.total;
  if (tl.total > S.dur + .01) S.errors.push(`고정 길이 합(${tl.fixedSum.toFixed(1)}초)이 전체 길이보다 길어서 ${tl.total.toFixed(1)}초가 됐어요.`);
  // 없는 이미지 이름 알림
  const missing = new Set();
  S.scenes.forEach(sc => { const names = [sc.opts.이미지, ...sc.lines.join(' ').match(/@([^\s,+/]+)/g) || []].filter(Boolean).map(n => n.replace(/^@/, '')); names.forEach(n => { if (!S.assets[n]) missing.add(n); }); });
  if (missing.size) S.errors.push(`아직 올리지 않은 이미지: ${[...missing].join(', ')} ('🖼 소스' 탭에서 올리고 이름을 맞춰 주세요. 없으면 자리 표시로 나와요.)`);
  $('errs').textContent = S.errors.join('\n');
  $('sceneCount').textContent = `${S.scenes.length}장면 · ${S.total.toFixed(1)}초`;
  syncControls(); buildTimeline(); if (S.sel >= S.scenes.length) S.sel = -1; buildInspector(); buildStack(); thumbsSoon(); fontsSoon();
  S.t = Math.min(S.t, S.total); S.dirty = true; persist();
}

const LBAR_CHK = {}; let chkFmt = null;
function syncControls() {
  // L바 체크는 형식별로 따로 기억 (통강조는 처음엔 세로 화면 그대로, 체크하면 L바 안에 넣어 보기)
  if (S.fmt !== chkFmt) { if (chkFmt) LBAR_CHK[chkFmt] = $('lbarChk').checked; $('lbarChk').checked = LBAR_CHK[S.fmt] ?? S.fmt !== '통강조'; chkFmt = S.fmt; S.dirty = true; }
  const tong = S.fmt === '통강조';
  [...$('fmtSeg').children].forEach(b => b.classList.toggle('on', b.dataset.v === S.fmt));
  document.body.classList.toggle('tong', tong);
  if (DD.ddTheme) DD.ddTheme.set(S.theme); if (DD.ddFont) DD.ddFont.set(S.font || ''); if (DD.ddStyle) DD.ddStyle.set($('fTheme').value || '');
  $('feelSel').value = S.feel; $('motionSel').value = S.motion; $('lbarSel').value = tong ? 'full' : S.lbar; $('frameSel').value = S.frame || '없음';
  [...$('fxGlobal').children].forEach(b => b.classList.toggle('on', S.fx.includes(b.dataset.n)));
  const mx = FORMATS[S.fmt].max; $('durRange').max = mx; $('durNum').max = mx; $('durRange').min = tong ? 3 : 5;
  $('durRange').value = S.dur; $('durNum').value = S.dur;
  $('trackK').value = S.track; $('trackKv').textContent = S.track; $('leadK').value = S.lead; $('leadKv').textContent = S.lead + '%';
  if (palFmt !== (tong ? 'tong' : 'wide')) buildPalette();
  for (const id of ['fDan', 'bDan']) if (document.activeElement !== $(id)) $(id).value = S.dan || '';
  $('imgK').value = S.imgK; $('imgKv').textContent = S.imgK + '%';
  $('fmtBadge').textContent = S.fmt; $('lbarLbl').textContent = tong ? 'L바에 넣어 보기' : 'L바 보기';
  $('thumbs').classList.toggle('tall', tong); updateStyleNow();
}
// 형식 탭 바꾸기: 탭마다 스토리보드를 따로 기억. 처음 여는 탭은 빈 화면
function switchFormat(v) {
  if (!FORMATS[v] || v === S.fmt) return;
  S.texts[S.fmt] = $('sb').value;
  const text = S.texts[v] || blankText(v); // 처음 여는 탭은 빈 화면 (예시·자동 연출은 원할 때만)
  VARS = []; renderVariants();
  setText(text, `${v} 탭으로 바꿨어요`);
  if (S.scenes[0] && !S.playing) { S.t = Math.min(1.4, S.scenes[0].dur * .6); S.dirty = true; }
}

// 상단 설정을 스토리보드 첫 줄에 반영
function writeSettings() {
  const s = { 형식: S.fmt, 테마: THEMES[S.theme].name, 길이: String(S.dur) };
  if (S.fmt === '통강조') { if (S.head) s.머리 = S.head; if (S.foot) s.꼬리 = S.foot; if (S.frame && S.frame !== '없음') s.틀 = S.frame; }
  else s.L바 = LBAR_LABEL[S.lbar];
  if (S.dan) s.단서 = S.dan;
  if (S.imgK !== 100) s.이미지크기 = String(S.imgK);
  if (S.track) s.자간 = String(S.track);
  if (S.lead !== 100) s.행간 = String(S.lead);
  if (S.theme === 'key') s.키컬러 = S.key;
  if (S.fx.length) s.효과 = S.fx.join('+');
  if (S.font) s.폰트 = FONTS[S.font].name.split(' ')[0];
  const motionName = Object.keys(MOTIONS).find(k => MOTIONS[k] === S.motion); if (S.motion !== 'pop') s.모션 = motionName;
  if (S.feel !== '보통') s.느낌 = S.feel;
  const now = Date.now(); if (now - (S.lastSetPush || 0) > 1200) { S.hist.push($('sb').value); if (S.hist.length > 40) S.hist.shift(); $('undoBtn').disabled = false; } S.lastSetPush = now;
  const lines = $('sb').value.split('\n');
  const idx = lines.findIndex(l => l.trim() && !l.trim().startsWith('#'));
  const header = serializeSettings(s);
  if (idx >= 0 && !/^\s*\[/.test(lines[idx]) && lines[idx].includes(':')) lines[idx] = header; else lines.unshift(header);
  $('sb').value = lines.join('\n'); parseNow();
}

function insertLine(line) {
  const ta = $('sb'); const v = ta.value; const pos = ta.selectionEnd;
  const lineEnd = v.indexOf('\n', pos); const at = lineEnd < 0 ? v.length : lineEnd;
  ta.value = v.slice(0, at) + '\n' + line + v.slice(at); parseNow();
  const lineNo = ta.value.slice(0, at + 1).split('\n').length - 1;
  S.sel = S.scenes.findIndex(s => s.lineNo === lineNo); buildInspector(); buildTimeline();
}

// 장면 하나를 스토리보드 텍스트에 다시 씀
function writeScene(i) {
  const sc = S.scenes[i]; const lines = $('sb').value.split('\n');
  const next = S.scenes[i + 1]; const end = next ? next.lineNo : lines.length;
  let last = sc.lineNo; for (let k = sc.lineNo + 1; k < end; k++) if (lines[k].trim() && !lines[k].trim().startsWith('#')) last = k;
  lines.splice(sc.lineNo, last - sc.lineNo + 1, serializeScene(sc));
  $('sb').value = lines.join('\n'); parseNow();
}

// ---------- 타임라인 ----------
const SEG_COL = { hook: ['#EEF0FF', '#4B55C8'], counter: ['#F3ECFF', '#7A3FD6'], product: ['#E8F7F1', '#13865E'], impact: ['#FFEAF2', '#C8326E'], list: ['#E9F3FF', '#2D6FB8'], composition: ['#FFF3E3', '#B8660F'], benefits: ['#EEF7E6', '#4C7F1F'], price: ['#FFE9EA', '#F40013'], urgent: ['#FFE6EE', '#B01A4E'], cta: ['#E7F4FA', '#1F6E99'], outro: ['#F0F0F3', '#4B4D57'], points: ['#E6F7F4', '#0F7A66'], badge: ['#FFF4D6', '#A86A00'], info: ['#EEF1F5', '#3D5268'], typo: ['#1E1E24', '#FFFFFF'] };
function buildTimeline() {
  const tl = $('timeline'); [...tl.querySelectorAll('.seg2')].forEach(n => n.remove());
  S.scenes.forEach((sc, i) => {
    const d = document.createElement('div'); d.className = 'seg2' + (i === S.sel ? ' sel' : '');
    d.style.left = `calc(${sc.start / S.total * 100}% + 3px)`; d.style.width = `calc(${sc.dur / S.total * 100}% - 6px)`;
    const [bg, fg] = SEG_COL[sc.type] || SEG_COL.outro; d.style.background = bg; d.style.color = fg;
    d.innerHTML = `${BLOCK_LABEL[sc.type]}<small>${sc.dur.toFixed(1)}초</small>`; d.title = sceneText(sc);
    tl.appendChild(d);
  });
  markThumbs();
}
function seekFromEvent(ev) {
  const r = $('timeline').getBoundingClientRect(); const x = clamp((ev.clientX - r.left) / r.width);
  S.t = x * S.total; const i = S.scenes.findIndex(s => S.t >= s.start && S.t < s.start + s.dur);
  if (i >= 0 && i !== S.sel) { S.sel = i; buildInspector(); buildTimeline(); }
  S.dirty = true; if (S.playing) restartAudio();
}

// ---------- 장면 편집 칸 (직접 만들기: 문구 · 이미지 · 단서 자막 · 꾸미기를 한 곳에서) ----------
// 첫 항목(auto)은 '정하지 않음'이라 고르면 그 옵션을 지움
function opt(sel, values, cur, auto = '자동') {
  return `<select data-k="${sel}" data-auto="${auto}">` + [auto, ...values].map(v => `<option ${v === (cur || auto) ? 'selected' : ''}>${v}</option>`).join('') + '</select>';
}
const curScene = () => S.scenes[S.sel];
function setOpt(k, v) { const c = curScene(); if (!c) return; if (v) c.opts[k] = v; else delete c.opts[k]; writeScene(S.sel); }
// 장면 데이터는 고칠 때마다 새로 만들어지므로, 항상 '지금 선택된 장면'에 씀
function bindOpts(root) {
  root.querySelectorAll('[data-k]').forEach(el => {
    const k = el.dataset.k, val = () => { let v = el.value.trim(); if (el.dataset.auto !== undefined && v === el.dataset.auto) v = ''; return v; };
    if (el.tagName === 'INPUT' && el.type === 'text') { // 글자 칸은 쓰는 대로 반영 (커서는 그대로)
      let tm = 0; el.oninput = () => { clearTimeout(tm); tm = setTimeout(() => setOpt(k, val()), 350); };
      el.onchange = () => { clearTimeout(tm); const c = curScene(); if (c && (c.opts[k] || '') !== val()) setOpt(k, val()); };
    } else el.onchange = () => setOpt(k, val());
  });
}
// 문구 칸 위 도구: *강조* · 줄 꾸밈 (작게)(크게)(박스)… · 글자|분리
function lineTool(ta, d) {
  const v = ta.value, s0 = ta.selectionStart, s1 = ta.selectionEnd;
  if (d.tool === 'em' && s1 > s0 && !v.slice(s0, s1).includes('\n')) {
    const sel = v.slice(s0, s1), w = /^\*.*\*$/.test(sel) ? sel.slice(1, -1) : '*' + sel.replace(/\*/g, '') + '*';
    ta.value = v.slice(0, s0) + w + v.slice(s1); ta.setSelectionRange(s0, s0 + w.length); return;
  }
  const ls = v.lastIndexOf('\n', s0 - 1) + 1, le0 = v.indexOf('\n', s0), le = le0 < 0 ? v.length : le0;
  let line = v.slice(ls, le); const lt = lineTag(line), pre = line.slice(0, line.length - lt.text.length), body = lt.text;
  if (d.tool === 'em') line = pre + (/^\*[^*]*\*$/.test(body.trim()) ? body.replace(/\*/g, '') : body.trim() ? '*' + body.replace(/\*/g, '').trim() + '*' : '**');
  else if (d.tool === 'split') line = pre + (body.includes('|') ? body.replace(/\|/g, '') : [...body.replace(/[*\s]/g, '')].join('|'));
  else if (d.tag) line = (lt.tag === d.tag ? '' : `(${d.tag})`) + body;
  ta.value = v.slice(0, ls) + line + v.slice(le); const pos = ls + line.length - (line.endsWith('**') && !body.trim() ? 1 : 0); ta.setSelectionRange(pos, pos);
}
const TYPO_TAGS = [['작게', '작은 머리 줄'], ['크게', '더 크게'], ['박스', '색 상자 안 글자'], ['외곽', '속 빈 글자'], ['테이프', '기울어진 띠'], ['입체', '긴 그림자'], ['자간', '넓은 자간']];
const SC_DESIGN_KEY = 'hfm.design';
function buildSceneText() {
  const card = $('sceneCard'), box = $('sceneText'), sc = S.scenes[S.sel];
  if (!sc) { card.hidden = true; box.innerHTML = ''; box.dataset.i = ''; return; }
  card.hidden = false;
  // 글자 칸에 쓰는 중이면 칸을 다시 만들지 않음 (커서가 튀지 않게)
  const ae = document.activeElement;
  if (box.dataset.i === String(S.sel) && box.dataset.t === sc.type && ae && box.contains(ae) && ae.matches('textarea, input[type=text]')) return;
  const keepOpen = box.querySelector('#iDesign'); let open = keepOpen ? keepOpen.open : null;
  if (open === null) { try { open = localStorage.getItem(SC_DESIGN_KEY) !== '0'; } catch (_) { open = true; } }
  box.dataset.i = String(S.sel); box.dataset.t = sc.type;
  const b = BLOCKS[sc.type], o = sc.opts, tong = S.fmt === '통강조', imgs = Object.keys(S.assets), hasImg = !!o.이미지 || sc.lines.some(l => l.includes('@'));
  const esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const tools = `<button type="button" class="em" data-tool="em" title="고른 글자(없으면 지금 줄)를 포인트 색으로">✦ *강조*</button>`
    + (sc.type === 'typo' ? TYPO_TAGS.map(([t, d]) => `<button type="button" data-tag="${t}" title="지금 줄: ${d} (한 번 더 누르면 해제)">(${t})</button>`).join('') : '')
    + (sc.type === 'impact' ? `<button type="button" data-tool="split" title="지금 줄을 한 글자씩 나눠서 크게">글자|분리</button>` : '');
  const fontNames = Object.values(FONTS).map(f => f.name.split(' ')[0]), curFont = o.폰트 && fontFromName(o.폰트) ? FONTS[fontFromName(o.폰트)].name.split(' ')[0] : '';
  const typeOpt = sc.type === 'impact' ? `<div class="field"><label>강조 방식</label>${opt('스타일', ['분리', '반복', '기울임', '박스'], o.스타일)}</div>`
    : sc.type === 'typo' ? `<div class="field"><label>타이포 방식</label>${opt('스타일', ['쌓기', '교체'], o.스타일, '쌓기')}</div>`
    : sc.type === 'product' && !tong ? `<div class="field"><label>이미지 위치</label>${opt('위치', ['좌'], o.위치, '우')}</div>` : '';
  box.innerHTML = `
    <div class="row2">
      <div class="field"><label>장면 종류</label><select id="iType">${Object.entries(BLOCKS).filter(([k]) => k !== 'benefits' || k === sc.type).map(([k, v]) => `<option value="${k}" ${k === sc.type ? 'selected' : ''}>${v.name}</option>`).join('')}</select></div>
      <div class="field"><label>길이 (초) <span class="dim">비우면 자동</span></label><input type="number" step="0.1" min="0.5" data-k="길이" value="${esc(o.길이)}" placeholder="${sc.dur.toFixed(1)}"></div>
    </div>
    <div class="field"><label>문구 <span class="dim">한 줄 = 화면의 한 줄</span></label>
      <div class="lineTools" id="iTools">${tools}</div>
      <textarea id="iLines" placeholder="${esc(LINE_GUIDE[sc.type] || '문구를 써 주세요')}">${esc(sc.lines.join('\n'))}</textarea><span class="hint">${b.help}</span></div>
    <div class="row2">
      <div class="field"><label>이미지</label>${opt('이미지', imgs, o.이미지, '없음')}</div>
      ${hasImg ? `<div class="field"><label>이미지 크기 <span class="dim" id="iKv">${o.크기 || 100}%</span></label><input type="range" id="iK" min="40" max="220" step="5" value="${parseFloat(o.크기) || 100}"></div>` : ''}
    </div>
    ${sc.type === 'price' ? `<div class="grid3">
      <div class="field"><label>정가 <span class="dim">취소선</span></label><input type="text" data-k="정가" value="${esc(o.정가)}" placeholder="99,000원"></div>
      <div class="field"><label>할인 <span class="dim">배지</span></label><input type="text" data-k="할인" value="${esc(o.할인)}" placeholder="23%"></div>
      <div class="field"><label>숫자 연출</label><select data-k="가격모션" data-auto="굴리기"><option value="굴리기">굴리기</option><option value="내려가기" ${o.가격모션 === '내려가기' ? 'selected' : ''}>정가→내려가기</option></select></div>
    </div>` : ''}
    <div class="field"><label>단서 자막 <span class="dim">이 장면만 · 비우면 공통 · 없음 = 빼기</span></label><input type="text" data-k="단서" value="${esc(o.단서)}" placeholder="${esc(S.dan ? '공통: ' + S.dan : '예: 가격 기준 | NS 정상가 대비, 모바일 할인 별도')}"></div>
    <details class="scDesign" id="iDesign" ${open ? 'open' : ''}><summary>🎨 꾸미기 <span class="dim">배경 · 모션 · 전환 · 효과 (이 장면만)</span></summary>
      <div class="grid3">
        <div class="field"><label>배경</label>${opt('배경', ['1', '2', '3'], o.배경)}</div>
        <div class="field"><label>모션</label>${opt('모션', Object.keys(MOTIONS), o.모션, '기본')}</div>
        <div class="field"><label>다음 전환</label>${opt('전환', TRANSITIONS.slice(1), o.전환)}</div>
        <div class="field"><label>소품</label>${opt('소품', PROPS_LIST.filter(x => !(tong && x === 'TV')), o.소품, '기본')}</div>
        <div class="field"><label>폰트</label>${opt('폰트', fontNames, curFont, '전체')}</div>
        ${typeOpt}
        <div class="field"><label>강조 색</label><input type="text" data-k="색" value="${esc(o.색)}" placeholder="#ff0000"></div>
        <div class="field"><label>강조 박스</label><select data-k="강조박스" data-auto="끔"><option>끔</option><option ${o.강조박스 ? 'selected' : ''} value="켬">켬</option></select></div>
      </div>
      <div class="row2">
        <div class="field"><label>자간 <span class="dim" id="iTrv"></span></label><input type="range" id="iTr" min="-10" max="30" step="1"></div>
        <div class="field"><label>행간 <span class="dim" id="iLdv"></span></label><input type="range" id="iLd" min="60" max="180" step="5"></div>
      </div>
      <div class="field" style="margin-bottom:0"><label>이 장면 효과 <span class="dim">(여러 개 가능)</span></label><div class="fxChips" id="iFx">${['없음', ...EFFECT_NAMES].map(n => `<button data-n="${n}" class="${(o.효과 || '').split('+').includes(n) ? 'on' : ''}">${n === '없음' ? '전체 효과 끄기' : n}</button>`).join('')}</div></div>
    </details>
    <div class="inspActs"><button class="small" id="iUp">▲ 앞으로</button><button class="small" id="iDown">▼ 뒤로</button><button class="small" id="iDup">복제</button><button class="small" id="iDel">삭제</button><button class="small ghost" id="iClose">접기</button></div>`;
  $('iType').onchange = e => { const c = curScene(); if (!c) return; c.type = e.target.value; c.label = BLOCK_LABEL[c.type]; writeScene(S.sel); };
  // 쓰는 대로 바로 미리보기에 반영
  const ta = $('iLines'); let typeT = 0;
  const commit = () => { clearTimeout(typeT); const cur = curScene(); if (!cur) return; const nl = ta.value.split('\n').map(s => s.trim()).filter(Boolean); if (nl.join('\n') === cur.lines.join('\n')) return; cur.lines = nl; writeScene(S.sel); };
  ta.onfocus = () => { S.hist.push($('sb').value); if (S.hist.length > 40) S.hist.shift(); $('undoBtn').disabled = false; };
  ta.oninput = () => { clearTimeout(typeT); typeT = setTimeout(commit, 220); };
  ta.onchange = commit; ta.onblur = commit;
  $('iTools').onmousedown = e => { const t = e.target.closest('button'); if (!t) return; e.preventDefault(); if (document.activeElement !== ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } lineTool(ta, t.dataset); ta.dispatchEvent(new Event('input')); };
  bindOpts(box);
  $('iDesign').ontoggle = () => { try { localStorage.setItem(SC_DESIGN_KEY, $('iDesign').open ? '1' : '0'); } catch (_) { } };
  if ($('iK')) { $('iK').oninput = e => { const c = curScene(); if (!c) return; const v = +e.target.value; $('iKv').textContent = v + '%'; if (v === 100) delete c.opts.크기; else c.opts.크기 = String(v); S.dirty = true; }; $('iK').onchange = () => writeScene(S.sel); }
  // 자간·행간: 장면 값이 없으면 전체 값을 따름 (전체 값과 같게 돌려놓으면 장면 값은 지움)
  const spc = (id, key, glob, unit) => {
    const el = $(id), lab = $(id + 'v');
    const show = () => { const c = curScene(); const own = c && c.opts[key] !== undefined; lab.textContent = (own ? c.opts[key] : glob()) + unit + (own ? '' : ' (전체)'); };
    el.value = o[key] !== undefined ? o[key] : glob(); show();
    el.oninput = () => { const c = curScene(); if (!c) return; const v = +el.value; if (v === glob()) delete c.opts[key]; else c.opts[key] = String(v); show(); S.dirty = true; };
    el.onchange = () => writeScene(S.sel);
  };
  spc('iTr', '자간', () => S.track, ''); spc('iLd', '행간', () => S.lead, '%');
  $('iFx').onclick = e => {
    const n = e.target.dataset.n, c = curScene(); if (!n || !c) return; let cur = (c.opts.효과 || '').split('+').filter(Boolean);
    if (n === '없음') cur = cur.includes('없음') ? [] : ['없음']; else { cur = cur.filter(x => x !== '없음'); cur = cur.includes(n) ? cur.filter(x => x !== n) : [...cur, n]; }
    if (cur.length) c.opts.효과 = cur.join('+'); else delete c.opts.효과; writeScene(S.sel);
  };
  $('iUp').onclick = () => moveScene(S.sel, S.sel - 1); $('iDown').onclick = () => moveScene(S.sel, S.sel + 2);
  $('iDup').onclick = () => { const c = curScene(); const lines = $('sb').value.split('\n'); lines.splice(c.lineNo + 1, 0, serializeScene(c)); $('sb').value = lines.join('\n'); parseNow(); };
  $('iDel').onclick = () => { const c = curScene(); const lines = $('sb').value.split('\n'); lines.splice(c.lineNo, 1); $('sb').value = lines.join('\n'); S.sel = -1; parseNow(); };
  $('iClose').onclick = () => { S.sel = -1; buildInspector(); buildTimeline(); };
}
// 문구 칸이 비었을 때 보여 줄 예시 (장면 종류별)
const LINE_GUIDE = {
  typo: '지금 이 방송\n*채널고정!*', hook: '작은 문구\n*큰 문구*', impact: '방송에서만\n최|다|구|성  ( | 로 글자 분리)', product: '상품 소개 한 줄\n*상품명*',
  points: '이래서 *잘 팔려요*\n특징 1\n특징 2', composition: '총 *11팩*\n크림 50ml @상품1 x10 + 미니 @상품1', price: '단,\n39,900원\n(카드 할인 시)',
  counter: '누적 판매\n100,000개\n*돌파!*', list: '*이런 분께*\n바쁜 직장인\n자취생', badge: '방송 단독\n*역대급*', info: '상품 정보\n원산지: 국내산\n중량: 5kg',
  urgent: '방송 끝나면\n*이 조건 불가능*', cta: '지금 바로\n*주문하세요!*', outro: '브랜드명 (로고 이미지는 이미지 칸에서)',
};

// ---------- 직접 만들기: 장면을 골라 쌓고 문구를 직접 씀 ----------
const DOWN = { 가격모션: '내려가기' };
const PALETTE = {
  wide: [['typo', '타이포', '큰 글자 1~3줄'], ['hook', '훅 카피', '작은 문구 + 큰 문구'], ['impact', '강조', '분리·반복·기울임'], ['product', '상품', '상품 사진 + 문구'],
    ['points', '포인트', '체크 표시 목록'], ['composition', '구성표', '구성품·수량'], ['price', '가격', '숫자 굴리기'], ['price', '할인가', '정가→판매가 내려가기', DOWN], ['counter', '실적', '숫자 카운트업'],
    ['list', '목록', '단어가 차례로'], ['badge', '배지', '별모양 스탬프'], ['info', '정보', '항목: 내용 표'], ['urgent', '한정', '마감·매진 임박'], ['cta', '마무리', '주문 한마디'], ['outro', '로고', '브랜드 엔딩']],
  tong: [['typo', '타이포', '큰 글자'], ['hook', '훅 카피', '작은+큰 문구'], ['impact', '강조', '분리·반복'], ['product', '상품', '사진 + 문구'], ['badge', '배지', '스탬프'],
    ['points', '포인트', '체크 목록'], ['price', '가격', '숫자 굴리기'], ['price', '할인가', '정가→내려가기', DOWN], ['composition', '구성표', '구성·수량'], ['info', '정보', '항목 표'], ['urgent', '한정', '마감 임박'], ['cta', '마무리', '주문 한마디']],
};
let palFmt = null, PANE = 'build';
function buildPalette() {
  palFmt = S.fmt === '통강조' ? 'tong' : 'wide';
  $('palette').innerHTML = PALETTE[palFmt].map(([t, n, d], i) => `<button data-t="${t}" data-i="${i}" title="${BLOCKS[t].help.replace(/"/g, '&quot;')}"><b>${n}</b><small>${d}</small></button>`).join('');
}
function addScene(type, preset) {
  const o = Object.assign({}, preset || {});
  if (type === 'product') { const a = Object.keys(S.assets).find(n => n !== '로고'); if (a) o.이미지 = a; }
  if (type === 'outro' && S.assets['로고']) o.이미지 = '로고';
  S.hist.push($('sb').value); if (S.hist.length > 40) S.hist.shift(); $('undoBtn').disabled = false;
  $('sb').value = $('sb').value.replace(/\s*$/, '') + '\n' + serializeScene({ label: BLOCK_LABEL[type], lines: [], opts: o }).trim();
  parseNow(); selectScene(S.scenes.length - 1);
  if (S.fmt === '통강조' && S.scenes.length > 2) toast('통강조는 최대 8초라 장면 2개 정도가 알맞아요');
  setTimeout(() => { const t = $('iLines'); if (t) { t.focus(); t.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } }, 30);
}
function fillStackItem(el, sc) {
  const ty = el.querySelector('.ty'), [bg, fg] = SEG_COL[sc.type] || SEG_COL.outro; ty.textContent = sc.type === 'price' && sc.opts.가격모션 === '내려가기' ? '할인가' : BLOCK_LABEL[sc.type]; ty.style.background = bg; ty.style.color = fg;
  const t = sceneText(sc), tx = el.querySelector('.tx'); tx.textContent = t || (sc.opts.이미지 ? `이미지: ${sc.opts.이미지}` : '문구를 써 주세요'); tx.classList.toggle('empty', !t && !sc.opts.이미지);
  el.querySelector('.du').textContent = sc.dur.toFixed(1) + '초';
}
// 장면 목록: 구조(장면 수·종류·선택)가 그대로면 글자만 바꿔서, 문구를 쓰는 중에도 커서가 그대로 있게 함
function buildStack() {
  const box = $('stack'), card = $('sceneCard'), n = S.scenes.length;
  $('stackCount').textContent = n ? `${n}장면 · ${S.total.toFixed(1)}초` : '';
  const key = [S.fmt, S.sel, ...S.scenes.map(s => s.type)].join(',');
  if (box.dataset.key === key) { [...box.querySelectorAll('.stItem')].forEach((el, i) => fillStackItem(el, S.scenes[i])); return; }
  box.dataset.key = key;
  if (card.parentNode === box) $('sceneHome').appendChild(card);
  box.innerHTML = n ? '' : '<div class="stEmpty">아직 장면이 없어요.<br>위에서 장면 종류를 눌러 하나씩 쌓아 보세요.</div>';
  S.scenes.forEach((sc, i) => {
    const el = document.createElement('div'); el.className = 'stItem' + (i === S.sel ? ' sel' : ''); el.dataset.i = i;
    el.innerHTML = '<span class="no">' + (i + 1) + '</span><span class="ty"></span><span class="tx"></span><span class="du"></span>';
    fillStackItem(el, sc);
    el.onclick = () => { if (S.sel === i) { S.sel = -1; buildInspector(); buildTimeline(); } else selectScene(i); };
    box.appendChild(el);
  });
  placeSceneCard();
}
// 직접 만들기 탭에서는 선택한 장면 편집 칸을 목록 안(그 장면 바로 아래)에 펼침
function placeSceneCard() {
  const card = $('sceneCard'), home = $('sceneHome'), inBuild = PANE === 'build';
  document.body.classList.toggle('paneBuild', inBuild);
  const it = inBuild && $('stack').querySelector(`.stItem[data-i="${S.sel}"]`);
  if (it) { if (it.nextSibling !== card) it.after(card); }
  else if (card.parentNode !== home) home.appendChild(card);
}
function showPane(p) {
  PANE = p;
  [...$('tabs').children].forEach(b => b.classList.toggle('on', b.dataset.p === p));
  document.querySelectorAll('.pane').forEach(n => n.classList.toggle('on', n.id === 'pane-' + p));
  placeSceneCard();
}
// 장면 편집 칸과 장면 목록을 지금 선택에 맞게 다시 그림 (장면 꾸미기도 이제 왼쪽 편집 칸 안에 있음)
function buildInspector() { buildSceneText(); buildStack(); }

// ---------- 장면 썸네일 + 끌어서 순서 바꾸기 ----------
// to = 끼워 넣을 자리(0..n, 옮기기 전 기준)
function moveScene(from, to) {
  const n = S.scenes.length; if (from < 0 || from >= n) return; to = clamp(to, 0, n);
  if (to === from || to === from + 1) return;
  const lines = $('sb').value.split('\n'); const first = S.scenes[0].lineNo;
  const head = lines.slice(0, first);
  const blocks = S.scenes.map((sc, i) => lines.slice(sc.lineNo, i + 1 < n ? S.scenes[i + 1].lineNo : lines.length));
  const last = blocks[n - 1]; let tail = []; while (last.length > 1 && !last[last.length - 1].trim()) tail.unshift(last.pop());
  const [b] = blocks.splice(from, 1); const dest = to > from ? to - 1 : to; blocks.splice(dest, 0, b);
  setText([...head, ...blocks.flat(), ...tail].join('\n'), `${dest + 1}번째로 옮겼어요`);
  selectScene(dest);
}
function selectScene(i) {
  if (!S.scenes[i]) return; S.sel = i; S.t = S.scenes[i].start + Math.min(S.scenes[i].dur * .6, 1.6); S.dirty = true;
  buildInspector(); buildTimeline(); markThumbs(); if (S.playing) restartAudio();
}
let thumbTimer = 0, thumbJob = 0;
function thumbsSoon() { clearTimeout(thumbTimer); thumbTimer = setTimeout(buildThumbs, 350); }
let dragFrom = -1;
async function buildThumbs() {
  const job = ++thumbJob; const box = $('thumbs'); box.innerHTML = '';
  const P = proj(); setStage(stageOf(P)); const tall = STAGE === 'tong', tw = tall ? 160 : 320, th2 = tall ? 336 : 180;
  const big = document.createElement('canvas'); big.width = W; big.height = H; const bctx = big.getContext('2d');
  const view = { showLbar: $('lbarChk').checked && !tall };
  const cards = S.scenes.map((sc, i) => {
    const d = document.createElement('div'); d.className = 'thumb'; d.draggable = true; d.dataset.i = i;
    const c = document.createElement('canvas'); c.width = tw; c.height = th2;
    d.innerHTML = `<div class="txt"></div><div class="cap"><span class="no">${i + 1}</span>${BLOCK_LABEL[sc.type]}<small>${sc.dur.toFixed(1)}초</small></div>`;
    d.insertBefore(c, d.firstChild); d.querySelector('.txt').textContent = sceneText(sc);
    d.onclick = () => { if (PANE !== 'build' && PANE !== 'board') showPane('build'); selectScene(i); revealCard(); };
    d.ondragstart = e => { dragFrom = i; d.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(i)); } catch (_) { } };
    d.ondragend = () => { dragFrom = -1; box.querySelectorAll('.thumb').forEach(t => t.classList.remove('dragging', 'dropL', 'dropR')); };
    d.ondragover = e => { if (dragFrom < 0) return; e.preventDefault(); const r = d.getBoundingClientRect(); const right = e.clientX > r.left + r.width / 2;
      box.querySelectorAll('.thumb').forEach(t => t.classList.remove('dropL', 'dropR')); d.classList.add(right ? 'dropR' : 'dropL'); };
    d.ondrop = e => { e.preventDefault(); if (dragFrom < 0) return; const r = d.getBoundingClientRect(); const to = i + (e.clientX > r.left + r.width / 2 ? 1 : 0); const f = dragFrom; dragFrom = -1; moveScene(f, to); };
    box.appendChild(d); return c;
  });
  const add = document.createElement('button'); add.className = 'thumbAdd'; add.textContent = '+ 장면'; add.title = '직접 만들기에서 장면 추가';
  add.onclick = () => { showPane('build'); $('palette').scrollIntoView({ behavior: 'smooth', block: 'center' }); };
  box.appendChild(add); markThumbs();
  for (let i = 0; i < cards.length; i++) {
    await new Promise(r => setTimeout(r, 0)); if (job !== thumbJob) return;
    const sc = S.scenes[i]; if (!sc) return;
    const tt = sc.start + Math.max(.1, Math.min(sc.dur * .62, sc.dur - FEEL.win - .15, 2.4));
    renderFrame(bctx, P, tt, view); const g = cards[i].getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(big, 0, 0, tw, th2);
  }
  S.dirty = true; lastWarnKey = null;
}
// 고른 장면의 편집 칸이 왼쪽 목록에서 보이게 (세로 한 줄 화면에서는 스크롤하지 않음)
function revealCard() { setTimeout(() => { const c = $('sceneCard'); if (!c.hidden && c.parentNode === $('stack') && matchMedia('(min-width:1281px)').matches) c.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 40); }
function markThumbs() { [...$('thumbs').querySelectorAll('.thumb')].forEach((t, k) => t.classList.toggle('sel', k === S.sel)); }

// ---------- 키컬러 ----------
const KEY_PRESETS = ['#f40013', '#111111'];
let keySuggest = [];
function refreshKeyUI() {
  $('keyColor').value = S.key;
  const all = [...new Set([...KEY_PRESETS, ...keySuggest])].slice(0, 9);
  $('keySw').innerHTML = all.map(c => `<button class="sw${c === S.key ? ' on' : ''}" data-c="${c}" style="background:${c}" title="${c}"></button>`).join('');
}
function showTone() { const t = toneFromColor(S.key); $('keyTone').textContent = `${t.label} · 모션 ${t.feel} · ${FONTS[t.font].name.split(' (')[0]}`; }
function suggestKeys() {
  keySuggest = []; for (const a of Object.values(S.assets)) { try { keySuggest.push(...extractColors(a.img, 3)); } catch (_) { } }
  refreshKeyUI();
}
function applyKey(hex, quiet) {
  S.key = hex.toLowerCase(); const t = toneFromColor(S.key);
  S.theme = 'key'; S.feel = t.feel; S.font = t.font; $('fTheme').value = 'theme'; persist();
  setKeyColor(S.key); buildThemeGrid(); refreshKeyUI(); showTone(); writeSettings();
  if (!quiet) toast(`키컬러로 톤을 맞췄어요 · ${t.label}`, true);
}
function bindKey() {
  refreshKeyUI();
  $('keyColor').oninput = e => { S.key = e.target.value; refreshKeyUI(); showTone(); };
  $('keyColor').onchange = e => applyKey(e.target.value);
  $('keySw').onclick = e => { const c = e.target.dataset.c; if (c) applyKey(c); };
  $('keyApply').onclick = () => applyKey($('keyColor').value);
  $('keyFromImg').onclick = () => {
    const names = Object.keys(S.assets);
    if (!names.length) { toast('먼저 소스 탭에서 상품 이미지를 올려 주세요'); $('tabs').querySelector('[data-p=src]').click(); return; }
    const img = (S.scenes[S.sel] && S.scenes[S.sel].opts.이미지 && S.assets[S.scenes[S.sel].opts.이미지]) ? S.scenes[S.sel].opts.이미지 : names[0];
    const cols = extractColors(S.assets[img].img, 4); if (!cols.length) { toast('이미지에서 뚜렷한 색을 찾지 못했어요'); return; }
    keySuggest = [...new Set([...cols, ...keySuggest])]; applyKey(cols[0], true);
    toast(`'${img}' 이미지 색으로 톤을 맞췄어요 · ${toneFromColor(cols[0]).label}`, true);
  };
}

// ---------- 이미지 소스 ----------
function addAsset(name, canvas, original) {
  let n = name.replace(/\.[^.]+$/, '').replace(/[\s,+/@{}]/g, '').slice(0, 20) || '이미지';
  if (S.assets[n] && S.assets[n].img !== canvas) { let k = 2; while (S.assets[n + k]) k++; n = n + k; }
  S.assets[n] = { img: canvas, orig: original || canvas };
  renderAssets(); parseNow();
}
function renderAssets() {
  const box = $('assets'); box.innerHTML = '';
  for (const [n, a] of Object.entries(S.assets)) {
    const d = document.createElement('div'); d.className = 'asset';
    const c = document.createElement('canvas'); const s = Math.min(128 / a.img.width, 128 / a.img.height); c.width = Math.max(1, a.img.width * s); c.height = Math.max(1, a.img.height * s);
    c.getContext('2d').drawImage(a.img, 0, 0, c.width, c.height);
    const r = document.createElement('div');
    r.innerHTML = `<input type="text" value="${n}" style="width:100%"><div class="acts"><button class="small" data-a="rm">배경 제거</button><label class="dim">허용치 <input type="range" min="5" max="120" value="${a.tol || 40}" style="width:70px;vertical-align:middle"></label><button class="small" data-a="orig">원본</button><button class="small" data-a="del">삭제</button></div>`;
    d.append(c, r); box.appendChild(d);
    const [inp] = r.getElementsByTagName('input'); const tol = r.querySelector('input[type=range]');
    inp.onchange = () => { const nn = inp.value.replace(/[\s,+/@{}]/g, ''); if (!nn || S.assets[nn]) { inp.value = n; return; } S.assets[nn] = a; delete S.assets[n];
      $('sb').value = $('sb').value.split('@' + n).join('@' + nn).replace(new RegExp('(이미지:\\s*)' + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=[,}])', 'g'), '$1' + nn); renderAssets(); parseNow(); };
    tol.oninput = () => a.tol = +tol.value;
    r.querySelector('[data-a=rm]').onclick = () => { a.img = removeBackground(a.orig, a.tol || 40, 2); renderAssets(); S.dirty = true; };
    r.querySelector('[data-a=orig]').onclick = () => { a.img = a.orig; renderAssets(); S.dirty = true; };
    r.querySelector('[data-a=del]').onclick = () => { delete S.assets[n]; renderAssets(); parseNow(); };
  }
  if (S.sel >= 0) buildInspector();
  renderComps(); suggestKeys(); thumbsSoon(); saveAssetsSoon();
}
async function fileToCanvas(f) {
  const url = URL.createObjectURL(f); try { const img = await loadImageFromURL(url); return trimMargins(imageToCanvas(img)); } finally { URL.revokeObjectURL(url); }
}

// ---------- BGM ----------
let AC = null, bgmNode = null;
async function loadBgm(file, buf) {
  AC = AC || new AudioContext();
  const ab = buf || await file.arrayBuffer();
  const audio = await AC.decodeAudioData(ab.slice(0));
  S.bgm = { name: file ? file.name : (S.bgm && S.bgm.name) || 'bgm', buffer: audio, raw: ab, volume: 80, fade: 1.5, offset: 0 };
  renderBgm();
}
function renderBgm() {
  const b = $('bgmBox'); saveAssetsSoon();
  if (!S.bgm) { b.innerHTML = '하드필러는 보통 무음이에요. 오프닝필러에 음악을 넣을 때 쓰세요.'; return; }
  b.innerHTML = `<div>${S.bgm.name} · ${S.bgm.buffer.duration.toFixed(1)}초</div>
   <label>볼륨 <input type="range" id="bgVol" min="0" max="100" value="${S.bgm.volume}"></label>
   <label>끝 페이드(초) <input type="number" id="bgFade" min="0" max="5" step=".5" value="${S.bgm.fade}" style="width:56px"></label>
   <label>시작 위치(초) <input type="number" id="bgOff" min="0" step=".5" value="${S.bgm.offset}" style="width:56px"></label>
   <button class="small" id="bgDel">삭제</button>`;
  $('bgVol').oninput = e => { S.bgm.volume = +e.target.value; if (bgmGain) bgmGain.gain.value = S.bgm.volume / 100; };
  $('bgVol').onchange = saveAssetsSoon; $('bgFade').onchange = e => { S.bgm.fade = +e.target.value; saveAssetsSoon(); }; $('bgOff').onchange = e => { S.bgm.offset = +e.target.value; saveAssetsSoon(); };
  $('bgDel').onclick = () => { stopAudio(); S.bgm = null; renderBgm(); };
}
let bgmGain = null;
function restartAudio() {
  stopAudio(); if (!S.bgm || !S.playing) return;
  AC = AC || new AudioContext(); if (AC.state === 'suspended') AC.resume();
  bgmNode = AC.createBufferSource(); bgmNode.buffer = S.bgm.buffer; bgmGain = AC.createGain(); bgmGain.gain.value = S.bgm.volume / 100;
  bgmNode.connect(bgmGain); bgmGain.connect(AC.destination); bgmNode.start(0, (S.bgm.offset || 0) + S.t);
}
function stopAudio() { if (bgmNode) { try { bgmNode.stop(); } catch (_) { } bgmNode = null; } }

// ---------- 재생 루프 ----------
let lastTs = 0, lastWarnKey = null;
function loop(ts) {
  const dt = lastTs ? (ts - lastTs) / 1000 : 0; lastTs = ts;
  if (S.playing) {
    S.t += dt; if (S.t >= S.total) { if ($('loopChk').checked) { S.t = 0; restartAudio(); } else { S.t = S.total; setPlaying(false); } }
    S.dirty = true;
  }
  if (S.dirty) {
    S.dirty = false;
    const tong = S.fmt === '통강조', inset = tong && $('lbarChk').checked, cv = $('cv');
    $('canvasWrap').classList.toggle('tall', tong && !inset);
    $('sizeTag').textContent = tong ? (inset ? 'L바 안에 넣어 본 모습 · 위치는 가이드 기준 대략' : '통강조 376×790') : '1920×1080';
    const view = { showLbar: $('lbarChk').checked && !tong, showSafe: $('safeChk').checked, warn: $('warnChk').checked };
    if (inset) {
      setStage('tong'); tongBuf.width = W; tongBuf.height = H; renderFrame(tongBuf.getContext('2d'), proj(), S.t, view);
      if (cv.width !== 1920 || cv.height !== 1080) { cv.width = 1920; cv.height = 1080; }
      drawTongInset(cv.getContext('2d'), tongBuf);
    } else {
      setStage(tong ? 'tong' : 'wide'); if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
      renderFrame(cv.getContext('2d'), proj(), S.t, view);
    }
    if (view.warn && !S.playing) showWarnings(findViolationsCached());
    $('time').textContent = `${S.t.toFixed(2)} / ${S.total.toFixed(2)}초`;
    $('playhead').style.left = (S.total ? S.t / S.total * 100 : 0) + '%';
  }
  requestAnimationFrame(loop);
}
function findViolationsCached() { return findViolations(proj()); }
// 통강조를 L바 가이드의 왼쪽 네모 자리에 넣어 보기 (자리는 가이드 그림 기준 대략값)
const tongBuf = document.createElement('canvas');
const TONG_BOX = { x: 70, y: 154, w: 376, h: 790 };
function drawTongInset(ctx, src) {
  ctx.save(); const g = ctx.createLinearGradient(0, 0, 1920, 1080); g.addColorStop(0, '#3a3d48'); g.addColorStop(1, '#1b1d24'); ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
  ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.font = "700 64px 'Noto Sans KR'"; ctx.textAlign = 'center'; ctx.fillText('방송 화면', 1146, 540);
  if (R.lbarImg) ctx.drawImage(R.lbarImg, 0, 0, 1920, 1080);
  ctx.imageSmoothingQuality = 'high'; ctx.drawImage(src, TONG_BOX.x, TONG_BOX.y, TONG_BOX.w, TONG_BOX.h);
  if ($('safeChk').checked) { ctx.strokeStyle = 'rgba(0,255,170,.9)'; ctx.lineWidth = 3; ctx.setLineDash([12, 8]); ctx.strokeRect(TONG_BOX.x, TONG_BOX.y, TONG_BOX.w, TONG_BOX.h); }
  ctx.restore();
}
function showWarnings(list) {
  const key = list.map(b => b.label + b.why).join('|'); if (key === lastWarnKey) return; lastWarnKey = key;
  $('warns').innerHTML = list.length ? list.slice(0, 6).map(b => `<div class="w">⚠ "${b.label.slice(0, 24)}" ${b.why}. 문구를 줄이거나 줄을 나눠 주세요.</div>`).join('')
    : `<div class="ok">✓ ${S.fmt === '통강조' ? '글자가 화면 안에 잘 들어가 있어요' : '이 화면은 L바와 겹치지 않아요'}</div>`;
}
function setPlaying(p) {
  if (p && !S.scenes.length) { toast('먼저 장면을 하나 이상 만들어 주세요'); return; }
  S.playing = p; $('playBtn').textContent = p ? '⏸ 일시정지' : '▶ 재생'; if (p) { if (S.t >= S.total - .01) S.t = 0; restartAudio(); } else { stopAudio(); S.dirty = true; }
}

// ---------- 올린 이미지·음악 자동 보관 (IndexedDB: 창을 닫았다 열어도 남아 있음) ----------
const IDB = {
  db: null,
  open() { return this.db || (this.db = new Promise((res, rej) => { const r = indexedDB.open('hfm', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); })); },
  async set(k, v) { const db = await this.open(); return new Promise((res, rej) => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }); },
  async get(k) { const db = await this.open(); return new Promise((res, rej) => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); },
};
const canvasBlob = c => new Promise(r => c.toBlob(r, 'image/png'));
let assetSaveTimer = 0, assetsRestored = false;
function saveAssetsSoon() {
  if (!assetsRestored) return; clearTimeout(assetSaveTimer);
  assetSaveTimer = setTimeout(async () => {
    try {
      const out = {}; for (const [n, a] of Object.entries(S.assets)) out[n] = { img: await canvasBlob(a.img), orig: a.orig !== a.img ? await canvasBlob(a.orig) : null, tol: a.tol };
      await IDB.set('assets', out);
      await IDB.set('bgm', S.bgm ? { name: S.bgm.name, raw: S.bgm.raw, volume: S.bgm.volume, fade: S.bgm.fade, offset: S.bgm.offset } : null);
    } catch (_) { }
  }, 800);
}
async function restoreAssets() {
  try {
    const a = await IDB.get('assets');
    if (a && Object.keys(a).length && !Object.keys(S.assets).length) {
      for (const [n, v] of Object.entries(a)) { const img = imageToCanvas(await createImageBitmap(v.img)); const orig = v.orig ? imageToCanvas(await createImageBitmap(v.orig)) : img; S.assets[n] = { img, orig, tol: v.tol }; }
      renderAssets(); parseNow(); toast(`지난번에 올린 이미지 ${Object.keys(a).length}개를 다시 불러왔어요`);
    }
    const b = await IDB.get('bgm');
    if (b && b.raw && !S.bgm) { await loadBgm(null, b.raw); Object.assign(S.bgm, { name: b.name, volume: b.volume, fade: b.fade, offset: b.offset }); renderBgm(); }
  } catch (_) { }
  assetsRestored = true;
}

// ---------- 프로젝트 저장/열기 ----------
function canvasToDataURL(c) { return c.toDataURL('image/png'); }
function abToB64(ab) { let s = ''; const u = new Uint8Array(ab); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
function b64ToAb(b) { const s = atob(b); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; }
function saveProject() {
  const data = { app: 'hardfiller-maker', v: 1, text: $('sb').value, assets: {}, bgm: null };
  for (const [n, a] of Object.entries(S.assets)) data.assets[n] = { img: canvasToDataURL(a.img), orig: a.orig !== a.img ? canvasToDataURL(a.orig) : null, tol: a.tol };
  if (S.bgm) data.bgm = { name: S.bgm.name, data: abToB64(S.bgm.raw), volume: S.bgm.volume, fade: S.bgm.fade, offset: S.bgm.offset };
  const first = (S.scenes[0] && sceneText(S.scenes[0], ' ').replace(/[^\w가-힣]/g, '').slice(0, 12)) || '하드필러';
  downloadBlob(new Blob([JSON.stringify(data)], { type: 'application/json' }), `${first}_프로젝트.hfm.json`);
}
async function openProject(file) {
  const data = JSON.parse(await file.text()); S.assets = {};
  for (const [n, a] of Object.entries(data.assets || {})) {
    const img = imageToCanvas(await loadImageFromURL(a.img)); const orig = a.orig ? imageToCanvas(await loadImageFromURL(a.orig)) : img;
    S.assets[n] = { img, orig, tol: a.tol };
  }
  if (data.bgm) { await loadBgm(null, b64ToAb(data.bgm.data)); Object.assign(S.bgm, { name: data.bgm.name, volume: data.bgm.volume, fade: data.bgm.fade, offset: data.bgm.offset }); renderBgm(); }
  setText(data.text || '', '프로젝트를 열었어요'); renderAssets();
}

// ---------- 내보내기 ----------
let exporting = false, cancelFlag = false, lastSaved = '';
let APP_INFO = { ffmpeg: false };
const APP_MXF = () => { const c = $('expMxf'); return !!(c && c.checked && APP_INFO.ffmpeg); };
function exportName(ext) {
  const first = (S.scenes[0] && sceneText(S.scenes[0], ' ').replace(/[^\w가-힣]/g, '').slice(0, 12)) || '하드필러';
  return `${S.fmt}_${first}_${S.total.toFixed(0)}초.${ext}`;
}
function openExport() {
  if (!S.scenes.length) { toast('먼저 장면을 하나 이상 만들어 주세요'); showPane('build'); return; }
  const tong = S.fmt === '통강조';
  $('expInfo').textContent = `${S.fmt} · ${S.scenes.length}장면 · ${S.total.toFixed(2)}초 · ${tong ? '376×790 (L바 왼쪽 네모 크기)' : '1920×1080'}. 최신 Chrome/Edge에서 MP4(H.264)로 저장돼요. 렌더링에는 영상 길이의 1~3배 시간이 걸릴 수 있어요.`;
  $('expLbarRow').hidden = tong; $('ffBox').hidden = tong || !!APP; $('expMxfRow').hidden = tong || !APP || !APP_INFO.ffmpeg;
  const name = exportName('mp4');
  // 29.97fps는 필드 표시만(1080i PsF), 59.94fps는 두 프레임을 한 인터레이스 프레임으로 합침
  const vf = parseFloat($('fpsSel').value) > 50 ? 'fps=60000/1001,interlace=scan=tff:lowpass=complex' : 'fps=30000/1001,setfield=tff';
  // 앱의 MXF 변환과 같은 구성: 길이를 프레임 단위로 맞추고, 배경음악이 있으면 1·2채널에 넣음
  const N = Math.round(S.total * 30000 / 1001), D = (N * 1001 / 30000).toFixed(6);
  const vchain = `[0:v]${vf},tpad=stop_mode=clone:stop_duration=1,trim=end_frame=${N},format=yuv422p[v]`;
  const fc = S.bgm ? `${vchain};[0:a]aresample=48000,apad,atrim=end=${D},pan=stereo|c0=c0|c1=c1,channelsplit=channel_layout=stereo[a1][a2]` : vchain;
  const amap = (S.bgm ? '-map "[a1]" -map "[a2]" ' : '') + '-map 1:a '.repeat(S.bgm ? 6 : 8);
  $('ffCmd').value = `ffmpeg -y -i "${name}" -f lavfi -t ${D} -i anullsrc=r=48000:cl=mono -filter_complex "${fc}" -map "[v]" ${amap}-frames:v ${N} -c:v mpeg2video -profile:v 0 -level:v 2 -pix_fmt yuv422p -b:v 50M -minrate 50M -maxrate 50M -bufsize 17825792 -rc_init_occupancy 17825792 -g 15 -bf 2 -flags +ildct+ilme -top 1 -dc 10 -intra_vlc 1 -non_linear_quant 1 -qmin 1 -qmax 12 -c:a pcm_s24le -ar 48000 -f mxf 출력.mxf`;
  $('ffCopy').onclick = () => { $('ffCmd').select(); document.execCommand('copy'); $('ffCopy').textContent = '복사했어요'; setTimeout(() => $('ffCopy').textContent = '명령 복사', 1500); };
  const empties = S.scenes.map((sc, i) => sceneEmpty(sc) ? i + 1 : 0).filter(Boolean);
  if (empties.length) $('expInfo').textContent += ` ⚠ ${empties.join('·')}번 장면은 문구가 비어 있어서 배경만 나와요.`;
  $('expProg').hidden = true; $('expMsg').textContent = ''; $('expDlg').showModal();
}
async function doExport() {
  if (exporting) return; exporting = true; cancelFlag = false; setPlaying(false);
  $('expGo').disabled = true; $('expProg').hidden = false; $('expCancel').textContent = '취소';
  const t0 = performance.now();
  try {
    await loadFontsFor($('sb').value);
    const r = await exportVideo(proj(), { fps: parseFloat($('fpsSel').value), withLbar: $('expLbar').checked, audio: $('expAudio').checked, cancel: () => cancelFlag },
      p => { $('expProg').value = p; $('expMsg').textContent = `렌더링 중… ${(p * 100).toFixed(0)}%`; });
    const name = exportName(r.ext);
    const saved = await downloadBlob(r.blob, name);
    if (!saved) { $('expMsg').textContent = '저장을 취소했어요.'; throw null; }
    let mxf = '';
    if (APP && APP_MXF() && S.fmt !== '통강조' && r.ext === 'mp4') {
      $('expProg').value = .99; mxf = await makeMxf(saved, parseFloat($('fpsSel').value), !!r.audio, S.total, m => $('expMsg').textContent = m);
    }
    lastSaved = mxf || saved;
    $('expMsg').innerHTML = '';
    $('expMsg').textContent = `완료: ${APP ? saved : name}${mxf ? ' + MXF' : ''} (${r.size}, ${(r.blob.size / 1048576).toFixed(1)}MB, ${r.codec}${r.audio ? ', 음악 ' + r.audio : r.wantedAudio ? ', 음악 인코더가 없어 영상만 저장' : ''}, ${((performance.now() - t0) / 1000).toFixed(0)}초 걸림)`;
    if (APP) { const b = document.createElement('button'); b.className = 'small'; b.textContent = '폴더에서 보기'; b.style.marginLeft = '8px'; b.onclick = () => APP.showItem(lastSaved); $('expMsg').appendChild(b); }
  } catch (e) { if (e) { $('expMsg').textContent = '실패: ' + e.message; console.error(e); } }
  exporting = false; $('expGo').disabled = false; $('expCancel').textContent = '닫기';
}

// ---------- 이벤트 ----------
function bindUI() {
  $('sb').addEventListener('input', parseSoon);
  const selFromCaret = () => {
    const ln = $('sb').value.slice(0, $('sb').selectionStart).split('\n').length - 1;
    let i = -1; S.scenes.forEach((s, k) => { if (s.lineNo <= ln) i = k; });
    if (i >= 0 && i !== S.sel) { S.sel = i; S.t = S.scenes[i].start + Math.min(S.scenes[i].dur * .6, 1.6); buildInspector(); buildTimeline(); S.dirty = true; }
  };
  $('sb').addEventListener('click', selFromCaret); $('sb').addEventListener('keyup', e => { if (e.key.startsWith('Arrow')) selFromCaret(); });
  $('fmtSeg').onclick = e => { const v = e.target.dataset.v; if (v) switchFormat(v); };
  $('feelSel').onchange = e => { S.feel = e.target.value; writeSettings(); };
  $('frameSel').onchange = e => { S.frame = e.target.value; writeSettings(); };
  $('imgK').oninput = e => { S.imgK = +e.target.value; $('imgKv').textContent = S.imgK + '%'; S.dirty = true; };
  $('imgK').onchange = () => { writeSettings(); thumbsSoon(); };
  $('tabs').onclick = e => { const p = e.target.dataset.p; if (p) showPane(p); };
  $('palette').onclick = e => { const b = e.target.closest('button'); if (!b || !b.dataset.t) return; const it = PALETTE[palFmt][+b.dataset.i]; addScene(b.dataset.t, it && it[3]); };
  $('newBtn').onclick = () => { showPane('build'); if ($('sb').value.trim() === blankText(S.fmt)) return; setText(blankText(S.fmt), '빈 화면으로 새로 시작해요'); };
  // 자간·행간 (전체)
  $('trackK').oninput = e => { S.track = +e.target.value; $('trackKv').textContent = S.track; S.dirty = true; };
  $('leadK').oninput = e => { S.lead = +e.target.value; $('leadKv').textContent = S.lead + '%'; S.dirty = true; };
  $('trackK').onchange = $('leadK').onchange = () => { writeSettings(); thumbsSoon(); };
  $('undoBtn').onclick = undo; $('toastUndo').onclick = undo;
  const dropZone = (el, accept, fn) => {
    el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('over'); });
    el.addEventListener('dragleave', () => el.classList.remove('over'));
    el.addEventListener('drop', async e => { e.preventDefault(); el.classList.remove('over'); for (const f of e.dataTransfer.files) if (f.type.startsWith(accept)) await fn(f); });
  };
  dropZone($('imgDrop'), 'image/', async f => addAsset(nextAssetName(f.name), await fileToCanvas(f)));
  dropZone($('bgmDrop'), 'audio/', f => loadBgm(f));
  // 미리보기에 이미지를 바로 끌어다 놓아도 소스로 올라감
  dropZone(document.querySelector('.canvasWrap'), 'image/', async f => { addAsset(nextAssetName(f.name), await fileToCanvas(f)); toast(`이미지 '${f.name}'를 올렸어요`); });
  $('motionSel').onchange = e => { S.motion = e.target.value; writeSettings(); };
  $('durRange').oninput = e => { S.dur = +e.target.value; $('durNum').value = S.dur; writeSettings(); };
  $('durNum').onchange = e => { S.dur = clamp(+e.target.value || FORMATS[S.fmt].dur, 1, FORMATS[S.fmt].max); writeSettings(); };
  $('lbarSel').onchange = e => { S.lbar = e.target.value; writeSettings(); };
  $('tplSel').onchange = e => { const t = TEMPLATES.find(x => x.id === e.target.value); if (t) setText(t.text, `'${t.name}' 예시를 불러왔어요`); e.target.value = ''; };
  ['lbarChk', 'safeChk', 'warnChk'].forEach(id => $(id).onchange = () => { S.dirty = true; lastWarnKey = null; if (!$('warnChk').checked) $('warns').innerHTML = ''; });
  $('playBtn').onclick = () => setPlaying(!S.playing);
  $('restartBtn').onclick = () => { S.t = 0; S.dirty = true; if (S.playing) restartAudio(); };
  let drag = false;
  $('timeline').onpointerdown = e => { drag = true; $('timeline').setPointerCapture(e.pointerId); seekFromEvent(e); };
  $('timeline').onpointermove = e => { if (drag) seekFromEvent(e); };
  $('timeline').onpointerup = () => drag = false;
  document.addEventListener('keydown', e => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); saveProject(); return; }
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
    if (e.code === 'Space') { e.preventDefault(); setPlaying(!S.playing); }
    if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && S.scenes.length) {
      e.preventDefault(); const i = clamp((S.sel < 0 ? -1 : S.sel) + (e.key === 'ArrowRight' ? 1 : -1), 0, S.scenes.length - 1);
      S.sel = i; S.t = S.scenes[i].start + Math.min(S.scenes[i].dur * .6, 1.6); S.dirty = true; buildInspector(); buildTimeline();
    }
  });
  $('imgFile').onchange = async e => { for (const f of e.target.files) { const c = await fileToCanvas(f); addAsset(nextAssetName(f.name), c); } e.target.value = ''; };
  $('bgmFile').onchange = async e => { const f = e.target.files[0]; if (f) await loadBgm(f); e.target.value = ''; };
  $('pngBtn').onclick = () => {
    const P = proj(); setStage(stageOf(P)); const [ow, oh] = STAGES[STAGE].out; const c = document.createElement('canvas'); c.width = W; c.height = H; renderFrame(c.getContext('2d'), P, S.t, { showLbar: $('lbarChk').checked && STAGE === 'wide', hints: false });
    let o = c; if (ow !== W) { o = document.createElement('canvas'); o.width = ow; o.height = oh; const g = o.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(c, 0, 0, ow, oh); }
    o.toBlob(b => downloadBlob(b, `${S.fmt}_frame_${S.t.toFixed(2)}s.png`));
  };
  $('saveBtn').onclick = saveProject; $('openBtn').onclick = () => $('openFile').click();
  $('openFile').onchange = async e => { const f = e.target.files[0]; if (f) { try { await openProject(f); } catch (err) { alert('프로젝트를 열지 못했어요: ' + err.message); } } e.target.value = ''; };
  $('exportBtn').onclick = openExport; $('expGo').onclick = doExport;
  $('expCancel').onclick = () => { if (exporting) cancelFlag = true; else $('expDlg').close(); };
  renderBgm();
}
function confirmReplace() { return $('sb').value.trim().length < 20 || window.confirm('지금 스토리보드를 예시로 바꿀까요? (이미지 소스는 그대로 남아요)'); }
// 스토리보드에서 아직 비어 있는 이미지 이름이 있으면 그 이름으로 올림
function nextAssetName(fileName) {
  const wanted = []; S.scenes.forEach(sc => { [sc.opts.이미지, ...(sc.lines.join(' ').match(/@([^\s,+/]+)/g) || [])].filter(Boolean).forEach(n => { n = n.replace(/^@/, ''); if (!S.assets[n] && !wanted.includes(n)) wanted.push(n); }); });
  return wanted[0] || fileName;
}

window.addEventListener('DOMContentLoaded', init);
