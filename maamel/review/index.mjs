import {reviews} from './model.mjs';
export function mount(host,state,onChange,task){
 const entry=reviews.find(r=>r.id===task), form=document.createElement('form');
 let answers={...state?.answers};
 form.className='stack'; form.onsubmit=e=>e.preventDefault();
 const caption=document.createElement('p');caption.className='meta';form.append(caption);
 const progress=()=>caption.textContent='تمت الإجابة عن '+entry.questions.filter((q,i)=>Number.isInteger(answers[i])).length+' من '+entry.questions.length;
 entry.questions.forEach((q,i)=>{
  const group=document.createElement('fieldset'),title=document.createElement('legend');group.className='box';title.textContent=(i+1)+' · '+q.prompt;group.append(title);
  if(q.figure){const img=document.createElement('img');img.src=q.figure;img.alt=q.alt||'';img.style.maxWidth='min(100%,360px)';group.append(img)}
  q.options.forEach((value,index)=>{
   const label=document.createElement('label'),input=document.createElement('input');label.className='row';input.type='radio';input.name='q'+i;input.checked=answers[i]===index;
   input.onchange=()=>{answers={...answers,[i]:index};onChange({answers});progress()};
   label.append(input,document.createTextNode(value));group.append(label);
  });
  form.append(group);
 });
 for(const item of [entry.practical??[]].flat()){
  if(!item?.lab||!item?.task)continue;
  const link=document.createElement('a');link.className='outline';link.textContent=item.title||'فتح التدريب العملي المصاحب';link.href='#practice/'+encodeURIComponent(item.lab)+'/'+encodeURIComponent(item.task);form.append(link);
 }
 progress();host.replaceChildren(form);
}
