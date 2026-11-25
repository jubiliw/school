// A curriculum references the stable simulator and task IDs; a task can appear in several books.
export function createCatalog(programs,books){
 const catalog=Object.entries(programs).map(([id,program])=>({id,tasks:program.tasks.map(task=>({...task,placements:[]}))}));
 const programsById=new Map(catalog.map(program=>[program.id,new Map(program.tasks.map(t=>[t.id,t]))]));
 for(const book of books)for(const link of book.activities){
  const task=programsById.get(link.program)?.get(link.task);
  if(!task)throw Error('Unknown simulator activity: '+link.program+'/'+link.task);
  const lesson=book.lessons.find(l=>link.page>=l.start&&link.page<=l.end);
  if(!lesson)throw Error('Unmapped source page: '+link.page);
  if(task.placements.some(p=>p.grade===book.grade&&p.term===lesson.term&&p.page===link.page))throw Error('Duplicate curriculum mapping');
  const placement={grade:book.grade,term:lesson.term,unit:lesson.unit,lesson:lesson.lesson,page:link.page};
  task.placements.push(placement);
  task.unit??=lesson.unit;task.lesson??=lesson.lesson;
 }
 return catalog.filter(p=>p.tasks.some(t=>t.placements.length)).map(p=>({...p,tasks:p.tasks.filter(t=>t.placements.length)}));
}
