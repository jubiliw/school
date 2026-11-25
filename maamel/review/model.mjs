import {term1} from './term1.mjs';
import {term2} from './term2.mjs';
export const reviews=[...term1,...term2];
export const tasks=reviews.map(({id,title,page})=>({id,title,page,instructions:'اختر إجابة لكل سؤال. تُحسَب الدرجة من عدد الإجابات الصحيحة، ويمكنك مراجعة اختياراتك قبل التسليم.'}));
export function initial(){return {answers:{}}}
export function grade(state,task){
 const review=reviews.find(item=>item.id===task);
 if(!review)throw Error('التقويم غير موجود');
 const answers=state?.answers??{},missing=[],incorrect=[];
 for(const [index,q] of review.questions.entries()){
  if(!Number.isInteger(answers[index]))missing.push(index+1);
  else if(answers[index]!==q.correct)incorrect.push(index+1);
 }
 const count=review.questions.length;
 const score=Math.round(100*(count-missing.length-incorrect.length)/count);
 const notes=incorrect.map(number=>{
  const q=review.questions[number-1];
  return 'السؤال '+number+' · '+(q.explanation||('الإجابة الصحيحة «'+q.options[q.correct]+'»'));
 });
 if(missing.length)notes.unshift('أسئلة بلا إجابة: '+missing.join('، '));
 const feedback=notes.join('\n');
 return {score,feedback:feedback||'جميع الإجابات صحيحة.'};
}
