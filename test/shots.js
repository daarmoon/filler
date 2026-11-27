const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
(async () => {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const browser = await chromium.launch({ proxy: proxy ? { server: proxy } : undefined, args: ['--ignore-certificate-errors'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const errs = []; page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); page.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await page.goto('file://' + path.resolve('dist/hardfiller-maker.html'));
  await page.waitForTimeout(2500);
  await page.evaluate(() => document.fonts.ready);
  const fontsOk = await page.evaluate(() => [document.fonts.check("40px 'Black Han Sans'"), document.fonts.check("900 40px 'Noto Sans KR'"), document.fonts.check("800 40px 'Nanum Myeongjo'")]);
  console.log('fonts', fontsOk);
  await page.screenshot({ path: 'test/ui.png' });
  const out = process.argv[2] || 'test/frames'; fs.mkdirSync(out, { recursive: true });
  const tpls = await page.evaluate(() => TEMPLATES.map(t => t.id));
  for (const id of tpls) {
    const res = await page.evaluate(async (id) => {
      const t = TEMPLATES.find(x => x.id === id); document.getElementById('sb').value = t.text; parseNow();
      await loadFontsFor(t.text); await document.fonts.ready;
      const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const ctx = c.getContext('2d');
      const shots = []; const warns = [];
      for (const sc of S.scenes) {
        for (const f of [0.45, 0.92]) {
          const tt = sc.start + sc.dur * f;
          renderFrame(ctx, proj(), tt, { showLbar: true, warn: true });
          const v = findViolations(proj()); if (v.length) warns.push(sc.type + '@' + tt.toFixed(1) + ': ' + v.map(b => b.label + '(' + b.why + ')').join(', '));
          const s = document.createElement('canvas'); s.width = 640; s.height = 360; s.getContext('2d').drawImage(c, 0, 0, 640, 360); shots.push(s);
        }
      }
      // contact sheet 4 cols
      const cols = 4, rows = Math.ceil(shots.length / cols); const sheet = document.createElement('canvas'); sheet.width = 640 * cols; sheet.height = 360 * rows;
      const g = sheet.getContext('2d'); shots.forEach((s, i) => g.drawImage(s, (i % cols) * 640, Math.floor(i / cols) * 360));
      return { png: sheet.toDataURL('image/jpeg', .8), warns, errors: S.errors, total: S.total };
    }, id);
    fs.writeFileSync(`${out}/${id}.jpg`, Buffer.from(res.png.split(',')[1], 'base64'));
    console.log(id, res.total.toFixed(1), 'errors:', res.errors.join(' | '), '\n  warns:', res.warns.join('\n  '));
  }
  console.log('console errors:', errs.slice(0, 10));
  await browser.close();
})();
