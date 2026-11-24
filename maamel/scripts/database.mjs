import {DatabaseSync} from 'node:sqlite';
import {openSync,closeSync,unlinkSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export function snapshot(source,destination,{restore=false}={}){
 if(resolve(source)===resolve(destination))throw Error('Choose a new destination file.');
 const sourceDb=new DatabaseSync(source,{readOnly:true});
 let reserved=false;
 try{
  const health=sourceDb.prepare('PRAGMA integrity_check').all();
  if(health.length!==1 || health[0].integrity_check!=='ok')throw Error('Source integrity check failed.');
  if(sourceDb.prepare('PRAGMA foreign_key_check').all().length)throw Error('Source foreign key check failed.');
  const fd=openSync(destination,'wx',0o600);closeSync(fd);reserved=true;
  sourceDb.prepare('VACUUM INTO ?').run(resolve(destination));
  const copy=new DatabaseSync(destination);
  try{
   if(restore)copy.exec('DELETE FROM sessions; DELETE FROM auth_limits;');
   const integrity=copy.prepare('PRAGMA integrity_check').all();
   if(integrity.length!==1||integrity[0].integrity_check!=='ok'||copy.prepare('PRAGMA foreign_key_check').all().length)
    throw Error('Destination integrity check failed.');
  }finally{copy.close();}
 }catch(error){if(reserved)unlinkSync(destination);throw error;}
 finally{sourceDb.close();}
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const [, ,action,source,destination]=process.argv;
 if(!['backup','restore'].includes(action)||!source||!destination)throw Error('Usage: node scripts/database.mjs backup|restore SOURCE NEW_DESTINATION');
 snapshot(source,destination,{restore:action==='restore'});
 console.log('Verified SQLite '+action+' at '+resolve(destination));
}
