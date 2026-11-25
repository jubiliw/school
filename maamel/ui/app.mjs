import {showLibrary,showProgram,names,desktopPrograms} from './library-view.mjs';
import {gradeNames,termNames,placements,programsFor} from './course-catalog.mjs';
const main=document.querySelector('#main'), dialog=document.querySelector('#panel'), dialogBody=document.querySelector('#dialog-body'), account=document.querySelector('#account');
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(label,action,kind='primary')=>'<button type="button" class="'+kind+'" data-act="'+action+'">'+escape(label)+'</button>';
const summary=(v)=>typeof v==='string'?v:Array.isArray(v)?v.map(x=>typeof x==='string'?x:x.label||x.message||'').join('، '):'';
const fmt=new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium',timeStyle:'short'});
function field(label,name,type='text',extra=''){return '<label class="field">'+label+'<input required name="'+name+'" type="'+type+'" '+extra+'></label>'}
function select(label,name,opts){return '<label class="field">'+label+'<select required name="'+name+'">'+opts+'</select></label>'}
function opt(key,name){return '<option value="'+escape(key)+'">'+escape(name)+'</option>'}
let user=null,catalog=[],routeEpoch=0,destroy=null,noticeTimeout;
async function api(path,method='GET',body){let response;try{response=await fetch('/api/'+path,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},body:body&&JSON.stringify(body)})}catch{throw Error('تعذر الاتصال. تحقق من الشبكة ثم أعد المحاولة.')}const result=await response.json().catch(()=>({}));if(!response.ok){const error=Error(result.error||'تعذّر إكمال الطلب.');error.status=response.status;throw error}return result}
function notify(message){clearTimeout(noticeTimeout);document.querySelector('#notice').textContent=message;noticeTimeout=setTimeout(()=>document.querySelector('#notice').textContent='',4500)}
function modal(title,html){document.querySelector('#dialog-title').textContent=title;dialogBody.innerHTML=html;if(!dialog.open)dialog.showModal()}
document.querySelector('#close').onclick=()=>dialog.close();
function form(title,fields,label,save,lead=''){modal(title,lead+'<form class="stack">'+fields+'<span class="formerror" role="alert"></span><button class="primary">'+label+'</button></form>');const f=dialogBody.querySelector('form');f.onsubmit=async e=>{e.preventDefault();const submit=f.querySelector('button');submit.disabled=true;try{await save(Object.fromEntries(new FormData(f)));dialog.close()}catch(err){f.querySelector('.formerror').textContent=err.message}finally{submit.disabled=false}}}
function auth(register=false){const lead='<div class="tabs">'+button('تسجيل الدخول','login',register?'outline':'secondary')+button('حساب جديد','register',register?'secondary':'outline')+'</div>';form('حساب معامل',(register?select('نوع الحساب','role',opt('teacher','معلم')+opt('student','طالب'))+field('اسم العرض','name','text','maxlength="80" autocomplete="nickname" placeholder="يكفي اسم مستعار"'):'')+field('اسم الدخول','username','text','minlength="3" maxlength="60" autocomplete="username"')+field('كلمة المرور','password','password','minlength="'+(register?10:1)+'" autocomplete="'+(register?'new-password':'current-password')+'"')+(register?'<small>استخدم عشرة أحرف على الأقل لكلمة المرور.</small>':''),register?'إنشاء الحساب':'دخول',async data=>{const result=await api(register?'register':'login','POST',data);user=result.user;account.textContent=user.name;if(location.hash==='#dashboard')await render();else location.hash='dashboard'},lead);dialogBody.querySelector('[data-act=login]').onclick=()=>auth(false);dialogBody.querySelector('[data-act=register]').onclick=()=>auth(true)}
account.onclick=()=>{if(!user)return auth();modal('حساب '+escape(user.name),'<div class="stack">'+button('فتح لوحة الفصل','dash')+button('تسجيل الخروج','logout','outline')+'</div>');dialogBody.querySelector('[data-act=dash]').onclick=()=>{dialog.close();location.hash='dashboard'};dialogBody.querySelector('[data-act=logout]').onclick=async()=>{try{await api('logout','POST',{});user=null;account.textContent='دخول الحساب';dialog.close();for(const key of Object.keys(sessionStorage))if(key.startsWith('maamel-work:'))sessionStorage.removeItem(key);location.hash='home';await render()}catch(e){notify(e.message)}}};
function connect(action,handler){const el=main.querySelector('[data-act="'+action+'"]');if(el)el.onclick=handler}
function lessonTask(lab,id){return catalog.find(l=>l.id===lab)?.tasks.find(t=>t.id===id)}
function labelState(s){return ({submitted:'تم التسليم',pending:'لم يبدأ',draft:'مسودة',reopened:'أعيد فتحه'})[s]||''}
async function dashboard(epoch){if(!user){main.innerHTML='<div class="box"><h1>فصلي</h1><p>ادخل بحسابك لإنشاء فصل أو الانضمام إليه برمز المعلم.</p>'+button('دخول الحساب','auth')+'</div>';connect('auth',()=>auth());return}
if(user.role==='admin'){const admin=await import('/admin-ui.mjs');if(epoch===routeEpoch){main.replaceChildren();await admin.mount(main,(url,method,body)=>api(url.replace(/^\/api\//,''),method,body))}return}
const [c,a]=await Promise.all([api('classes'),api('assignments')]);if(epoch!==routeEpoch)return;const teacher=user.role==='teacher';main.innerHTML='<div class="heading"><div class="lead"><div class="meta">'+(teacher?'مساحة المعلم':'مساحة الطالب')+'</div><h1>أهلًا، '+escape(user.name)+'</h1></div>'+button(teacher?'إنشاء فصل':'الانضمام إلى فصل','class')+'</div><section class="box"><h2>فصولي</h2>'+(c.classes.map(x=>'<div class="listrow"><strong>'+escape(x.name)+'</strong>'+(teacher?'<span>رمز الانضمام <b dir="ltr">'+escape(x.code)+'</b></span>':'')+'</div>').join('')||'<p>لم تنضم إلى فصل بعد.</p>')+'</section><div class="heading"><h2>الواجبات</h2>'+(teacher&&c.classes.length?button('إنشاء واجب','assign'):'')+'</div><section class="box">'+(a.assignments.map(x=>'<div class="listrow"><div><strong>'+escape(x.title)+'</strong><small>'+escape(x.className)+(x.dueAt?' · التسليم '+escape(fmt.format(new Date(x.dueAt))):'')+'</small></div><div class="actions">'+(teacher?'':'<span>'+labelState(x.status)+(x.score!=null?' · '+escape(x.score)+'٪':'')+'</span>')+'<a class="outline" href="#'+(teacher?'results':'assignment')+'/'+encodeURIComponent(x.id)+'">'+(teacher?'نتائج الطلاب':'فتح الواجب')+'</a></div></div>').join('')||'<p>لا توجد واجبات حتى الآن.</p>')+'</section>';connect('class',()=>form(teacher?'إنشاء فصل':'الانضمام إلى فصل',teacher?field('اسم الفصل','name'):field('رمز الفصل','code'),teacher?'إنشاء':'انضمام',async data=>{await api(teacher?'classes':'join','POST',data);await render()}));connect('assign',()=>assignmentEditor(c.classes))}
function assignmentEditor(classes){
 const scopes=placements(catalog),grades=[...new Set(scopes.map(p=>p.grade))];
 const options=select('الفصل المدرسي','classId',classes.map(c=>opt(c.id,c.name)).join(''))+
  select('الصف الدراسي','grade',grades.map(g=>opt(g,gradeNames[g])).join(''))+
  select('الفصل الدراسي','term','')+select('البرنامج','lab','')+select('التدريب','task','')+
  field('اسم الواجب','title')+'<label class="field">موعد التسليم (اختياري)<input type="datetime-local" name="due"></label>';
 form('إنشاء واجب',options,'نشر الواجب',async data=>{
  await api('assignments','POST',{lab:data.lab,task:data.task,grade:+data.grade,term:+data.term,classId:data.classId,title:data.title,dueAt:data.due?new Date(data.due).toISOString():null});
  await render();
 });
 const inputs=dialogBody.querySelector('form').elements;
 const updateTasks=()=>{
  const lab=programsFor(catalog,inputs.grade.value,inputs.term.value).find(l=>l.id===inputs.lab.value);
  inputs.task.innerHTML=lab.tasks.map(t=>opt(t.id,t.title)).join('');
 };
 const updatePrograms=()=>{
  inputs.lab.innerHTML=programsFor(catalog,inputs.grade.value,inputs.term.value).map(l=>opt(l.id,names[l.id])).join('');updateTasks();
 };
 const updateTerms=()=>{
  inputs.term.innerHTML=scopes.filter(p=>p.grade===+inputs.grade.value).map(p=>opt(p.term,termNames[p.term])).join('');updatePrograms();
 };
 inputs.grade.onchange=updateTerms;inputs.term.onchange=updatePrograms;inputs.lab.onchange=updateTasks;updateTerms();
}

async function results(id,epoch){const [r,d]=await Promise.all([api('assignments/'+id+'/results'),api('assignments/'+id)]);if(epoch!==routeEpoch)return;main.innerHTML='<div class="lead"><a href="#dashboard">فصلي</a><h1>'+escape(d.assignment.title)+'</h1></div><div class="heading"><h2>نتائج الطلاب</h2><a class="outline" href="/api/assignments/'+encodeURIComponent(id)+'/export" download>تصدير الدرجات CSV</a></div><div class="box">'+(r.results.map((x,i)=>'<div class="listrow"><div><b>'+escape(x.name)+'</b><small>'+labelState(x.status)+' · '+x.attempts+' محاولات</small></div><div class="actions"><strong>'+(x.score??'—')+(x.score!=null?'٪':'')+'</strong>'+(x.attempts?button('المحاولات','history'+i,'outline'):'')+(x.status==='submitted'?button('إعادة فتح','reopen'+i,'secondary'):'')+'</div></div>').join('')||'تظهر النتائج بعد انضمام الطلاب.')+'</div>';r.results.forEach((x,i)=>{connect('reopen'+i,async()=>{try{await api('assignments/'+id+'/reopen','POST',{studentId:x.studentId});await render()}catch(e){notify(e.message)}});connect('history'+i,async()=>{try{const h=await api('assignments/'+id+'/attempts?studentId='+encodeURIComponent(x.studentId));modal('محاولات '+x.name,h.attempts.map((attempt,n)=>'<div class="box"><b>'+attempt.score+'٪</b> · '+fmt.format(new Date(attempt.submittedAt))+'<p>'+escape(summary(attempt.feedback))+'</p>'+button('عرض العمل المسلّم','inspect'+n,'outline')+'</div>').join(''));
dialogBody.querySelectorAll('[data-act]').forEach((b,n)=>b.onclick=async()=>{
 const lab=d.assignment.lab;if(!lessonTask(lab,d.assignment.task))return;
 const ui=await import('/'+lab+'/index.mjs');
 modal('عمل '+x.name,'<p class="meta">نسخة المحاولة المحفوظة · '+h.attempts[n].score+'٪</p><div id="snapshot"></div>');
 dialog.classList.add('wide');const target=dialogBody.querySelector('#snapshot');const cleanup=ui.mount(target,structuredClone(h.attempts[n].state),()=>{},d.assignment.task);target.inert=true;
 dialog.addEventListener('close',()=>{dialog.classList.remove('wide');if(typeof cleanup==='function')cleanup();target.replaceChildren()},{once:true});
})}catch(e){notify(e.message)}})})}
async function workspace(lab,taskId,assignmentId,epoch,grade,term){
 let detail=null;if(assignmentId){detail=await api('assignments/'+assignmentId);lab=detail.assignment.lab;taskId=detail.assignment.task;grade=detail.assignment.grade;term=detail.assignment.term}
 const task=lessonTask(lab,taskId);if(!task)throw Error('تعذر العثور على التدريب.');const [ui,model]=await Promise.all([import('/'+lab+'/index.mjs'),import('/'+lab+'/model.mjs')]);if(epoch!==routeEpoch)return;
 const place=task.placements.find(p=>p.grade===+grade&&p.term===+term)??task.placements[0];
 const key=assignmentId?'maamel-work:'+user.id+':'+assignmentId:'maamel-practice:'+lab+':'+task.id;const storage=assignmentId?sessionStorage:localStorage;let cached=null;try{cached=JSON.parse(storage.getItem(key))}catch{}
 let version=detail?.work.version??0,locked=detail?.work.status==='submitted',dirty=false,busy=false,timer=null,changeNo=0,dead=false,conflict=false;
 const resumable=cached&&(!assignmentId||cached.version===version&&!locked);let state=resumable?cached.state:detail?.work.state??model.initial(taskId);dirty=Boolean(resumable&&assignmentId);
 const instructions=Array.isArray(task.instructions)?task.instructions.join(' · '):task.instructions;
 main.innerHTML='<div class="workspace-head"><a href="'+(assignmentId?'#dashboard':'#program/'+place.grade+'/'+place.term+'/'+lab)+'">'+(assignmentId?'فصلي':'تدريبات البرنامج')+'</a><h1>'+escape(names[lab])+'</h1><span>'+gradeNames[place.grade]+' · '+termNames[place.term]+'</span></div><details class="task-brief" open><summary>'+escape(detail?.assignment.title||task.title)+'</summary><p>'+escape(instructions)+'</p><small>'+escape(place.lesson)+' · ص '+escape(place.page)+'</small></details><div class="workbar"><span class="meta" id="savestatus" role="status"></span>'+(!locked?button(assignmentId?'حفظ العمل':'حفظ على الجهاز','save','outline')+button(assignmentId?'تسليم الواجب':'تحقق من عملي','submit'):'')+'</div><div id="assessment" aria-live="polite"></div><div class="workspace" id="sim"></div>';
 const status=main.querySelector('#savestatus'),assessment=main.querySelector('#assessment'),host=main.querySelector('#sim');
 function result(score,feedback){assessment.className='result';assessment.textContent='الدرجة '+score+' من ١٠٠ · '+summary(feedback)}
 function cache(){try{storage.setItem(key,JSON.stringify({state,version}));return true}catch{return false}}
 async function persist(submit=false){clearTimeout(timer);if(busy||locked||conflict||dead)return;busy=true;const seq=changeNo;
 const submitButton=main.querySelector('[data-act=submit]');if(submitButton)submitButton.disabled=true;
 if(submit&&assignmentId)host.inert=true;
 try{if(assignmentId){status.textContent='جارٍ الحفظ…';const saved=await api('assignments/'+assignmentId+'/'+(submit?'submit':'work'),submit?'POST':'PUT',{state,version});version=saved.version;dirty=seq!==changeNo;if(dirty)cache();else storage.removeItem(key);locked=saved.status==='submitted';if(!dead){status.textContent=locked?'تم تسليم الواجب':'حُفظ في حسابك';if(locked){result(saved.score,saved.feedback);main.querySelectorAll('.workbar button').forEach(b=>b.remove())}}}else{const ok=cache();status.textContent=ok?'حُفظ التدريب على هذا الجهاز':'لم تتوفر مساحة للحفظ على هذا الجهاز';if(submit){const g=model.grade(state,taskId);result(g.score,g.feedback)}}}
 catch(error){if(error.status===409){conflict=true;status.textContent='تغيّرت نسخة الواجب. أعد فتحه لتحميل النسخة الحالية.'}else{const ok=cache();status.textContent=error.message+(ok?' مسودتك محفوظة في هذه الجلسة.':' تعذّر حفظ نسخة في المتصفح.')}}finally{busy=false;if(submitButton)submitButton.disabled=false;if(!locked)host.inert=false;if(dirty&&seq!==changeNo&&!dead&&!conflict)timer=setTimeout(()=>persist(),450)}}
 const cleanup=ui.mount(host,state,next=>{if(locked||dead)return;state=next;changeNo++;dirty=true;const ok=cache();status.textContent=assignmentId?(ok?'مسودة على الجهاز · بانتظار المزامنة':'تغييرات بانتظار الحفظ'):(ok?'محفوظ على الجهاز':'تعذر الحفظ على الجهاز');if(assignmentId){clearTimeout(timer);timer=setTimeout(()=>persist(),650)}},taskId);
 status.textContent=locked?'تم التسليم':resumable?'استُعيدت المسودة':assignmentId?'العمل مرتبط بحسابك':'تدريب حر على هذا الجهاز';host.inert=locked;
 if(locked)result(detail.work.score,detail.work.feedback);
 connect('save',()=>persist());connect('submit',()=>persist(true));const online=()=>{if(dirty&&!locked)persist()};window.addEventListener('online',online);if(dirty&&assignmentId)timer=setTimeout(()=>persist(),700);
 destroy=()=>{dead=true;clearTimeout(timer);window.removeEventListener('online',online);if(typeof cleanup==='function')cleanup();else cleanup?.destroy?.()}}
async function openDesktop(lab,epoch){
 if(!desktopPrograms(catalog).includes(lab))throw Error('البرنامج غير متاح');
 const standalone=['html','python','video'].includes(lab);
 const ui=standalone?await import('/studio/'+(lab==='video'?'video':'code')+'.mjs'):await import('/'+lab+'/index.mjs');
 const model=standalone?ui:await import('/'+lab+'/model.mjs');
 if(epoch!==routeEpoch)return;
 const key='maamel-desktop:'+(user?.id??'guest')+':'+lab;
 let state=model.initial(standalone?lab:'free');
 try{const saved=localStorage.getItem(key);if(saved)state=JSON.parse(saved)}catch{}
 main.innerHTML='<div class="workspace-head"><a href="#home">‹ المعامل</a><h1>'+escape(names[lab])+'</h1><span role="status">مساحة العمل على هذا الجهاز</span></div><div id="sim" class="workspace"></div>';
 const status=main.querySelector('[role=status]');
 const cleanup=ui.mount(main.querySelector('#sim'),state,next=>{
  try{localStorage.setItem(key,JSON.stringify(next));status.textContent='محفوظ على هذا الجهاز'}catch{status.textContent='تعذّر الحفظ على هذا الجهاز'}
 },standalone?lab:'free');
 destroy=()=>{if(typeof cleanup==='function')cleanup();else cleanup?.destroy?.()};
}
async function render(){const epoch=++routeEpoch;destroy?.();destroy=null;const [view='home',id,task,extra,term]=(location.hash.slice(1)||'home').split('/').map(decodeURIComponent);document.body.classList.toggle('desktop-home',['home','course'].includes(view));main.innerHTML='<p class="lead" role="status">جارٍ الفتح…</p>';document.querySelectorAll('.bar nav a').forEach(a=>a.setAttribute('aria-current',(a.hash==='#home'?['home','course','program','lab','practice']:['dashboard','assignment','results']).includes(view)?'page':'false'));try{if(view==='home'||view==='course')showLibrary(main,catalog,id,task);else if(view==='program')showProgram(main,catalog,extra,id,task);else if(view==='lab')await openDesktop(id,epoch);else if(view==='practice')await workspace(id,task,null,epoch,extra,term);else if(view==='dashboard')await dashboard(epoch);else if(['assignment','results'].includes(view)){if(!user)return dashboard(epoch);if(view==='results')await results(id,epoch);else await workspace(null,null,id,epoch)}else showLibrary(main,catalog)}catch(e){if(epoch===routeEpoch){main.innerHTML='<section class="box"><p role="alert">'+escape(e.message)+'</p>'+button('إعادة المحاولة','retry','outline')+' <a href="#home">المختبرات</a></section>';connect('retry',render)}}window.scrollTo(0,0)}
try{const [data,session]=await Promise.all([fetch('/catalog.json').then(r=>r.json()),api('me').catch(()=>({user:null}))]);catalog=data;user=session.user;account.textContent=user?.name||'دخول الحساب';window.addEventListener('hashchange',render);await render()}catch{main.textContent='تعذر تحميل قائمة المختبرات. أعد تحميل الصفحة.'}
