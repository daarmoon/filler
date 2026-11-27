const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const proxy = process.env.HTTPS_PROXY;
  const browser = await chromium.launch({ proxy: proxy ? { server: proxy } : undefined, args: ['--ignore-certificate-errors'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, acceptDownloads: true });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve('dist/hardfiller-maker.html')); await page.waitForTimeout(2000);
  await page.click('#tabs button[data-p="board"]'); await page.selectOption('#tplSel', 'opening'); await page.waitForTimeout(300);
  await page.setInputFiles('#imgFile', 'test/product.png'); await page.waitForTimeout(500);
  const names = await page.evaluate(() => Object.keys(S.assets)); console.log('assets', names);
  await page.click('#tabs button[data-p="src"]'); await page.click('[data-a=rm]'); await page.waitForTimeout(300);
  const sz = await page.evaluate(() => { const a = Object.values(S.assets)[0].img; return [a.width, a.height]; }); console.log('after bg remove', sz);
  // 장면 선택 + 인스펙터 변경
  await page.click('#timeline', { position: { x: 30, y: 20 } }); await page.waitForTimeout(200);
  await page.evaluate(() => { const d = document.getElementById('iDesign'); if (d) d.open = true; });
  await page.selectOption('#sceneText select[data-k="모션"]', '드롭'); await page.waitForTimeout(300);
  console.log('first line:', await page.evaluate(() => document.getElementById('sb').value.split('\n')[1]));
  await page.screenshot({ path: 'test/ui2.png' });
  console.log('codec', await page.evaluate(async () => { const c = await pickVideoCodec(29.97); return c && c.codec; }));
  await page.evaluate(() => { S.dur = 6; writeSettings(); });
  await page.click('#exportBtn'); const dl = page.waitForEvent('download', { timeout: 120000 }).catch(async e => { console.log('MSG', await page.textContent('#expMsg'), errs); throw e; });
  await page.click('#expGo'); const d = await dl; await d.saveAs('test/out.' + (d.suggestedFilename().split('.').pop()));
  console.log('saved', d.suggestedFilename(), await page.textContent('#expMsg'));
  console.log('errors', errs);
  await browser.close();
})();
