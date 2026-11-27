// 화면(렌더러)에 꼭 필요한 기능만 window.hfm 으로 열어 줌
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('hfm', {
  isApp: true,
  info: () => ipcRenderer.invoke('hfm:info'),
  saveFile: (name, data, filters) => ipcRenderer.invoke('hfm:saveFile', { name, data, filters }),
  pickFolder: () => ipcRenderer.invoke('hfm:pickFolder'),
  writeFile: (dir, name, data) => ipcRenderer.invoke('hfm:writeFile', { dir, name, data }),
  showItem: p => ipcRenderer.invoke('hfm:showItem', p),
  toMxf: (input, fps, hasAudio, total) => ipcRenderer.invoke('hfm:toMxf', { input, fps, hasAudio, total }),
  onMxfProgress: cb => { const f = (_e, sec) => cb(sec); ipcRenderer.on('hfm:mxfProgress', f); return () => ipcRenderer.removeListener('hfm:mxfProgress', f); },
  // v10 상품 폴더 (고른 폴더 안의 사진·영상만)
  pickSourceFolder: () => ipcRenderer.invoke('hfm:pickSourceFolder'),
  listFolder: dir => ipcRenderer.invoke('hfm:listFolder', dir),
  readFile: p => ipcRenderer.invoke('hfm:readFile', p),
  videoProxy: p => ipcRenderer.invoke('hfm:videoProxy', p),
  watchFolder: (dir, cb) => {
    const f = (_e, d) => { if (d === dir) cb(); }; ipcRenderer.on('hfm:folderChanged', f); ipcRenderer.invoke('hfm:watchFolder', dir);
    return () => { ipcRenderer.removeListener('hfm:folderChanged', f); ipcRenderer.invoke('hfm:unwatchFolder', dir); };
  },
  // v10 API 키 (Windows 암호화 저장소)
  secretGet: () => ipcRenderer.invoke('hfm:secretGet'),
  secretSet: v => ipcRenderer.invoke('hfm:secretSet', v),
});
