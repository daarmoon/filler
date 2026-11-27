// v10 윈도우 앱(Electron) 확인 (리눅스에서 xvfb로): xvfb-run -a node test/app10.js
// 상품 폴더 연결(사진 + H.264 영상 → 내장 ffmpeg 미리보기 변환), 폴더 밖 파일 막기, API 키 암호화 보관
const { _electron: electron } = require('playwright'); const path = require('path'); const fs = require('fs'); const os = require('os'); const { execFileSync } = require('child_process');
(async () => {
  const src = fs.mkdtempSync(path.join(os.tmpdir(), 'hfm_src_')); fs.mkdirSync(path.join(src, '컷'));
  fs.copyFileSync('test/product.png', path.join(src, '상품 정면.png')); fs.copyFileSync('test/product.png', path.join(src, '컷', '디테일.png'));
  fs.writeFileSync(path.join(src, 'memo.txt'), '메모');
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=1280x720:rate=30', '-t', '3', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', path.join(src, '사용 영상.mp4')]);
  const app = await electron.launch({ executablePath: require('electron'), args: ['.', '--no-sandbox'], env: Object.assign({}, process.env, { HFM_HIDDEN: '1', HFM_TEST_SOURCE_DIR: src, HFM_FFMPEG: process.env.HFM_FFMPEG || '/usr/bin/ffmpeg' }) });
  const page = await app.firstWindow(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const ok = (name, cond, extra) => { console.log((cond ? 'OK  ' : 'FAIL') + ' ' + name + (extra !== undefined ? ' | ' + extra : '')); if (!cond) errs.push('FAIL ' + name); };
  await page.waitForTimeout(2500);
  ok('앱: 첫 화면 AI 스토리보드', await page.evaluate(() => PANE === 'ai' && !!APP && !!APP.pickSourceFolder));
  await page.click('#folderPick');
  await page.waitForFunction(() => !FOLDER.busy && FOLDER.count > 0, null, { timeout: 120000 });
  const fa = await page.evaluate(() => Object.entries(S.assets).filter(([, a]) => a.folder).map(([n, a]) => n + (a.video ? `:v${a.dur.toFixed(1)}:${a.img.width}x${a.img.height}` : '')));
  ok('앱: 폴더 사진·영상 (txt 제외)', fa.length === 3 && fa.some(x => x.startsWith('사용영상:v3')), fa.join(', '));
  ok('앱: 고른 폴더 기억', await page.evaluate(() => localStorage.getItem('hfm.srcDir')) === src);
  const proxies = path.join(await app.evaluate(({ app }) => app.getPath('userData')), 'proxies');
  ok('앱: 영상 미리보기 파일(720p) 캐시', fs.existsSync(proxies) && fs.readdirSync(proxies).some(f => f.endsWith('.mp4') && !f.includes('.part')));
  const blocked = await page.evaluate(async () => { try { await APP.readFile('/etc/hostname'); return 'read'; } catch (e) { return 'blocked'; } });
  ok('앱: 상품 폴더 밖 파일은 못 읽음', blocked === 'blocked');
  const lsBlocked = await page.evaluate(() => APP.listFolder('/etc'));
  ok('앱: 고르지 않은 폴더 목록은 못 봄', lsBlocked === null);
  // 영상 배경 렌더 (프레임이 바뀌는지)
  const vd = await page.evaluate(async () => {
    setText('형식: 하드필러 / 길이: 10\n[타이포] *시원하게* {영상: 사용영상}'); const P = proj(), sc = P.scenes[0];
    setStage('wide'); const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const shot = async t => { await syncVideosExact(P, t); renderFrame(g, P, t, { hints: false }); return g.getImageData(0, 0, W, H).data; };
    const a = await shot(.2), b = await shot(1.6); let d = 0; for (let i = 0; i < a.length; i += 4 * 97) d += Math.abs(a[i] - b[i]); return d;
  });
  ok('앱: 영상 배경이 움직임 (H.264 미리보기 재생)', vd > 2000, vd);
  // API 키: Windows 암호화 저장소(리눅스에선 safeStorage)로, 브라우저 저장소엔 안 남김
  await page.evaluate(() => { const d = $('aiKeyBox'); d.open = true; });
  await page.fill('#aiKey', 'sk-ant-app-test'); await page.dispatchEvent('#aiKey', 'change'); await page.waitForTimeout(300);
  const ud = await app.evaluate(({ app }) => app.getPath('userData'));
  const sec = path.join(ud, 'secret.bin');
  ok('앱: 키를 secret.bin에 보관', fs.existsSync(sec) && !fs.readFileSync(sec).toString('latin1').includes('sk-ant-app-test') || (fs.existsSync(sec) && fs.readFileSync(sec).toString().startsWith('plain:')), fs.existsSync(sec) ? fs.readFileSync(sec).slice(0, 6).toString('latin1') : '없음');
  ok('앱: 브라우저 저장소엔 키 없음', await page.evaluate(() => !localStorage.getItem('hfm.key')));
  ok('앱: 다시 읽기', await page.evaluate(() => APP.secretGet()) === 'sk-ant-app-test');
  await page.evaluate(() => saveApiKey('')); await page.waitForTimeout(200);
  ok('앱: 키 지우기', !fs.existsSync(sec));
  await page.evaluate(() => { localStorage.removeItem('hfm.srcDir'); });
  ok('오류 없음', !errs.filter(e => !e.startsWith('FAIL')).length, errs.join(' | '));
  console.log(errs.length ? 'errors ' + JSON.stringify(errs) : 'ALL OK');
  await app.close(); fs.rmSync(src, { recursive: true, force: true });
  process.exit(errs.length ? 1 : 0);
})();
