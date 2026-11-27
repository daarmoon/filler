// ===== export.js : 영상 파일 내보내기 (WebCodecs + MP4/WebM 먹서) =====
async function pickVideoCodec(fps, ow = W, oh = H) {
  if (typeof VideoEncoder === 'undefined') return null;
  const base = { width: ow, height: oh, framerate: fps, bitrate: ow * oh > 1e6 ? 24_000_000 : 8_000_000 };
  const tries = [
    { fmt: 'mp4', codec: 'avc1.640033', muxCodec: 'avc' },
    { fmt: 'mp4', codec: 'avc1.4d0033', muxCodec: 'avc' },
    { fmt: 'mp4', codec: 'avc1.42003e', muxCodec: 'avc' },
    { fmt: 'webm', codec: 'vp09.00.41.08', muxCodec: 'V_VP9' },
    { fmt: 'webm', codec: 'vp8', muxCodec: 'V_VP8' },
  ];
  for (const c of tries) {
    const cfg = Object.assign({ codec: c.codec, avc: c.muxCodec === 'avc' ? { format: 'avc' } : undefined }, base);
    try { const r = await VideoEncoder.isConfigSupported(cfg); if (r.supported) return Object.assign({ cfg }, c); } catch (_) { }
  }
  return null;
}

// (주의: app.js의 renderBgm은 음악 칸 UI라서 이름을 다르게 둬야 함. 같은 이름이면 UI 함수가 덮어써서 음악이 빠짐)
async function mixBgmAudio(proj, total) {
  const a = proj.bgm; if (!a || !a.buffer) return null;
  const sr = 48000, len = Math.ceil(total * sr);
  const oc = new OfflineAudioContext(2, len, sr);
  const src = oc.createBufferSource(); src.buffer = a.buffer;
  const g = oc.createGain(); const vol = (a.volume ?? 80) / 100;
  const fade = Math.min(a.fade ?? 1.5, total / 2);
  g.gain.setValueAtTime(vol, 0); g.gain.setValueAtTime(vol, Math.max(0, total - fade)); g.gain.linearRampToValueAtTime(0, total);
  src.connect(g); g.connect(oc.destination); src.start(0, a.offset || 0);
  return await oc.startRendering();
}

async function exportVideo(proj, opt, onProgress) {
  const fps = opt.fps || 29.97;
  setStage(stageOf(proj)); const [OW, OH] = STAGES[STAGE].out; const scaled = OW !== W || OH !== H;
  const vc = await pickVideoCodec(fps, OW, OH);
  if (!vc) throw new Error('이 브라우저는 영상 인코딩(WebCodecs)을 지원하지 않아요. 최신 Chrome 또는 Edge에서 열어주세요.');
  const total = proj.total;
  const nFrames = Math.round(total * fps);
  let audioBuf = null, ac = null, aMux = null;
  if (proj.bgm && proj.bgm.buffer && opt.audio !== false) {
    audioBuf = await mixBgmAudio(proj, total);
    const order = vc.fmt === 'mp4' ? [['mp4a.40.2', 'aac'], ['opus', 'opus']] : [['opus', 'A_OPUS']];
    for (const [codec, mux] of order) {
      const acfg = { codec, sampleRate: 48000, numberOfChannels: 2, bitrate: 192000 };
      try { if (typeof AudioEncoder !== 'undefined' && (await AudioEncoder.isConfigSupported(acfg)).supported) { ac = acfg; aMux = mux; break; } } catch (_) { }
    }
  }
  let muxer;
  if (vc.fmt === 'mp4') {
    muxer = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), fastStart: 'in-memory',
      video: { codec: 'avc', width: OW, height: OH, frameRate: Math.round(fps) },
      audio: ac ? { codec: aMux, sampleRate: 48000, numberOfChannels: 2 } : undefined });
  } else {
    muxer = new WebMMuxer.Muxer({ target: new WebMMuxer.ArrayBufferTarget(),
      video: { codec: vc.muxCodec, width: OW, height: OH, frameRate: Math.round(fps) },
      audio: ac ? { codec: aMux, sampleRate: 48000, numberOfChannels: 2 } : undefined });
  }
  let encErr = null;
  const ve = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: e => encErr = e });
  ve.configure(vc.cfg);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
  // 통강조는 3배 크기로 그린 뒤 376×790으로 줄여서 저장 (글자 가장자리가 더 깨끗함)
  const out = scaled ? document.createElement('canvas') : cv; if (scaled) { out.width = OW; out.height = OH; }
  const octx = scaled ? out.getContext('2d') : null; if (octx) octx.imageSmoothingQuality = 'high';
  const view = { showLbar: !!opt.withLbar && STAGE === 'wide', showSafe: false, warn: false, hints: false };
  const usPerFrame = 1e6 / fps;
  for (let f = 0; f < nFrames; f++) {
    if (encErr) throw encErr;
    if (opt.cancel && opt.cancel()) { ve.close(); throw new Error('취소했어요.'); }
    renderFrame(ctx, proj, f / fps, view);
    if (octx) { octx.clearRect(0, 0, OW, OH); octx.drawImage(cv, 0, 0, OW, OH); }
    const frame = new VideoFrame(out, { timestamp: Math.round(f * usPerFrame), duration: Math.round(usPerFrame) });
    ve.encode(frame, { keyFrame: f % 15 === 0 });
    frame.close();
    while (ve.encodeQueueSize > 6) await new Promise(r => setTimeout(r, 2));
    if (f % 5 === 0) { onProgress && onProgress(f / nFrames * (ac ? .92 : 1)); await new Promise(r => setTimeout(r, 0)); }
  }
  await ve.flush(); ve.close();
  if (ac && audioBuf) {
    const ae = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: e => encErr = e });
    ae.configure(ac);
    const ch0 = audioBuf.getChannelData(0), ch1 = audioBuf.numberOfChannels > 1 ? audioBuf.getChannelData(1) : ch0;
    const N = 1024;
    for (let i = 0; i < audioBuf.length; i += N) {
      const n = Math.min(N, audioBuf.length - i); const data = new Float32Array(n * 2);
      data.set(ch0.subarray(i, i + n), 0); data.set(ch1.subarray(i, i + n), n);
      const ad = new AudioData({ format: 'f32-planar', sampleRate: 48000, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(i / 48000 * 1e6), data });
      ae.encode(ad); ad.close();
      if (ae.encodeQueueSize > 20) await new Promise(r => setTimeout(r, 1));
    }
    await ae.flush(); ae.close();
  }
  if (encErr) throw encErr;
  muxer.finalize();
  onProgress && onProgress(1);
  const buf = muxer.target.buffer;
  return { blob: new Blob([buf], { type: vc.fmt === 'mp4' ? 'video/mp4' : 'video/webm' }), ext: vc.fmt, codec: vc.codec, size: OW + '×' + OH, audio: ac ? ac.codec : null, wantedAudio: !!(proj.bgm && proj.bgm.buffer && opt.audio !== false) };
}

// 저장: 윈도우 앱이면 저장 창(마지막 폴더 기억), 브라우저면 다운로드. 앱에서는 저장한 경로를 돌려줌
const APP = (typeof window !== 'undefined' && window.hfm && window.hfm.isApp) ? window.hfm : null;
const SAVE_FILTERS = { mp4: [{ name: 'MP4 영상', extensions: ['mp4'] }], webm: [{ name: 'WebM 영상', extensions: ['webm'] }], png: [{ name: 'PNG 이미지', extensions: ['png'] }], json: [{ name: '하드필러 프로젝트', extensions: ['json'] }] };
async function downloadBlob(blob, name) {
  if (APP) return APP.saveFile(name, await blob.arrayBuffer(), SAVE_FILTERS[(name.split('.').pop() || '').toLowerCase()]);
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  return name;
}
// 앱 전용: MP4를 송출 서버용 MXF로 (ffmpeg 내장)
async function makeMxf(path, fps, hasAudio, total, onMsg) {
  const off = APP.onMxfProgress(sec => onMsg(`MXF로 바꾸는 중… ${Math.min(100, Math.round(sec / total * 100))}%`));
  try { return await APP.toMxf(path, fps, hasAudio, total); } finally { off(); }
}
