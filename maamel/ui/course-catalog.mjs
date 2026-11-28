export const gradeNames={4:'الرابع الابتدائي',5:'الخامس الابتدائي',6:'السادس الابتدائي',7:'الأول المتوسط',8:'الثاني المتوسط',9:'الثالث المتوسط',10:'الأول الثانوي',11:'الثاني الثانوي',12:'الثالث الثانوي'};
export const termNames={1:'الفصل الدراسي الأول',2:'الفصل الدراسي الثاني'};
export function placements(catalog){
 const unique=new Map();
 for(const lab of catalog)for(const task of lab.tasks)for(const p of task.placements){
  unique.set(p.grade+'/'+p.term,{grade:p.grade,term:p.term});
 }
 return [...unique.values()].sort((a,b)=>a.grade-b.grade||a.term-b.term);
}
export function programsFor(catalog,grade,term){
 return catalog.map(lab=>({...lab,tasks:lab.tasks.filter(t=>t.placements.some(p=>p.grade===+grade&&p.term===+term))})).filter(lab=>lab.tasks.length);
}
