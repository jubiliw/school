// Institution provisioning and policy changes are restricted to operators
// provisioned outside public registration. No billing provider is contacted.
export async function adminApi({user,db,method,path,url,input,one,list,query,audit,json,fail,id,field,iso}){
 if(user.role!=='admin')fail(403,'يلزم حساب إدارة.');
 const args=path.slice('/api/admin/'.length).split('/');
 const [area,key,sub,item]=args;
 const missing=()=>fail(404,'لم يُعثر على السجل.');
 const uuid=value=>typeof value==='string' && /^[\da-f-]{36}$/i.test(value);
 const cap=value=>Number.isInteger(value) && value>=0 && value<=100000;
 function retention(value){
  if(value===null || (Number.isInteger(value) && value>=1 && value<=3650))return value;
  fail(400,'مدة الاحتفاظ إما فارغة أو من يوم إلى ٣٦٥٠ يومًا.');
 }
 function paging(){
  const page=Number(url.searchParams.get('page')||0);
  if(!Number.isSafeInteger(page)||page<0||page>100000)fail(400,'رقم الصفحة غير صالح.');
  return [51,page*50];
 }
 if(area==='usage' && !key && method==='GET'){
  return json({counts:await one(`SELECT
   (SELECT count(*) FROM users) AS users,(SELECT count(*) FROM schools) AS schools,
   (SELECT count(*) FROM classes) AS classes,(SELECT count(*) FROM attempts) AS submissions,
   (SELECT count(*) FROM subscriptions) AS subscriptions,(SELECT count(*) FROM users WHERE suspended=1) AS suspended`)});
 }
 if(area==='users' && !key && method==='GET'){
  const search=(url.searchParams.get('q')||'').slice(0,80).replace(/[\\%_]/g,c=>'\\'+c);
  const rows=await list(`SELECT u.id,u.name,u.username,u.role,u.suspended,ss.schoolId FROM users u
   LEFT JOIN school_staff ss ON u.id=ss.teacherId WHERE u.username LIKE ? ESCAPE '\\' OR u.name LIKE ? ESCAPE '\\'
   ORDER BY u.createdAt DESC,u.id LIMIT ? OFFSET ?`,'%'+search+'%','%'+search+'%',...paging());
  return json({users:rows.slice(0,50),hasMore:rows.length>50});
 }
 if(area==='users' && uuid(key) && !sub && method==='PATCH'){
  const target=await one('SELECT id,role FROM users WHERE id=?',key);
  if(!target)return missing();
  if(target.role==='admin')fail(403,'تدار حسابات المشغلين خارج هذه الواجهة.');
  const b=await input();
  if(typeof b.suspended!=='boolean')fail(400,'حدد حالة الحساب.');
  const actions=[query('UPDATE users SET suspended=? WHERE id=?',Number(b.suspended),key)];
  if(b.suspended)actions.push(query('DELETE FROM sessions WHERE userId=?',key));
  actions.push(audit(user.id,b.suspended?'user.suspend':'user.restore',key));
  await db.batch(actions);
  return json({ok:true});
 }
 if(area==='schools' && !key && method==='GET'){
  const rows=await list('SELECT s.*, (SELECT count(*) FROM school_staff m WHERE m.schoolId=s.id) AS staffCount FROM schools s ORDER BY s.name,s.id LIMIT ? OFFSET ?',...paging());
  return json({schools:rows.slice(0,50),hasMore:rows.length>50});
 }
 if(area==='schools' && !key && method==='POST'){
  const b=await input(),school={id:id(),name:field(b.name,2,120,'أدخل اسم المدرسة.'),retentionDays:retention(b.retentionDays??null)};
  await db.batch([query('INSERT INTO schools(id,name,retentionDays) VALUES(?,?,?)',school.id,school.name,school.retentionDays),audit(user.id,'school.create',school.id)]);
  return json({school},201);
 }
 if(area==='schools' && uuid(key)){
  const school=await one('SELECT * FROM schools WHERE id=?',key);
  if(!school)return missing();
  if(!sub && method==='GET'){
   const teachers=await list('SELECT u.id,u.name,u.username FROM school_staff s JOIN users u ON u.id=s.teacherId WHERE s.schoolId=? ORDER BY u.name,u.id',key);
   const subscription=await one('SELECT * FROM subscriptions WHERE schoolId=?',key);
   return json({school,teachers,subscription});
  }
  if(!sub && method==='PATCH'){
   const b=await input();
   const name=b.name===undefined?school.name:field(b.name,2,120,'أدخل اسم المدرسة.');
   const days=b.retentionDays===undefined?school.retentionDays:retention(b.retentionDays);
   await db.batch([query('UPDATE schools SET name=?,retentionDays=? WHERE id=?',name,days,key),audit(user.id,'school.update',key)]);
   return json({school:{id:key,name,retentionDays:days}});
  }
  if(!sub && method==='DELETE'){
   const b=await input();
   if(b.confirmName!==school.name)fail(400,'أدخل اسم المدرسة لتأكيد الحذف.');
   const r=await db.batch([
    query('DELETE FROM schools WHERE id=? AND NOT EXISTS(SELECT 1 FROM school_staff WHERE schoolId=?) AND NOT EXISTS(SELECT 1 FROM subscriptions WHERE schoolId=?)',key,key,key),
    query("INSERT INTO audit(actor,action,target,createdAt) SELECT ?,'school.delete',?,? WHERE changes()>0",user.id,key,new Date().toISOString())
   ]);
   if(!r[0].meta.changes)fail(409,'أزل المعلمين والاشتراك من المدرسة قبل الحذف.');
   return json({ok:true});
  }
  if(sub==='teachers' && !item && method==='POST'){
   const {teacherId}=await input();
   if(!uuid(teacherId) || !await one("SELECT 1 FROM users WHERE id=? AND role='teacher'",teacherId))fail(400,'حدد حساب معلم مسجل.');
   const previous=await one('SELECT schoolId FROM school_staff WHERE teacherId=?',teacherId);
   if(previous?.schoolId===key)return json({ok:true});
   if(previous)fail(409,'أزل ارتباط المعلم بمدرسته الحالية أولًا.');
   try{await db.batch([query('INSERT INTO school_staff VALUES(?,?)',key,teacherId),audit(user.id,'school.teacher.add',key+':'+teacherId)]);}
   catch(e){if(String(e).includes('UNIQUE constraint'))fail(409,'سبق ربط المعلم بمدرسة.');throw e;}
   return json({ok:true});
  }
  if(sub==='teachers' && uuid(item) && method==='DELETE'){
   const r=await db.batch([query('DELETE FROM school_staff WHERE schoolId=? AND teacherId=?',key,item),
    query("INSERT INTO audit(actor,action,target,createdAt) SELECT ?,'school.teacher.remove',?,? WHERE changes()>0",user.id,key+':'+item,new Date().toISOString())]);
   if(!r[0].meta.changes)return missing();
   return json({ok:true});
  }
 }
 if(area==='subscriptions' && !key && method==='GET'){
  const rows=await list('SELECT * FROM subscriptions ORDER BY id LIMIT ? OFFSET ?',...paging());
  return json({subscriptions:rows.slice(0,50),hasMore:rows.length>50});
 }
 if(area==='subscriptions' && !key && method==='POST'){
  const b=await input(), isPersonal=b.plan==='teacher';
  if(!['teacher','school','institution'].includes(b.plan)||!['trial','active','expired'].includes(b.status)||!cap(b.classLimit))
   fail(400,'راجع الباقة والحالة وحد الاستخدام.');
  const target=isPersonal?b.ownerId:b.schoolId;
  if(!uuid(target) || (isPersonal?b.schoolId:b.ownerId))fail(400,'حدد مالكًا واحدًا مناسبًا للباقة.');
  const targetExists=isPersonal?await one("SELECT 1 FROM users WHERE id=? AND role='teacher'",target):await one('SELECT 1 FROM schools WHERE id=?',target);
  if(!targetExists)return missing();
  const validUntil=iso(b.validUntil),planId=id();
  const column=isPersonal?'ownerId':'schoolId';
  await db.batch([query(`INSERT INTO subscriptions(id,${column},plan,status,validUntil,classLimit) VALUES(?,?,?,?,?,?)
    ON CONFLICT(${column}) WHERE ${column} IS NOT NULL DO UPDATE SET plan=excluded.plan,status=excluded.status,validUntil=excluded.validUntil,classLimit=excluded.classLimit`,
    planId,target,b.plan,b.status,validUntil,b.classLimit),audit(user.id,'subscription.configure',target)]);
  return json({subscription:await one('SELECT * FROM subscriptions WHERE '+column+'=?',target)});
 }
 if(area==='subscriptions' && uuid(key) && !sub && method==='DELETE'){
  const b=await input(); if(b.confirmId!==key)fail(400,'تأكيد معرف الاشتراك مطلوب.');
  const r=await db.batch([query('DELETE FROM subscriptions WHERE id=?',key),
   query("INSERT INTO audit(actor,action,target,createdAt) SELECT ?,'subscription.delete',?,? WHERE changes()>0",user.id,key,new Date().toISOString())]);
  if(!r[0].meta.changes)return missing();
  return json({ok:true});
 }
 if(area==='audit' && !key && method==='GET'){
  const rows=await list('SELECT id,actor,action,target,createdAt FROM audit ORDER BY id DESC LIMIT ? OFFSET ?',...paging());
  return json({events:rows.slice(0,50),hasMore:rows.length>50});
 }
 return missing();
}
