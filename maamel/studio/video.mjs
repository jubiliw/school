export function initial(){return {files:[],clips:[],selected:null}}
export function trim(clip,start,end){
 if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end>clip.duration+.001||end-start<.05)throw Error('اختر بداية ونهاية داخل مدة المقطع.');
 return {...clip,start,end};
}
function openMedia(){
 return new Promise((resolve,reject)=>{const req=indexedDB.open('maamel-film-media',1);req.onupgradeneeded=()=>req.result.createObjectStore('files');req.onerror=()=>reject(req.error);req.onsuccess=()=>resolve(req.result)});
}
async function media(id,blob){
 const db=await openMedia();
 try{return await new Promise((resolve,reject)=>{const tx=db.transaction('files',blob?'readwrite':'readonly');const files=tx.objectStore('files');const req=blob?files.put(blob,id):files.get(id);tx.oncomplete=()=>resolve(req.result);tx.onabort=()=>reject(tx.error)})}finally{db.close()}
}
function metadata(url){
 return new Promise((resolve,reject)=>{const probe=document.createElement('video');probe.preload='metadata';probe.onloadedmetadata=()=>{const duration=probe.duration;probe.removeAttribute('src');probe.load();Number.isFinite(duration)&&duration>.05?resolve(duration):reject(Error('مدة غير مدعومة'))};probe.onerror=()=>reject(Error('تعذر قراءة صيغة الفيديو'));probe.src=url});
}
export function mount(host,state,change){
 host.innerHTML='<section class="cut-studio"><header><button data-import>فتح ملفات الفيديو</button><input hidden type="file" multiple accept="video/*"><button data-export>تصدير الفيلم</button></header><div class="cut-panels"><section><h3>قائمة التشغيل</h3><div data-bin></div></section><section><h3>المصدر</h3><video controls playsinline></video></section></div><h3>المخطط الزمني</h3><div class="track"></div><div class="cut-controls"><label>من <input data-start type="number" step=".01" min="0"></label><label>إلى <input data-end type="number" step=".01"></label><button data-trim>قص</button><button data-before>تقديم</button><button data-after>تأخير</button><button data-remove>إزالة</button></div><output role="status"></output></section>';
 state.files??=state.clips.map(c=>({...c}));
 const $=s=>host.querySelector(s),player=$('video'),file=$('[type=file]'),note=$('output');
 let dead=false,busy=false,epoch=0,cancelExport;
 const urls=new Map();
 const selected=()=>state.clips.find(c=>c.id===state.selected);
 const message=e=>{if(!dead)note.textContent=e.message||e};
 const save=()=>change(structuredClone(state));
 async function urlFor(id){if(!urls.has(id)){const file=await media(id);if(!file)throw Error('ملف الفيديو غير موجود على الجهاز');if(dead)throw Error('أُغلق المشروع');if(!urls.has(id))urls.set(id,URL.createObjectURL(file))}return urls.get(id)}
 function draw(){
  const ticket=++epoch,c=selected(),index=state.clips.indexOf(c);
  $('.track').replaceChildren();$('[data-bin]').replaceChildren();
  for(const asset of state.files){
   const row=document.createElement('p'),add=document.createElement('button');
   add.textContent='＋';add.title=add.ariaLabel='إضافة '+asset.name+' إلى المخطط الزمني';
   add.onclick=()=>{const clip={...asset,id:crypto.randomUUID(),fileId:asset.id,start:0,end:asset.duration};state.clips.push(clip);state.selected=clip.id;save();draw()};
   row.append(add,document.createTextNode(' '+asset.name));$('[data-bin]').append(row);
  }
  for(const [i,clip] of state.clips.entries()){
   const b=document.createElement('button');b.textContent=(i+1)+' · '+clip.name+' ('+(clip.end-clip.start).toFixed(1)+' ث)';b.setAttribute('aria-pressed',String(c===clip));b.onclick=()=>{state.selected=clip.id;save();draw()};$('.track').append(b);

  }
  for(const op of ['trim','before','after','remove','export'])$('[data-'+op+']').disabled=!c;
  $('[data-before]').disabled=index<1;$('[data-after]').disabled=!c||index===state.clips.length-1;
  $('[data-start]').value=c?.start??0;$('[data-end]').value=c?.end??0;
  player.pause();if(!c){player.removeAttribute('src');player.load();return}
  urlFor(c.fileId??c.id).then(url=>{if(ticket!==epoch||dead)return;player.src=url;player.onloadedmetadata=()=>{player.currentTime=c.start}}).catch(message);
 }
 player.ontimeupdate=()=>{const c=selected();if(c&&!player.paused&&player.currentTime>=c.end)player.pause()};
 player.onplay=()=>{const c=selected();if(c&&(player.currentTime>=c.end||player.currentTime<c.start))player.currentTime=c.start};
 $('[data-import]').onclick=()=>file.click();file.onchange=async()=>{
  try{for(const f of file.files){const url=URL.createObjectURL(f);try{const duration=await metadata(url),id=crypto.randomUUID();if(dead)return;await media(id,f);if(dead)return;state.files.push({id,name:f.name,duration});save();message('أُضيف الملف إلى قائمة التشغيل. اضغط ＋ لإضافته إلى المخطط الزمني.')}finally{URL.revokeObjectURL(url)}}}catch(e){message(e)}finally{if(!dead){file.value='';draw()}}
 };
 $('[data-trim]').onclick=()=>{try{const c=selected();state.clips[state.clips.indexOf(c)]=trim(c,$('[data-start]').valueAsNumber,$('[data-end]').valueAsNumber);save();draw()}catch(e){message(e)}};
 for(const [op,step] of [['before',-1],['after',1]])$('[data-'+op+']').onclick=()=>{const i=state.clips.indexOf(selected());const [clip]=state.clips.splice(i,1);state.clips.splice(i+step,0,clip);save();draw()};
 $('[data-remove]').onclick=()=>{state.clips=state.clips.filter(c=>c!==selected());state.selected=state.clips[0]?.id??null;save();draw()};
 $('[data-export]').onclick=async()=>{
  if(busy)return;const canvas=document.createElement('canvas'),clipPlayer=document.createElement('video');clipPlayer.playsInline=true;
  if(!window.MediaRecorder||!canvas.captureStream){message('تصدير الفيديو غير متاح في هذا المتصفح.');return}
  player.pause();busy=true;const editor=host.querySelector('.cut-studio');editor.inert=true;
  let ctx,stream,recorder,frame,stopClip;const chunks=[];
  cancelExport=()=>{stopClip?.();clipPlayer.pause();if(recorder?.state==='recording')recorder.stop()};
  try{
   const clips=structuredClone(state.clips);
   canvas.width=1280;canvas.height=720;const g=canvas.getContext('2d');stream=canvas.captureStream(30);
   ctx=new AudioContext();await ctx.resume();const out=ctx.createMediaStreamDestination();ctx.createMediaElementSource(clipPlayer).connect(out);stream.addTrack(out.stream.getAudioTracks()[0]);
   recorder=new MediaRecorder(stream);recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
   const finished=new Promise(resolve=>recorder.onstop=resolve);recorder.start();recorder.pause();
   for(const [i,c] of clips.entries()){
    if(dead)break;message('تصدير المقطع '+(i+1)+' من '+clips.length);
    const url=await urlFor(c.fileId??c.id);
    await new Promise((resolve,reject)=>{stopClip=resolve;clipPlayer.onloadedmetadata=resolve;clipPlayer.onerror=()=>reject(Error('تعذرت قراءة المقطع'));clipPlayer.src=url});
    if(dead)break;
    if(c.start){await new Promise(resolve=>{stopClip=resolve;clipPlayer.onseeked=resolve;clipPlayer.currentTime=c.start})}
    if(dead)break;
    await clipPlayer.play();if(dead)break;recorder.resume();
    await new Promise(resolve=>{stopClip=resolve;clipPlayer.onended=resolve;const paint=()=>{if(dead||clipPlayer.currentTime>=c.end)return resolve();const scale=Math.min(canvas.width/clipPlayer.videoWidth,canvas.height/clipPlayer.videoHeight);const w=clipPlayer.videoWidth*scale,h=clipPlayer.videoHeight*scale;g.fillStyle='black';g.fillRect(0,0,canvas.width,canvas.height);g.drawImage(clipPlayer,(canvas.width-w)/2,(canvas.height-h)/2,w,h);frame=requestAnimationFrame(paint)};paint()});
    cancelAnimationFrame(frame);clipPlayer.pause();if(recorder.state==='recording')recorder.pause();
   }
   if(recorder.state!=='inactive')recorder.stop();await finished;if(dead)return;
   const blob=new Blob(chunks,{type:recorder.mimeType});if(!blob.size)throw Error('التصدير فارغ');
   const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='فيلمي.'+(blob.type.includes('mp4')?'mp4':'webm');a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);message('تم تصدير الفيلم');
  }catch(e){message(e)}finally{cancelAnimationFrame(frame);clipPlayer.pause();clipPlayer.removeAttribute('src');clipPlayer.load();stream?.getTracks().forEach(t=>t.stop());await ctx?.close();busy=false;cancelExport=null;editor.inert=false}
 };
 draw();return ()=>{dead=true;epoch++;cancelExport?.();player.pause();for(const url of urls.values())URL.revokeObjectURL(url)};
}
