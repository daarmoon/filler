// v9 확인: 이름·로고(필러메이커스), 좁은 화면에서도 3칸 유지 + 칸 너비 드래그, 테마 목록 묶음,
// 단서 자막 배경 끄기, 전체 효과 위치·속도·반복, 통강조 전용 화면 + 임팩트 모션, 자동 연출 단순화
// node test/ui10.js [저장 폴더]   (DPR=2 로 고해상도 스크린샷)
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const out = process.argv[2] || 'test/v9'; fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const dpr = +(process.env.DPR || 1);
  const page = await b.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: dpr });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const sb = async n => (await page.inputValue('#sb')).split('\n')[n];
  const ok = (name, cond, extra) => { console.log((cond ? 'OK  ' : 'FAIL') + ' ' + name + (extra !== undefined ? ' | ' + extra : '')); if (!cond) errs.push('FAIL ' + name); };
  await page.goto('file://' + path.resolve('dist/hardfiller-maker.html')); await page.waitForTimeout(1500);

  // 4) 이름·로고
  ok('제목 필러메이커스', (await page.title()) === '필러메이커스');
  ok('헤더 이름', (await page.textContent('.brand h1')).trim() === '필러메이커스');
  ok('로고 이미지', await page.evaluate(() => { const i = $('brandMark'); return i.complete && i.naturalWidth > 0 && i.src.startsWith('data:image/png'); }));
  ok('파비콘', await page.evaluate(() => (document.querySelector('link[rel=icon]') || {}).href || '').then(h => h.startsWith('data:image/png')));

  // 2) 1280×800에서도 3칸 + 드래그로 너비 조절
  const cols = async () => page.evaluate(() => [...document.querySelectorAll('main > section')].map(s => Math.round(s.getBoundingClientRect().width)));
  const c0 = await cols(); ok('1280에서 3칸', c0.length === 3 && c0.every(w => w >= 250), c0.join('/'));
  ok('가로 스크롤 없음', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const sp = await page.locator('#splitL').boundingBox();
  await page.mouse.move(sp.x + sp.width / 2, sp.y + 200); await page.mouse.down(); await page.mouse.move(sp.x + sp.width / 2 + 60, sp.y + 200, { steps: 5 }); await page.mouse.up();
  const c1 = await cols(); ok('왼쪽 칸 드래그로 넓힘', c1[0] - c0[0] >= 50, c0[0] + '→' + c1[0]);
  ok('칸 너비 기억', await page.evaluate(() => !!localStorage.getItem('hfm.cols')));
  await page.dblclick('#splitL'); await page.waitForTimeout(100);
  const c2 = await cols(); ok('두 번 누르면 처음 너비', Math.abs(c2[0] - c0[0]) <= 2, c2[0]);
  await page.setViewportSize({ width: 1100, height: 700 }); await page.waitForTimeout(200);
  const c3 = await cols(); ok('1100에서도 3칸', c3.every(w => w >= 250) && c3[1] >= 360, c3.join('/'));
  await page.setViewportSize({ width: 1280, height: 800 }); await page.waitForTimeout(200);

  // 1) 테마 목록: 묶음 + 두 칸 같은 너비 + 이름 안 잘림
  await page.click('#ddTheme .ddBtn'); await page.waitForTimeout(300);
  const th = await page.evaluate(() => {
    const items = [...document.querySelectorAll('#ddTheme .ddPanel .ddItem')], groups = [...document.querySelectorAll('#ddTheme .ddPanel .ddGroup')];
    const ws = [...new Set(items.map(i => Math.round(i.getBoundingClientRect().width)))];
    const cut = items.filter(i => { const t = i.querySelector('.ddTxt b'); return t && t.scrollWidth > t.clientWidth + 1; }).length;
    return { n: items.length, g: groups.length, ws, cut };
  });
  ok('테마 묶음', th.g >= 5, th.g + '묶음 · ' + th.n + '개');
  ok('테마 칸 너비 같음', th.ws.length === 1, th.ws.join(','));
  ok('테마 이름 안 잘림', th.cut === 0, th.cut);
  await page.locator('#ddTheme .ddPanel').screenshot({ path: out + '/v9_theme_list.png' });
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);

  // 7) 자동 연출: 꼭 필요한 칸만 먼저
  await page.click('#tabs button[data-p=quick]'); await page.waitForTimeout(200);
  const vis = async id => page.isVisible('#' + id);
  ok('상품명·특징·가격 보임', (await vis('fProduct')) && (await vis('fPoints')) && (await vis('fListPrice')) && (await vis('fPrice')));
  ok('세부 칸은 더 넣기에', !(await vis('fHook')) && !(await vis('fUnit')) && !(await vis('fPriceNote')) && !(await vis('fDan')));
  await page.screenshot({ path: out + '/v9_quick.png' });
  await page.click('#tabs button[data-p=build]'); await page.waitForTimeout(200);

  // 5) 단서 자막 배경 끄기
  await page.evaluate(() => setText('형식: 하드필러 / 테마: 여름 바다 / 길이: 12 / L바: 기본 / 단서: 가격 기준 | NS 정상가 대비, 모바일 할인 별도\n[타이포] 지금 이 방송 / *채널고정*\n[가격] 단, / 39,900원'));
  await page.waitForTimeout(400);
  await page.uncheck('#bDanBg'); await page.waitForTimeout(300);
  ok('단서배경 없음 기록', /단서배경: 없음/.test(await sb(0)), await sb(0));
  const rs = await page.evaluate(() => projFromText($('sb').value)); ok('단서배경 읽기', rs.danBg === false);
  await page.evaluate(() => { S.t = 1; S.dirty = true; }); await page.waitForTimeout(200);
  await page.locator('#cv').screenshot({ path: out + '/v9_dan_nobg.png' });
  await page.check('#bDanBg'); await page.waitForTimeout(300);
  ok('단서배경 다시 켜기', !/단서배경/.test(await sb(0)));

  // 6) 전체 효과 위치·속도·반복
  await page.evaluate(() => setText('형식: 하드필러 / 테마: 여름 바다 / 길이: 12 / 효과: 꽃잎(위, 2배, 2번)+스캔라인\n[타이포] 지금 이 방송 / *채널고정*\n[가격] 단, / 39,900원'));
  await page.waitForTimeout(400);
  const fo = await page.evaluate(() => [S.fx.join('+'), JSON.stringify(S.fxOpt)]);
  ok('효과 옵션 읽기', fo[0] === '꽃잎+스캔라인' && /"pos":"위"/.test(fo[1]) && /"speed":2/.test(fo[1]) && /"rep":2/.test(fo[1]), fo.join(' '));
  ok('효과 옵션 줄', (await page.$$('#fxOpts .fxRow')).length === 2);
  await page.selectOption('#fxOpts .fxRow[data-f=스캔라인] select[data-o=pos]', '아래'); await page.waitForTimeout(300);
  ok('효과 위치 바꾸기', /스캔라인\(아래\)/.test(await sb(0)), await sb(0));
  await page.selectOption('#fxOpts .fxRow[data-f=꽃잎] select[data-o=rep]', '0'); await page.waitForTimeout(300);
  ok('반복 계속', /꽃잎\(위, 2배\)/.test(await sb(0)), await sb(0));
  for (const t of [1, 5, 9]) { await page.evaluate(t => { S.t = t; S.dirty = true; }, t); await page.waitForTimeout(120); }
  await page.locator('.col').last().screenshot({ path: out + '/v9_fx_opts.png' });

  // 3) 새 임팩트 모션: 모두 오류 없이 그려지고 글자가 보임
  const mres = await page.evaluate(() => {
    const res = []; const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const ctx = c.getContext('2d');
    for (const m of IMPACT_MOTIONS) {
      const p = projFromText(`형식: 하드필러 / 테마: NS 레드 / 길이: 6 / 효과: 없음\n[타이포] *특가* 찬스 {모션: ${m}}`);
      let lit = 0;
      try { for (const t of [0.1, 0.4, 0.9, 2.5]) renderFrame(ctx, p, t, {}); lit = 1; } catch (e) { res.push(m + ':' + e.message); continue; }
      if (!lit) res.push(m + ':blank');
    }
    return res;
  });
  ok('임팩트 모션 ' + (await page.evaluate(() => IMPACT_MOTIONS.length)) + '종 그리기', mres.length === 0, mres.join(','));
  ok('스토리보드 모션 이름', await page.evaluate(() => ['쾅', '펀치', '지진', '흔들기', '두근', '번쩍', '젤리', '고무줄', '슬롯', '흩어모으기', '회오리', '쓸기', '깜빡'].every(k => MOTIONS[k])));

  // 3) 통강조 전용 화면
  await page.click('#fmtSeg button[data-v=통강조]'); await page.waitForTimeout(500);
  const tabs = await page.evaluate(() => [...document.querySelectorAll('#tabs button')].filter(b => b.offsetParent).map(b => b.dataset.p).join(','));
  ok('통강조 탭', tabs === 'tong,board,src', tabs);
  ok('통강조 화면 열림', await page.isVisible('#pane-tong'));
  const wrap = await page.locator('#canvasWrap').boundingBox(); ok('통강조 세로 비율', Math.abs(wrap.width / wrap.height - 376 / 790) < 0.03, (wrap.width / wrap.height).toFixed(3));
  await page.fill('#tqProduct', '쿨링 이불'); await page.fill('#tqPrice', '39900'); await page.fill('#tqList', '59000');
  await page.click('#tqGo'); await page.waitForTimeout(600);
  const n = await page.$$eval('#tScenes .tScene', c => c.length); ok('자동으로 채우기 → 장면 카드', n >= 2, n);
  const allImpact = await page.evaluate(() => { const p = projFromText($('sb').value); return p.scenes.filter(s => s.type !== 'list').every(s => IMPACT_MOTIONS.includes(s.opts.모션) || ['블러', '팝', '드롭', '스탬프', '슬라이드'].includes(s.opts.모션)); });
  ok('자동 채우기 장면에 모션', allImpact);
  await page.click('#tScenes .tScene[data-i="0"] [data-mtoggle]'); await page.waitForTimeout(500);
  ok('모션 고르기 열림', (await page.$$('#tScenes .mCard')).length >= 13);
  await page.screenshot({ path: out + '/v9_tong_motions.png' });
  await page.click('#tScenes .mCard[data-pick=쾅]'); await page.waitForTimeout(400);
  ok('쾅 고르기', /모션: 쾅/.test(await sb(1)), await sb(1));
  await page.click('#tScenes .tScene[data-i="1"] .tKinds button[data-kind="price↓"]'); await page.waitForTimeout(300);
  ok('할인가로 바꾸기', /가격모션: 내려가기/.test(await sb(2)), await sb(2));
  await page.fill('#tScenes .tScene[data-i="0"] textarea', '오늘만\n*반값*'); await page.waitForTimeout(500);
  ok('문구 바로 반영', /오늘만 \/ \*반값\*/.test(await sb(1)), await sb(1));
  await page.fill('#tHead', '여름 필수템'); await page.waitForTimeout(500);
  ok('위 띠', /머리: 여름 필수템/.test(await sb(0)), await sb(0));
  await page.fill('#tDan', '냉감 기준 | 자사 시험'); await page.press('#tDan', 'Tab'); await page.uncheck('#tDanBg'); await page.waitForTimeout(400);
  ok('통강조 단서 배경 끄기', /단서배경: 없음/.test(await sb(0)), await sb(0));
  await page.evaluate(() => { S.t = 0.3; S.dirty = true; }); await page.waitForTimeout(200);
  await page.screenshot({ path: out + '/v9_tong.png' });
  for (const t of [0.15, 0.3, 0.6, 1.5, 5]) { await page.evaluate(t => { S.t = t; S.dirty = true; }, t); await page.waitForTimeout(120); await page.locator('#cv').screenshot({ path: out + `/v9_tong_${t}.png` }); }

  // 형식을 하드필러로 돌리면 직접 만들기로
  await page.click('#fmtSeg button[data-v=하드필러]'); await page.waitForTimeout(500);
  ok('하드필러로 돌아가면 직접 만들기', await page.isVisible('#pane-build'));
  await page.screenshot({ path: out + '/v9_build.png' });

  console.log('errors', errs);
  await b.close();
  if (errs.length) process.exit(1);
})();
