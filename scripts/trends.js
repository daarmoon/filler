#!/usr/bin/env node
// 트렌드 노트 만들기 (GitHub Actions가 3시간마다 실행: .github/workflows/trends.yml)
// 1) trends/sources.json 의 사이트를 robots.txt를 지키며 읽고, 화면 글자(제목·문구·링크 글·이미지 설명)만 뽑음 (영상·이미지는 받지 않음)
// 2) 뽑은 글자 원문은 출처 주소와 함께 raw/날짜.json 에 쌓음 (14일 보관)
// 3) ANTHROPIC_API_KEY가 있으면 Claude Haiku 5.5가 '홈쇼핑 필러에 쓸 만한 연출·카피 패턴'으로 요약해 notes.json 을 새로 씀
// 사용: TRENDS_DIR=출력폴더 node scripts/trends.js   (TRENDS_FIXTURE=폴더 이면 인터넷 대신 그 폴더의 html로 시험)
const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..');
const OUT = path.resolve(process.env.TRENDS_DIR || path.join(ROOT, 'trends-out'));
const FIXTURE = process.env.TRENDS_FIXTURE || '';
const UA = 'FillerMakersTrendBot/1.0'; // 개인 정보·저장소 주소를 넣지 않은 일반 이름
const KEEP_DAYS = 14, MAX_TEXTS = 400, MAX_ITEMS = 60;
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'trends', 'sources.json'), 'utf8'));

async function get(url, ms = 20000) {
  if (FIXTURE) {
    const u = new URL(url); const f = path.join(FIXTURE, (u.hostname + (u.pathname === '/robots.txt' ? '_robots.txt' : '.html')));
    if (!fs.existsSync(f)) return { status: 404, text: '' };
    return { status: 200, text: fs.readFileSync(f, 'utf8') };
  }
  const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9' }, redirect: 'follow', signal: ctl.signal });
    const buf = Buffer.from(await r.arrayBuffer()); return { status: r.status, text: buf.slice(0, 3e6).toString('utf8') };
  } finally { clearTimeout(to); }
}

// ---------- robots.txt: 우리 이름이나 * 에 해당하는 규칙 중 가장 긴 것이 이김 (Allow가 같은 길이면 허용) ----------
function robotsRules(txt) {
  const groups = []; let cur = null, lastUA = false;
  for (const raw of String(txt).split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim(); if (!line) continue;
    const i = line.indexOf(':'); if (i < 0) continue;
    const k = line.slice(0, i).trim().toLowerCase(), v = line.slice(i + 1).trim();
    if (k === 'user-agent') { if (!lastUA) { cur = { agents: [], rules: [] }; groups.push(cur); } cur.agents.push(v.toLowerCase()); lastUA = true; continue; }
    lastUA = false; if (!cur) continue;
    if (k === 'allow' || k === 'disallow') cur.rules.push({ allow: k === 'allow', path: v });
  }
  const me = UA.split('/')[0].toLowerCase();
  const mine = groups.filter(g => g.agents.some(a => a !== '*' && me.includes(a)));
  return (mine.length ? mine : groups.filter(g => g.agents.includes('*'))).flatMap(g => g.rules);
}
function robotsAllows(rules, urlPath) {
  const toRe = p => new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
  let best = null;
  for (const r of rules) { if (!r.path) continue; if (toRe(r.path).test(urlPath) && (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow))) best = r; }
  return !best || best.allow;
}

// ---------- 글자 뽑기: 제목·메타·제목 태그·링크 글·이미지 설명·페이지 안 JSON 데이터의 한글 문구 ----------
const decode = s => String(s).replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
const strip = s => decode(String(s).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
function extractTexts(html) {
  const out = []; const push = s => { s = strip(s); if (s.length >= 2 && s.length <= 160 && !/^(https?:|\/\/|\{|\[)/.test(s) && /[가-힣A-Za-z]/.test(s)) out.push(s); };
  const m1 = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i); if (m1) push(m1[1]);
  for (const m of html.matchAll(/<meta[^>]+(?:name|property)=["'](?:description|og:title|og:description|twitter:title|twitter:description|keywords)["'][^>]*>/gi)) { const c = m[0].match(/content=["']([^"']*)["']/i); if (c) push(c[1]); }
  for (const m of html.matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi)) push(m[1]);
  for (const m of html.matchAll(/<(?:a|button|strong|em|b|p|span|li|figcaption)[^>]*>([^<]{2,160})<\/(?:a|button|strong|em|b|p|span|li|figcaption)>/gi)) push(m[1]);
  for (const m of html.matchAll(/<img[^>]+alt=["']([^"']{2,160})["']/gi)) push(m[1]);
  for (const m of html.matchAll(/<script[^>]*(?:application\/(?:ld\+)?json|__NEXT_DATA__|__NUXT)[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { const walk = v => { if (typeof v === 'string') { if (/[가-힣]/.test(v) && v.length <= 160) push(v); } else if (v && typeof v === 'object') Object.values(v).forEach(walk); }; walk(JSON.parse(m[1])); } catch (_) { }
  }
  // 흔한 메뉴 글자는 뺌
  const junk = /^(로그인|회원가입|검색|메뉴|홈|더보기|이전|다음|닫기|확인|취소|top|login|sign ?in|sign ?up|menu|search|home|more|close)$/i;
  return [...new Set(out)].filter(s => !junk.test(s)).slice(0, MAX_TEXTS);
}

async function readSource(src) {
  const res = { name: src.name, url: src.url, ok: false, reason: '', at: new Date().toISOString(), texts: [] };
  try {
    const u = new URL(src.url);
    const rb = await get(u.origin + '/robots.txt', 10000).catch(e => ({ status: 0, text: '', err: e }));
    if (rb.status >= 500 || rb.status === 0) { res.reason = 'robots.txt를 읽지 못해 건너뜀'; return res; }
    if (rb.status === 200 && !robotsAllows(robotsRules(rb.text), u.pathname + u.search)) { res.reason = 'robots.txt가 막아 둠'; return res; }
    const pg = await get(src.url);
    if (pg.status !== 200) { res.reason = `HTTP ${pg.status}`; return res; }
    res.texts = extractTexts(pg.text);
    res.ok = res.texts.length > 0; if (!res.ok) res.reason = '글자를 찾지 못함 (화면을 스크립트로 그리는 사이트일 수 있음)';
  } catch (e) { res.reason = '연결 실패: ' + (e.name === 'AbortError' ? '시간 초과' : e.message); }
  return res;
}

// ---------- Claude Haiku 5.5 요약 ----------
const SCHEMA = { type: 'object', properties: { items: { type: 'array', items: { type: 'object', properties: {
  pattern: { type: 'string', description: '홈쇼핑 필러(L바 그래픽·통강조)에 옮겨 쓸 수 있는 연출·카피 패턴 한 줄. 예: "숫자 하나만 화면 가득 크게, 쾅 하고 멈춤"' },
  example: { type: 'string', description: '그 패턴이 보인 원문 문구 (짧게)' },
  tags: { type: 'array', items: { type: 'string' }, description: '가격·임팩트·감성·타이포·전환·색감 등 2~4개' },
  source: { type: 'string', description: '출처 사이트 이름' },
}, required: ['pattern', 'example', 'tags', 'source'], additionalProperties: false } } }, required: ['items'], additionalProperties: false };
async function summarize(results, prev) {
  let Anthropic; try { Anthropic = require('@anthropic-ai/sdk'); Anthropic = Anthropic.default || Anthropic; } catch (_) { return null; }
  const client = new Anthropic();
  const corpus = results.filter(r => r.ok).map(r => `### ${r.name} (${r.url})\n${r.texts.slice(0, 250).join('\n')}`).join('\n\n');
  if (!corpus) return null;
  const msg = await client.messages.create({
    model: 'claude-haiku-5-5', max_tokens: 12000,
    output_config: { format: { type: 'json_schema', schema: SCHEMA } },
    system: '당신은 한국 홈쇼핑 그래픽 PD를 돕는 트렌드 리서처입니다. 광고·모션그래픽 사이트에서 뽑은 화면 글자를 보고, 홈쇼핑 필러(짧은 그래픽 영상)에 옮겨 쓸 수 있는 카피 구조·강조 방식·모션·전환·색감 패턴을 뽑습니다. 원문을 길게 베끼지 말고 패턴으로 일반화하세요. 사이트 메뉴·로그인 같은 화면 글자는 무시합니다.',
    messages: [{ role: 'user', content: `지난번 노트(겹치면 빼고 새 것 위주):\n${(prev.items || []).slice(0, 30).map(i => '- ' + i.pattern).join('\n') || '(없음)'}\n\n이번에 읽은 화면 글자:\n${corpus}\n\n패턴을 8~20개 뽑아 주세요.` }],
  });
  const t = (msg.content || []).find(b => b.type === 'text');
  return t ? JSON.parse(t.text).items : null;
}

(async () => {
  fs.mkdirSync(path.join(OUT, 'raw'), { recursive: true });
  const readme = path.join(OUT, 'README.md');
  if (!fs.existsSync(readme)) fs.writeFileSync(readme, '# 필러메이커스 트렌드 노트\n\nGitHub Actions(main의 .github/workflows/trends.yml)가 3시간마다 자동으로 갱신하는 브랜치예요.\n\n- notes.json: AI가 정리한 연출·카피 패턴 (앱이 열 때 받아 씀)\n- raw/날짜.json: 사이트에서 뽑은 화면 글자 원문과 출처 주소 (14일 보관, robots.txt가 허용한 주소만)\n');
  const notesFile = path.join(OUT, 'notes.json');
  let prev = {}; try { prev = JSON.parse(fs.readFileSync(notesFile, 'utf8')); } catch (_) { }
  const results = [];
  for (const s of cfg.sources) { const r = await readSource(s); results.push(r); console.log(`${s.name}: ${r.ok ? `글자 ${r.texts.length}개` : r.reason}`); }
  // 원문(뽑은 글자)은 날짜별로 쌓고 오래된 것은 지움
  const now = new Date(), day = now.toISOString().slice(0, 10), rawFile = path.join(OUT, 'raw', day + '.json');
  let raw = []; try { raw = JSON.parse(fs.readFileSync(rawFile, 'utf8')); } catch (_) { }
  raw.push({ at: now.toISOString(), sources: results }); fs.writeFileSync(rawFile, JSON.stringify(raw, null, 1));
  for (const f of fs.readdirSync(path.join(OUT, 'raw'))) { const d = Date.parse(f.slice(0, 10)); if (d && now - d > KEEP_DAYS * 864e5) fs.rmSync(path.join(OUT, 'raw', f)); }
  let items = null, note = '';
  if (!process.env.ANTHROPIC_API_KEY) note = '저장소 Secrets에 ANTHROPIC_API_KEY를 넣으면 읽은 글자를 AI가 연출 패턴으로 정리해요. 지금은 원문만 모으는 중.';
  else if (!results.some(r => r.ok)) note = '이번에는 읽을 수 있는 사이트가 없었어요. 지난 노트를 유지해요.';
  else { try { items = await summarize(results, prev); } catch (e) { note = 'AI 요약 실패: ' + e.message; console.error(e.message); } }
  const stamp = now.toISOString();
  const fresh = (items || []).map((it, i) => { const src = results.find(r => r.name === it.source) || results.find(r => r.ok) || {}; return { id: stamp.replace(/\D/g, '').slice(0, 12) + '-' + i, pattern: it.pattern, example: it.example, tags: it.tags, source: src.name || it.source, url: src.url || '', at: stamp }; });
  // 새 패턴을 앞에, 지난 패턴은 뒤에 이어서 최대 60개 (같은 문장은 하나만)
  const seen = new Set(); const merged = [...fresh, ...(prev.items || [])].filter(i => { const k = String(i.pattern).replace(/\s/g, ''); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, MAX_ITEMS);
  const notes = { updated: fresh.length ? stamp : (prev.updated || null), checked: stamp, items: merged, sources: results.map(r => ({ name: r.name, url: r.url, ok: r.ok, reason: r.reason, texts: r.texts.length })), note };
  fs.writeFileSync(notesFile, JSON.stringify(notes, null, 1));
  console.log(`노트 ${merged.length}개 (새로 ${fresh.length}개)${note ? ' · ' + note : ''}`);
})().catch(e => { console.error(e); process.exit(1); });
