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
 }else{
  c.strokeStyle='#98512b';c.lineWidth=4;c.lineCap='round';c.beginPath();c.moveTo(-9,3);c.bezierCurveTo(-24,-12,-23,12,-28,3);c.stroke();
  c.fillStyle=({slate:'#82939b',sand:'#dabe87'})[costume]||'#e69256';c.beginPath();c.ellipse(-3,3,13,9,0,0,TAU);c.fill();
  path(c,[[0,-6],[1,-20],[9,-14],[16,-19],[19,-6]],true);circle(c,10,-5,11,true);
  c.fillStyle='#fff3da';c.beginPath();c.ellipse(13,-2,7,4,0,0,TAU);c.fill();c.fillStyle='#283941';circle(c,11,-7,1.3,true);circle(c,17,-7,1.3,true);
  c.strokeStyle='#98512b';c.lineWidth=3;path(c,[[-7,6],[-9,13],[-12,13]]);path(c,[[3,7],[6,13],[10,13]]);
 }
 c.restore();
}
export function renderStage(canvas,state,kind,result,t=0,onPose){
 const c=canvas.getContext('2d');if(!c)return;
 c.save();c.scale(canvas.width/480,canvas.height/360);c.translate(240,180);paintBackdrop(c,kind,state.scene);
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
 for(const s of result?.stamps||[])if(s.time<=t)paintSprite(c,kind,s.x,s.y,s.angle,1,state.costume);
 paintSprite(c,kind,end.x,end.y,end.angle,1,state.costume);c.restore();onPose?.(end);
 return result?.trace?.find(e=>e.op==='say'&&t>=e.start&&t<e.end)?.text||'';
}
export function playSound(ctx,name){
 if(!ctx||ctx.state!=='running')return;
 const table={cat:[760,380,'sine'],bird:[1100,2400,'sine'],bounce:[145,48,'triangle'],door:[300,90,'sawtooth']};
 const [from,to,wave]=table[name]||table.cat;
 const osc=ctx.createOscillator(),gain=ctx.createGain(),at=ctx.currentTime;osc.type=wave;osc.frequency.setValueAtTime(from,at);osc.frequency.exponentialRampToValueAtTime(to,at+.19);gain.gain.setValueAtTime(.06,at);gain.gain.exponentialRampToValueAtTime(.001,at+.23);osc.connect(gain);gain.connect(ctx.destination);osc.start(at);osc.stop(at+.25);
}
