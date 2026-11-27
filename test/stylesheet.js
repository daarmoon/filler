// 새 스타일 템플릿 대표 프레임을 한 장으로: node test/stylesheet.js [출력경로]
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const out = process.argv[2] || 'test/styles_v4.jpg';
  const browser = await chromium.launch({ args: ['--ignore-certificate-errors'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + path.resolve('dist/hardfiller-maker.html')); await page.waitForTimeout(1500);
  await page.setInputFiles('#imgFile', 'test/product.png'); await page.waitForTimeout(600);
  const url = await page.evaluate(async () => {
    const ids = ['neon', 'pop', 'luxe', 'y2k', 'bf', 'aurora', 'speed', 'winter', 'ink'];
    const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const ctx = c.getContext('2d'); const shots = [];
    for (const id of ids) {
      const t = TEMPLATES.find(x => x.id === id); setText(t.text.replace(/상품1/g, Object.keys(S.assets)[0] || '상품1')); parseNow();
      await loadFontsFor(t.text); await document.fonts.ready;
      const pick = [0];
      for (const i of pick) {
        const sc = S.scenes[i]; renderFrame(ctx, proj(), sc.start + sc.dur * .6, {});
        const s = document.createElement('canvas'); s.width = 640; s.height = 360; const g = s.getContext('2d'); g.drawImage(c, 0, 0, 640, 360);
        if (i === pick[0]) { const nm = t.name.replace(/[✦]|\(새 스타일\)/g, '').trim(); g.font = 'bold 22px sans-serif'; const w = g.measureText(nm).width; g.fillStyle = 'rgba(0,0,0,.75)'; g.fillRect(0, 0, w + 20, 34); g.fillStyle = '#fff'; g.fillText(nm, 10, 25); }
        shots.push(s);
      }
    }
    const cols = 3, sh = document.createElement('canvas'); sh.width = 640 * cols; sh.height = 360 * Math.ceil(shots.length / cols); const g = sh.getContext('2d');
    g.fillStyle = '#111'; g.fillRect(0, 0, sh.width, sh.height);
    shots.forEach((s, i) => g.drawImage(s, (i % cols) * 640, Math.floor(i / cols) * 360)); return sh.toDataURL('image/jpeg', .85);
  });
  fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log('errors', errs); await browser.close();
})();
