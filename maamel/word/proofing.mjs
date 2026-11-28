// Teacher-authored practice vocabulary. The full system dictionary depends on the browser.
export const corrections=[
 ['الحاسوبب','الحاسوب'],['المرورر','المرور'],['البيانت','البيانات'],['المسجدد','المسجد'],['الشاطىء','الشاطئ'],['المصلون يزور','المصلون يزورون'],['المستخدمون يحمي','المستخدمون يحمون']
]
export function spellingIssues(paragraphs){
 return corrections.filter(([error])=>paragraphs.some(text=>new RegExp('(?<![\\p{L}])'+error+'(?![\\p{L}])','u').test(text)))
}
