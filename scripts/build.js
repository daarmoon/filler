#!/usr/bin/env node
// src/ 를 합쳐서 브라우저로 바로 여는 단일 HTML(dist/hardfiller-maker.html)을 만듭니다. 윈도우 앱도 이 파일을 엽니다.
const fs = require('fs'); const path = require('path');
const root = path.join(__dirname, '..'), src = path.join(root, 'src');
const order = ['core.js', 'themes.js', 'effects.js', 'props.js', 'blocks.js', 'tong.js', 'storyboard.js', 'insert.js', 'director.js', 'themes2.js', 'render.js', 'imageproc.js', 'export.js', 'templates.js', 'app.js'];
const read = f => fs.readFileSync(f, 'utf8');
const vendor = ['mp4-muxer.js', 'webm-muxer.js'].map(f => read(path.join(root, 'vendor', f))).join('\n');
const lbar = fs.readFileSync(path.join(root, 'assets', 'lbar-guide.png')).toString('base64');
const version = JSON.parse(read(path.join(root, 'package.json'))).version;
const app = `const LBAR_DATA = "data:image/png;base64,${lbar}";\nconst APP_VERSION = "${version}";\n` + order.map(f => read(path.join(src, f))).join('\n');
const esc = s => s.replace(/<\/script/g, '<\\/script');
let html = read(path.join(src, 'index.html'));
html = html.replace('/*__VENDOR__*/', () => esc(vendor)).replace('/*__APP__*/', () => esc(app));
const out = path.join(root, 'dist', 'hardfiller-maker.html');
fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, html);
console.log(out, Math.round(html.length / 1024), 'KB');
