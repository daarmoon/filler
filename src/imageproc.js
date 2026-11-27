// ===== imageproc.js : 이미지 소스 처리 (배경 제거, 자동 자르기) =====
function imageToCanvas(img) {
  const c = document.createElement('canvas'); c.width = img.naturalWidth || img.width; c.height = img.naturalHeight || img.height;
  c.getContext('2d').drawImage(img, 0, 0); return c;
}

// 가장자리에서 시작해 배경색과 비슷한 픽셀을 지우는 방식 (흰 배경·단색 배경 상품컷용)
function removeBackground(src, tolerance = 40, feather = 2) {
  const w = src.width, h = src.height;
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.drawImage(src, 0, 0); const id = g.getImageData(0, 0, w, h); const d = id.data;
  // 가장자리 색 표본
  const samples = [];
  const push = (x, y) => { const i = (y * w + x) * 4; if (d[i + 3] > 10) samples.push([d[i], d[i + 1], d[i + 2]]); };
  for (let x = 0; x < w; x += Math.max(1, w >> 6)) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y += Math.max(1, h >> 6)) { push(0, y); push(w - 1, y); }
  if (!samples.length) return c;
  // 대표색 몇 개 (간단 군집)
  const refs = [];
  for (const s of samples) if (!refs.some(r => Math.abs(r[0] - s[0]) + Math.abs(r[1] - s[1]) + Math.abs(r[2] - s[2]) < 30)) refs.push(s);
  const tol = tolerance * 3;
  const near = i => { for (const r of refs) if (Math.abs(d[i] - r[0]) + Math.abs(d[i + 1] - r[1]) + Math.abs(d[i + 2] - r[2]) <= tol) return true; return false; };
  const mask = new Uint8Array(w * h); const stack = [];
  for (let x = 0; x < w; x++) { stack.push(x, (h - 1) * w + x); }
  for (let y = 0; y < h; y++) { stack.push(y * w, y * w + w - 1); }
  while (stack.length) {
    const p = stack.pop(); if (mask[p]) continue; const i = p * 4;
    if (d[i + 3] < 10 || near(i)) {
      mask[p] = 1; const x = p % w, y = (p / w) | 0;
      if (x > 0) stack.push(p - 1); if (x < w - 1) stack.push(p + 1); if (y > 0) stack.push(p - w); if (y < h - 1) stack.push(p + w);
    }
  }
  for (let p = 0; p < w * h; p++) if (mask[p]) d[p * 4 + 3] = 0;
  g.putImageData(id, 0, 0);
  if (feather > 0) { // 가장자리 부드럽게
    const m = document.createElement('canvas'); m.width = w; m.height = h; const mg = m.getContext('2d');
    mg.filter = `blur(${feather}px)`; mg.drawImage(c, 0, 0);
    const out = document.createElement('canvas'); out.width = w; out.height = h; const og = out.getContext('2d');
    og.drawImage(c, 0, 0); og.globalCompositeOperation = 'destination-in'; og.drawImage(m, 0, 0);
    return autoCrop(out);
  }
  return autoCrop(c);
}

function autoCrop(c) {
  const g = c.getContext('2d'); const { width: w, height: h } = c; const d = g.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 12) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return c;
  const o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1;
  o.getContext('2d').drawImage(c, -x0, -y0); return o;
}

// 상품 사진 둘레의 빈 여백(투명 또는 단색 배경)을 잘라냄 → 화면에서 상품이 더 크게 보임
function trimMargins(c, tol = 22) {
  const w = c.width, h = c.height; if (w < 8 || h < 8) return c;
  const d = c.getContext('2d').getImageData(0, 0, w, h).data, px = (x, y) => (y * w + x) * 4;
  const corners = [px(0, 0), px(w - 1, 0), px(0, h - 1), px(w - 1, h - 1)];
  const transparent = corners.every(i => d[i + 3] < 16);
  const ref = [0, 1, 2].map(k => corners.reduce((a, i) => a + d[i + k], 0) / 4);
  if (!transparent && corners.some(i => Math.abs(d[i] - ref[0]) + Math.abs(d[i + 1] - ref[1]) + Math.abs(d[i + 2] - ref[2]) > tol * 2)) return c; // 테두리가 단색이 아니면 그대로
  const bg = (x, y) => { const i = px(x, y); return transparent ? d[i + 3] < 16 : (d[i + 3] < 16 || Math.abs(d[i] - ref[0]) + Math.abs(d[i + 1] - ref[1]) + Math.abs(d[i + 2] - ref[2]) <= tol * 3); };
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (!bg(x, y)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return c;
  const pad = Math.round(Math.max(x1 - x0, y1 - y0) * .025);
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad + 1); y1 = Math.min(h - 1, y1 + pad + 1);
  if ((x1 - x0) * (y1 - y0) > w * h * .9) return c; // 여백이 거의 없으면 그대로
  const o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1; o.getContext('2d').drawImage(c, -x0, -y0); return o;
}

function loadImageFromURL(url) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
}

// 상품 이미지에서 대표 색 뽑기 (흰/검정/회색·투명 픽셀은 빼고 채도 높은 색 위주)
function extractColors(src, n = 5) {
  const S = 72, sc = Math.min(1, S / Math.max(src.width, src.height));
  const w = Math.max(1, Math.round(src.width * sc)), h = Math.max(1, Math.round(src.height * sc));
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.drawImage(src, 0, 0, w, h); const d = g.getImageData(0, 0, w, h).data;
  const bins = new Map();
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    const [hh, ss, ll] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
    if (ll > .94 || ll < .06) continue;
    const gray = ss < .18;
    const key = gray ? 'g' + Math.round(ll * 4) : Math.round(hh / 15) % 24 + '_' + Math.round(ll * 3);
    const wgt = gray ? .15 : (.4 + ss) * (1 - Math.abs(ll - .5));
    const b = bins.get(key) || { r: 0, g: 0, b: 0, w: 0 };
    b.r += d[i] * wgt; b.g += d[i + 1] * wgt; b.b += d[i + 2] * wgt; b.w += wgt; bins.set(key, b);
  }
  const out = [...bins.values()].filter(b => b.w > 0).sort((a, b) => b.w - a.w)
    .map(b => '#' + [b.r, b.g, b.b].map(v => Math.round(v / b.w).toString(16).padStart(2, '0')).join(''));
  const pick = [];
  for (const hx of out) { const a = hexToRgb(hx); if (!pick.some(p => { const q = hexToRgb(p); return Math.abs(a[0] - q[0]) + Math.abs(a[1] - q[1]) + Math.abs(a[2] - q[2]) < 70; })) pick.push(hx); if (pick.length >= n) break; }
  return pick;
}
