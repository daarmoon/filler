// 통강조 템플릿 렌더 확인: node test/tong.js [출력폴더]
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const out = process.argv[2] || 'test/tong'; fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--ignore-certificate-errors'] });
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  await page.route('https://raw.githubusercontent.com/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' })); // 트렌드 노트는 인터넷 대신 빈 목록
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve('dist/hardfiller-maker.html')); await page.waitForTimeout(1500);
  await page.evaluate(() => showPane('build')); // v10부터 첫 화면은 AI 스토리보드 탭
  await page.setInputFiles('#imgFile', 'test/product.png'); await page.waitForTimeout(500);
  const ids = await page.evaluate(() => TEMPLATES.filter(t => t.fmt === '통강조').map(t => t.id));
  for (const id of ids) {
    const r = await page.evaluate(async id => {
      const t = TEMPLATES.find(x => x.id === id); const text = t.text; const p = projFromText(text); await loadFontsFor(text); await document.fonts.ready;
      setStage('tong'); const big = document.createElement('canvas'); big.width = W; big.height = H; const bx = big.getContext('2d'); const shots = []; const warns = [];
      for (const sc of p.scenes) for (const f of [.5, .93]) {
        Collector.on = true; renderFrame(bx, p, sc.start + sc.dur * f, { warn: true }); const v = findViolations(p); if (v.length) warns.push(sc.type + ': ' + v.map(b => b.label + '(' + b.why + ')').join(', '));
        const s = document.createElement('canvas'); s.width = 376; s.height = 790; const g = s.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(big, 0, 0, 376, 790); shots.push(s);
      }
      const cols = Math.min(8, shots.length), sh = document.createElement('canvas'); sh.width = 376 * cols + (cols - 1) * 8; sh.height = 790 * Math.ceil(shots.length / cols) + 8 * (Math.ceil(shots.length / cols) - 1);
      const g = sh.getContext('2d'); g.fillStyle = '#777'; g.fillRect(0, 0, sh.width, sh.height);
      shots.forEach((s, i) => g.drawImage(s, (i % cols) * 384, Math.floor(i / cols) * 798));
      return { url: sh.toDataURL('image/jpeg', .85), warns, n: p.scenes.length, total: p.total };
    }, id);
    fs.writeFileSync(`${out}/${id}.jpg`, Buffer.from(r.url.split(',')[1], 'base64'));
    console.log(id, r.n, '장면', r.total, '초', r.warns.length ? '\n  ' + [...new Set(r.warns)].join('\n  ') : '');
  }
  console.log('errors', errs); await browser.close();
})();
