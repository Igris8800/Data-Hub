import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { QUESTIONS, MODULES } from "@/lib/questions";
import DifficultySelector from "@/components/DifficultySelector";
import UpgradeModal from "@/components/UpgradeModal";
import { Progress } from "@/components/ui/progress";
import { Lock, Crown, ChevronLeft, ChevronRight, Sparkles, Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import api from "@/lib/api";

const ADAPTIVE_THRESHOLD = 5; // consecutive correct answers to suggest level-up
const NEXT_DIFFICULTY = { beginner: "intermediate", intermediate: "advanced", advanced: null };

function loadStreak(module, difficulty) {
  try {
    const raw = localStorage.getItem(`dh_streak_${module}_${difficulty}`);
    return raw ? JSON.parse(raw) : { correct: 0, suggested: false };
  } catch { return { correct: 0, suggested: false }; }
}
function saveStreak(module, difficulty, val) {
  localStorage.setItem(`dh_streak_${module}_${difficulty}`, JSON.stringify(val));
}

export default function ModulePractice({ moduleKey, render, renderEmbed }) {
  const nav = useNavigate();
  const module = MODULES.find(m => m.key === moduleKey);
  const seed = QUESTIONS[moduleKey] || [];
  const [difficulty, setDifficulty] = useState("beginner");
  const [idx, setIdx] = useState(0);
  const [solved, setSolved] = useState(new Set());
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [aiBank, setAiBank] = useState([]);
  const [genLoading, setGenLoading] = useState(false);
  const { user } = useAuth();

  // Merge seed + AI questions for the current module
  const all = useMemo(() => [...seed, ...aiBank], [seed, aiBank]);
  const filtered = useMemo(() => all.filter(q => q.difficulty === difficulty), [all, difficulty]);
  const cur = filtered[idx] || filtered[0];

  // Load AI bank on mount and when module changes
  useEffect(() => {
    api.get(`/questions/${moduleKey}`).then(({ data }) => {
      const mapped = (data.questions || []).map(q => ({ ...q, module: moduleKey }));
      setAiBank(mapped);
    }).catch(() => {});
  }, [moduleKey]);

  const onDifficulty = (d) => { setDifficulty(d); setIdx(0); };

  const markSolved = useCallback((q) => {
    setSolved(s => {
      const n = new Set(s); n.add(q.id); return n;
    });
    // upgrade nudge every 5 correct
    if ((solved.size + 1) % 5 === 0) {
      setTimeout(() => setUpgradeOpen(true), 800);
    }
    // adaptive difficulty streak
    const streak = loadStreak(moduleKey, difficulty);
    streak.correct = (streak.correct || 0) + 1;
    if (streak.correct >= ADAPTIVE_THRESHOLD && !streak.suggested && NEXT_DIFFICULTY[difficulty]) {
      streak.suggested = true;
      const next = NEXT_DIFFICULTY[difficulty];
      toast.success(`🚀 ${streak.correct} in a row — ready for ${next}?`, {
        action: { label: `Go ${next}`, onClick: () => { setDifficulty(next); setIdx(0); } },
        duration: 8000,
      });
    }
    saveStreak(moduleKey, difficulty, streak);
  }, [solved, moduleKey, difficulty]);

  const generateMore = async () => {
    if (!user) {
      toast.error("Sign in to grow the question bank with AI");
      return;
    }
    setGenLoading(true);
    try {
      const { data } = await api.post("/ai/generate-question", {
        module: moduleKey,
        difficulty,
        count: 3,
      });
      const added = (data.generated || []).map(q => ({ ...q, module: moduleKey }));
      setAiBank(prev => {
        const ids = new Set(prev.map(p => p.id));
        return [...prev, ...added.filter(a => !ids.has(a.id))];
      });
      toast.success(`+${added.length} fresh AI ${difficulty} questions added.`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "AI generation failed");
    } finally {
      setGenLoading(false);
    }
  };

  const lockedCount = module.total - filtered.length;
  const aiCountForDiff = aiBank.filter(q => q.difficulty === difficulty).length;

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
          <div className="text-xs uppercase tracking-widest text-slate-500">Solved this session</div>
          <div className="font-mono-editor text-2xl">{solved.size} / {all.length}</div>
          <Progress value={all.length ? (solved.size / all.length) * 100 : 0} className="w-40 h-1.5 mt-2" data-testid="module-progress" />
        </div>
      </div>

      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <DifficultySelector value={difficulty} onChange={onDifficulty} />
        <Button
          onClick={generateMore}
          disabled={genLoading}
          data-testid="ai-generate-btn"
          className="ml-auto rounded-full bg-gradient-to-r from-[#00D4FF] to-[#00FF88] text-[#0D1117] hover:opacity-90 font-medium"
        >
          {genLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Grow bank with AI (+3)
        </Button>
      </div>

      {renderEmbed && <div className="mb-6">{renderEmbed()}</div>}

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <aside className="rounded-lg border border-white/10 bg-[#151B23] p-3 max-h-[75vh] overflow-y-auto" data-testid="questions-sidebar">
          <div className="text-xs uppercase tracking-widest text-slate-500 px-2 py-2 flex items-center justify-between">
            <span>{filtered.length} available</span>
            {aiCountForDiff > 0 && (
              <span className="flex items-center gap-1 text-[#00D4FF]"><Sparkles className="w-3 h-3" /> +{aiCountForDiff} AI</span>
            )}
          </div>
          {filtered.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setIdx(i)}
              data-testid={`q-list-item-${q.id}`}
              className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-md text-sm transition-colors ${i === idx ? "bg-[#00D4FF]/10 text-white" : "hover:bg-white/5 text-slate-300"}`}
            >
              <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-mono-editor ${solved.has(q.id) ? "bg-[#00FF88] text-[#0D1117]" : q.source === "ai" ? "bg-[#00D4FF]/20 text-[#00D4FF]" : "bg-white/5 text-slate-400"}`}>
                {solved.has(q.id) ? "✓" : q.source === "ai" ? "★" : (i+1)}
              </span>
              <span className="truncate">{q.title}</span>
            </button>
          ))}

          {/* Locked previews */}
          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="text-[10px] uppercase tracking-widest text-yellow-400 px-2 mb-2 flex items-center gap-1">
              <Crown className="w-3 h-3" /> Premium bank
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
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

        <div className="relative min-h-[400px]">
          {cur ? render(cur, markSolved) : (
            <div className="p-8 rounded-lg border border-white/10 bg-[#151B23] text-slate-400">
              No questions in this difficulty yet. Try “Grow bank with AI”.
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <Button variant="outline" onClick={() => setIdx(i => Math.max(0, i-1))} disabled={idx === 0} className="rounded-full border-white/15 bg-transparent" data-testid="prev-q-btn">
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <div className="text-sm text-slate-500 font-mono-editor">Question {Math.min(idx+1, filtered.length)} of {filtered.length}</div>
            <Button onClick={() => setIdx(i => Math.min(filtered.length-1, i+1))} disabled={idx >= filtered.length-1} className="rounded-full bg-[#00D4FF] text-[#0D1117] hover:bg-[#33DDFF] font-medium" data-testid="next-q-btn">
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="mt-8 h-24 rounded-md border border-dashed border-white/15 bg-[#151B23]/40 flex items-center justify-center text-xs text-slate-500" data-testid="adsense-module-placeholder">
            AdSense placeholder — inline banner
          </div>
        </div>
      </div>

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
