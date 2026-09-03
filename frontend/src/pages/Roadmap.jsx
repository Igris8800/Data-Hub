import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sheet as SheetRoot, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Check, Circle, CircleDot, ExternalLink, Play, RotateCcw, Database, Sheet, Code2, BarChart3, Sigma, ChevronRight, Lock } from "lucide-react";
import { ROADMAPS } from "@/lib/roadmaps";
import { COMPANIES } from "@/lib/companies";
import { EXCEL_WORKBOOKS } from "@/lib/excelTrack";
import { localSolvedSet } from "@/lib/practiceState";
import { BELTS } from "@/lib/belts";

const ICONS = { sql: Database, excel: Sheet, python: Code2, powerbi: BarChart3, stats: Sigma };
const STATUS_KEY = (m) => `dh_roadmap:${m}`;
const STATUSES = ["pending", "learning", "done"];

/** topic -> [{key, id, title, difficulty, company}] for modules that have a question bank */
function buildQuestionIndex(moduleKey) {
  const idx = {};
  const push = (topic, q) => { (idx[topic] = idx[topic] || []).push(q); };
  if (moduleKey === "sql") for (const c of COMPANIES) for (const q of c.questions) if (q.topic) push(q.topic, { key: `${c.key}-${q.id}`, id: q.id, title: q.title, difficulty: q.difficulty, company: c.key, companyName: c.name });
  if (moduleKey === "excel") for (const w of EXCEL_WORKBOOKS) for (const q of w.questions) if (q.topic) push(q.topic, { key: `${w.key}-${q.id}`, id: q.id, title: q.title, difficulty: q.difficulty, company: w.key, companyName: w.name });
  return idx;
}
const loadStatus = (m) => { try { return JSON.parse(localStorage.getItem(STATUS_KEY(m)) || "{}"); } catch { return {}; } };

export default function Roadmap() {
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const moduleKey = ROADMAPS[params.get("m")] ? params.get("m") : "sql";
  const roadmap = ROADMAPS[moduleKey];
  const [status, setStatus] = useState(() => loadStatus(moduleKey));
  const [activeId, setActiveId] = useState(null);
  const [solved, setSolved] = useState(() => localSolvedSet(moduleKey));
  const qIndex = useMemo(() => buildQuestionIndex(moduleKey), [moduleKey]);

  useEffect(() => { setStatus(loadStatus(moduleKey)); setSolved(localSolvedSet(moduleKey)); setActiveId(null); }, [moduleKey]);
  const persist = useCallback((next) => { setStatus(next); try { localStorage.setItem(STATUS_KEY(moduleKey), JSON.stringify(next)); } catch { /* ignore */ } }, [moduleKey]);

  const allNodes = useMemo(() => roadmap.stages.flatMap((s) => s.nodes.map((n) => ({ ...n, stage: s }))), [roadmap]);
  const questionsFor = useCallback((node) => (node.topics || []).flatMap((t) => qIndex[t] || []), [qIndex]);
  const nodeState = useCallback((node) => {
    const qs = questionsFor(node); const done = qs.filter((q) => solved.has(q.key)).length;
    const manual = status[node.id] || "pending";
    const effective = qs.length && done === qs.length ? "done" : manual === "pending" && done > 0 ? "learning" : manual;
    return { qs, done, effective };
  }, [questionsFor, solved, status]);

  const doneCount = allNodes.filter((n) => nodeState(n).effective === "done").length;
  const pct = Math.round((doneCount / allNodes.length) * 100);
  const active = activeId ? allNodes.find((n) => n.id === activeId) : null;
  const cycle = (id) => { const cur = status[id] || "pending"; persist({ ...status, [id]: STATUSES[(STATUSES.indexOf(cur) + 1) % STATUSES.length] }); };
  const setNode = (id, v) => persist({ ...status, [id]: v });
  const beltColor = (name) => BELTS.find((b) => b.name === name)?.color || "#fff";
  const openPractice = (q) => nav(`${roadmap.route}?company=${q.company}&q=${q.id}`);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" data-testid="roadmap-page">
      {/* header */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="uppercase text-[11px] tracking-[0.25em] text-slate-500 mb-2">Roadmaps</div>
          <h1 className="font-heading text-3xl sm:text-4xl tracking-tight">{roadmap.name} roadmap</h1>
          <p className="text-slate-400 text-sm mt-2 max-w-2xl">{roadmap.intro}</p>
        </div>
        <div className="text-right">
          <div className="font-heading text-3xl" style={{ color: roadmap.color }}>{pct}%</div>
          <div className="text-xs text-slate-500">{doneCount} / {allNodes.length} topics done</div>
        </div>
      </div>

      {/* module tabs */}
      <div className="flex gap-2 flex-wrap mb-4" role="tablist" data-testid="roadmap-tabs">
        {Object.values(ROADMAPS).map((r) => { const Icon = ICONS[r.key]; const on = r.key === moduleKey; return (
          <button key={r.key} role="tab" aria-selected={on} onClick={() => setParams({ m: r.key })} data-testid={`roadmap-tab-${r.key}`}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${on ? "text-white" : "text-slate-400 border-white/10 hover:bg-white/5"}`}
            style={on ? { borderColor: r.color, background: `${r.color}15` } : undefined}>
            <Icon className="w-4 h-4" style={{ color: r.color }} /> {r.name}
          </button>
        ); })}
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-3"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: roadmap.color }} /></div>
      <div className="flex items-center gap-4 text-[11px] text-slate-500 mb-10 flex-wrap">
        <span className="inline-flex items-center gap-1.5"><Circle className="w-3 h-3" /> Not started</span>
        <span className="inline-flex items-center gap-1.5"><CircleDot className="w-3 h-3 text-yellow-300" /> Learning</span>
        <span className="inline-flex items-center gap-1.5"><Check className="w-3 h-3 text-[#00FF88]" /> Done</span>
        <span>· Click a topic for details, resources and practice. Topics with linked problems complete themselves when you solve them.</span>
        <button onClick={() => persist({})} className="ml-auto inline-flex items-center gap-1 hover:text-white"><RotateCcw className="w-3 h-3" /> Reset marks</button>
      </div>

      {/* spine */}
      <div className="relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2" style={{ background: `linear-gradient(${roadmap.color}, ${roadmap.color}33)` }} />
        <div className="space-y-14">
          {roadmap.stages.map((stage, si) => {
            const stDone = stage.nodes.filter((n) => nodeState(n).effective === "done").length;
            return (
              <section key={stage.id} className="relative" data-testid={`roadmap-stage-${stage.id}`}>
                {/* stage card on the spine */}
                <div className="relative z-10 mx-auto w-[280px] rounded-xl border bg-[#0F1520] px-4 py-3 text-center shadow-lg" style={{ borderColor: `${roadmap.color}66`, boxShadow: `0 0 0 4px #0D1117, 0 0 24px -8px ${roadmap.color}` }}>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">Stage {si + 1}</div>
                  <div className="font-heading text-lg tracking-tight">{stage.title}</div>
                  <div className="mt-1 inline-flex items-center gap-2 text-[11px] text-slate-400"><span className="w-3 h-3 rounded-sm border border-white/20" style={{ background: beltColor(stage.belt) }} /> {stage.belt} belt · {stDone}/{stage.nodes.length}</div>
                </div>
                {/* child nodes alternate left / right of the spine */}
                <div className="mt-6 grid grid-cols-2 gap-x-16 gap-y-3">
                  {stage.nodes.map((node, ni) => {
                    const { qs, done, effective } = nodeState(node); const left = ni % 2 === 0;
                    return (
                      <div key={node.id} className={`relative flex ${left ? "justify-end col-start-1" : "justify-start col-start-2"}`}>
                        {/* connector to spine */}
                        <span className={`absolute top-1/2 h-px border-t border-dashed ${left ? "right-0 translate-x-full" : "left-0 -translate-x-full"} w-8`} style={{ borderColor: `${roadmap.color}66` }} />
                        <button onClick={() => setActiveId(node.id)} data-testid={`roadmap-node-${node.id}`}
                          className={`w-full max-w-[320px] text-left rounded-lg border px-3 py-2.5 transition-all hover:-translate-y-0.5 ${effective === "done" ? "border-[#00FF88]/50 bg-[#00FF88]/5" : effective === "learning" ? "border-yellow-300/50 bg-yellow-300/5" : "border-white/10 bg-[#0F1520] hover:border-white/25"}`}>
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 shrink-0" onClick={(e) => { e.stopPropagation(); cycle(node.id); }} title="Click to change status">
                              {effective === "done" ? <Check className="w-4 h-4 text-[#00FF88]" /> : effective === "learning" ? <CircleDot className="w-4 h-4 text-yellow-300" /> : <Circle className="w-4 h-4 text-slate-600" />}
                            </span>
                            <div className="min-w-0">
                              <div className="text-sm font-medium leading-snug">{node.title}</div>
                              {qs.length > 0 && <div className="text-[10px] font-mono-editor text-slate-500 mt-0.5">{done}/{qs.length} problems solved</div>}
                            </div>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* detail drawer */}
      <SheetRoot open={!!active} onOpenChange={(v) => !v && setActiveId(null)}>
        <SheetContent className="bg-[#0F1520] border-white/10 text-white w-full sm:max-w-md overflow-y-auto" data-testid="roadmap-drawer">
          {active && (() => { const { qs, done, effective } = nodeState(active); return (
            <>
              <SheetHeader>
                <div className="text-[10px] uppercase tracking-widest" style={{ color: roadmap.color }}>{active.stage.title} · {active.stage.belt} belt</div>
                <SheetTitle className="font-heading text-2xl tracking-tight text-white">{active.title}</SheetTitle>
                <SheetDescription className="text-slate-400">{active.summary}</SheetDescription>
              </SheetHeader>
              <div className="mt-5 space-y-6">
                <div className="flex gap-2" data-testid="roadmap-status-buttons">
                  {STATUSES.map((s) => (
                    <button key={s} onClick={() => setNode(active.id, s)} className={`flex-1 text-xs py-1.5 rounded-md border capitalize ${effective === s ? "border-white/40 bg-white/10 text-white" : "border-white/10 text-slate-400 hover:bg-white/5"}`}>
                      {s === "pending" ? "Not started" : s === "learning" ? "Learning" : "Done"}
                    </button>
                  ))}
                </div>
                {active.points?.length > 0 && (
                  <div><div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Key points</div>
                    <ul className="space-y-1.5 text-sm text-slate-300">{active.points.map((p) => <li key={p} className="flex gap-2"><span style={{ color: roadmap.color }}>•</span><span>{p}</span></li>)}</ul></div>
                )}
                {qs.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2"><div className="text-[10px] uppercase tracking-widest text-slate-500">Practice · {done}/{qs.length} solved</div>
                      <Button size="sm" onClick={() => openPractice(qs.find((q) => !solved.has(q.key)) || qs[0])} className="h-7 rounded-full text-[#0D1117] font-semibold" style={{ background: roadmap.color }} data-testid="roadmap-practice-btn"><Play className="w-3 h-3 mr-1" /> Practice</Button></div>
                    <ul className="space-y-1 max-h-64 overflow-y-auto pr-1">
                      {qs.map((q) => (
                        <li key={q.key}><button onClick={() => openPractice(q)} className="w-full text-left flex items-center gap-2 text-xs px-2 py-1.5 rounded hover:bg-white/5">
                          {solved.has(q.key) ? <Check className="w-3.5 h-3.5 text-[#00FF88] shrink-0" /> : <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                          <span className="flex-1 truncate">{q.title}</span>
                          <span className="text-[9px] uppercase text-slate-500">{q.companyName} · {q.difficulty === "beginner" ? "easy" : q.difficulty === "intermediate" ? "medium" : "hard"}</span>
                          <ChevronRight className="w-3 h-3 text-slate-600" /></button></li>
                      ))}
                    </ul>
                  </div>
                )}
                {qs.length === 0 && <div className="text-xs text-slate-500 flex items-center gap-2"><Lock className="w-3.5 h-3.5" /> No in-browser problems for this topic yet — mark it done when you've covered the resources.</div>}
                {active.resources?.length > 0 && (
                  <div><div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Resources</div>
                    <ul className="space-y-1">{active.resources.map((r) => <li key={r.url}><a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[#00D4FF] hover:underline"><ExternalLink className="w-3.5 h-3.5" /> {r.title}</a></li>)}</ul></div>
                )}
              </div>
            </>
          ); })()}
        </SheetContent>
      </SheetRoot>
    </div>
  );
}
