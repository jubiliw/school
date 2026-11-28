const names={box:'مربّع',disc:'دائرة',triangle:'مثلث',area:'منطقة ملوّنة'};
export const shapes=Object.keys(names);
export const defaultObjects=()=>[{shape:'box',color:'#40aeba',x:80,y:-60}];
export function validObjects(objects){return objects===undefined||Array.isArray(objects)&&objects.length<=24&&objects.every(o=>o&&shapes.includes(o.shape)&&/^#[a-f0-9]{6}$/i.test(o.color)&&Number.isFinite(o.x)&&Math.abs(o.x)<=220&&Number.isFinite(o.y)&&Math.abs(o.y)<=160);}
const vertices=o=>o.shape==='triangle'?[[0,-15],[15,13],[-15,13]]:[[-13,-13],[13,-13],[13,13],[-13,13]];
const cross=(ax,ay,bx,by)=>ax*by-ay*bx;
function ray(o,x,y,dx,dy){
 x-=o.x;y-=o.y;
 if(o.shape==='disc'){const a=x*dx+y*dy,b=x*x+y*y-13*13,disc=a*a-b;return disc<0?Infinity:b<=0?0:-a-Math.sqrt(disc)>=0?-a-Math.sqrt(disc):Infinity;}
 const v=vertices(o);let best=Infinity,inside=true;
 for(let i=0;i<v.length;i++){
 const [ax,ay]=v[i],[bx,by]=v[(i+1)%v.length],ex=bx-ax,ey=by-ay,ox=ax-x,oy=ay-y;
 if(cross(ex,ey,x-ax,y-ay)<0)inside=false;
 const denom=cross(dx,dy,ex,ey);if(Math.abs(denom)<1e-9)continue;
 const distance=cross(ox,oy,ex,ey)/denom,u=cross(ox,oy,dx,dy)/denom;
 if(distance>=0&&u>=0&&u<=1)best=Math.min(best,distance);
 }return inside?0:best;
}
export function sensors(objects,pose){
 const direction=pose.angle*Math.PI/180,dx=Math.cos(direction),dy=Math.sin(direction);
 let range=Infinity,color='#ffffff';
 for(const o of objects||[]){const d=ray(o,pose.x,pose.y,dx,dy);if(o.shape==='area'){if(d===0)color=o.color;}else range=Math.min(range,Math.max(0,d-14));}
 return {range:range>200?null:Math.round(range),touch:range<=1,color,gyro:Math.round(pose.angle)};
}
export function paintScene(c,objects){
 for(const o of objects||[]){c.save();c.translate(o.x,o.y);c.fillStyle=o.color;c.strokeStyle='#213e4360';c.lineWidth=1.6;c.beginPath();
 if(o.shape==='disc')c.arc(0,0,13,0,Math.PI*2);else vertices(o).forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();if(o.shape!=='area')c.stroke();c.restore();}
}
export function sceneControls(host,state,changed){
 let pick=-1;const h=document.createElement('details'),summary=document.createElement('summary');summary.textContent='تعديل مشهد المحاكاة';h.append(summary);const editor=document.createElement('div');editor.className='stage-fields';h.append(editor);host.append(h);
 const button=(name,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=name;b.onclick=fn;return b;};
 const opt=(k,v)=>{const o=document.createElement('option');o.value=k;o.textContent=v;return o;};
 const select=document.createElement('select'),shape=document.createElement('select');select.ariaLabel='العنصر المحدد في المشهد';shape.ariaLabel='شكل العنصر الجديد';
 for(const k of shapes)shape.append(opt(k,names[k]));
 const color=document.createElement('input');color.type='color';color.ariaLabel='لون العنصر';color.value='#40aeba';color.oninput=()=>{if(pick>=0){state().objects[pick].color=color.value;changed();}};
 const hint=document.createElement('small');hint.textContent='حدد عنصرًا ثم انقر على اللوحة لنقله.';
 const del=button('حذف العنصر',()=>{if(pick<0)return;state().objects.splice(pick,1);pick=-1;sync();changed();});
 function sync(){const objs=state().objects??=[];select.replaceChildren(opt(-1,'الروبوت'));objs.forEach((o,i)=>select.append(opt(i,names[o.shape]+' '+(i+1))));if(!objs[pick])pick=-1;select.value=String(pick);del.disabled=pick<0;if(pick>=0)color.value=objs[pick].color;}
 select.onchange=()=>{pick=Number(select.value);sync();};
 const add=button('أضف إلى المشهد',()=>{let objs=state().objects;if(objs.length>=24)return;objs.push({shape:shape.value,color:color.value,x:60,y:30});pick=objs.length-1;sync();changed();});
 editor.append(shape,add,select,color,del,hint);sync();
 return {sync,place:(x,y)=>{if(pick<0)return false;Object.assign(state().objects[pick],{x,y});changed();return true;}};
}
