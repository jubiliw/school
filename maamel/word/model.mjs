import {spellingIssues} from './proofing.mjs';
import {named,result,taskId} from '../office-common/model.mjs';
export const tasks=[
 {id:'security-proof',title:'تدقيق نص عن أمان الإنترنت',page:94,instructions:'راجع النص التدريبي البديل وصحّح الأخطاء الإملائية والنحوية. استخدم تبويب مراجعة أو حرّر النص مباشرة.'},
 {id:'mosque-proof',title:'مراجعة نص المسجد العائم',page:95,instructions:'افحص النص التدريبي البديل عن المسجد العائم. قارن اقتراحات التصحيح ثم أصلح الأخطاء في مواضعها.'},
 {id:'oil-print',title:'إعداد مستند للطباعة',page:96,instructions:'افتح ملف ← طباعة لمعاينة المستند. اضبط اتجاه الصفحة عموديًا واضبط عدد النسخ بحسب عدد أفراد الفريق. تستطيع فتح نافذة طباعة الجهاز بعد المعاينة.'},
 {id:'design-process',title:'خطوات تصميم المجلة',page:89,instructions:'استخدم إدراج ثم SmartArt، واختر رسمًا يعرض مراحل تصميم مجلة بالترتيب. اكتب كل مرحلة في عنصر مستقل.'},
 {id:'family-hierarchy',title:'شجرة العائلة',page:89,instructions:'أنشئ مستندًا واختر تخطيطًا هيكليًا يمثل شجرة عائلة. استخدم أسماء افتراضية.'},
 {id:'nutrition-pyramid',title:'الهرم الغذائي',page:89,instructions:'اكتب عنوان الهرم الغذائي، وأدرج رسمًا هرميًا. سمّ مستويات الهرم وغيّر لون الرسم ثم احفظ المستند.'},
 {id:'illustrated-facts',title:'تنسيق مستند باستخدام الصور',page:66,instructions:'أنشئ مستند «هل تعلم؟» وفق مثال الكتاب. أضف عناوين وفقرات عن المسجد الحرام والمها العربي ونيوم والعنكبوت، وأدرج صورتين مناسبتين من جهازك، ثم اضبط التفاف النص والحدود والتظليل.'},
 {id:'weekend-paragraphs',title:'تنسيق النص والفقرات',page:76,instructions:'اكتب ثلاث فقرات تصف عطلة نهاية الأسبوع. اضغط مفتاح الإدخال مرة عند نهاية كل فقرة واترك السطر يلتف تلقائيًا.'},
 {id:'fruit',title:'قائمة الفواكه بلغتين',page:52,instructions:'اكتب أسماء الفواكه تفاح، أناناس، موز، ثم apple وpineapple وbanana. ضع كل اسم في سطر مستقل.'},
 {id:'edit',title:'تحرير الكلمات',page:63,instructions:'استبدل «التفاح» بعبارة «المشروبات الغازية»، واستبدل «مفيد» بعبارة «غير صحي»، ثم احذف كلمة «أيضًا». راجع الناتج.'},
 {id:'headline',title:'تنسيق عنوان المقال',page:73,instructions:'حدد العنوان «التغير المناخي»، ثم طبّق عليه الغامق والمائل والتسطير. ميّزه بالأصفر واضبط حجمه على 16 نقطة. احفظ الملف باسم مناسب. هذا نص تدريبي بديل لملف الأنشطة الخارجي.'},
 {id:'months',title:'ترقيم الشهور',page:79,instructions:'اكتب أسماء اثني عشر شهرًا هجريًا أو ميلاديًا، كل شهر في فقرة منفصلة. حدد الفقرات وطبّق عليها التعداد الرقمي.'},
 {id:'city',title:'مقال عن مدينتي',page:83,instructions:'اكتب عنوانًا عن مدينتك واجعله غامقًا، ثم اكتب فقرتين عن مكانين يمكن زيارتهما. أضف إطارًا لكل فقرة وظللهما بلونين مختلفين ثم احفظ المقال. يراجع المعلم صحة المعلومات.'}
];
const paragraph=text=>({runs:[{text}]});
export function initial(task){const id=taskId(task);const lines=id==='security-proof'?['نصائح الأمان عبر الإنترنت','المستخدمون يحمي البيانت على الحاسوبب بكلمة المرورر.']:id==='mosque-proof'?['المسجد العائم','المصلون يزور المسجدد قرب الشاطىء.']:id==='oil-print'?['النفط والغاز','تستخدم المصانع مشتقات النفط في صناعة منتجات متعددة.','يساعد الغاز على تشغيل محطات توليد الطاقة.']:id==='edit'?['التفاح لذيذ','إنه مفيد لصحتك أيضًا']:id==='headline'?['التغير المناخي','يبحث الطلاب أثر الاحتباس الحراري في مدينتهم.','يستعرض المقال طرق ترشيد الطاقة.']:[''];return {version:1,name:'',files:[],body:{paragraphs:lines.map(paragraph)}};}
export function plain(p){if(p?.type==='diagram')return p.items.join(' ');if(p?.type==='table')return p.rows.flatMap(row=>row.map(cell=>cell.blocks.map(plain).join(' '))).join(' ');return (p?.runs||[]).map(r=>typeof r?.text==='string'?r.text:'').join('');}
function normalize(t){return t.trim().replace(/[\u064b-\u065f\u0670]/g,'').replace(/[أإآ]/g,'ا').toLowerCase();}
function styled(p,prop,predicate=Boolean){const runs=p?.runs?.filter(r=>r?.text?.trim());return !!runs?.length&&runs.every(r=>predicate(r[prop]));}
export function grade(state,task){
 const ps=Array.isArray(state?.body?.paragraphs)?state.body.paragraphs:[],lines=ps.map(p=>normalize(plain(p))),text=lines.join(' '),id=taskId(task)||'fruit';
 if(['security-proof','mosque-proof'].includes(id)){
  const initialText=initial(id).body.paragraphs.map(plain),issues=spellingIssues(initialText);
  return result(issues.map(([wrong,right])=>[text.includes(normalize(right))&&!spellingIssues(ps.map(plain)).some(([error])=>error===wrong),right]));
 }
 if(id==='oil-print')return result([[state?.body?.page?.orientation==='portrait','اتجاه عمودي'],[Number.isInteger(state?.body?.print?.copies)&&state.body.print.copies>0,'تعيين عدد النسخ'],[lines.some(l=>l.includes('النفط')),'الإبقاء على محتوى المستند']]);
 const diagramTasks={'design-process':'process','family-hierarchy':'hierarchy','nutrition-pyramid':'pyramid'};
 if(Object.hasOwn(diagramTasks,id)){
  const diagram=ps.find(p=>p.type==='diagram'&&p.layout===diagramTasks[id]);
  const checks=[[!!diagram,'التخطيط المناسب'],[new Set(diagram?.items?.map(normalize).filter(Boolean)).size>=3,'تسمية ثلاثة عناصر مختلفة']];
  if(id==='nutrition-pyramid')checks.push([lines.some(l=>l.includes('الهرم الغذائي')),'عنوان الهرم الغذائي'],[diagram?.color&&diagram.color!=='#bee6db','تغيير لون الهرم'],[named(state),'حفظ المستند']);
  return result(checks);
 }
 if(id==='illustrated-facts'){
  const images=ps.flatMap(p=>p.runs??[]).filter(r=>r.kind==='picture'&&r.src?.startsWith('data:image/jpeg;base64,'));
  return result([[text.includes('هل تعلم'),'عنوان المستند'],[lines.filter(l=>l.length>16).length>=4,'أربع فقرات معلومات'],[images.length>=2,'إدراج صورتين'],[images.some(r=>['left','right'].includes(r.wrap)),'التفاف النص حول صورة'],[ps.some(p=>p.border),'حدود الفقرة'],[ps.some(p=>p.fill),'تظليل الفقرة']]);
 }
 if(id==='weekend-paragraphs')return result([[lines.filter(Boolean).length===3,'ثلاث فقرات مستقلة'],...Array.from({length:3},(_,i)=>[(lines.filter(Boolean)[i]||'').split(/\s+/).length>=3,'كتابة محتوى الفقرة '+(i+1)])]);
 if(id==='fruit'){return result(['تفاح','اناناس','موز','apple','pineapple','banana'].map((v,i)=>[lines[i]===v,'السطر '+(i+1)+' '+v]));}
 if(id==='edit')return result([[text.includes('المشروبات الغازية')&&!text.includes('التفاح'),'استبدال التفاح'],[text.includes('غير صحي')&&!text.includes('مفيد'),'تعديل الوصف'],[text.length>15&&!text.includes('ايضا'),'حذف الكلمة الأخيرة'],[text.includes('لذيذ')&&text.includes('لصحتك'),'الإبقاء على بقية النص']]);
 if(id==='headline'){const title=ps[0];return result([[lines[0]==='التغير المناخي','الإبقاء على العنوان'],[styled(title,'bold'),'خط غامق'],[styled(title,'italic'),'خط مائل'],[styled(title,'underline'),'تسطير'],[styled(title,'highlight',v=>['yellow','#ffff00','rgb(255, 255, 0)'].includes(v)),'تمييز أصفر'],[styled(title,'size',v=>Number(v)===16),'حجم 16 نقطة'],[named(state),'حفظ أحدث نسخة']]);}
 if(id==='months'){
  const sets=[['محرم','صفر','ربيع الاول','ربيع الاخر','جمادى الاولى','جمادى الاخرة','رجب','شعبان','رمضان','شوال','ذو القعدة','ذو الحجة'],['يناير','فبراير','مارس','ابريل','مايو','يونيو','يوليو','اغسطس','سبتمبر','اكتوبر','نوفمبر','ديسمبر']];
  const canon=t=>t.replace('الثاني','الاخر').replace('الثانية','الاخرة').replace(/^ذي /,'ذو ').replace(/^ذو القعده$/,'ذو القعدة');
  const which=sets.map(s=>s.filter(v=>lines.map(canon).includes(v)).length);const months=sets[which[1]>which[0]?1:0];return result(months.map(v=>[ps.some((p,i)=>canon(lines[i])===v&&p.list==='ol'),'ترقيم '+v]));
 }
 if(id==='city'){const body=ps.slice(1).filter(p=>plain(p).trim().length>=12);return result([[lines[0]?.length>=3&&styled(ps[0],'bold'),'عنوان مميز'],[body.length>=2,'فقرتان تصفان المكانين'],[body.length>=2&&body.every(p=>p.border),'إطار كل فقرة'],[new Set(body.map(p=>p.fill).filter(Boolean)).size>=2,'تظليل مختلف'],[named(state),'حفظ المقال']]);}
 return {score:0,feedback:'تدريب غير معروف'};
}
