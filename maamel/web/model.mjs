export const HOME='https://بحث.test/';
export const pages=[
 {url:'https://موسوعة.test/الروبوتات',title:'الروبوتات',publisher:'موسوعة معامل التعليمية',text:'الروبوت آلة تنفذ سلسلة أوامر. تستقبل المستشعرات معلومات عن البيئة وتستخدم المحركات للتحرك.'},
 {url:'https://معرفة.test/الأمن-الرقمي',title:'الأمن الرقمي',publisher:'مكتبة معامل التعليمية',text:'الأمن الرقمي هو حماية الأجهزة والحسابات والملفات. نستخدم كلمات مرور قوية ونستعين بشخص بالغ عند تلقي رسالة مريبة.'},
 {url:'https://معرفة.test/الخصوصية',title:'الخصوصية',publisher:'مكتبة معامل التعليمية',text:'الخصوصية هي حق الإنسان في التحكم في معلوماته الشخصية وتحديد من يمكنه الاطلاع عليها.'},
 {url:'https://معرفة.test/الصلاة',title:'الصلاة',publisher:'مكتبة معامل التعليمية',text:'الصلاة ركن من أركان الإسلام. يؤدي المسلم الصلوات الخمس في أوقاتها.'},
 {url:'https://دليل.test/الدرعية',title:'معالم الدرعية',publisher:'دليل معامل التعليمي',text:'تقع الدرعية على ضفاف وادي حنيفة. يعرض حي الطريف نماذج من العمارة النجدية.',links:[5]},
 {url:'https://دليل.test/الطريف',title:'حي الطريف',publisher:'دليل معامل التعليمي',text:'تتميز مباني حي الطريف بجدرانها الطينية وأفنيتها الداخلية. يمكن للزائر ملاحظة تفاصيل العمارة النجدية.',links:[4]},
 {url:'https://مدونة.test/معالم',title:'معالم أعجبتني',publisher:'تدوينة بلا اسم أو مراجع',text:'أعجبني لون المباني القديمة. هذه ملاحظة شخصية من رحلة.'},
 {url:'https://www.vision2030.gov.sa/ar',title:'رؤية المملكة العربية السعودية 2030',publisher:'صفحة تدريب على التنقل',text:'تعرّف إلى محاور الرؤية، ثم اتبع الرابط لقراءة البطاقة التالية.',links:[8]},
 {url:'https://رؤية.test/المحاور',title:'محاور الرؤية',publisher:'صفحة تدريب على التنقل',text:'مجتمع حيوي، اقتصاد مزدهر، وطن طموح.'},
 {url:'https://www.neom.com/ar-sa',title:'نيوم',publisher:'صفحة تدريب على التنقل',text:'تعرّف إلى موقع نيوم شمال غرب المملكة العربية السعودية.'}
];
export const safety=[
 {question:'أي اسم تختار لحسابك التدريبي؟',options:['رقمي الشخصي','اسم شخصية خيالية','عنوان منزلي'],correct:1},
 {question:'وصلتك رسالة مزعجة تكررت. كيف تتصرف؟',options:['أنشرها للجميع','أرسل معلوماتي','أخبر شخصًا بالغًا أثق به'],correct:2},
 {question:'كيف تحافظ على فعالية برنامج مكافحة الفيروسات؟',options:['أحدّثه دوريًا','أغلقه عند الاتصال','أحذفه بعد تثبيته'],correct:0}
];
export const tasks=[
 {id:'safety',title:'السلامة عند استخدام الإنترنت',instructions:'اقرأ مواقف التواصل الرقمي واختر التصرف المناسب في كل موقف، ثم احفظ إجاباتك.',page:112},
 {id:'robot',title:'البحث عن الروبوتات',instructions:'ابحث عن الروبوتات. افتح بطاقة الموسوعة وسجّل عنوان الصفحة في حقل المصدر.',page:97,target:0},
 {id:'privacy',title:'مستند عن الخصوصية',instructions:'ابحث عن الخصوصية وانقل تعريفها إلى مستند. اذكر عنوان المصدر، واختر اسمًا للملف ثم احفظه.',page:106,target:2},
 {id:'security',title:'مستند عن الأمن الرقمي',instructions:'ابحث عن الأمن الرقمي وانقل تعريفه إلى مستند. سجّل عنوان المصدر واحفظ الملف باسم مناسب.',page:105,target:1},
 {id:'prayer',title:'مصدر عن الصلاة',instructions:'ابحث عن الصلاة، وانقل معلومة عنها، ثم دوّن عنوان المصدر واحفظ المستند.',page:104,target:3},
 {id:'landmark',title:'مشروع معلم من بلادي',instructions:'ابحث عن معالم الدرعية، واختر مصدرًا تعليميًا. اكتب معلومة منه في مستند باسم من اختيارك وسجّل عنوان المصدر.',page:114,target:4},
 {id:'vision',title:'زيارة موقع الرؤية',instructions:'اكتب https://www.vision2030.gov.sa/ar في شريط العنوان، وافتح ارتباط المحاور. سجّل عنوان الصفحة الجديدة وموضوعها في مستندك.',page:92,target:8}
];
export function initial(){return {history:[HOME],cursor:0,filename:'',source:'',note:'',saved:null};}
const norm=s=>String(s??'').replace(/[ًٌٍَُِّْ]/g,'').replace(/[أإآ]/g,'ا').trim().toLowerCase();
export function search(q){const words=norm(q).split(/\s+/).filter(Boolean);return words.length?pages.filter(p=>words.every(w=>norm(p.title+' '+p.text+' '+p.publisher).includes(w))):[];}
export function navigate(s,url){return {...s,history:[...s.history.slice(0,s.cursor+1),url].slice(-64),cursor:Math.min(s.cursor+1,63)};}
export function save(s){return {...s,saved:{filename:s.filename.trim(),source:s.source.trim(),note:s.note.trim()}};}
export function grade(s,id){if(id==='safety'){const count=safety.filter((q,i)=>s?.safetyAnswers?.[i]===q.correct).length;return {score:Math.round(100*count/safety.length),feedback:count===safety.length?'تعاملك مع المواقف يحمي خصوصيتك.':'راجع الاسم المستعار، وطريقة طلب المساعدة، وتحديث الحماية.'};}const t=tasks.find(x=>x.id===id)||tasks.find(x=>x.id==='robot'), p=pages[t.target], doc=t.id==='robot'?s:s?.saved;
 const src=doc?.source?.trim()===p.url; const correctNote=typeof doc?.note==='string'&&doc.note.trim().length>=10&&norm(p.text+' '+p.title).includes(norm(doc.note).replace(/[.،]+$/,''));
 const checks=t.id==='robot'?[src]:[src,correctNote,Boolean(doc?.filename?.trim())];
 return {score:Math.round(100*checks.filter(Boolean).length/checks.length),feedback:checks.every(Boolean)?'استوفيت معايير النشاط.':!src?'راجع عنوان المصدر المحدد في النشاط.':!correctNote?'انقل عبارة ذات معنى من البطاقة التعليمية.':'اختر اسمًا للمستند ثم احفظه.'};}

// Existing saved drafts store the active tab's history directly on the root.
export function tabAction(state, action, target) {
 const tabs = [...(state.tabs ?? [null])];
 let selected = state.tabIndex ?? 0;
 tabs[selected] = { history:[...state.history], cursor:state.cursor };
 if(action==='add'){
   if(tabs.length>=8)return state;
   tabs.push({history:[HOME],cursor:0});
   selected=tabs.length-1;
 } else if(action==='close'){
   if(tabs.length===1)return state;
   tabs.splice(selected,1);
   selected=Math.min(selected,tabs.length-1);
 } else if(action==='select' && Number.isInteger(target) && target>=0 && target<tabs.length){
   selected=target;
 } else return state;
 return {...state,tabs,tabIndex:selected,...tabs[selected]};
}
