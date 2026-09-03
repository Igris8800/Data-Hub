import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, Play, Briefcase, HelpCircle } from "lucide-react";

export const MODE_GUIDE = [
  { key: "learning", icon: BookOpen, color: "#00FF88", title: "Learning Mode", tagline: "Guided, in order",
    points: ["Questions come in a fixed order, easiest first", "You must solve the current one before the next unlocks", "Hints and solutions are always available", "Best when you're new to a topic"] },
  { key: "practice", icon: Play, color: "#00D4FF", title: "Practice Mode", tagline: "Free roam",
    points: ["Jump to any question in any order", "Hints, solutions and expected output on demand", "Your code is saved per question, so you can come back later", "Best for drilling weak spots"] },
  { key: "interview", icon: Briefcase, color: "#FFD166", title: "Interview Mode", tagline: "Timed, no help",
    points: ["Random question order and a countdown timer", "Hints and solutions are switched off", "Simulates a real technical screen", "Best when you want to test yourself"] },
];

const SEEN_KEY = "dh_mode_guide_seen";

/**
 * Explains the three practice modes. Opens itself the first time a practice page is visited;
 * the small "?" button (ModeGuideButton) re-opens it any time.
 */
export default function ModeGuide({ open, onOpenChange, modes = ["learning", "practice", "interview"], onPick }) {
  const items = MODE_GUIDE.filter((m) => modes.includes(m.key));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#0F1520] border-white/10 text-white" data-testid="mode-guide">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl tracking-tight">Three ways to practise</DialogTitle>
          <DialogDescription className="text-slate-400">Pick the one that matches what you're trying to do. You can switch at any time from the tabs at the top.</DialogDescription>
        </DialogHeader>
        <div className={`grid gap-3 ${items.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          {items.map((m) => { const Icon = m.icon; return (
            <div key={m.key} className="p-4 rounded-xl border bg-[#0D1117] flex flex-col" style={{ borderColor: `${m.color}40` }}>
              <div className="flex items-center gap-2 mb-1"><Icon className="w-4 h-4" style={{ color: m.color }} /><div className="font-heading text-base">{m.title}</div></div>
              <div className="text-[11px] uppercase tracking-widest mb-3" style={{ color: m.color }}>{m.tagline}</div>
              <ul className="text-xs text-slate-300 space-y-1.5 flex-1">{m.points.map((p) => <li key={p} className="flex gap-2"><span style={{ color: m.color }}>•</span><span>{p}</span></li>)}</ul>
              {onPick && <Button size="sm" onClick={() => { onPick(m.key); onOpenChange(false); }} className="mt-4 rounded-full text-[#0D1117] font-semibold" style={{ background: m.color }} data-testid={`mode-guide-pick-${m.key}`}>Start in {m.title.split(" ")[0]}</Button>}
            </div>
          ); })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useFirstVisitGuide() {
  const [open, setOpen] = useState(false);
  useEffect(() => { try { if (!localStorage.getItem(SEEN_KEY)) { setOpen(true); localStorage.setItem(SEEN_KEY, "1"); } } catch { /* ignore */ } }, []);
  return [open, setOpen];
}

export function ModeGuideButton({ onClick }) {
  return (
    <button onClick={onClick} title="What do the modes mean?" aria-label="Explain practice modes" data-testid="mode-guide-btn"
      className="w-7 h-7 rounded-full border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 inline-flex items-center justify-center">
      <HelpCircle className="w-3.5 h-3.5" />
    </button>
  );
}
