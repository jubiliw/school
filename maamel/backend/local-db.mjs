// Node 24 development and integration-test adapter. Each batch runs in one
// synchronous SQLite transaction, matching the all-or-nothing D1 contract.
import {DatabaseSync} from 'node:sqlite';
export function localDatabase(path=':memory:'){
 const sq=new DatabaseSync(path);
 sq.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;');
 const prepare=(sql,args=[])=>{
  const stmt=()=>sq.prepare(sql);
  return {
   bind:(...values)=>prepare(sql,values),
   first:(column)=>{const row=stmt().get(...args);return column?row?.[column]??null:row??null;},
   all:()=>({results:stmt().all(...args),success:true}),
   run:()=>({meta:stmt().run(...args),success:true}),
   raw:()=>stmt().all(...args).map(row=>Object.values(row))
  };
 };
 return {sq,prepare,exec:sql=>sq.exec(sql),close:()=>sq.close(),batch(statements){
  sq.exec('BEGIN IMMEDIATE');
  try{const result=statements.map(stmt=>stmt.run());sq.exec('COMMIT');return result;}
  catch(error){sq.exec('ROLLBACK');throw error;}
 }};
}
