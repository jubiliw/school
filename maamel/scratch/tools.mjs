const n=(key,label,value,min,max)=>({key,label,value,min,max,type:'number'});
const choice=(key,label,value,options)=>({key,label,value,options,type:'select'});
const movement=n('n','خطوة',10,-480,480), degree=n('n','درجة',15,0,360), time=n('seconds','ثانية',2,.1,60);
const distance=n('distance','المسافة (سم)',20,0,350), speed=n('speed','السرعة %',30,0,100);
const direction=choice('direction','الاتجاه','forward',[['forward','إلى الأمام'],['back','إلى الخلف']]);
export const sounds=[['bird','العصفور'],['bounce','ارتداد الكرة'],['door','صرير الباب'],['cat','مواء']];
export const poses=[['orange','قطة برتقالية'],['slate','قطة رمادية'],['sand','قطة رملية'],['hen-c','دجاجة · hen-c'],['hen-d','دجاجة · hen-d'],['fish','سمكة المهرج'],['puffer','السمكة المنتفخة'],['jelly','قنديل البحر'],['blueBalloon','بالون أزرق'],['yellowBalloon','بالون أصفر'],['purpleBalloon','بالون بنفسجي']];
export const scratchTools=[
 ['flag','الأحداث','عند نقر العلم'],
 ['key','الأحداث','عند ضغط مفتاح',choice('key','المفتاح','ArrowUp',[['ArrowUp','السهم الأعلى'],['ArrowDown','السهم الأسفل'],['ArrowRight','السهم الأيمن'],['ArrowLeft','السهم الأيسر']])],
 ['point','الحركة','اتجه نحو الاتجاه',n('direction','درجة',90,-180,180)],['edge','الحركة','ارتد إذا كنت عند الحافة'],
 ['move','الحركة','تحرّك',movement],['cw','الحركة','استدر يمينًا',degree],['ccw','الحركة','استدر يسارًا',degree],
 ['clicked','الأحداث','عند نقر هذا الكائن'],
 ['ask','الاستشعار','اسأل وانتظر',{key:'text',type:'text',label:'السؤال',value:'كم عمرك؟'}],
 ['reply','الهيئة','قل إجابة مع نص',{key:'prefix',type:'text',label:'قبل الإجابة',value:'عمرك '},{key:'suffix',type:'text',label:'بعد الإجابة',value:' سنة'},time],
 ['ifAnswer','التحكم','إذا كانت الإجابة',choice('comparison','المقارنة','lt',[['lt','أقل من'],['eq','تساوي'],['gt','أكبر من']]),n('value','القيمة',50,-99999,99999)],
 ['costume','الهيئة','غيّر المظهر إلى',choice('costume','المظهر','hen-c',poses)],
 ['say','الهيئة','قل',{key:'text',type:'text',label:'النص',value:'مرحبًا!'},time],
 ['sound','الصوت','شغّل الصوت حتى انتهائه',choice('sound','الصوت','bird',sounds)],
 ['repeat','التحكم','كرّر',n('n','مرة',10,0,100)],['wait','التحكم','انتظر',n('n','ثانية',1,0,60)],
 ['down','القلم','أنزل القلم'],['up','القلم','ارفع القلم'],['erase','القلم','امسح الكل'],['stamp','القلم','اطبع'],
 ['color','القلم','اجعل لون القلم',n('n','من ٠ إلى ١٠٠',60,0,100)],['colorBy','القلم','غيّر اللون بمقدار',n('n','مقدار التغيير',10,-100,100)],
 ['size','القلم','اجعل حجم القلم',n('n','السُمك',1,1,80)],['sizeBy','القلم','غيّر حجم القلم',n('n','التغيير',1,-80,80)]
];
export const robotTools=[
 ['drive','الحدث','قيادة · Drive',direction,speed,distance],
 ['steer','الحدث','توجيه · Steer',direction,n('left','المحرك الأيسر %',50,0,100),n('right','المحرك الأيمن %',30,0,100),distance],
 ['turn','الحدث','استدارة · Turn',choice('direction','الاتجاه','right',[['right','يمين'],['left','يسار']]),speed,degree]
];
export const scenes={scratch:[['plain','بيضاء'],['space','الفضاء'],['football','كرة القدم'],['basketball','ملعب السلة'],['grass','العشب'],['farm','المزرعة'],['sea','قاع البحر'],['light','ضوء · Light'],['castle','القلعة']],robot:[['grid','شبكة القياس'],['plain','لوحة الرسم']]};
export function newBlock(def){const block={op:def[0]};if(['repeat','ifAnswer'].includes(block.op))block.body=[];for(const field of def.slice(3))block[field.key]=field.value;return block;}
