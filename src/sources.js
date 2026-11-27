// ===== sources.js : v10 상품 폴더 연결(이미지·영상) · 트렌드 노트 · 내 스타일 노트 · API 키 보관 =====
const MEDIA_IMG = /\.(png|jpe?g|webp|gif|bmp)$/i, MEDIA_VID = /\.(mp4|mov|m4v|webm|mkv|avi)$/i;
const SRC_MAX = { img: 40, vid: 12 };
const srcName = f => f.replace(/\.[^.]+$/, '').replace(/[\s,+/@{}()\[\]]/g, '').slice(0, 20) || '소스';
const FOLDER = { name: '', count: 0, busy: false, handle: null, dir: '' };

// 큰 사진은 2400px 안으로 줄여서(메모리) 여백 자르기
async function blobToCanvas(blob) {
  const bmp = await createImageBitmap(blob); const k = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); bmp.close && bmp.close();
  return trimMargins(c);
}
// 영상 소스: 숨은 <video> + 지금 프레임을 그려 두는 캔버스(다른 그림 코드는 이 캔버스를 이미지처럼 씀)
async function makeVideoAsset(url) {
  const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
  await new Promise((res, rej) => { const to = setTimeout(() => rej(new Error('영상을 여는 데 너무 오래 걸려요')), 20000); v.onloadeddata = () => { clearTimeout(to); res(); }; v.onerror = () => { clearTimeout(to); rej(new Error('이 영상 형식은 열 수 없어요')); }; });
  const k = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight));
  const c = document.createElement('canvas'); c.width = Math.max(2, Math.round(v.videoWidth * k)); c.height = Math.max(2, Math.round(v.videoHeight * k));
  const dur = isFinite(v.duration) ? v.duration : 0;
  // AI에게 보여 줄 앞·중간·끝 세 장면 (한 장으로 이어 붙임)
  const strip = document.createElement('canvas'); const sw = 256, sh = Math.round(sw * c.height / c.width); strip.width = sw * 3; strip.height = sh;
  for (let i = 0; i < 3; i++) { const p = waitEv(v, 'seeked', 4000); v.currentTime = Math.max(0, dur * [.1, .5, .9][i]); await p; strip.getContext('2d').drawImage(v, i * sw, 0, sw, sh); }
  const p0 = waitEv(v, 'seeked', 4000); v.currentTime = 0; await p0; c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
  v.addEventListener('seeked', () => { S.dirty = true; });
  return { img: c, orig: c, video: v, url, dur, strip };
}
function dropFolderAssets() {
  for (const [n, a] of Object.entries(S.assets)) if (a.folder) { if (a.video) { a.video.pause(); a.video.removeAttribute('src'); a.video.load(); } if (a.url && a.url.startsWith('blob:')) URL.revokeObjectURL(a.url); delete S.assets[n]; }
}
// files: [{name, rel, get: async () => ({blob}|{url}), video:bool}]
async function importFolderFiles(files, folderName) {
  FOLDER.busy = true; renderFolderCard('불러오는 중…');
  dropFolderAssets();
  const imgs = files.filter(f => !f.video).slice(0, SRC_MAX.img), vids = files.filter(f => f.video).slice(0, SRC_MAX.vid);
  let done = 0, fail = 0; const all = [...imgs, ...vids];
  for (const f of all) {
    try {
      let n = srcName(f.name); if (S.assets[n]) { let k = 2; while (S.assets[n + k]) k++; n = n + k; }
      const got = await f.get();
      if (f.video) { const url = got.url || URL.createObjectURL(got.blob); const a = await makeVideoAsset(url); a.folder = true; a.file = f.rel || f.name; S.assets[n] = a; }
      else { const c = await blobToCanvas(got.blob); S.assets[n] = { img: c, orig: c, folder: true, file: f.rel || f.name }; }
    } catch (e) { fail++; console.warn('소스', f.name, e); }
    done++; renderFolderCard(`불러오는 중… ${done}/${all.length}`);
  }
  FOLDER.name = folderName; FOLDER.count = done - fail; FOLDER.busy = false;
  const skipped = files.length - all.length;
  renderAssets(); parseNow();
  const fa = Object.values(S.assets).filter(a => a.folder), nv = fa.filter(a => a.video).length;
  renderFolderCard(`사진 ${fa.length - nv}개 · 영상 ${nv}개${fail ? ` · ${fail}개는 열지 못함` : ''}${skipped ? ` · ${skipped}개는 너무 많아 뺌` : ''}`);
  return FOLDER.count;
}
// 웹(Chrome·Edge): 폴더 고르기 창. 고른 폴더는 다음에 열 때 권한만 다시 물음
async function walkDir(h, prefix = '', depth = 0, out = []) {
  for await (const [name, e] of h.entries()) {
    if (name.startsWith('.')) continue;
    if (e.kind === 'file' && (MEDIA_IMG.test(name) || MEDIA_VID.test(name))) out.push({ name, rel: prefix + name, video: MEDIA_VID.test(name), get: async () => ({ blob: await e.getFile() }) });
    else if (e.kind === 'directory' && depth < 1) await walkDir(e, prefix + name + '/', depth + 1, out);
  }
  return out.sort((a, b) => a.rel.localeCompare(b.rel, 'ko'));
}
async function connectFolder() {
  try {
    if (APP && APP.pickSourceFolder) { const dir = await APP.pickSourceFolder(); if (!dir) return; try { localStorage.setItem('hfm.srcDir', dir); } catch (_) { } FOLDER.dir = dir; await loadFolderApp(dir); return; }
    if (!window.showDirectoryPicker) { toast('이 브라우저는 폴더 연결을 못 해요. Chrome이나 Edge, 또는 윈도우 앱에서 써 주세요'); return; }
    const h = await window.showDirectoryPicker({ id: 'hfm-src', mode: 'read' });
    FOLDER.handle = h; try { await IDB.set('srcDir', h); } catch (_) { }
    await importFolderFiles(await walkDir(h), h.name);
    toast(`'${h.name}' 폴더의 소스 ${FOLDER.count}개를 연결했어요`);
  } catch (e) { if (e && e.name === 'AbortError') return; FOLDER.busy = false; renderFolderCard('연결하지 못했어요: ' + e.message); }
}
async function reloadFolder() {
  if (APP && FOLDER.dir) return loadFolderApp(FOLDER.dir);
  if (FOLDER.handle) {
    try { if ((await FOLDER.handle.queryPermission({ mode: 'read' })) !== 'granted' && (await FOLDER.handle.requestPermission({ mode: 'read' })) !== 'granted') return; await importFolderFiles(await walkDir(FOLDER.handle), FOLDER.handle.name); }
    catch (e) { renderFolderCard('다시 읽지 못했어요: ' + e.message); }
  } else connectFolder();
}
// 윈도우 앱: 폴더 경로를 기억하고, 영상은 내장 ffmpeg로 가벼운 미리보기용 파일을 만들어 씀(어떤 코덱이든 재생되게)
let folderWatchOff = null, folderReloadT = 0;
async function loadFolderApp(dir) {
  const list = await APP.listFolder(dir);
  if (!list) { renderFolderCard('폴더를 찾을 수 없어요. 다시 연결해 주세요'); return; }
  await importFolderFiles(list.map(f => ({ name: f.name, rel: f.rel, video: f.video, get: async () => { const buf = f.video ? await APP.videoProxy(f.path) : await APP.readFile(f.path); return { blob: new Blob([buf], { type: f.video ? 'video/mp4' : '' }) }; } })), dir.split(/[\\/]/).filter(Boolean).pop());
  if (folderWatchOff) folderWatchOff();
  folderWatchOff = APP.watchFolder ? APP.watchFolder(dir, () => { clearTimeout(folderReloadT); folderReloadT = setTimeout(() => { toast('상품 폴더에 바뀐 파일이 있어 다시 읽었어요'); loadFolderApp(dir); }, 1500); }) : null;
}
async function restoreFolder() {
  try {
    if (APP && APP.listFolder) { const dir = localStorage.getItem('hfm.srcDir'); if (dir) { FOLDER.dir = dir; await loadFolderApp(dir); } return; }
    const h = await IDB.get('srcDir'); if (!h || !h.queryPermission) return; FOLDER.handle = h; FOLDER.name = h.name;
    if ((await h.queryPermission({ mode: 'read' })) === 'granted') await importFolderFiles(await walkDir(h), h.name);
    else renderFolderCard(`'${h.name}' 폴더를 다시 쓰려면 '다시 읽기'를 눌러 허용해 주세요`);
  } catch (_) { }
}
function renderFolderCard(msg) {
  const box = $('folderInfo'); if (!box) return;
  const items = Object.entries(S.assets).filter(([, a]) => a.folder);
  box.innerHTML = `<div class="dim">${FOLDER.name ? `📁 <b>${esc(FOLDER.name)}</b> · ` : ''}${esc(msg || (items.length ? `소스 ${items.length}개` : '상품 사진·영상이 든 폴더를 연결하면 AI가 장면마다 골라 써요'))}</div>` +
    (items.length ? `<div class="srcStrip">${items.slice(0, 24).map(([n, a]) => `<span class="srcChip${a.video ? ' vid' : ''}" title="${esc(a.file || n)}" data-src="${esc(n)}">${a.video ? '🎬 ' : ''}${esc(n)}</span>`).join('')}</div>` : '');
  box.querySelectorAll('[data-src]').forEach(el => el.onclick = () => boardInsert('@' + el.dataset.src + ' '));
  $('folderReload').disabled = FOLDER.busy || (!FOLDER.handle && !FOLDER.dir);
}
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// AI에게 보낼 소스 썸네일 (사진은 384px, 영상은 앞·중간·끝 이어 붙인 한 장)
function sourcesForAI(max = 16) {
  const out = [];
  for (const [n, a] of Object.entries(S.assets)) {
    if (out.length >= max) break;
    const src = a.video ? a.strip : a.img; if (!src) continue;
    const k = Math.min(1, (a.video ? 768 : 384) / Math.max(src.width, src.height));
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(src.width * k)); c.height = Math.max(1, Math.round(src.height * k));
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(src, 0, 0, c.width, c.height);
    out.push({ name: n, video: !!a.video, dur: a.dur || 0, thumb: c.toDataURL('image/jpeg', .8).split(',')[1] });
  }
  return out;
}

// ---------- 트렌드 노트 (GitHub에서 3시간마다 갱신, 앱은 열 때 최신본을 받음) ----------
const TREND_URL = 'https://raw.githubusercontent.com/daarmoon/filler/trends/notes.json';
let TRENDS = (typeof TRENDS_DATA !== 'undefined' && TRENDS_DATA) || { updated: null, items: [], sources: [] };
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { } };
async function loadTrends() {
  const cached = lsGet('hfm.trends', null); if (cached && cached.updated && (!TRENDS.updated || cached.updated > TRENDS.updated)) TRENDS = cached;
  renderTrends();
  try {
    const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 6000);
    const r = await fetch(TREND_URL + '?t=' + Math.floor(Date.now() / 6e5), { signal: ctl.signal, cache: 'no-store' }); clearTimeout(to);
    if (r.ok) { const j = await r.json(); if (j && Array.isArray(j.items) && (!TRENDS.updated || (j.updated || '') >= TRENDS.updated)) { TRENDS = j; lsSet('hfm.trends', j); } }
  } catch (_) { }
  renderTrends();
}
function activeTrends() {
  const off = new Set(lsGet('hfm.trendOff', [])), pin = new Set(lsGet('hfm.trendPin', []));
  const items = (TRENDS.items || []).filter(t => !off.has(t.id));
  return [...items.filter(t => pin.has(t.id)), ...items.filter(t => !pin.has(t.id))];
}
function fmtWhen(iso) { if (!iso) return ''; const d = new Date(iso); if (isNaN(d)) return ''; return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }
function renderTrends() {
  const box = $('trendList'); if (!box) return;
  const off = new Set(lsGet('hfm.trendOff', [])), pin = new Set(lsGet('hfm.trendPin', []));
  const items = TRENDS.items || [];
  $('trendWhen').textContent = TRENDS.updated ? `${fmtWhen(TRENDS.updated)} 업데이트 · ${items.length}개` : '아직 없음';
  const srcs = (TRENDS.sources || []).map(s => `<span class="dim">${esc(s.name)} ${s.ok ? '✓' : '· ' + esc(s.reason || '못 읽음')}</span>`).join(' · ');
  box.innerHTML = (items.length ? items.slice(0, 40).map(t => `<div class="trend${off.has(t.id) ? ' off' : ''}"><div><b>${esc(t.pattern)}</b>${t.example ? `<div class="dim">“${esc(String(t.example).slice(0, 90))}”</div>` : ''}<div class="dim">${(t.tags || []).map(esc).join(' · ')}${t.url ? ` · <a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.source || '출처')}</a>` : ''}</div></div>
    <div class="tActs"><button class="small${pin.has(t.id) ? ' on' : ''}" data-pin="${esc(t.id)}" title="AI가 늘 참고">📌</button><button class="small" data-off="${esc(t.id)}" title="AI가 참고하지 않음">${off.has(t.id) ? '켜기' : '끄기'}</button></div></div>`).join('')
    : `<div class="dim">GitHub에서 3시간마다 광고·그래픽 사이트를 읽어 여기에 쌓여요.${TRENDS.note ? ' ' + esc(TRENDS.note) : ''}</div>`) + (srcs ? `<div style="margin-top:6px">${srcs}</div>` : '');
  box.querySelectorAll('[data-pin]').forEach(b => b.onclick = () => { const s = new Set(lsGet('hfm.trendPin', [])); s.has(b.dataset.pin) ? s.delete(b.dataset.pin) : s.add(b.dataset.pin); lsSet('hfm.trendPin', [...s]); renderTrends(); });
  box.querySelectorAll('[data-off]').forEach(b => b.onclick = () => { const s = new Set(lsGet('hfm.trendOff', [])); s.has(b.dataset.off) ? s.delete(b.dataset.off) : s.add(b.dataset.off); lsSet('hfm.trendOff', [...s]); renderTrends(); });
}

// ---------- 내 스타일 노트: 👍 누른 안 · 직접 고친 내용 → 다음 AI 연출에 반영 ----------
const getPrefs = () => lsGet('hfm.prefs', []);
function addPref(p) { const l = getPrefs(); l.unshift(Object.assign({ t: Date.now() }, p)); lsSet('hfm.prefs', l.slice(0, 30)); renderPrefs(); }
function renderPrefs() {
  const box = $('prefList'); if (!box) return; const l = getPrefs();
  $('prefCount').textContent = l.length ? `${l.length}개` : '';
  box.innerHTML = l.length ? l.map((p, i) => `<div class="trend"><div>${p.kind === 'edit' ? `<b>고친 내용</b><div class="dim">${esc(String(p.from).slice(0, 80))} → ${esc(String(p.to).slice(0, 80))}</div>` : `<b>👍 ${esc(p.name || '좋아한 안')}</b><div class="dim">${esc(p.concept || '')}</div>`}</div><div class="tActs"><button class="small" data-del="${i}">빼기</button></div></div>`).join('')
    : '<div class="dim">마음에 든 안에 👍를 누르거나 AI 안을 고쳐서 내보내면 여기에 모여 다음 연출에 반영돼요.</div>';
  box.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const l2 = getPrefs(); l2.splice(+b.dataset.del, 1); lsSet('hfm.prefs', l2); renderPrefs(); });
}
// AI 안을 고친 뒤 내보내면, 바뀐 장면 줄을 '고친 내용'으로 기록 (한 안당 한 번)
function recordEdits() {
  const base = S.aiBase; if (!base || base.recorded) return;
  const a = base.text.split('\n').filter(l => /^\s*\[/.test(l)), b = $('sb').value.split('\n').filter(l => /^\s*\[/.test(l));
  const from = [], to = [];
  for (let i = 0; i < Math.max(a.length, b.length) && from.length < 3; i++) if ((a[i] || '') !== (b[i] || '')) { from.push(a[i] || '(없음)'); to.push(b[i] || '(뺌)'); }
  if (!from.length) return;
  base.recorded = true; addPref({ kind: 'edit', from: from.join(' | '), to: to.join(' | ') });
}

// ---------- API 키: 웹은 이 브라우저에만, 윈도우 앱은 Windows 암호화 저장소에 ----------
async function loadApiKey() {
  let k = ''; try { k = localStorage.getItem('hfm.key') || ''; } catch (_) { }
  if (APP && APP.secretGet) {
    const s = await APP.secretGet().catch(() => '');
    if (!s && k) { await APP.secretSet(k).catch(() => { }); } // 예전 버전이 브라우저 저장소에 둔 키를 옮김
    else k = s || '';
    try { localStorage.removeItem('hfm.key'); } catch (_) { }
  }
  $('aiKey').value = k; syncKeyBadge();
}
async function saveApiKey(v) {
  v = String(v || '').trim();
  if (APP && APP.secretSet) await APP.secretSet(v).catch(() => { });
  else try { v ? localStorage.setItem('hfm.key', v) : localStorage.removeItem('hfm.key'); } catch (_) { }
  syncKeyBadge();
}
function syncKeyBadge() { const b = $('aiMode'); if (b) b.textContent = $('aiKey').value.trim() ? 'AI 연결됨' : 'AI 키 없음 · 규칙 연출'; }
