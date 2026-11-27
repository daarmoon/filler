const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch({ proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined, args: ['--ignore-certificate-errors'] });
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 }, acceptDownloads: true });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + path.resolve('dist/hardfiller-maker.html')); await page.waitForTimeout(1500);
  await page.setInputFiles('#bgmFile', 'test/bgm.wav'); await page.waitForTimeout(1200);
  console.log('bgm', await page.textContent('#bgmBox'));
  await page.evaluate(() => { S.dur = 6; writeSettings(); });
  await page.click('#exportBtn');
  console.log('ffmpeg hint ok:', (await page.inputValue('#ffCmd')).includes('mxf'));
  const dl = page.waitForEvent('download', { timeout: 120000 }).catch(async e => { console.log('MSG', await page.textContent('#expMsg'), errs); throw e; });
  await page.click('#expGo'); const d = await dl; await d.saveAs('test/out_bgm.mp4');
  console.log(await page.textContent('#expMsg'), errs);
  await browser.close();
})();
