export const tasks=[
 {id:'record',title:'تسجيل مقدمة صوتية',instructions:'اختر مصدر الصوت. ابدأ التسجيل ثم أوقفه، واحفظ المقطع باسم «مقدمة» داخل مجلد باسم الفريق. شغّل الملف للتحقق منه.',page:248},
 {id:'watch',title:'ملاحظة تفاصيل مقطع',instructions:'شغّل مقطع التدريب، واستخدم التوقف وشريط التقديم لتعدّ الطيور وتحدد أين تظهر. اكتب إجاباتك ثم احفظها.',page:255}
];
export const rate=8000;
export function initial(){return {folder:'',name:'',sample:null,clip:null,birds:'',place:'',answers:null};}
export function pack(pcm){let out='';for(let i=0;i<pcm.length;i+=2048)out+=String.fromCharCode(...pcm.subarray(i,i+2048));return btoa(out);}
export function unpack(packed){if(typeof packed!=='string'||packed.length>160000||!packed.length)return null;try{return Uint8Array.from(atob(packed),v=>v.charCodeAt(0));}catch{return null;}}
export function testTone(seconds){const v=new Uint8Array(Math.max(1,Math.min(120000,Math.round(rate*seconds))));for(let i=0;i<v.length;i++){const t=i/rate;v[i]=128+Math.round(65*Math.sin(2*Math.PI*(t%1>.5?440:330)*t)*Math.min(1,t*24,(v.length-i)/rate*24));}return v;}
export function wav(pcm){const a=new Uint8Array(44+pcm.length),dv=new DataView(a.buffer);const str=(offset,s)=>{for(let i=0;i<s.length;i++)a[offset+i]=s.charCodeAt(i);};str(0,'RIFF');dv.setUint32(4,36+pcm.length,true);str(8,'WAVEfmt ');dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);dv.setUint32(24,rate,true);dv.setUint32(28,rate,true);dv.setUint16(32,1,true);dv.setUint16(34,8,true);str(36,'data');dv.setUint32(40,pcm.length,true);a.set(pcm,44);return a;}
export function grade(s,id){let checks;if(id==='watch')checks=[s?.answers?.birds==='3',s?.answers?.place==='sky'];else{const pcm=unpack(s?.clip?.pcm);const audible=pcm&&pcm.length>=rate/4&&pcm.some(v=>Math.abs(v-128)>4);checks=[Boolean(audible),Boolean(s?.clip?.folder?.trim()),s?.clip?.name==='مقدمة'];}
 const score=Math.round(100*checks.filter(Boolean).length/checks.length);return {score,feedback:score===100?'تحققت معايير النشاط.':id==='watch'?'راجع عدد الطيور وموضعها في المقطع.':'راجع محتوى التسجيل ومجلده واسمه ثم احفظ المقطع.'};}
