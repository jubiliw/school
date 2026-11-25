import {grade,initial,validateLab} from '../registry.mjs';
import {createApi} from './api.mjs';
import {isAssigned} from '../courses/index.mjs';
export default createApi({grade,initial,validateLab,isAssigned});
