import {named,result,taskId} from '../office-common/model.mjs';
export const tasks=[
 {id:'healthy',title:'عرض الأطعمة الصحية',page:188,instructions:'اختر نسق «الأساس» وخط Arial. اكتب عنوان «الأطعمة الصحية» واسمًا مستعارًا في الشريحة الأولى. أضف شريحة «عنوان ومحتوى» بعنوان «الوصف» واكتب فيها فائدة للغذاء المتوازن ثم احفظ.'},
 {id:'sport',title:'رياضتي المفضلة',page:197,instructions:'اكتب «الرياضات» عنوانًا واسمًا مستعارًا في العنوان الفرعي. أدرج صورة رياضية في الشريحة الأولى، وطبّق عليها إطارًا ثم كبّرها وانقلها إلى أسفل اليمين. أضف شريحة تشرح فيها رياضتك.'},
 {id:'introduce',title:'قدّم نفسك',page:202,instructions:'أنشئ خمس شرائح معنونة عن شخصية خيالية واهتماماتها. أضف انتقالًا بين الشرائح وتأثير حركة على عنصر، ثم شغّل العرض.'},
 {id:'holiday',title:'عرض عن مكان العطلة',page:213,instructions:'اكتب شريحتين عن مكان تختاره، وأدرج صورة ومقطع فيديو، وأضف تأثير حركة وانتقالًا. اكتب ملاحظات للعرض واحفظه. يقيّم المعلم التقديم الشفهي.'}
];
export function slide(layout='title'){return {layout,title:'',text:'',notes:'',transition:'none',duration:0.6,items:[],textAnimation:'none'};}
export function initial(){return {version:1,name:'',files:[],body:{theme:'plain',font:'system-ui',slides:[slide()]}};}
export function grade(state,task){
 const b=state?.body||{},ss=Array.isArray(b.slides)?b.slides:[],first=ss[0]||{},second=ss[1]||{},filled=s=>typeof s==='string'&&!!s.trim(),normalize=t=>String(t||'').trim().replace(/[أإآ]/g,'ا'),id=taskId(task)||'healthy',media=ss.flatMap(s=>s?.items||[]);
 if(id==='healthy')return result([[b.theme==='basis'&&b.font==='Arial','نسق الأساس وخط Arial'],[normalize(first.title)==='الاطعمة الصحية','عنوان الأطعمة الصحية'],[filled(first.text),'العنوان الفرعي'],[second.layout==='content'&&normalize(second.title)==='الوصف','شريحة الوصف وتخطيطها'],[second.text?.trim().length>=10,'وصف الفائدة'],[named(state),'حفظ العرض']]);
 if(id==='sport'){const pic=first.items?.find(x=>x.kind==='image'&&x.asset==='sport');return result([[first.title?.trim()==='الرياضات'&&filled(first.text),'عنوان واسم مستعار'],[!!pic,'صورة رياضية في الأولى'],[pic?.frame==='frame','نمط الصورة'],[pic?.w>28,'تكبير الصورة'],[pic?.x>=50&&pic?.y>=48,'نقل الصورة إلى أسفل اليمين'],[second.text?.trim().length>=8,'شريحة تصف الرياضة']]);}
 if(id==='introduce')return result([[ss.length===5,'خمس شرائح'],[ss.length===5&&ss.every(s=>filled(s.title)),'عنوان في كل شريحة'],[new Set(ss.map(s=>s.text?.trim()).filter(Boolean)).size>=3,'ثلاثة نصوص مختلفة على الأقل'],[ss.slice(1).some(s=>s.transition&&s.transition!=='none'),'انتقال لشريحة تالية'],[ss.some(s=>s.textAnimation&&s.textAnimation!=='none'||s.items?.some(i=>i.animation&&i.animation!=='none')),'حركة على عنصر']]);
 if(id==='holiday')return result([[ss.filter(s=>filled(s.title)&&filled(s.text)).length>=2,'شريحتان بمحتوى'],[media.some(i=>i.kind==='image'),'صورة'],[media.some(i=>i.kind==='video'),'مقطع فيديو'],[ss.some(s=>s.transition&&s.transition!=='none'),'انتقال'],[ss.some(s=>s.textAnimation&&s.textAnimation!=='none'||s.items?.some(i=>i.animation&&i.animation!=='none')),'تأثير حركة'],[ss.some(s=>filled(s.notes)),'ملاحظات المتحدث'],[named(state),'حفظ العرض']]);
 return {score:0,feedback:'تدريب غير معروف'};
}
