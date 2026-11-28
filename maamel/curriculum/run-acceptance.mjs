// node run-acceptance.mjs /path/to/app /path/to/results.json
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,rename,readdir} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {cases} from './trace-cases.mjs';

const root=resolve(process.argv[2]), output=resolve(process.argv[3]);
const load=p=>import(pathToFileURL(resolve(root,p)));
const {default:worker}=await load('backend/index.mjs');
const {localDatabase}=await load('backend/local-db.mjs');
const {labs}=await load('registry.mjs');

async function fingerprint(){
  const hash=createHash('sha256');
  for(const dir of ['backend','windows','scratch','robot','office-common','sheets','word','slides','web','media','av','ai','review']){
    const files=(await readdir(resolve(root,dir))).filter(f=>/\.(?:sql|mjs)$/.test(f)&&!f.includes('.test.')).sort();
    for(const file of files){const path=resolve(root,dir,file);hash.update(relative(root,path)+'\0');hash.update(await readFile(path));}
  }
  hash.update(await readFile(resolve(root,'registry.mjs')));
  for(const file of ['./trace-cases.mjs','./run-acceptance.mjs'])hash.update(await readFile(new URL(file,import.meta.url)));
  return hash.digest('hex');
}
const digest=await fingerprint(), results=[];
for(const spec of cases(labs)){
  const DB=localDatabase();
  try{
    DB.exec(await readFile(resolve(root,'backend/schema.sql'),'utf8'));
    async function request(path,method,body,cookie,expected=200){
      const res=await worker.fetch(new Request('https://maamel.test/api/'+path,{method,
        headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},
        body:body===undefined?undefined:JSON.stringify(body)}),{DB});
      const data=await res.json();
      assert.equal(res.status,expected,JSON.stringify({path,status:res.status,data}));
      return {data,cookie:res.headers.get('set-cookie')?.split(';')[0]};
    }
    const register=role=>request('register','POST',{username:'check_'+role,name:'حساب اختبار',password:'test-only-credentials',role},null,201);
    const teacher=await register('teacher'),student=await register('student');
    const room=await request('classes','POST',{name:'اختبار الرابع'},teacher.cookie,201);
    await request('join','POST',{code:room.data.code},student.cookie);
    const task=labs[spec.lab].tasks.find(t=>t.id===spec.task);
    assert.ok(task,'Unknown task '+spec.task);
    const assignment=await request('assignments','POST',{classId:room.data.id,title:task.title,lab:spec.lab,task:spec.task},teacher.cookie,201);
    const path='assignments/'+assignment.data.id;
    const original=(await request(path,'GET',undefined,student.cookie)).data.work;
    const incorrect=spec.make(structuredClone(original.state),false);
    const rejected=(await request(path+'/submit','POST',{state:incorrect,version:original.version,score:100},student.cookie)).data;
    assert.ok(rejected.score<100,'Incorrect artifact received full credit');
    await request(path+'/reopen','POST',{studentId:student.data.user.id},teacher.cookie);
    const reopened=(await request(path,'GET',undefined,student.cookie)).data.work;
    const correct=spec.make(structuredClone(original.state),true);
    const saved=(await request(path+'/work','PUT',{state:correct,version:reopened.version},student.cookie)).data;
    const restored=(await request(path,'GET',undefined,student.cookie)).data.work;
    assert.deepEqual(restored.state,correct);
    const accepted=(await request(path+'/submit','POST',{state:restored.state,version:saved.version,score:0},student.cookie)).data;
    assert.equal(accepted.score,100);
    const result=(await request(path+'/results','GET',undefined,teacher.cookie)).data.results[0];
    assert.equal(result.score,100);assert.equal(result.attempts,2);
    const attempts=(await request(path+'/attempts?studentId='+student.data.user.id,'GET',undefined,teacher.cookie)).data.attempts;
    assert.deepEqual(attempts.map(a=>a.score),[100,rejected.score]);
    const stem=spec.section+'-P'+String(spec.page).padStart(3,'0');
    results.push({acceptance:stem+'-TEST',activity:stem+'-ACT',sourcePage:spec.page,lab:spec.lab,task:spec.task,incorrect:rejected.score,correct:accepted.score,teacher:result.score,attempts:result.attempts});
  } finally{DB.close();}
}
const evidence={version:1,ranAt:new Date().toISOString(),node:process.version,codeSha256:digest,results};
await writeFile(output+'.tmp',JSON.stringify(evidence,null,2)+'\n');
await rename(output+'.tmp',output);
console.log(results.length+' source-linked assignment submissions passed');
