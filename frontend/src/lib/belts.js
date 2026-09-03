/**
 * Dojo-style skill progression. A belt is earned by demonstrating ability — solving problems of increasing
 * difficulty — not by finishing a course. Each rank has requirements on total solved AND on medium/hard solves,
 * so you can't reach Blue on easy questions alone.
 *
 * computeBelt({ beginner, intermediate, advanced }) → { rank, name, color, next, toNext:[{label, have, need}], pct }
 */
export const BELTS = [
  { name: "White",  color: "#E5E7EB", total: 0,   medium: 0,  hard: 0,  blurb: "Just getting started." },
  { name: "Yellow", color: "#FDE047", total: 5,   medium: 0,  hard: 0,  blurb: "Comfortable with the basics." },
  { name: "Orange", color: "#FB923C", total: 15,  medium: 3,  hard: 0,  blurb: "Can combine several concepts." },
  { name: "Green",  color: "#4ADE80", total: 30,  medium: 10, hard: 0,  blurb: "Solid working proficiency." },
  { name: "Blue",   color: "#38BDF8", total: 50,  medium: 20, hard: 5,  blurb: "Handles real analyst problems." },
  { name: "Purple", color: "#C084FC", total: 70,  medium: 28, hard: 15, blurb: "Advanced problem solver." },
  { name: "Brown",  color: "#A16207", total: 85,  medium: 33, hard: 25, blurb: "Expert-level fluency." },
  { name: "Black",  color: "#111827", total: 100, medium: 33, hard: 33, blurb: "Mastery. Every problem solved." },
];

export function tallyAttempts(attempts, moduleKey) {
  const t = { beginner: 0, intermediate: 0, advanced: 0 };
  for (const a of attempts || []) if (a.module === moduleKey && a.correct && t[a.difficulty] !== undefined) t[a.difficulty]++;
  return t;
}

export function computeBelt(t) {
  const total = (t.beginner || 0) + (t.intermediate || 0) + (t.advanced || 0);
  const medium = (t.intermediate || 0), hard = (t.advanced || 0);
  let rank = 0;
  for (let i = 0; i < BELTS.length; i++) { const b = BELTS[i]; if (total >= b.total && medium >= b.medium && hard >= b.hard) rank = i; else break; }
  const cur = BELTS[rank], next = BELTS[rank + 1] || null;
  const toNext = next ? [
    { label: "solved", have: total, need: next.total },
    { label: "medium", have: medium, need: next.medium },
    { label: "hard", have: hard, need: next.hard },
  ].filter((x) => x.need > 0) : [];
  const pct = next ? Math.round(Math.min(1, ...toNext.map((x) => x.have / x.need)) * 100) : 100;
  return { rank, ...cur, next, toNext, pct, total, medium, hard };
}

/** Human line like "3 more solved and 2 more medium to Orange". */
export function nextBeltHint(b) {
  if (!b.next) return "Highest rank reached.";
  const gaps = b.toNext.filter((x) => x.have < x.need).map((x) => `${x.need - x.have} more ${x.label}`);
  return gaps.length ? `${gaps.join(" · ")} → ${b.next.name} belt` : `${b.next.name} belt unlocked`;
}
