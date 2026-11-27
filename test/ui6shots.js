// v5 전달용 화면: node test/ui6shots.js [출력폴더] [배율]
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const out = process.argv[2] || 'test/v5'; const dpr = +(process.argv[3] || 1); fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--ignore-certificate-errors'] });
  const page = await browser.newPage({ viewport: { width: 1680, height: 1050 }, deviceScaleFactor: dpr });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve('dist/hardfiller-maker.html')); await page.waitForTimeout(3000);
  await page.setInputFiles('#imgFile', 'test/product.png'); await page.waitForTimeout(400);
  const hideToast = () => page.evaluate(() => document.getElementById('toast').classList.remove('show'));
  const pick = async (i, f = .6) => { await page.click(`#thumbs .thumb:nth-child(${i})`); await page.evaluate(([i, f]) => { const sc = S.scenes[i - 1]; S.t = sc.start + sc.dur * f; S.dirty = true; }, [i, f]); await page.waitForTimeout(500); };
  const top = () => page.evaluate(() => document.querySelectorAll('.col, aside, section').forEach(c => c.scrollTop = 0));
  await pick(3); await top(); await hideToast(); await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/ui_wide.png` });
  await page.click('#fmtSeg button[data-v="통강조"]'); await page.waitForTimeout(1500);
  for (const [i, n] of [[1, 'product'], [2, 'points'], [4, 'price']]) { await pick(i, .7); await top(); await hideToast(); await page.waitForTimeout(300); await page.screenshot({ path: `${out}/ui_tong_${n}.png` }); }
  await page.check('#lbarChk'); await page.waitForTimeout(500); await page.screenshot({ path: `${out}/ui_tong_inset.png` });
  await page.uncheck('#lbarChk'); await page.click('#ddFont .ddBtn'); await page.waitForTimeout(500); await page.screenshot({ path: `${out}/ui_font_dd.png` });
  console.log('errors', errs); await browser.close();
})();
