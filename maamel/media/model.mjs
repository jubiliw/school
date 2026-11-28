import {storyTasks,gradeStory} from './story.mjs';
export const assets=[
 {id:'coast',name:'جدة',kind:'scene',spots:[[.23,.18],[.68,.15]]},
 {id:'leaves',name:'أوراق الشجر',kind:'plant'},
 {id:'portrait',name:'الولد',kind:'face',eyes:[[.416,.43],[.584,.43]]},
 {id:'pyramid',name:'الهرم الغذائي',kind:'pyramid'},
 {id:'bird',name:'طائر',kind:'animal'}, {id:'cat',name:'قطة',kind:'animal'}
];
export const tasks=[...storyTasks,
 {id:'coast',title:'تأثيرات شاطئ جدة',instructions:'افتح صورة جدة. اجعلها بالأبيض والأسود، وزد السطوع، وطبّق تأثير الصحراء. احفظ الصورة المعدلة.',page:269},
 {id:'spot',title:'تنظيف السماء',instructions:'افتح صورة جدة واختر التعديلات ثم إصلاح الأخطاء. حدّد البقعتين في السماء واحفظ الصورة.',page:264},
 {id:'eyes',title:'تصحيح العين الحمراء',instructions:'افتح صورة الولد، واختر العين الحمراء ثم اضغط على كل عين واحفظ التغييرات.',page:257},
 {id:'crop',title:'قصّ ورقة شجر',instructions:'افتح أوراق الشجر واستخدم القص لتحتفظ بورقة واحدة كاملة. اسحب من إحدى زوايا الجزء المطلوب إلى الزاوية المقابلة، ثم احفظ.',page:262},
 {id:'turn',title:'تدوير الهرم الغذائي',instructions:'افتح الهرم الغذائي المقلوب ودوّره حتى تتجه قمته إلى أعلى، ثم احفظ.',page:264},
 {id:'album',title:'صور قديمة',instructions:'اجعل صورة واحدة تبدو قديمة باستخدام مرشح التدرج الرمادي، ثم احفظ نسخة في ألبوم باسم «صور قديمة».',page:267},
 {id:'collection',title:'تنظيم مجموعة الصور',instructions:'استعرض الرسوم، ثم احذف صور الحيوانات من مجموعة التدريب مع الاحتفاظ بالصور الأخرى. يمكنك استعادتها من السلة.',page:253}
];
export function fresh(){return {rotation:0,crop:[0,0,1,1],light:100,color:100,filter:'none',fixes:[]};}
export function initial(){return {selected:'coast',edits:{},saved:{},deleted:[],copies:[]};}
export function edit(s,id,patch){return {...s,edits:{...s.edits,[id]:{...fresh(),...s.edits[id],...patch}}};}
export function save(s,id){return {...s,saved:{...s.saved,[id]:structuredClone(s.edits[id]||fresh())}};}
export function mark(s,mode,x,y){const item=assets.find(a=>a.id===s.selected),points=mode==='eyes'?item?.eyes:mode==='spot'?item?.spots:null;
 const i=points?.findIndex(([u,v])=>Math.hypot(x-u,(y-v)*.6)<.046);if(i==null||i<0)return s;const fixes=s.edits[item.id]?.fixes||[];return edit(s,item.id,{fixes:[...new Set([...fixes,i])]});}
export const leaves=[[.23,.32],[.53,.6],[.80,.32]];
function isolated(c){const [x,y,w,h]=c||[];return w>=.16&&h>=.20&&w*h<=.45&&leaves.filter(([u,v])=>u-.078>=x&&u+.078<=x+w&&v-.09>=y&&v+.09<=y+h).length===1&&leaves.filter(([u,v])=>u>x&&u<x+w&&v>y&&v<y+h).length===1;}
export function grade(s,id){if(storyTasks.some(t=>t.id===id))return gradeStory(s?.story,id);let checks=[];const src=s?.saved||{};if(id==='spot'||id==='eyes'){const e=src[id==='spot'?'coast':'portrait'];checks=[0,1].map(i=>Array.isArray(e?.fixes)&&e.fixes.includes(i));}
 else if(id==='turn')checks=[src.pyramid?.rotation===2];else if(id==='crop')checks=[isolated(src.leaves?.crop)];else if(id==='album')checks=[s?.copies?.some(c=>c.album==='صور قديمة'&&(c.edit?.filter==='vanilla'||c.edit?.color===0))];else if(id==='collection')checks=['bird','cat'].map(id=>Array.isArray(s?.deleted)&&s.deleted.includes(id)&&!assets.some(a=>a.kind!=='animal'&&s.deleted.includes(a.id)));
 else {const e=src.coast;checks=[e?.color===0,e?.light>100,e?.filter==='desert'];}
 const score=Math.round(100*checks.filter(Boolean).length/checks.length);return {score,feedback:score===100?'الصورة أو المجموعة المحفوظة تحقق معايير النشاط.':'تحقق من التعليمات ومن حفظ الصورة بعد تعديلها.'};}
