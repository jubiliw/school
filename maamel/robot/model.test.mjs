import test from 'node:test';
import assert from 'node:assert/strict';
import {tasks,initial,grade} from './model.mjs';
import {run} from '../scratch/runtime.mjs';
const drive=(distance,speed=50,direction='forward')=>({op:'drive',distance,speed,direction});
const steer=(left,right,distance)=>({op:'steer',left,right,distance,direction:'forward'});
const circle=(left,right)=>steer(left,right,Math.PI*2*18.5*((left+right)/2)/Math.abs(left-right));
const square=Array.from({length:4},()=>[drive(60),{op:'turn',n:90,direction:'right',speed:30}]).flat();
const examples={return:[drive(100,30),drive(100,30,'back')],speed:[drive(50),drive(50,100)],steering:[drive(80),steer(100,40,68),steer(50,50,80),steer(65,20,50)],circle:[circle(70,20)],'two-circles':[drive(20),circle(90,15),drive(40),circle(70,25),drive(20)],square};
for(const t of tasks)test('EV3 textbook p'+t.page+' '+t.id,()=>{const s={...initial(),blocks:examples[t.id]};assert.equal(grade(JSON.parse(JSON.stringify(s)),t.id).score,100);assert.equal(grade(initial(),t.id).score,0);});
test('unequal speeds produce curvature, reverse restores pose, zero speed is stationary',()=>{
 const a=steer(75,25,50);const r=run({...initial(),blocks:[a,{...a,direction:'back'},drive(50,0)]},'robot');assert.ok(r.valid);assert.ok(Math.abs(r.x)+Math.abs(r.y)+Math.abs(r.angle)<1e-6);assert.ok(r.frames.some(f=>Math.abs(f.y)>20));
});
test('partial credit rejects drill with correct endpoint but wrong speeds',()=>{
 assert.equal(grade({...initial(),blocks:[drive(50,75),drive(50,75)]},'speed').score,33);
 assert.ok(grade({...initial(),blocks:square.map((b,i)=>i===1?{...b,n:70}:b)},'square').score<100);
});
import {sensors,validObjects} from './scene.mjs';
test('EV3 virtual ultrasonic, contact, surface and yaw readings respond to scene state',()=>{
 const objects=[{shape:'box',x:80,y:0,color:'#152617'},{shape:'area',x:0,y:0,color:'#ff0000'}];
 assert.equal(validObjects(objects),true);assert.deepEqual(sensors(objects,{x:0,y:0,angle:0}),{range:53,touch:false,color:'#ff0000',gyro:0});
 assert.equal(sensors(objects,{x:53,y:0,angle:0}).touch,true);assert.equal(sensors(objects,{x:0,y:0,angle:90}).range,null);
 assert.equal(sensors(objects.slice(1),{x:0,y:0,angle:0}).range,null);
 assert.equal(validObjects([{...objects[0],shape:'invalid'}]),false);
});
