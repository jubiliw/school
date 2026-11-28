import {paintScene} from '../robot/scene.mjs';
const TAU=2*Math.PI;
const circle=(c,x,y,r,fill)=>{c.beginPath();c.arc(x,y,r,0,TAU);fill?c.fill():c.stroke();};
const path=(c,points,fill=false)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));if(fill)c.fill();else c.stroke();};
export function paintBackdrop(c,kind,scene) {
 const colors={plain:'#fff',grid:'#f1f7f6',grass:'#d1eff9',castle:'#f5ddbd',basketball:'#dda96a',football:'#319469',space:'#172953'};
 c.fillStyle=colors[scene]||'#fff';c.fillRect(-240,-180,480,360);
 c.lineWidth=2;c.strokeStyle='#fffa';
 if(scene==='space'){for(let i=0;i<90;i++){c.fillStyle=i%3?'white':'#ffd680';circle(c,(i*263%479)-240,(i*197%357)-180,(i%3+1)*.65,true);}c.fillStyle='#8587cc';circle(c,-135,-86,28,true);c.strokeStyle='#d1c3ef';c.beginPath();c.ellipse(-135,-86,42,9,-.3,0,TAU);c.stroke();}
 if(scene==='grass'){c.fillStyle='#72b986';c.beginPath();c.ellipse(100,160,310,110,0,0,TAU);c.fill();c.fillStyle='#437f68';c.beginPath();c.ellipse(-160,180,300,80,0,0,TAU);c.fill();}
 if(scene==='sea'){
  const water=c.createLinearGradient(0,-180,0,180);water.addColorStop(0,'#278ac0');water.addColorStop(1,'#10496b');c.fillStyle=water;c.fillRect(-240,-180,480,360);
  c.fillStyle='#dbc58e';c.fillRect(-240,148,480,32);c.strokeStyle='#68ad80';c.lineWidth=5;
  for(let i=0;i<22;i++){const x=i*47%470-235;path(c,[[x,150],[x+6,139],[x-2,124-i%9],[x+4,110-i%15]]);}
 }
 if(scene==='farm'){
  c.fillStyle='#bce9f3';c.fillRect(-240,-180,480,360);c.fillStyle='#eebd70';c.fillRect(-240,-25,480,205);
  c.fillStyle='#ba6040';c.fillRect(-175,-52,82,74);c.fillStyle='#753c30';path(c,[[-185,-52],[-136,-95],[-82,-52]],true);c.fillRect(-148,-20,23,42);
  c.fillStyle='#a47742';for(let x=62;x<235;x+=26)c.fillRect(x,-42,5,32);c.fillRect(62,-36,161,4);
  for(let i=0;i<24;i++){c.fillStyle='#a16f29';circle(c,(i*17)%54-14,16+(i*13)%17,1.6,true);}
 }
 if(scene==='castle'){c.fillStyle='#9d6958';for(let i=-2;i<3;i++){c.fillRect(i*70,30,55,150);path(c,[[i*70-5,30],[i*70+27,-20],[i*70+60,30]],true);}}
 if(scene==='basketball'||scene==='football'){
  if(scene==='football'){for(let i=-240;i<240;i+=80){c.fillStyle='#ffffff0e';c.fillRect(i,-180,40,360);}}
  c.strokeRect(-218,-150,436,300);path(c,[[0,-150],[0,150]]);circle(c,0,0,42,false);
  for(const side of [-1,1]){c.save();c.scale(side,1);c.strokeRect(155,-68,63,136);if(scene==='basketball'){c.beginPath();c.arc(218,0,110,Math.PI/2,3*Math.PI/2);c.stroke();}c.restore();}
 }
 if(kind==='robot'&&scene==='grid'){c.strokeStyle='#8eb5ab45';c.lineWidth=.8;for(let x=-240;x<=240;x+=20)path(c,[[x,-180],[x,180]]);for(let y=-180;y<=180;y+=20)path(c,[[-240,y],[240,y]]);}
}
export function paintSprite(c,kind,x,y,angle,scale=1,costume){
 c.save();c.translate(x,y);c.scale(scale,scale);c.rotate(angle*Math.PI/180);c.lineJoin='round';
 if(kind==='robot'){
  c.fillStyle='#293a45';c.fillRect(-14,-13,25,5);c.fillRect(-14,8,25,5);
  c.fillStyle='#ffbc53';c.fillRect(-15,-8,30,16);c.fillStyle='#344950';c.fillRect(-7,-6,12,12);
  c.fillStyle='#f1fffa';circle(c,12,-4,2,true);circle(c,12,4,2,true);
 }else if(['fish','puffer','jelly'].includes(costume)){
  c.fillStyle=costume==='fish'?'#ff8945':costume==='jelly'?'#e996b4':'#f6c974';
  if(costume==='jelly'){
   c.beginPath();c.arc(0,1,13,Math.PI,TAU);c.fill();c.strokeStyle='#ebaac8';c.lineWidth=2;
   for(let x=-10;x<11;x+=5){c.beginPath();c.moveTo(x,0);c.bezierCurveTo(x-8,6,x+8,12,x-1,19);c.stroke();}
  }else{
   path(c,[[-8,0],[-21,-8],[-19,9]],true);
   if(costume==='puffer'){for(let i=0;i<12;i++){c.save();c.rotate(i*TAU/12);path(c,[[10,-2],[17,0],[11,3]],true);c.restore();}circle(c,0,0,13,true);}
   else{c.beginPath();c.ellipse(0,0,15,9,0,0,TAU);c.fill();c.fillStyle='white';c.fillRect(-4,-8,3,16);}
   c.fillStyle='#253946';circle(c,8,-3,1.8,true);
  }
 }else if(costume==='hen-c'||costume==='hen-d'){
  const peck=costume==='hen-d',hx=peck?18:12,hy=peck?9:-13;
  c.strokeStyle='#b87829';c.lineWidth=2;for(const lx of [-6,4])path(c,[[lx,4],[lx,14],[lx+4,14]]);
  c.fillStyle='#fff1ce';path(c,[[-8,0],[-25,-15],[-19,2],[-9,7]],true);c.beginPath();c.ellipse(-2,1,15,10,0,0,TAU);c.fill();
  circle(c,hx,hy,8,true);c.fillStyle='#b94539';circle(c,hx,hy-8,3,true);
  c.fillStyle='#db9d35';path(c,[[hx+6,hy],[hx+14,hy+3],[hx+6,hy+4]],true);c.fillStyle='#392d29';circle(c,hx+3,hy-2,1.4,true);
 }else{
  c.strokeStyle='#98512b';c.lineWidth=4;c.lineCap='round';c.beginPath();c.moveTo(-9,3);c.bezierCurveTo(-24,-12,-23,12,-28,3);c.stroke();
  c.fillStyle=({slate:'#82939b',sand:'#dabe87'})[costume]||'#e69256';c.beginPath();c.ellipse(-3,3,13,9,0,0,TAU);c.fill();
  path(c,[[0,-6],[1,-20],[9,-14],[16,-19],[19,-6]],true);circle(c,10,-5,11,true);
  c.fillStyle='#fff3da';c.beginPath();c.ellipse(13,-2,7,4,0,0,TAU);c.fill();c.fillStyle='#283941';circle(c,11,-7,1.3,true);circle(c,17,-7,1.3,true);
  c.strokeStyle='#98512b';c.lineWidth=3;path(c,[[-7,6],[-9,13],[-12,13]]);path(c,[[3,7],[6,13],[10,13]]);
 }
 c.restore();
}
export function renderStage(canvas,state,kind,result,t=0,onPose,layer=false){
 const c=canvas.getContext('2d');if(!c)return;
 c.save();c.scale(canvas.width/480,canvas.height/360);c.translate(240,180);if(!layer)paintBackdrop(c,kind,state.scene);
 const origin=result?.origin??{x:state.x||0,y:state.y||0,angle:0};
 const frames=result?.frames||[];
 const scale=kind==='robot'&&frames.length?Math.min(1,220/Math.max(220,...frames.map(p=>Math.abs(p.x))),155/Math.max(155,...frames.map(p=>Math.abs(p.y)))):1;
 c.scale(scale,scale);if(kind==='robot')paintScene(c,state.objects);c.lineCap='round';let end=origin;
 for(const f of frames){
  if(f.time<=t){end=f;continue;}
  // A pause between motions must leave the sprite at its last pose.
  const motionStart=f.startTime??end.time??0;
  const k=t<=motionStart?0:(t-motionStart)/(f.time-motionStart||1);
  end={x:end.x+(f.x-end.x)*k,y:end.y+(f.y-end.y)*k,angle:end.angle+(f.angle-end.angle)*k};break;
 }
 for(const l of result?.segments||[]){
  if((l.start??l.time)>t)continue;
  const k=l.time<=t?1:(t-l.start)/(l.time-l.start||1);
  c.strokeStyle=kind==='robot'?'#1e4248':'hsl('+l.color*3.6+' 78% 43%)';c.lineWidth=kind==='robot'?2:l.width;path(c,[[l.from.x,l.from.y],[l.from.x+(l.to.x-l.from.x)*k,l.from.y+(l.to.y-l.from.y)*k]]);
 }
 for(const s of result?.stamps||[])if(s.time<=t)paintSprite(c,kind,s.x,s.y,s.angle,1,s.costume??state.costume);
 paintSprite(c,kind,end.x,end.y,end.angle,1,result?.trace?.findLast(e=>e.op==='costume'&&e.start<=t)?.costume??state.costume);c.restore();onPose?.(end);
 let text=result?.trace?.find(e=>e.op==='say'&&t>=e.start&&t<e.end)?.text||'';
 if(!layer&&kind==='scratch')for(const [i,actor] of (state.others??[]).entries()){
  const speech=renderStage(canvas,actor,kind,result?.others?.[i],t,null,true);if(speech)text+=(text?' · ':'')+speech;
 }
 return text;
}
export function playSound(ctx,name){
 if(!ctx||ctx.state!=='running')return;
 const table={cat:[760,380,'sine'],bird:[1100,2400,'sine'],bounce:[145,48,'triangle'],door:[300,90,'sawtooth']};
 const [from,to,wave]=table[name]||table.cat;
 const osc=ctx.createOscillator(),gain=ctx.createGain(),at=ctx.currentTime;osc.type=wave;osc.frequency.setValueAtTime(from,at);osc.frequency.exponentialRampToValueAtTime(to,at+.19);gain.gain.setValueAtTime(.06,at);gain.gain.exponentialRampToValueAtTime(.001,at+.23);osc.connect(gain);gain.connect(ctx.destination);osc.start(at);osc.stop(at+.25);
}
