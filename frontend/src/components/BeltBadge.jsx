import React from "react";
import { computeBelt, nextBeltHint } from "@/lib/belts";

/** Small "current rank" chip for practice pages. tally = {beginner, intermediate, advanced} solved counts. */
export default function BeltBadge({ tally, compact = false }) {
  const b = computeBelt(tally);
  const dark = b.name === "Black";
  return (
    <div className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full border border-white/10 bg-white/5" title={nextBeltHint(b)} data-testid="belt-badge">
      <span className="w-3.5 h-3.5 rounded-sm border border-white/20" style={{ background: b.color }} />
      <span className="font-medium" style={{ color: dark ? "#fff" : b.color }}>{b.name} belt</span>
      {!compact && b.next && <span className="text-slate-500 font-mono-editor">{b.pct}% → {b.next.name}</span>}
    </div>
  );
}
