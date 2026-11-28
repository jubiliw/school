export const lines=['تصل الطيور المهاجرة في فصل الربيع','تحافظ الأشجار على توازن البيئة','تحتاج البذور إلى الماء لتنمو'];
export const tasks=[{id:'snip',title:'استخراج النص من صورة',instructions:'حدّد السطر الثاني وحده في بطاقة العلوم، ثم استخدم إجراءات النص وانسخ النص والصقه في المستند. قارنه بالصورة قبل حفظه.',page:304}];
export function initial(){return {rect:null,recognized:'',doc:'',saved:''};}
export function grade(s){const target=lines[1],words=target.split(' '),v=typeof s?.saved==='string'?s.saved.trim().replace(/\s+/g,' '):'';const r=s?.rect;
 const selected=Array.isArray(r)&&r.length===4&&r.every(Number.isFinite)&&r[0]<.37&&r[0]+r[2]>.69&&r[1]<=.50&&r[1]+r[3]>=.60&&r[1]+r[3]<.77;
 const exact=v===target;const part=words.filter(w=>v.split(' ').includes(w)).length/words.length;
 const score=Math.round((selected?20:0)+(s?.recognized===target?20:0)+60*(exact?1:Math.min(.75,part)));return {score,feedback:score===100?'التحديد والنص المحفوظ مطابقان للصورة.':'حدّد السطر المطلوب وحده وقارن كل كلمة بالمستند المحفوظ.'};}
