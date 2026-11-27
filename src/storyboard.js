// ===== storyboard.js : 스토리보드 텍스트 ↔ 씬 데이터, 타임라인 =====
const BLOCK_ALIAS = {
  훅: 'hook', 오프닝: 'hook', 인트로: 'hook', 카피: 'hook', 문구: 'hook',
  실적: 'counter', 카운트: 'counter', 숫자: 'counter', 판매량: 'counter',
  상품: 'product', 브랜드: 'product', 소개: 'product',
  강조: 'impact', 타이포: 'typo', 키네틱: 'typo', 타이포그래피: 'typo',
  목록: 'list', 리스트: 'list', 연속: 'list',
  구성: 'composition', 구성표: 'composition',
  혜택: 'benefits', 혜택리스트: 'benefits',
  가격: 'price', 특가: 'price',
  한정: 'urgent', 긴급: 'urgent', 마감: 'urgent',
  cta: 'cta', CTA: 'cta', 마무리: 'cta', 클로징: 'cta',
  로고: 'outro', 엔딩: 'outro', 아웃트로: 'outro',
  포인트: 'points', 체크: 'points', 특징: 'points',
  배지: 'badge', 뱃지: 'badge', 스탬프: 'badge',
  정보: 'info', 원산지: 'info', 스펙: 'info', 상세: 'info',
};
const BLOCK_LABEL = { hook: '훅', counter: '실적', product: '상품', impact: '강조', list: '목록', composition: '구성표', benefits: '혜택', price: '가격', urgent: '한정', cta: 'CTA', outro: '로고', points: '포인트', badge: '배지', info: '정보' };
const MOTIONS = { 팝: 'pop', 타이핑: 'type', 슬라이드: 'slide', 스탬프: 'stamp', 블러: 'blur', 드롭: 'drop', 웨이브: 'wave', 바운스: 'bounce', 플립: 'flip', 줌인: 'zoom', 회전: 'spin', 글리치: 'glitch', 네온: 'neon',
  // v9 임팩트 모션
  쾅: 'slam', 펀치: 'punch', 지진: 'quake', 흔들기: 'shake', 두근: 'heartbeat', 번쩍: 'strobe', 젤리: 'jelly', 고무줄: 'elastic', 슬롯: 'slot', 흩어모으기: 'scatter', 회오리: 'twister', 쓸기: 'swipe', 깜빡: 'blink' };
// 모션 고르기 화면용 설명 (임팩트 모션이 앞)
const MOTION_INFO = {
  쾅: '한 글자씩 쾅 내려찍고 화면이 흔들림', 펀치: '튀어나온 뒤 주기적으로 툭툭 튕김', 지진: '화면 전체가 크게 흔들림', 흔들기: '글자가 계속 덜덜 떨림', 두근: '심장 뛰듯 두근두근 커짐',
  번쩍: '색이 번쩍번쩍 바뀜', 젤리: '말랑하게 출렁임', 고무줄: '옆으로 늘어났다 탁 돌아옴', 슬롯: '슬롯처럼 돌다 멈춤', 흩어모으기: '흩어진 글자가 모여듦', 회오리: '빙글빙글 감겨 들어옴', 쓸기: '옆에서 빠르게 쓸려 들어옴', 깜빡: '깜빡깜빡 켜짐',
  팝: '통통 튀어나옴', 스탬프: '도장처럼 찍힘', 줌인: '멀리서 확 다가옴', 드롭: '위에서 떨어짐', 바운스: '통통 튐', 회전: '돌면서 나타남', 플립: '뒤집히며 나타남',
  슬라이드: '아래에서 올라옴', 웨이브: '물결치듯', 블러: '흐릿하다 선명해짐', 타이핑: '한 글자씩 타자', 글리치: '지지직 노이즈', 네온: '네온사인처럼 깜빡',
};
const IMPACT_MOTIONS = ['쾅', '펀치', '지진', '흔들기', '두근', '번쩍', '젤리', '고무줄', '슬롯', '흩어모으기', '회오리', '쓸기', '깜빡'];
const TRANSITIONS = ['자동', '컷', '디졸브', '밀기', '플래시', '와이프', '원형', '줌', '타이포', '블라인드', '글리치', '스핀'];
const FEEL_NAMES = ['부드럽게', '보통', '강하게'];
const AUTO_TRANS = ['와이프', '플래시', '줌', '원형', '타이포'];
const PROPS_LIST = ['없음', '사이렌', '시계', '선물', '화살표위', '화살표아래', 'TV'];
// max: 형식별 최대 길이(초). 통강조는 L바 네모 안에서 최대 8초
// v8부터 '인서트'는 형식이 아니라 자동 연출 방식(타이포 강조형)이라, 예전 '형식: 인서트'는 하드필러로 읽음
const FORMATS = { 하드필러: { lbar: 'full', dur: 20, max: 30 }, 오프닝필러: { lbar: 'bottom', dur: 25, max: 30 }, 통강조: { lbar: 'tong', dur: 8, max: 8 } };
const normFmt = v => { v = String(v || '').trim(); return v === '인서트' ? '하드필러' : FORMATS[v] ? v : '하드필러'; };
const PRICE_MOTIONS = ['굴리기', '내려가기'];

function themeFromName(v) {
  if (!v) return null; v = v.trim();
  if (THEMES[v]) return v;
  for (const [id, th] of Object.entries(THEMES)) if (th.name === v) return id;
  for (const [id, th] of Object.entries(THEMES)) if (th.name.includes(v)) return id;
  for (const [id, th] of Object.entries(THEMES)) if (v.includes(th.name.split(' (')[0])) return id;
  return null;
}
function fontFromName(v) {
  if (!v) return null; v = v.trim(); if (FONTS[v]) return v;
  for (const [id, f] of Object.entries(FONTS)) if (f.name.split(' ')[0] === v || f.name === v) return id;
  for (const [id, f] of Object.entries(FONTS)) if (f.name.includes(v)) return id;
  return null;
}

// {키: 값, 키: 값} 읽기. 값에 쉼표가 있으면 "따옴표"로 감쌈 (예: 단서: "NS기준, 50% 세일"). 99,000 같은 숫자 쉼표는 그대로
function parseOpts(s) {
  const o = {}, parts = []; let cur = '', q = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"') q = !q;
    if (ch === ',' && !q && !/^\d{3}(?!\d)/.test(s.slice(i + 1))) { parts.push(cur); cur = ''; continue; }
    cur += ch;
  }
  parts.push(cur);
  parts.forEach(kv => { const i = kv.indexOf(':'); if (i > 0) { let v = kv.slice(i + 1).trim(); if (/^".*"$/.test(v)) v = v.slice(1, -1); o[kv.slice(0, i).trim()] = v; } else if (kv.trim()) o[kv.trim()] = '켬'; });
  return o;
}
function optValue(v) {
  v = String(v).replace(/"/g, '”').replace(/\{/g, '(').replace(/\}/g, ')').replace(/\s+#/g, ' ＃');
  return /,(?!\d{3}(?!\d))/.test(v) ? `"${v}"` : v;
}

function parseStoryboard(text) {
  const settings = {}; const scenes = []; const errors = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((raw, ln) => {
    let line = raw.replace(/\s+#.*$/, '').replace(/^#.*$/, '');
    if (!line.trim()) return;
    const m = line.match(/^\s*\[([^\]]+)\]\s*(.*)$/);
    if (m) {
      const label = m[1].trim(); const type = BLOCK_ALIAS[label] || BLOCK_ALIAS[label.toLowerCase()];
      let body = m[2]; let opts = {};
      const om = body.match(/\{([^}]*)\}\s*$/); if (om) { opts = parseOpts(om[1]); body = body.slice(0, om.index); }
      if (!type) { errors.push(`${ln + 1}번째 줄: [${label}] 블록을 모르겠어요. 사용 가능: ${Object.values(BLOCK_LABEL).join(', ')}`); return; }
      scenes.push({ type, label, lines: body.split('/').map(s => s.trim()).filter(s => s !== ''), opts, lineNo: ln });
      return;
    }
    if (!scenes.length && /^[^\[]*:/.test(line)) {
      // 값 안의 / (예: 단서: 4/3~ 기준) 는 앞 값에 그대로 붙임
      let lastK = null;
      line.split('/').forEach(kv => { const i = kv.indexOf(':'); if (i > 0) { lastK = kv.slice(0, i).trim(); settings[lastK] = kv.slice(i + 1).trim(); } else if (lastK && kv.trim()) settings[lastK] += '/' + kv.replace(/\s+$/, ''); });
      return;
    }
    if (scenes.length) { // 이어지는 줄
      const sc = scenes[scenes.length - 1]; let body = line; const om = body.match(/\{([^}]*)\}\s*$/);
      if (om) { Object.assign(sc.opts, parseOpts(om[1])); body = body.slice(0, om.index); }
      sc.lines.push(...body.split('/').map(s => s.trim()).filter(Boolean));
    } else errors.push(`${ln + 1}번째 줄: 첫 장면 앞에는 "테마: … / 길이: …" 같은 설정만 쓸 수 있어요.`);
  });
  return { settings, scenes, errors };
}

function serializeScene(sc) {
  const o = Object.entries(sc.opts || {}).filter(([k, v]) => v !== '' && v != null).map(([k, v]) => v === '켬' ? k : `${k}: ${optValue(v)}`);
  return `[${sc.label || BLOCK_LABEL[sc.type]}]${sc.lines.length ? ' ' + sc.lines.join(' / ') : ''}${o.length ? ' {' + o.join(', ') + '}' : ''}`;
}
function serializeSettings(s) {
  return Object.entries(s).filter(([k, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' / ');
}

function sceneWeight(sc) { const b = BLOCKS[sc.type]; return b.weightFn ? b.weightFn(sc) : b.weight; }

function computeTimeline(scenes, target) {
  const fixed = scenes.map(s => parseFloat(s.opts.길이) || 0);
  const fixedSum = fixed.reduce((a, b) => a + b, 0);
  const wSum = scenes.reduce((a, s, i) => a + (fixed[i] ? 0 : sceneWeight(s)), 0);
  const natural = fixedSum + wSum;
  const total = target > 0 ? Math.max(target, fixedSum + scenes.filter((s, i) => !fixed[i]).length * 0.8) : natural;
  const k = wSum > 0 ? (total - fixedSum) / wSum : 0;
  let t = 0;
  scenes.forEach((s, i) => { s.start = t; s.dur = fixed[i] || Math.max(.8, sceneWeight(s) * k); t += s.dur; });
  return { total: t, natural, fixedSum };
}
