import {mountEditor} from '../scratch/editor.mjs';
import {initial} from './model.mjs';
export function mount(host,state,onChange,task){return mountEditor(host,state,onChange,'scratch',initial);}
