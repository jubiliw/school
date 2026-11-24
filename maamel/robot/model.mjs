import {defaultObjects} from './scene.mjs';
import {run,assess,near} from '../scratch/runtime.mjs';
export const tasks=[
 ['return','الذهاب والعودة',287,'تحرك للأمام ١٠٠ سم بسرعة ٣٠، ثم عُد إلى موضع البداية بالسرعة والمسافة نفسيهما.'],
 ['speed','غيّر سرعة الروبوت',291,'تقدّم ٥٠ سم بسرعة ٥٠، ثم تابع ٥٠ سم أخرى بسرعة ١٠٠.'],
 ['steering','منعطفا المسار',295,'تقدم ٨٠ سم بسرعة ٥٠. وجّه لمسافة ٦٨ سم بالسرعتين ١٠٠ و٤٠ للمحركين الأيسر والأيمن. تابع ٨٠ سم بسرعتين متساويتين ٥٠، ثم وجّه لمسافة ٥٠ سم بسرعتي ٦٥ و٢٠.'],
 ['circle','دائرة كاملة',298,'استخدم لبنة التوجيه بمحركين غير متساويين. عدّل المسافة حتى تغلق مسارًا دائريًا واحدًا.'],
 ['two-circles','دائرتان على خط',299,'تقدم على خط وارسم دائرتين مختلفتي الحجم بلبنتي توجيه، مع تقدم مستقيم بينهما ثم بعدهما.'],
 ['square','مشروع المربّع',300,'برمج أربع حركات مستقيمة متساوية وأربع استدارات يمينية قائمة، واختبر إغلاق المسار.']
].map(([id,title,page,instructions])=>({id,title,page,instructions}));
export const initial=()=>({v:1,title:'برنامج الروبوت',x:0,y:0,scene:'grid',objects:defaultObjects(),blocks:[]});
export function grade(s,id){
 const r=run(s,'robot'),tr=r.trace;
 if(!r.valid||!tr.length)return {score:0,feedback:'أضف لبنات حركة صحيحة ثم اختبر المسار.'};
 const back=Math.hypot(r.x-r.origin.x,r.y-r.origin.y)<2;
 const drive=(e,n,v,d)=>e&&e.direction===d&&e.distance===n&&e.left===v&&e.right===v;
 const forward=e=>e&&(e.op==='drive'||e.op==='steer')&&e.left===e.right&&e.left>0&&e.direction==='forward'&&e.distance>0;
 const circle=e=>e?.op==='steer'&&Math.abs(Math.abs(e.toAngle-e.angle)-360)<6 && Math.hypot(e.toX-e.x,e.toY-e.y)<3;
 let c;
 switch(id){
 case 'return':c=[['قيادة للأمام',drive(tr[0],100,30,'forward')],['قيادة للخلف',drive(tr[1],100,30,'back')],['العودة بنهاية حركتين',tr.length===2&&back]];break;
 case 'speed':c=[['الجزء الأول',drive(tr[0],50,50,'forward')],['الجزء الثاني',drive(tr[1],50,100,'forward')],['المسافة الإجمالية ١٠٠ سم',tr.length===2&&near(r.x-r.origin.x,100)]];break;
 case 'steering':c=[['تقدم ٨٠ سم',drive(tr[0],80,50,'forward')],['الانعطاف الأول',tr[1]?.op==='steer'&&tr[1].left===100&&tr[1].right===40&&tr[1].distance===68&&tr[1].direction==='forward'],['تقدم بعد المنعطف',drive(tr[2],80,50,'forward')],['الانعطاف الثاني',tr.length===4&&tr[3]?.left===65&&tr[3]?.right===20&&tr[3]?.distance===50&&tr[3]?.direction==='forward']];break;
 case 'circle':c=[['التوجيه بسرعتين مختلفتين',tr.some(e=>e.op==='steer'&&e.left!==e.right)],['دورة واحدة مغلقة',tr.length===1&&circle(tr[0])]];break;
 case 'two-circles':c=[['ثلاث مراحل مستقيمة',tr.length===5&&[0,2,4].every(i=>forward(tr[i]))],['الدائرة الأولى',circle(tr[1])],['الدائرة الثانية بحجم مختلف',circle(tr[3])&&Math.abs(tr[3].distance-(tr[1]?.distance??0))>5]];break;
 case 'square':{
 const straights=tr.filter(forward), corners=tr.filter(e=>['turn','steer'].includes(e.op)&&near(e.toAngle-e.angle,90,4));
 c=[['أربعة أضلاع متساوية',straights.length===4&&straights.every(e=>near(e.distance,straights[0].distance,.5))],['أربع زوايا قائمة يمينًا',corners.length===4],['تعاقب الأضلاع والزوايا وإغلاق المسار',tr.length===8&&tr.every((e,i)=>i%2?corners.includes(e):forward(e))&&back]];break;
 }
 default:return {score:0,feedback:'نشاط غير معروف.'};
 }
 return assess(c);
}
