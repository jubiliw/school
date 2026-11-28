import fourth from './grade-04.json' with {type:'json'};
import fifth from './grade-05.json' with {type:'json'};
export const books=[fourth,fifth];
export function isAssigned(program,task,grade,term){
 return books.some(book=>book.grade===grade&&book.activities.some(a=>a.program===program&&a.task===task&&book.lessons.some(l=>l.term===term&&a.page>=l.start&&a.page<=l.end)));
}
