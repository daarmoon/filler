// 윈도우 앱(Electron) 동작 확인 (리눅스에서 xvfb로): xvfb-run -a node test/app.js
const { _electron: electron } = require('playwright'); const path = require('path'); const fs = require('fs'); const { execSync } = require('child_process');
(async () => {
  const out = path.resolve('test/appout'); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  const app = await electron.launch({ executablePath: require('electron'), args: ['.', '--no-sandbox'], env: Object.assign({}, process.env, { HFM_TEST_SAVE_DIR: out, HFM_FFMPEG: process.env.HFM_FFMPEG || '/usr/bin/ffmpeg' }) });
  const page = await app.firstWindow(); const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.waitForTimeout(3000);
  console.log('title', await page.title(), '| ver', await page.textContent('#appVer'), '| app class', await page.evaluate(() => document.body.classList.contains('app')), '| info', JSON.stringify(await page.evaluate(() => APP_INFO)));
  await page.setInputFiles('#imgFile', 'test/product.png'); await page.waitForTimeout(400);
  await page.evaluate(() => { const t = TEMPLATES.find(x => x.id === 'ins_half'); setText(t.text.replace(/길이: [\d.]+/, '길이: 4')); parseNow(); });
  await page.waitForTimeout(500);
  await page.click('#exportBtn'); await page.waitForTimeout(300);
  console.log('mxf option visible', await page.isVisible('#expMxfRow'), '| ffmpeg box visible', await page.isVisible('#ffBox'));
  await page.click('#expGo');
  await page.waitForFunction(() => /완료|실패|취소/.test(document.getElementById('expMsg').textContent), null, { timeout: 300000 });
  console.log('export:', await page.textContent('#expMsg'));
  for (const f of fs.readdirSync(out)) { console.log(' file', f, fs.statSync(path.join(out, f)).size); if (f.endsWith('.mxf')) console.log(execSync(`ffprobe -v error -show_entries format=duration,format_name:stream=codec_name,pix_fmt,field_order,r_frame_rate,channels -of compact=p=0 "${path.join(out, f)}" | sort | uniq -c`).toString()); }
  // PNG 저장
  await page.click('#expCancel'); await page.click('#pngBtn'); await page.waitForTimeout(1500);
  console.log('files after png', fs.readdirSync(out));
  await page.screenshot({ path: 'test/appout_ui.png' });
  console.log('errors', errs); await app.close();
})();
