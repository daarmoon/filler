const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const proxy = process.env.HTTPS_PROXY;
  const browser = await chromium.launch({ proxy: proxy ? { server: proxy } : undefined, args: ['--ignore-certificate-errors'] });
  const page = await browser.newPage({ viewport: { width: 1680, height: 1000 }, deviceScaleFactor: 1 });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve('dist/hardfiller-maker.html')); await page.waitForTimeout(2500);
  await page.setInputFiles('#imgFile', 'test/product.png'); await page.waitForTimeout(400);
  await page.click('#tabs button[data-p="src"]'); await page.click('[data-a=rm]'); await page.waitForTimeout(300);
  await page.click('#tabs button[data-p="quick"]'); await page.click('#dirBtn'); await page.waitForTimeout(500);
  console.log('SB1\n' + await page.inputValue('#sb'));
  await page.click('#timeline', { position: { x: 200, y: 30 } }); await page.waitForTimeout(400);
  await page.screenshot({ path: 'test/new_ui.png' });
  await page.click('#shuffleBtn'); await page.waitForTimeout(400);
  console.log('SB2\n' + await page.inputValue('#sb'));
  await page.click('#feelSeg button[data-v="부드럽게"]'); await page.waitForTimeout(300);
  console.log('header:', (await page.inputValue('#sb')).split('\n')[0]);
  await page.click('#tabs button[data-p="board"]'); await page.waitForTimeout(200);
  await page.screenshot({ path: 'test/new_ui_board.png' });
  await page.click('#undoBtn'); await page.waitForTimeout(200);
  console.log('after undo header:', (await page.inputValue('#sb')).split('\n')[0]);
  // AI without key
  await page.click('#tabs button[data-p="quick"]'); await page.click('#aiBtn'); await page.waitForTimeout(200); console.log('aiMsg:', await page.textContent('#aiMsg'));
  // 전환 프레임 시트 (각 장면 경계 근처)
  const png = await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const ctx = c.getContext('2d'); const shots = [];
    for (let i = 1; i < Math.min(S.scenes.length, 5); i++) for (const d of [-.25, -.08, .08, .25]) { renderFrame(ctx, proj(), S.scenes[i].start + d, { showLbar: true }); const s = document.createElement('canvas'); s.width = 480; s.height = 270; s.getContext('2d').drawImage(c, 0, 0, 480, 270); shots.push(s); }
    const sheet = document.createElement('canvas'); sheet.width = 480 * 4; sheet.height = 270 * Math.ceil(shots.length / 4); const g = sheet.getContext('2d');
    shots.forEach((s, i) => g.drawImage(s, (i % 4) * 480, Math.floor(i / 4) * 270)); return sheet.toDataURL('image/jpeg', .8);
  });
  fs.writeFileSync('test/transitions.jpg', Buffer.from(png.split(',')[1], 'base64'));
  console.log('errors', errs);
  await browser.close();
})();
