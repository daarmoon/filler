// v10 확인: AI 스토리보드(메인 탭) 문법·의성어·규칙 3안·AI 3안(가짜 서버)·장면별 다시·👍 스타일 노트·심의 체크,
// 상품 폴더(사진+영상) 연결·영상 배경 렌더·영상 들어간 내보내기, 트렌드 노트, 납품 검수, API 키 보관
// node test/ui11.js [저장 폴더]   (DPR=2 로 고해상도 스크린샷)
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs'); const os = require('os'); const { execFileSync } = require('child_process');
(async () => {
  const out = process.argv[2] || 'test/v10'; fs.mkdirSync(out, { recursive: true });
  // 테스트 영상: 크로미움(Playwright)은 H.264가 없어서 VP9 webm
  let vidB64 = '';
  try { const f = path.join(os.tmpdir(), 'hfm_test_vid.webm'); if (!fs.existsSync(f)) execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30', '-t', '4', '-c:v', 'libvpx-vp9', '-b:v', '400k', '-pix_fmt', 'yuv420p', f]); vidB64 = fs.readFileSync(f).toString('base64'); } catch (e) { console.log('ffmpeg 없음: 영상 확인은 건너뜀'); }
  const imgB64 = fs.readFileSync('test/product.png').toString('base64');
  const b = await chromium.launch(); const dpr = +(process.env.DPR || 1);
  const page = await b.newPage({ viewport: { width: 1500, height: 940 }, deviceScaleFactor: dpr });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const ok = (name, cond, extra) => { console.log((cond ? 'OK  ' : 'FAIL') + ' ' + name + (extra !== undefined ? ' | ' + extra : '')); if (!cond) errs.push('FAIL ' + name); };
  // 트렌드 노트 (GitHub raw) 가짜
  const TRENDS = { updated: '2026-11-27T06:17:00Z', items: [
    { id: 't1', pattern: '숫자 하나만 화면 가득, 쾅 하고 멈춤', example: '단 하루 반값', tags: ['가격', '임팩트'], source: 'TVCF', url: 'https://tvcf.co.kr/' },
    { id: 't2', pattern: '짧은 단어를 리듬 있게 끊어 보여주기', example: '시원·가볍게·산뜻', tags: ['타이포'], source: 'Prompt Motion', url: 'https://prompt-motion.com/' },
    { id: 't3', pattern: '차가운 블루 톤과 반짝이는 하이라이트', example: '', tags: ['색감'], source: 'TVCF', url: 'https://tvcf.co.kr/' }],
    sources: [{ name: 'TVCF', url: 'https://tvcf.co.kr/', ok: true }, { name: 'Prompt Motion', url: 'https://prompt-motion.com/', ok: false, reason: 'robots.txt가 막아 둠' }] };
  await page.route('https://raw.githubusercontent.com/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TRENDS) }));
  // Claude API 가짜 서버: 3안 / 장면 하나 다시
  const reqs = [];
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST, OPTIONS' };
  await page.route('https://api.anthropic.com/**', async r => {
    if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
    const body = JSON.parse(r.request().postData()); reqs.push({ body, headers: r.request().headers() });
    const redo = !!body.output_config.format.schema.properties.line;
    const out = redo ? { line: '[강조] 냉감 원단 / *Q-max 0.4* {모션: 지진, 전환: 글리치, 효과: 집중선}', why: '앞뒤와 다르게 화면을 흔들어 수치를 강조' }
      : { versions: [
        { name: '얼음 임팩트', concept: '차가운 블루 톤에 숫자를 쾅 박는 안', storyboard: '형식: 하드필러 / 테마: 겨울 블루 / 길이: 20\n[타이포] 오늘 밤부터 / *시원하게* {모션: 쓸기, 전환: 밀기, 영상: 사용영상}\n[상품] *쿨링 이불* {이미지: 상품정면, 모션: 슬라이드}\n[강조] *Q-max 0.4* {모션: 쾅}\n[가격] 단, / 39,900원 {정가: 59,000원, 할인: 32%, 가격모션: 내려가기, 모션: 펀치}' },
        { name: '리듬 타이포', concept: '짧게 끊어 리듬감 있게', storyboard: '```\n형식: 하드필러 / 테마: NS 레드 / 길이: 20\n[타이포] 오늘 밤부터 / *시원하게* {스타일: 쌓기}\n[가격] 단, / 39,900원\n```' },
        { name: '고장난 안', concept: '읽을 수 없는 결과', storyboard: '그냥 글' }] };
    await r.fulfill({ status: 200, headers: Object.assign({ 'content-type': 'application/json' }, cors), body: JSON.stringify({ id: 'msg_test', type: 'message', role: 'assistant', model: body.model, stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(out) }], usage: { input_tokens: 10, output_tokens: 10 } }) });
  });
  await page.goto('file://' + path.resolve('dist/hardfiller-maker.html')); await page.waitForTimeout(1500);

  // 1) 첫 화면 = AI 스토리보드 탭 (맨 위 한 줄 전체)
  ok('첫 화면 AI 스토리보드', await page.evaluate(() => document.querySelector('.pane.on').id === 'pane-ai' && PANE === 'ai'));
  const tabs = await page.evaluate(() => { const bs = [...document.querySelectorAll('#tabs button')].filter(x => x.offsetParent); const r0 = bs[0].getBoundingClientRect(), r1 = bs[1].getBoundingClientRect(); return { ids: bs.map(x => x.dataset.p).join(','), full: r1.top > r0.bottom - 2 && r0.width > r1.width * 2 }; });
  ok('탭 순서', tabs.ids === 'ai,build,quick,board,src', tabs.ids);
  ok('AI 탭이 한 줄 전체', tabs.full);
  ok('키 없으면 규칙 연출 표시', (await page.textContent('#aiMode')).includes('규칙'));
  ok('트렌드 노트 받아 옴', (await page.textContent('#trendWhen')).includes('3개'), await page.textContent('#trendWhen'));

  // 2) 문법
  const g = await page.evaluate(() => parseAiBoard('상품: 쿨링 이불 / 정가: 59,000원 / 가격: 39,900원 / 형식: 하드필러 15초\n# 시원하게\n오늘 밤부터 / [시원하게] (휙)\n@사용영상 냉감 원단 [Q-max 0.4] (쾅쾅) ※ 냉감 | 자사 시험\n단, [39,900원] (두둥, 반짝)\n추가 혜택 (모바일 10% 할인 시)\n신상 (휘리리릭)\n이상한 (뿌잉)\n※ 전체 단서 | 내용'));
  ok('정보 줄', g.info.product === '쿨링 이불' && g.info.list === '59,000원' && g.info.price === '39,900원' && g.info.fmt === '하드필러' && g.info.dur === '15', JSON.stringify(g.info));
  ok('# 요청 · ※ 단서', g.req[0] === '시원하게' && g.dan === '전체 단서 | 내용');
  ok('/ 줄바꿈 · [ ] 강조', JSON.stringify(g.beats[0].lines) === '["오늘 밤부터","*시원하게*"]', JSON.stringify(g.beats[0].lines));
  ok('( ) 의성어 → 모션·전환', g.beats[0].ono[0].모션 === '쓸기' && g.beats[0].ono[0].전환 === '밀기');
  ok('쾅쾅 → 쾅, @소스, 줄 끝 ※', g.beats[1].ono[0].모션 === '쾅' && g.beats[1].src === '사용영상' && g.beats[1].dan === '냉감 | 자사 시험');
  ok('의성어 여러 개', g.beats[2].ono.length === 2 && g.beats[2].ono[1].효과 === '반짝이');
  ok('의성어 아닌 괄호는 글자로', g.beats[3].lines[0].includes('(모바일 10% 할인 시)'), g.beats[3].lines[0]);
  ok('비슷한 의성어 (휘리리릭→휘리릭/회오리)', g.beats[4].ono[0] && g.beats[4].ono[0].모션 === '회오리', JSON.stringify(g.beats[4].ono));
  ok('모르는 의성어는 AI 판단으로', g.unknownOno.includes('뿌잉'), g.unknownOno.join(','));

  // 3) 칩: 의성어·강조·단서 넣기
  await page.fill('#aiBoard', '오늘 밤부터 시원하게');
  await page.evaluate(() => { const t = $('aiBoard'); t.setSelectionRange(7, 11); });
  await page.click('#boardTools [data-ins="[]"]');
  await page.click('#onoChips [data-ono="휙"]');
  await page.click('#boardTools [data-ins="※ "]'); await page.keyboard.type('냉감 | 자사 시험');
  const typed = await page.inputValue('#aiBoard');
  ok('칩으로 [ ]·(휙)·※ 넣기', typed === '오늘 밤부터 [시원하게] (휙)\n※ 냉감 | 자사 시험', JSON.stringify(typed));
  await page.waitForTimeout(400); ok('쓴 글 기억', await page.evaluate(() => localStorage.getItem('hfm.board').includes('(휙)')));

  // 4) 규칙으로 바로 3안
  await page.fill('#aiBoard', ''); await page.click('#boardSample'); await page.waitForTimeout(300);
  await page.click('#boardRule'); await page.waitForTimeout(1500);
  const vers = await page.$$eval('.bver b', a => a.map(x => x.textContent));
  ok('규칙 3안', vers.length === 3, vers.join(' / '));
  let sbText = await page.inputValue('#sb');
  ok('1안 적용 · 의성어 반영', /\[타이포\] 오늘 밤부터 \/ \*시원하게\* \{모션: 쓸기, 전환: 밀기/.test(sbText) && /\{모션: 쾅/.test(sbText), sbText.split('\n')[1]);
  ok('정가→가격 내려가기', /\[가격\] 단, \/ 39,900원 \{.*정가: 59,000원, 할인: 32%, 가격모션: 내려가기/.test(sbText));
  ok('※ 단서 → 설정 줄 단서', /단서: 냉감 기준 \| 자사 시험 결과/.test(sbText.split('\n')[0]));
  ok('장면 목록', (await page.$$('.bsc')).length === await page.evaluate(() => S.scenes.length));
  ok('3안 썸네일', await page.evaluate(() => [...document.querySelectorAll('.bver canvas')].every(c => { const d = c.getContext('2d').getImageData(c.width / 2, c.height / 2, 1, 1).data; return d[3] > 0; })));
  await page.click('[data-use="1"]'); await page.waitForTimeout(500);
  const sb2 = await page.inputValue('#sb');
  ok('2안 쓰기 → 느낌·테마 바뀜', sb2 !== sbText && /느낌: 강하게/.test(sb2), sb2.split('\n')[0]);
  ok('되돌리기 가능', await page.evaluate(() => S.hist.length > 0));
  // 장면별 다시 (규칙)
  const before = (await page.inputValue('#sb')).split('\n')[2];
  await page.click('[data-redo="1"]'); await page.waitForTimeout(300);
  const after = (await page.inputValue('#sb')).split('\n')[2];
  ok('이 장면만 다시 (규칙)', before !== after && after.includes('냉감 원단'), after);
  ok('다른 장면은 그대로', (await page.inputValue('#sb')).split('\n')[1] === sb2.split('\n')[1]);
  // 👍
  await page.click('[data-like="1"]'); await page.waitForTimeout(200);
  ok('👍 → 내 스타일 노트', (await page.textContent('#prefCount')) === '1개' && await page.evaluate(() => getPrefs()[0].kind === 'like'));
  await page.evaluate(() => { $('boardOut').scrollIntoView(); }); await page.screenshot({ path: out + '/v10_rule3.png' });

  // 5) 심의 표현 체크 + 단서 넣기
  await page.fill('#aiBoard', '[국내 최저가] (쾅)\n단, [19,900원]'); await page.click('#boardRule'); await page.waitForTimeout(800);
  ok('심의 표현 알림', !(await page.$eval('#riskBox', e => e.hidden)) && (await page.textContent('#riskBox')).includes('최저가'));
  ok('39,900원의 0원은 무료로 안 봄', !(await page.textContent('#riskBox')).includes('무료'));
  await page.click('#riskBox [data-dan]'); await page.waitForTimeout(300);
  ok('단서 넣기', /단서: 최저가 기준/.test((await page.inputValue('#sb')).split('\n')[0]));

  // 6) 상품 폴더 (가짜 폴더: 사진 2 + 영상 1 + 메모)
  await page.evaluate(({ img, vid }) => {
    const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
    const fe = f => ({ kind: 'file', getFile: async () => f });
    const files = [new File([b64(img)], '상품 정면.png', { type: 'image/png' }), new File(['메모'], 'memo.txt', { type: 'text/plain' })];
    if (vid) files.push(new File([b64(vid)], '사용 영상.webm', { type: 'video/webm' }));
    const sub = { kind: 'directory', name: '컷', async *entries() { yield ['디테일.png', fe(new File([b64(img)], '디테일.png', { type: 'image/png' }))]; } };
    const h = { kind: 'directory', name: '쿨링이불_소스', async *entries() { for (const f of files) yield [f.name, fe(f)]; yield ['컷', sub]; }, queryPermission: async () => 'granted', requestPermission: async () => 'granted' };
    window.showDirectoryPicker = async () => h;
  }, { img: imgB64, vid: vidB64 });
  await page.click('#folderPick'); await page.waitForFunction(() => !FOLDER.busy && FOLDER.count > 0, null, { timeout: 30000 });
  const fa = await page.evaluate(() => Object.entries(S.assets).filter(([, a]) => a.folder).map(([n, a]) => n + (a.video ? ':v' + a.dur.toFixed(0) : '')));
  ok('폴더 사진·영상 읽기 (txt 제외, 하위 폴더 포함)', fa.includes('상품정면') && fa.includes('디테일') && (!vidB64 || fa.includes('사용영상:v4')), fa.join(','));
  ok('폴더 카드 칩', (await page.$$('#folderInfo .srcChip')).length === fa.length);
  await page.fill('#aiBoard', ''); await page.click('#folderInfo .srcChip');
  ok('칩 → @이름', (await page.inputValue('#aiBoard')).startsWith('@'));
  ok('폴더 소스는 브라우저에 따로 저장 안 함', await page.evaluate(async () => { await new Promise(r => setTimeout(r, 1200)); const a = await IDB.get('assets'); return !a || !Object.keys(a).some(k => ['상품정면', '디테일', '사용영상'].includes(k)); }));
  ok('AI에게 보낼 썸네일', await page.evaluate(() => { const s = sourcesForAI(); return s.length >= 2 && s.every(x => x.thumb.length > 100) && (!S.assets.사용영상 || s.find(x => x.name === '사용영상').video); }));

  // 7) AI 3안 (가짜 서버)
  await page.fill('#aiBoard', '상품: 쿨링 이불 / 정가: 59,000원 / 가격: 39,900원\n# 차갑고 깔끔하게\n오늘 밤부터 / [시원하게] (휙)\n@사용영상 냉감 원단 [Q-max 0.4] (쾅)\n단, [39,900원] (두둥)\n※ 냉감 기준 | 자사 시험 결과');
  await page.waitForTimeout(500);
  await page.evaluate(() => { const s = new Set(['t3']); localStorage.setItem('hfm.trendPin', JSON.stringify([...s])); localStorage.setItem('hfm.trendOff', JSON.stringify(['t2'])); renderTrends(); });
  await page.click('#boardAI'); await page.waitForTimeout(300);
  ok('키 없이 AI 누르면 키 칸 열림', await page.evaluate(() => $('aiKeyBox').open && $('boardMsg').textContent.includes('API 키')));
  await page.fill('#aiKey', 'sk-ant-test-123'); await page.dispatchEvent('#aiKey', 'change'); await page.waitForTimeout(100);
  ok('키 저장 (웹: 이 브라우저)', await page.evaluate(() => localStorage.getItem('hfm.key') === 'sk-ant-test-123') && (await page.textContent('#aiMode')) === 'AI 연결됨');
  await page.click('#boardAI'); await page.waitForFunction(() => !BOARD.busy && BOARD.ai, null, { timeout: 15000 }); await page.waitForTimeout(600);
  const rq = reqs[0];
  ok('Claude 요청: 모델·헤더', rq && rq.body.model === 'claude-opus-5-5' && rq.headers['x-api-key'] === 'sk-ant-test-123' && rq.headers['anthropic-dangerous-direct-browser-access'] === 'true', rq && rq.body.model);
  const content = rq ? rq.body.messages[0].content : [];
  const txt = content.filter(c => c.type === 'text').map(c => c.text).join('\n');
  ok('요청에 소스 이미지', content.filter(c => c.type === 'image').length >= 2);
  ok('요청에 AI 스토리보드 글', txt.includes('@사용영상 냉감 원단 [Q-max 0.4] (쾅)'));
  ok('트렌드: 📌 먼저, 끈 것은 뺌', txt.indexOf('차가운 블루 톤') > -1 && txt.indexOf('차가운 블루 톤') < txt.indexOf('숫자 하나만') && !txt.includes('리듬 있게 끊어'));
  ok('👍 스타일 노트 반영', txt.includes('마음에 들어 한 안'));
  ok('시스템 프롬프트 캐시 · 문법 설명', rq.body.system[0].cache_control && rq.body.system[0].text.includes('의성어 사전'));
  const aiv = await page.$$eval('.bver b', a => a.map(x => x.textContent));
  ok('읽을 수 없는 안은 빼고 2안', aiv.length === 2 && aiv[0].includes('얼음 임팩트'), aiv.join(' / '));
  ok('연출 의도 표시', (await page.textContent('#boardVers')).includes('차가운 블루 톤에 숫자를 쾅'));
  sbText = await page.inputValue('#sb');
  ok('AI 1안 적용 + 빠진 단서 채움', sbText.includes('{모션: 쓸기, 전환: 밀기, 영상: 사용영상}') && /단서: 냉감 기준/.test(sbText.split('\n')[0]), sbText.split('\n')[0]);
  await page.click('[data-use="1"]'); await page.waitForTimeout(300);
  ok('``` 감싼 답도 읽음', (await page.inputValue('#sb')).startsWith('형식: 하드필러') && !(await page.inputValue('#sb')).includes('```'));
  await page.click('[data-use="0"]'); await page.waitForTimeout(300);
  await page.click('[data-redo="2"]'); await page.waitForFunction(() => document.querySelector('[data-redo="2"]') && !document.querySelector('[data-redo="2"]').disabled, null, { timeout: 10000 }); await page.waitForTimeout(300);
  const redoReq = reqs[reqs.length - 1];
  ok('AI 장면 다시: 3번째 장면만', redoReq.body.messages[0].content.some(c => c.type === 'text' && c.text.includes('3번째 장면')) && (await page.inputValue('#sb')).split('\n')[3].includes('모션: 지진'), (await page.inputValue('#sb')).split('\n')[3]);
  ok('AI가 다시 쓴 장면은 내가 고친 것으로 안 침', await page.evaluate(() => S.aiBase.text === $('sb').value));

  // 8) 영상 배경: 시점에 따라 그림이 바뀜 (내보내기와 같은 정확한 찾아가기)
  if (vidB64) {
    const vd = await page.evaluate(async () => {
      const P = proj(), sc = P.scenes[0]; setStage('wide'); const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
      const shot = async t => { await syncVideosExact(P, t); renderFrame(g, P, t, { hints: false }); return g.getImageData(0, 0, W, H).data; };
      const a = await shot(sc.start + .2), b2 = await shot(sc.start + 1.4);
      let diff = 0; for (let i = 0; i < a.length; i += 4 * 97) diff += Math.abs(a[i] - b2[i]); return { has: S.hasVideo, diff };
    });
    ok('영상 소스가 들어간 장면 감지', vd.has);
    ok('영상 배경이 시간에 따라 움직임', vd.diff > 2000, vd.diff);
    await page.click('#playBtn'); await page.waitForTimeout(900); await page.click('#playBtn');
    ok('미리보기 재생 중 영상도 재생', await page.evaluate(() => S.assets.사용영상.video.currentTime > .3), await page.evaluate(() => S.assets.사용영상.video.currentTime));
    // 짧게 내보내 보기 (영상 소스 포함, 3초 통강조)
    const ex = await page.evaluate(async () => {
      const p = projFromText('형식: 통강조 / 길이: 3\n[타이포] *시원하게* {영상: 사용영상, 모션: 쾅}'); p.assets = S.assets;
      const t0 = performance.now(); const r = await exportVideo(p, { fps: 29.97, withLbar: false, audio: false, cancel: () => false }, () => { });
      return { size: r.blob.size, sec: (performance.now() - t0) / 1000 };
    });
    ok('영상 소스 넣고 내보내기', ex.size > 10000, `${(ex.size / 1024).toFixed(0)}KB, ${ex.sec.toFixed(1)}초`);
  }

  // 9) 트렌드 노트 화면
  await page.click('#trendBox summary'); await page.waitForTimeout(200);
  ok('트렌드 노트 목록 · 출처 상태', (await page.$$('#trendList .trend')).length === 3 && (await page.textContent('#trendList')).includes('robots.txt가 막아 둠'));
  ok('끈 노트는 흐리게', await page.$eval('#trendList .trend:nth-child(2)', e => e.classList.contains('off')));
  await page.click('#prefBox summary');
  await page.evaluate(() => $('trendBox').scrollIntoView()); await page.screenshot({ path: out + '/v10_trends.png' });

  // 10) 납품 검수 (내보내기 창)
  await page.evaluate(() => setText('형식: 하드필러 / 길이: 20\n[타이포] 아주아주아주아주 길고 길어서 화면을 넘어가는 문구를 일부러 이렇게 길게 써 봅니다 정말로 길게\n[가격] 국내 최저가 / 39,900원'));
  // 이 툴은 글자를 자리에 맞춰 줄이므로 실제로 걸리는 경우가 드묾 → 걸린 것으로 흉내 내서 장면마다 확인하는지 봄
  await page.evaluate(() => { window.__fv = findViolations; findViolations = () => [{ label: 'x', why: '안전영역 밖' }]; });
  await page.click('#exportBtn'); await page.waitForTimeout(800);
  await page.evaluate(() => { findViolations = window.__fv; });
  const chk = await page.textContent('#expCheck');
  ok('납품 검수: 길이', chk.includes('길이 20.0초'));
  ok('납품 검수: 장면마다 L바·안전영역', /1·2번 장면 글자가 L바/.test(chk), chk);
  ok('납품 검수: 단서 없는 심의 표현', chk.includes('최저가') && chk.includes('단서 자막이 없어요'));
  await page.click('#expCancel'); await page.click('#exportBtn'); await page.waitForTimeout(800); // 흉내 낸 것 없이 다시 열어 스크린샷
  await page.screenshot({ path: out + '/v10_check.png' });
  await page.click('#expCancel');

  // 11) 통강조에서도 AI 스토리보드 (장면 3개까지)
  await page.click('#fmtSeg [data-v="통강조"]'); await page.waitForTimeout(400);
  await page.evaluate(() => showPane('ai'));
  await page.fill('#aiBoard', '상품: 크림 / 가격: 19,900원\n[대박] (쾅)\n촉촉 / [보습] (스르르)\n지금 [19,900원]\n오늘만 마감 (펑)');
  await page.click('#boardRule'); await page.waitForTimeout(1200);
  ok('통강조 AI 스토리보드 3장면 이내', await page.evaluate(() => S.fmt === '통강조' && S.scenes.length <= 3 && S.scenes.some(s => s.type === 'price')), await page.evaluate(() => S.scenes.map(s => s.type).join(',')));
  ok('통강조 썸네일 세로', await page.$eval('.bver canvas', c => c.height > c.width));

  // 첫 화면 스크린샷 (예시 넣은 상태)
  await page.click('#fmtSeg [data-v="하드필러"]'); await page.waitForTimeout(300); await page.evaluate(() => showPane('ai'));
  await page.fill('#aiBoard', ''); await page.click('#boardSample'); await page.click('#boardRule'); await page.waitForTimeout(1500);
  await page.evaluate(() => document.querySelector('main > section').scrollTop = 0); await page.screenshot({ path: out + '/v10_main.png' });

  ok('오류 없음', !errs.filter(e => !e.startsWith('FAIL')).length, errs.filter(e => !e.startsWith('FAIL')).join(' | '));
  console.log(errs.length ? 'errors ' + JSON.stringify(errs, null, 1) : 'ALL OK');
  await b.close(); process.exit(errs.length ? 1 : 0);
})();
