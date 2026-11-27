#!/usr/bin/env node
// src/ 를 합쳐서 브라우저로 바로 여는 단일 HTML(dist/hardfiller-maker.html)을 만듭니다. 윈도우 앱도 이 파일을 엽니다.
const fs = require('fs'); const path = require('path');
const root = path.join(__dirname, '..'), src = path.join(root, 'src');
const order = ['core.js', 'themes.js', 'effects.js', 'props.js', 'blocks.js', 'tong.js', 'storyboard.js', 'insert.js', 'director.js', 'themes2.js', 'aiboard.js', 'render.js', 'imageproc.js', 'export.js', 'templates.js', 'sources.js', 'aipane.js', 'app.js'];
const read = f => fs.readFileSync(f, 'utf8');
const vendor = ['mp4-muxer.js', 'webm-muxer.js'].map(f => read(path.join(root, 'vendor', f))).join('\n');
const lbar = fs.readFileSync(path.join(root, 'assets', 'lbar-guide.png')).toString('base64');
const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'assets', 'ns-logo-128.png')).toString('base64'); // NS 로고 (화면 왼쪽 위·탭 아이콘)
const version = JSON.parse(read(path.join(root, 'package.json'))).version;
// v10 트렌드 노트: 빌드할 때 trends/notes.json(Actions가 trends 브랜치에서 받아 둠)이 있으면 처음부터 넣어 둠. 앱은 열 때 최신본을 다시 받음
const trendsFile = path.join(root, 'trends', 'notes.json');
let trends = 'null'; try { const j = JSON.parse(read(trendsFile)); if (j && Array.isArray(j.items)) trends = JSON.stringify({ updated: j.updated, items: j.items.slice(0, 80), sources: j.sources || [], note: j.note || '' }); } catch (_) { }
const app = `const LBAR_DATA = "data:image/png;base64,${lbar}";\nconst APP_VERSION = "${version}";\nconst TRENDS_DATA = ${trends};\n` + order.map(f => read(path.join(src, f))).join('\n');
const esc = s => s.replace(/<\/script/g, '<\\/script');
let html = read(path.join(src, 'index.html'));
html = html.replace(/__LOGO_DATA__/g, () => logo).replace('/*__VENDOR__*/', () => esc(vendor)).replace('/*__APP__*/', () => esc(app));
const out = path.join(root, 'dist', 'hardfiller-maker.html');
fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, html);
console.log(out, Math.round(html.length / 1024), 'KB');
