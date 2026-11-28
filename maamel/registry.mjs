import * as audacity from './audacity/model.mjs';
import * as windows from './windows/model.mjs';
import * as word from './word/model.mjs';
import * as slides from './slides/model.mjs';
import * as sheets from './sheets/model.mjs';
import * as scratch from './scratch/model.mjs';
import * as robot from './robot/model.mjs';
import * as web from './web/model.mjs';
import * as media from './media/model.mjs';
import * as review from './review/model.mjs';
import * as av from './av/model.mjs';
import * as ai from './ai/model.mjs';
export const labs={audacity,windows,word,slides,sheets,scratch,robot,web,media,av,ai,review};
export function validateLab(lab,task){return Object.hasOwn(labs,lab)&&labs[lab].tasks.some(t=>t.id===task)}
export function initial(lab,task){if(!Object.hasOwn(labs,lab))throw Error('مختبر غير معروف');return labs[lab].initial(task)}
export function grade(lab,state,task){if(!validateLab(lab,task))throw Error('نشاط غير معروف');return labs[lab].grade(state,task)}
