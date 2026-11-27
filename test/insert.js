// 인서트 템플릿 렌더 확인: node test/insert.js [출력폴더]
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const out = process.argv[2] || 'test/insert'; fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--ignore-certificate-errors'] });
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve('dist/hardfiller-maker.html')); await page.waitForTimeout(1500);
  await page.setInputFiles('#imgFile', 'test/product.png'); await page.waitForTimeout(500);
  const ids = process.env.IDS ? process.env.IDS.split(',') : await page.evaluate(() => TEMPLATES.filter(t => t.fmt === '인서트').map(t => t.id));
  for (const id of ids) {
    const r = await page.evaluate(async ([id, F]) => {
      const t = TEMPLATES.find(x => x.id === id); const p = projFromText(t.text); await loadFontsFor(t.text); await document.fonts.ready;
      setStage('wide'); const big = document.createElement('canvas'); big.width = W; big.height = H; const bx = big.getContext('2d'); const shots = []; const warns = [];
      for (const sc of p.scenes) for (const f of F) {
        renderFrame(bx, p, sc.start + sc.dur * f, { warn: true, showLbar: true }); const v = findViolations(p); if (v.length) warns.push(sc.type + ': ' + v.map(b => b.label + '(' + b.why + ')').join(', '));
        const s = document.createElement('canvas'); s.width = 640; s.height = 360; s.getContext('2d').drawImage(big, 0, 0, 640, 360); shots.push(s);
      }
      const cols = F.length === 1 ? 4 : F.length * 2, rows = Math.ceil(shots.length / cols), sh = document.createElement('canvas'); sh.width = 640 * cols; sh.height = 360 * rows;
      const g = sh.getContext('2d'); shots.forEach((s, i) => g.drawImage(s, (i % cols) * 640, Math.floor(i / cols) * 360));
      return { url: sh.toDataURL('image/jpeg', .82), warns, n: p.scenes.length, total: p.total };
    }, [id, (process.env.F || '.35,.9').split(',').map(Number)]);
    fs.writeFileSync(`${out}/${id}.jpg`, Buffer.from(r.url.split(',')[1], 'base64'));
    console.log(id, r.n, '장면', r.total.toFixed(1), '초', r.warns.length ? '\n  ' + [...new Set(r.warns)].join('\n  ') : '');
  }
  console.log('errors', errs); await browser.close();
})();
