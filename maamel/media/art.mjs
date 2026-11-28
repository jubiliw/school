import {leaves} from './model.mjs';
export function artwork(id,edit){
 const c=document.createElement('canvas');c.width=600;c.height=360;const g=c.getContext('2d');
 function oval(x,y,rx,ry,col){g.fillStyle=col;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();}
 function rect(x,y,w,h,col){g.fillStyle=col;g.fillRect(x,y,w,h);}
 function poly(points,col){g.fillStyle=col;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();}
 const grad=g.createLinearGradient(0,0,0,360);grad.addColorStop(0,'#84bcc5');grad.addColorStop(1,'#f5d7a0');g.fillStyle=grad;g.fillRect(0,0,600,360);
 if(id==='coast'){oval(480,88,34,34,'#ffe4a9');for(let i=0;i<18;i++){const h=(i*37)%83;rect(i*36,195-h,22,h,'#698e91');}rect(0,195,600,165,'#387d82');for(let i=0;i<45;i++)rect((i*61)%600,205+(i*19)%135,20+(i*13)%55,2,'#77b5b0');poly([[0,290],[210,280],[420,360],[0,360]],'#ddbd82');[[138,65],[408,54]].forEach(([x,y],i)=>{if(!edit.fixes.includes(i))oval(x,y,6,5,'#685246');});}
 else if(id==='leaves'){rect(0,0,600,360,'#e6dfb3');leaves.forEach(([x,y],i)=>{g.save();g.translate(x*600,y*360);g.rotate([-.55,.35,-.25][i]);oval(0,0,48,27,['#3b8056','#66892d','#427f6a'][i]);rect(-47,-1,100,2,'#c5d893');g.restore();});}
 else if(id==='portrait'){oval(300,352,137,118,'#1f6c69');oval(300,158,101,116,'#b77c53');oval(300,95,99,59,'#4c352c');[250,350].forEach((x,i)=>{oval(x,155,17,11,'white');oval(x,155,7,8,edit.fixes.includes(i)?'#382b22':'#cc352b');});oval(300,211,18,3,'#60362f');}
 else if(id==='pyramid'){g.translate(600,360);g.rotate(Math.PI);poly([[300,40],[475,305],[125,305]],'#cc6c4d');poly([[236,136],[365,136],[475,305],[125,305]],'#dfa544');poly([[195,202],[405,202],[475,305],[125,305]],'#6e985d');}
 else if(id==='bird'){oval(300,200,78,44,'#385c77');oval(365,168,31,33,'#385c77');poly([[390,160],[420,172],[391,179]],'#d78e4d');oval(371,163,4,4,'white');}
 else{poly([[214,166],[218,84],[270,130]],'#995639');poly([[333,130],[385,84],[389,168]],'#995639');oval(301,193,96,80,'#bf8562');[265,337].forEach(x=>oval(x,179,9,13,'#405348'));oval(301,209,9,6,'#705240');}
 return c;
}
export function render(canvas,id,e,raw=false){const g=canvas.getContext('2d'),a=artwork(id,e);let [x,y,w,h]=raw?[0,0,1,1]:e.crop;
 let sw=Math.max(1,w*600),sh=Math.max(1,h*360),rot=raw?0:e.rotation;canvas.width=Math.round(rot%2?sh:sw);canvas.height=Math.round(rot%2?sw:sh);g.save();g.translate(canvas.width/2,canvas.height/2);g.rotate(rot*Math.PI/2);g.drawImage(a,x*600,y*360,sw,sh,-sw/2,-sh/2,sw,sh);g.restore();
 if(raw)return;const image=g.getImageData(0,0,canvas.width,canvas.height),v=image.data;
 for(let i=0;i<v.length;i+=4){const lum=.299*v[i]+.587*v[i+1]+.114*v[i+2];for(let j=0;j<3;j++){let k=e.filter==='vanilla'?0:e.color/100, t=lum+(v[i+j]-lum)*k;if(e.filter==='desert')t*=[1.12,1.02,.79][j];else if(e.filter==='arctic')t*=[.85,1.02,1.16][j];v[i+j]=t*e.light/100;}}g.putImageData(image,0,0);}
