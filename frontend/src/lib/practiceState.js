/**
 * Per-question workspace persistence (code / formula, last output, status), so returning to a question restores
 * exactly what you had. Local first (works signed-out), mirrored to the backend attempt record when signed in.
 */
const KEY = (module, qid) => `dh_ws:${module}:${qid}`;

export function loadWorkspace(module, qid) {
  try { const raw = localStorage.getItem(KEY(module, qid)); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function saveWorkspace(module, qid, state) {
  try {
    const slim = { ...state, savedAt: Date.now() };
    if (slim.output && slim.output.values && slim.output.values.length > 200) slim.output = { ...slim.output, values: slim.output.values.slice(0, 200), truncated: true };
    localStorage.setItem(KEY(module, qid), JSON.stringify(slim));
  } catch { /* quota or private mode — ignore */ }
}
/** Merge backend attempts (from GET /progress) into local storage so code follows the account across devices. */
export function hydrateFromAttempts(module, attempts) {
  const solved = new Set();
  for (const a of attempts || []) {
    if (a.module !== module) continue;
    if (a.correct) solved.add(a.question_id);
    const local = loadWorkspace(module, a.question_id);
    if (a.code && (!local || (a.updated_at && local.savedAt && Date.parse(a.updated_at) > local.savedAt))) saveWorkspace(module, a.question_id, { ...(local || {}), code: a.code, solved: !!a.correct });
    else if (a.correct && local && !local.solved) saveWorkspace(module, a.question_id, { ...local, solved: true });
  }
  return solved;
}
/** Which questions are solved locally (signed-out users still see their ticks). */
export function localSolvedSet(module) {
  const s = new Set();
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(`dh_ws:${module}:`)) { const v = JSON.parse(localStorage.getItem(k)); if (v?.solved) s.add(k.slice(`dh_ws:${module}:`.length)); } } } catch { /* ignore */ }
  return s;
}
