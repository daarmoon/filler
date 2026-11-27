const { chromium } = require('playwright'); const path=require('path');
(async()=>{const b=await chromium.launch({args:['--ignore-certificate-errors']});const p=await b.newPage();
await p.goto('file://'+path.resolve('dist/hardfiller-maker.html'));await p.waitForTimeout(1200);
console.log(await p.evaluate(async()=>{const out={has:typeof AudioEncoder!=='undefined'};
for(const c of ['mp4a.40.2','opus']){try{out[c]=(await AudioEncoder.isConfigSupported({codec:c,sampleRate:48000,numberOfChannels:2,bitrate:192000})).supported}catch(e){out[c]='ERR '+e.message}}
return out;}));await b.close();})();
