import {adminApi} from './admin.mjs';
const encoder = new TextEncoder();
const MAX_BODY = 640 * 1024;
const SESSION_SECONDS = 7 * 24 * 3600;
const COOKIE = '__Host-maamel';
const today = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const hex = bytes => Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
const randomHex = length => hex(crypto.getRandomValues(new Uint8Array(length)));
const digest = async value => hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
const sessionCookie = (token, age) => `${COOKIE}=${token}; Max-Age=${age}; Path=/; HttpOnly; Secure; SameSite=Lax`;
const safeHeaders = {
 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer', 'Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"
};
const json = (body, status=200, headers={}) => Response.json(body, {status,headers:{...safeHeaders,...headers}});
class ApiError extends Error {
 constructor(status,message){ super(message); this.status=status; }
}
function fail(status,message){throw new ApiError(status,message);}
function field(value,min,max,message) {
 if(typeof value!=='string' || value.trim().length<min || value.trim().length>max) fail(400,message);
 return value.trim();
}
function iso(value) {
 if(value==null || value==='') return null;
 if(typeof value!=='string' || !/T/.test(value) || !Number.isFinite(Date.parse(value))) fail(400,'موعد التسليم غير صالح.');
 return new Date(value).toISOString();
}
async function readBody(request){
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||'')) fail(415,'أرسل البيانات بصيغة JSON.');
 if(Number(request.headers.get('Content-Length'))>MAX_BODY) fail(413,'تجاوز حجم العمل الحد المسموح.');
 const reader=request.body?.getReader();
 if(!reader) return {};
 const decoder=new TextDecoder();
 let size=0, body='';
 for(;;){
  const {done,value}=await reader.read();
  if(done)break;
  size+=value.byteLength;
  if(size>MAX_BODY){await reader.cancel(); fail(413,'تجاوز حجم العمل الحد المسموح.');}
  body+=decoder.decode(value,{stream:true});
 }
 try{
  const result=JSON.parse(body+decoder.decode());
  if(!result || typeof result!=='object' || Array.isArray(result))throw new Error();
  return result;
 }catch{fail(400,'تعذر قراءة البيانات.');}
}
async function passwordHash(password,salt){
 const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
 return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:100000,hash:'SHA-512'},key,256));
}
function equal(a,b){
 if(a.length!==b.length)return false;
 let diff=0; for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);
 return diff===0;
}
function dbAccess(db){
 const query=(sql,...args)=>db.prepare(sql).bind(...args);
 return {query,one:(sql,...args)=>query(sql,...args).first(),list:async(sql,...args)=>(await query(sql,...args).all()).results};
}
async function rateLimit(db,key,max,period){
 const now=Date.now();
 const bucket=await digest(key+':'+Math.floor(now/period));
 const result=await db.prepare('INSERT INTO auth_limits VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 WHERE count<? RETURNING count')
 .bind(bucket,now+period,max).first();
 if(!result)fail(429,'محاولات كثيرة. حاول لاحقًا.');
}
function cleanUser(u){return {id:u.id,name:u.name,username:u.username,role:u.role};}
function role(u,name){if(u.role!==name)fail(403,'لا تملك صلاحية تنفيذ هذا الإجراء.');}
function csvCell(value){
 let text=String(value??'');
 if(/^[\s]*[=+@\-\t\r]/.test(text))text="'"+text;
 return '"'+text.replace(/"/g,'""')+'"';
}
function workView(row,defaultState){
 if(!row)return {state:defaultState,version:0,status:'draft',score:null,feedback:null};
 return {state:JSON.parse(row.state),version:row.version,status:row.status,score:row.score,
 feedback:row.feedback==null?null:JSON.parse(row.feedback),updatedAt:row.updatedAt};
}
function parseAssignment(row){return {...row,task:JSON.parse(row.task)};}
const unrecognized=()=>fail(404,'لم يُعثر على المورد المطلوب.');

export function createApi({grade,initial,validateLab}){
 async function handle(request,env){
 const url=new URL(request.url);
 const path=url.pathname.replace(/\/$/,'');
 const method=request.method.toUpperCase();
 if(!path.startsWith('/api/'))return unrecognized();
 if(!['HEAD','GET'].includes(method)){
  const origin=request.headers.get('Origin');
  if((origin && origin!==url.origin) || request.headers.get('Sec-Fetch-Site')==='cross-site')fail(403,'مصدر الطلب غير معتمد.');
 }
 const db=env.DB || env.STORAGE;
 if(!db)fail(503,'قاعدة البيانات غير متاحة.');
 const {one,list,query}=dbAccess(db);
 const audit=(actor,action,target)=>query('INSERT INTO audit(actor,action,target,createdAt) VALUES(?,?,?,?)',actor,action,target,today());
 const token=(request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
 const tokenHash=token && /^[0-9a-f]{64}$/.test(token)?await digest(token):null;
 const user=tokenHash?await one('SELECT u.id,u.name,u.username,u.role FROM sessions s JOIN users u ON u.id=s.userId WHERE s.token=? AND s.expires>? AND u.suspended=0',tokenHash,Date.now()):null;
 if(method==='GET' && path==='/api/me')return json({user});
 const input=()=>readBody(request);
 if(method==='POST' && (path==='/api/register' || path==='/api/login')){
  const body=await input();
  const username=field(body.username,3,60,'استخدم اسم دخول من ٣ إلى ٦٠ حرفًا.').normalize('NFKC').toLowerCase();
  if(!/^[\p{L}\p{N}_.-]{3,60}$/u.test(username))fail(400,'اسم الدخول يقبل الحروف والأرقام والشرطة والنقطة.');
  const password=body.password;
  if(typeof password!=='string'||password.length<1||password.length>256)fail(400,'كلمة المرور غير صالحة.');
  const ip=request.headers.get('CF-Connecting-IP')||'development';
  await rateLimit(db,path+':'+ip,path.endsWith('register')?20:100,3600000);
  const registering=path.endsWith('register');
  const session=randomHex(32);
  const sessionHash=await digest(session);
  const statements=[];
  let account;
  if(registering){
   if(password.length<10)fail(400,'استخدم كلمة مرور من عشرة أحرف أو أكثر.');
   if(!['student','teacher'].includes(body.role))fail(400,'صفة الحساب غير صالحة.');
   const salt=randomHex(16);
   account={id:id(),name:field(body.name,1,80,'أدخل اسم العرض.'),username,role:body.role};
   statements.push(query('INSERT INTO users(id,username,name,role,passwordHash,salt,createdAt) VALUES(?,?,?,?,?,?,?)',
    account.id,username,account.name,account.role,await passwordHash(password,salt),salt,today()));
   if(account.role==='teacher')statements.push(query('INSERT INTO subscriptions(id,ownerId,plan,status,validUntil,classLimit) VALUES(?,?,\'teacher\',\'trial\',?,?)',id(),account.id,new Date(Date.now()+30*86400000).toISOString(),6));
  }else{
   await rateLimit(db,'login:'+ip+':'+username,15,900000);
   account=await one('SELECT * FROM users WHERE username=?',username);
   const calculated=await passwordHash(password,account?.salt||'a1d903c987431ff62b37365205f06e68');
   if(!equal(calculated,account?.passwordHash||'0'.repeat(64)) || !account || account.suspended)fail(401,'اسم الدخول أو كلمة المرور غير صحيحة.');
  }
  statements.push(query('INSERT INTO sessions VALUES(?,?,?)',sessionHash,account.id,Date.now()+SESSION_SECONDS*1000),audit(account.id,registering?'register':'login',account.id));
  if(tokenHash)statements.push(query('DELETE FROM sessions WHERE token=?',tokenHash));
  try{await db.batch(statements);}catch(error){
   if(registering && String(error).includes('UNIQUE constraint failed: users.username'))fail(409,'اسم الدخول مستخدم.');
   throw error;
  }
  return json({user:cleanUser(account)},registering?201:200,{'Set-Cookie':sessionCookie(session,SESSION_SECONDS)});
 }
 if(!user)fail(401,'سجّل الدخول أولًا.');
 if(method==='POST' && path==='/api/logout'){
  await db.batch([query('DELETE FROM sessions WHERE token=?',tokenHash),audit(user.id,'logout',user.id)]);
  return json({ok:true},200,{'Set-Cookie':sessionCookie('',0)});
 }
 if(method==='GET' && path==='/api/classes'){
  const classes=user.role==='teacher'?await list('SELECT id,name,code,createdAt FROM classes WHERE teacherId=? ORDER BY createdAt DESC',user.id):
   await list('SELECT c.id,c.name,c.createdAt FROM classes c JOIN members m ON c.id=m.classId WHERE m.studentId=? ORDER BY c.createdAt DESC',user.id);
  return json({classes});
 }
 if(method==='POST' && path==='/api/classes'){
  role(user,'teacher');
  const body=await input(),name=field(body.name,1,100,'أدخل اسم الفصل.'),classId=id(),code=randomHex(5).toUpperCase();
  // A linked school's plan pools classroom slots across its teachers.
  // Without a school plan, the teacher's individual allowance applies.
  const inserted=await query(`WITH school_plan AS (
    SELECT p.* FROM school_staff m JOIN subscriptions p ON p.schoolId=m.schoolId WHERE m.teacherId=?
   ), effective AS (
    SELECT schoolId,status,validUntil,classLimit FROM school_plan UNION ALL
    SELECT NULL,status,validUntil,classLimit FROM subscriptions WHERE ownerId=? AND NOT EXISTS(SELECT 1 FROM school_plan)
   )
   INSERT INTO classes SELECT ?,?,?,?,? FROM effective e
   WHERE e.status IN ('active','trial') AND (e.validUntil IS NULL OR e.validUntil>?)
   AND (SELECT count(*) FROM classes c WHERE (e.schoolId IS NULL AND c.teacherId=?) OR
    (e.schoolId IS NOT NULL AND c.teacherId IN (SELECT teacherId FROM school_staff WHERE schoolId=e.schoolId))) < e.classLimit`,
   user.id,user.id,classId,user.id,name,code,today(),today(),user.id).run();
  if(!inserted.meta.changes)fail(403,'بلغت حد الفصول المتاح أو انتهت صلاحية الباقة.');
  return json({id:classId,name,code},201);
 }
 if(method==='POST' && path==='/api/join'){
  role(user,'student'); const body=await input();
  await rateLimit(db,'join:'+user.id,40,3600000);
  const code=field(body.code,1,64,'أدخل رمز الفصل.').toUpperCase();
  const found=await one('SELECT id,name FROM classes WHERE code=?',code);
  if(!found)fail(404,'تعذر العثور على الفصل.');
  await db.batch([query('INSERT OR IGNORE INTO members VALUES(?,?)',found.id,user.id),audit(user.id,'class.join',found.id)]);
  return json(found);
 }
 const teacher=user.role==='teacher';
 const scope=teacher?'c.teacherId=?':'EXISTS(SELECT 1 FROM members m WHERE m.studentId=? AND m.classId=c.id)';
 const select=`SELECT a.*,c.name AS className FROM assignments a JOIN classes c ON c.id=a.classId WHERE ${scope}`;
 if(method==='GET' && path==='/api/assignments'){
  const rows=teacher?await list(select+' ORDER BY a.createdAt DESC',user.id):
   await list(`SELECT a.*,c.name AS className,w.score,coalesce(w.status,'draft') AS status FROM assignments a JOIN classes c ON c.id=a.classId LEFT JOIN work w ON w.assignmentId=a.id AND w.studentId=? WHERE ${scope} ORDER BY a.createdAt DESC`,user.id,user.id);
  return json({assignments:rows.map(parseAssignment)});
 }
 if(method==='POST' && path==='/api/assignments'){
  role(user,'teacher');
  const b=await input();
  const c=await one('SELECT id FROM classes WHERE id=? AND teacherId=?',String(b.classId||''),user.id);
  if(!c)return unrecognized();
  const title=field(b.title,1,150,'أدخل عنوان الواجب.'),lab=field(b.lab,1,80,'اختر المختبر.');
  const task=b.task??null;
  if(JSON.stringify(task).length>4000)fail(400,'وصف النشاط طويل.');
  try{if((validateLab && !validateLab(lab,task)) || !initial(lab,task))throw Error();}catch{fail(400,'المختبر أو النشاط غير متاح.');}
  const assignment={id:id(),title,classId:c.id,lab,task,dueAt:iso(b.dueAt),createdAt:today()};
  await db.batch([query('INSERT INTO assignments VALUES(?,?,?,?,?,?,?)',assignment.id,c.id,title,lab,JSON.stringify(task),assignment.dueAt,assignment.createdAt),audit(user.id,'assignment.create',assignment.id)]);
  return json({assignment,id:assignment.id},201);
 }
 const match=path.match(/^\/api\/assignments\/([\da-f-]{36})(?:\/(work|submit|results|export|reopen|attempts))?$/);
 if(match){
  const [,assignmentId,action]=match;
  const record=await one(select+' AND a.id=?',user.id,assignmentId);
  if(!record)return unrecognized();
  const assignment=parseAssignment(record);
  if(!action && method==='GET'){
   const row=teacher?null:await one('SELECT * FROM work WHERE assignmentId=? AND studentId=?',assignmentId,user.id);
   const attempts=teacher?[]:await list('SELECT score,version,submittedAt,feedback FROM attempts WHERE assignmentId=? AND studentId=? ORDER BY version DESC',assignmentId,user.id);
   return json({assignment,work:workView(row,initial(assignment.lab,assignment.task)),attempts:attempts.map(a=>({...a,feedback:JSON.parse(a.feedback)}))});
  }
  if(action==='work' && method==='PUT' || action==='submit' && method==='POST'){
   role(user,'student');
   const b=await input();
   if(!Number.isSafeInteger(b.version)||b.version<0 || !b.state || typeof b.state!=='object'||Array.isArray(b.state))fail(400,'نسخة العمل غير صالحة.');
   const current=await one('SELECT version,status,reopened FROM work WHERE assignmentId=? AND studentId=?',assignmentId,user.id);
   if((current?.version||0)!==b.version)fail(409,'تغيرت النسخة المحفوظة. أعد فتح العمل قبل الحفظ.');
   if(current?.status==='submitted')fail(409,'سُلّم الواجب. يمكن للمعلم إعادة فتحه.');
   if(assignment.dueAt && assignment.dueAt<today() && !current?.reopened)fail(403,'انتهى وقت التسليم.');
   const submitting=action==='submit';
   let assessment;
   if(submitting){
    try {assessment=await grade(assignment.lab,b.state,assignment.task);}
    catch{fail(422,'تعذر تصحيح العمل. راجع محتواه.');}
    if(!assessment||!Number.isFinite(assessment.score)||assessment.score<0||assessment.score>100)fail(422,'تعذر حساب درجة صحيحة.');
   }
   const status=submitting?'submitted':(current?.status||'draft');
   const score=assessment?.score??null, feedback=submitting?JSON.stringify(assessment.feedback??[]):null;
   const timestamp=today(),state=JSON.stringify(b.state);
   const replacement=b.version===0?
    query('INSERT INTO work(assignmentId,studentId,state,version,status,score,feedback,updatedAt) VALUES(?,?,?,1,?,?,?,?) ON CONFLICT DO NOTHING',assignmentId,user.id,state,status,score,feedback,timestamp):
    query("UPDATE work SET state=?,version=version+1,status=?,score=?,feedback=?,updatedAt=? WHERE assignmentId=? AND studentId=? AND version=? AND status!='submitted'",state,status,score,feedback,timestamp,assignmentId,user.id,b.version);
   const result=await replacement.run();
   if(!result.meta.changes)fail(409,'سبق تعديل النسخة. أعد فتح العمل.');
   return json({version:b.version+1,status,score,feedback:assessment?.feedback??null,updatedAt:timestamp});
  }
  if(['results','export','attempts'].includes(action) && method==='GET'){
   role(user,'teacher');
   if(action==='attempts'){
    const studentId=url.searchParams.get('studentId')||'';
    const records=await list('SELECT version,score,submittedAt,feedback,state FROM attempts WHERE assignmentId=? AND studentId=? ORDER BY version DESC LIMIT 20',assignmentId,studentId);
    return json({attempts:records.map(r=>({...r,state:JSON.parse(r.state),feedback:JSON.parse(r.feedback)}))});
   }
   const results=await list(`SELECT u.id AS studentId,u.name,COALESCE(w.status,'pending') AS status,w.score,w.updatedAt,
    (SELECT count(*) FROM attempts h WHERE h.studentId=u.id AND h.assignmentId=?) AS attempts
    FROM members m JOIN users u ON u.id=m.studentId LEFT JOIN work w ON w.studentId=u.id AND w.assignmentId=?
    WHERE m.classId=? ORDER BY u.name,u.id`,assignmentId,assignmentId,assignment.classId);
   if(action==='results')return json({results});
   const lines=[['الطالب','الحالة','الدرجة','عدد المحاولات'],...results.map(r=>[r.name,r.status,r.score,r.attempts])];
   return new Response('\uFEFF'+lines.map(row=>row.map(csvCell).join(',')).join('\r\n'),{headers:{...safeHeaders,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="maamel-results.csv"'}});
  }
  if(action==='reopen' && method==='POST'){
   role(user,'teacher'); const {studentId}=await input();
   const result=await query("UPDATE work SET status='reopened',reopened=1,version=version+1,updatedAt=? WHERE assignmentId=? AND studentId=? AND status='submitted'",today(),assignmentId,String(studentId||'')).run();
   if(!result.meta.changes)fail(409,'لا يوجد تسليم يمكن إعادة فتحه.');
   return json({ok:true});
  }
 }
 if(path==='/api/account' && method==='DELETE'){
  const {password}=await input(),record=await one('SELECT passwordHash,salt FROM users WHERE id=?',user.id);
  if(typeof password!=='string'||password.length>256||!equal(await passwordHash(password,record.salt),record.passwordHash))fail(403,'تأكيد كلمة المرور مطلوب.');
  await db.batch([audit(user.id,'account.delete',user.id),query('DELETE FROM users WHERE id=?',user.id)]);
  return json({ok:true},200,{'Set-Cookie':sessionCookie('',0)});
 }
 if(path.startsWith('/api/admin/'))return adminApi({user,db,method,path,url,input,one,list,query,audit,json,fail,id,field,iso});
 return unrecognized();
 }
 return {async fetch(request,env){
  try{return await handle(request,env);}
  catch(error){
   if(error instanceof ApiError)return json({error:error.message},error.status);
   const reference=id();
   console.error(JSON.stringify({event:'request.failed',reference,category:error?.name||'Error'}));
   return json({error:'تعذر إتمام الطلب.',reference},500);
  }
 },async scheduled(_event,env){
  const db=env.DB||env.STORAGE;
  // Only schools with an operator-selected retention period qualify.
  // Limit each batch to keep the scheduled operation bounded.
  const selected=`SELECT w.rowid FROM work w
   JOIN assignments a ON w.assignmentId=a.id JOIN classes c ON a.classId=c.id
   JOIN school_staff m ON c.teacherId=m.teacherId JOIN schools s ON s.id=m.schoolId
   WHERE w.status='submitted' AND s.retentionDays IS NOT NULL
   AND julianday('now')-julianday(w.updatedAt)>=s.retentionDays LIMIT 1000`;
  await db.batch([db.prepare('DELETE FROM work WHERE rowid IN ('+selected+')'),
   db.prepare("INSERT INTO audit(action,target,createdAt) SELECT 'retention.purge',CAST(changes() AS TEXT),? WHERE changes()>0").bind(today()),
   db.prepare('DELETE FROM sessions WHERE expires<=?').bind(Date.now()),db.prepare('DELETE FROM auth_limits WHERE untilTime<=?').bind(Date.now()),
   db.prepare('DELETE FROM audit WHERE createdAt<?').bind(new Date(Date.now()-90*86400000).toISOString())]);
 }};
}
