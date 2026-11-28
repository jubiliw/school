import {initial,mix,sample} from './model.mjs'
import {rate,pack,unpack,wav} from '../av/model.mjs'
import {displayWave} from '../av/window.mjs'
import {el,button,field} from '../office-common/ui.mjs'
export function mount(host,previous,onChange){
 let state=structuredClone(previous||initial()),url='',disposed=false
 const history=[],root=el('section'),link=el('link'),audio=el('audio'),status=el('output'),list=el('div'),name=el('input')
 root.dir='rtl';root.className='audio-editor';link.rel='stylesheet';link.href=new URL('style.css',import.meta.url).href
 audio.controls=true;name.value=state.exported?.name||'مشهد.wav';name.maxLength=90
 const toolbar=el('div'),samples=el('select')
 for(const [i,title] of ['نداء منخفض','تغريد','نبض الغابة'].entries())samples.add(new Option(title,i))
 function message(s){status.textContent=s}
 function render(){
  list.replaceChildren()
  state.tracks.forEach((track,i)=>{
   const row=el('section'),canvas=el('canvas'),title=el('strong',track.name);canvas.width=600;canvas.height=60
   displayWave(canvas,unpack(track.pcm))
   function slider(label,key,min,max,step){
    const input=el('input');input.type='number';input.min=min;input.max=max;input.step=step;input.value=track[key]
    input.onchange=()=>{if(!input.reportValidity()||!Number.isFinite(input.valueAsNumber))return;change(next=>{next.tracks[i][key]=input.valueAsNumber})}
    return field(label,input)
   }
   row.append(title,canvas,slider('السرعة','speed',.5,2,.1),slider('مستوى الصوت','gain',0,2,.1),slider('بداية المسار بالثواني','offset',0,10,.1),button('حذف المسار',()=>change(next=>next.tracks.splice(i,1))))
   list.append(row)
  })
  if(url)URL.revokeObjectURL(url);url=''
  if(state.tracks.length){url=URL.createObjectURL(new Blob([wav(mix(state.tracks))],{type:'audio/wav'}));audio.src=url}
  else{audio.removeAttribute('src');audio.load()}
 }
 function change(edit){
  const next=structuredClone(state);edit(next);next.exported=null
  if(new Blob([JSON.stringify(next)]).size>395000)return message('مساحة المشروع ممتلئة. قصّر الصوت المستورد.')
  history.push(state);if(history.length>8)history.shift();state=next;onChange(state);render()
 }
 function add(trackName,pcm,source='sample'){
  if(state.tracks.length>=8)return message('يمكن إضافة ثمانية مسارات.')
  change(next=>next.tracks.push({name:trackName.slice(0,80),source,pcm:pack(pcm),speed:1,gain:1,offset:0}))
 }
 const file=el('input');file.type='file';file.accept='audio/*';file.hidden=true
 async function decodeSource(blob,label,source){
  if(blob.size>20*1024*1024)return message('اختر ملفًا أصغر من ٢٠ ميغابايت.')
  let ctx
  try{ctx=new (window.AudioContext||window.webkitAudioContext)();const data=await ctx.decodeAudioData(await blob.arrayBuffer());if(disposed)return
   const channel=data.getChannelData(0),size=Math.min(rate*15,Math.floor(data.duration*rate));if(!size)return message('المقطع فارغ.')
   add(label,Uint8Array.from({length:size},(_,i)=>Math.round(128+Math.max(-1,Math.min(1,channel[Math.floor(i*data.sampleRate/rate)]))*127)),source)
   if(data.duration>15)message('استُوردت أول ١٥ ثانية.')
  }catch{message('تعذرت قراءة التسجيل الصوتي.')}finally{await ctx?.close()}
 }
 file.onchange=()=>{const source=file.files[0];file.value='';if(source)decodeSource(source,source.name,'import')}
 let stream=null,recorder=null,timer
 function release(){clearTimeout(timer);stream?.getTracks().forEach(t=>t.stop());stream=null;recorder=null}
 const record=button('تسجيل بالميكروفون',async()=>{
  if(recorder?.state==='recording'){recorder.stop();return}
  record.disabled=true
  try{
   stream=await navigator.mediaDevices.getUserMedia({audio:true})
   if(disposed){release();return}
   recorder=new MediaRecorder(stream);const chunks=[]
   recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)}
   recorder.onstop=()=>{const blob=new Blob(chunks,{type:recorder.mimeType});release();record.textContent='تسجيل بالميكروفون';if(!disposed)decodeSource(blob,'تسجيل صوتي','microphone')}
   recorder.start();record.textContent='إيقاف التسجيل';timer=setTimeout(()=>{if(recorder?.state==='recording')recorder.stop()},15000)
  }catch{release();message('تعذر تشغيل الميكروفون. يمكنك استيراد تسجيل من جهازك.')}finally{record.disabled=false}
 })
 function exportFile(){
  if(!state.tracks.length||!name.value.trim())return message('أضف مسارًا واكتب اسم الملف.')
  const filename=name.value.trim().replace(/\.wav$/i,'')+'.wav',anchor=el('a');anchor.href=url;anchor.download=filename;anchor.click()
  state={...state,exported:{name:filename,pcm:pack(mix(state.tracks))}};onChange(state);message('صُدّر المزيج بصيغة WAV.')
 }
 toolbar.append(record,button('استيراد صوت',()=>file.click()),file,field('عينة تدريبية',samples),button('إضافة مسار',()=>add(samples.selectedOptions[0].text,sample(Number(samples.value)))),button('تراجع',()=>{if(history.length){state=history.pop();onChange(state);render()}}))
 root.append(el('h2','محرر الصوت متعدد المسارات'),toolbar,list,audio,field('اسم ملف التصدير',name),button('تصدير WAV',exportFile),status);host.replaceChildren(link,root);render()
 return ()=>{disposed=true;if(recorder?.state==='recording')recorder.stop();else release();audio.pause();if(url)URL.revokeObjectURL(url)}
}
