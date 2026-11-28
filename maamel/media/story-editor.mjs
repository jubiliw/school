import {pack,rate} from '../av/model.mjs'
import {el,button,select,field} from '../office-common/ui.mjs'
import {paintFrame,soundBuffer} from './story.mjs'
export function mountStory(host,initial,changed){
 let story=initial??{scenes:[],audio:null,revision:0},index=0,dead=false,stop=null,view=0
 const panel=el('section'),bar=el('header'),board=el('div'),tools=el('div'),canvas=el('canvas'),status=el('output')
 panel.className='photo-story';canvas.width=640;canvas.height=360;canvas.style.cssText='width:100%;max-width:640px;display:block;background:#182427'
 const cache=new Map(),note=s=>status.textContent=s
 function image(src){if(!cache.has(src)){const img=new Image();img.src=src;cache.set(src,img.decode().then(()=>img))}return cache.get(src)}
 function update(next){if(dead)return false;if(new Blob([JSON.stringify(next)]).size>475000){note('المساحة ممتلئة. استخدم صورًا أصغر أو صوتًا أقصر.');return false}
  story={...next,revision:(story.revision??0)+1,exportRevision:null};changed(story);return true}
 function edit(patch){const scenes=story.scenes.map((s,i)=>i===index?{...s,...patch}:s);if(update({...story,scenes}))draw()}
 function draw(){
  const ticket=++view;board.replaceChildren();tools.replaceChildren()
  story.scenes.forEach((s,i)=>{const b=button((i+1)+' · '+s.name,()=>{index=i;draw()});b.setAttribute('aria-pressed',String(i===index));board.append(b)})
  const scene=story.scenes[index];paintFrame(canvas,null,{},0);if(!scene)return
  image(scene.src).then(img=>{if(!dead&&ticket===view&&!stop)paintFrame(canvas,img,scene,.35)}).catch(()=>note('تعذرت قراءة الصورة.'))
  const title=el('input'),seconds=el('input');title.maxLength=80;title.value=scene.title;title.onchange=()=>edit({title:title.value.trim()});seconds.type='number';seconds.min=1;seconds.max=10;seconds.value=scene.duration;seconds.onchange=()=>{if(seconds.reportValidity()&&Number.isInteger(seconds.valueAsNumber))edit({duration:seconds.valueAsNumber})}
  function choice(label,key,options){const c=select(label,options,value=>edit({[key]:value}));c.value=scene[key];return field(label,c)}
  function move(step){const dest=index+step;if(dest<0||dest>=story.scenes.length)return;const scenes=[...story.scenes];[scenes[index],scenes[dest]]=[scenes[dest],scenes[index]];index=dest;update({...story,scenes});draw()}
  tools.append(field('النص',title),choice('نمط النص','style',[['plain','عادي'],['adventure','المغامرة']]),choice('التأثير','effect',[['none','بدون'],['sparkles','بريق العدسة']]),choice('الحركة','motion',[['none','ثابتة'],['panzoom','تحريك وتكبير']]),field('المدة بالثواني',seconds),button('تقديم',()=>move(-1)),button('تأخير',()=>move(1)),button('إزالة',()=>{const scenes=story.scenes.filter((_,i)=>i!==index);index=Math.max(0,index-1);update({...story,scenes});draw()}))
 }
 function upload(label,accept,multiple,handler){const f=el('input');f.type='file';f.accept=accept;f.multiple=multiple;f.hidden=true;f.onchange=async()=>{try{for(const file of f.files){if(dead)return;await handler(file)}}catch{note('تعذرت قراءة الملف.')}finally{f.value=''}};bar.append(button(label,()=>f.click()),f)}
 upload('إضافة صور','image/jpeg,image/png,image/webp',true,async file=>{
  if(file.size>20*1024*1024)throw Error();const url=URL.createObjectURL(file)
  try{const img=new Image();img.src=url;await img.decode();if(dead)return;const c=el('canvas'),scale=Math.min(1,600/Math.max(img.width,img.height));c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height)
   const scene={src:c.toDataURL('image/jpeg',.55),name:file.name.slice(0,70),title:'',style:'plain',motion:'none',effect:'none',duration:3}
   if(update({...story,scenes:[...story.scenes,scene]})){index=story.scenes.length-1;draw()}
  }finally{URL.revokeObjectURL(url)}
 })
 upload('إضافة صوت مخصص','audio/*,video/*',false,async file=>{
  if(file.size>20*1024*1024)throw Error();const ctx=new AudioContext()
  try{const audio=await ctx.decodeAudioData(await file.arrayBuffer()),raw=audio.getChannelData(0),len=Math.min(rate*15,Math.floor(rate*audio.duration))
   const pcm=Uint8Array.from({length:len},(_,i)=>128+Math.round(127*Math.max(-1,Math.min(1,raw[Math.floor(i*audio.sampleRate/rate)]))))
   if(update({...story,audio:{name:file.name.slice(0,70),pcm:pack(pcm)}}))note('أضيف صوت '+file.name+' · '+(len/rate).toFixed(1)+' ثانية')
  }finally{await ctx.close()}
 })
 async function play(exporting){
  if(dead||stop||!story.scenes.length)return
  const snapshot=story;let cancelled=false,ctx,stream,recorder,frame,finish
  stop=()=>{cancelled=true;cancelAnimationFrame(frame);finish?.()};bar.inert=board.inert=tools.inert=true
  try{
   if(exporting&&(!canvas.captureStream||!window.MediaRecorder))throw Error('التصدير غير متاح في هذا المتصفح.')
   ctx=new AudioContext();await ctx.resume()
   const images=await Promise.all(snapshot.scenes.map(s=>image(s.src)));if(cancelled)return
   const out=exporting?ctx.createMediaStreamDestination():ctx.destination,chunks=[]
   if(exporting){stream=canvas.captureStream(24);stream.addTrack(out.stream.getAudioTracks()[0]);recorder=new MediaRecorder(stream);recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)}}
   const ended=recorder&&new Promise(resolve=>{recorder.onstop=resolve})
   const buffer=soundBuffer(ctx,snapshot.audio?.pcm);if(buffer){const source=ctx.createBufferSource();source.buffer=buffer;source.connect(out);source.start()}
   recorder?.start();const start=performance.now()
   await new Promise(resolve=>{finish=resolve;function tick(){let t=(performance.now()-start)/1000
    for(const [i,scene] of snapshot.scenes.entries()){if(t<scene.duration){paintFrame(canvas,images[i],scene,t/scene.duration);frame=requestAnimationFrame(tick);return}t-=scene.duration}resolve()
   }tick()})
   if(recorder){recorder.stop();await ended;if(!cancelled&&chunks.length){const blob=new Blob(chunks,{type:recorder.mimeType}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='قصة الغابة.'+(blob.type.includes('mp4')?'mp4':'webm');a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);story={...story,exportRevision:snapshot.revision};changed(story);note('اكتمل تصدير الفيلم.')}} 
  }catch(e){note(e.message)}finally{if(recorder?.state==='recording')recorder.stop();stream?.getTracks().forEach(track=>track.stop());await ctx?.close();stop=null;bar.inert=board.inert=tools.inert=false;if(!dead)draw()}
 }
 bar.append(button('معاينة القصة',()=>play(false)),button('إنهاء الفيديو وتصديره',()=>play(true)))
 panel.append(bar,canvas,button('إيقاف المعاينة',()=>stop?.()),el('h3','لوحة العمل'),board,tools,status);host.replaceChildren(panel);draw()
 return ()=>{dead=true;stop?.();cache.clear()}
}
