import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {localDatabase} from './local-db.mjs';
import {snapshot} from '../scripts/database.mjs';
test('verified backup and restore to a new DB, private permissions, existing file protected, sessions revoked',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'maamel-recovery-'));
 const original=join(dir,'source.db'),backup=join(dir,'snapshot.db'),restored=join(dir,'restored.db');
 try{
  const db=localDatabase(original);
  try{
   db.exec(await readFile(new URL('./schema.sql',import.meta.url),'utf8'));
   db.prepare("INSERT INTO users(id,username,name,role,passwordHash,salt,createdAt) VALUES('t','teacher','معلم','teacher','synthetic','test','2026-11-01')").run();
   db.prepare("INSERT INTO classes VALUES('c','t','رابع','EXAMPLE','2026-11-01')").run();
   db.prepare("INSERT INTO sessions VALUES('fake-hash','t',1)").run();
   snapshot(original,backup);
   assert.throws(()=>snapshot(original,backup),/EEXIST/);
   assert.equal((await stat(backup)).mode & 0o777,0o600);
  }finally{db.close();}
  snapshot(backup,restored,{restore:true});
  const recovered=localDatabase(restored);
  try{
   assert.equal(recovered.prepare('SELECT name FROM classes').first().name,'رابع');
   assert.equal(recovered.prepare('SELECT count(*) n FROM sessions').first().n,0);
   assert.equal(recovered.prepare('PRAGMA integrity_check').first().integrity_check,'ok');
  }finally{recovered.close();}
 }finally{await rm(dir,{recursive:true,force:true});}
});
