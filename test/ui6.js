// v5 UI 확인: 드롭다운, 좌/우 재배치, 통강조 탭, 376×790 내보내기
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const out = process.argv[2] || 'test/v5'; fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--ignore-certificate-errors'] });
  const page = await browser.newPage({ viewport: { width: 1680, height: 1050 }, deviceScaleFactor: 1, acceptDownloads: true });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve('dist/hardfiller-maker.html')); await page.waitForTimeout(3000);
  await require('./_demo')(page);
  await page.setInputFiles('#imgFile', 'test/product.png'); await page.waitForTimeout(400);
  const box = await page.$eval('#canvasWrap', el => { const r = el.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), (r.width / r.height).toFixed(3)]; });
  console.log('wide canvasWrap', box);
  // 스타일 드롭다운
  await page.click('#ddStyle .ddBtn'); await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/dd_style.png` });
  await page.click('#ddStyle .ddItem[data-v="style:neon"]'); await page.waitForTimeout(300);
  await page.click('#dirBtn'); await page.waitForTimeout(800);
  console.log('neon head:', (await page.inputValue('#sb')).split('\n')[0]);
  // 폰트 드롭다운: 미리보기 잘림 확인
  await page.click('#ddFont .ddBtn'); await page.waitForTimeout(500);
  const clip = await page.evaluate(() => [...document.querySelectorAll('#ddFont .ddItem')].map(it => { const f = it.querySelector('.ddFont') || it; return { v: it.dataset.v, clipped: f.scrollWidth > f.clientWidth + 1 || f.scrollHeight > f.clientHeight + 1 }; }).filter(x => x.clipped));
  console.log('font previews clipped:', clip.length ? clip : 'none');
  await page.screenshot({ path: `${out}/dd_font.png` });
  await page.click('#ddFont .ddItem[data-v="gasoek"]'); await page.waitForTimeout(200);
  await page.selectOption('#feelSel', '강하게'); await page.waitForTimeout(200);
  console.log('head after font/feel:', (await page.inputValue('#sb')).split('\n')[0]);
  // 장면 선택 → 왼쪽 문구 / 오른쪽 디자인
  await page.click('#thumbs .thumb:nth-child(2)'); await page.waitForTimeout(300);
  console.log('sceneCard visible:', await page.isVisible('#sceneCard'), '| iLines:', await page.isVisible('#sceneText #iLines'), '| right has iLines:', await page.$('#insp #iLines') !== null);
  await page.evaluate(() => { const d = document.getElementById('iDesign'); if (d) d.open = true; });
  await page.click('#iFx button[data-n="코인"]'); await page.waitForTimeout(200);
  console.log('scene2:', (await page.inputValue('#sb')).split('\n')[2]);
  await page.screenshot({ path: `${out}/ui_wide.png` });
  const wideText = await page.inputValue('#sb');
  // 통강조 탭 (v8: 썸네일을 누르면 직접 만들기로 넘어가서 자동 연출로 돌아옴)
  await page.click('#tabs button[data-p="quick"]');
  await page.click('#fmtSeg button[data-v="통강조"]'); await page.waitForTimeout(600); await page.click('#dirBtn'); await page.waitForTimeout(800);
  const tb = await page.$eval('#canvasWrap', el => { const r = el.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), (r.width / r.height).toFixed(3)]; });
  console.log('tong canvasWrap', tb, 'cv', await page.evaluate(() => [cv.width, cv.height]), 'tag', await page.textContent('#sizeTag'));
  console.log('tong head:', (await page.inputValue('#sb')).split('\n')[0]);
  console.log('tong scenes:', await page.evaluate(() => S.scenes.map(s => s.type).join(',')));
  console.log('frameSel visible', await page.isVisible('#frameSel'), 'lbarSel visible', await page.isVisible('#lbarSel'), 'tongHead visible', await page.isVisible('#fTongHead'));
  await page.screenshot({ path: `${out}/ui_tong.png` });
  await page.selectOption('#frameSel', '네온'); await page.waitForTimeout(300);
  console.log('after frame:', (await page.inputValue('#sb')).split('\n')[0]);
  // L바 안에 넣어 보기
  console.log('lbarChk on enter tong:', await page.isChecked('#lbarChk'));
  await page.check('#lbarChk'); await page.waitForTimeout(500);
  console.log('inset cv', await page.evaluate(() => [cv.width, cv.height]), await page.textContent('#sizeTag'));
  await page.$eval('#cv', c => c.toBlob ? 0 : 0);
  const inset = await page.evaluate(() => cv.toDataURL('image/jpeg', .85)); fs.writeFileSync(`${out}/inset.jpg`, Buffer.from(inset.split(',')[1], 'base64'));
  await page.screenshot({ path: `${out}/ui_tong_inset.png` });
  await page.uncheck('#lbarChk'); await page.waitForTimeout(300);
  // 여러 버전
  await page.click('#multiBtn'); await page.waitForTimeout(4000);
  console.log('variants', await page.evaluate(() => VARS.map(v => v.name + '/' + (v.text.match(/형식: (\S+)/) || [])[1])));
  await page.locator('#variants').scrollIntoViewIfNeeded(); await page.screenshot({ path: `${out}/ui_tong_variants.png` });
  // 형식 왕복: 하드필러 글이 남아있는지
  await page.click('#fmtSeg button[data-v="하드필러"]'); await page.waitForTimeout(600);
  console.log('wide text restored:', (await page.inputValue('#sb')) === wideText, 'cv', await page.evaluate(() => [cv.width, cv.height]));
  await page.click('#fmtSeg button[data-v="통강조"]'); await page.waitForTimeout(600);
  // PNG
  const dlP = page.waitForEvent('download'); await page.click('#pngBtn'); const dl = await dlP; const pp = `${out}/frame.png`; await dl.saveAs(pp);
  const png = fs.readFileSync(pp); console.log('png', dl.suggestedFilename(), png.readUInt32BE(16) + '×' + png.readUInt32BE(20));
  // 짧게 내보내기
  await page.evaluate(() => { setText($('sb').value.replace(/길이: [\d.]+/, '길이: 5')); parseNow(); });
  await page.click('#exportBtn'); await page.waitForTimeout(300);
  console.log('expInfo:', await page.textContent('#expInfo'), '| lbar opt visible', await page.isVisible('#expLbarRow'), '| ff visible', await page.isVisible('#ffBox'));
  const dl2P = page.waitForEvent('download', { timeout: 180000 }); await page.click('#expGo'); const dl2 = await dl2P; await dl2.saveAs(`${out}/tong.mp4`);
  await page.waitForFunction(() => /완료|실패/.test(document.getElementById('expMsg').textContent), null, { timeout: 180000 });
  console.log('export:', await page.textContent('#expMsg'), dl2.suggestedFilename());
  console.log('errors', errs); await browser.close();
})();
