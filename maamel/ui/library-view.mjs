import {placements,programsFor,gradeNames,termNames} from './course-catalog.mjs';
export const names={windows:'سطح المكتب · Windows',word:'معالجة النصوص · Word',sheets:'الجداول الإلكترونية · Excel',slides:'العروض التقديمية · PowerPoint',scratch:'البرمجة المرئية · Scratch',robot:'مختبر الروبوت · Open Roberta',web:'متصفح الويب',av:'مسجل الصوت ومشغل الفيديو',media:'محرر الصور',ai:'أداة القصاصة',review:'تقويم الوحدة'};
Object.assign(names,{python:'محرر Python',html:'محرر HTML',video:'مونتاج الفيديو · Shotcut',av:'مسجل الصوت'});
const glyph={python:'Py',html:'</>',video:'▷',windows:'▤',word:'Aa',sheets:'ƒx',slides:'▧',scratch:'{ }',robot:'⌁',web:'◎',av:'◖))',media:'◩',ai:'⌗',review:'✓'};
const desc={python:'كتابة البرامج وتشغيلها في نافذة المخرجات',html:'تحرير صفحات الويب ومعاينتها',video:'ترتيب المقاطع وقصها وتصدير الفيلم',windows:'الملفات والمجلدات وإعدادات الجهاز',word:'تحرير المستند وتنسيق النص والفقرات',sheets:'الخلايا والصيغ والعمليات الحسابية',slides:'تصميم الشرائح وتشغيل العرض',scratch:'اللبنات والأحداث والرسم بالقلم',robot:'برمجة المحركات واختبار المسار',web:'التصفح والبحث عن المعلومات',av:'تسجيل المقاطع وتشغيل الوسائط',media:'تحسين الصور واقتصاصها وحفظها',ai:'تحديد منطقة واستخراج نصها',review:'أسئلة الوحدات والتصحيح الفوري'};
const color={python:'#34638d',html:'#a74439',video:'#385a7b',windows:'#097e77',word:'#295ab2',sheets:'#23835a',slides:'#ba512e',scratch:'#8a5aaa',robot:'#336888',web:'#1379a3',av:'#925590',media:'#137c7b',ai:'#6b688d',review:'#667250'};
function esc(v){const n=document.createElement('span');n.textContent=String(v??'');return n.innerHTML}
export function desktopPrograms(catalog){
 return [...new Set([...catalog.map(lab=>lab.id),'python','html','video'])].filter(id=>id!=='review' && Object.hasOwn(names,id));
}
export function showLibrary(main,catalog,allowed=desktopPrograms(catalog)){
 const cards=allowed.map(id=>`<a class="app-tile" style="--tone:${color[id]}" href="#lab/${id}"><span class="app-icon" aria-hidden="true">${glyph[id]}</span><h3>${names[id]}</h3><p>${desc[id]}</p></a>`).join('');
 main.innerHTML=`<section class="studio desktop-banner"><div class="studio-copy"><h1>معامل الحاسب</h1><p>افتح برنامجك وابدأ العمل.</p></div><div class="studio-art" aria-hidden="true"><div class="circuit"></div><div class="terminal"><i></i><i></i><i></i><div><b>❯</b><em></em></div><div><em></em></div><div><b>❯</b><strong>_</strong></div></div></div></section><section aria-label="البرامج"><div class="program-grid">${cards}</div></section>`;
}
export function showProgram(main,catalog,id,grade,term){
 const scoped=grade&&term,lab=(scoped?programsFor(catalog,grade,term):catalog).find(l=>l.id===id);
 if(!lab)throw Error('لا يوجد تدريب لهذا البرنامج ضمن الفصل المحدد.');
 const context=scoped?'/'+grade+'/'+term:'';
 main.innerHTML='<div class="lead"><a href="'+(scoped?'#course'+context:'#home')+'">البرامج العملية</a><h1>'+names[id]+'</h1></div><div class="box">'+lab.tasks.map(task=>{
  const p=scoped?task.placements.find(p=>p.grade===+grade&&p.term===+term):task.placements[0];
  return '<div class="listrow"><div><strong>'+esc(task.title)+'</strong><small class="meta">'+esc(p.unit)+' · '+esc(p.lesson)+' · ص '+esc(p.page)+'</small></div><a class="primary" href="#practice/'+id+'/'+encodeURIComponent(task.id)+context+'">فتح التدريب</a></div>'
 }).join('')+'</div>';
}
