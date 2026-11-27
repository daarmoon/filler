// v6 확인: 인서트 탭, 타이포, 단서 자막, 이미지 크기, 여백 자르기
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const out = process.argv[2] || 'test/v6'; fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--ignore-certificate-errors'] });
  const page = await browser.newPage({ viewport: { width: 1680, height: 1050 }, deviceScaleFactor: +(process.env.DPR || 1), acceptDownloads: true });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve('dist/hardfiller-maker.html')); await page.waitForTimeout(3000);
  await page.setInputFiles('#imgFile', 'test/product.png'); await page.waitForTimeout(500);
  console.log('asset size after trim:', await page.evaluate(() => Object.values(S.assets).map(a => a.img.width + 'x' + a.img.height)));
  console.log('ver:', await page.textContent('#appVer'));
  // 인서트 탭
  await page.click('#fmtSeg button[data-v="인서트"]'); await page.waitForTimeout(1200);
  const sb = await page.inputValue('#sb'); console.log('insert head:', sb.split('\n')[0]); console.log('insert scenes:', await page.evaluate(() => S.scenes.map(s => s.type + (s.opts.스타일 ? '/' + s.opts.스타일 : '')).join(', ')), await page.evaluate(() => S.total.toFixed(1)));
  console.log('fDan visible:', await page.isVisible('#fDan'), 'imgK visible:', await page.isVisible('#imgK'));
  await page.fill('#fDan', '박스당 최저가격찬스 | NS기준, 50% 세일, 총5회'); await page.press('#fDan', 'Tab'); await page.waitForTimeout(300);
  console.log('after dan:', (await page.inputValue('#sb')).split('\n')[0]);
  await page.evaluate(() => { const i = S.scenes.findIndex(s => s.type === 'typo'); S.sel = i; S.t = S.scenes[i].start + S.scenes[i].dur * .8; S.dirty = true; buildInspector(); buildTimeline(); }); await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/ui_insert.png` });
  // 전체 이미지 크기
  await page.$eval('#imgK', el => { el.value = 150; el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('change')); }); await page.waitForTimeout(300);
  console.log('after imgK:', (await page.inputValue('#sb')).split('\n')[0]);
  // 하드필러에서 상품 장면 이미지 크기
  await page.click('#fmtSeg button[data-v="하드필러"]'); await page.waitForTimeout(800);
  const pi = await page.evaluate(() => S.scenes.findIndex(s => s.type === 'product'));
  const measure = () => page.evaluate(i => { const sc = S.scenes[i]; Collector.boxes = []; Collector.on = true; const c = document.createElement('canvas'); c.width = W; c.height = H; renderFrame(c.getContext('2d'), proj(), sc.start + sc.dur * .8, { warn: true }); const b = (Collector.boxes || []).filter(x => x.label === '이미지'); Collector.on = false; return b.map(x => Math.round(x.w) + 'x' + Math.round(x.h)).join(' '); }, pi);
  console.log('product img box @100%:', await measure());
  await page.click(`#thumbs .thumb:nth-child(${pi + 1})`); await page.waitForTimeout(300);
  console.log('iK slider:', await page.isVisible('#iK'));
  await page.$eval('#iK', el => { el.value = 160; el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('change')); }); await page.waitForTimeout(400);
  console.log('scene line:', (await page.inputValue('#sb')).split('\n').find(l => l.startsWith('[상품]')));
  console.log('product img box @160%:', await measure());
  await page.evaluate(i => { S.sel = i; const sc = S.scenes[i]; S.t = sc.start + sc.dur * .8; S.dirty = true; }, pi); await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/ui_imgsize.png` });
  // 여러 버전 (인서트)
  await page.click('#fmtSeg button[data-v="인서트"]'); await page.waitForTimeout(800);
  await page.click('#multiBtn'); await page.waitForTimeout(4000);
  console.log('insert variants:', await page.evaluate(() => VARS.map(v => v.name)));
  // 짧게 내보내기
  await page.evaluate(() => { setText($('sb').value.replace(/길이: [\d.]+/, '길이: 4')); parseNow(); });
  await page.click('#exportBtn'); await page.waitForTimeout(300);
  console.log('mxf row hidden in browser:', !(await page.isVisible('#expMxfRow')), '| ff cmd:', (await page.inputValue('#ffCmd')).slice(0, 120));
  const dlP = page.waitForEvent('download', { timeout: 180000 }); await page.click('#expGo'); const dl = await dlP; await dl.saveAs(`${out}/insert.mp4`);
  await page.waitForFunction(() => /완료|실패/.test(document.getElementById('expMsg').textContent), null, { timeout: 180000 });
  console.log('export:', await page.textContent('#expMsg'));
  // 새로고침 후 이미지 자동 복원
  await page.reload(); await page.waitForTimeout(3500);
  console.log('restored assets:', await page.evaluate(() => Object.keys(S.assets)));
  console.log('errors', errs); await browser.close();
})();
