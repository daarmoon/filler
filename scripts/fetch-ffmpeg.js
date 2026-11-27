#!/usr/bin/env node
// 윈도우 앱에 넣을 ffmpeg(송출용 MXF 변환용)를 내려받습니다: node scripts/fetch-ffmpeg.js win32-x64
// 출처: ffmpeg-static 프로젝트의 정적 빌드 (FFmpeg는 GPL/LGPL 라이선스, vendor/ffmpeg/README.md 참고)
const fs = require('fs'); const path = require('path'); const https = require('https'); const zlib = require('zlib');
const target = process.argv[2] || `${process.platform}-${process.arch}`;
const tag = process.env.FFMPEG_BINARY_RELEASE || 'b6.1.1';
const dir = path.join(__dirname, '..', 'vendor', 'ffmpeg', target);
const exe = path.join(dir, target.startsWith('win32') ? 'ffmpeg.exe' : 'ffmpeg');
if (fs.existsSync(exe) && fs.statSync(exe).size > 1e6) { console.log('이미 있어요:', exe); process.exit(0); }
fs.mkdirSync(dir, { recursive: true });
const get = (url, n = 0) => new Promise((res, rej) => https.get(url, { headers: { 'User-Agent': 'hardfiller-maker-build' } }, r => {
  if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location && n < 8) { r.resume(); return res(get(r.headers.location, n + 1)); }
  if (r.statusCode !== 200) { r.resume(); return rej(new Error('HTTP ' + r.statusCode + ' ' + url)); }
  res(r);
}).on('error', rej));
(async () => {
  for (const [name, file] of [[`ffmpeg-${target}.gz`, exe], [`${target}.LICENSE`, path.join(dir, 'LICENSE.txt')], [`${target}.README`, path.join(dir, 'README.txt')]]) {
    const url = `https://github.com/eugeneware/ffmpeg-static/releases/download/${tag}/${name}`;
    try {
      const r = await get(url); const out = fs.createWriteStream(file);
      await new Promise((res, rej) => (name.endsWith('.gz') ? r.pipe(zlib.createGunzip()) : r).pipe(out).on('finish', res).on('error', rej));
      console.log('받음:', file, fs.statSync(file).size, 'bytes');
    } catch (e) { if (name.endsWith('.gz')) { console.error('ffmpeg를 받지 못했어요:', e.message); process.exit(1); } else console.warn('건너뜀:', name, e.message); }
  }
  if (!target.startsWith('win32')) fs.chmodSync(exe, 0o755);
})();
