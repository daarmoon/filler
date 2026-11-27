const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const proxy = process.env.HTTPS_PROXY;
  const browser = await chromium.launch({ proxy: proxy ? { server: proxy } : undefined, args: ['--ignore-certificate-errors'] });
  const page = await browser.newPage({ viewport: { width: 1680, height: 1050 }, deviceScaleFactor: 1 });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve('dist/hardfiller-maker.html')); await page.waitForTimeout(2500);
  await require('./_demo')(page);
  // 주황 상품 이미지 만들어 올리기
  await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 400; c.height = 500; const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, 400, 500); g.fillStyle = '#ff7a1a'; g.fillRect(100, 120, 200, 320);
    g.fillStyle = '#2a9a3a'; g.beginPath(); g.ellipse(200, 100, 60, 30, 0, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.font = 'bold 40px sans-serif'; g.fillText('JUICE', 140, 300); addAsset('상품1', c);
  });
  await page.waitForTimeout(300);
  console.log('suggest', await page.evaluate(() => keySuggest));
  await page.fill('#fListPrice', '99000'); await page.fill('#fRate', '23'); await page.fill('#fPrice', ''); await page.fill('#fUnit', '팩');
  await page.waitForTimeout(100);
  console.log('calc:', await page.innerText('#fCalc'));
  await page.click('#ddStyle .ddBtn'); await page.click('#ddStyle .ddItem[data-v="__img"]');
  await page.click('#dirBtn'); await page.waitForTimeout(600);
  console.log('SB\n' + await page.inputValue('#sb'));
  console.log('tone:', await page.innerText('#keyTone'));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test/ui_v3.png' });
  // 드래그로 순서 바꾸기: 1번을 3번 뒤로
  const before = await page.evaluate(() => S.scenes.map(s => BLOCK_LABEL[s.type]).join(','));
  const th = await page.$$('.thumb'); const b2 = await th[2].boundingBox();
  await page.dragAndDrop('#thumbs .thumb:nth-child(1)', '#thumbs .thumb:nth-child(3)', { targetPosition: { x: b2.width - 10, y: b2.height / 2 } }); await page.waitForTimeout(600);
  const after = await page.evaluate(() => S.scenes.map(s => BLOCK_LABEL[s.type]).join(','));
  console.log('order', before, '=>', after, 'sel', await page.evaluate(() => S.sel));
  await page.click('#undoBtn'); await page.waitForTimeout(300);
  console.log('undo', await page.evaluate(() => S.scenes.map(s => BLOCK_LABEL[s.type]).join(',')));
  // 키컬러 4색 × 장면 4개
  const png = await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const ctx = c.getContext('2d'); const shots = [];
    const pi = S.scenes.findIndex(s => s.type === 'price');
    for (const k of ['#ff7a1a', '#2a6ad8', '#ffd84a', '#9b4dff']) {
      const P = Object.assign(proj(), { theme: 'key', key: k });
      for (const [i, f] of [[0, .7], [pi, .95], [pi + 1, .9], [S.scenes.length - 1, .6]]) {
        const sc = S.scenes[i]; renderFrame(ctx, P, sc.start + sc.dur * f, { showLbar: true });
        const s = document.createElement('canvas'); s.width = 480; s.height = 270; s.getContext('2d').drawImage(c, 0, 0, 480, 270); shots.push(s);
      }
    }
    const sheet = document.createElement('canvas'); sheet.width = 1920; sheet.height = 270 * 4; const g = sheet.getContext('2d');
    shots.forEach((s, i) => g.drawImage(s, (i % 4) * 480, Math.floor(i / 4) * 270)); return sheet.toDataURL('image/jpeg', .82);
  });
  fs.writeFileSync('test/keycolors.jpg', Buffer.from(png.split(',')[1], 'base64'));
  const big = await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const sc = S.scenes.find(s => s.type === 'price');
    renderFrame(c.getContext('2d'), proj(), sc.start + sc.dur * .78, { showLbar: true, warn: true });
    return { png: c.toDataURL('image/jpeg', .85), v: findViolations(proj()).map(b => b.label + ' ' + b.why) };
  });
  fs.writeFileSync('test/price_big.jpg', Buffer.from(big.png.split(',')[1], 'base64')); console.log('price warns', big.v);
  console.log('errors', errs);
  await browser.close();
})();
