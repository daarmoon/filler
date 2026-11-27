// v8 확인: 장면별 단서 자막, 가격 내려가기 모션, 장면별 설정 한 창, 연출 방식(상품 소개형/타이포 강조형),
// 스타일 자동(상품명 → 상품 이미지 색), 새 테마 9종, 통강조 단서
// node test/ui9.js [저장 폴더]   (DPR=2 로 고해상도 스크린샷)
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const out = process.argv[2] || 'test/v8'; fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1680, height: 1050 }, deviceScaleFactor: +(process.env.DPR || 1) });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const sb = async n => (await page.inputValue('#sb')).split('\n')[n];
  const ok = (name, cond, extra) => { console.log((cond ? 'OK  ' : 'FAIL') + ' ' + name + (extra !== undefined ? ' | ' + extra : '')); if (!cond) errs.push('FAIL ' + name); };
  await page.goto('file://' + path.resolve('dist/hardfiller-maker.html')); await page.waitForTimeout(1500);
  ok('인서트 탭 없음', !(await page.$('#fmtSeg button[data-v=인서트]')));

  // 1) 직접 만들기: 타이포 + 줄 도구
  await page.click('#palette button[data-t=typo]'); await page.waitForTimeout(300);
  await page.keyboard.type('지금 이 방송'); await page.keyboard.press('Enter'); await page.keyboard.type('채널고정');
  await page.click('#iTools button[data-tool=em]'); await page.waitForTimeout(100);
  await page.keyboard.press('ArrowUp'); await page.click('#iTools button[data-tag=작게]'); await page.waitForTimeout(500);
  const l1 = await sb(1);
  ok('줄 도구(강조·작게)', l1 === '[타이포] (작게)지금 이 방송 / *채널고정*', l1);
  ok('입력칸 포커스 유지', await page.evaluate(() => document.activeElement.id) === 'iLines');

  // 2) 할인가 장면: 정가 → 판매가 내려가기, 장면 단서(쉼표 → 따옴표), 꾸미기 배경
  const di = await page.evaluate(() => [...document.querySelectorAll('#palette [data-i]')].findIndex(e => e.textContent.includes('할인가')));
  await page.click(`#palette [data-i="${di}"]`); await page.waitForTimeout(300);
  await page.keyboard.type('단,\n39,900원'); await page.waitForTimeout(400);
  await page.fill('[data-k=정가]', '59,000원'); await page.waitForTimeout(600);
  await page.fill('[data-k=단서]', '가격 기준 | NS 정상가 대비, 모바일 할인 별도'); await page.waitForTimeout(700);
  await page.evaluate(() => { $('iDesign').open = true; });
  await page.selectOption('#iDesign select[data-k=배경]', '2'); await page.waitForTimeout(400);
  const l2 = await sb(2);
  ok('가격 장면 한 줄', /가격모션: 내려가기/.test(l2) && /정가: 59,000원/.test(l2) && /단서: "가격 기준 \| NS 정상가 대비, 모바일 할인 별도"/.test(l2) && /배경: 2/.test(l2), l2);
  const o = await page.evaluate(() => S.scenes[1].opts);
  ok('따옴표 단서 다시 읽기', o.단서 === '가격 기준 | NS 정상가 대비, 모바일 할인 별도' && o.정가 === '59,000원', JSON.stringify(o));
  const an = await page.evaluate(() => [.1, 1.0, 2.5].map(lt => priceAnim('39,900', { lt, opts: { 가격모션: '내려가기', 정가: '59,000원' } }).shown));
  ok('내려가기 숫자 59,000 → 39,900', an[0] === '59,000' && an[2] === '39,900' && an[1] !== an[0] && an[1] !== an[2], an.join(' → '));
  await page.screenshot({ path: out + '/v8_scene_editor.png' });

  // 3) 공통 단서 (직접 만들기 카드)
  await page.fill('#bDan', '박스당 최저가 | NS기준, 50% 세일'); await page.waitForTimeout(700);
  ok('공통 단서 → 설정 줄', /단서: 박스당 최저가 \| NS기준, 50% 세일/.test(await sb(0)), await sb(0));
  ok('장면 단서가 공통보다 먼저', await page.evaluate(() => [danFor(proj(), S.scenes[1]), danFor(proj(), S.scenes[0])].join(' / ')) === '가격 기준 | NS 정상가 대비, 모바일 할인 별도 / 박스당 최저가 | NS기준, 50% 세일');

  // 4) 자동 연출에서 장면 카드는 직접 만들기 안에만, 썸네일 누르면 직접 만들기로
  await page.click('#tabs button[data-p=quick]'); await page.waitForTimeout(300);
  ok('자동 연출에 장면 카드 안 뜸', await page.evaluate(() => getComputedStyle($('sceneHome')).display) === 'none');
  await page.click('.thumb[data-i="0"]'); await page.waitForTimeout(400);
  ok('썸네일 → 직접 만들기 장면 설정', (await page.evaluate(() => [PANE, $('sceneCard').parentNode.id, S.sel])).join(',') === 'build,stack,0');

  // 5) 연출 방식
  await page.click('#newBtn'); await page.waitForTimeout(300);
  await page.click('#tabs button[data-p=quick]');
  await page.fill('#fProduct', '제주 한라봉'); await page.fill('#fListPrice', '39000'); await page.fill('#fRate', '30'); await page.fill('#fPoints', '당도 13브릭스\n산지직송');
  await page.click('#dirBtn'); await page.waitForTimeout(500);
  const r1 = await page.evaluate(() => [THEMES[S.theme].name, S.scenes.map(s => s.type + (s.opts.가격모션 ? '↓' : '')).join(',')]);
  ok('상품 소개형 + 정가 있으면 내려가기', r1[1].includes('price↓'), r1.join(' | '));
  await page.screenshot({ path: out + '/v8_quick.png' });
  await page.click('#recipeSeg button[data-v=typo]'); await page.click('#dirBtn'); await page.waitForTimeout(500);
  const r2 = await page.evaluate(() => [S.fmt, S.scenes.filter(s => s.type === 'typo').length, S.scenes.length]);
  ok('타이포 강조형 = 하드필러 형식 + 타이포 위주', r2[0] === '하드필러' && r2[1] >= r2[2] / 2, r2.join(','));
  await page.click('#recipeSeg button[data-v=product]');

  // 6) 스타일 자동: 상품명 키워드 → 테마, 키워드 없으면 상품 이미지 색
  await page.fill('#fProduct', '무선 청소기');
  await page.click('#ddStyle .ddBtn'); await page.waitForTimeout(200); await page.click('#ddStyle .ddItem[data-v=""]'); await page.waitForTimeout(400);
  ok('자동: 청소기 → 테크 블루프린트', await page.evaluate(() => S.theme) === 'tech');
  await page.fill('#fProduct', '알뜰 세트'); await page.fill('#fPoints', '');
  await page.setInputFiles('#imgFile', 'test/product.png'); await page.waitForTimeout(500);
  await page.click('#ddStyle .ddBtn'); await page.waitForTimeout(200); await page.click('#ddStyle .ddItem[data-v=""]'); await page.waitForTimeout(400);
  ok('자동: 키워드 없으면 이미지 색', await page.evaluate(() => S.theme) === 'key', await page.evaluate(() => S.theme + ' ' + S.key));
  await page.click('#ddTheme .ddBtn'); await page.waitForTimeout(200); await page.click('#ddTheme .ddItem[data-v=ocean]'); await page.waitForTimeout(300);
  await page.click('#dirBtn'); await page.waitForTimeout(400);
  ok('고른 테마는 자동 연출해도 유지', (await page.evaluate(() => [S.theme, $('fTheme').value])).join(',') === 'ocean,theme');

  // 7) 옛 형식: 인서트 대본은 하드필러로 열림
  await page.evaluate(() => setText('형식: 인서트 / 길이: 6\n[타이포] *최저가*'));
  await page.waitForTimeout(300);
  ok('형식: 인서트 → 하드필러', await page.evaluate(() => [S.fmt, S.errors.length].join(',')) === '하드필러,0');

  // 8) 새 테마 9종 렌더
  const ids = ['mono', 'sunset', 'citrus', 'natural', 'ocean', 'candy', 'tech', 'hanga', 'news'];
  const sheet = await page.evaluate(async ids => {
    const rows = [];
    for (const id of ids) {
      if (!THEMES[id]) { rows.push(null); continue; }
      const txt = `형식: 하드필러 / 테마: ${THEMES[id].name} / 길이: 9 / L바: 기본\n[훅] 오직 이 방송에서만 / *특별한 찬스* {배경: 1}\n[가격] 단, / 39,900원 {배경: 2, 정가: 59,000원, 할인: 32%, 가격모션: 내려가기}\n[포인트] 이래서 *잘 팔려요* / 흡수 빠름 / 끈적임 없음 {배경: 3}`;
      await loadFontsFor(txt); await document.fonts.ready;
      const P = projFromText(txt); setStage('wide'); const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const g = c.getContext('2d');
      const row = []; for (const sc of P.scenes) { renderFrame(g, P, sc.start + sc.dur * .85, { showLbar: true }); const s = document.createElement('canvas'); s.width = 480; s.height = 270; s.getContext('2d').drawImage(c, 0, 0, 480, 270); row.push(s.toDataURL('image/jpeg', .85)); }
      rows.push({ name: THEMES[id].name, row });
    }
    return rows;
  }, ids);
  ok('새 테마 9종', sheet.every(Boolean), sheet.filter(Boolean).map(r => r.name).join(', '));
  const p2 = await b.newPage({ viewport: { width: 1340, height: 900 } });
  await p2.setContent('<body style="margin:0;background:#1d1f24;font:600 15px sans-serif;color:#fff">' + sheet.filter(Boolean).map(d => `<div style="display:flex;gap:6px;align-items:center;margin:6px"><div style="width:120px">${d.name}</div>${d.row.map(u => `<img src="${u}" width="396">`).join('')}</div>`).join('') + '</body>');
  await p2.waitForTimeout(300); await p2.screenshot({ path: out + '/v8_themes.png', fullPage: true }); await p2.close();

  // 9) 통강조: 단서 + 내려가기, 화면 밖으로 안 나가는지
  await page.click('#fmtSeg button[data-v=통강조]'); await page.waitForTimeout(400);
  await page.evaluate(() => setText('형식: 통강조 / 테마: 여름 바다 / 길이: 8 / 머리: 쿨링 이불 / 꼬리: 앱 주문 시 | *3천원 적립* / 단서: 냉감 기준 | 자사 시험 Q-max 0.2\n[배지] 방송 / *단독*\n[가격] 단, / 39,900원 {정가: 59,000원, 할인: 32%, 가격모션: 내려가기}'));
  await page.waitForTimeout(500); await page.evaluate(() => { S.t = 7.5; S.dirty = true; }); await page.waitForTimeout(200);
  await page.waitForFunction(() => $('warns').textContent.trim().length > 0, null, { timeout: 5000 }).catch(() => {}); const tw = await page.evaluate(() => $('warns').textContent); ok('통강조 단서·내려가기 경고 없음', /잘 들어가/.test(tw), tw);
  await page.locator('#cv').screenshot({ path: out + '/v8_tong.png' });

  console.log('errors', errs);
  await b.close();
  if (errs.length) process.exit(1);
})();
