import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Sheet, ChevronRight, ChevronLeft, ChevronDown, Play, Lightbulb, Eye, BookOpen, Circle, CircleCheck,
  Lock, Crown, HelpCircle, RotateCcw, FunctionSquare, Briefcase, Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import UpgradeModal from "@/components/UpgradeModal";
import { EXCEL_WORKBOOKS } from "@/lib/excelTrack";
import { evaluate, resultsMatch, buildSheet, serialToISO, indexToCol, colToIndex, FUNCTION_NAMES } from "@/lib/excelEngine";
import { isQuestionLocked, lockedCount } from "@/lib/premium";
import ModeGuide, { useFirstVisitGuide, ModeGuideButton } from "@/components/ModeGuide";
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
function fmtCell(v, type) {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "number") {
    if (type === "date") return serialToISO(v);
    if (type === "money") return v.toFixed(2);
    return Number.isInteger(v) ? String(v) : String(Math.round(v * 1e6) / 1e6);
  }
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  return String(v);
}
function referencedCells(formula) {
  const set = new Set();
  const src = formula.replace(/"[^"]*"/g, "");
  for (const m of src.matchAll(/\$?([A-Z]{1,3})\$?(\d+)(?::\$?([A-Z]{1,3})\$?(\d+))?/gi)) {
    const c1 = colToIndex(m[1]), r1 = +m[2];
    const c2 = m[3] ? colToIndex(m[3]) : c1, r2 = m[4] ? +m[4] : r1;
    for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) set.add(`${indexToCol(c)}${r}`);
  }
  return set;
}

// ---------- spreadsheet grid ----------
function Grid({ workbook, sheet, highlight, onCellClick }) {
  const { cols, rows, typeOf } = useMemo(() => {
    let maxC = 0, maxR = 0; const typeOf = {};
    for (const t of workbook.tables) {
      const a = /^([A-Z]+)(\d+)$/.exec(t.anchor); const c0 = colToIndex(a[1]), r0 = +a[2];
      maxC = Math.max(maxC, c0 + t.headers.length); maxR = Math.max(maxR, r0 + t.rows.length);
      t.headers.forEach((_, i) => { typeOf[indexToCol(c0 + i)] = t.types?.[i]; });
    }
    return { cols: Array.from({ length: maxC + 1 }, (_, i) => indexToCol(i)), rows: Array.from({ length: maxR + 3 }, (_, i) => i + 1), typeOf };
  }, [workbook]);
  const headerCells = useMemo(() => { const s = new Set(); for (const t of workbook.tables) { const a = /^([A-Z]+)(\d+)$/.exec(t.anchor); t.headers.forEach((_, i) => s.add(`${indexToCol(colToIndex(a[1]) + i)}${a[2]}`)); } return s; }, [workbook]);

  return (
    <div className="overflow-auto h-full font-mono-editor text-[11.5px]" data-testid="excel-grid">
      <table className="border-collapse">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className="sticky left-0 z-20 bg-[#151b26] border border-white/10 w-10 text-slate-500 text-[10px]"></th>
            {cols.map((c) => <th key={c} className="bg-[#151b26] border border-white/10 min-w-[92px] px-2 py-1 text-slate-400 font-semibold">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r}>
              <td className="sticky left-0 z-10 bg-[#151b26] border border-white/10 text-center text-slate-500 text-[10px]">{r}</td>
              {cols.map((c) => {
                const key = `${c}${r}`; const v = sheet[key]; const isH = headerCells.has(key); const hl = highlight.has(key);
                const type = isH ? "s" : typeOf[c];
                return (
                  <td key={key} onClick={() => onCellClick?.(key)} title={key}
                    className={`border px-2 py-0.5 whitespace-nowrap cursor-pointer ${hl ? "bg-[#00FF88]/15 border-[#00FF88]/40" : "border-white/5"} ${isH ? "text-[#00FF88] font-semibold bg-white/[0.03]" : typeof v === "number" ? "text-right text-slate-200" : "text-slate-300"}`}>
                    {fmtCell(v, type)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultView({ result }) {
  if (!result) return <div className="p-6 text-center text-slate-500 text-xs">No result yet — type a formula and press Run.</div>;
  if (result.error) return <div className="p-4 text-red-300 font-mono-editor text-sm" data-testid="excel-error">{result.error}</div>;
  const v = result.value;
  if (Array.isArray(v)) {
    return (
      <div className="p-3">
        <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Spilled array · {v.length} × {v[0].length}</div>
        <table className="font-mono-editor text-xs border-collapse">
          <tbody>{v.map((row, i) => <tr key={i}>{row.map((x, j) => <td key={j} className="border border-white/10 px-3 py-1 text-slate-200">{fmtCell(x)}</td>)}</tr>)}</tbody>
        </table>
      </div>
    );
  }
  return <div className="p-4 font-mono-editor text-2xl text-[#00FF88]" data-testid="excel-result">{fmtCell(v)}</div>;
}

// ---------- page ----------
export default function ExcelPage() {
  const { user, setUser } = useAuth();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const jumpQ = searchParams.get("q");
  const jumpWb = EXCEL_WORKBOOKS.find((w) => w.key === searchParams.get("company")) || EXCEL_WORKBOOKS[0];
  const jumpTarget = jumpQ ? jumpWb.questions.find((q) => q.id === jumpQ) : null;
  const [pending, setPending] = useState(!!jumpTarget);
  const [wbKey, setWbKey] = useState(jumpWb.key);
  const workbook = EXCEL_WORKBOOKS.find((w) => w.key === wbKey);
  const sheet = useMemo(() => buildSheet(workbook.tables), [workbook]);
  const [mode, setMode] = useState("practice");
  const [difficulty, setDifficulty] = useState(jumpTarget?.difficulty || "beginner");
  const [idx, setIdx] = useState(0);
  const [formula, setFormula] = useState("=");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState({ text: "Not Started", tone: "muted" });
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [solvedIds, setSolvedIds] = useState(new Set());
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [outputTab, setOutputTab] = useState("output");

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
  const highlight = useMemo(() => referencedCells(formula), [formula]);

  useEffect(() => { setIdx(0); }, [wbKey, difficulty, mode]);
  useEffect(() => {
    if (!pending || !jumpTarget) return;
    const i = questions.findIndex((q) => q.id === jumpTarget.id);
    if (i >= 0) { setPending(false); if (isQuestionLocked(i, difficulty, user)) setUpgradeOpen(true); else setIdx(i); }
  }, [questions, pending, jumpTarget, difficulty, user]);
  const [modeGuideOpen, setModeGuideOpen] = useFirstVisitGuide();
  const [wbMenuOpen, setWbMenuOpen] = useState(false);
  const wbMenuRef = useRef(null);
  useEffect(() => {
    if (!wbMenuOpen) return;
    const onClick = (e) => { if (wbMenuRef.current && !wbMenuRef.current.contains(e.target)) setWbMenuOpen(false); };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [wbMenuOpen]);
  const [tally, setTally] = useState({ beginner: 0, intermediate: 0, advanced: 0 });
  const [interviewSeconds, setInterviewSeconds] = useState(5 * 60);
  const wsKey = cur ? `${wbKey}-${cur.id}` : null;

  // Restore saved formula / result for this question, or start blank.
  useEffect(() => {
    const ws = wsKey ? loadWorkspace("excel", wsKey) : null;
    setFormula(ws?.formula || "="); setResult(ws?.result || null); setShowHint(false); setShowSolution(false);
    setStatus(ws?.solved ? { text: "Solved", tone: "good" } : ws?.formula ? { text: "In progress", tone: "muted" } : { text: "Not Started", tone: "muted" });
    setOutputTab("output");
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
  useEffect(() => { setSolvedIds(localSolvedSet("excel")); }, []);
  useEffect(() => {
    if (!user) return;
    api.get("/progress").then(({ data }) => { const fromServer = hydrateFromAttempts("excel", data.attempts); setSolvedIds((prev) => new Set([...prev, ...fromServer])); setTally(tallyAttempts(data.attempts, "excel")); }).catch(() => {});
  }, [user?.user_id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!wsKey) return;
    const t = setTimeout(() => { const prev = loadWorkspace("excel", wsKey) || {}; if ((prev.formula || "=") !== formula) saveWorkspace("excel", wsKey, { ...prev, formula }); }, 500);
    return () => clearTimeout(t);
  }, [formula, wsKey]);

  const jumpTo = (i) => { if (i < 0 || i >= questions.length) return; if (isLocked(i)) { setUpgradeOpen(true); return; } setIdx(i); };
  const goPrev = () => jumpTo(idx - 1);
  const goNext = () => { if (mode === "learning" && cur && !solvedIds.has(cur.id)) { toast.info("📚 Learning Mode — solve this one before moving on."); return; } jumpTo(idx + 1); };

  const run = async () => {
    if (curLocked) { setUpgradeOpen(true); return; }
    if (!formula.trim() || formula.trim() === "=") { toast.error("Type a formula first"); return; }
    const r = evaluate(formula, sheet); setResult(r);
    if (r.error) { setStatus({ text: `Error ${r.error}`, tone: "bad" }); return; }
    const expected = evaluate(cur.answer, sheet);
    const correct = resultsMatch(r, expected);
    const prevWs = loadWorkspace("excel", wsKey) || {};
    saveWorkspace("excel", wsKey, { ...prevWs, formula, result: r, solved: correct || !!prevWs.solved });
    if (correct) {
      setStatus({ text: "Solved", tone: "good" });
      setSolvedIds((s) => { const n = new Set(s); n.add(cur.id); return n; });
      if (!prevWs.solved) setTally((t) => ({ ...t, [difficulty]: (t[difficulty] || 0) + 1 }));
      toast.success("Correct! Your formula matches the expected result.");
    } else setStatus({ text: "Wrong result", tone: "bad" });
    if (user) { try { const { data } = await api.post("/progress", { module: "excel", question_id: wsKey, correct, difficulty, code: formula }); if (data?.user) setUser(data.user); } catch (e) { void e; } }
  };
  useEffect(() => { const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); run(); } }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }); // eslint-disable-line react-hooks/exhaustive-deps

  const insertRef = (ref) => setFormula((f) => (f === "" ? "=" : f) + ref);
  const dColor = LEVEL_COLOR[difficulty];
  const mm = String(Math.floor(interviewSeconds / 60)).padStart(2, "0");
  const ss = String(interviewSeconds % 60).padStart(2, "0");

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col bg-[#0D1117]">
      {/* Top bar */}
      <div className="border-b border-white/10 bg-[#0F1520]">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#00FF88] to-[#00D4FF] flex items-center justify-center text-[#0D1117]"><Sheet className="w-4 h-4" /></div>
            <div><div className="font-heading text-sm tracking-tight">Excel Practice</div><div className="text-[10px] text-slate-500">by Data Hub</div></div>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0D1117] border border-white/10" role="tablist" data-testid="excel-mode-selector">
            {Object.entries(MODE_META).map(([k, m]) => {
              const Icon = k === "learning" ? BookOpen : k === "practice" ? Play : Briefcase;
              return (
                <button key={k} onClick={() => setMode(k)} data-testid={`excel-mode-${k}`} title={m.desc}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${mode === k ? "text-[#0D1117]" : "text-slate-300 hover:text-white hover:bg-white/5"}`}
                  style={mode === k ? { background: m.color } : undefined}>
                  <Icon className="w-4 h-4" /> {m.label}
                </button>
              );
            })}
          </div>
          <div className="ml-auto flex items-center gap-2" data-testid="workbook-selector">
            <ModeGuideButton onClick={() => setModeGuideOpen(true)} />
            <div className="relative" ref={wbMenuRef}>
              <button onClick={() => setWbMenuOpen((o) => !o)} data-testid="workbook-dropdown" aria-haspopup="listbox" aria-expanded={wbMenuOpen}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border text-white min-w-[210px]"
                style={{ borderColor: `${workbook.color}66`, background: `${workbook.color}12` }}>
                <Sheet className="w-3.5 h-3.5 shrink-0" style={{ color: workbook.color }} />
                <span className="truncate">{workbook.name}</span>
                <span className="text-[9px] font-mono-editor px-1.5 py-0.5 rounded bg-white/5 ml-auto">{workbook.questions.length}Q</span>
                <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${wbMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {wbMenuOpen && (
                <div className="absolute right-0 mt-1 w-[280px] max-h-[60vh] overflow-auto rounded-lg border border-white/10 bg-[#151B23] shadow-xl z-50 p-1" role="listbox" data-testid="workbook-menu">
                  {EXCEL_WORKBOOKS.map((w) => (
                    <button key={w.key} role="option" aria-selected={w.key === wbKey}
                      onClick={() => { setWbKey(w.key); setWbMenuOpen(false); }} data-testid={`workbook-${w.key}`}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-left transition-colors ${w.key === wbKey ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"}`}>
                      <Sheet className="w-3.5 h-3.5 shrink-0" style={{ color: w.color }} />
                      <span className="flex-1 min-w-0"><span className="block truncate font-medium">{w.name}</span>{w.tagline && <span className="block text-[10px] text-slate-500 truncate">{w.tagline}</span>}</span>
                      <span className="text-[9px] font-mono-editor px-1.5 py-0.5 rounded bg-white/5 shrink-0">{w.questions.length}Q</span>
                      {w.key === wbKey && <CircleCheck className="w-3.5 h-3.5 shrink-0" style={{ color: w.color }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Sub-bar */}
        <div className="max-w-[1600px] mx-auto px-4 py-2 border-t border-white/5 flex items-center gap-4 flex-wrap text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs uppercase tracking-widest">Workbook</span>
            <span className="px-2 py-1 rounded-md bg-[#0D1117] border font-mono-editor text-xs" style={{ borderColor: `${workbook.color}55`, color: workbook.color }}>{workbook.name}</span>
            <span className="text-[10px] text-slate-500 font-mono-editor">{workbook.tables.map((t) => t.name).join(" · ")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs uppercase tracking-widest">Level</span>
            <div className="flex gap-1">
              {LEVELS.map((d) => (
                <button key={d} onClick={() => setDifficulty(d)} data-testid={`excel-level-${d}`}
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
            <div className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border font-medium ${status.tone === "good" ? "border-[#00FF88]/40 bg-[#00FF88]/10 text-[#00FF88]" : status.tone === "bad" ? "border-red-400/40 bg-red-400/10 text-red-300" : "border-white/10 bg-white/5 text-slate-400"}`} data-testid="excel-status-pill">
              {status.tone === "good" ? <CircleCheck className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}{status.text}
            </div>
            <button onClick={goPrev} disabled={idx === 0} className="p-1.5 rounded-md hover:bg-white/5 disabled:opacity-30" data-testid="excel-prev"><ChevronLeft className="w-4 h-4" /></button>
            <div className="font-mono-editor text-xs text-slate-300">{idx + 1} / {questions.length}{premiumLeft > 0 && <span className="ml-1.5 text-yellow-300/80 inline-flex items-center gap-0.5"><Lock className="w-3 h-3" />{premiumLeft}</span>}</div>
            <button onClick={goNext} disabled={idx >= questions.length - 1} className="p-1.5 rounded-md hover:bg-white/5 disabled:opacity-30" data-testid="excel-next">
              {idx + 1 < questions.length && isLocked(idx + 1) ? <Lock className="w-4 h-4 text-yellow-300" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Question strip */}
      <div className="border-b border-white/5 bg-[#0D1117]">
        <div className="max-w-[1600px] mx-auto px-4 py-1.5 flex items-center gap-1 overflow-x-auto" data-testid="excel-question-strip">
          {questions.map((q, i) => {
            const locked = isLocked(i), solved = solvedIds.has(q.id);
            return (
              <button key={q.id} onClick={() => jumpTo(i)} title={locked ? `${q.title} · Premium` : q.title} data-testid={`excel-qdot-${i}`}
                className={`shrink-0 h-6 min-w-[24px] px-1 rounded text-[10px] font-mono-editor border ${i === idx ? "border-[#00FF88] text-[#00FF88] bg-[#00FF88]/10" : locked ? "border-yellow-400/30 text-yellow-300/70 bg-yellow-400/5" : solved ? "border-[#00FF88]/40 text-[#00FF88]/80" : "border-white/10 text-slate-400 hover:bg-white/5"}`}>
                {locked ? <Lock className="w-3 h-3 inline" /> : i + 1}
              </button>
            );
          })}
          {premiumLeft > 0 && (
            <button onClick={() => setUpgradeOpen(true)} className="ml-2 shrink-0 inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-[#0D1117] font-semibold" data-testid="excel-strip-upgrade"><Crown className="w-3 h-3" /> Unlock {premiumLeft} more</button>
          )}
        </div>
      </div>

      {/* Workbench */}
      <div className="flex-1 flex overflow-hidden max-w-[1600px] w-full mx-auto">
        <div className="flex-1 flex flex-col min-w-0">
          {/* Formula bar */}
          <div className="px-4 py-2 border-b border-white/5 bg-[#0D1117] flex items-center gap-2">
            <span className="text-xs font-heading font-semibold text-[#00FF88] px-2 py-1 rounded-md bg-[#00FF88]/10">{workbook.answerCell || "fx"}</span>
            <FunctionSquare className="w-4 h-4 text-slate-500" />
            <input value={formula} onChange={(e) => setFormula(e.target.value)} spellCheck={false} data-testid="excel-formula-input"
              placeholder="=SUM(F2:F41)" className="flex-1 bg-[#0F1520] border border-white/10 rounded-md px-3 py-2 font-mono-editor text-sm text-slate-100 focus:outline-none focus:border-[#00FF88]/60" />
            <Button onClick={run} data-testid="excel-run" className="h-9 rounded-md bg-[#00FF88] text-[#0D1117] hover:bg-[#33FFA1] font-semibold"><Play className="w-4 h-4 mr-1" /> Run <span className="ml-2 text-[10px] opacity-70">Ctrl ⏎</span></Button>
            <Button onClick={() => { setFormula("="); setResult(null); setStatus({ text: "Not Started", tone: "muted" }); }} variant="outline" size="sm" className="h-9 border-white/15 bg-transparent hover:bg-white/5" data-testid="excel-reset"><RotateCcw className="w-3.5 h-3.5" /></Button>
          </div>
          {/* Grid */}
          <div className="flex-1 min-h-[300px] bg-[#0D1117] border-b border-white/5 overflow-hidden">
            <Grid workbook={workbook} sheet={sheet} highlight={highlight} onCellClick={insertRef} />
          </div>
          {/* Output */}
          <div className="h-[200px] bg-[#0F1520] flex flex-col">
            <div className="px-4 py-2 border-b border-white/5 flex items-center gap-4">
              <button onClick={() => setOutputTab("output")} className={`text-xs font-semibold pb-1 border-b-2 ${outputTab === "output" ? "text-[#00FF88] border-[#00FF88]" : "text-slate-400 border-transparent"}`} data-testid="excel-tab-output">Result</button>
              <button onClick={() => setOutputTab("expected")} className={`text-xs font-semibold pb-1 border-b-2 ${outputTab === "expected" ? "text-[#00D4FF] border-[#00D4FF]" : "text-slate-400 border-transparent"}`} data-testid="excel-tab-expected">Expected</button>
              <button onClick={() => setOutputTab("functions")} className={`text-xs font-semibold pb-1 border-b-2 ${outputTab === "functions" ? "text-yellow-300 border-yellow-300" : "text-slate-400 border-transparent"}`} data-testid="excel-tab-functions">Functions</button>
              <div className="ml-auto text-[10px] font-mono-editor text-slate-500">{solvedIds.size} / {questions.length} solved · click a cell to insert its reference</div>
            </div>
            <div className="flex-1 overflow-auto">
              {outputTab === "output" && <ResultView result={result} />}
              {outputTab === "expected" && <ResultView result={curLocked ? { error: "Premium" } : { value: cur.expected }} />}
              {outputTab === "functions" && <div className="p-3 flex flex-wrap gap-1">{FUNCTION_NAMES.map((f) => <button key={f} onClick={() => insertRef(f + "(")} className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] font-mono-editor text-slate-300">{f}</button>)}</div>}
            </div>
          </div>
        </div>

        {/* Challenge panel */}
        <div className="w-[360px] shrink-0 border-l border-white/5 bg-[#0F1520] flex flex-col relative" data-testid="excel-challenge-panel">
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
              <Button onClick={() => setShowHint((v) => !v)} disabled={mode === "interview"} title={mode === "interview" ? "Hints disabled in Interview Mode" : "Show hint"} variant="outline" size="sm" data-testid="excel-hint" className="h-8 border-[#00D4FF]/40 bg-[#00D4FF]/5 text-[#00D4FF] hover:bg-[#00D4FF]/10"><Lightbulb className="w-3.5 h-3.5 mr-1" /> Hint</Button>
              <Button onClick={() => setShowSolution((v) => !v)} disabled={mode === "interview"} title={mode === "interview" ? "Solutions disabled in Interview Mode" : "Show solution"} variant="outline" size="sm" data-testid="excel-solution" className="h-8 border-yellow-400/40 bg-yellow-400/5 text-yellow-300 hover:bg-yellow-400/10"><Eye className="w-3.5 h-3.5 mr-1" /> Solution</Button>
            </div>
            {showHint && <div className="p-3 rounded-md border border-[#00D4FF]/30 bg-[#00D4FF]/5 text-sm text-slate-200" data-testid="excel-hint-panel"><div className="text-[10px] uppercase tracking-widest text-[#00D4FF] mb-1">Hint</div>{cur.hint}</div>}
            {showSolution && <div className="p-3 rounded-md border border-yellow-400/30 bg-yellow-400/5" data-testid="excel-solution-panel"><div className="text-[10px] uppercase tracking-widest text-yellow-300 mb-1">Solution</div><pre className="text-[11px] font-mono-editor text-slate-200 whitespace-pre-wrap">{cur.solution}</pre></div>}
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
          <div className="flex items-center gap-4"><span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#00FF88]" /> Formula engine ready</span><span>{FUNCTION_NAMES.length} functions</span></div>
          <div>{user ? <span>Lv <span className="text-slate-300">{user.level}</span> · <span className="text-[#00D4FF]">{user.xp} XP</span></span> : <button onClick={() => nav("/")} className="hover:text-white flex items-center gap-1"><HelpCircle className="w-3 h-3" /> Sign in to save progress</button>}</div>
        </div>
      </div>
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      <ModeGuide open={modeGuideOpen} onOpenChange={setModeGuideOpen} onPick={setMode} />
    </div>
  );
}
