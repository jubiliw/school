export function taskId(task) { return typeof task === 'string' ? task : task?.id; }
export function result(checks) {
  const missing = checks.filter(([done]) => !done).map(([, label]) => label);
  return {score: Math.round(100 * (checks.length - missing.length) / checks.length),
    feedback: missing.length ? 'لإكمال التدريب، تحقق من الآتي: ' + missing.join('، ') : 'أحسنت. يطابق عملك جميع المعايير المحددة.'};
}
export function named(state) {return typeof state?.name === 'string' && !!state.name.trim() && Array.isArray(state.files) && state.files.some(f=>f?.name===state.name && JSON.stringify(f.body)===JSON.stringify(state.body));}
