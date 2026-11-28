import {createMotionScene} from './continuous.mjs';
import {run,assess,near,polygon} from './runtime.mjs';
export const tasks=[
 ['space-dialog','حوار في سفينة الفضاء',216,'اختر سفينة الفضاء وأضف Pico وNano. اكتب حوارًا من اختيارك، واستخدم رسالة لانتقال الكلام من أحدهما إلى الآخر.'],
 ['catch-balls','اضغط على الكرة',204,'ابدأ بثلاث كرات متحركة ترتد عن الحافة. عند نقر أي كرة أوقف حركتها واجعلها تقول «لقد حصلت على الكرة».'],
 ['arrow-cat','تحريك القطة بالأسهم',205,'برمج القطة لتتحرك في الاتجاه الذي تضغط سهمه وتعلن اتجاهها. اختبر المفاتيح الأربعة على المنصة.'],
 ['balloon-colors','ألوان البالونات',190,'اختر خلفية الضوء وأضف ثلاثة بالونات مختلفة الألوان. عند نقر كل بالون يسأل عن لونه ثم يعلن إجابتك ثلاث ثوان.'],
 ['age-dialog','حوار عن العمر',189,'عند نقر الكائن اسأل المستخدم عن عمره، ثم اعرض إجابته ضمن جملة.'],
 ['exam-result','نتيجة الاختبار',192,'اسأل عن الدرجة. اعرض راسب للدرجة الأقل من ٥٠ وناجح عند ٥٠ أو أعلى.'],
 ['aquarium','رسوم متحركة تحت الماء',181,'اختر قاع البحر وأضف سمكة المهرج وقنديل البحر والسمكة المنتفخة. أنشئ لكل منها مقطع حركة مختلفًا يبدأ بالعلم.'],
 ['feeding-hen','الدجاجة تأكل',180,'اختر خلفية المزرعة. عند نقر العلم كرر عشر مرات التبديل بين مظهري الدجاجة hen-c وhen-d وانتظر ٠٫٣ ثانية بعد كل مظهر.'],
 ['red-triangle-center','القطة داخل المثلث الأحمر',169,'ارسم بالقلم مثلثًا أحمر كبيرًا. ارفع القلم وحرك القطة داخل المثلث وشغّل صوتًا وهي بداخله.'],
 ['space','مشهد الفضاء',128,'اختر خلفية الفضاء، وضع القطة في المنتصف وسم المشروع «الفضاء».'],
 ['football','كرة القدم',128,'اختر ملعب كرة القدم، واسحب القطة إلى اليسار وسمّ المشروع «كرة القدم».'],
 ['speak','فقاعة الترحيب',132,'عند نقر العلم، اجعل القطة تقول «مرحبا بكم في سكراتش» لخمس ثوانٍ.'],
 ['bird','صوت العصفور',140,'حرّك القطة ٣٠ خطوة، واجعلها تقول «لنستمع لصوت العصفور» وتشغّل صوت العصفور.'],
 ['greet','تحية ثم حركة',140,'عند العلم قل «السلام عليكم»، ثم تحرك ٣٠ خطوة إلى الأمام.'],
 ['turn','استدارة القطة',140,'استدر مع عقارب الساعة ٤٠ درجة ثم قل «أنا أستدير».'],
 ['picnic','نزهتي',140,'قل «لنقم بنزهة»، وشغّل صوتًا ثم تحرّك ٢٠٠ خطوة.'],
 ['loop','التكرار الثابت',142,'داخل لبنة كرّر، حرّك القطة ٥ خطوات في كل دورة، عشر مرات.'],
 ['walk','قطة تمشي',145,'سمّ المشروع «قطة تمشي»، واختر خلفية العشب. ضع القطة يسار المنصة ثم كرّر حركتها وكلامها خمس مرات.'],
 ['turns','كيفية الاستدارة',146,'سمّ المشروع «كيفية الاستدارة». كرّر ست مرات بالترتيب: قل «سأستدير إلى اليمين»، استدر يمينًا، قل «سأستدير إلى اليسار»، ثم استدر يسارًا.'],
 ['line','أول خط بالقلم',148,'أنزل القلم وارسم خطًا مستقيمًا طوله ١٥٠ خطوة.'],
 ['square','مربّع بالتكرار',152,'أنزل القلم وكرّر الحركة والاستدارة لرسم مربع طول ضلعه ١٠٠ خطوة.'],
 ['triangle','مثلث بالقلم',153,'ارسم مثلثًا متساوي الأضلاع بتكرار الحركة ثم استدارة مقدارها ١٢٠ درجة.'],
 ['circle','دائرة باستدارات صغيرة',153,'أغلق دائرة باستخدام القلم و٣٦ حركة، وبين كل حركتين استدارة ١٠ درجات. اسحب القطة إلى مكان مناسب قبل التشغيل.'],
 ['dashed','مثلث أصفر متقطّع',155,'بدّل بين رفع القلم وإنزاله لتترك فراغات على الأضلاع الثلاثة لمثلث متساوي الأضلاع، واختر لونًا أصفر.'],
 ['review-dashes','أكمل رسم الشرطات البنفسجية',169,'ضع القطة قرب اليسار. استخدم العلم وامسح الرسم السابق، ثم اختر قلمًا بنفسجيًا بحجم ٢. كرّر خمس مرات: أنزل القلم، تحرك ٣٠ خطوة، ارفع القلم، وتحرك ٣٠ خطوة.'],
 ['basketball','مشروع ملعب السلة',157,'اختر ملعب السلة وضع القطة في المنتصف. كرّر الحركة ٢٠ مرة بمقدار ١٠ خطوات، واترك مسارًا متقطعًا وشغّل صوت ارتداد الكرة أثناء الحركة.']
].map(([id,title,page,instructions])=>({id,title,page,instructions}));
export const initial=()=>({v:1,title:'مشروع جديد',x:0,y:0,scene:'plain',blocks:[]});
const norm=t=>String(t??'').replace(/[أإآ]/g,'ا').replace(/[ً-ْـ!؟.]/g,'').trim();
export function grade(s,id){
 const result=run(s,'scratch'), a=result.trace;
 if(id==='space-dialog'){
  const actors=[s,...(Array.isArray(s?.others)?s.others.slice(0,11):[])].filter(Boolean);
  const checks=[['السفينة والكائنان',s?.scene==='spaceship'&&actors.length===2&&['pico','nano'].every(key=>actors.some(a=>a.costume===key))]];
  const scene=createMotionScene(actors),spoke=new Set();let exchanged=false,previous='';
  for(let t=0;t<=30000;t+=100){
   scene.tick(t);for(const sprite of scene.sprites)if(sprite.speech.trim()){
    spoke.add(sprite.actor.costume);if(previous&&previous!==sprite.actor.costume)exchanged=true;previous=sprite.actor.costume;
   }
  }
  const signals=actors.flatMap(a=>a.blocks.filter(b=>b.op==='broadcast'||b.op==='broadcastWait').map(b=>({from:a,message:b.message})));
  return assess([...checks,['بث واستقبال رسالة مشتركة',signals.some(v=>actors.some(a=>a!==v.from&&a.blocks.some(b=>b.op==='receive'&&b.message===v.message)))],['كلام الكائنين عند التشغيل',exchanged&&spoke.has('pico')&&spoke.has('nano')]]);
 }
 if(id==='catch-balls'){
  const actors=[s,...(Array.isArray(s?.others)?s.others.slice(0,11):[])];
  const checks=[['ثلاث كرات مختلفة',new Set(actors.map(a=>a.costume).filter(id=>['beachBall','baseball','basketBall'].includes(id))).size===3]];
  for(const [i,actor] of actors.slice(0,3).entries()){
   const trial=createMotionScene([actor]);trial.tick(0);const ball=trial.sprites[0],x=ball.x,y=ball.y;trial.tick(320);
   const moving=ball.x!==x||ball.y!==y;trial.click(0,321);trial.tick(321);const stopX=ball.x,stopY=ball.y,said=norm(ball.speech).includes('الكره')||norm(ball.speech).includes('الكرة');trial.tick(1500);
   checks.push(['حركة مستمرة وارتداد الكرة '+(i+1),moving&&actor.blocks.some(b=>b.op==='forever'&&b.body?.some(v=>v.op==='edge'))],['اصطياد الكرة '+(i+1),moving&&said&&ball.x===stopX&&ball.y===stopY]);
  }
  return assess(checks);
 }
 if(id==='arrow-cat'){
  const directions=[['ArrowUp',0,-1,'اعلى'],['ArrowDown',0,1,'اسفل'],['ArrowRight',1,0,'يمين'],['ArrowLeft',-1,0,'يسار']];
  const checks=[];
  for(const [key,dx,dy,name] of directions){
   const r=run({...s,x:0,y:0},'scratch',[],key);
   checks.push(['حركة '+name,r.valid&&(dx?r.x*dx>0&&near(r.y,0):r.y*dy>0&&near(r.x,0))],['قول الاتجاه '+name,r.valid&&r.trace.some(e=>e.op==='say'&&norm(e.text).includes(name))]);
  }return assess(checks);
 }
 if(id==='balloon-colors'){
  const actors=[s,...(Array.isArray(s?.others)?s.others.slice(0,11):[])];
  const checks=[['خلفية الضوء',s?.scene==='light'],['إزالة القطة من المنصة',actors.length===3&&actors.every(a=>a?.costume?.endsWith('Balloon'))]];
  for(const [key,label] of [['blueBalloon','الأزرق'],['yellowBalloon','الأصفر'],['purpleBalloon','البنفسجي']]){
   const actor=actors.find(a=>a?.costume===key),start=run(actor,'scratch',[],'clicked');
   const responds=['أخضر','بنفسجي'].every(input=>{const r=run(actor,'scratch',[input],'clicked');return r.valid&&!r.pending&&r.trace.some(e=>e.op==='say'&&e.text.includes(input)&&e.text.length>input.length&&e.end-e.start===3000);});
   checks.push(['سؤال وإجابة البالون '+label,start.valid&&Boolean(start.pending?.text.trim())&&responds]);
  }return assess(checks);
 }
 if(id==='age-dialog'||id==='exam-result'){
  const event=id==='age-dialog'?'clicked':'flag',start=run(s,'scratch',[],event);
  const checks=[['سؤال ينتظر إدخال المستخدم',start.valid&&Boolean(start.pending?.text.trim())]];
  const samples=id==='age-dialog'?[[11,'11'],[14,'14']]:[[49,'راسب'],[50,'ناجح'],[82,'ناجح']];
  for(const [input,expected] of samples){
   const replay=run(s,'scratch',[input],event),words=replay.trace.filter(e=>e.op==='say').map(e=>norm(e.text));
   const match=id==='age-dialog'?words.some(w=>w.includes(expected)&&w.length>expected.length):words.some(w=>w.includes(expected))&&!words.some(w=>w.includes(expected==='ناجح'?'راسب':'ناجح'));
   checks.push(['الاستجابة للقيمة '+input,replay.valid&&!replay.pending&&match]);
  }
  return assess(checks);
 }
 if(id==='aquarium'){
  const actors=[s,...(Array.isArray(s?.others)?s.others.slice(0,11):[])],paths=new Set(),checks=[['خلفية قاع البحر',s?.scene==='sea']];
  for(const [key,name] of [['fish','سمكة المهرج'],['jelly','قنديل البحر'],['puffer','السمكة المنتفخة']]){
   const actor=actors.find(x=>x?.costume===key),r=run(actor,'scratch');
   const frames=r.valid?r.frames.map(f=>[Math.round(f.x-r.origin.x),Math.round(f.y-r.origin.y),f.angle,f.time]):[];
   const moved=frames.some(([x,y])=>x||y);checks.push(['مقطع يحرك '+name,moved]);if(moved)paths.add(JSON.stringify(frames));
  }
  return assess([...checks,['حركة مختلفة لكل كائن',paths.size===3]]);
 }
 if(!result.valid&&!['space','football'].includes(id))return {score:0,feedback:result.error?'تجاوز المقطع حدود التشغيل أو يحتوي لبنة غير صالحة.':'ضع لبنة العلم في بداية المقطع.'};
 const moves=a.filter(e=>e.op==='move'),loops=a.filter(e=>e.op==='repeat'), lines=result.segments, speech=a.filter(e=>e.op==='say');
 const move=d=>moves.find(e=>e.n===d), say=t=>speech.find(e=>norm(e.text)===norm(t)), named=t=>norm(s?.title)===norm(t);
 const before=(x,y)=>x&&y&&a.indexOf(x)<a.indexOf(y);
 const count=(op,n)=>a.filter(e=>e.op===op).length===n;
 const centered=Number.isFinite(s?.x)&&Number.isFinite(s?.y)&&Math.abs(s.x)<=10&&Math.abs(s.y)<=10;
 const sound=a.find(e=>e.op==='sound');
 let checks=[];
 switch(id){
 case 'feeding-hen':{
  const changes=a.filter(e=>e.op==='costume'), waits=a.filter(e=>e.op==='wait');
  const poses=changes.length===20&&changes.every((e,i)=>e.costume===(i%2?'hen-d':'hen-c'));
  checks=[['خلفية المزرعة',s.scene==='farm'],['تكرار الحركة عشر مرات',loops.some(e=>e.n===10)&&poses],['ظهور الدجاجة بمظهريها',changes.some(e=>e.costume==='hen-c')&&changes.some(e=>e.costume==='hen-d')],['انتظار ٠٫٣ ثانية بين المظاهر',poses&&waits.length===20&&changes.every((e,i)=>waits[i].start===e.start&&near(waits[i].n,.3)&&(i===19||near(changes[i+1].start-e.start,300)))]];break;
 }
 case 'red-triangle-center':{
  const cross=(a,b,p)=>(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
  const vertices=lines.map(l=>l.from);
  const closed=lines.length===3&&lines.every((l,i)=>Math.hypot(l.to.x-vertices[(i+1)%3].x,l.to.y-vertices[(i+1)%3].y)<1);
  const area=closed?Math.abs(cross(vertices[0],vertices[1],vertices[2]))/2:0;
  function inside(p){if(!area)return false;const sides=vertices.map((v,i)=>cross(v,vertices[(i+1)%3],p));return sides.every(v=>v>1)||sides.every(v=>v< -1);}
  checks=[['مثلث مغلق يتسع للقطة',area>=900],['رسم الأضلاع بالأحمر',closed&&lines.every(l=>l.color<4||l.color>96)],['وقوف القطة داخل المثلث',inside({x:result.x,y:result.y})],['تشغيل صوت داخل المثلث',a.some(e=>e.op==='sound'&&inside(e))]];break;
 }
 case 'space':case 'football':{const space=id==='space';checks=[['الخلفية',s?.scene===id],['موضع القطة',space?centered:s?.x<-100],['اسم المشروع',named(space?'الفضاء':'كرة القدم')]];break;}
 case 'speak':{const e=say('مرحبا بكم في سكراتش');checks=[['نص الترحيب',!!e],['المدة خمس ثوانٍ',e&&near(e.end-e.start,5000)]];break;}
 case 'bird':checks=[['الحركة ٣٠ خطوة',!!move(30)],['نص الفقاعة',!!say('لنستمع لصوت العصفور')],['تشغيل صوت العصفور',a.some(e=>e.sound==='bird')]];break;
 case 'greet':checks=[['نص التحية',!!say('السلام عليكم')],['الحركة ٣٠ خطوة',!!move(30)],['التحية قبل الحركة',before(say('السلام عليكم'),move(30))]];break;
 case 'turn':{const turn=a.find(e=>e.op==='cw'&&e.n===40);checks=[['٤٠ درجة مع عقارب الساعة',!!turn],['نص الفقاعة',!!say('أنا أستدير')],['الكلام بعد الدوران',before(turn,say('أنا أستدير'))]];break;}
 case 'picnic':checks=[['الدعوة للنزهة',!!say('لنقم بنزهة')],['صوت ثم حركة ٢٠٠ خطوة',before(sound,move(200))],['تسلسل القصة',before(say('لنقم بنزهة'),sound)]];break;
 case 'loop':checks=[['تكرار عشر مرات',loops.some(e=>e.n===10)],['عشر حركات من خمس خطوات',moves.length===10&&moves.every(e=>e.n===5)]];break;
 case 'walk':checks=[['اسم المشروع',named('قطة تمشي')],['الخلفية والموضع',s.scene==='grass'&&s.x<-100],['تكرار خمس مرات',loops.some(e=>e.n===5)],['حركة وكلام في كل دورة',alternates(a,['move','say'],5)]];break;
 case 'turns':checks=[['اسم المشروع',named('كيفية الاستدارة')],['تكرار ست مرات',loops.some(e=>e.n===6)],['ترتيب الكلام والاستدارات',alternates(a,['say','cw','say','ccw'],6)&&speech.every((e,i)=>norm(e.text)===norm(i%2?'سأستدير إلى اليسار':'سأستدير إلى اليمين'))]];break;
 case 'line':checks=[['رسم بالقلم',lines.length>0],['خط واحد طوله ١٥٠',lines.length===1&&near(Math.hypot(lines[0].to.x-lines[0].from.x,lines[0].to.y-lines[0].from.y),150)]];break;
 case 'square':case 'triangle':{const n=id==='square'?4:3;checks=[['استخدام التكرار المناسب',loops.some(e=>e.n===n)],['عدد الأضلاع المرسومة',lines.length===n],['تساوي الأضلاع والزوايا وإغلاق الشكل',polygon(lines,n)],...(n===4?[['طول الضلع ١٠٠',lines.length===4&&lines.every(l=>near(Math.hypot(l.to.x-l.from.x,l.to.y-l.from.y),100))]]:[])];break;}
 case 'circle':checks=[['٣٦ حركة متساوية',moves.length===36&&moves.every(e=>e.n>0&&e.n===moves[0].n)],['استدارات من ١٠ درجات',a.filter(e=>['cw','ccw'].includes(e.op)&&Math.abs(e.n)===10).length===36],['دائرة مغلقة',polygon(lines,36)]];break;
 case 'dashed':{const paths=moves.map(e=>({from:{x:e.x,y:e.y},to:{x:e.toX,y:e.toY},angle:e.angle}));const sides=[];for(const p of paths){const prev=sides.at(-1);if(prev&&near(prev.angle,p.angle))prev.to=p.to;else sides.push({...p});}
 const dotted=sides.map(p=>moves.filter(e=>near(e.angle,p.angle))).every(side=>{const ink=side.filter(e=>lines.some(l=>near(l.from.x,e.x)&&near(l.from.y,e.y)&&near(l.to.x,e.toX)&&near(l.to.y,e.toY)));return ink.length>=2&&ink.length<side.length;});checks=[['لون أصفر',lines.length&&lines.every(l=>l.color>=12&&l.color<=19)],['فراغات داخل كل ضلع',sides.length===3&&dotted],['مسار بشكل مثلث',polygon(sides,3)]];break;}
 case 'review-dashes':{
  const lengths=lines.map(l=>Math.hypot(l.to.x-l.from.x,l.to.y-l.from.y));
  const spaced=lines.slice(1).every((l,i)=>near(l.from.x-lines[i].to.x,30)&&near(l.from.y,lines[i].to.y));
  checks=[['مسح المنصة قبل الرسم',a.some(e=>e.op==='erase'&&e.start<=(lines[0]?.start??-1))],['قلم بنفسجي بحجم ٢',lines.length>0&&lines.every(l=>l.color>=70&&l.color<=85&&l.width===2)],['خمس شرطات أفقية طول كل منها ٣٠',lines.length===5&&lengths.every(n=>near(n,30))&&lines.every(l=>near(l.to.x-l.from.x,30)&&near(l.to.y,l.from.y))],['فراغات متساوية من ٣٠ خطوة',lines.length===5&&spaced],['تكرار خمس دورات كاملة',loops.some(e=>e.n===5)&&moves.length===10&&moves.every(e=>e.n===30)]];
  break;
 }
 case 'basketball':checks=[['ملعب السلة والبدء من المنتصف',s.scene==='basketball'&&centered],['عشرون حركة من عشر خطوات',loops.length&&moves.length===20&&moves.every(e=>e.n===10)],['خط متقطع',lines.length===10&&moves.length===20&&moves.every((e,i)=>lines.some(l=>near(l.from.x,e.x)&&near(l.from.y,e.y))=== (i%2===0))],['ارتداد الكرة أثناء التسلسل',a.some(e=>e.sound==='bounce'&&moves.some(m=>m.start<=e.start)&&moves.some(m=>m.start>=e.start))]];break;
 default:return {score:0,feedback:'نشاط غير معروف.'};
 }
 return assess(checks);
}
function alternates(trace,pattern,n){
 const seq=trace.filter(e=>pattern.includes(e.op));
 return seq.length===pattern.length*n&&seq.every((e,i)=>e.op===pattern[i%pattern.length]);
}
