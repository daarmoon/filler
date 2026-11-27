// v7 확인: 빈 화면 시작, 장면 골라 쌓기·문구 직접 쓰기, 자간·행간, 혜택 칸 삭제, 통강조 8초·2장면
// node test/ui8.js [저장 폴더]
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const out = process.argv[2] || 'test/v7'; fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1680, height: 1050 }, deviceScaleFactor: +(process.env.DPR || 1) });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + path.resolve('dist/hardfiller-maker.html')); await page.waitForTimeout(1500);
  console.log('start text:', JSON.stringify(await page.inputValue('#sb')), '| scenes', await page.evaluate(() => S.scenes.length), '| pane', await page.evaluate(() => PANE));
  console.log('product field empty:', await page.inputValue('#fProduct') === '', '| benefits field:', await page.$('#fBenefits'));
  console.log('palette:', (await page.$$eval('#palette button b', a => a.map(x => x.textContent))).join(','));
  await page.screenshot({ path: out + '/v7_blank.png' });
  // 타이포 쌓고 문구 쓰기
  await page.click('#palette button[data-t=typo]'); await page.waitForTimeout(300);
  console.log('focused:', await page.evaluate(() => document.activeElement.id), '| card in stack:', await page.evaluate(() => $('sceneCard').parentNode.id));
  await page.keyboard.type('지금 이 방송'); await page.keyboard.press('Enter'); await page.keyboard.type('*채널고정!*');
  await page.waitForTimeout(500);
  console.log('after typing focus:', await page.evaluate(() => document.activeElement.id), '| sb:', JSON.stringify(await page.inputValue('#sb')));
  await page.click('#palette button[data-t=price]'); await page.waitForTimeout(300);
  await page.keyboard.type('단,\n39,900원'); await page.waitForTimeout(500);
  await page.click('#palette button[data-t=urgent]'); await page.waitForTimeout(400);
  console.log('stack items:', await page.$$eval('.stItem', a => a.map(x => x.textContent)));
  await page.screenshot({ path: out + '/v7_build.png' });
  // 자간·행간
  await page.click('.stItem[data-i="0"]'); await page.waitForTimeout(400);
  await page.$eval('#leadK', el => { el.value = 140; el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('change')); });
  await page.$eval('#trackK', el => { el.value = 12; el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('change')); });
  await page.waitForTimeout(300);
  console.log('head:', (await page.inputValue('#sb')).split('\n')[0]);
  await page.$eval('#iTr', el => { el.value = -5; el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('change')); });
  await page.waitForTimeout(300);
  console.log('scene line:', (await page.inputValue('#sb')).split('\n')[1]);
  await page.screenshot({ path: out + '/v7_spacing.png' });
  // 이미지만 있는 상품 장면도 그려지는지, 빈 장면 안내는 영상에는 안 나오는지
  await page.setInputFiles('#imgFile', 'test/product.png'); await page.waitForTimeout(400);
  await page.click('#palette button[data-t=product]'); await page.waitForTimeout(300);
  console.log('product scene:', (await page.inputValue('#sb')).split('\n').pop(), '| empty?', await page.evaluate(() => sceneEmpty(S.scenes[S.scenes.length - 1])));
  console.log('hint only in preview:', await page.evaluate(() => {
    const i = S.scenes.findIndex(s => sceneEmpty(s)); const t = S.scenes[i].start + S.scenes[i].dur * .5; const P = proj();
    const a = document.createElement('canvas'), b = document.createElement('canvas'); a.width = b.width = 1920; a.height = b.height = 1080;
    renderFrame(a.getContext('2d'), P, t, { hints: true }); renderFrame(b.getContext('2d'), P, t, { hints: false });
    const da = a.getContext('2d').getImageData(900, 500, 300, 60).data, db = b.getContext('2d').getImageData(900, 500, 300, 60).data;
    let diff = 0; for (let k = 0; k < da.length; k += 4) diff += Math.abs(da[k] - db[k]); return diff > 10000;
  }));
  // 통강조
  await page.click('#fmtSeg button[data-v=통강조]'); await page.waitForTimeout(500);
  console.log('tong text:', JSON.stringify(await page.inputValue('#sb')), '| dur max', await page.getAttribute('#durRange', 'max'), '| S.dur', await page.evaluate(() => S.dur));
  await page.evaluate(() => { setText('형식: 통강조 / 길이: 15\n[배지] 방송 / *단독*\n[가격] 단, / 9,900원'); });
  await page.waitForTimeout(300);
  console.log('tong clamp:', await page.evaluate(() => [S.dur, S.total.toFixed(2), S.errors.join(' | ')]));
  await page.click('#palette button[data-t=typo]'); await page.waitForTimeout(200); await page.keyboard.type('(작게)오늘만\n*반값*'); await page.waitForTimeout(500);
  console.log('tong typo:', (await page.inputValue('#sb')).split('\n').pop());
  await page.screenshot({ path: out + '/v7_tong.png' });
  console.log('palette tong:', (await page.$$eval('#palette button b', a => a.map(x => x.textContent))).join(','));
  // 자동 연출 통강조 2장면
  await page.click('#tabs button[data-p=quick]'); await page.fill('#fProduct', '마데카 크림'); await page.fill('#fPrice', '39900'); await page.fill('#fPoints', '흡수 빠름\n끈적임 없음');
  await page.click('#dirBtn'); await page.waitForTimeout(500);
  console.log('tong direct:', await page.evaluate(() => [S.scenes.map(s => s.type).join(','), S.total.toFixed(1)]));
  await page.click('#fmtSeg button[data-v=하드필러]'); await page.waitForTimeout(400);
  console.log('back to hard:', await page.evaluate(() => S.scenes.length));
  await page.click('#dirBtn'); await page.waitForTimeout(500);
  console.log('hard direct types:', await page.evaluate(() => S.scenes.map(s => s.type).join(',')));
  await page.click('#recipeSeg button[data-v=typo]'); await page.waitForTimeout(200); await page.click('#dirBtn'); await page.waitForTimeout(500);
  console.log('typo recipe direct:', await page.evaluate(() => S.scenes.map(s => s.type + ':' + sceneText(s)).join(' | ')));
  // 새로 만들기
  await page.click('#newBtn'); await page.waitForTimeout(300);
  console.log('after new:', await page.evaluate(() => [S.scenes.length, PANE]));
  console.log('errors', errs);
  await b.close();
})();
