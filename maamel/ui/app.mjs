import {showLibrary,showProgram,names,desktopPrograms} from './library-view.mjs';
import {gradeNames,termNames,placements,programsFor} from './course-catalog.mjs';
const main=document.querySelector('#main'), dialog=document.querySelector('#panel'), dialogBody=document.querySelector('#dialog-body'), account=document.querySelector('#account');
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(label,action,kind='primary')=>'<button type="button" class="'+kind+'" data-act="'+action+'">'+escape(label)+'</button>';
const summary=(v)=>typeof v==='string'?v:Array.isArray(v)?v.map(x=>typeof x==='string'?x:x.label||x.message||'').join('، '):'';
const fmt=new Intl.DateTimeFormat('ar-SA',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Riyadh'});
function field(label,name,type='text',extra=''){return '<label class="field">'+label+'<input required name="'+name+'" type="'+type+'" '+extra+'></label>'}
function select(label,name,opts){return '<label class="field">'+label+'<select required name="'+name+'">'+opts+'</select></label>'}
function opt(key,name){return '<option value="'+escape(key)+'">'+escape(name)+'</option>'}
let user=null,catalog=[],routeEpoch=0,destroy=null,noticeTimeout;
async function api(path,method='GET',body){let response;try{response=await fetch('/api/'+path,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},body:body&&JSON.stringify(body)})}catch{throw Error('تعذر الاتصال. تحقق من الشبكة ثم أعد المحاولة.')}const result=await response.json().catch(()=>({}));if(!response.ok){const error=Error(result.error||'تعذّر إكمال الطلب.');error.status=response.status;throw error}return result}
function notify(message){clearTimeout(noticeTimeout);document.querySelector('#notice').textContent=message;noticeTimeout=setTimeout(()=>document.querySelector('#notice').textContent='',4500)}
function modal(title,html){document.querySelector('#dialog-title').textContent=title;dialogBody.innerHTML=html;if(!dialog.open)dialog.showModal()}
document.querySelector('#close').onclick=()=>dialog.close();
function form(title,fields,label,save,lead=''){modal(title,lead+'<form class="stack">'+fields+'<span class="formerror" role="alert"></span><button class="primary">'+label+'</button></form>');const f=dialogBody.querySelector('form');f.onsubmit=async e=>{e.preventDefault();const submit=f.querySelector('button');submit.disabled=true;try{await save(Object.fromEntries(new FormData(f)));dialog.close()}catch(err){f.querySelector('.formerror').textContent=err.message}finally{submit.disabled=false}}}
function teacherAuth(register=false){const lead='<div class="tabs">'+button('تسجيل الدخول','login',register?'outline':'secondary')+button('اشتراك معلم','register',register?'secondary':'outline')+'</div>';form('حساب المعلم',(register?field('اسم العرض','name','text','maxlength="80" autocomplete="nickname" placeholder="يكفي اسم مستعار"'):'')+field('اسم الدخول','username','text','minlength="3" maxlength="60" autocomplete="username"')+field('كلمة المرور','password','password','minlength="'+(register?10:1)+'" autocomplete="'+(register?'new-password':'current-password')+'"')+(register?'<small>استخدم عشرة أحرف على الأقل لكلمة المرور.</small>':''),register?'إنشاء الحساب':'دخول',async data=>{const result=await api(register?'register':'login','POST',{...data,role:'teacher'});user=result.user;account.textContent=user.name;if(location.hash==='#dashboard'||(user.role==='student'&&location.hash.startsWith('#lab/')))await render();else location.hash='dashboard'},lead);dialogBody.querySelector('[data-act=login]').onclick=()=>teacherAuth(false);dialogBody.querySelector('[data-act=register]').onclick=()=>teacherAuth(true)}
function auth(){
 form('دخول الطالب',field('رمز الفصل','code','text','dir="ltr" autocomplete="off"'),'فتح المعامل',async data=>{
  const session=await api('enter-class','POST',data);user=session.user;account.textContent=user.name;
  if(location.hash.startsWith('#lab/')||location.hash==='#home')await render();else location.hash='home';
 },'<div class="tabs">'+button('دخول المعلم','teacher','outline')+'</div>');
 dialogBody.querySelector('[data-act=teacher]').onclick=()=>teacherAuth();
}
account.onclick=()=>{if(!user)return auth();modal('حساب '+escape(user.name),'<div class="stack">'+button('فتح لوحة الفصل','dash')+button('تسجيل الخروج','logout','outline')+'</div>');dialogBody.querySelector('[data-act=dash]').onclick=()=>{dialog.close();location.hash='dashboard'};dialogBody.querySelector('[data-act=logout]').onclick=async()=>{try{await api('logout','POST',{});user=null;account.textContent='دخول الحساب';dialog.close();for(const key of Object.keys(sessionStorage))if(key.startsWith('maamel-work:'))sessionStorage.removeItem(key);location.hash='home';await render()}catch(e){notify(e.message)}}};
function connect(action,handler){const el=main.querySelector('[data-act="'+action+'"]');if(el)el.onclick=handler}
function lessonTask(lab,id){return catalog.find(l=>l.id===lab)?.tasks.find(t=>t.id===id)}
function labelState(s){return ({submitted:'تم التسليم',pending:'لم يبدأ',draft:'مسودة',reopened:'أعيد فتحه'})[s]||''}
async function dashboard(epoch){if(!user){main.innerHTML='<div class="box"><h1>فصلي</h1><p>ادخل بحسابك لإنشاء فصل أو الانضمام إليه برمز المعلم.</p>'+button('دخول الحساب','auth')+'</div>';connect('auth',()=>auth());return}
if(user.role==='admin'){const admin=await import('/admin-ui.mjs');if(epoch===routeEpoch){main.replaceChildren();await admin.mount(main,(url,method,body)=>api(url.replace(/^\/api\//,''),method,body))}return}
if(user.role==='teacher'){
 const {classes}=await api('classes');if(epoch!==routeEpoch)return;
 main.innerHTML='<div class="heading"><h1>فصولي</h1>'+button('إنشاء فصل','class')+'</div><section class="box">'+(classes.map(c=>'<div class="listrow"><a href="#class/'+encodeURIComponent(c.id)+'"><strong>'+escape(c.name)+'</strong></a><span>رمز الفصل <b dir="ltr">'+escape(c.code)+'</b></span></div>').join('')||'<p>أنشئ فصلك الأول لدعوة الطلاب برمز الفصل.</p>')+'</section>';
 connect('class',()=>form('إنشاء فصل',field('اسم الفصل','name'),'إنشاء',async data=>{const c=await api('classes','POST',data);location.hash='class/'+c.id}));return;
}
if(user.device){
 user=(await api('me')).user;
 if(!user?.device?.approved){
  if(epoch!==routeEpoch)return;
  main.innerHTML='<section class="box"><h1>الواجبات</h1>'+(user?.device?.pending?'<p>طلبك عند المعلم. بعد اعتماد اسمك تظهر واجباتك هنا.</p>'+button('تحديث','refresh','outline'):'<p>أرسل اسمك للمعلم حتى تُسجّل الواجبات والدرجات باسمك.</p>'+button('إرسال اسمي','identify'))+' <a href="#home">فتح المعامل</a></section>';
  connect('refresh',render);connect('identify',()=>form('اسم الطالب',field('اسمك لدى المعلم','name'),'إرسال',async data=>{await api('device-name','POST',data);await render()}));return;
 }
}
const {assignments}=await api('assignments');if(epoch!==routeEpoch)return;
main.innerHTML='<div class="heading"><h1>الواجبات</h1>'+(!user.device?button('الانضمام برمز الفصل','join','outline'):'')+'</div>'+assignmentRows(assignments,false);
connect('join',()=>form('الانضمام إلى فصل',field('رمز الفصل','code'),'إرسال',async data=>{await api('join','POST',data);notify('تم التحقق من الرمز. تظهر واجبات الفصل بعد اعتماد المعلم للانضمام.')}));}
function assignmentRows(rows,teacher){
 return '<section class="box">'+(rows.map(x=>'<div class="listrow"><div><strong>'+escape(x.title)+'</strong><small>'+escape(x.className)+(x.dueAt?' · ينتهي '+escape(fmt.format(new Date(x.dueAt))):'')+'</small></div><div class="actions">'+(teacher?'':'<span>'+labelState(x.status)+(x.score!=null?' · '+(x.teacherPoints==null?'آلي ':'معتمد ')+escape(x.score)+'٪':'')+'</span>')+'<a class="outline" href="#'+(teacher?'results':'assignment')+'/'+encodeURIComponent(x.id)+'">'+(teacher?'نتائج الطلاب':'فتح الواجب')+'</a></div></div>').join('')||'<p>لا توجد واجبات حتى الآن.</p>')+'</section>';
}
async function classroom(id,epoch){
 const [c,{assignments}]=await Promise.all([api('classes/'+id),api('assignments')]);if(epoch!==routeEpoch)return;
 const programs=desktopPrograms(catalog);
 main.innerHTML='<a href="#dashboard">فصولي</a><div class="heading"><h1>'+escape(c.name)+'</h1>'+button('تعديل الفصل','edit','outline')+'</div><p>رمز الفصل <b dir="ltr">'+escape(c.code)+'</b></p><section class="box"><h2>برامج الفصل</h2><p>'+(c.programs===null?'جميع البرامج':c.programs.map(id=>escape(names[id])).join('، ')||'لم تُحدّد برامج')+'</p></section><div class="heading"><h2>الواجبات</h2>'+button('إنشاء واجب','assign')+'</div>'+assignmentRows(assignments.filter(a=>a.classId===id),true);
 connect('assign',()=>assignmentEditor([c]));
 connect('edit',()=>{
  const options=programs.map(k=>'<label><input type="checkbox" name="program" value="'+k+'" '+(c.programs?.includes(k)?'checked':'')+'> '+escape(names[k])+'</label>').join('');
  form('تعديل الفصل',field('اسم الفصل','name','text','maxlength="100"')+select('برامج الفصل','mode',opt('all','جميع البرامج')+opt('selected','برامج محددة'))+'<fieldset class="stack"><legend>البرامج المتاحة</legend>'+options+'</fieldset>','حفظ',async data=>{
   const chosen=[...dialogBody.querySelectorAll('[name=program]:checked')].map(x=>x.value);
   await api('classes/'+id,'PUT',{name:data.name,programs:data.mode==='all'?null:chosen});await render();
  });
  const f=dialogBody.querySelector('form');f.elements.name.value=c.name;f.elements.mode.value=c.programs===null?'all':'selected';
  const toggle=()=>f.querySelector('fieldset').hidden=f.elements.mode.value==='all';f.elements.mode.onchange=toggle;toggle();
 });
 if(c.pending.length){
  main.insertAdjacentHTML('beforeend','<section class="box"><h2>طلبات الانضمام</h2>'+c.pending.map(u=>'<label class="listrow"><input type="checkbox" name="pending" value="'+escape(u.id)+'" checked><span>'+escape(u.name)+'</span></label>').join('')+button('اعتماد المحددين','approve')+'</section>');
  connect('approve',async()=>{try{await api('classes/'+id+'/approve','POST',{students:[...main.querySelectorAll('[name=pending]:checked')].map(n=>n.value)});await render()}catch(e){notify(e.message)}});
 }
}
function assignmentEditor(classes){
 const scopes=placements(catalog),grades=[...new Set(scopes.map(p=>p.grade))];
 const options=''+
  select('الصف الدراسي','grade',grades.map(g=>opt(g,gradeNames[g])).join(''))+
  select('الفصل الدراسي','term','')+select('البرنامج','lab','')+select('التدريب','task','')+
  field('اسم الواجب','title')+'<label class="field">بداية الواجب بتوقيت السعودية<input type="datetime-local" required name="start"></label><label class="field">نهاية الواجب بتوقيت السعودية<input type="datetime-local" required name="due"></label><label class="field">نقاط تقييم المعلم من ١٠٠ (الباقي تلقائي)<input required type="number" min="0" max="100" name="manualMax" value="20"></label>';
 form('إنشاء واجب',options,'نشر الواجب',async data=>{
  await api('assignments','POST',{lab:data.lab,task:data.task,grade:+data.grade,term:+data.term,classId:classes[0].id,title:data.title,manualMax:Number(data.manualMax),startsAt:new Date(data.start+'+03:00').toISOString(),dueAt:new Date(data.due+'+03:00').toISOString()});
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

async function results(id,epoch){const [r,d]=await Promise.all([api('assignments/'+id+'/results'),api('assignments/'+id)]);if(epoch!==routeEpoch)return;main.innerHTML='<div class="lead"><a href="#class/'+encodeURIComponent(d.assignment.classId)+'">'+escape(d.assignment.className)+'</a><h1>'+escape(d.assignment.title)+'</h1></div><div class="heading"><h2>نتائج الطلاب</h2><a class="outline" href="/api/assignments/'+encodeURIComponent(id)+'/export" download>تصدير الدرجات CSV</a></div><div class="box">'+(r.results.map((x,i)=>'<div class="listrow"><div><b>'+escape(x.name)+'</b><small>'+labelState(x.status)+' · '+x.attempts+' محاولات</small></div><div class="actions"><strong>'+(x.score!=null && (d.assignment.manualMax??100)>0 && x.teacherPoints==null?'آلي ':'')+(x.score??'—')+(x.score!=null?'٪':'')+'</strong>'+(x.attempts?button('المحاولات','history'+i,'outline'):'')+(x.status==='submitted'?button('رصد درجة','grade'+i,'outline')+button('إعادة فتح','reopen'+i,'secondary'):'')+'</div></div>').join('')||'تظهر النتائج بعد انضمام الطلاب.')+'</div>';r.results.forEach((x,i)=>{
 connect('grade'+i,()=>{
  const max=d.assignment.manualMax??100;
  form('رصد درجة '+x.name,field('نقاط المعلم من '+max,'points','number','min="0" max="'+max+'" step="0.01"'),'اعتماد الدرجة',async data=>{
   await api('assignments/'+id+'/grade','PUT',{studentId:x.studentId,points:Number(data.points),version:x.version});await render()
  },'<p>نتيجة التصحيح الآلي '+escape(x.autoScore)+'٪، ووزنها '+(100-max)+' من ١٠٠.</p>');
 });connect('reopen'+i,()=>form('إعادة فتح الواجب',field('موعد نهاية المهلة لهذا الطالب','until','datetime-local'),'فتح الواجب',async data=>{await api('assignments/'+id+'/reopen','POST',{studentId:x.studentId,untilAt:new Date(data.until).toISOString()});await render()} ));connect('history'+i,async()=>{try{const h=await api('assignments/'+id+'/attempts?studentId='+encodeURIComponent(x.studentId));modal('محاولات '+x.name,h.attempts.map((attempt,n)=>'<div class="box"><b>'+attempt.score+'٪</b> · '+fmt.format(new Date(attempt.submittedAt))+'<p>'+escape(summary(attempt.feedback))+'</p>'+button('عرض العمل المسلّم','inspect'+n,'outline')+'</div>').join(''));
dialogBody.querySelectorAll('[data-act]').forEach((b,n)=>b.onclick=async()=>{
 const lab=d.assignment.lab;if(!lessonTask(lab,d.assignment.task))return;
 const ui=await import('/'+lab+'/index.mjs');
 modal('عمل '+x.name,'<p class="meta">نسخة المحاولة المحفوظة · '+h.attempts[n].score+'٪</p><div id="snapshot"></div>');
 dialog.classList.add('wide');const target=dialogBody.querySelector('#snapshot');const cleanup=ui.mount(target,structuredClone(h.attempts[n].state),()=>{},d.assignment.task);target.inert=true;
 dialog.addEventListener('close',()=>{dialog.classList.remove('wide');if(typeof cleanup==='function')cleanup();target.replaceChildren()},{once:true});
})}catch(e){notify(e.message)}})})}
async function workspace(lab,taskId,assignmentId,epoch,grade,term){
 let detail=null;if(assignmentId){detail=await api('assignments/'+assignmentId);lab=detail.assignment.lab;taskId=detail.assignment.task;grade=detail.assignment.grade;term=detail.assignment.term}
 if(!assignmentId&&(!user||!(await api('programs')).programs.includes(lab)))throw Error('يلزم الحصول على صلاحية المعمل.');
 const task=lessonTask(lab,taskId);if(!task)throw Error('تعذر العثور على التدريب.');const [ui,model]=await Promise.all([import('/'+lab+'/index.mjs'),import('/'+lab+'/model.mjs')]);if(epoch!==routeEpoch)return;
 const place=task.placements.find(p=>p.grade===+grade&&p.term===+term)??task.placements[0];
 const key=assignmentId?'maamel-work:'+user.id+':'+assignmentId:'maamel-practice:'+user.id+':'+lab+':'+task.id;const storage=assignmentId?sessionStorage:localStorage;let cached=null;try{cached=JSON.parse(storage.getItem(key))}catch{}
 let version=detail?.work.version??0,locked=detail?.work.status==='submitted',dirty=false,busy=false,timer=null,changeNo=0,dead=false,conflict=false;
 const revision=locked&&detail?.assignment.startsAt&&Date.parse(detail.assignment.dueAt)>Date.now();
 if(revision)locked=false;
 const resumable=cached&&(!assignmentId||cached.version===version&&!locked);let state=resumable?cached.state:detail?.work.state??model.initial(taskId);dirty=Boolean(resumable&&assignmentId);
 const instructions=Array.isArray(task.instructions)?task.instructions.join(' · '):task.instructions;
 main.innerHTML='<div class="workspace-head"><a href="'+(assignmentId?'#dashboard':'#program/'+place.grade+'/'+place.term+'/'+lab)+'">'+(assignmentId?'الواجبات':'تدريبات البرنامج')+'</a><h1>'+escape(names[lab])+'</h1><span>'+gradeNames[place.grade]+' · '+termNames[place.term]+'</span></div><details class="task-brief" open><summary>'+escape(detail?.assignment.title||task.title)+'</summary><p>'+escape(instructions)+'</p><small>'+escape(place.lesson)+' · ص '+escape(place.page)+'</small></details><div class="workbar"><span class="meta" id="savestatus" role="status"></span>'+(!locked?button(assignmentId?'حفظ العمل':'حفظ على الجهاز','save','outline')+button(revision?'إعادة التسليم':assignmentId?'تسليم الواجب':'تحقق من عملي','submit'):'')+'</div><div id="assessment" aria-live="polite"></div><div class="workspace" id="sim"></div>';
 const status=main.querySelector('#savestatus'),assessment=main.querySelector('#assessment'),host=main.querySelector('#sim');
 function result(score,feedback){assessment.className='result';assessment.textContent=(assignmentId&&detail.work.teacherPoints==null?'نتيجة التصحيح الآلي ':'الدرجة ')+score+' من ١٠٠ · '+summary(feedback)}
 function cache(){try{storage.setItem(key,JSON.stringify({state,version}));return true}catch{return false}}
 async function persist(submit=false){clearTimeout(timer);if(busy||locked||conflict||dead)return;busy=true;const seq=changeNo;
 const submitButton=main.querySelector('[data-act=submit]');if(submitButton)submitButton.disabled=true;
 if(submit&&assignmentId)host.inert=true;
 try{if(revision&&!submit){status.textContent=cache()?'مسودة محفوظة في هذه الجلسة. اعتمدها بإعادة التسليم.':'تعذّر حفظ المسودة';return}if(assignmentId){status.textContent='جارٍ الحفظ…';const saved=await api('assignments/'+assignmentId+'/'+(submit?'submit':'work'),submit?'POST':'PUT',{state,version});version=saved.version;dirty=seq!==changeNo;if(dirty)cache();else storage.removeItem(key);locked=saved.status==='submitted';if(!dead){status.textContent=locked?'تم تسليم الواجب':'حُفظ في حسابك';if(locked){result(saved.score,saved.feedback);main.querySelectorAll('.workbar button').forEach(b=>b.remove())}}}else{const ok=cache();status.textContent=ok?'حُفظ التدريب على هذا الجهاز':'لم تتوفر مساحة للحفظ على هذا الجهاز';if(submit){const g=model.grade(state,taskId);result(g.score,g.feedback)}}}
 catch(error){if(error.status===409){conflict=true;status.textContent='تغيّرت نسخة الواجب. أعد فتحه لتحميل النسخة الحالية.'}else{const ok=cache();status.textContent=error.message+(ok?' مسودتك محفوظة في هذه الجلسة.':' تعذّر حفظ نسخة في المتصفح.')}}finally{busy=false;if(submitButton)submitButton.disabled=false;if(!locked)host.inert=false;if(dirty&&seq!==changeNo&&!dead&&!conflict)timer=setTimeout(()=>persist(),450)}}
 const cleanup=ui.mount(host,state,next=>{if(locked||dead)return;state=next;changeNo++;dirty=true;const ok=cache();status.textContent=assignmentId?(ok?'مسودة على الجهاز · بانتظار المزامنة':'تغييرات بانتظار الحفظ'):(ok?'محفوظ على الجهاز':'تعذر الحفظ على الجهاز');if(assignmentId){clearTimeout(timer);timer=setTimeout(()=>persist(),650)}},taskId);
 status.textContent=revision?'سبق التسليم. يمكنك تعديل العمل وإعادة تسليمه قبل النهاية.':locked?'تم التسليم':resumable?'استُعيدت المسودة':assignmentId?'العمل مرتبط بحسابك':'تدريب حر على هذا الجهاز';host.inert=locked;
 if(locked||revision)result(detail.work.score,detail.work.feedback);
 connect('save',()=>persist());connect('submit',()=>persist(true));const online=()=>{if(dirty&&!locked)persist()};window.addEventListener('online',online);if(dirty&&assignmentId)timer=setTimeout(()=>persist(),700);
 destroy=()=>{dead=true;clearTimeout(timer);window.removeEventListener('online',online);if(typeof cleanup==='function')cleanup();else cleanup?.destroy?.()}}
async function openDesktop(lab,epoch){
 if(!user){main.innerHTML='<section class="box"><p>سجّل الدخول لفتح المعمل بحسابك.</p>'+button('دخول الحساب','auth')+'</section>';connect('auth',()=>auth());auth();return}if(!(await api('programs')).programs.includes(lab))throw Error('لم يُتح لك هذا المعمل.');if(!desktopPrograms(catalog).includes(lab))throw Error('البرنامج غير متاح');
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
async function render(){const epoch=++routeEpoch;destroy?.();destroy=null;const [view='home',id,task,extra,term]=(location.hash.slice(1)||'home').split('/').map(decodeURIComponent);document.body.classList.toggle('desktop-home',['home','course'].includes(view));main.innerHTML='<p class="lead" role="status">جارٍ الفتح…</p>';document.querySelectorAll('.bar nav a').forEach(a=>a.setAttribute('aria-current',(a.hash==='#home'?['home','course','program','lab','practice']:['dashboard','assignment','results']).includes(view)?'page':'false'));const nav=document.querySelector('.bar nav');nav.innerHTML=user?.role==='teacher'?'<a href="#dashboard">فصولي</a><a href="#programs">المعامل</a>':'<a href="#home">المعامل</a><a href="#dashboard">الواجبات</a>';
try{if(!user){
 main.innerHTML='<section class="box"><h1>معامل</h1><div class="actions">'+button('دخول الطالب برمز الفصل','student')+button('دخول المعلم','teacher','outline')+'</div></section>';
 connect('student',auth);connect('teacher',()=>teacherAuth());return;
}if((view==='home'||view==='course')&&user?.role==='teacher')await dashboard(epoch);
else if(view==='home'||view==='course'||view==='programs'){
 const allowed=user?(await api('programs')).programs:desktopPrograms(catalog);
 if(epoch===routeEpoch)showLibrary(main,catalog,allowed);
}else if(view==='class')await classroom(id,epoch);else if(view==='program')showProgram(main,catalog,extra,id,task);else if(view==='lab')await openDesktop(id,epoch);else if(view==='practice')await workspace(id,task,null,epoch,extra,term);else if(view==='dashboard')await dashboard(epoch);else if(['assignment','results'].includes(view)){if(!user)return dashboard(epoch);if(view==='results')await results(id,epoch);else await workspace(null,null,id,epoch)}else showLibrary(main,catalog)}catch(e){if(epoch===routeEpoch){main.innerHTML='<section class="box"><p role="alert">'+escape(e.message)+'</p>'+button('إعادة المحاولة','retry','outline')+' <a href="#home">المختبرات</a></section>';connect('retry',render)}}window.scrollTo(0,0)}
try{const [data,session]=await Promise.all([fetch('/catalog.json').then(r=>r.json()),api('me').catch(()=>({user:null}))]);catalog=data;user=session.user;account.textContent=user?.name||'دخول الحساب';window.addEventListener('hashchange',render);await render()}catch{main.textContent='تعذر تحميل قائمة المختبرات. أعد تحميل الصفحة.'}
