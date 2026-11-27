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
});
