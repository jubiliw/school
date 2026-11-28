// All user-controlled values are inserted through DOM text or input.value.
export function mount(host,request){
 let active=true,sequence=0,area='schools',search='',page=0,selected='';
 function el(tag,text,cls){
  const node=document.createElement(tag);
  if(text!=null)node.textContent=text;
  if(cls)node.className=cls;
  return node;
 }
 const head=el('div',null,'lead');head.append(el('h1','إدارة معامل'));
 const summary=el('div',null,'box'),nav=el('div',null,'filters'),body=el('section',null,'box'),message=el('p');
 message.setAttribute('role','status');host.replaceChildren(head,summary,nav,message,body);
 const call=(p,m='GET',b)=>request('/api/admin/'+p,m,b);
 const setMessage=text=>{if(active)message.textContent=text};
 const btn=(label,action,primary=false)=>{
  const b=el('button',label,primary?'primary':'outline');b.type='button';
  b.onclick=async()=>{b.disabled=true;try{await action();}catch(e){setMessage(e.message);}finally{b.disabled=false;}};
  return b;
 };
 const row=(...children)=>{const r=el('div',null,'listrow');r.append(...children);return r;};
 const tabs={schools:'المدارس',users:'المستخدمون',subscriptions:'الاشتراكات',audit:'سجل التدقيق'};
 const tabButtons={};
 for(const [key,label] of Object.entries(tabs)){
  const b=btn(label,async()=>{area=key;page=0;selected='';search='';await refresh();});
  tabButtons[key]=b;nav.append(b);
 }
 function control(label,name,type='text',options,defaultValue=''){
  const wrap=el('label',label,'field'), node=el(options?'select':'input');
  node.name=name;
  if(options){for(const [v,l] of options){const o=el('option',l);o.value=v;node.append(o);}}
  else node.type=type;
  node.value=defaultValue;wrap.append(node);return wrap;
 }
 function form(title,fields,label,submit){
  const details=el('details');details.append(el('summary',title));
  const f=el('form',null,'stack');f.append(...fields);const b=el('button',label,'primary');b.type='submit';f.append(b);
  f.onsubmit=async e=>{e.preventDefault();b.disabled=true;try{await submit(Object.fromEntries(new FormData(f)));await refresh();}catch(err){setMessage(err.message);}finally{b.disabled=false;}};
  details.append(f);return details;
 }
 function pagination(more){const pages=el('div',null,'actions');
  if(page)pages.append(btn('السابق',async()=>{page--;await refresh();}));
  if(more)pages.append(btn('التالي',async()=>{page++;await refresh();}));
  return pages;
 }
 function listSchool(){
  return form('إضافة مدرسة',[control('اسم المدرسة','name')],'إنشاء',async d=>{await call('schools','POST',d);});
 }
 async function schoolView(id){
  const result=await call('schools/'+id),{school,teachers,subscription}=result;
  const frag=document.createDocumentFragment();
  frag.append(row(el('h2',school.name),btn('المدارس',async()=>{selected='';await refresh();})));
  frag.append(form('تعديل اسم المدرسة والاحتفاظ بالأعمال',[
   control('اسم المدرسة','name','text',null,school.name),
   control('أيام الاحتفاظ بالأعمال المسلّمة (اتركها فارغة للاحتفاظ بها)','days','number',null,school.retentionDays??'')
  ],'حفظ',b=>call('schools/'+id,'PATCH',{name:b.name,retentionDays:b.days?Number(b.days):null})));
  frag.append(el('h3','المعلمون'));
  for(const t of teachers)frag.append(row(el('span',t.name+' · '+t.username),btn('فك الارتباط',async()=>{await call('schools/'+id+'/teachers/'+t.id,'DELETE',{});await refresh();})));
  frag.append(form('ربط معلم بالمدرسة',[control('اسم دخول المعلم','username')],'ربط',async b=>{
   const data=await call('users?q='+encodeURIComponent(b.username));
   const t=data.users.find(x=>x.username===b.username.trim().toLowerCase()&&x.role==='teacher');
   if(!t)throw Error('لم يُعثر على اسم دخول معلم مطابق.');
   await call('schools/'+id+'/teachers','POST',{teacherId:t.id});
  }));

  frag.append(form('حذف مدرسة فارغة',[control('اكتب اسم المدرسة للتأكيد','confirmName')],'حذف المدرسة',async b=>{await call('schools/'+id,'DELETE',b);selected='';}));
  return frag;
 }
 function planForm(owner,current){
  return form('ضبط الباقة وحد الفصول',[
   control('الباقة','plan','',[['teacher','معلم']],'teacher'),
   control('الحالة','status','',[['active','نشط'],['expired','غير مفعّل']],current?.status||'expired'),
   control('إجمالي الفصول المسموح بها','classLimit','number',null,current?.classLimit??6),
   control('تاريخ الانتهاء (اختياري)','until','date',null,current?.validUntil?.slice(0,10)||'')
  ],'حفظ الباقة',b=>call('subscriptions','POST',{...owner,plan:b.plan,status:b.status,classLimit:Number(b.classLimit),validUntil:b.until?new Date(b.until+'T23:59:59+03:00').toISOString():null}));
 }
 async function section(){
  if(area==='schools' && selected)return schoolView(selected);
  const suffix='?page='+page+(area==='users'?'&q='+encodeURIComponent(search):'');
  const result=await call(area+suffix),frag=document.createDocumentFragment();
  frag.append(el('h2',tabs[area]));
  if(area==='schools'){
   frag.append(listSchool());
   for(const s of result.schools)frag.append(row(el('span',s.name+' · '+s.staffCount+' معلم'),btn('إدارة المدرسة',async()=>{selected=s.id;await refresh();})));
  }else if(area==='users'){
   const finder=el('form',null,'actions'),q=control('اسم الدخول أو العرض','q','search',null,search),b=el('button','بحث','outline');finder.append(q,b);
   finder.onsubmit=async e=>{e.preventDefault();search=new FormData(finder).get('q');page=0;await refresh();};frag.append(finder);
   for(const u of result.users){
    const roleLabel={teacher:'معلم',student:'طالب',admin:'إدارة'}[u.role];
    const entry=row(el('span',u.name+' · '+u.username+' · '+roleLabel+(u.suspended?' · معلّق':'')));
    if(u.role!=='admin')entry.append(btn(u.suspended?'إعادة تفعيل':'تعليق',async()=>{await call('users/'+u.id,'PATCH',{suspended:!u.suspended});await refresh();}));
    frag.append(entry);
    if(u.role==='teacher')frag.append(planForm({ownerId:u.id}));
   }
  }else if(area==='subscriptions'){
   const names={teacher:'معلم',school:'مدرسة',institution:'مؤسسة',trial:'تجربة',active:'نشط',expired:'منتهي'};
   for(const s of result.subscriptions){
    const entry=row(el('span',names[s.plan]+' · '+names[s.status]+' · '+s.classLimit+' فصول'),el('code',s.ownerId||s.schoolId));
    frag.append(entry);if(s.ownerId)frag.append(planForm({ownerId:s.ownerId},s));
   }
  }else{
   for(const e of result.events)frag.append(row(el('span',e.action+' · '+e.target),el('time',new Date(e.createdAt).toLocaleString('ar-SA'))));
  }
  frag.append(pagination(result.hasMore));return frag;
 }
 async function refresh(){
  const epoch=++sequence;setMessage('');
  for(const [key,b] of Object.entries(tabButtons))b.setAttribute('aria-pressed',String(key===area));
  try{
   const [usage,content]=await Promise.all([call('usage'),section()]);
   if(!active||epoch!==sequence)return;
   const c=usage.counts;summary.textContent=c.users+' مستخدم · '+c.schools+' مدارس · '+c.classes+' فصول · '+c.submissions+' تسليمات';
   body.replaceChildren(content);
  }catch(e){setMessage(e.message);}
 }
 refresh();return ()=>{active=false;sequence++;};
}
