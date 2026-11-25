// IDs are stable keys from skills.tsv. Each pair differs in a substantive outcome.
const move = n => ({op:'move', n});
const flag = {op:'flag'}, up = {op:'up'}, down = {op:'down'};
const repeat = (n,...body) => ({op:'repeat', n, body});
const clockwise = n => ({op:'cw',n});
const drive = (distance,speed) => ({op:'drive',distance,speed,direction:'forward'});
const steer = distance => ({op:'steer',left:70,right:20,distance,direction:'forward'});
function book(state) {
  state.name = 'دفتر التدريب';
  state.files = [{name:state.name,body:structuredClone(state.body)}];
  return state;
}

export function cases({windows}){
  const reviewKeys=[
    ['G4-Q01',160,'1201201201'],
    ['G4-Q02',162,'2012012012'],
    ['G4-Q07',315,'01010101000212'],
    ['G4-Q08',317,'0011002011201']
  ];
  return [
    ...reviewKeys.map(([section,page,key])=>({section,page,lab:'review',task:section,make(state,ok){
      state.answers=Object.fromEntries([...key].map((value,index)=>[index,Number(value)]));
      if(!ok)state.answers[0]=state.answers[0]===0?1:0;
      return state;
    }})),
    {section:'G4-01',page:19,lab:'windows',task:'hardware',make(s,ok){
      const answers={mouse:'المكوّنات الرئيسة',microphone:'الأجهزة الملحقة',display:'المكوّنات الرئيسة',camera:'الأجهزة الملحقة',keys:'المكوّنات الرئيسة',speaker:'الأجهزة الملحقة',letters:'لوحة المفاتيح',scan:'الماسح الضوئي',listen:'سماعة الرأس',print:ok?'الطابعة':'الشاشة'};
      for(const [question,value] of Object.entries(answers))s=windows.apply(s,{type:'answer',question,value});
      return s;
    }},
    {section:'G4-02',page:32,lab:'windows',task:'animals',make(s,ok){
      function folder(name,parent){s=windows.apply(s,{type:'create',kind:'folder',name,parent});return s.nodes.at(-1).id;}
      const root=folder('الحيوانات','docs');
      for(const animal of windows.animals){
        const parent=folder(animal.category,root);
        s=windows.apply(s,{type:'rename',id:animal.id,name:animal.name+'.png'});
        s=windows.apply(s,{type:(!ok&&animal.id==='bird')?'copy':'move',id:animal.id,parent});
      }
      return s;
    }},
    {section:'G4-15',page:155,lab:'scratch',task:'dashed',make(s,ok){
      s.blocks=[flag,{op:'color',n:ok?16:40},repeat(3,repeat(4,down,move(10),up,move(10)),clockwise(120))];return s;
    }},
    {section:'G4-P04',page:157,lab:'scratch',task:'basketball',make(s,ok){
      s.scene='basketball';s.blocks=[flag,repeat(10,down,move(10),{op:'sound',sound:ok?'bounce':'bird'},up,move(10))];return s;
    }},
    {section:'G4-20',page:224,lab:'sheets',task:'secret',make(s,ok){
      for(const [addr,raw] of Object.entries({A2:'ا',B3:'ل',C4:'ح',D5:'ا',E6:'س',F7:ok?'ب':'د'}))s.body.cells[addr]={raw};
      return s;
    }},
    {section:'G4-21',page:238,lab:'sheets',task:'cost',make(s,ok){
      const cells=s.body.cells;
      cells.B8={raw:ok?'=B7*400':'8800'};cells.C8={raw:'=C7*400'};cells.D8={raw:'=B8+C8'};
      return book(s);
    }},
    {section:'G4-26',page:291,lab:'robot',task:'speed',make(s,ok){
      s.blocks=[drive(50,ok?50:75),drive(50,ok?100:75)];return s;
    }},
    {section:'G4-27',page:298,lab:'robot',task:'circle',make(s,ok){
      const radius=18.5*(70+20)/2/(70-20);
      s.blocks=[steer((ok?2:1)*Math.PI*radius)];return s;
    }},
    {section:'G4-P08',page:300,lab:'robot',task:'square',make(s,ok){
      s.blocks=Array.from({length:4},(_,i)=>[drive(60,50),{op:'turn',n:!ok&&i===0?70:90,direction:'right',speed:30}]).flat();return s;
    }}
  ];
}
