// 효과별 큰 프레임 확인용: node test/fxcheck.js [효과1,효과2,...] [템플릿id]
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const names = process.argv[2] ? process.argv[2].split(',') : null; const tpl = process.argv[3] || 'ns';
  const browser = await chromium.launch({ args: ['--ignore-certificate-errors'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + path.resolve('dist/hardfiller-maker.html')); await page.waitForTimeout(1500);
  if (process.env.F) await page.evaluate(f => { window.__F = f; }, process.env.F.split(',').map(Number));
  await page.evaluate(t => { const x = TEMPLATES.find(z => z.id === t); setText(x.text); parseNow(); }, tpl); await page.waitForTimeout(500);
  const url = await page.evaluate(async (names) => {
    const list = names || EFFECT_NAMES; const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const ctx = c.getContext('2d'); const shots = [];
    for (const n of list) {
      for (const f of (window.__F || [.25, .75])) {
        const p = Object.assign(proj(), { fx: [n] }); const sc = p.scenes[1]; renderFrame(ctx, p, sc.start + sc.dur * f, {});
        const s = document.createElement('canvas'); s.width = 640; s.height = 360; const g = s.getContext('2d'); g.drawImage(c, 0, 0, 640, 360);
        g.fillStyle = '#000'; g.fillRect(0, 0, 150, 34); g.fillStyle = '#fff'; g.font = 'bold 22px sans-serif'; g.fillText(window.__F ? n : n + ' ' + f, 10, 25); shots.push(s);
      }
    }
    const cols = 4, sh = document.createElement('canvas'); sh.width = 640 * cols; sh.height = 360 * Math.ceil(shots.length / cols); const g = sh.getContext('2d');
    shots.forEach((s, i) => g.drawImage(s, (i % cols) * 640, Math.floor(i / cols) * 360)); return sh.toDataURL('image/jpeg', .82);
  }, names);
  fs.writeFileSync(process.env.OUT || 'test/fxcheck.jpg', Buffer.from(url.split(',')[1], 'base64'));
  console.log('errors', errs); await browser.close();
})();
