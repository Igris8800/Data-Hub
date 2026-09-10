/**
 * Practice-mode persistence + Learning-mode gating.
 *
 * Two things this module fixes:
 *  1. The selected mode (learning / practice / interview) is remembered per module, so leaving the
 *     page and coming back keeps you in the mode you chose instead of silently resetting to Practice.
 *  2. Learning mode is enforced consistently. A question is locked until every earlier question in the
 *     current list is solved — and because that is derived from the persisted solved set, the lock
 *     survives navigating away and back (previously only the "Next" button checked it, so the strip
 *     and jump-to let you skip ahead, and a reset to Practice removed the gate entirely).
 */
import { useEffect } from "react";

const MODES = ["learning", "practice", "interview"];
const MODE_KEY = (module) => `dh_mode:${module}`;

export function loadMode(module, fallback = "practice") {
  try {
    const m = localStorage.getItem(MODE_KEY(module));
    return MODES.includes(m) ? m : fallback;
  } catch {
    return fallback;
  }
}

export function saveMode(module, mode) {
  try { localStorage.setItem(MODE_KEY(module), mode); } catch { /* quota / private mode — ignore */ }
}

/**
 * In Learning mode, question `index` is locked until all earlier questions in `questions` are solved.
 * `solvedIds` is a Set of solved question ids (persisted locally + mirrored from the server).
 * Returns false in every other mode and for the first question.
 */
export function learningLocked(mode, questions, index, solvedIds) {
  if (mode !== "learning" || index <= 0) return false;
  for (let j = 0; j < index; j++) {
    if (!solvedIds.has(questions[j].id)) return true;
  }
  return false;
}

/**
 * Keep the active question chip visible in the (horizontally scrolling) question strip, so the
 * learner never has to drag the strip sideways to find where they are or reach the next question.
 * `testidPrefix` is the per-page chip test-id prefix, e.g. "excel-qdot-" (chips are "<prefix><index>").
 */
export function useActiveChipInView(idx, testidPrefix) {
  useEffect(() => {
    const el = typeof document !== "undefined" && document.querySelector(`[data-testid="${testidPrefix}${idx}"]`);
    if (el && el.scrollIntoView) el.scrollIntoView({ inline: "center", block: "nearest" });
  }, [idx, testidPrefix]);
}
