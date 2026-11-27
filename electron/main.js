// ===== 윈도우 앱(Electron) 본체 (필러메이커스, 예전 이름 하드필러 메이커): dist/hardfiller-maker.html 을 창으로 열고, 파일 저장·MXF 변환을 맡음 =====
const { app, BrowserWindow, ipcMain, dialog, shell, Menu, safeStorage } = require('electron');
const path = require('path'); const fs = require('fs'); const os = require('os'); const crypto = require('crypto'); const { spawn } = require('child_process');

const TEST_DIR = process.env.HFM_TEST_SAVE_DIR || ''; // 자동 테스트용: 저장 창 없이 이 폴더에 저장
const TEST_SRC = process.env.HFM_TEST_SOURCE_DIR || ''; // 자동 테스트용: 상품 폴더 고르는 창 없이 이 폴더
let win = null;
// v9에서 앱 이름을 '필러메이커스'로 바꿨지만, 예전 설정·저장한 이미지가 그대로 남도록 예전 데이터 폴더를 계속 씀
try { app.setPath('userData', path.join(app.getPath('appData'), '하드필러 메이커')); } catch (_) { }
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
const loadSettings = () => { try { return JSON.parse(fs.readFileSync(settingsFile(), 'utf8')); } catch (_) { return {}; } };
const saveSettings = s => { try { fs.writeFileSync(settingsFile(), JSON.stringify(s, null, 1)); } catch (_) { } };
function defaultDir() {
  const s = loadSettings(); if (s.lastDir && fs.existsSync(s.lastDir)) return s.lastDir;
  const d = path.join(app.getPath('videos') || app.getPath('documents'), '하드필러'); try { fs.mkdirSync(d, { recursive: true }); } catch (_) { } return d;
}
const remember = p => { const s = loadSettings(); s.lastDir = fs.statSync(p).isDirectory() ? p : path.dirname(p); saveSettings(s); };
const safeName = n => String(n || 'output').replace(/[\\/:*?"<>|]/g, '_').slice(0, 150);

function ffmpegPath() {
  const exe = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  const cands = [path.join(process.resourcesPath || '', 'ffmpeg', exe), path.join(__dirname, '..', 'vendor', 'ffmpeg', `${process.platform}-${process.arch}`, exe)];
  if (process.env.HFM_FFMPEG) cands.unshift(process.env.HFM_FFMPEG);
  return cands.find(p => p && fs.existsSync(p)) || null;
}

function createWindow() {
  win = new BrowserWindow({
    width: 1600, height: 960, minWidth: 1180, minHeight: 720, show: false, backgroundColor: '#f6f6f8', title: '필러메이커스',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false },
  });
  win.loadFile(path.join(__dirname, '..', 'dist', 'hardfiller-maker.html'));
  win.once('ready-to-show', () => { if (!process.env.HFM_HIDDEN) { win.maximize(); win.show(); } });
  // 바깥 링크(ffmpeg 안내, Anthropic 콘솔 등)는 기본 브라우저로
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file:')) { e.preventDefault(); if (/^https?:/.test(url)) shell.openExternal(url); } });
}

const menu = Menu.buildFromTemplate([
  { label: '파일', submenu: [{ label: '저장 폴더 열기', click: () => shell.openPath(defaultDir()) }, { type: 'separator' }, { role: 'quit', label: '끝내기' }] },
  { label: '편집', submenu: [{ role: 'undo', label: '실행 취소' }, { role: 'redo', label: '다시 실행' }, { type: 'separator' }, { role: 'cut', label: '잘라내기' }, { role: 'copy', label: '복사' }, { role: 'paste', label: '붙여넣기' }, { role: 'selectAll', label: '모두 선택' }] },
  { label: '보기', submenu: [{ role: 'reload', label: '새로고침' }, { role: 'resetZoom', label: '원래 크기' }, { role: 'zoomIn', label: '크게' }, { role: 'zoomOut', label: '작게' }, { type: 'separator' }, { role: 'togglefullscreen', label: '전체 화면' }, { role: 'toggleDevTools', label: '개발자 도구' }] },
  { label: '도움말', submenu: [{ label: `필러메이커스 ${app.getVersion()}`, enabled: false }, { label: 'ffmpeg 위치: ' + (ffmpegPath() ? '들어 있음' : '없음 (MXF 변환 불가)'), enabled: false }] },
]);

// ---------- 렌더러가 부르는 기능 ----------
ipcMain.handle('hfm:info', () => ({ version: app.getVersion(), ffmpeg: !!ffmpegPath(), platform: process.platform, defaultDir: defaultDir() }));
ipcMain.handle('hfm:saveFile', async (_e, { name, data, filters }) => {
  let file;
  if (TEST_DIR) file = path.join(TEST_DIR, safeName(name));
  else {
    const r = await dialog.showSaveDialog(win, { title: '저장', defaultPath: path.join(defaultDir(), safeName(name)), filters: filters || [{ name: '모든 파일', extensions: ['*'] }] });
    if (r.canceled || !r.filePath) return null; file = r.filePath;
  }
  fs.writeFileSync(file, Buffer.from(data)); remember(file); return file;
});
ipcMain.handle('hfm:pickFolder', async () => {
  if (TEST_DIR) return TEST_DIR;
  const r = await dialog.showOpenDialog(win, { title: '저장할 폴더 고르기', defaultPath: defaultDir(), properties: ['openDirectory', 'createDirectory'] });
  if (r.canceled || !r.filePaths[0]) return null; remember(r.filePaths[0]); return r.filePaths[0];
});
ipcMain.handle('hfm:writeFile', (_e, { dir, name, data }) => { const f = path.join(dir, safeName(name)); fs.writeFileSync(f, Buffer.from(data)); return f; });
ipcMain.handle('hfm:showItem', (_e, p) => { if (p && fs.existsSync(p)) shell.showItemInFolder(p); });

// MP4 → 송출 서버용 MXF (XDCAM HD422 50Mbps, 1080i 29.97 TFF, PCM 24bit 48kHz 모노 8채널: 예시 하드필러와 같은 구성)
ipcMain.handle('hfm:toMxf', (e, { input, fps, hasAudio, total }) => new Promise((resolve, reject) => {
  const ff = ffmpegPath(); if (!ff) return reject(new Error('ffmpeg가 없어 MXF로 바꿀 수 없어요.'));
  const out = input.replace(/\.[^.\\/]+$/, '') + '.mxf';
  const vf = fps > 50 ? 'fps=60000/1001,interlace=scan=tff:lowpass=complex' : 'fps=30000/1001,setfield=tff';
  // 방송 납품은 길이가 프레임 단위로 딱 맞아야 해서 설정한 길이(29.97 기준 프레임 수)로 영상·소리를 모두 맞춘다
  const N = total > 0 ? Math.round(total * 30000 / 1001) : 0, D = (N * 1001 / 30000).toFixed(6);
  const args = ['-hide_banner', '-y', '-i', input, '-f', 'lavfi'].concat(N ? ['-t', D] : [], ['-i', 'anullsrc=r=48000:cl=mono']);
  const fc = [`[0:v]${vf}${N ? `,tpad=stop_mode=clone:stop_duration=1,trim=end_frame=${N}` : ''},format=yuv422p[v]`];
  const amaps = [];
  if (hasAudio) { fc.push(`[0:a]aresample=48000${N ? `,apad,atrim=end=${D}` : ''},pan=stereo|c0=c0|c1=c1,channelsplit=channel_layout=stereo[a1][a2]`); amaps.push('[a1]', '[a2]'); }
  while (amaps.length < 8) amaps.push('1:a');
  args.push('-filter_complex', fc.join(';'), '-map', '[v]'); amaps.forEach(m => args.push('-map', m));
  if (N) args.push('-frames:v', String(N)); else args.push('-shortest');
  args.push('-c:v', 'mpeg2video', '-profile:v', '0', '-level:v', '2', '-pix_fmt', 'yuv422p', '-b:v', '50M', '-minrate', '50M', '-maxrate', '50M', '-bufsize', '17825792', '-rc_init_occupancy', '17825792',
    '-g', '15', '-bf', '2', '-flags', '+ildct+ilme', '-top', '1', '-dc', '10', '-intra_vlc', '1', '-non_linear_quant', '1', '-qmin', '1', '-qmax', '12',
    '-c:a', 'pcm_s24le', '-ar', '48000', '-f', 'mxf', out);
  const p = spawn(ff, args, { windowsHide: true }); let log = '';
  p.stderr.on('data', d => { const s = d.toString(); log = (log + s).slice(-6000); const m = /time=(\d+):(\d+):([\d.]+)/.exec(s); if (m) e.sender.send('hfm:mxfProgress', (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3])); });
  p.on('error', reject);
  p.on('close', code => code === 0 ? resolve(out) : reject(new Error('MXF 변환 실패 (ffmpeg ' + code + ')\n' + log.split('\n').slice(-6).join('\n'))));
}));

// ---------- v10 상품 폴더: 사용자가 고른 폴더 안의 사진·영상만 읽음 ----------
const MEDIA_IMG = /\.(png|jpe?g|webp|gif|bmp)$/i, MEDIA_VID = /\.(mp4|mov|m4v|webm|mkv|avi|wmv|mts|m2ts|mxf)$/i;
const sourceRoots = () => (loadSettings().sourceDirs || []).filter(d => typeof d === 'string');
function inSourceRoot(p) {
  if (typeof p !== 'string' || !p) return false; const abs = path.resolve(p);
  return sourceRoots().some(r => { const rel = path.relative(path.resolve(r), abs); return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel)); });
}
ipcMain.handle('hfm:pickSourceFolder', async () => {
  let dir = TEST_SRC;
  if (!dir) {
    const r = await dialog.showOpenDialog(win, { title: '상품 폴더 고르기 (사진·영상이 든 폴더)', defaultPath: (sourceRoots()[0] && path.dirname(sourceRoots()[0])) || app.getPath('pictures'), properties: ['openDirectory'] });
    if (r.canceled || !r.filePaths[0]) return null; dir = r.filePaths[0];
  }
  const s = loadSettings(); s.sourceDirs = [dir, ...(s.sourceDirs || []).filter(d => d !== dir)].slice(0, 10); saveSettings(s);
  return dir;
});
ipcMain.handle('hfm:listFolder', (_e, dir) => {
  if (!inSourceRoot(dir) || !fs.existsSync(dir)) return null;
  const out = [];
  const walk = (d, rel, depth) => {
    let ents = []; try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch (_) { return; }
    for (const e of ents) {
      if (e.name.startsWith('.')) continue;
      const p = path.join(d, e.name);
      if (e.isFile() && (MEDIA_IMG.test(e.name) || MEDIA_VID.test(e.name))) out.push({ name: e.name, rel: rel + e.name, path: p, video: MEDIA_VID.test(e.name) });
      else if (e.isDirectory() && depth < 1) walk(p, rel + e.name + '/', depth + 1);
    }
  };
  walk(dir, '', 0);
  return out.sort((a, b) => a.rel.localeCompare(b.rel, 'ko'));
});
ipcMain.handle('hfm:readFile', (_e, p) => { if (!inSourceRoot(p)) throw new Error('상품 폴더 밖의 파일은 읽지 않아요'); return fs.readFileSync(p); });
// 영상은 어떤 코덱이든 화면에서 재생되도록 가벼운 미리보기용 MP4(720p, 소리 없음, 앞 3분)로 바꿔 캐시. ffmpeg가 없거나 실패하면 원본 그대로
const proxyJobs = new Map();
function makeProxy(p) {
  const ff = ffmpegPath(), st = fs.statSync(p);
  const key = crypto.createHash('sha1').update(p + '|' + st.size + '|' + st.mtimeMs).digest('hex').slice(0, 20);
  const dir = path.join(app.getPath('userData'), 'proxies'), out = path.join(dir, key + '.mp4');
  if (fs.existsSync(out) && fs.statSync(out).size > 0) return Promise.resolve(out);
  if (!ff) return Promise.resolve(p);
  if (proxyJobs.has(out)) return proxyJobs.get(out);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = out + '.part.mp4';
  const job = new Promise(res => {
    const args = ['-hide_banner', '-y', '-i', p, '-t', '180', '-an', '-vf', "scale=-2:'min(720,ih)':flags=bicubic,format=yuv420p", '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26', '-movflags', '+faststart', tmp];
    const c = spawn(ff, args, { windowsHide: true });
    c.on('error', () => res(p));
    c.on('close', code => { try { if (code === 0) { fs.renameSync(tmp, out); return res(out); } fs.rmSync(tmp, { force: true }); } catch (_) { } res(p); });
  }).finally(() => proxyJobs.delete(out));
  proxyJobs.set(out, job); return job;
}
ipcMain.handle('hfm:videoProxy', async (_e, p) => { if (!inSourceRoot(p)) throw new Error('상품 폴더 밖의 파일은 읽지 않아요'); return fs.readFileSync(await makeProxy(p)); });
// 폴더에 파일이 생기거나 바뀌면 화면에 알려 줌 (다시 읽기)
const watchers = new Map();
ipcMain.handle('hfm:watchFolder', (e, dir) => {
  if (!inSourceRoot(dir) || watchers.has(dir)) return !!watchers.get(dir);
  try {
    const w = fs.watch(dir, { recursive: process.platform !== 'linux' }, (_ev, f) => { if (f && (MEDIA_IMG.test(f) || MEDIA_VID.test(f)) && !e.sender.isDestroyed()) e.sender.send('hfm:folderChanged', dir); });
    w.on('error', () => { try { w.close(); } catch (_) { } watchers.delete(dir); });
    watchers.set(dir, w); return true;
  } catch (_) { return false; }
});
ipcMain.handle('hfm:unwatchFolder', (_e, dir) => { const w = watchers.get(dir); if (w) { try { w.close(); } catch (_) { } watchers.delete(dir); } });

// ---------- v10 Claude API 키: Windows 암호화 저장소(DPAPI)로 잠가서 이 PC의 이 계정에서만 풀림 ----------
const secretFile = () => path.join(app.getPath('userData'), 'secret.bin');
ipcMain.handle('hfm:secretGet', () => {
  try {
    const b = fs.readFileSync(secretFile());
    if (b.slice(0, 6).toString() === 'plain:') return b.slice(6).toString('utf8');
    return safeStorage.decryptString(b);
  } catch (_) { return ''; }
});
ipcMain.handle('hfm:secretSet', (_e, v) => {
  v = String(v || '').trim(); const f = secretFile();
  if (!v) { try { fs.rmSync(f, { force: true }); } catch (_) { } return true; }
  const data = safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(v) : Buffer.concat([Buffer.from('plain:'), Buffer.from(v, 'utf8')]);
  fs.writeFileSync(f, data); return true;
});

app.whenReady().then(() => { Menu.setApplicationMenu(menu); createWindow(); });
app.on('window-all-closed', () => app.quit());
