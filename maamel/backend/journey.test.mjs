import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import worker from './index.mjs';
import {localDatabase} from './local-db.mjs';
import {apply,animals} from '../windows/model.mjs';

test('real grade-four animal folder assignment, save, disconnect, score 40%, reopen and score 100%',async()=>{
 const DB=localDatabase();const env={DB};
 try{
  DB.exec(await readFile(new URL('./schema.sql',import.meta.url),'utf8'));
  async function api(path,method='GET',body,session=''){
   const req=new Request('https://maamel.test/api/'+path,{method,headers:{Cookie:session,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
   const res=await worker.fetch(req,env);
   return {status:res.status,data:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};
  }
  const credentials={password:'synthetic-long-passphrase'};
  const t=await api('register','POST',{...credentials,role:'teacher',username:'virtual_teacher',name:'معلم تجريبي'});
  const s=await api('register','POST',{...credentials,role:'student',username:'virtual_student',name:'طالب تجريبي'});
  assert.equal(t.status,201);assert.equal(s.status,201);
  const c=await api('classes','POST',{name:'رابع تجريبي'},t.cookie);
  assert.equal(c.status,201);
  assert.equal((await api('join','POST',{code:c.data.code},s.cookie)).status,200);
  assert.equal((await api('classes/'+c.data.id+'/approve','POST',{students:[s.data.user.id]},t.cookie)).status,200);
  const assignment={classId:c.data.id,title:'صور الحيوانات',lab:'windows',task:'animals',grade:4,term:1};
  const rejected=await api('assignments','POST',{...assignment,task:'absent'},t.cookie);assert.equal(rejected.status,400);
  assert.equal((await api('assignments','POST',{...assignment,term:2},t.cookie)).status,400);
  const issued=await api('assignments','POST',assignment,t.cookie);assert.equal(issued.status,201);
  const work='assignments/'+issued.data.id;
  const loaded=(await api(work,'GET',undefined,s.cookie)).data;assert.equal(loaded.assignment.grade,4);assert.equal(loaded.assignment.term,1);
  let state=loaded.work.state;
  const folder=(name,parent)=>{state=apply(state,{type:'create',kind:'folder',name,parent});return state.nodes.at(-1).id;};
  const root=folder('الحيوانات','docs'), categories=animals.map(a=>folder(a.category,root));
  const save=await api(work+'/work','PUT',{state,version:0},s.cookie);assert.equal(save.data.version,1);
  assert.equal((await api('logout','POST',{},s.cookie)).status,200);
  const relog=await api('login','POST',{...credentials,username:'virtual_student'});
  assert.equal(relog.status,200);assert.deepEqual((await api(work,'GET',undefined,relog.cookie)).data.work.state,state);
  const first=await api(work+'/submit','POST',{state,version:1,score:100},relog.cookie);
  assert.equal(first.data.score,40);
  assert.equal((await api(work+'/reopen','POST',{studentId:s.data.user.id},t.cookie)).status,200);
  const reopened=(await api(work,'GET',undefined,relog.cookie)).data.work;
  assert.equal(reopened.version,3);
  state=reopened.state;
  for(const [i,a] of animals.entries()){
   state=apply(state,{type:'rename',id:a.id,name:a.name+'.png'});
   state=apply(state,{type:'move',id:a.id,parent:categories[i]});
  }
  const final=await api(work+'/submit','POST',{state,version:reopened.version},relog.cookie);
  assert.equal(final.data.score,100);
  const grades=await api(work+'/results','GET',undefined,t.cookie);
  assert.equal(grades.data.results[0].attempts,2);assert.equal(grades.data.results[0].score,100);
  const archive=await api(work+'/attempts?studentId='+s.data.user.id,'GET',undefined,t.cookie);
  assert.deepEqual(archive.data.attempts.map(a=>a.score),[100,40]);
  const persisted=await api(work,'GET',undefined,relog.cookie);assert.deepEqual(persisted.data.work.state,state);
 }finally{DB.close();}
});

test('mixed grade follows the latest on-time submission and is visible to the student',async()=>{
 const DB=localDatabase();
 try{
  DB.exec(await readFile(new URL('./schema.sql',import.meta.url),'utf8'));
  async function call(path,method,body,cookie=''){
   const res=await worker.fetch(new Request('https://test.invalid/api/'+path,{method,headers:{cookie,'Content-Type':'application/json'},body:body&&JSON.stringify(body)}),{DB});
   return {data:await res.json(),status:res.status,cookie:res.headers.get('Set-Cookie')?.split(';')[0]};
  }
  const reg=role=>call('register','POST',{name:role,username:role,password:'synthetic-password',role});
  const t=await reg('teacher'),s=await reg('student'),studentId=s.data.user.id;
  const c=(await call('classes','POST',{name:'رابع'},t.cookie)).data;
  await call('join','POST',{code:c.code},s.cookie);
  await call('classes/'+c.id+'/approve','POST',{students:[studentId]},t.cookie);
  const body={classId:c.id,title:'جدول',lab:'sheets',task:'secret',grade:4,term:2,manualMax:20,startsAt:'2020-01-01T00:00:00Z',dueAt:'2099-01-01T00:00:00Z'};
  const a=await call('assignments','POST',body,t.cookie);assert.equal(a.status,201);
  const path='assignments/'+a.data.id,read=()=>call(path,'GET',undefined,s.cookie);
  const state=(await read()).data.work.state;
  const sub=version=>call(path+'/submit','POST',{version,state},s.cookie);
  const first=await sub(0);
  const mark=version=>call(path+'/grade','PUT',{points:17,studentId,version},t.cookie);
  assert.equal((await mark(1)).data.score,Math.round((first.data.score*.8+17)*100)/100);
  assert.equal((await read()).data.work.teacherPoints,17);
  assert.equal((await sub(1)).data.version,2);
  assert.equal((await read()).data.work.teacherPoints,null);
  assert.equal((await mark(1)).status,409);
  DB.sq.prepare('UPDATE assignments SET dueAt=? WHERE id=?').run('2021-01-01T00:00:00Z',a.data.id);
  assert.equal((await sub(2)).status,403);
 }finally{DB.close()}
});
