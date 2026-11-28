// Pure, bounded interpreter. All graded traces are replayed from source blocks.
export const clamp = (v,min,max) => Math.min(max,Math.max(min,v));
export const rad = degrees => degrees*Math.PI/180;
export const number = (v, fallback, min, max) => Number.isFinite(Number(v)) ? clamp(Number(v),min,max) : fallback;
export function assess(checks) {
  const remaining=checks.filter(([,pass])=>!pass).map(([label])=>label);
  return {score:Math.round(100*(checks.length-remaining.length)/checks.length),feedback:remaining.length?'تبقّى: '+remaining.join('، '):'اكتملت معايير النشاط.'};
}
export function run(state, kind, answers=[],event='flag') {
  const robot=kind==='robot', blocks=state?.blocks;
  const origin={x:number(state?.x,0,-220,220),y:number(state?.y,0,-160,160),angle:0};
  let {x,y,angle}=origin, down=robot, color=60, width=2, time=0, visits=0;
  let costume=state?.costume,answer='',answerIndex=0,pending=null;
  let trace=[], frames=[], segments=[], stamps=[];
  if(!Array.isArray(blocks) || blocks.length>160) return {valid:false,trace,frames,segments,stamps,origin};
  const valid=robot || blocks[0]?.op===event&&['flag','clicked'].includes(event);
  const move=(length, delta=0,duration=160)=>{
    const start={x,y,angle}; const slice=rad(delta);
    if(Math.abs(slice)<1e-8){x+=length*Math.cos(rad(angle));y+=length*Math.sin(rad(angle));}
    else {let r=length/slice;x+=r*(Math.sin(rad(angle)+slice)-Math.sin(rad(angle)));y-=r*(Math.cos(rad(angle)+slice)-Math.cos(rad(angle)));}
    angle+=delta;
    if(!robot){x=clamp(x,-235,235);y=clamp(y,-175,175);}
    if(down && Math.hypot(x-start.x,y-start.y)>0.00001) segments.push({from:start,to:{x,y},color,width,start:time,time:time+duration});
    const startTime=time;time+=duration;frames.push({x,y,angle,time,startTime});
  };
  function execute(list,depth=0) {
    if(!Array.isArray(list)||depth>5||list.length>160) throw Error('limit');
    for(const b of list){
      if(++visits>1200||frames.length>6000||time>600000) throw Error('limit');
      if(!b||typeof b.op!=='string') throw Error('block');
      const n=number(b.n,10,-480,480);
      if(robot && !['drive','steer','turn'].includes(b.op)) throw Error('unknown');
      if(!robot && ['drive','steer','turn'].includes(b.op)) throw Error('unknown');
      const e={op:b.op,start:time,x,y,angle,n};
      trace.push(e);
      switch(b.op){
      case 'flag':case 'clicked': break;
      case 'ask':
        e.text=String(b.text??'').slice(0,180);
        if(answerIndex>=answers.length){pending={text:e.text,time,index:answerIndex};throw pending;}
        answer=String(answers[answerIndex++]).slice(0,180);break;
      case 'reply':e.op='say';e.text=String(b.prefix??'')+answer+String(b.suffix??'');time+=1000*number(b.seconds,2,.1,60);break;
      case 'ifAnswer':{
        const digits=answer.trim().replace(/[٠-٩]/g,d=>String(d.charCodeAt(0)-1632)).replace('٫','.');
        const a=digits===''?NaN:Number(digits),v=Number(b.value);
        if(Number.isFinite(a)&&Number.isFinite(v)&&(b.comparison==='lt'?a<v:b.comparison==='eq'?a===v:b.comparison==='gt'&&a>v))execute(b.body,depth+1);
        break;
      }
      case 'costume':costume=b.costume;e.costume=costume;break;
      case 'move':move(n);break;
      case 'cw':case 'ccw':move(0,(b.op==='cw'?1:-1)*n);break;
      case 'say':e.text=String(b.text??'').slice(0,180);time+=1000*number(b.seconds,2,.1,60);break;
      case 'sound':e.sound=String(b.sound??'').slice(0,50);time+=300;break;
      case 'wait':time+=1000*number(b.n,1,0,60);break;
      case 'repeat':for(let j=0;j<Math.floor(number(b.n,10,0,100));j++)execute(b.body,depth+1);break;
      case 'down':down=true;break;
      case 'up':down=false;break;
      case 'erase':segments=[];stamps=[];break;
      case 'color':color=(n%100+100)%100;break;
      case 'colorBy':color=((color+n)%100+100)%100;break;
      case 'size':width=number(b.n,1,1,80);break;
      case 'sizeBy':width=clamp(width+n,1,80);break;
      case 'stamp':stamps.push({x,y,angle,time,costume});break;
      case 'drive':case 'steer':{
        const distance=number(b.distance,20,0,350);
        const left=number(b.op==='drive'?b.speed:b.left,30,0,100);
        const right=number(b.op==='drive'?b.speed:b.right,30,0,100);
        Object.assign(e,{distance,left,right,direction:b.direction==='back'?'back':'forward'});
        if(!(right+left))break;
        const length=distance*(e.direction==='back'?-1:1);
        const delta=length*(left-right)/((left+right)/2)/18.5*180/Math.PI;
        const parts=clamp(Math.ceil(Math.abs(delta)/4),1,200);
        for(let i=0;i<parts;i++)move(length/parts,delta/parts,(1000*Math.abs(length)/((right+left)/2))/parts);
        break;
      }
      case 'turn':{e.direction=b.direction==='left'?'left':'right';e.speed=number(b.speed,30,0,100);if(e.speed)move(0,(e.direction==='right'?1:-1)*Math.abs(n),1000*Math.abs(n)/e.speed);break;}
      default: throw Error('unknown');
      }
      Object.assign(e,{end:time,toX:x,toY:y,toAngle:angle});
    }
  }
  let error=false;
  if(valid)try{execute(blocks);}catch(err){error=err!==pending;}
  return {valid:valid&&!error,trace,frames,segments,stamps,origin,x,y,angle,time,error,pending};
}
export const near=(a,b,tolerance=.001)=>Math.abs(a-b)<=tolerance;
export function polygon(points,count) {
  if(points.length!==count) return false;
  const lengths=points.map(({from,to})=>Math.hypot(to.x-from.x,to.y-from.y));
  if(Math.min(...lengths)<4 || Math.max(...lengths)-Math.min(...lengths)>1) return false;
  const angles=points.map(({from,to})=>Math.atan2(to.y-from.y,to.x-from.x));
  const turns=angles.map((angle,i)=>Math.atan2(Math.sin(angles[(i+1)%count]-angle),Math.cos(angles[(i+1)%count]-angle)));
  return turns.every(t=>near(t,turns[0],.03)) && near(Math.abs(turns[0]),2*Math.PI/count,.03) && Math.hypot(points.at(-1).to.x-points[0].from.x,points.at(-1).to.y-points[0].from.y)<1;
}
