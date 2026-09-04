import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronRight, ChevronLeft, Play, Lightbulb, Eye, BookOpen, Circle, CircleCheck,
  Lock, Crown, HelpCircle, RotateCcw, FunctionSquare, Briefcase, Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import UpgradeModal from "@/components/UpgradeModal";
import { POWERBI_CONCEPTS } from "@/lib/powerbiConcepts";
import { powerbiQuestions } from "@/lib/questions";
import { Link } from "react-router-dom";
import { isQuestionLocked, lockedCount } from "@/lib/premium";
import ModeGuide, { useFirstVisitGuide, ModeGuideButton } from "@/components/ModeGuide";
import { Code2, BarChart3, Check, X, ArrowRight } from "lucide-react";
import BeltBadge from "@/components/BeltBadge";
import { loadWorkspace, saveWorkspace, hydrateFromAttempts, localSolvedSet } from "@/lib/practiceState";
import { tallyAttempts } from "@/lib/belts";

const MODE_META = {
  learning: { color: "#00FF88", label: "Learning", desc: "Sequential · solve to unlock next" },
  practice: { color: "#00D4FF", label: "Practice", desc: "Jump around · hints and solutions" },
  interview: { color: "#FFD166", label: "Interview", desc: "Random order · 5-min timer · no hints or solutions" },
};
const LEVELS = ["beginner", "intermediate", "advanced"];
const LEVEL_LABEL = { beginner: "Easy", intermediate: "Medium", advanced: "Hard" };
const LEVEL_COLOR = { beginner: "#00FF88", intermediate: "#00D4FF", advanced: "#FFD166" };

// ---------- helpers ----------
// All Power BI concept MCQs (legacy hand-written + generated), grouped into one "workbook" per module convention.
const ALL_CONCEPTS = [...powerbiQuestions.filter((q) => q.type === "mcq"), ...POWERBI_CONCEPTS];
const CONCEPT_BANK = [{
  key: "concepts", name: "Power BI Concepts", color: "#F2C811",
  tagline: "DAX · Power Query · Modelling · Visuals · RLS · Service",
  questions: ALL_CONCEPTS.map((q, i) => ({
    id: q.id || `powerbi-x-${i}`, difficulty: q.difficulty, topic: q.topic || "Power BI",
    title: q.title, prompt: q.prompt, options: q.options, answer: q.answer,
    context: `Topic: ${q.topic || "Power BI"}. Choose the best answer.`,
    task: "Select the correct option, then Check answer.",
    hint: q.hint || `Think about ${q.topic || "the concept"}.`, solution: q.solution || `Correct answer: ${q.answer}`,
  })),
}];

function McqPanel({ q, picked, setPicked, result, onCheck, locked }) {
  return (
    <div className="p-5" data-testid="powerbi-mcq">
      <div className="text-[15px] text-slate-100 leading-relaxed mb-4 whitespace-pre-wrap">{q.prompt}</div>
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const chosen = picked === opt;
          const isAnswer = result && opt === q.answer;
          const isWrongPick = result === "wrong" && chosen && opt !== q.answer;
          return (
            <button key={i} disabled={!!result || locked} onClick={() => setPicked(opt)}
              data-testid={`powerbi-option-${i}`}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors flex items-center gap-3 ${
                isAnswer ? "border-[#00FF88]/60 bg-[#00FF88]/10 text-white" :
                isWrongPick ? "border-red-400/60 bg-red-400/10 text-white" :
                chosen ? "border-[#F2C811] bg-[#F2C811]/10 text-white" :
                "border-white/10 bg-[#0D1117] text-slate-300 hover:bg-white/5"}`}>
              <span className={`shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-mono-editor ${chosen || isAnswer ? "border-current" : "border-white/20 text-slate-500"}`}>
                {isAnswer ? <Check className="w-3.5 h-3.5" /> : isWrongPick ? <X className="w-3.5 h-3.5" /> : String.fromCharCode(65 + i)}
              </span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- page ----------
export default function PowerBIPage() {
  const { user, setUser } = useAuth();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const jumpQ = searchParams.get("q");
  const jumpWb = CONCEPT_BANK[0];
  const jumpTarget = jumpQ ? jumpWb.questions.find((q) => q.id === jumpQ) : null;
  const [pending, setPending] = useState(!!jumpTarget);
  const [wbKey, setWbKey] = useState(jumpWb.key);
  const workbook = CONCEPT_BANK[0];

  const [mode, setMode] = useState("practice");
  const [difficulty, setDifficulty] = useState(jumpTarget?.difficulty || "beginner");
  const [idx, setIdx] = useState(0);
  
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState({ text: "Not Started", tone: "muted" });
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [solvedIds, setSolvedIds] = useState(new Set());
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const questions = useMemo(() => {
    const base = workbook.questions.filter((q) => q.difficulty === difficulty);
    if (mode === "interview") {
      const seed = (wbKey + difficulty).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      const rand = (i) => ((seed * 9301 + i * 49297) % 233280) / 233280;
      return base.map((q, i) => ({ q, k: rand(i) })).sort((a, b) => a.k - b.k).map((x) => x.q);
    }
    return base;
  }, [workbook, difficulty, mode]);
  const cur = questions[idx] || questions[0];
  const isLocked = useCallback((i) => isQuestionLocked(i, difficulty, user), [difficulty, user]);
  const curLocked = isLocked(idx);
  const premiumLeft = lockedCount(questions.length, difficulty, user);
  

  useEffect(() => { setIdx(0); }, [wbKey, difficulty, mode]);
  useEffect(() => {
    if (!pending || !jumpTarget) return;
    const i = questions.findIndex((q) => q.id === jumpTarget.id);
    if (i >= 0) { setPending(false); if (isQuestionLocked(i, difficulty, user)) setUpgradeOpen(true); else setIdx(i); }
  }, [questions, pending, jumpTarget, difficulty, user]);
  const [modeGuideOpen, setModeGuideOpen] = useFirstVisitGuide();
  const [tally, setTally] = useState({ beginner: 0, intermediate: 0, advanced: 0 });
  const [interviewSeconds, setInterviewSeconds] = useState(5 * 60);
  const wsKey = cur ? `${wbKey}-${cur.id}` : null;

  // Restore saved answer for this question.
  useEffect(() => {
    const ws = wsKey ? loadWorkspace("powerbi", wsKey) : null;
    setPicked(null); setResult(ws?.solved ? "correct" : null); setShowHint(false); setShowSolution(false);
    setStatus(ws?.solved ? { text: "Solved", tone: "good" } : { text: "Not Started", tone: "muted" });
  }, [cur?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  // Interview timer — 5 min per question, resets on question change
  useEffect(() => {
    if (mode !== "interview") return;
    setInterviewSeconds(5 * 60);
    const t = setInterval(() => {
      setInterviewSeconds((sec) => { if (sec <= 1) { clearInterval(t); toast.error("⏱ Time's up! Move to the next question."); return 0; } return sec - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [cur?.id, mode]);
  useEffect(() => { setSolvedIds(localSolvedSet("powerbi")); }, []);
  useEffect(() => {
    if (!user) return;
    api.get("/progress").then(({ data }) => { const fromServer = hydrateFromAttempts("powerbi", data.attempts); setSolvedIds((prev) => new Set([...prev, ...fromServer])); setTally(tallyAttempts(data.attempts, "powerbi")); }).catch(() => {});
  }, [user?.user_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const jumpTo = (i) => { if (i < 0 || i >= questions.length) return; if (isLocked(i)) { setUpgradeOpen(true); return; } setIdx(i); };
  const goPrev = () => jumpTo(idx - 1);
  const goNext = () => { if (mode === "learning" && cur && !solvedIds.has(cur.id)) { toast.info("📚 Learning Mode — solve this one before moving on."); return; } jumpTo(idx + 1); };

  const check = () => {
    if (curLocked) { setUpgradeOpen(true); return; }
    if (!picked) { toast.error("Pick an answer first"); return; }
    const ok = String(picked).trim() === String(cur.answer).trim();
    setResult(ok ? "correct" : "wrong");
    const prevWs = loadWorkspace("powerbi", wsKey) || {};
    saveWorkspace("powerbi", wsKey, { ...prevWs, picked, solved: ok || !!prevWs.solved });
    if (ok) {
      setStatus({ text: "Correct", tone: "good" });
      setSolvedIds((s2) => { const n = new Set(s2); n.add(cur.id); return n; });
      if (!prevWs.solved) setTally((t) => ({ ...t, [difficulty]: (t[difficulty] || 0) + 1 }));
      toast.success("Correct!");
    } else { setStatus({ text: "Not quite", tone: "bad" }); setShowSolution(true); }
    if (user) { api.post("/progress", { module: "powerbi", question_id: wsKey, correct: ok, difficulty }).then(({ data }) => { if (data?.user) setUser(data.user); }).catch(() => {}); }
  };
  useEffect(() => { const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); check(); } }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }); // eslint-disable-line react-hooks/exhaustive-deps

    const dColor = LEVEL_COLOR[difficulty];
  const mm = String(Math.floor(interviewSeconds / 60)).padStart(2, "0");
  const ss = String(interviewSeconds % 60).padStart(2, "0");

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col bg-[#0D1117]">
      {/* Top bar */}
      <div className="border-b border-white/10 bg-[#0F1520]">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#FFD166] to-[#F58549] flex items-center justify-center text-[#0D1117]"><Code2 className="w-4 h-4" /></div>
            <div><div className="font-heading text-sm tracking-tight">Python Practice</div><div className="text-[10px] text-slate-500">by Data Hub</div></div>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0D1117] border border-white/10" role="tablist" data-testid="powerbi-mode-selector">
            {Object.entries(MODE_META).map(([k, m]) => {
              const Icon = k === "learning" ? BookOpen : k === "practice" ? Play : Briefcase;
              return (
                <button key={k} onClick={() => setMode(k)} data-testid={`powerbi-mode-${k}`} title={m.desc}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${mode === k ? "text-[#0D1117]" : "text-slate-300 hover:text-white hover:bg-white/5"}`}
                  style={mode === k ? { background: m.color } : undefined}>
                  <Icon className="w-4 h-4" /> {m.label}
                </button>
              );
            })}
          </div>
          <div className="ml-auto flex items-center gap-2" data-testid="workbook-selector">
            <ModeGuideButton onClick={() => setModeGuideOpen(true)} />
            {CONCEPT_BANK.map((w) => (
              <button key={w.key} onClick={() => setWbKey(w.key)} data-testid={`powerbi-${w.key}`}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${w.key === wbKey ? "text-white" : "text-slate-400 border-white/5 hover:bg-white/5"}`}
                style={w.key === wbKey ? { borderColor: w.color, background: `${w.color}15` } : undefined}>
                <Code2 className="w-3.5 h-3.5" style={{ color: w.color }} /> {w.name}
                <span className="text-[9px] font-mono-editor px-1.5 py-0.5 rounded bg-white/5">{w.questions.length}Q</span>
              </button>
            ))}
          </div>
        </div>
        {/* Sub-bar */}
        <div className="max-w-[1600px] mx-auto px-4 py-2 border-t border-white/5 flex items-center gap-4 flex-wrap text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs uppercase tracking-widest">Dataset</span>
            <span className="px-2 py-1 rounded-md bg-[#0D1117] border font-mono-editor text-xs" style={{ borderColor: `${workbook.color}55`, color: workbook.color }}>{workbook.name}</span>
            <span className="text-[10px] text-slate-500 font-mono-editor">{Object.keys(workbook.frames).join(" · ")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs uppercase tracking-widest">Level</span>
            <div className="flex gap-1">
              {LEVELS.map((d) => (
                <button key={d} onClick={() => setDifficulty(d)} data-testid={`powerbi-level-${d}`}
                  className={`px-2 py-1 rounded-md text-xs font-medium border transition-colors ${difficulty === d ? "text-[#0D1117]" : "text-slate-300 hover:bg-white/5 border-white/10"}`}
                  style={difficulty === d ? { background: dColor, borderColor: dColor } : {}}>{LEVEL_LABEL[d]}</button>
              ))}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {mode === "interview" && (
              <div className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border font-mono-editor font-medium ${interviewSeconds <= 30 ? "border-red-400/50 bg-red-400/10 text-red-300 animate-pulse" : "border-yellow-400/40 bg-yellow-400/10 text-yellow-300"}`} data-testid="interview-timer">
                <Timer className="w-3.5 h-3.5" /> {mm}:{ss}
              </div>
            )}
            <BeltBadge tally={tally} compact />
            {mode === "learning" && cur && !solvedIds.has(cur.id) && (
              <div className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border border-[#00FF88]/40 bg-[#00FF88]/10 text-[#00FF88] font-medium"><BookOpen className="w-3.5 h-3.5" /> Solve to unlock next</div>
            )}
            <div className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border font-medium ${status.tone === "good" ? "border-[#00FF88]/40 bg-[#00FF88]/10 text-[#00FF88]" : status.tone === "bad" ? "border-red-400/40 bg-red-400/10 text-red-300" : "border-white/10 bg-white/5 text-slate-400"}`} data-testid="powerbi-status-pill">
              {status.tone === "good" ? <CircleCheck className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}{status.text}
            </div>
            <button onClick={goPrev} disabled={idx === 0} className="p-1.5 rounded-md hover:bg-white/5 disabled:opacity-30" data-testid="powerbi-prev"><ChevronLeft className="w-4 h-4" /></button>
            <div className="font-mono-editor text-xs text-slate-300">{idx + 1} / {questions.length}{premiumLeft > 0 && <span className="ml-1.5 text-yellow-300/80 inline-flex items-center gap-0.5"><Lock className="w-3 h-3" />{premiumLeft}</span>}</div>
            <button onClick={goNext} disabled={idx >= questions.length - 1} className="p-1.5 rounded-md hover:bg-white/5 disabled:opacity-30" data-testid="powerbi-next">
              {idx + 1 < questions.length && isLocked(idx + 1) ? <Lock className="w-4 h-4 text-yellow-300" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Question strip */}
      <div className="border-b border-white/5 bg-[#0D1117]">
        <div className="max-w-[1600px] mx-auto px-4 py-1.5 flex items-center gap-1 overflow-x-auto" data-testid="powerbi-question-strip">
          {questions.map((q, i) => {
            const locked = isLocked(i), solved = solvedIds.has(q.id);
            return (
              <button key={q.id} onClick={() => jumpTo(i)} title={locked ? `${q.title} · Premium` : q.title} data-testid={`powerbi-qdot-${i}`}
                className={`shrink-0 h-6 min-w-[24px] px-1 rounded text-[10px] font-mono-editor border ${i === idx ? "border-[#00FF88] text-[#00FF88] bg-[#00FF88]/10" : locked ? "border-yellow-400/30 text-yellow-300/70 bg-yellow-400/5" : solved ? "border-[#00FF88]/40 text-[#00FF88]/80" : "border-white/10 text-slate-400 hover:bg-white/5"}`}>
                {locked ? <Lock className="w-3 h-3 inline" /> : i + 1}
              </button>
            );
          })}
          {premiumLeft > 0 && (
            <button onClick={() => setUpgradeOpen(true)} className="ml-2 shrink-0 inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-[#0D1117] font-semibold" data-testid="powerbi-strip-upgrade"><Crown className="w-3 h-3" /> Unlock {premiumLeft} more</button>
          )}
        </div>
      </div>

      {/* Workbench */}
      <div className="flex-1 flex overflow-hidden max-w-[1600px] w-full mx-auto">
        <div className="flex-1 flex flex-col min-w-0">
          {/* Question */}
          <div className="flex-1 min-h-[320px] bg-[#0D1117] overflow-auto">
            <McqPanel q={cur} picked={picked} setPicked={setPicked} result={result} locked={curLocked} />
            <div className="px-5 pb-5 flex items-center gap-2">
              {!result ? (
                <Button onClick={check} disabled={!picked} data-testid="powerbi-check" className="h-10 rounded-md bg-[#F2C811] text-[#0D1117] hover:bg-[#FADA3C] font-semibold">Check answer <span className="ml-2 text-[10px] opacity-70">Ctrl ⏎</span></Button>
              ) : (
                <Button onClick={() => { setResult(null); setPicked(null); setShowSolution(false); setStatus({ text: "Not Started", tone: "muted" }); }} className="h-10 rounded-md bg-white/10 hover:bg-white/15 font-semibold" data-testid="powerbi-retry">Try again</Button>
              )}
              <Button onClick={goNext} variant="outline" size="sm" className="h-10 border-white/15 bg-transparent hover:bg-white/5">Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
              <Link to="/powerbi/dax" className="ml-auto inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#F2C811] px-3 py-2 rounded-md border border-white/10 hover:border-[#F2C811]/40" data-testid="goto-dax">
                <Code2 className="w-3.5 h-3.5" /> Hands-on DAX Practice <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Challenge panel */}
        <div className="w-[360px] shrink-0 border-l border-white/5 bg-[#0F1520] flex flex-col relative" data-testid="powerbi-challenge-panel">
          <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-widest font-heading font-bold" style={{ color: dColor }}>{LEVEL_LABEL[difficulty]} · {cur.topic}</div>
            <span className="text-[10px] font-mono-editor text-slate-500">{cur.id}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <h2 className="font-heading text-xl tracking-tight">{cur.title}</h2>
            <div><div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Context</div><p className="text-sm text-slate-300 leading-relaxed">{cur.context}</p></div>
            <div className="p-4 rounded-lg border-l-2 bg-[#0D1117]" style={{ borderColor: dColor }}>
              <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: dColor }}>Task</div>
              <p className="text-sm text-white font-medium leading-relaxed">{cur.task}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowHint((v) => !v)} disabled={mode === "interview"} title={mode === "interview" ? "Hints disabled in Interview Mode" : "Show hint"} variant="outline" size="sm" data-testid="powerbi-hint" className="h-8 border-[#00D4FF]/40 bg-[#00D4FF]/5 text-[#00D4FF] hover:bg-[#00D4FF]/10"><Lightbulb className="w-3.5 h-3.5 mr-1" /> Hint</Button>
              <Button onClick={() => setShowSolution((v) => !v)} disabled={mode === "interview"} title={mode === "interview" ? "Solutions disabled in Interview Mode" : "Show solution"} variant="outline" size="sm" data-testid="powerbi-solution" className="h-8 border-yellow-400/40 bg-yellow-400/5 text-yellow-300 hover:bg-yellow-400/10"><Eye className="w-3.5 h-3.5 mr-1" /> Solution</Button>
            </div>
            {showHint && <div className="p-3 rounded-md border border-[#00D4FF]/30 bg-[#00D4FF]/5 text-sm text-slate-200" data-testid="powerbi-hint-panel"><div className="text-[10px] uppercase tracking-widest text-[#00D4FF] mb-1">Hint</div>{cur.hint}</div>}
            {showSolution && <div className="p-3 rounded-md border border-yellow-400/30 bg-yellow-400/5" data-testid="powerbi-solution-panel"><div className="text-[10px] uppercase tracking-widest text-yellow-300 mb-1">Solution</div><pre className="text-[11px] font-mono-editor text-slate-200 whitespace-pre-wrap">{cur.solution}</pre></div>}
          </div>
          {curLocked && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
              <div className="absolute inset-0 backdrop-blur-md bg-[#0D1117]/70" />
              <div className="relative text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center mb-3"><Crown className="w-6 h-6 text-[#0D1117]" /></div>
                <div className="font-heading text-lg text-yellow-300 mb-1">Premium question</div>
                <Button onClick={() => setUpgradeOpen(true)} className="mt-2 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-[#0D1117] font-semibold">Unlock Premium</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#0F1520]">
        <div className="max-w-[1600px] mx-auto px-4 py-2 flex items-center justify-between text-[11px] text-slate-500 font-mono-editor">
          <div className="flex items-center gap-4"><span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#00FF88]" /> {ALL_CONCEPTS.length} concept questions</span></div>
          <div>{user ? <span>Lv <span className="text-slate-300">{user.level}</span> · <span className="text-[#00D4FF]">{user.xp} XP</span></span> : <button onClick={() => nav("/")} className="hover:text-white flex items-center gap-1"><HelpCircle className="w-3 h-3" /> Sign in to save progress</button>}</div>
        </div>
      </div>
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      <ModeGuide open={modeGuideOpen} onOpenChange={setModeGuideOpen} onPick={setMode} />
    </div>
  );
}
