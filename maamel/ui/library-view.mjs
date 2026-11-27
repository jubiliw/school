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
const families=[
 ['office','الإنتاجية المكتبية',['word','sheets','slides']],
 ['code','البرمجة والروبوت',['python','html','scratch','robot']],
 ['media','الوسائط والتصميم',['media','video','av','ai']],
 ['system','النظام والويب',['windows','web']]
];
const appTitles={word:'معالج النصوص',sheets:'الجداول الإلكترونية',slides:'العروض التقديمية',windows:'سطح المكتب',python:'محرر بايثون',html:'محرر الويب',scratch:'البرمجة المرئية',robot:'مختبر الروبوت',media:'محرر الصور',video:'مونتاج الفيديو',av:'مسجل الصوت',ai:'أداة القصاصة',web:'المتصفح'};
const english={word:'Word',sheets:'Excel',slides:'PowerPoint',windows:'Windows',python:'Python',html:'HTML',scratch:'Scratch',robot:'Open Roberta',media:'Photo Editor',video:'Shotcut',av:'Audio Recorder',ai:'Snipping Tool',web:'Web Browser'};
const strokes={
 word:'M7 3h10l5 5v17H7z M16 3v6h6 M10 13h9 M10 17h9 M10 21h6',
 sheets:'M3 5h22v19H3z M3 11h22 M3 17h22 M10 11v13 M17 11v13',
 slides:'M3 4h22v15H3z M14 19v5 M8 26l6-3 6 3 M8 15v-4 M13 15V8 M18 15v-6',
 windows:'M3 5h22v16H3z M10 25h9 M14 21v4',python:'M10 8l-6 6 6 6 M18 8l6 6-6 6 M16 5l-4 18',
 html:'M9 8l-6 6 6 6 M19 8l6 6-6 6 M16 5l-4 18',scratch:'M3 8h7q-2-7 3-6 4 0 3 6h7v6q-6-2-6 2t6 2v6H3z',
 robot:'M4 10h20v13H4z M14 10V5 M12 4h4 M8 15h2 M18 15h2 M10 19h8',
 media:'M3 5h22v18H3z M4 21l7-8 5 5 3-4 6 7 M18 10h2',video:'M3 9h22v15H3z M3 9l-1-5 21-3 1 5z M10 4l3 4 M17 3l3 4 M11 13l6 4-6 4z',
 av:'M10 11V7a4 4 0 0 1 8 0v5a4 4 0 0 1-8 0z M6 12a8 8 0 0 0 16 0 M14 20v5 M10 25h8',
 ai:'M5 3v18h20 M2 7h19v18 M11 15l12-12',web:'M25 14a11 11 0 1 1-22 0 11 11 0 0 1 22 0z M3 14h22 M14 3q-9 11 0 22 9-11 0-22z'
};
function appIcon(id){return '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+strokes[id]+'"/></svg>'}
function hero(guest){
 const action=guest?'<form class="code-entry"><label for="class-code">رمز الفصل</label><div><input id="class-code" name="code" required maxlength="64" placeholder="أدخل رمز معلمك" autocomplete="off" autocapitalize="characters"><button class="primary">دخول المعمل</button></div><output role="alert"></output></form>':'<a class="mint-link" href="#dashboard">واجباتي</a>';
 return '<section class="portal-hero"><div class="hero-text"><h1>'+(guest?'معملك الرقمي،<br><em>بين يديك.</em>':'معامل الحاسب')+'</h1><p>'+(guest?'افتح برامج الحاسب وطبّق دروسك من المدرسة أو البيت.':'اختر أحد برامج فصلك وابدأ العمل.')+'</p>'+action+'</div><div class="machine-scene" aria-hidden="true"><div class="mesh-floor"></div><img src="/ui/workstation.webp" alt="" width="860" height="690"></div></section>';
}
export function showLibrary(main,catalog,allowed=desktopPrograms(catalog),guestEntry=null,teacher=false){
 const order=['word','sheets','slides','python','windows','html','scratch','media','video','robot','av','web','ai'];
 const programs=order.filter(id=>allowed.includes(id));
 const groups=families.filter(([, ,ids])=>ids.some(id=>programs.includes(id)));
 main.innerHTML=hero(Boolean(guestEntry)).replace('>واجباتي<',teacher?'>فصولي<':'>واجباتي<')+'<section id="program-list" class="app-library"><div class="library-heading"><h2>'+(guestEntry?'استكشف المعامل':'المعامل المتاحة')+'</h2><span>'+new Intl.NumberFormat('ar-SA').format(programs.length)+' معمل</span></div><div class="family-filter" aria-label="تصفية المعامل">'+[['all','الكل'],...groups].map(([key,title],i)=>'<button type="button" aria-pressed="'+(i===0)+'" data-family="'+key+'">'+title+'</button>').join('')+'</div><div class="launch-grid"></div></section>';
 const grid=main.querySelector('.launch-grid');
 function paint(family){
 const ids=family==='all'?programs:programs.filter(id=>groups.find(([key])=>key===family)[2].includes(id));
 grid.innerHTML=ids.map(id=>'<a class="launch-tile" style="--tone:'+color[id]+'" href="#lab/'+id+'"><span class="launch-icon">'+appIcon(id)+'</span><span class="launch-titles"><small lang="en" dir="ltr">'+english[id]+'</small><strong>'+appTitles[id]+'</strong></span><span class="launch-open" aria-hidden="true">↗</span><p>'+desc[id]+'</p></a>').join('')||'<p>تظهر المعامل هنا عندما يتيحها المعلم للفصل.</p>';
 }
 main.querySelector('.family-filter').onclick=e=>{const chip=e.target.closest('[data-family]');if(!chip)return;main.querySelectorAll('[data-family]').forEach(b=>b.setAttribute('aria-pressed',String(b===chip)));paint(chip.dataset.family)};
 paint('all');
 if(guestEntry){
 const form=main.querySelector('.code-entry'),input=form.elements.code;
 grid.onclick=e=>{const tile=e.target.closest('.launch-tile');if(!tile)return;e.preventDefault();form.dataset.lab=tile.hash;form.querySelector('output').textContent='أدخل رمز الفصل لفتح '+appTitles[tile.hash.split('/')[1]]+'.';input.focus()};
 form.onsubmit=async e=>{e.preventDefault();const submit=form.querySelector('button');submit.disabled=true;form.querySelector('output').textContent='';try{await guestEntry(input.value,form.dataset.lab)}catch(error){form.querySelector('output').textContent=error.message}finally{submit.disabled=false}};
 }
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
