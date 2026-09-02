/**
 * Premium gating for practice modules.
 * The first N questions of each level (per company / workbook) are free; the rest need Premium.
 * Tweak FREE_PER_LEVEL to change how generous the free tier is.
 */
export const FREE_PER_LEVEL = { beginner: 12, intermediate: 8, advanced: 5 };

export function freeCount(difficulty) { return FREE_PER_LEVEL[difficulty] ?? 0; }

/** index = position of the question within its level list (0-based). */
export function isQuestionLocked(index, difficulty, user) {
  if (user?.is_premium) return false;
  return index >= freeCount(difficulty);
}

export function lockedCount(total, difficulty, user) {
  if (user?.is_premium) return 0;
  return Math.max(0, total - freeCount(difficulty));
}
