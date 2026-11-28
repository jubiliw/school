import {rate,pack,unpack} from '../av/model.mjs'
export const tasks=[
 {id:'school-podcast',page:131,title:'البودكاست المدرسي',instructions:'سجّل فقرة قصيرة للإذاعة المدرسية أو استورد تسجيلك. استمع إليها واضبط مستواها وصدّر نسخة WAV باسم تختاره. ناقش وضوح الصوت مع زميلك.'},{id:'forest',title:'إنشاء مشهد صوتي للغابة',page:131,instructions:'استورد مقاطع صوتية من جهازك أو استخدم العينات التدريبية. غيّر سرعة مقطع، وأضف أصواتًا مميزة في مسارات مستقلة. استمع للمزيج وصدّره باسم G5.S2.2.1_Sample2.wav.'}]
export function initial(){return {tracks:[],exported:null}}
export function sample(kind){
 const freq=[245,610,125][kind]||245
 return Uint8Array.from({length:rate*2},(_,i)=>{
  const t=i/rate,pulse=Math.max(0,Math.sin(t*(kind===1?14:8)))
  return 128+Math.round(68*pulse*Math.sin(2*Math.PI*freq*t+4*Math.sin(t*18)))
 })
}
export function mix(tracks){
 const parts=tracks.slice(0,8).map(t=>({t,pcm:unpack(t.pcm)})).filter(({pcm})=>pcm?.length)
 const size=Math.min(rate*15,Math.max(0,...parts.map(({t,pcm})=>Math.ceil(pcm.length/t.speed)+Math.round(t.offset*rate))))
 const sum=new Float32Array(size)
 for(const {t,pcm} of parts){
  const start=Math.round(t.offset*rate),end=Math.min(size,start+Math.ceil(pcm.length/t.speed))
  for(let i=start;i<end;i++)sum[i]+=(pcm[Math.floor((i-start)*t.speed)]-128)*t.gain
 }
 return Uint8Array.from(sum,v=>Math.max(0,Math.min(255,Math.round(128+v))))
}
export function grade(state,task='forest'){
 const tracks=(state?.tracks??[]).filter(t=>Number.isFinite(t.speed)&&t.speed>=.5&&t.speed<=2&&t.gain>0&&t.gain<=2&&t.offset>=0&&t.offset<=10&&unpack(t.pcm)?.some(v=>Math.abs(v-128)>3))
 if(task==='school-podcast'){
  const voice=tracks.some(t=>['microphone','import'].includes(t.source))
  const exported=voice&&!!state.exported?.name?.trim()&&state.exported.pcm===pack(mix(tracks))
  return {score:voice?(exported?100:50):0,feedback:exported?'حُفظت النسخة الصوتية للتشغيل ومراجعة المعلم.':'أضف تسجيلك وصدّر النسخة الحالية.'}
 }
 const exportOK=state?.exported?.name==='G5.S2.2.1_Sample2.wav'&&tracks.length>0&&state.exported.pcm===pack(mix(tracks))
 const criteria=[[new Set(tracks.map(t=>t.pcm)).size>=2,'مساران صوتيان مختلفان'],[tracks.some(t=>t.speed!==1),'تغيير سرعة مقطع'],[exportOK,'تصدير المزيج الحالي بصيغة WAV بالاسم المطلوب']]
 return {score:Math.round(100*criteria.filter(([ok])=>ok).length/criteria.length),feedback:criteria.filter(([ok])=>!ok).map(([,label])=>label).join('، ')||'اكتمل المشهد الصوتي.'}
}
