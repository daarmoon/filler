// ===== aiboard.js : v10 AI 스토리보드 — 사람이 쓴 짧은 글을 편집용 스토리보드로 =====
// 문법: 한 줄 = 한 장면 · / 줄바꿈 · [ ] 강조 자막 · ( ) 효과 의성어 · @이름 소스 · # AI에게 요청 · ※ 단서 자막
// 첫 줄(선택): 상품: 쿨링 이불 / 정가: 59,000원 / 가격: 39,900원 / 형식: 하드필러 20초

// 의성어 → 연출 (v9에 있는 모션·전환·효과 이름). AI 키가 없어도 이 사전으로 연출함
const ONO = {
  쾅: { 모션: '쾅' }, 꽝: { 모션: '쾅' }, 쿵: { 모션: '쾅' }, 쿠궁: { 모션: '쾅', 전환: '플래시' },
  두둥: { 모션: '펀치', 전환: '플래시' }, 두둥탁: { 모션: '펀치', 전환: '플래시' }, 빠밤: { 모션: '펀치', 효과: '컨페티' },
  휙: { 모션: '쓸기', 전환: '밀기' }, 슝: { 모션: '쓸기', 전환: '밀기' }, 쌩: { 모션: '쓸기', 전환: '와이프' }, 휘익: { 모션: '쓸기', 전환: '밀기' },
  스르르: { 모션: '블러', 전환: '디졸브' }, 사르르: { 모션: '블러', 전환: '디졸브' }, 스윽: { 모션: '슬라이드', 전환: '디졸브' },
  반짝: { 모션: '번쩍', 효과: '반짝이' }, 번쩍: { 모션: '번쩍', 효과: '빛번짐' }, 빤짝: { 모션: '번쩍', 효과: '반짝이' },
  두근: { 모션: '두근' }, 두근두근: { 모션: '두근', 효과: '하트' },
  뿅: { 모션: '팝' }, 짠: { 모션: '팝', 효과: '컨페티' }, 톡: { 모션: '바운스' }, 통통: { 모션: '바운스' },
  띠용: { 모션: '고무줄' }, 말랑: { 모션: '젤리' }, 출렁: { 모션: '웨이브' },
  우르르: { 모션: '지진' }, 부르르: { 모션: '흔들기' }, 덜덜: { 모션: '흔들기' }, 흔들: { 모션: '흔들기' },
  촤르륵: { 모션: '슬롯' }, 차르륵: { 모션: '슬롯' }, 드르륵: { 모션: '슬롯' },
  착: { 모션: '스탬프' }, 탁: { 모션: '스탬프' }, 쾅쾅: { 모션: '쾅', 전환: '플래시' },
  쫙: { 모션: '흩어모으기' }, 휘리릭: { 모션: '회오리', 전환: '스핀' }, 빙글: { 모션: '회전', 전환: '스핀' },
  타닥: { 모션: '타이핑' }, 따다닥: { 모션: '타이핑' }, 지지직: { 모션: '글리치', 전환: '글리치' },
  펑: { 모션: '펀치', 효과: '폭죽' }, 팡: { 모션: '펀치', 효과: '컨페티' }, 빵: { 모션: '펀치', 효과: '폭죽' },
  깜빡: { 모션: '깜빡' }, 쑥: { 모션: '줌인', 전환: '줌' }, 뚝: { 모션: '드롭' }, 철컥: { 모션: '스탬프', 전환: '블라인드' },
  화르륵: { 모션: '번쩍', 효과: '불꽃' }, 반짝반짝: { 모션: '번쩍', 효과: '금가루' }, 지글: { 모션: '흔들기', 효과: '불꽃' },
};
// AI 스토리보드 칸 위에 늘 보이는 의성어 칩 (나머지는 사전에서)
const ONO_CHIPS = ['쾅', '두둥', '휙', '스르르', '반짝', '두근', '뿅', '띠용', '우르르', '촤르륵', '펑', '지지직'];
const ONO_KEYS = Object.keys(ONO).sort((a, b) => b.length - a.length);

function onoLookup(w) {
  const raw = String(w || '').trim(); const s = raw.replace(/[~!…·.,\s-]+/g, '');
  if (!s) return null;
  if (ONO[s]) return Object.assign({ word: raw }, ONO[s]);
  const half = s.length % 2 === 0 ? s.slice(0, s.length / 2) : null; // 쾅쾅 → 쾅
  if (half && half + half === s && ONO[half]) return Object.assign({ word: raw }, ONO[half]);
  const c = s.replace(/(.)\1+/g, '$1'); // 휘리리릭 → 휘리릭, 쾅쾅쾅 → 쾅
  if (ONO[c]) return Object.assign({ word: raw, near: c }, ONO[c]);
  for (const k of ONO_KEYS) if (s.includes(k) || c.includes(k)) return Object.assign({ word: raw, near: k }, ONO[k]);
  return null;
}
// 괄호 안이 의성어로 보이는지: 사전에 있거나, 숫자·기호 없이 짧은 한글(5자 이하)
const looksOno = s => !!onoLookup(s) || /^[가-힣~!]{1,5}$/.test(String(s).trim());

const BOARD_INFO = { 상품: 'product', 상품명: 'product', 제품: 'product', 정가: 'list', 원가: 'list', 가격: 'price', 판매가: 'price', 할인가: 'price', 할인: 'rate', 할인율: 'rate', 형식: 'fmt', 길이: 'dur', 테마: 'theme', 느낌: 'feel' };
function boardInfoLine(line) {
  const parts = line.split('/'); if (!parts.length) return null;
  const info = {};
  for (const p of parts) { const i = p.indexOf(':'); if (i <= 0) return null; const k = BOARD_INFO[p.slice(0, i).trim()]; if (!k) return null; info[k] = p.slice(i + 1).trim(); }
  if (info.fmt) { const m = info.fmt.match(/(\d+(?:\.\d+)?)\s*초/); if (m && !info.dur) info.dur = m[1]; info.fmt = info.fmt.replace(/\d+(?:\.\d+)?\s*초/, '').trim(); }
  if (info.dur) info.dur = String(parseFloat(info.dur) || '');
  return info;
}
const cleanText = s => String(s).replace(/\{/g, '（').replace(/\}/g, '）').replace(/\s#/g, ' ＃').replace(/\s+/g, ' ').trim();
const normDan = s => String(s).replace(/^※\s*/, '').trim();

function parseBoardBeat(line, ln) {
  let body = line, dan = '';
  const di = body.indexOf('※'); if (di >= 0) { dan = normDan(body.slice(di)); body = body.slice(0, di); }
  const srcs = []; body = body.replace(/@([^\s/\[\]()（）{}]+)/g, (_, n) => { srcs.push(n); return ' '; });
  const ono = [], unknown = [];
  body = body.replace(/\(([^()]*)\)/g, (m, inner) => {
    const words = inner.split(/[,，\s]+/).filter(Boolean);
    if (!words.length || !words.every(looksOno)) return m; // (모바일 10% 할인 시) 같은 건 글자로 둠
    words.forEach(w => { const f = onoLookup(w); if (f) ono.push(f); else unknown.push(w); });
    return ' ';
  });
  const emph = /\[[^\]]+\]/.test(body);
  body = body.replace(/\[([^\]]+)\]/g, (_, t) => '*' + t.trim() + '*');
  const lines = body.split('/').map(cleanText).filter(Boolean);
  return { lines, emph, ono, unknown, src: srcs[0] || '', srcs, dan, ln, raw: line };
}

function parseAiBoard(text) {
  const info = {}, req = [], dans = [], beats = [];
  String(text || '').split(/\r?\n/).forEach((raw, ln) => {
    const line = raw.trim(); if (!line) return;
    if (line.startsWith('#')) { const r = line.replace(/^#+\s*/, ''); if (r) req.push(r); return; }
    if (line.startsWith('※')) { const d = normDan(line); if (d) dans.push(d); return; }
    if (!beats.length) { const inf = boardInfoLine(line); if (inf) { Object.assign(info, inf); return; } }
    const b = parseBoardBeat(line, ln); if (b.lines.length || b.src) beats.push(b);
  });
  const unknownOno = [...new Set(beats.flatMap(b => b.unknown))];
  return { info, req, dan: dans[0] || '', beats, unknownOno };
}

// ---------- 규칙 연출 (AI 키가 없을 때도 동작) ----------
const PRICE_RE = /(\d[\d,]*)\s*원/;
const plainOf = b => b.lines.join(' ').replace(/\*/g, '');
function beatKind(b, i, n, assets) {
  const t = plainOf(b);
  if (PRICE_RE.test(t)) return 'price';
  if (b.src && assets[b.src]) return 'product';
  if (/\d[\d,.]*\s*(만|억|천)?\s*(개|병|통|세트|박스|명|건|팩)\s*(판매|돌파|완판|구매)/.test(t)) return 'counter';
  if (/(마감|한정|오늘만|방송\s*끝나면|곧\s*종료|매진|놓치면|이번\s*방송)/.test(t) && i === n - 1) return 'urgent';
  if (b.lines.length === 1 && /^\*[^*]{1,7}\*$/.test(b.lines[0])) return 'impact';
  return 'typo';
}
function mergeOno(list) { const o = {}; (list || []).forEach(f => { ['모션', '전환', '효과'].forEach(k => { if (f[k] && !o[k]) o[k] = f[k]; else if (k === '효과' && f[k] && !o[k].includes(f[k])) o[k] += '+' + f[k]; }); }); return o; }
function wonOf(s) { const m = String(s || '').match(/(\d[\d,]*)/); return m ? Number(m[1].replace(/,/g, '')) : 0; }
const wonStr = n => n ? n.toLocaleString('ko-KR') + '원' : '';

function directBoard(board, ctx) {
  const info = board.info, fmt = normFmt(info.fmt || ctx.fmt), tong = fmt === '통강조';
  const assets = ctx.assets || {}, feel = ctx.feel || '보통', seed = ctx.seed || 1;
  const head = Object.assign({}, ctx.head || {});
  head.형식 = fmt; delete head.L바; delete head.머리; delete head.꼬리; delete head.틀;
  const dur = Math.min(FORMATS[fmt].max, parseFloat(info.dur) || (normFmt(ctx.fmt) === fmt ? ctx.dur : 0) || FORMATS[fmt].dur);
  head.길이 = String(dur);
  if (tong) { const p = String(info.product || '').trim(); if (p) head.머리 = p.replace(/\*/g, ''); if (ctx.head && ctx.head.틀) head.틀 = ctx.head.틀; if (ctx.head && ctx.head.꼬리) head.꼬리 = ctx.head.꼬리; }
  else if (ctx.head && ctx.head.L바 && normFmt(ctx.fmt) === fmt) head.L바 = ctx.head.L바;
  if (board.dan) head.단서 = board.dan; else delete head.단서;
  const listP = wonOf(info.list), priceP = wonOf(info.price) || (listP && parseFloat(info.rate) ? Math.round(listP * (1 - parseFloat(info.rate) / 100) / 10) * 10 : 0);
  const rate = listP && priceP && listP > priceP ? Math.round((1 - priceP / listP) * 100) : 0;
  const pool = tong ? ['쾅', '펀치', '두근', '흔들기', '번쩍'] : feel === '강하게' ? ['스탬프', '쾅', '팝', '펀치', '드롭'] : feel === '부드럽게' ? ['블러', '슬라이드', '팝', '타이핑'] : ['팝', '슬라이드', '스탬프', '블러', '쾅'];
  const scenes = [], n = board.beats.length;
  board.beats.forEach((b, i) => {
    const kind = beatKind(b, i, n, assets), o = {}, fx = mergeOno(b.ono);
    o.모션 = fx.모션 || pool[(i + seed) % pool.length];
    if (fx.전환) o.전환 = fx.전환; if (fx.효과) o.효과 = fx.효과;
    if (b.dan) o.단서 = b.dan;
    let lines = b.lines.slice();
    if (b.src && assets[b.src]) { if (kind === 'product') o.이미지 = b.src; else if (assets[b.src].video) o.영상 = b.src; else o.이미지 = b.src; }
    if (kind === 'price') {
      const t = lines.join(' / '), m = t.replace(/\*/g, '').match(PRICE_RE), p = m ? Number(m[1].replace(/,/g, '')) : priceP;
      const pre = t.replace(/\*/g, '').split(PRICE_RE)[0].replace(/\/\s*$/, '').trim();
      lines = [pre || '단,', wonStr(p)];
      if (listP && listP > p) { o.정가 = wonStr(listP); o.할인 = Math.round((1 - p / listP) * 100) + '%'; o.가격모션 = '내려가기'; }
      if (!fx.모션) delete o.모션;
    }
    if (kind === 'typo' && lines.length >= 2) o.스타일 = '쌓기';
    if (kind === 'impact' && !fx.모션) o.모션 = tong ? '쾅' : ['쾅', '펀치', '스탬프'][(seed + i) % 3];
    scenes.push({ label: BLOCK_LABEL[kind] || '타이포', lines, opts: o });
  });
  // AI 자유도(규칙판): 가격을 정보 줄에만 썼으면 끝에 가격 장면, 상품 사진이 있는데 아무 장면에도 안 썼으면 상품 장면 하나
  if (ctx.freedom !== false) {
    if (priceP && !scenes.some(s => s.label === BLOCK_LABEL.price)) scenes.push({ label: BLOCK_LABEL.price, lines: ['단,', wonStr(priceP)], opts: Object.assign(listP > priceP ? { 정가: wonStr(listP), 할인: rate + '%', 가격모션: '내려가기' } : {}, { 모션: tong ? '번쩍' : '스탬프' }) });
    const usedSrc = new Set(board.beats.flatMap(b => b.srcs));
    const img = Object.keys(assets).find(k => k !== '로고' && !assets[k].video && !usedSrc.has(k));
    if (!tong && img && info.product && !scenes.some(s => s.opts.이미지)) scenes.splice(Math.min(1, scenes.length), 0, { label: BLOCK_LABEL.product, lines: [String(info.product).includes('*') ? info.product : '*' + info.product + '*'], opts: { 이미지: img, 모션: '슬라이드' } });
    if (tong && scenes.length > 3) { const keep = [scenes[0], ...scenes.slice(1).filter(s => s.label === BLOCK_LABEL.price).slice(-1)]; while (keep.length < 2 && scenes.length > keep.length) keep.splice(1, 0, scenes[keep.length]); scenes.splice(0, scenes.length, ...keep); }
  }
  if (!scenes.length && info.product) scenes.push({ label: '타이포', lines: ['*' + info.product + '*'], opts: { 모션: pool[0] } });
  return serializeSettings(head) + '\n' + scenes.map(s => serializeScene(s)).join('\n');
}

// ---------- 심의 표현 체크 (법률 판단이 아니라 검토를 돕는 경고) ----------
const RISK_RULES = [
  { re: /최저\s*가|최저\s*가격|가장\s*싼|최저가격/, why: '최저가는 비교 기준(채널·기간)을 단서로 밝혀야 해요', dan: '최저가 기준 | NS 판매가 기준, 방송 기간 한정' },
  { re: /(국내|업계|세계|최초)\s*최초|최초/, why: '최초는 근거 자료를 단서로 밝혀야 해요', dan: '최초 기준 | 자사 조사 기준' },
  { re: /최고|최상|최강|넘버\s*원|No\.?\s*1|1\s*위/i, why: '최고·1위는 출처와 기준을 밝혀야 해요', dan: '1위 기준 | 조사 기관·기간 명시' },
  { re: /100\s*%|완벽|무조건|절대/, why: '100%·완벽·무조건은 과장 표현으로 보일 수 있어요', dan: '' },
  { re: /완치|치료|특효|약효|질병\s*예방/, why: '치료·완치는 의약품으로 오인될 수 있어요 (식품·화장품 주의)', dan: '' },
  { re: /유일|독점|단독\s*최저/, why: '유일·독점은 근거를 밝혀야 해요', dan: '' },
  { re: /무료|공짜|(?<![\d,.])0\s*원/, why: '무료는 조건(배송비·기간 등)을 단서로 밝혀야 해요', dan: '무료 조건 | 조건은 방송 화면 참고' },
];
function riskCheck(text, hasDan) {
  const plain = String(text || '').replace(/[*{}\[\]]/g, ' ');
  const out = [];
  RISK_RULES.forEach(r => { const m = plain.match(r.re); if (m) out.push({ word: m[0].trim(), why: r.why, dan: hasDan ? '' : r.dan }); });
  return out;
}

// ---------- AI 연출 (Claude) ----------
function aiBoardGrammarDoc() {
  const ono = Object.entries(ONO).map(([k, v]) => `${k}→${Object.entries(v).map(([a, b]) => a + ' ' + b).join(', ')}`).join(' · ');
  return `사용자가 쓰는 "AI 스토리보드" 글 문법 (당신이 받는 입력):
- 한 줄이 한 장면의 재료. / 는 화면 줄바꿈. [ ] 안은 강조 자막(편집용 문법의 *별표*로 옮김).
- ( ) 안은 효과 의성어. 사전에 있으면 그 연출을 기본으로 쓰고, 없는 의성어는 소리·느낌에 가장 가까운 모션·전환·효과로 해석. ( )가 없으면 당신이 판단.
- @이름 은 그 장면에 쓸 소스(이미지 또는 영상). 없으면 당신이 소스 목록에서 어울리는 컷을 골라도 됨.
- # 으로 시작하는 줄은 사용자의 요청(화면에 내지 않음). ※ 로 시작하는 줄은 단서 자막(제목 | 내용).
- 첫 줄의 상품: / 정가: / 가격: / 형식: 은 상품 정보.
의성어 사전: ${ono}
영상 소스: 장면 옵션 영상: 이름 이면 그 장면 배경에 영상을 깔고(글자가 잘 보이게 어둡게 처리됨), 이미지: 이름 에 영상 이름을 쓰면 상품 컷 자리에 영상이 재생됨. 시작: 초 로 영상의 시작 위치를 정함.
편집 자유도: 줄을 합치거나 나눠도 되고, 오프닝·가격 강조·한정·마무리 장면을 더해도 됨. 단 사용자가 쓴 문구와 강조는 빠뜨리지 말 것.`;
}
async function claudeRequest(apiKey, body) {
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
    if (res.status === 529 || res.status === 503) throw new Error('AI 서버가 바빠요. 잠시 뒤에 다시 시도해 주세요.');
    throw new Error(`AI 요청 실패 (${res.status}): ${msg}`);
  }
  if (data.stop_reason === 'refusal') throw new Error('AI가 이 요청을 처리하지 않았어요. 문구를 바꿔서 다시 시도해 주세요.');
  if (data.stop_reason === 'max_tokens') throw new Error('AI 답이 너무 길어 잘렸어요. 다시 시도해 주세요.');
  const text = (data.content || []).find(b => b.type === 'text');
  if (!text) throw new Error('AI 답을 읽지 못했어요.');
  try { return JSON.parse(text.text); } catch (_) { throw new Error('AI 답을 읽지 못했어요. 다시 시도해 주세요.'); }
}
function aiBoardSystem() {
  return [{ type: 'text', cache_control: { type: 'ephemeral' }, text: `당신은 한국 홈쇼핑 방송의 그래픽 종합편집 PD입니다. 사용자가 쓴 짧은 AI 스토리보드 글과 상품 소스를 보고, 시선을 붙잡는 리듬과 모션으로 필러 영상을 완성합니다. 결과는 아래 편집용 스토리보드 문법으로만 냅니다.\n\n${aiGrammarDoc()}\n\n${aiBoardGrammarDoc()}` }];
}
function trendBrief(trends, max = 24) { return (trends || []).slice(0, max).map(t => `- ${t.pattern}${t.example ? ` (예: ${String(t.example).slice(0, 60)})` : ''}`).join('\n'); }
function prefBrief(prefs, max = 10) {
  return (prefs || []).slice(0, max).map(p => p.kind === 'edit' ? `- 사용자가 고친 예: AI안 "${String(p.from || '').slice(0, 160)}" → 최종 "${String(p.to || '').slice(0, 160)}"` : `- 마음에 들어 한 안 '${p.name || ''}': ${p.concept || ''} [옵션 흐름: ${String(p.head || '').slice(0, 240)}]`).join('\n');
}
function sourceBlocks(sources) {
  const out = [];
  (sources || []).forEach(s => {
    out.push({ type: 'text', text: `소스 ${s.name} (${s.video ? `영상 ${s.dur ? s.dur.toFixed(1) + '초' : ''}, 앞·중간·끝 장면` : '이미지'})` });
    if (s.thumb) out.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: s.thumb } });
  });
  return out;
}
async function aiBoardDirect({ apiKey, boardText, fmt, dur, head, sources, trends, prefs, n = 3 }) {
  const user = [...sourceBlocks(sources), { type: 'text', text:
`만들 형식: ${fmt} · 길이 ${dur}초
지금 설정 줄(테마·폰트 등, 바꿔도 됨): ${serializeSettings(head || {})}
${trends && trends.length ? `\n요즘 광고·그래픽 트렌드 노트(참고):\n${trendBrief(trends)}\n` : ''}${prefs && prefs.length ? `\n이 사용자가 좋아한 연출·고친 내용(우선 반영):\n${prefBrief(prefs)}\n` : ''}
사용자의 AI 스토리보드:
${boardText}

서로 분명히 다른 연출 ${n}안을 만들어 주세요. 안마다 테마·모션·전환·효과의 조합과 리듬을 다르게 하고, 각 안의 name은 6자 안팎의 짧은 이름, concept는 연출 의도 한 문장.` }];
  const out = await claudeRequest(apiKey, {
    model: 'claude-opus-5-5', max_tokens: 24000,
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: { type: 'object', properties: { versions: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, concept: { type: 'string' }, storyboard: { type: 'string', description: '편집용 스토리보드 전체 (첫 줄 설정 + 장면 줄)' } }, required: ['name', 'concept', 'storyboard'], additionalProperties: false } } }, required: ['versions'], additionalProperties: false } } },
    system: aiBoardSystem(),
    messages: [{ role: 'user', content: user }],
  });
  return (out.versions || []).map(v => ({ name: String(v.name || 'AI 안').slice(0, 16), concept: v.concept || '', storyboard: String(v.storyboard || '').trim() }));
}
async function aiRedoScene({ apiKey, storyboard, index, boardText, sources, trends, prefs }) {
  const lines = storyboard.split('\n'); const sceneLines = lines.filter(l => /^\s*\[/.test(l));
  const user = [...sourceBlocks(sources), { type: 'text', text:
`지금 편집용 스토리보드:
${storyboard}

사용자의 AI 스토리보드:
${boardText || '(없음)'}
${trends && trends.length ? `\n트렌드 노트(참고):\n${trendBrief(trends, 12)}\n` : ''}${prefs && prefs.length ? `\n이 사용자가 좋아한 연출:\n${prefBrief(prefs, 6)}\n` : ''}
${index + 1}번째 장면(${sceneLines[index] || ''})만 다른 연출로 다시 써 주세요. 문구의 뜻과 강조는 유지하고 블록·모션·전환·효과·배경을 새롭게. 앞뒤 장면과 같은 모션은 피하기. 장면 한 줄만 냅니다.` }];
  const out = await claudeRequest(apiKey, {
    model: 'claude-opus-5-5', max_tokens: 8000,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: { type: 'object', properties: { line: { type: 'string', description: '[블록] 문구 {옵션} 한 줄' }, why: { type: 'string' } }, required: ['line', 'why'], additionalProperties: false } } },
    system: aiBoardSystem(),
    messages: [{ role: 'user', content: user }],
  });
  return { line: String(out.line || '').split('\n')[0].trim(), why: out.why || '' };
}
// 직접 넣은 광고 카피·캡처 → 연출 패턴 (트렌드 노트용, 가벼운 Haiku 5.5)
async function aiTrendPatterns({ apiKey, text, images }) {
  const content = (images || []).map(d => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: d } }));
  content.push({ type: 'text', text: `${text ? `사용자가 본 광고 카피·그래픽 문구:\n${text}\n\n` : ''}${images && images.length ? '위 광고 캡처도 함께 보고, ' : ''}홈쇼핑 필러(L바 그래픽·통강조)에 옮겨 쓸 수 있는 연출·카피 패턴을 3~10개 뽑아 주세요.` });
  const out = await claudeRequest(apiKey, {
    model: 'claude-haiku-5-5', max_tokens: 4000,
    output_config: { format: { type: 'json_schema', schema: { type: 'object', properties: { items: { type: 'array', items: { type: 'object', properties: { pattern: { type: 'string', description: '옮겨 쓸 연출·카피 패턴 한 줄 (예: 숫자 하나만 화면 가득, 쾅 하고 멈춤)' }, example: { type: 'string', description: '그 패턴이 보인 원문 (짧게)' }, tags: { type: 'array', items: { type: 'string' } } }, required: ['pattern', 'example', 'tags'], additionalProperties: false } } }, required: ['items'], additionalProperties: false } } },
    system: '당신은 한국 홈쇼핑 그래픽 PD를 돕는 트렌드 리서처입니다. 사용자가 본 광고의 카피·캡처를 보고 카피 구조·강조 방식·모션·전환·색감 패턴으로 일반화합니다. 원문을 길게 베끼지 않습니다. tags는 가격·임팩트·감성·타이포·전환·색감 같은 말 2~4개.',
    messages: [{ role: 'user', content }],
  });
  return out.items || [];
}
// 규칙판 '이 장면만 다시': 모션·전환을 바꿔 줌
function redoSceneRule(storyboard, index, seed) {
  const lines = storyboard.split('\n'); let k = -1;
  for (let i = 0; i < lines.length; i++) if (/^\s*\[/.test(lines[i]) && ++k === index) {
    const p = parseStoryboard(lines[i]).scenes[0]; if (!p) return storyboard;
    const motions = Object.keys(MOTIONS).filter(m => m !== p.opts.모션 && m !== '네온'), trans = TRANSITIONS.filter(t => t !== '자동' && t !== p.opts.전환);
    p.opts.모션 = motions[(seed * 7 + index) % motions.length]; p.opts.전환 = trans[(seed * 3 + index) % trans.length];
    p.opts.배경 = String(1 + ((parseInt(p.opts.배경) || 1) % 3));
    lines[i] = serializeScene({ label: p.label, lines: p.lines, opts: p.opts }); break;
  }
  return lines.join('\n');
}
