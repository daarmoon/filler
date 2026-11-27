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
const MOTIONS = { 팝: 'pop', 타이핑: 'type', 슬라이드: 'slide', 스탬프: 'stamp', 블러: 'blur', 드롭: 'drop', 웨이브: 'wave', 바운스: 'bounce', 플립: 'flip', 줌인: 'zoom', 회전: 'spin', 글리치: 'glitch', 네온: 'neon' };
const TRANSITIONS = ['자동', '컷', '디졸브', '밀기', '플래시', '와이프', '원형', '줌', '타이포', '블라인드', '글리치', '스핀'];
const FEEL_NAMES = ['부드럽게', '보통', '강하게'];
const AUTO_TRANS = ['와이프', '플래시', '줌', '원형', '타이포'];
const PROPS_LIST = ['없음', '사이렌', '시계', '선물', '화살표위', '화살표아래', 'TV'];
// max: 형식별 최대 길이(초). 통강조는 L바 네모 안에서 최대 8초
const FORMATS = { 하드필러: { lbar: 'full', dur: 20, max: 30 }, 오프닝필러: { lbar: 'bottom', dur: 25, max: 30 }, 인서트: { lbar: 'full', dur: 15, max: 30 }, 통강조: { lbar: 'tong', dur: 8, max: 8 } };

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

function parseOpts(s) {
  const o = {};
  s.split(/,(?!\d{3})/).forEach(kv => { const i = kv.indexOf(':'); if (i > 0) o[kv.slice(0, i).trim()] = kv.slice(i + 1).trim(); else if (kv.trim()) o[kv.trim()] = '켬'; });
  return o;
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
      line.split('/').forEach(kv => { const i = kv.indexOf(':'); if (i > 0) settings[kv.slice(0, i).trim()] = kv.slice(i + 1).trim(); });
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
  const o = Object.entries(sc.opts || {}).filter(([k, v]) => v !== '' && v != null).map(([k, v]) => v === '켬' ? k : `${k}: ${v}`);
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
