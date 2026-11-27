// ===== director.js : 간편 입력 → 스토리보드 자동 연출 (키 없이 규칙 기반) + Claude AI 연출 =====

// ===== 스타일 프리셋: 테마·폰트·모션·전환·효과·문구 톤을 한 번에 =====
const STYLES = {
  ns: { name: 'NS 브랜드 소프트', theme: 'ns', font: 'notoblack', feel: '부드럽게', motions: ['블러', '슬라이드', '팝', '웨이브'], trans: ['디졸브', '밀기'], fx: [], blockFx: { 가격: ['반짝이'] } },
  neon: { name: '네온 타임딜', theme: 'neon', font: 'dohyeon', feel: '보통', motions: ['네온', '글리치', '줌인', '네온'], trans: ['글리치', '플래시', '줌'], fx: ['스캔라인'], blockFx: { 가격: ['반짝이', '네온테두리'], 한정: ['글리치'], 강조: ['네온테두리'] },
    copy: { hookA: ['오늘 밤', '지금 이 순간', '타임딜 오픈'], hookB: ['*SPECIAL* 찬스', '*단 한 번* 특가', '*ON AIR* 혜택'], impact: ['초특가', '역대급', '단독가'] } },
  pop: { name: '팝아트 코믹', theme: 'popart', font: 'bagel', feel: '강하게', motions: ['바운스', '스탬프', '팝', '회전'], trans: ['와이프', '원형', '블라인드'], fx: [], blockFx: { 훅: ['집중선'], 강조: ['집중선', '별'], 가격: ['집중선', '별'], 한정: ['집중선'] }, impact: ['박스', '반복', '분리'],
    copy: { hookA: ['두둥!', '이건 사야 돼!', '와우!'], hookB: ['*대박* 찬스!', '*역대급* 등장!', '*난리났다!*'], impact: ['대박', '초특가', '완전득템'] } },
  luxe: { name: '블랙골드 럭셔리', theme: 'luxe', font: 'notoserif', feel: '부드럽게', motions: ['블러', '슬라이드', '타이핑', '블러'], trans: ['디졸브', '줌'], fx: ['금가루'], blockFx: { 가격: ['빛번짐'], 상품: ['렌즈플레어'] }, impact: ['기울임', '박스'], props: false,
    copy: { hookA: ['오직 당신을 위한', '품격이 다른', '프리미엄 컬렉션'], hookB: ['*특별한* 제안', '*단 하루* 혜택', '*완벽한* 선택'], impact: ['프리미엄', '한정판', '최상급'] } },
  y2k: { name: 'Y2K 홀로그램', theme: 'holo', font: 'gugi', feel: '보통', motions: ['웨이브', '플립', '팝', '바운스'], trans: ['밀기', '원형', '스핀'], fx: ['반짝이'], blockFx: { 가격: ['무지개빛'], 훅: ['무지개빛'] },
    copy: { hookA: ['요즘 핫한', '완전 갓성비', 'MZ 픽'], hookB: ['*인생템* 등장', '*핫딜* 오픈!', '*품절 각*'], impact: ['핫딜', '갓성비', '인생템'] } },
  aurora: { name: '오로라 글래스', theme: 'aurora', font: 'sunflower', feel: '부드럽게', motions: ['블러', '웨이브', '슬라이드', '플립'], trans: ['디졸브', '줌', '밀기'], fx: [], blockFx: { 가격: ['별'], 상품: ['빛번짐'] }, props: false },
  bf: { name: '블랙프라이데이', theme: 'blackfriday', font: 'gasoek', feel: '강하게', motions: ['스탬프', '글리치', '줌인', '스탬프'], trans: ['플래시', '글리치', '컷', '와이프'], fx: [], blockFx: { 가격: ['코인', '집중선'], 한정: ['글리치'], 강조: ['스포트라이트'] }, impact: ['박스', '분리', '반복'],
    copy: { hookA: ['1년에 단 한 번', '블랙프라이데이', '오늘만 이 가격'], hookB: ['*역대 최저가*', '*폭탄* 세일', '*최대 할인*'], impact: ['폭탄세일', '최저가', '파격가'] } },
  speed: { name: '스피드 다이내믹', theme: 'speed', font: 'blackhan', feel: '강하게', motions: ['슬라이드', '줌인', '드롭', '슬라이드'], trans: ['밀기', '와이프', '플래시'], fx: [], blockFx: { 훅: ['스피드라인'], 가격: ['스피드라인'], 한정: ['스피드라인'] }, impact: ['기울임', '박스'],
    copy: { hookA: ['빠르게 확인!', '서두르세요', '지금 바로'], hookB: ['*초스피드* 특가', '*광속* 품절 주의', '*긴급* 편성'], impact: ['초특가', '긴급특가', '선착순'] } },
  winter: { name: '윈터 홀리데이', theme: 'winter', font: 'jua', feel: '보통', motions: ['바운스', '팝', '웨이브', '드롭'], trans: ['디졸브', '원형', '블라인드'], fx: [], blockFx: { 가격: ['반짝이'], 혜택: ['리본'], 한정: ['풍선'] },
    copy: { hookA: ['연말 선물 고민 끝', '따뜻한 겨울', '홀리데이 특집'], hookB: ['*선물 같은* 가격', '*연말* 감사 특가', '*홀리데이* 찬스'], impact: ['연말특가', '선물세트', '감사특가'] } },
  ink: { name: '한지 붓글씨', theme: 'paper', font: 'dokdo', feel: '보통', motions: ['블러', '스탬프', '팝', '슬라이드'], trans: ['디졸브', '와이프'], fx: ['필름그레인'], blockFx: { 가격: ['비네팅'] }, impact: ['박스', '분리'], props: false,
    copy: { hookA: ['정성 가득', '전통 그대로', '명인이 만든'], hookB: ['*진심*을 담았다', '*명품* 그 맛', '*제철* 특가'], impact: ['명품', '진품', '산지직송'] } },
  spring: { name: '봄 파스텔', theme: 'spring', font: 'blackhan', feel: '부드럽게', motions: ['팝', '드롭', '웨이브'], trans: ['디졸브', '와이프'], fx: ['꽃잎'], blockFx: { 가격: ['반짝이'] } },
  fire: { name: '물가격파', theme: 'fire', font: 'gasoek', feel: '강하게', motions: ['스탬프', '팝', '줌인'], trans: ['플래시', '와이프', '원형'], fx: [], blockFx: { 가격: ['코인'], 한정: ['불꽃'], 훅: ['집중선'] } },
  premium: { name: '프리미엄 보라', theme: 'purple', font: 'gothica1', feel: '부드럽게', motions: ['블러', '타이핑', '플립'], trans: ['디졸브', '줌'], fx: ['반짝이'], blockFx: { 가격: ['렌즈플레어'] } },
  fresh: { name: '산지직송 신선', theme: 'fresh', font: 'hahmlet', feel: '보통', motions: ['슬라이드', '팝', '블러'], trans: ['밀기', '와이프'], fx: [], blockFx: { 가격: ['반짝이'] } },
  party: { name: '축하 파티', theme: 'celebrate', font: 'bagel', feel: '보통', motions: ['바운스', '팝', '회전'], trans: ['원형', '줌', '블라인드'], fx: [], blockFx: { 훅: ['컨페티'], 가격: ['폭죽', '컨페티'], 한정: ['풍선'] } },
  blue: { name: '블루 초특가', theme: 'blue', font: 'blackhan', feel: '강하게', motions: ['스탬프', '줌인', '슬라이드'], trans: ['플래시', '밀기'], fx: [], blockFx: { 가격: ['집중선'], 한정: ['스포트라이트'] } },
  // 인서트 예시(DB0) 참고: 큰 글자를 빠르게 바꿔 치는 타이포 위주
  ins_black: { name: '인서트 블랙레드', theme: 'impact', font: 'blackhan', feel: '강하게', motions: ['스탬프', '줌인', '팝'], trans: ['컷', '플래시', '글리치'], fx: ['종이질감'], blockFx: { 훅: ['폭죽'], 가격: ['폭죽'], 한정: ['화살표상승'], 강조: ['글자패턴'] }, impact: ['반복', '박스'], insert: true,
    copy: { hookA: ['지금 이 방송', '오직 방송에서만', '단 한 번'], hookB: ['*찬란한 혜택!*', '*최저가 찬스*', '*역대급 구성*'], impact: ['최저가', '파격가', '역대급'] } },
  ins_orange: { name: '인서트 반값 오렌지', theme: 'halfsale', font: 'gasoek', feel: '강하게', motions: ['스탬프', '드롭', '팝'], trans: ['와이프', '컷', '플래시'], fx: [], blockFx: { 가격: ['대각분할'], 한정: ['화살표상승'], 훅: ['대각분할'] }, impact: ['박스', '기울임'], insert: true,
    copy: { hookA: ['오직 방송에서만', '오늘 단 하루', '이번 방송'], hookB: ['*반값*으로 뚝!', '*파격* 세일', '*기회*를 잡으세요!'], impact: ['반값', '파격세일', '특가'] } },
  ins_sale: { name: '인서트 세일 레드', theme: 'salered', font: 'notoblack', feel: '강하게', motions: ['슬라이드', '스탬프', '줌인'], trans: ['밀기', '컷', '플래시'], fx: [], blockFx: { 강조: ['글자패턴'], 가격: ['글자패턴'], 한정: ['화살표상승'] }, impact: ['반복', '박스'], insert: true,
    copy: { hookA: ['지금 이 방송', '특집 생방송', '이번 회차'], hookB: ['*채널고정!*', '*파격 세일*', '*놓치지 마세요!*'], impact: ['SALE', '파격세일', '특별한 파격가'] } },
};

// 상품 정보로 어울리는 테마 고르기
const MOOD_RULES = [
  [/봄|벚꽃|꽃|파스텔|살랑/, 'spring'],
  [/물가|격파|최저가|불꽃|폭탄|파격|무관세/, 'fire'],
  [/크림|화장|뷰티|세럼|앰플|프리미엄|명품|감사|고급|럭셔리/, 'purple'],
  [/신선|산지|과일|한우|고기|수산|국내산|농장|식품|김치|쌀/, 'fresh'],
  [/돌파|결산|1위|기념|축하|누적|이벤트|추첨/, 'celebrate'],
  [/초특가|가전|다리미|청소기|냉장고|세탁|에어컨|TV/, 'blue'],
  [/정리|수납|생활|주방|욕실|압축|휴지통/, 'clean'],
];
function guessTheme(d) {
  const txt = [d.product, d.hook, d.record, ...(d.benefits || []), d.urgent, ...(d.comps || []).map(c => c.name)].join(' ');
  for (const [re, id] of MOOD_RULES) if (re.test(txt)) return id;
  return 'ns';
}

// 가격 문자열 다듬기: "29700" → "29,700원"
function formatPrice(p) {
  p = String(p || '').trim(); if (!p) return '';
  const m = p.match(/^([^\d]*)([\d,]+)(.*)$/); if (!m) return p;
  const n = m[2].replace(/,/g, ''); const body = Number(n).toLocaleString('ko-KR');
  let tail = m[3].trim(); if (!tail) tail = '원';
  return m[1] + body + tail;
}

// 정가·할인율·수량으로 최종가와 개당 가격 계산
function calcPrice(d) {
  const num = v => { const n = parseFloat(String(v || '').replace(/[^\d.]/g, '')); return isNaN(n) ? 0 : n; };
  let price = num(d.price), list = num(d.listPrice), rate = num(d.rate);
  let auto = false;
  if (!price && list && rate) { price = Math.round(list * (1 - rate / 100) / 10) * 10; auto = true; }
  if (price && list && !rate && list > price) rate = Math.round((1 - price / list) * 100);
  const qty = num(d.qty) || (d.comps || []).filter(c => c.name).reduce((a, c) => a + (parseInt(c.qty) || 1), 0);
  const unit = String(d.unit || '').trim() || '개';
  const per = price && qty > 1 ? Math.round(price / qty) : 0;
  return { price, list: list > price ? list : 0, rate: list > price ? rate : 0, qty, unit, per, auto };
}
const won = n => Number(n).toLocaleString('ko-KR') + '원';

// 한 줄 카피를 "작은 문구 / *큰 문구*"로 나눔
function splitHook(s) {
  s = String(s || '').trim(); if (!s) return [];
  if (s.includes('/')) return s.split('/').map(x => x.trim()).filter(Boolean);
  if (s.includes('*')) return [s];
  const w = s.split(/\s+/);
  if (w.length === 1) return ['*' + s + '*'];
  if (w.length === 2) return [w[0], '*' + w[1] + '*'];
  const cut = Math.ceil(w.length / 2);
  return [w.slice(0, cut).join(' '), '*' + w.slice(cut).join(' ') + '*'];
}
const emph = s => (s.includes('*') ? s : '*' + s + '*');

// 시드 고정 난수 (같은 시드면 같은 연출)
function seededRand(seed, k) {
  let a = (Math.imul(seed | 0, 0x9E3779B1) ^ Math.imul(k | 0, 0x85EBCA77)) >>> 0;
  a = Math.imul(a ^ (a >>> 16), 0x7feb352d); a = Math.imul(a ^ (a >>> 15), 0x846ca68b); a ^= a >>> 16;
  return (a >>> 0) / 4294967296;
}
function directStoryboard(d, seed = 1) {
  const r = k => seededRand(seed + 1, k);
  const pick = (arr, k) => arr[Math.floor(r(k) * arr.length) % arr.length];
  const fmt = d.fmt || '하드필러';
  const ST = STYLES[d.style] || null;
  const cp = (k, def) => (ST && ST.copy && ST.copy[k]) || def;
  const feel = d.theme === 'key' ? (d.feel || '보통') : ST ? ST.feel : (d.feel || '보통');
  const themeId = d.theme === 'key' ? 'key' : ST ? ST.theme : (d.theme && THEMES[d.theme] ? d.theme : guessTheme(d));
  const fontId = d.theme === 'key' ? d.font : ST ? ST.font : d.font;
  const dur = d.dur || (fmt === '오프닝필러' ? 25 : 20);
  const comps = (d.comps || []).filter(c => c.name);
  const benefits = (d.benefits || []).filter(Boolean);
  const firstImg = (comps.find(c => c.img) || {}).img;
  const motionsSoft = ['블러', '슬라이드', '팝', '타이핑', '블러'];
  const motionsStrong = ['스탬프', '팝', '드롭', '슬라이드', '팝'];
  const motionPool = ST ? ST.motions : feel === '강하게' ? motionsStrong : feel === '부드럽게' ? motionsSoft : ['팝', '슬라이드', '블러', '스탬프', '팝'];
  const transPool = ST ? ST.trans : feel === '강하게' ? ['플래시', '와이프', '원형'] : ['디졸브', '밀기', '줌'];

  const S = []; // { block, lines, opts }
  const add = (block, lines, opts = {}) => { lines = lines.filter(Boolean); if (lines.length) S.push({ block, lines, opts }); };

  const hook = splitHook(d.hook);
  const product = String(d.product || '').trim();
  const P = calcPrice(d);
  const price = P.auto ? won(P.price) : formatPrice(d.price);
  const pricePre = d.pricePre || pick(['단,', '방송에서만', '오늘 단 하루', '최종혜택가'], 11);
  const urgent = String(d.urgent || '').trim();

  const openHook = () => add('훅', hook.length ? hook : [pick(cp('hookA', ['오직 방송에서만', '지금 이 방송', '놓치면 손해']), 3), emph(pick(cp('hookB', ['특별 찬스!', '이 가격!', '역대급 혜택']), 4))], r(5) > .5 && !(ST && ST.props === false) ? { 소품: '선물' } : {});
  const record = () => { if (d.record) { const L = String(d.record).split('/').map(s => s.trim()).filter(Boolean); add('실적', L.length > 1 ? L : [product, L[0], '*판매 돌파!*']); } };
  const productScene = () => { if (product) add('상품', [product.includes('*') ? product : product.replace(/(\S+)$/, '*$1*'), d.productSub || ''], firstImg ? { 이미지: firstImg, 위치: r(6) > .5 ? '우' : '좌' } : {}); };
  const impact = () => {
    const style = pick((ST && ST.impact) || ['분리', '기울임', '박스', '반복'], 7);
    const word = pick(cp('impact', ['최다구성', '최저가', '역대급', '초특가']), 8);
    const big = style === '분리' ? word.split('').join('|') : emph(word);
    add('강조', [pick(['방송에서만', '지금 이 방송', '오직 오늘'], 9), big], { 스타일: style, ...(r(10) > .6 && !(ST && ST.props === false) ? { 소품: 'TV' } : {}) });
  };
  const composition = () => {
    if (!comps.length) return;
    const total = comps.reduce((a, c) => a + (parseInt(c.qty) || 1), 0); const u = String(d.unit || '').trim() || '개';
    const items = comps.map(c => `${c.name}${c.img ? ' @' + c.img : ''}${parseInt(c.qty) > 1 ? ' x' + parseInt(c.qty) : ''}`).join(' + ');
    add('구성표', [d.compTitle || (total > 1 ? `총 *${total}${u}* 구성!` : '*방송 단독* 구성'), items]);
  };
  const benefitsScene = () => { if (benefits.length) add('혜택', [d.benefitTitle || '*방송에서만* 혜택', ...benefits.slice(0, 4)]); };
  const points = (d.points || []).filter(Boolean);
  const pointsScene = () => { if (points.length >= 2) add('포인트', [pick(['이래서 *잘 팔려요*', '*핵심* 포인트', '왜 *이 상품*일까'], 16), ...points.slice(0, 4)]); };
  const priceScene = () => {
    if (!price) return;
    const o = {}; if (P.list) o.정가 = won(P.list); if (P.rate > 0) o.할인 = P.rate + '%';
    add('가격', [pricePre, price, d.priceNote || ''], o);
    if (P.per && d.perScene !== false) add('가격', [`1${P.unit}당`, `약 ${won(P.per)}꼴`, d.perNote || '']);
  };
  const urgentScene = () => add('한정', urgent ? splitHook(urgent).length > 1 ? [pick(['고객님 서두르세요!', '놓치면 *후회해요!*', '방송 끝나면'], 12), ...splitHook(urgent)] : ['방송 끝나면', emph(urgent)] : [pick(['놓치면 *후회해요!*', '방송 끝나면'], 12), '보셨을 때', '*구매 필수!*'], { 소품: ST && ST.props === false ? '없음' : pick(['사이렌', '시계', '사이렌'], 13) });
  const cta = () => add('CTA', d.cta ? splitHook(d.cta) : [pick(['쇼핑은', '지금 바로'], 14), emph(pick(['타이밍', '주문하세요', '수량 선점!'], 15))], { 소품: '시계' });

  if (fmt === '오프닝필러') {
    productScene(); if (!product) openHook();
    if (hook.length && product) openHook();
    benefitsScene(); composition(); priceScene(); cta();
    if (d.logo) add('로고', [product || '브랜드명'], { 이미지: d.logo });
  } else {
    const pattern = Math.floor(r(1) * 3);
    if (pattern === 0) { openHook(); record(); productScene(); pointsScene(); impact(); composition(); priceScene(); benefitsScene(); urgentScene(); }
    else if (pattern === 1) { impact(); openHook(); productScene(); pointsScene(); composition(); benefitsScene(); priceScene(); urgentScene(); }
    else { record(); openHook(); composition(); productScene(); pointsScene(); priceScene(); impact(); benefitsScene(); urgentScene(); }
    // 너무 많으면 길이에 맞춰 덜어냄 (장면당 최소 2초 정도)
    const maxScenes = Math.max(4, Math.floor(dur / 2.3));
    const dropOrder = ['강조', '실적', '포인트', '혜택', '훅', '상품'];
    for (const b of dropOrder) { if (S.length <= maxScenes) break; const k = S.findIndex(s => s.block === b); if (k > 0) S.splice(k, 1); }
  }

  // 배경 변형·모션·전환 배치: 이웃 장면끼리 겹치지 않게
  let prevBg = -1;
  S.forEach((s, i) => {
    let bg = 1 + Math.floor(r(100 + i) * 3) % 3; if (bg === prevBg) bg = bg % 3 + 1;
    prevBg = bg; if (i > 0 || r(20) > .5) s.opts.배경 = String(bg);
    if (!['구성표', '혜택', '포인트'].includes(s.block) && r(200 + i) > .45) s.opts.모션 = motionPool[(i + Math.floor(r(21) * 5)) % motionPool.length];
    if (r(300 + i) > (ST ? .45 : .7) && i < S.length - 1) s.opts.전환 = pick(transPool, 400 + i);
    const bfx = ST && ST.blockFx && ST.blockFx[s.block];
    if (bfx && r(500 + i) > .2) s.opts.효과 = bfx.join('+');
  });

  const head = { 테마: THEMES[themeId].name, 길이: String(dur), 형식: fmt, L바: fmt === '오프닝필러' ? '하단바' : '기본', 느낌: feel };
  if (themeId === 'key') head.키컬러 = d.key || THEMES.key.hex;
  if (fontId && FONTS[fontId]) head.폰트 = FONTS[fontId].name.split(' ')[0];
  if (ST && ST.fx.length) head.효과 = ST.fx.join('+');
  return serializeSettings(head) + '\n' + S.map(s => serializeScene({ label: s.block, lines: s.lines, opts: s.opts })).join('\n');
}

// ===== 통강조 자동 연출: L바 왼쪽 네모(376×790) 세로 영상 =====
const TONG_STYLE_FRAME = { ins_black: '테두리', ins_orange: '코너', ins_sale: '카드', ns: '카드', neon: '네온', pop: '코너', luxe: '테두리', y2k: '카드', aurora: '카드', bf: '테두리', speed: '코너', winter: '카드', ink: '테두리', spring: '카드', fire: '코너', premium: '테두리', fresh: '없음', party: '코너', blue: '카드' };
function directTong(d, seed = 1) {
  const r = k => seededRand(seed + 7, k);
  const pick = (arr, k) => arr[Math.floor(r(k) * arr.length) % arr.length];
  const ST = STYLES[d.style] || null;
  const cp = (k, def) => (ST && ST.copy && ST.copy[k]) || def;
  const feel = d.theme === 'key' ? (d.feel || '보통') : ST ? ST.feel : (d.feel || '보통');
  const themeId = d.theme === 'key' ? 'key' : ST ? ST.theme : (d.theme && THEMES[d.theme] ? d.theme : guessTheme(d));
  const fontId = d.theme === 'key' ? d.font : ST ? ST.font : d.font;
  const dur = Math.min(FORMATS.통강조.max, d.fmt === '통강조' && d.dur ? d.dur : FORMATS.통강조.dur);
  const product = String(d.product || '').trim(), P = calcPrice(d);
  const price = P.auto ? won(P.price) : formatPrice(d.price);
  const comps = (d.comps || []).filter(c => c.name), benefits = (d.benefits || []).filter(Boolean), points = (d.points || []).filter(Boolean);
  const firstImg = (comps.find(c => c.img) || {}).img, hook = splitHook(d.hook), noProps = ST && ST.props === false;
  const motionPool = ST ? ST.motions : feel === '강하게' ? ['스탬프', '팝', '드롭'] : feel === '부드럽게' ? ['블러', '슬라이드', '팝'] : ['팝', '슬라이드', '블러', '스탬프'];
  const transPool = ST ? ST.trans : feel === '강하게' ? ['플래시', '와이프', '원형'] : ['디졸브', '밀기', '줌'];
  const S = []; const add = (block, lines, opts = {}) => { lines = lines.filter(Boolean); if (lines.length) S.push({ block, lines, opts }); };
  const short = product.length > 7 && product.includes(' ') ? product.replace(/^(.*)\s(\S+)$/, '$1 / *$2*') : (product.includes('*') ? product : product ? '*' + product + '*' : '');
  // 1) 첫 장면: 상품 사진이 있으면 사진, 없으면 훅
  if (firstImg && product) add('상품', [hook[0] || pick(['오늘의 추천', '방송 단독', '지금 이 상품'], 1), ...short.split(' / ')], { 이미지: firstImg });
  else add('훅', hook.length ? hook : [pick(cp('hookA', ['오늘 방송', '오직 방송에서만', '지금 이 방송']), 1), emph(pick(cp('hookB', ['최다구성', '역대급 혜택', '특별 찬스']), 2))], {});
  // 2) 포인트 체크
  if (points.length >= 2) add('포인트', [pick(['이래서 *잘 팔려요*', '*핵심* 포인트', '왜 *이 상품*일까'], 3), ...points.slice(0, 4)]);
  // 3) 강조: 배지 또는 세로 분리 글자
  const word = pick(cp('impact', ['최다구성', '역대급', '초특가', '단독구성']), 4);
  if (ST && (ST.impact || []).includes('분리') && word.length <= 5 && r(5) > .4) add('강조', [pick(['방송 단독', '오직 오늘', '지금 이 방송'], 6), word.split('').join('|')], { 스타일: '분리' });
  else add('배지', [pick(['방송 단독', '오직 오늘', '이번 방송'], 6), emph(word)]);
  // 4) 구성
  if (comps.length) { const total = comps.reduce((a, c) => a + (parseInt(c.qty) || 1), 0), u = String(d.unit || '').trim() || '개'; add('구성표', [total > 1 ? `총 *${total}${u}*` : '*방송 단독* 구성', comps.slice(0, 3).map(c => `${c.name}${c.img ? ' @' + c.img : ''}${parseInt(c.qty) > 1 ? ' x' + parseInt(c.qty) : ''}`).join(' + ')]); }
  // 5) 가격 (+ 1개당)
  if (price) { const o = {}; if (P.list) o.정가 = won(P.list); if (P.rate > 0) o.할인 = P.rate + '%'; add('가격', [d.pricePre || pick(['단,', '방송 특가', '최종혜택가'], 7), price, d.priceNote || ''], o);
    if (P.per && d.perScene !== false) add('가격', [`1${P.unit}당`, `약 ${won(P.per)}꼴`]); }
  // 6) 혜택 · 한정
  if (benefits.length >= 2) add('혜택', ['*방송에서만* 혜택', ...benefits.slice(0, 3)]);
  add('한정', d.urgent ? ['방송 끝나면', ...splitHook(d.urgent).map(emph).slice(0, 2)] : [pick(['서두르세요', '고객님 지금!', '방송 중에만'], 8), emph(pick(['매진 임박', '수량 한정', '주문 폭주'], 9))], { 소품: noProps ? '없음' : pick(['사이렌', '시계'], 10) });
  // 통강조는 최대 8초라 장면 2개로: 첫 장면(상품·훅) + 가격(없으면 배지·강조·한정 중 하나)
  const second = S.find((s, i) => i > 0 && s.block === '가격') || S.find((s, i) => i > 0 && ['배지', '강조'].includes(s.block)) || S.find((s, i) => i > 0);
  S.splice(0, S.length, ...[S[0], second].filter(Boolean));
  let prevBg = -1;
  S.forEach((s, i) => {
    let bg = 1 + Math.floor(r(100 + i) * 3) % 3; if (bg === prevBg) bg = bg % 3 + 1; prevBg = bg; if (i > 0 || r(20) > .5) s.opts.배경 = String(bg);
    if (!['구성표', '혜택', '포인트', '정보'].includes(s.block) && r(200 + i) > .45) s.opts.모션 = motionPool[(i + Math.floor(r(21) * 5)) % motionPool.length];
    if (r(300 + i) > (ST ? .45 : .7) && i < S.length - 1) s.opts.전환 = pick(transPool, 400 + i);
    const bfx = ST && ST.blockFx && ST.blockFx[s.block === '배지' ? '강조' : s.block]; if (bfx && r(500 + i) > .2) s.opts.효과 = bfx.join('+');
  });
  const head = { 형식: '통강조', 테마: THEMES[themeId].name, 길이: String(dur) };
  const hd = d.tongHead || (product ? (product.length > 8 && product.includes(' ') ? product.replace(/^(.*)\s(\S+)$/, '$1 | $2') : product) : '');
  const ft = d.tongFoot || (benefits[0] ? `방송에서만 | *${benefits[0]}*` : P.rate ? `지금 주문하면 | *${P.rate}% 할인*` : '');
  if (hd) head.머리 = hd.replace(/\//g, '|'); if (ft) head.꼬리 = ft.replace(/\//g, '|');
  head.틀 = ST ? TONG_STYLE_FRAME[d.style] || '카드' : pick(['카드', '없음', '테두리', '코너'], 30);
  head.느낌 = feel;
  if (themeId === 'key') head.키컬러 = d.key || THEMES.key.hex;
  if (fontId && FONTS[fontId]) head.폰트 = FONTS[fontId].name.split(' ')[0];
  if (ST && ST.fx.length) head.효과 = ST.fx.join('+');
  return serializeSettings(head) + '\n' + S.map(s => serializeScene({ label: s.block, lines: s.lines, opts: s.opts })).join('\n');
}

// ===== 인서트 자동 연출: 큰 글자를 빠르게 바꿔 치는 키네틱 타이포 (DB0 예시 참고) =====
function directInsert(d, seed = 1) {
  const r = k => seededRand(seed + 13, k);
  const pick = (arr, k) => arr[Math.floor(r(k) * arr.length) % arr.length];
  const ST = STYLES[d.style] || null;
  const themeId = d.theme === 'key' ? 'key' : ST ? ST.theme : (d.theme && THEMES[d.theme] ? d.theme : pick(['impact', 'halfsale', 'salered'], 1));
  const fontId = d.theme === 'key' ? d.font : ST ? ST.font : d.font;
  const dur = d.fmt === '인서트' && d.dur ? d.dur : 15;
  const product = String(d.product || '').trim(), P = calcPrice(d), rate = P.rate > 0 ? P.rate : 0;
  const price = P.auto ? won(P.price) : formatPrice(d.price);
  const comps = (d.comps || []).filter(c => c.name), firstImg = (comps.find(c => c.img) || {}).img;
  const points = (d.points || []).filter(Boolean), hook = splitHook(d.hook), urgent = splitHook(d.urgent || '');
  const cp = (k, def) => (ST && ST.copy && ST.copy[k]) || def;
  const S = []; const add = (block, lines, opts = {}, tag = '') => { lines = lines.filter(Boolean); if (lines.length) S.push({ block, lines, opts, tag }); };
  // 1) 여는 장면: 작은 머리 줄 + 큰 한마디가 쌓임
  add('타이포', hook.length ? [`(작게)${hook[0]}`, ...hook.slice(1).map(emph)] : pick([
    ['(작게)' + pick(cp('hookA', ['지금 이 방송']), 2), pick(cp('hookB', ['*찬란한 혜택!*']), 3)],
    ['(작게)지금 이 방송', '(자간)*채널고정!*'],
    ['(테이프)오직 방송에서만', product ? emph(product) : '*특별한 기회*'],
  ], 4), { 스타일: '쌓기', 효과: pick(['폭죽', '플래시', '폭죽+종이질감'], 5) }, 'open');
  // 2) 할인율 한 방
  if (rate === 50) add('타이포', ['*50%*', '(입체)반값 세일전'], { 스타일: '교체', 효과: '대각분할', 배경: '1' }, 'rate');
  else if (rate) add('타이포', [`*${rate}%*`, '세일', 'SALE'], { 스타일: '교체', 효과: '글자패턴', 패턴: 'SALE' }, 'rate');
  else add('타이포', ['이 보다', '*낮은 가격*'], { 스타일: '쌓기', 효과: '화살표하락' }, 'rate');
  // 3) 상품 (이미지가 있으면)
  if (product && firstImg) add('상품', [product.includes('*') ? product : product.replace(/(\S+)$/, '*$1*')], { 이미지: firstImg, 위치: r(6) > .5 ? '우' : '좌' }, 'product');
  // 4) 최저가·파격가 반복 글자
  const word = pick(cp('impact', ['최저가', '파격가', '역대급']), 7);
  add('타이포', [`(크게)*${plain(word)}*`], { 스타일: '교체', 효과: '글자패턴+플래시', 패턴: plain(word) }, 'word');
  // 5) 가격
  if (price) { const o = {}; if (P.list) o.정가 = won(P.list); if (rate) o.할인 = rate + '%'; add('가격', [d.pricePre || pick(['단,', '방송에서만', '최종혜택가'], 8), price, d.priceNote || ''], o, 'price'); }
  // 6) 소구점(특징·포인트)을 한 줄씩 크게 박음
  if (points.length) add('타이포', ['(작게)이래서 잘 팔려요', ...points.slice(0, 3).map(b => emph(b))], { 스타일: '교체' }, 'benefit');
  // 7) 방송 끝나면 가격은 올라갑니다
  add('타이포', urgent.length ? ['(작게)방송이 끝나면', ...urgent.slice(0, 2).map((u, i) => i === urgent.length - 1 ? `(외곽)${emph(u)}` : u)] : ['(작게)방송이 끝나면', '가격은', '(외곽)*올라갑니다*'], { 스타일: '쌓기', 효과: '화살표상승', 배경: '2' }, 'urgent');
  // 8) 마무리: 큰 말 + 박스 문구
  add('타이포', [rate === 50 ? '*반값 세일*' : rate ? `*${rate}% 특가*` : '*방송 단독 혜택*', `(박스)${pick(['놓치지 마세요!', '기회를 잡으세요!', '지금 주문하세요!'], 9)}`], { 스타일: '쌓기', 효과: pick(['컨페티', '폭죽', '원형스포트'], 10) }, 'close');
  // 길이에 맞게 덜어냄 (장면당 1.6초 안팎)
  const maxN = Math.max(5, Math.round(dur / 1.7));
  for (const tg of ['benefit', 'product', 'word', 'rate']) { if (S.length <= maxN) break; const k = S.findIndex(s => s.tag === tg); if (k > 0) S.splice(k, 1); }
  // 배경 번호·전환: 빠른 컷 위주로 이웃끼리 겹치지 않게
  const trans = ST ? ST.trans : ['컷', '플래시', '컷', '밀기'];
  let prev = 0;
  S.forEach((s, i) => {
    if (!s.opts.배경) { let bg = 1 + Math.floor(r(100 + i) * 3) % 3; if (bg === prev) bg = bg % 3 + 1; s.opts.배경 = String(bg); }
    prev = +s.opts.배경;
    if (i < S.length - 1) s.opts.전환 = pick(trans, 300 + i);
    const bfx = ST && ST.blockFx && ST.blockFx[s.block]; if (bfx && !s.opts.효과) s.opts.효과 = bfx.join('+');
  });
  const head = { 형식: '인서트', 테마: THEMES[themeId].name, 길이: String(dur), L바: '기본', 느낌: '강하게' };
  if (themeId === 'key') head.키컬러 = d.key || THEMES.key.hex;
  if (fontId && FONTS[fontId]) head.폰트 = FONTS[fontId].name.split(' ')[0];
  if (ST && ST.fx.length) head.효과 = ST.fx.join('+');
  if (d.dan) head.단서 = d.dan;
  return serializeSettings(head) + '\n' + S.map(s => serializeScene({ label: s.block, lines: s.lines, opts: s.opts })).join('\n');
}

// ---------- Claude AI 연출 (선택: 사용자 API 키 필요) ----------
function aiGrammarDoc() {
  const blocks = Object.entries(BLOCKS).filter(([id]) => id !== 'benefits').map(([id, b]) => `- [${BLOCK_LABEL[id]}] ${b.name}: ${b.help}. 예) ${b.sample}`).join('\n');
  return `홈쇼핑 "하드필러" 영상의 스토리보드 문법.
첫 줄은 설정: 테마: <이름> / 길이: <초> / 형식: 하드필러|오프닝필러|인서트|통강조 / L바: 기본|하단바|없음 / 느낌: 부드럽게|보통|강하게 / 폰트: <이름> / 효과: <효과+효과> (전체 장면에 깔리는 효과, 선택) / 단서: <제목 | 작은 고지 문구> (선택, 단서자막 자리에 작게) / 이미지크기: <퍼센트, 기본 100> / 자간: <글자 사이 간격, 글자 크기의 %, 기본 0, 예 -5·10> / 행간: <줄 간격 %, 기본 100>
  (테마를 "키컬러"로 하면 키컬러: #hex 한 색으로 배경·글자색을 맞춰 만듦. 사용자가 키컬러를 정했으면 그 테마를 우선 고려)
그 다음부터 한 줄이 한 장면: [블록] 문구 / 문구 {옵션: 값, 옵션: 값}
- "/"는 화면의 줄바꿈. *별표*로 감싼 부분은 포인트 색으로 강조.
- @이름 은 사용자가 올린 이미지(아래 목록에 있는 이름만). x8 은 수량.
블록 종류:
${blocks}
[가격] 전용 옵션: 정가(취소선으로 표시, 예 99,000원) · 할인(배지, 예 23%)
효과(장면 옵션, +로 여러 개, 없음=전체 효과 끄기): ${EFFECT_NAMES.join('·')}
[타이포] 줄 앞 꾸밈: (외곽) 속 빈 글자 · (박스) 색 상자 안 글자 · (테이프) 기울어진 띠 · (입체) 긴 그림자 · (자간) 넓은 자간 · (작게) 작은 머리 줄 · (크게) 더 크게. 스타일: 쌓기(줄이 하나씩 쌓임) | 교체(한 줄씩 화면 가득 바꿔 침). 효과 글자패턴은 옵션 패턴: <반복할 단어> 로 단어를 정할 수 있음.
옵션: 길이(초, 보통 비움) · 크기(이미지 크기 퍼센트, 예 130) · 자간(%) · 행간(%) · 모션(${Object.keys(MOTIONS).join('·')}) · 전환(${TRANSITIONS.join('·')}) · 배경(1·2·3: 테마 안의 배경 종류) · 소품(${PROPS_LIST.join('·')}) · 이미지(이름) · 스타일([강조] 전용: 분리·반복·기울임·박스) · 강조박스 · 색(#hex) · 위치(좌·우)
테마 이름: ${Object.values(THEMES).map(t => t.name).join(', ')}
폰트 이름: ${Object.values(FONTS).map(f => f.name.split(' ')[0]).join(', ')}
통강조(형식: 통강조): L바 왼쪽 네모 안에 들어가는 376×790 세로 영상. L바 설정은 쓰지 않고 대신
  머리: <위 고정 띠 문구, | 로 두 줄> / 꼬리: <아래 고정 띠 문구, | 로 두 줄> / 틀: ${TONG_FRAMES.join('|')} 를 씀.
  세로로 좁으니 한 줄은 6자 안팎. 최대 8초라서 장면은 2개(예: 상품·강조 한 장면 + 가격 한 장면), 길이 8초. [배지]·[강조]·[가격] 블록이 잘 어울림. 소품 TV는 쓰지 않음.
인서트(형식: 인서트): 하드필러와 같은 L바 화면이지만 큰 글자를 1~2초마다 빠르게 바꿔 치는 키네틱 타이포 위주. [타이포] 블록을 중심으로 7~10장면, 길이 13~20초. 배경 효과 글자패턴·화살표하락(가격 내려감)·화살표상승(방송 끝나면 가격 오름)·대각분할·원형스포트·폭죽·플래시가 잘 어울림. 전환은 컷·플래시 위주로 빠르게.
규칙:
- 화면 한 줄은 짧게(큰 글자 줄은 8자 안팎, 작은 줄 14자 안팎). 한 장면에 2~4줄.
- 전체 길이 20초 전후 하드필러는 6~8장면, 장면당 2~3.5초가 되도록 구성.
- 가격·구성·한정 메시지가 반드시 들어가게. 혜택 리스트([혜택]) 장면은 쓰지 말고, 소구점은 [타이포]·[강조]로 크게 한 번씩 박음. 같은 배경 번호·모션이 연달아 반복되지 않게 변화를 줌.
- 하단 단서자막 자리와 L바는 툴이 알아서 피하니 신경 쓰지 않아도 됨.
- 테마·폰트·모션·전환·효과를 조합해 기존 템플릿과 다른 새로운 스타일을 적극적으로 시도해도 좋음. 단, 효과는 장면당 1~2개 정도로 절제.
- 참고용 스타일 프리셋: ${Object.values(STYLES).map(x => `${x.name}(테마 ${THEMES[x.theme].name}, 폰트 ${FONTS[x.font].name.split(' ')[0]}, 모션 ${x.motions.join('/')}, 효과 ${[...x.fx, ...Object.values(x.blockFx || {}).flat()].filter((v, i, a) => a.indexOf(v) === i).join('/') || '없음'})`).join('; ')}`;
}

async function aiDirect({ apiKey, form, current, request, assets }) {
  const sys = `당신은 한국 홈쇼핑 방송의 그래픽 연출 PD입니다. 시청자가 가격과 구성을 한눈에 이해하고 지금 사고 싶어지도록, 리듬감 있고 세련된 하드필러를 설계합니다. 결과는 아래 문법의 스토리보드로만 냅니다.\n\n${aiGrammarDoc()}`;
  const user = `만들 형식: ${form.형식 || '하드필러'}\n\n상품 정보(간편 입력):\n${JSON.stringify(form, null, 1)}\n\n올린 이미지 이름: ${assets.length ? assets.join(', ') : '(없음)'}\n\n지금 스토리보드:\n${current || '(없음)'}\n\n요청: ${request || '상품 정보에 맞는 테마·장면 구성·모션·전환을 스스로 판단해서 더 완성도 높은 연출로 만들어 주세요.'}`;
  const body = {
    model: 'claude-opus-5-5', max_tokens: 8000,
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: { type: 'object', properties: { concept: { type: 'string', description: '연출 의도 한두 문장' }, storyboard: { type: 'string', description: '문법에 맞는 전체 스토리보드 텍스트' } }, required: ['concept', 'storyboard'], additionalProperties: false } },
    },
    system: sys,
    messages: [{ role: 'user', content: user }],
  };
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2026-10-21', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data.error && data.error.message) || res.statusText;
    if (res.status === 401) throw new Error('API 키가 맞지 않아요. 키를 다시 확인해 주세요.');
    if (res.status === 429) throw new Error('요청이 많아 잠시 막혔어요. 조금 뒤에 다시 시도해 주세요.');
    throw new Error(`AI 요청 실패 (${res.status}): ${msg}`);
  }
  if (data.stop_reason === 'refusal') throw new Error('AI가 이 요청을 처리하지 않았어요. 문구를 바꿔서 다시 시도해 주세요.');
  if (data.stop_reason === 'max_tokens') throw new Error('AI 답이 너무 길어 잘렸어요. 다시 시도해 주세요.');
  const text = (data.content || []).find(b => b.type === 'text');
  if (!text) throw new Error('AI 답을 읽지 못했어요.');
  const out = JSON.parse(text.text);
  return { concept: out.concept, storyboard: out.storyboard.trim() };
}
