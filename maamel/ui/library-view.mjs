import {placements,programsFor,gradeNames,termNames} from './course-catalog.mjs';
export const names={windows:'سطح المكتب · Windows',word:'معالجة النصوص · Word',sheets:'الجداول الإلكترونية · Excel',slides:'العروض التقديمية · PowerPoint',scratch:'البرمجة المرئية · Scratch',robot:'مختبر الروبوت · Open Roberta',web:'متصفح الويب',av:'مسجل الصوت ومشغل الفيديو',media:'محرر الصور',ai:'أداة القصاصة',review:'تقويم الوحدة'};
const glyph={windows:'▤',word:'Aa',sheets:'ƒx',slides:'▧',scratch:'{ }',robot:'⌁',web:'◎',av:'◖))',media:'◩',ai:'⌗',review:'✓'};
const desc={windows:'الملفات والمجلدات وإعدادات الجهاز',word:'تحرير المستند وتنسيق النص والفقرات',sheets:'الخلايا والصيغ والعمليات الحسابية',slides:'تصميم الشرائح وتشغيل العرض',scratch:'اللبنات والأحداث والرسم بالقلم',robot:'برمجة المحركات واختبار المسار',web:'التصفح والبحث عن المعلومات',av:'تسجيل المقاطع وتشغيل الوسائط',media:'تحسين الصور واقتصاصها وحفظها',ai:'تحديد منطقة واستخراج نصها',review:'أسئلة الوحدات والتصحيح الفوري'};
const color={windows:'#097e77',word:'#295ab2',sheets:'#23835a',slides:'#ba512e',scratch:'#8a5aaa',robot:'#336888',web:'#1379a3',av:'#925590',media:'#137c7b',ai:'#6b688d',review:'#667250'};
function esc(v){const n=document.createElement('span');n.textContent=String(v??'');return n.innerHTML}
function tile(lab,grade,term){return '<a class="app-tile" style="--tone:'+color[lab.id]+'" href="#program/'+grade+'/'+term+'/'+lab.id+'"><span class="app-icon" aria-hidden="true">'+glyph[lab.id]+'</span><h3>'+names[lab.id]+'</h3><p>'+desc[lab.id]+'</p><small>'+lab.tasks.length.toLocaleString('ar-SA')+' تدريبات</small></a>'}
export function showLibrary(main,catalog,g,t){
 const available=placements(catalog),grades=[...new Set(available.map(p=>p.grade))];
 const grade=grades.includes(+g)?+g:grades[0],terms=available.filter(p=>p.grade===grade);
 const term=terms.find(p=>p.term===+t)?.term??terms[0].term;
 const programs=programsFor(catalog,grade,term);
 main.innerHTML='<section class="studio"><div class="studio-copy"><span>معامل الحاسب</span><h1>مساحة البرامج</h1><p>اختر صفّك وفصلك الدراسي لفتح البرامج العملية في كتابك.</p></div><div class="studio-art" aria-hidden="true"><div class="circuit"></div><div class="terminal"><i></i><i></i><i></i><div><b>❯</b> <em></em></div><div><em></em></div><div><b>❯</b> <strong>_</strong></div></div><div class="glass-key key-a">{ }</div><div class="glass-key key-b">ƒx</div></div></section>'+
 '<section class="course-pick" aria-label="اختيار المنهج"><label>الصف الدراسي<select id="pickgrade">'+grades.map(n=>'<option value="'+n+'" '+(n===grade?'selected':'')+'>'+gradeNames[n]+'</option>').join('')+'</select></label><div><b>الفصل الدراسي</b><div class="term-pills">'+terms.map(p=>'<a href="#course/'+grade+'/'+p.term+'" '+(p.term===term?'aria-current="page"':'')+'>'+termNames[p.term]+'</a>').join('')+'</div></div></section>'+
 '<div class="heading"><h2>البرامج العملية</h2><span class="meta">'+gradeNames[grade]+' · '+termNames[term]+'</span></div><div class="program-grid">'+programs.filter(l=>l.id!=='review').map(l=>tile(l,grade,term)).join('')+'</div>'+
 (programs.some(l=>l.id==='review')?'<a class="review-link" href="#program/'+grade+'/'+term+'/review">فتح تقويمات هذا الفصل</a>':'');
 main.querySelector('#pickgrade').onchange=e=>{const n=+e.target.value;location.hash='course/'+n+'/'+available.find(p=>p.grade===n).term};
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
