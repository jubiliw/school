import {named,result,taskId} from '../office-common/model.mjs';
export const tasks=[
 {id:'secret',title:'الرسالة السرية',page:224,instructions:'اكتب الحرف المناسب في كل خلية: A2 ا، B3 ل، C4 ح، D5 ا، E6 س، F7 ب. اقرأ الكلمة من أعلى لأسفل.'},
 {id:'travel',title:'وجهات السفر المفضلة',page:234,instructions:'في جدول الوجهات، كبّر خط رؤوس الأعمدة واجعلها غامقة وملونة. وسّط أسماء الوجهات واختر لون تعبئة لكل منها، ثم احفظ المصنف باسم مناسب.'},
 {id:'votes',title:'احسب أصوات الرحلة',page:237,instructions:'اكتب في D2:D6 صيغ جمع تصويت الفصلين لكل وجهة. احسب مجموع كل فصل في B7 وC7. أضف صوتين لحصن نجران في الفصل أ، وراقب تغير الإجماليات. احفظ المصنف.'},
 {id:'cost',title:'ميزانية الرحلة',page:238,instructions:'تكلفة الطالب 400 ريال. اكتب صيغًا في B8 وC8 تعتمد على مجموع كل فصل في الصف 7. اجمع التكلفتين في D8 واحفظ الملف.'}
];
export const trip=[['الوجهة','الفصل أ','الفصل ب','إجمالي عدد الطلبة'],['الحِجر',1,3],['قلعة مارد',9,3],['قصر المصمك',3,7],['الدرعية التاريخية',7,7],['حصن نجران',2,6],['المجموع'],['التكلفة الإجمالية']];
export function initial(task){
 const id=taskId(task)||'secret', cells={};
 if(id!=='secret'&&id!=='free'){trip.forEach((row,i)=>row.forEach((v,j)=>cells['ABCD'[j]+(i+1)]={raw:String(v)}));}
 if(id==='cost'){for(const col of ['B','C'])cells[col+'7']={raw:'='+[2,3,4,5,6].map(n=>col+n).join('+')};}
 return {version:1,name:'',files:[],body:{sheetName:'ورقة 1',dir:'rtl',cells,widths:{A:146},heights:{}}};
}
const error={cycle:'#CYCLE!',value:'#VALUE!',zero:'#DIV/0!',ref:'#REF!'};
function arabicDigits(s){return s.replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/٫/g,'.');}
export function evaluate(cells,address,stack=new Set(),cache=new Map()){
 if(cache.has(address))return cache.get(address);
 if(stack.has(address)||stack.size>=60)return error.cycle;
 const value=cells?.[address]?.raw??'';
 if(typeof value!=='string'||value.length>350)return error.value;
 const src=arabicDigits(value.trim());
 if(!src.startsWith('='))return src!==''&&Number.isFinite(Number(src))?Number(src):value;
 const tokens=src.slice(1).toUpperCase().match(/[A-Z]+[1-9]\d*|(?:\d*\.\d+|\d+)|[^\s]/g)||[];
 let pos=0;stack.add(address);
 function atom(){
  const t=tokens[pos++];
  if(t==='+'||t==='-')return (t==='-'?-1:1)*atom();
  if(t==='('){const n=sum();if(tokens[pos++]!==')')throw error.value;return n;}
  if(/^\d*\.?\d+$/.test(t))return Number(t);
  if(/^[A-H](?:[1-9]|1\d|20)$/.test(t)){
   const v=evaluate(cells,t,stack,cache);
   if(v==='')return 0;
   if(typeof v!=='number')throw Object.values(error).includes(v)?v:error.value;
   return v;
  }
  throw /^[A-Z]+\d+$/.test(t)?error.ref:error.value;
 }
 function mul(){let n=atom();while(['*','/'].includes(tokens[pos])){const op=tokens[pos++],v=atom();if(op==='/'&&!v)throw error.zero;n=op==='*'?n*v:n/v;}return n;}
 function sum(){let n=mul();while(['+','-'].includes(tokens[pos])){const op=tokens[pos++],v=mul();n=op==='+'?n+v:n-v;}return n;}
 let out;try{out=sum();if(pos!==tokens.length||!Number.isFinite(out))out=error.value;}catch(e){out=Object.values(error).includes(e)?e:error.value;}
 stack.delete(address);cache.set(address,out);return out;
}
function formulaWorks(cells,address,inputs,expected){
 if(!cells?.[address]?.raw?.startsWith('='))return false;
 const values=inputs.map(a=>evaluate(cells,a));if(values.some(v=>typeof v!=='number'))return false;
 if(evaluate(cells,address)!==expected(values))return false;
 return inputs.every((a,i)=>{const copy={...cells,[a]:{raw:String(values[i]+3)}};const changed=values.slice();changed[i]+=3;return evaluate(copy,address)===expected(changed);});
}
const sum=xs=>xs.reduce((a,b)=>a+b,0);
export function grade(state,task){
 const cells=state?.body?.cells||{};const id=taskId(task)||'secret',checks=[];
 if(id==='secret')Object.entries({A2:'ا',B3:'ل',C4:'ح',D5:'ا',E6:'س',F7:'ب'}).forEach(([a,v])=>checks.push([cells[a]?.raw?.trim()===v,a+' = '+v]));
 else if(id==='travel'){
  for(const col of ['A','B','C']){const c=cells[col+'1'];checks.push([!!c?.bold&&c.size>14&&!!c.color,'تنسيق رأس '+col]);}
  for(let i=2;i<=6;i++)checks.push([!!cells['A'+i]?.fill&&cells['A'+i]?.align==='center','تعبئة وتوسيط A'+i]);checks.push([named(state),'حفظ المصنف']);
 } else if(id==='votes'){
  for(let i=2;i<=6;i++)checks.push([formulaWorks(cells,'D'+i,['B'+i,'C'+i],sum),'صيغة جمع في D'+i]);
  for(const col of ['B','C'])checks.push([formulaWorks(cells,col+'7',[2,3,4,5,6].map(i=>col+i),sum),'مجموع الفصل في '+col+'7']);
  checks.push([evaluate(cells,'B6')===4,'إضافة الصوتين إلى B6'],[named(state),'حفظ المصنف']);
 } else if(id==='cost'){
  for(const col of ['B','C'])checks.push([formulaWorks(cells,col+'8',[col+'7'],v=>v[0]*400),'حساب التكلفة في '+col+'8']);
  checks.push([formulaWorks(cells,'D8',['B8','C8'],sum),'جمع التكلفتين في D8'],[named(state),'حفظ المصنف']);
 }else return {score:0,feedback:'تدريب غير معروف'};
 return result(checks);
}
