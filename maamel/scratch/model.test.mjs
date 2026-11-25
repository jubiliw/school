import test from 'node:test';
import assert from 'node:assert/strict';
import {tasks,initial,grade} from './model.mjs';
import {run} from './runtime.mjs';
const flag={op:'flag'},down={op:'down'},up={op:'up'};
const move=n=>({op:'move',n}),turn=(n,op='cw')=>({op,n}),say=(text,seconds=2)=>({op:'say',text,seconds}),sound=sound=>({op:'sound',sound}),repeat=(n,...body)=>({op:'repeat',n,body});
const examples={
 space:{title:'الفضاء',scene:'space'},football:{title:'كرة القدم',scene:'football',x:-140},
 speak:[say('مرحبًا بكم في سكراتش',5)],bird:[move(30),say('لنستمع لصوت العصفور'),sound('bird')],greet:[say('السلام عليكم'),move(30)],turn:[turn(40),say('أنا أستدير')],picnic:[say('لنقم بنزهة'),sound('door'),move(200)],loop:[repeat(10,move(5))],
 walk:{title:'قطة تمشي',scene:'grass',x:-150,blocks:[flag,repeat(5,move(10),say('مرحبًا'))]},turns:{title:'كيفية الاستدارة',blocks:[flag,repeat(6,say('سأستدير إلى اليمين'),turn(15),say('سأستدير إلى اليسار'),turn(15,'ccw'))]},
 line:[down,move(150)],square:[down,repeat(4,move(100),turn(90))],triangle:[down,repeat(3,move(100),turn(120))],
 circle:[down,repeat(36,move(10),turn(10))],dashed:[{op:'color',n:16},repeat(3,repeat(4,down,move(10),up,move(10)),turn(120))],
 'review-dashes':{x:-170,blocks:[flag,{op:'erase'},{op:'size',n:2},{op:'color',n:77},repeat(5,down,move(30),up,move(30))]},
 basketball:{scene:'basketball',blocks:[flag,repeat(10,down,move(10),sound('bounce'),up,move(10))]}
};
for(const task of tasks)test('Scratch textbook p'+task.page+' '+task.id,()=>{const model=examples[task.id];const s={...initial(),...(Array.isArray(model)?{blocks:[flag,...model]}:model)};assert.equal(grade(JSON.parse(JSON.stringify(s)),task.id).score,100);assert.ok(grade(initial(),task.id).score<100);});
test('ordered behaviour, partial feedback and ignoring forged trace',()=>{
 const s={...initial(),blocks:[flag,move(30),say('السلام عليكم')],score:100};assert.equal(grade(s,'greet').score,67);
 assert.equal(grade({blocks:[move(30)],trace:[]},'greet').score,0);assert.equal(grade({...initial(),blocks:[flag,repeat(100,repeat(100,move(1)))]},'square').score,0);
});
test('pen states, nested loop, stamps, clear, width and turn direction',()=>{
 const r=run({...initial(),blocks:[flag,down,move(20),{op:'erase'},turn(90,'ccw'),{op:'size',n:4},{op:'color',n:30},move(20),{op:'stamp'}]},'scratch');assert.equal(r.valid,true);assert.equal(r.stamps.length,1);assert.equal(r.segments.length,1);assert.equal(r.segments[0].color,30);assert.equal(r.segments[0].width,4);assert.equal(Math.round(r.y),-20);
});
test('different start positions and wait retained in playback',()=>{
 const r=run({...initial(),x:-45,blocks:[flag,{op:'wait',n:2},move(30)]},'scratch');assert.equal(r.frames[0].startTime,2000);assert.equal(r.x,-15);
});
