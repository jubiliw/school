import {test} from 'node:test';
import assert from 'node:assert/strict';
import {localDatabase} from './local-db.mjs';
import {readFile} from 'node:fs/promises';
import {createApi} from './api.mjs';

const schema=await readFile(new URL('./schema.sql',import.meta.url),'utf8');
function fixture(){
 const DB=localDatabase(),db=DB.sq;
 db.exec(schema);
 const env={DB};
 const api=createApi({
  initial:lab=>lab==='files'?{folders:[]}:null,
  grade:(_lab,state,task)=>({score:state.folders.includes(task)?100:0,feedback:[{target:task}]})
 });
 async function request(path,method='GET',body,session='',overrides={}){
  const response=await api.fetch(new Request('https://test.invalid/api/'+path,{method,headers:{'Content-Type':'application/json',...(session?{Cookie:session}:{}),...overrides},body:body===undefined?undefined:JSON.stringify(body)}),env);
  const data=response.headers.get('content-type')?.includes('json')?await response.json():await response.text();
  return {data,status:response.status,cookie:response.headers.get('set-cookie')?.split(';')[0],headers:response.headers};
 }
 async function newUser(username,role){
  const r=await request('register','POST',{username,name:username,role,password:'passphrase-test'});
  assert.equal(r.status,201,JSON.stringify(r.data));
  return {session:r.cookie,id:r.data.user.id};
 }
 return {db,env,api,request,newUser};
}

test('teacher and pupil journey, draft reopening, grading/version history, CSV and role isolation',async()=>{
 const {db,request,newUser}=fixture();
 const teacher=await newUser('teacher','teacher'), pupil=await newUser('pupil','student');
 const anotherTeacher=await newUser('teacher2','teacher'), outsider=await newUser('visitor','student');
 const create=await request('classes','POST',{name:'الرابع'},teacher.session); assert.equal(create.status,201);
 const {id:classId,code}=create.data;
 assert.equal((await request('classes','POST',{name:'forbidden'},pupil.session)).status,403);
 assert.equal((await request('join','POST',{code},pupil.session)).status,200);
 assert.equal((await request('classes','GET',undefined,pupil.session)).data.classes.length,0);
 assert.equal((await request('classes/'+classId+'/approve','POST',{students:[pupil.id]},teacher.session)).status,200);
 assert.equal((await request('classes','GET',undefined,pupil.session)).data.classes[0].code,undefined);
 assert.equal((await request('assignments','POST',{title:'بدون صلاحية',classId,lab:'files'},anotherTeacher.session)).status,404);
 assert.equal((await request('assignments','POST',{title:'مجهول',classId,lab:'x'},teacher.session)).status,400);
 const created=await request('assignments','POST',{title:'مجلداتي',classId,lab:'files',task:'الشجرة'},teacher.session);
 assert.equal(created.status,201); const path='assignments/'+created.data.id;
 assert.equal((await request(path,'GET',undefined,outsider.session)).status,404);
 assert.equal((await request(path+'/results','GET',undefined,anotherTeacher.session)).status,404);
 assert.equal((await request(path+'/results','GET',undefined,pupil.session)).status,403);
 const assignments=await request('assignments','GET',undefined,pupil.session); assert.equal(assignments.data.assignments.length,1);
 const opened=await request(path,'GET',undefined,pupil.session); assert.deepEqual(opened.data.work.state,{folders:[]});
 const unfinished={folders:['العلوم']},complete={folders:['الشجرة']};
 const saved=await request(path+'/work','PUT',{state:unfinished,version:0},pupil.session); assert.equal(saved.data.version,1);
 const stale=await request(path+'/work','PUT',{state:complete,version:0},pupil.session); assert.equal(stale.status,409);
 const reloaded=await request(path,'GET',undefined,pupil.session); assert.deepEqual(reloaded.data.work.state,unfinished);
 const first=await request(path+'/submit','POST',{state:unfinished,version:1},pupil.session); assert.equal(first.data.score,0);
 assert.equal((await request(path+'/work','PUT',{state:complete,version:2},pupil.session)).status,409);
 assert.equal((await request(path+'/reopen','POST',{studentId:pupil.id},teacher.session)).status,200);
 const second=await request(path+'/submit','POST',{state:complete,version:3},pupil.session); assert.equal(second.data.score,100);
 const result=await request(path+'/results','GET',undefined,teacher.session); assert.deepEqual([result.data.results[0].score,result.data.results[0].attempts],[100,2]);
 const attemptDetails=await request(path+'/attempts?studentId='+pupil.id,'GET',undefined,teacher.session);
 assert.deepEqual(attemptDetails.data.attempts.map(a=>a.state),[complete,unfinished]);
 const download=await request(path+'/export','GET',undefined,teacher.session); assert.match(download.data,/100/); assert.match(download.headers.get('content-type'),/text\/csv/);
 assert.equal(db.prepare("SELECT count(*) AS n FROM audit WHERE action='assignment.submit'").get().n,2);
});

test('cookies, role validation, login rate, CSRF, account deletion and cascading cleanup',async()=>{
 const {request,newUser,db}=fixture();
 const t=await newUser('معلم','teacher');
 assert.equal((await request('register','POST',{username:'admin',password:'passphrase-test',role:'admin',name:'x'})).status,400);
 assert.equal((await request('register','POST',{username:'معلم',password:'passphrase-test',role:'teacher',name:'x'})).status,409);
 assert.equal((await request('me','GET',undefined,t.session)).data.user.username,'معلم');
 const auth=await request('login','POST',{username:'معلم',password:'passphrase-test'});
 assert.match(auth.headers.get('set-cookie'),/__Host-maamel=.*HttpOnly; Secure; SameSite=Lax/);
 assert.equal((await request('classes','POST',{name:'X'},t.session,{Origin:'https://other.invalid'})).status,403);
 assert.equal((await request('classes','POST',{name:'X'},t.session,{'Content-Type':'text/plain'})).status,415);
 assert.equal((await request('logout','POST',{},t.session)).status,200);
 assert.equal((await request('me','GET',undefined,t.session)).data.user,null);
 for(let i=0;i<15;i++)assert.equal((await request('login','POST',{username:'nobody',password:'bad'})).status,401);
 assert.equal((await request('login','POST',{username:'nobody',password:'bad'})).status,429);
 assert.equal((await request('account','DELETE',{password:'wrong'},auth.cookie)).status,403);
 assert.equal((await request('account','DELETE',{password:'passphrase-test'},auth.cookie)).status,200);
 assert.equal(db.prepare('SELECT count(*) AS n FROM sessions').get().n,0);
 assert.equal(db.prepare('SELECT count(*) AS n FROM subscriptions').get().n,0);
});

test('deadline enforcement, concurrent saves, class limits and oversized state',async()=>{
 const {request,newUser,db}=fixture();
 const t=await newUser('teacher','teacher'),s=await newUser('student','student');
 const c=await request('classes','POST',{name:'ح'},t.session); await request('join','POST',{code:c.data.code},s.session); await request('classes/'+c.data.id+'/approve','POST',{students:[s.id]},t.session);
 const a=await request('assignments','POST',{classId:c.data.id,title:'واجب',lab:'files',task:'a'},t.session);
 const p='assignments/'+a.data.id,body={state:{folders:[]},version:0};
 const race=await Promise.all([request(p+'/work','PUT',body,s.session),request(p+'/work','PUT',body,s.session)]);
 assert.deepEqual(race.map(x=>x.status).sort(),[200,409]);
 db.prepare('UPDATE assignments SET dueAt=?').run('2020-01-01T00:00:00.000Z');
 assert.equal((await request(p+'/submit','POST',{...body,version:1},s.session)).status,403);
 db.prepare('UPDATE subscriptions SET classLimit=1').run();
 assert.equal((await request('classes','POST',{name:'ثان'},t.session)).status,403);
 assert.equal((await request(p+'/work','PUT',{...body,state:{text:'x'.repeat(700000)}},s.session)).status,413);
});

test('bulk result query and scheduled retention',async t=>{
 const {request,newUser,db,api,env}=fixture();
 const teacher=await newUser('teacher','teacher');
 const c=await request('classes','POST',{name:'ف'},teacher.session);
 const a=await request('assignments','POST',{title:'عمل',classId:c.data.id,lab:'files'},teacher.session);
 const add=db.prepare("INSERT INTO users(id,username,name,role,passwordHash,salt,createdAt) VALUES(?,?,?,'student','fixture','fixture',?)");
 const join=db.prepare('INSERT INTO members VALUES(?,?)');
 db.exec('BEGIN');
 for(let i=0;i<500;i++){const key='student'+i;add.run(key,key,key,new Date().toISOString());join.run(c.data.id,key);}
 db.exec('COMMIT');
 const start=performance.now();
 const result=await request('assignments/'+a.data.id+'/results','GET',undefined,teacher.session);
 assert.equal(result.data.results.length,500); t.diagnostic('500 rows returned in '+Math.round(performance.now()-start)+' ms on local SQLite');
 db.prepare("INSERT INTO sessions VALUES('expired',?,0)").run(teacher.id);
 await api.scheduled({},env);
 assert.equal(db.prepare("SELECT count(*) n FROM sessions WHERE token='expired'").get().n,0);
});

test('operator provisioning, school isolation, pooled limits, account suspension and retention',async()=>{
 const {request,newUser,db,env,api}=fixture();
 const operator=await newUser('operator','teacher');db.prepare("UPDATE users SET role='admin' WHERE id=?").run(operator.id);
 const t=await newUser('teacher','teacher'),t2=await newUser('teacher2','teacher'),s=await newUser('student','student');
 const op=(p,m,b)=>request('admin/'+p,m,b,operator.session);
 assert.equal((await request('admin/usage','GET',undefined,t.session)).status,403);
 const {data:{school},status}=await op('schools','POST',{name:'مدرسة الاختبار',retentionDays:1});assert.equal(status,201);
 for(const teacher of [t,t2])assert.equal((await op('schools/'+school.id+'/teachers','POST',{teacherId:teacher.id})).status,200);
 const plan=await op('subscriptions','POST',{plan:'school',schoolId:school.id,classLimit:1,status:'active'});assert.equal(plan.status,200);
 assert.equal((await op('subscriptions','POST',{plan:'school',schoolId:school.id,classLimit:1,status:'active'})).data.subscription.id,plan.data.subscription.id);
 assert.equal((await op('schools/'+school.id,'DELETE',{confirmName:school.name})).status,409);
 const c=await request('classes','POST',{name:'ف'},t.session);assert.equal(c.status,201);
 assert.equal((await request('classes','POST',{name:'ف٢'},t2.session)).status,403);
 await request('join','POST',{code:c.data.code},s.session); await request('classes/'+c.data.id+'/approve','POST',{students:[s.id]},t.session);
 const a=await request('assignments','POST',{title:'عمل',classId:c.data.id,lab:'files'},t.session);
 const p='assignments/'+a.data.id;
 await request(p+'/submit','POST',{state:{folders:[]},version:0},s.session);
 db.prepare("UPDATE work SET updatedAt='2025-01-01T00:00:00Z'").run();
 await api.scheduled({},env);
 assert.equal(db.prepare('SELECT count(*) n FROM work').get().n,0);
 assert.equal(db.prepare('SELECT count(*) n FROM attempts').get().n,0);
 assert.equal((await op('users?q=teacher','GET')).data.users.length,2);
 assert.equal((await op('users/'+s.id,'PATCH',{suspended:true})).status,200);
 assert.equal((await request('me','GET',undefined,s.session)).data.user,null);
 assert.equal((await request('login','POST',{username:'student',password:'passphrase-test'})).status,401);
 assert.equal((await op('users/'+s.id,'PATCH',{suspended:false})).status,200);
 assert.equal((await request('login','POST',{username:'student',password:'passphrase-test'})).status,200);
 assert.equal((await op('schools/'+school.id,'PATCH',{name:'مدرسة محدثة',retentionDays:null})).data.school.retentionDays,null);
 for(const teacher of [t,t2])assert.equal((await op('schools/'+school.id+'/teachers/'+teacher.id,'DELETE',{})).status,200);
 const planId=plan.data.subscription.id;
 assert.equal((await op('subscriptions/'+planId,'DELETE',{confirmId:planId})).status,200);
 assert.equal((await op('schools/'+school.id,'DELETE',{confirmName:'مدرسة محدثة'})).status,200);
 assert.ok((await op('audit','GET')).data.events.find(x=>x.action==='school.delete'));
});

test('teacher edits own class and grades the last submitted attempt, retaining its automatic score',async()=>{
 const {request,newUser}=fixture();
 const t=await newUser('owner','teacher'),other=await newUser('other','teacher'),s=await newUser('student','student');
 const {data:c}=await request('classes','POST',{name:'رابع'},t.session);
 const cp='classes/'+c.id,edit={name:'رابع ب',programs:['word']};
 assert.equal((await request(cp,'PUT',edit,other.session)).status,404);
 assert.equal((await request(cp,'PUT',edit,t.session)).status,200);
 assert.equal((await request(cp,'GET',undefined,t.session)).data.name,edit.name);
 await request('join','POST',{code:c.code},s.session);
 assert.deepEqual((await request('programs','GET',undefined,s.session)).data.programs,[]);
 await request(cp+'/approve','POST',{students:[s.id]},t.session);
 assert.deepEqual((await request('programs','GET',undefined,s.session)).data.programs,['word']);
 const {data:a}=await request('assignments','POST',{classId:c.id,lab:'files',task:'ok',title:'تطبيق'},t.session);
 const path='assignments/'+a.id;
 const {data:attempt}=await request(path+'/submit','POST',{state:{folders:['ok']},version:0},s.session);
 const mark={version:attempt.version,studentId:s.id,points:83};
 assert.equal((await request(path+'/grade','PUT',mark,s.session)).status,403);
 assert.equal((await request(path+'/grade','PUT',mark,other.session)).status,404);
 assert.equal((await request(path+'/grade','PUT',{...mark,points:101},t.session)).status,400);
 assert.equal((await request(path+'/grade','PUT',mark,t.session)).data.score,83);
 const result=(await request(path+'/results','GET',undefined,t.session)).data.results[0];
 assert.equal(result.score,83);assert.equal(result.autoScore,100);assert.equal(result.attempts,1);
 assert.equal((await request(path,'GET',undefined,s.session)).data.work.teacherPoints,83);
});
