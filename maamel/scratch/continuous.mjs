import {run} from './runtime.mjs';

function* instructions(blocks,depth=0){
 if(depth>5)return;
 for(const block of blocks){
  if(block.op==='forever'){while(true){yield* instructions(block.body??[],depth+1);yield {op:'yield'};}}
  if(block.op==='repeat'){for(let i=0;i<Math.min(100,block.n);i++)yield* instructions(block.body??[],depth+1);}
  else yield block;
 }
}
function script(actor,event,message){
 const blocks=actor.blocks??[],start=blocks.findIndex(b=>b.op===event&&(event!=='receive'||b.message===message));
 if(start<0)return [];
 let end=start+1;while(end<blocks.length&&!['flag','key','clicked','receive'].includes(blocks[end].op))end++;
 return blocks.slice(start+1,end);
}
export function createMotionScene(actors){
 const sprites=actors.map(actor=>({actor,x:actor.x??0,y:actor.y??0,angle:0,threads:[{iter:instructions(script(actor,'flag')),due:0}],speech:'',until:0}));
 function click(i,now){const s=sprites[i],blocks=s&&script(s.actor,'clicked');if(blocks?.length)s.threads.push({iter:instructions(blocks),due:now});}
 function tick(now){
  const exists=t=>sprites.some(sprite=>sprite.threads.includes(t));
  for(const sprite of sprites){
   if(now>=sprite.until)sprite.speech='';
   for(const thread of [...sprite.threads]){
    let budget=64;
    while(thread.due<=now&&budget--&&sprite.threads.includes(thread)){
     if(thread.join?.some(exists))break;
     if(thread.join){thread.due=now;delete thread.join;}
     const {done,value:b}=thread.iter.next();
     if(done){sprite.threads=sprite.threads.filter(t=>t!==thread);break;}
     if(b.op==='broadcast'||b.op==='broadcastWait'){
      const listeners=[];
      for(const actor of sprites){const code=script(actor.actor,'receive',b.message);
       if(!code.length||actor.threads.length>=16)continue;
       const child={iter:instructions(code),due:thread.due};actor.threads.push(child);listeners.push(child);
      }
      if(b.op==='broadcastWait')thread.join=listeners;
      continue;
     }
     if(b.op==='costume'){sprite.costume=b.costume;continue;}
     if(b.op==='yield'){thread.due+=16;continue;}
     if(b.op==='stopOther'){sprite.threads=[thread];continue;}
     if(b.op==='say'){sprite.speech=String(b.text??'');thread.due+=1000*Math.max(.1,Math.min(60,Number(b.seconds)||2));sprite.until=thread.due;continue;}
     const r=run({x:sprite.x,y:sprite.y,blocks:[{op:'flag'},b]},'scratch',[],'flag',{x:sprite.x,y:sprite.y,angle:sprite.angle});
     if(!r.valid){sprite.threads=sprite.threads.filter(t=>t!==thread);break;}
     sprite.x=r.x;sprite.y=r.y;sprite.angle=r.angle;thread.due+=r.time;
    }
   }
  }
 }
 return {sprites,tick,click};
}
