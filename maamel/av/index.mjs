import {recorderWindow,videoWindow,displayWave} from './window.mjs';
import coast from './coast.mjs';
import {initial,rate,pack,unpack,testTone,wav} from './model.mjs';
export function mount(host,state,onChange,task){let s={...initial(),...state},ended=false;
 const root=document.createElement('section');root.dir='rtl';root.className='av-lab';host.replaceChildren(root);
 const watch=task==='watch';root.innerHTML=watch?videoWindow:recorderWindow;
 const $=q=>root.querySelector(q),note=m=>$('output').textContent=m,ch=n=>{s=n;onChange(s);};
 if(watch){$('video').src=coast;$('input').value=s.birds;$('select').value=s.place;$('input').oninput=e=>ch({...s,birds:e.target.value});$('select').onchange=e=>ch({...s,place:e.target.value});$('button').onclick=()=>{ch({...s,answers:{birds:s.birds,place:s.place}});note('حُفظت الإجابات.');};return ()=>{$('video').pause();};}
 let timer=0,meter=0,startTime=0,recorder=null,stream=null,url=null,context=null,tone=null,recording=false,pcm=unpack(s.clip?.pcm)||null;const audio=$('audio');
 const clock=seconds=>{$('[data-clock]').textContent='00:'+Math.max(0,seconds).toFixed(1).padStart(4,'0');};
 function libraryItem(){const button=$('[data-library]');button.disabled=!s.clip;button.textContent=s.clip?s.clip.folder+' / '+s.clip.name:'لا يوجد مقطع محفوظ';}
 function playfile(){if(url)URL.revokeObjectURL(url);if(pcm){url=URL.createObjectURL(new Blob([wav(pcm)],{type:'audio/wav'}));audio.src=url;}
  displayWave($('canvas'),pcm);clock(pcm?pcm.length/rate:0);libraryItem();
 }
 $('[data-library]').onclick=()=>{if(recording||!s.clip)return;pcm=unpack(s.clip.pcm);playfile();audio.play().catch(()=>note('اضغط تشغيل للاستماع إلى المقطع.'));};
 function release(){clearTimeout(timer);clearInterval(meter);stream?.getTracks().forEach(t=>t.stop());stream=null;if(tone){try{tone.stop();}catch{}tone=null;}if(context){context.close().catch(()=>{});context=null;}}
 function controls(active){recording=active;root.classList.toggle('is-recording',active);$('[data-library]').disabled=active||!s.clip;$('[data-start]').disabled=active;$('[data-stop]').disabled=!active;$('[data-save]').disabled=active;$('select').disabled=active;}
 async function stop(){if(!recording)return;const secs=Math.min(15,(performance.now()-startTime)/1000);clearTimeout(timer);clearInterval(meter);
 if(recorder?.state==='recording'){recorder.stop();return;}
 release();controls(false);pcm=testTone(secs);playfile();note('مدة التسجيل '+secs.toFixed(1)+' ثانية.');}
 $('[data-start]').onclick=async()=>{if(recording)return;controls(true);$('[data-stop]').disabled=true;try{const AC=window.AudioContext||window.webkitAudioContext;context=new AC();
 if($('select').value==='mic'){if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw Error('لا يتوفر تسجيل الميكروفون في هذا المتصفح.');stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});if(ended){release();return;}recorder=new MediaRecorder(stream);let chunks=[];recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
 recorder.onstop=async()=>{try{if(ended)return;const blob=new Blob(chunks,{type:recorder.mimeType});const decoded=await context.decodeAudioData(await blob.arrayBuffer());if(ended)return;const data=decoded.getChannelData(0),n=Math.min(rate*15,Math.floor(data.length*rate/decoded.sampleRate));pcm=Uint8Array.from({length:n},(_,i)=>Math.max(0,Math.min(255,Math.round(128+127*data[Math.floor(i*decoded.sampleRate/rate)]))));playfile();note('مدة تسجيل الميكروفون '+(n/rate).toFixed(1)+' ثانية.');}catch{note('تعذر فتح التسجيل. أعد المحاولة أو اختر النغمة.');}finally{release();controls(false);recorder=null;}};recorder.start();}
 else{tone=context.createOscillator();const gain=context.createGain();gain.gain.value=.075;tone.frequency.value=330;tone.connect(gain);gain.connect(context.destination);await context.resume();tone.start();}startTime=performance.now();audio.pause();clock(0);$('[data-stop]').disabled=false;meter=setInterval(()=>{const t=(performance.now()-startTime)/1000;clock(t);if(tone)tone.frequency.value=t%1>.5?440:330;note('جارٍ التسجيل · '+Math.floor(t)+' ثانية');},180);timer=setTimeout(stop,15000);note('جارٍ التسجيل.');}catch(err){release();controls(false);note(err.name==='NotAllowedError'?'لم تُمنح صلاحية الميكروفون. يمكنك اختيار النغمة.':'تعذر بدء التسجيل.');}};
 $('[data-stop]').onclick=stop;for(const [key,sel]of [['folder','[data-folder]'],['name','[data-name]']]){const input=$(sel);input.value=s[key];input.oninput=()=>ch({...s,[key]:input.value});}
 $('[data-save]').onclick=()=>{if(!pcm?.length||!s.folder.trim()||!s.name.trim())return note('سجّل مقطعًا وأدخل اسم المجلد واسم الملف.');ch({...s,clip:{name:s.name.trim(),folder:s.folder.trim(),pcm:pack(pcm)}});libraryItem();note('حُفظ المقطع في مجلد '+s.folder);};playfile();
 return ()=>{ended=true;if(recorder?.state==='recording')recorder.stop();release();if(url)URL.revokeObjectURL(url);audio.pause();};
}
