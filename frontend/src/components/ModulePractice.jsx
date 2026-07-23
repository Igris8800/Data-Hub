import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QUESTIONS, MODULES } from "@/lib/questions";
import DifficultySelector from "@/components/DifficultySelector";
import PremiumLock from "@/components/PremiumLock";
import UpgradeModal from "@/components/UpgradeModal";
import { Progress } from "@/components/ui/progress";
import { Lock, Crown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

/**
 * Generic module practice layout.
 * `render` prop draws the question runner (SQL / Python / MCQ etc.)
 * `renderEmbed` optional — for Excel / Power BI iframe hints.
 */
export default function ModulePractice({ moduleKey, render, renderEmbed }) {
  const nav = useNavigate();
  const module = MODULES.find(m => m.key === moduleKey);
  const all = QUESTIONS[moduleKey] || [];
  const [difficulty, setDifficulty] = useState("beginner");
  const [idx, setIdx] = useState(0);
  const [solved, setSolved] = useState(new Set());
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { user } = useAuth();

  const filtered = useMemo(() => all.filter(q => q.difficulty === difficulty), [all, difficulty]);
  const cur = filtered[idx] || filtered[0];

  const onDifficulty = (d) => { setDifficulty(d); setIdx(0); };

  const markSolved = (q) => {
    setSolved(s => {
      const n = new Set(s); n.add(q.id); return n;
    });
    // upgrade prompt every 5 solved
    if ((solved.size + 1) % 5 === 0) {
      setTimeout(() => setUpgradeOpen(true), 800);
    }
  };

  // Locked/paid preview questions (numbered placeholders)
  const lockedCount = module.total - (all.filter(q => q.difficulty === difficulty).length);

  return (
    <div className="max-w-7xl mx-auto px-6 pb-16">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Module</div>
          <h1 className="font-heading text-4xl sm:text-5xl tracking-tighter leading-none" style={{ color: module.accent }}>
            {module.name}
          </h1>
          <p className="text-slate-400 mt-2 max-w-md">{module.tagline}</p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-widest text-slate-500">Free sample</div>
          <div className="font-mono-editor text-2xl">{solved.size} / {all.length}</div>
          <Progress value={(solved.size / all.length) * 100} className="w-40 h-1.5 mt-2" data-testid="module-progress" />
        </div>
      </div>

      <div className="mb-6"><DifficultySelector value={difficulty} onChange={onDifficulty} /></div>

      {/* Optional embed panel (Excel / Power BI) */}
      {renderEmbed && <div className="mb-6">{renderEmbed()}</div>}

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar: question list */}
        <aside className="rounded-lg border border-white/10 bg-[#151B23] p-3 max-h-[70vh] overflow-y-auto" data-testid="questions-sidebar">
          <div className="text-xs uppercase tracking-widest text-slate-500 px-2 py-2">
            {filtered.length} free · {module.total - all.length + (all.length - filtered.length)} locked
          </div>
          {filtered.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setIdx(i)}
              data-testid={`q-list-item-${q.id}`}
              className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-md text-sm transition-colors ${i === idx ? "bg-[#00D4FF]/10 text-white" : "hover:bg-white/5 text-slate-300"}`}
            >
              <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-mono-editor ${solved.has(q.id) ? "bg-[#00FF88] text-[#0D1117]" : "bg-white/5 text-slate-400"}`}>
                {solved.has(q.id) ? "✓" : (i+1)}
              </span>
              <span className="truncate">{q.title}</span>
            </button>
          ))}

          {/* Locked previews */}
          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="text-[10px] uppercase tracking-widest text-yellow-400 px-2 mb-2 flex items-center gap-1">
              <Crown className="w-3 h-3" /> Premium
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setUpgradeOpen(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-500 hover:bg-white/5"
                data-testid={`locked-q-${i}`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="truncate italic opacity-60">Locked question #{filtered.length + i + 1}</span>
              </button>
            ))}
            <div className="text-xs text-slate-500 px-2 pt-2">
              +{lockedCount.toLocaleString()} more locked
            </div>
          </div>
        </aside>

        {/* Main practice pane */}
        <div className="relative min-h-[400px]">
          {cur ? render(cur, markSolved) : (
            <div className="p-8 rounded-lg border border-white/10 bg-[#151B23] text-slate-400">No questions in this difficulty yet.</div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <Button variant="outline" onClick={() => setIdx(i => Math.max(0, i-1))} disabled={idx === 0} className="rounded-full border-white/15 bg-transparent" data-testid="prev-q-btn">
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <div className="text-sm text-slate-500 font-mono-editor">Question {idx+1} of {filtered.length}</div>
            <Button onClick={() => setIdx(i => Math.min(filtered.length-1, i+1))} disabled={idx >= filtered.length-1} className="rounded-full bg-[#00D4FF] text-[#0D1117] hover:bg-[#33DDFF] font-medium" data-testid="next-q-btn">
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* AdSense sidebar placeholder */}
          <div className="mt-8 h-24 rounded-md border border-dashed border-white/15 bg-[#151B23]/40 flex items-center justify-center text-xs text-slate-500" data-testid="adsense-module-placeholder">
            AdSense placeholder — inline banner
          </div>
        </div>
      </div>

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
