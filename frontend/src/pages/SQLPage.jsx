import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Database, ChevronRight, ChevronDown, Search, Play, Sparkles, Lightbulb,
  Eye, X, Loader2, RotateCcw, ChevronLeft, HelpCircle, BookOpen,
  Briefcase, Circle, CircleCheck, Flag, PanelLeftClose, PanelLeftOpen,
  Table as TableIcon, Download, History, Command as CmdIcon, Timer,
  GitBranch, ExternalLink, KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { COMPANIES, buildSeed } from "@/lib/companies";
import UpgradeModal from "@/components/UpgradeModal";
import SqlEditor from "@/components/SqlEditor";
import CommandPalette from "@/components/CommandPalette";
import ERDModal from "@/components/ERDModal";
import SamplePreviewModal from "@/components/SamplePreviewModal";

// --- SQL.js loader ---
let sqlJsPromise = null;
async function loadSqlJs() {
  if (sqlJsPromise) return sqlJsPromise;
  sqlJsPromise = (async () => {
    if (!window.initSqlJs) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js";
        s.onload = resolve; s.onerror = reject;
        document.body.appendChild(s);
      });
    }
    return await window.initSqlJs({
      locateFile: (f) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${f}`,
    });
  })();
  return sqlJsPromise;
}

const dbCache = {}; // key: companyKey → db instance
async function getDbFor(company) {
  if (dbCache[company.key]) return dbCache[company.key];
  const SQL = await loadSqlJs();
  const db = new SQL.Database();
  db.exec(buildSeed(company));
  dbCache[company.key] = db;
  return db;
}

function formatSql(s) {
  return s
    .replace(/\bselect\b/gi, "SELECT")
    .replace(/\bfrom\b/gi, "FROM")
    .replace(/\bwhere\b/gi, "WHERE")
    .replace(/\bgroup by\b/gi, "GROUP BY")
    .replace(/\border by\b/gi, "ORDER BY")
    .replace(/\bhaving\b/gi, "HAVING")
    .replace(/\bjoin\b/gi, "JOIN")
    .replace(/\bleft\b/gi, "LEFT")
    .replace(/\binner\b/gi, "INNER")
    .replace(/\bon\b/gi, "ON")
    .replace(/\blimit\b/gi, "LIMIT")
    .replace(/,(\S)/g, ", $1");
}

// --- Sub-components ---
const MODE_META = {
  learning:  { color: "#00FF88", tag: "Guided",     desc: "Sequential · hints allowed"        },
  practice:  { color: "#00D4FF", tag: "Free-form",  desc: "Jump around · full toolkit"         },
  interview: { color: "#FFD166", tag: "Timed",      desc: "5-min timer · no hints or solution" },
};

function ModeTab({ active, onClick, icon: Icon, label, testId, mode }) {
  const meta = MODE_META[mode];
  return (
    <button onClick={onClick} data-testid={testId}
      title={meta.desc}
      className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
        active
          ? "text-[#0D1117] shadow-lg"
          : "text-slate-300 hover:text-white hover:bg-white/5"
      }`}
      style={active ? {
        background: meta.color,
        boxShadow: `0 6px 18px -6px ${meta.color}cc`,
      } : undefined}
    >
      <Icon className="w-4 h-4" /> {label}
      {active && <span className="ml-1 hidden lg:inline text-[10px] font-mono-editor opacity-70">· {meta.tag}</span>}
    </button>
  );
}

function TagPill({ tag }) {
  if (!tag) return null;
  const styles = {
    PK: "bg-yellow-400/15 text-yellow-300 border-yellow-400/40",
    FK: "bg-[#00D4FF]/15 text-[#00D4FF] border-[#00D4FF]/40",
  }[tag];
  return <span className={`px-1.5 py-0.5 rounded text-[9px] font-heading font-bold border ${styles}`}>{tag}</span>;
}

function DatabaseSidebar({ company, collapsed, onCollapse, referencedTables, onColumnClick, onTableClick, onPreview }) {
  const [expanded, setExpanded] = useState(() => Object.fromEntries(company.tables.slice(0, 2).map(t => [t.name, true])));
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setExpanded(Object.fromEntries(company.tables.slice(0, 2).map(t => [t.name, true])));
  }, [company.key]);

  const filteredTables = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return company.tables;
    return company.tables
      .map(t => ({ ...t, columns: t.columns.filter(c => c.name.includes(q) || t.name.includes(q)) }))
      .filter(t => t.name.includes(q) || t.columns.length > 0);
  }, [filter, company]);

  if (collapsed) {
    return (
      <div className="w-12 shrink-0 border-r border-white/5 bg-[#0F1520] flex flex-col items-center py-3">
        <button onClick={onCollapse} className="p-2 rounded-md hover:bg-white/5 text-slate-400" data-testid="db-sidebar-expand">
          <PanelLeftOpen className="w-4 h-4" />
        </button>
        <Database className="w-4 h-4 text-slate-500 mt-4" />
      </div>
    );
  }

  return (
    <div className="w-72 shrink-0 border-r border-white/5 bg-[#0F1520] flex flex-col" data-testid="db-sidebar">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: `${company.color}22`, border: `1px solid ${company.color}55` }}>
            <span className="text-sm">{company.logo}</span>
          </div>
          <div>
            <div className="font-heading text-sm tracking-tight">{company.name}</div>
            <div className="text-[10px] text-slate-500 font-mono-editor">{company.tables.length} tables</div>
          </div>
        </div>
        <button onClick={onCollapse} className="p-1.5 rounded-md hover:bg-white/5 text-slate-400" data-testid="db-sidebar-collapse">
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 border-b border-white/5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={filter} onChange={e => setFilter(e.target.value)}
            placeholder="Filter tables or columns"
            className="w-full bg-[#0D1117] border border-white/10 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#00D4FF]/50"
            data-testid="db-filter-input" />
        </div>
      </div>

      <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-slate-500 flex items-center justify-between">
        <span>Tables</span>
        <span className="font-mono-editor">{filteredTables.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {filteredTables.map(t => {
          const isOpen = expanded[t.name] ?? false;
          const isRef = referencedTables.includes(t.name);
          return (
            <div key={t.name} className="mb-1">
              <button
                onClick={() => setExpanded(s => ({ ...s, [t.name]: !s[t.name] }))}
                onDoubleClick={() => onTableClick?.(t.name)}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 text-left group"
                data-testid={`db-table-${t.name}`}
                title="Click to expand · double-click to insert SELECT">
                {isOpen ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
                <TableIcon className="w-3.5 h-3.5" style={{ color: t.color || company.color }} />
                <span className="text-sm text-slate-200 font-mono-editor">{t.name}</span>
                {isRef && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00FF88]" title="Referenced by current challenge" />}
              </button>
              {isOpen && (
                <div className="pl-8 pr-3 pb-2">
                  {isRef && (
                    <div className="text-[9px] uppercase tracking-widest text-[#00FF88] py-1 flex items-center gap-1">
                      <Circle className="w-2 h-2 fill-current" /> Referenced by challenge
                    </div>
                  )}
                  {t.columns.map(c => (
                    <button key={c.name}
                      onClick={() => onColumnClick?.(`${t.name}.${c.name}`)}
                      className="w-full flex items-center gap-2 py-1 text-left hover:bg-white/5 rounded"
                      data-testid={`db-col-${t.name}-${c.name}`}>
                      <span className="text-xs text-slate-300 font-mono-editor flex-1 truncate">{c.name}</span>
                      <TagPill tag={c.tag} />
                      <span className="text-[9px] text-slate-500 font-mono-editor">{c.type}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => onPreview?.(t)}
                    className="mt-2 text-[10px] text-[#00D4FF] hover:underline inline-flex items-center gap-1"
                    data-testid={`db-preview-${t.name}`}>
                    <Eye className="w-3 h-3" /> Preview rows from {t.name} →
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExpectedOutput({ company, question }) {
  const [rows, setRows] = useState(null);
  const [cols, setCols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setErr(null);
    getDbFor(company).then(db => {
      try {
        const r = db.exec(question.answer);
        if (cancelled) return;
        if (r.length) { setCols(r[0].columns); setRows(r[0].values); }
        else { setCols([]); setRows([]); }
      } catch (e) {
        setErr(e.message);
      } finally { if (!cancelled) setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [company.key, question.id, question.answer]);

  return (
    <div className="h-full flex flex-col" data-testid="expected-output-panel">
      <div className="flex-1 overflow-auto">
        {loading && <div className="p-4 text-xs text-slate-500">Computing expected output…</div>}
        {err && <pre className="p-4 text-xs text-red-400 font-mono-editor whitespace-pre-wrap">{err}</pre>}
        {!loading && !err && rows && (
          <table className="text-xs font-mono-editor w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 sticky top-0">
                {cols.map(c => <th key={c} className="text-left px-3 py-1.5 text-[#00FF88] font-semibold">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 50).map((r, i) => (
                <tr key={i} className="border-b border-white/5">
                  {r.map((v, j) => <td key={j} className="px-3 py-1 text-slate-300 whitespace-nowrap">{v == null ? <span className="text-slate-600 italic">NULL</span> : String(v)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// --- Main page ---
export default function SQLPage() {
  const { user, setUser } = useAuth();
  const { theme } = useTheme();
  const nav = useNavigate();

  const [companyKey, setCompanyKey] = useState(COMPANIES[0].key);
  const company = COMPANIES.find(c => c.key === companyKey);
  const [mode, setMode] = useState("practice");
  const [collapsed, setCollapsed] = useState(false);
  const [difficulty, setDifficulty] = useState("beginner");
  const [idx, setIdx] = useState(0);
  const [code, setCode] = useState("");
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState({ text: "Not Started", tone: "muted" });
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [solvedIds, setSolvedIds] = useState(new Set());
  const [dbReady, setDbReady] = useState(false);
  const [outputTab, setOutputTab] = useState("output");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [erdOpen, setErdOpen] = useState(false);
  const [previewTable, setPreviewTable] = useState(null);
  const [history, setHistory] = useState([]);
  const [lastMs, setLastMs] = useState(null);
  const [interviewSeconds, setInterviewSeconds] = useState(5 * 60);

  const questions = useMemo(() => {
    const base = company.questions.filter(q => q.difficulty === difficulty);
    if (mode === "interview") {
      // Deterministic shuffle by company + difficulty so refresh doesn't reroll
      const seed = (company.key + difficulty).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      const rand = (i) => ((seed * 9301 + i * 49297) % 233280) / 233280;
      return base.map((q, i) => ({ q, k: rand(i) })).sort((a, b) => a.k - b.k).map(x => x.q);
    }
    return base;
  }, [company, difficulty, mode]);
  const cur = questions[idx] || company.questions[0];

  useEffect(() => {
    setDbReady(false);
    getDbFor(company).then(() => setDbReady(true)).catch(e => setError(e.message));
  }, [company.key]);

  useEffect(() => {
    setCode(""); setOutput(null); setError(null);
    setShowHint(false); setShowSolution(false);
    setStatus({ text: "Not Started", tone: "muted" });
    setOutputTab("output");
  }, [cur?.id, companyKey]);

  useEffect(() => { setIdx(0); }, [companyKey, difficulty, mode]);

  // Interview timer — 5 min per question, resets on question change
  useEffect(() => {
    if (mode !== "interview") return;
    setInterviewSeconds(5 * 60);
    const t = setInterval(() => {
      setInterviewSeconds(s => {
        if (s <= 1) {
          clearInterval(t);
          toast.error("⏱ Time's up! Move to the next question.");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [mode, cur?.id]);

  // Referenced tables extracted from expected answer for the "referenced" badge
  const referencedTables = useMemo(() => {
    if (!cur?.answer) return [];
    const found = new Set();
    const re = /(?:from|join)\s+([a-z_]+)/gi;
    let m;
    while ((m = re.exec(cur.answer))) found.add(m[1].toLowerCase());
    return [...found];
  }, [cur]);

  const run = async () => {
    if (!code.trim()) { toast.error("Write a query first"); return; }
    setRunning(true); setError(null);
    const t0 = performance.now();
    try {
      const db = await getDbFor(company);
      const res = db.exec(code);
      const gotRows = res[0]?.values || [];
      const gotCols = res[0]?.columns || [];
      const ms = Math.round(performance.now() - t0);
      setLastMs(ms);
      setOutput({ columns: gotCols, values: gotRows });

      const expected = db.exec(cur.answer);
      const expRows = expected[0]?.values || [];
      // Normalise cells so float noise (1.18 vs 118/100) and NULL don't cause false negatives
      const norm = (v) => v == null ? "\u2205" : typeof v === "number" ? String(Math.round(v * 10000) / 10000) : String(v);
      const a = JSON.stringify(gotRows.map(r => r.map(norm)).sort());
      const b = JSON.stringify(expRows.map(r => r.map(norm)).sort());
      const correct = gotRows.length === expRows.length && a === b;

      setHistory(h => [{ sql: code, ms, rows: gotRows.length, ts: Date.now(), ok: correct }, ...h].slice(0, 10));

      if (correct) {
        setStatus({ text: `Solved · ${ms}ms`, tone: "good" });
        setSolvedIds(s => { const n = new Set(s); n.add(cur.id); return n; });
        toast.success("Correct! Query matches expected output.");
        if (user) {
          try {
            const { data } = await api.post("/progress", {
              module: "sql", question_id: `${companyKey}-${cur.id}`,
              correct: true, difficulty,
            });
            if (data?.user) setUser(data.user);
          } catch (e) { void e; }
        }
      } else {
        setStatus({ text: "Wrong output", tone: "bad" });
      }
    } catch (e) {
      const ms = Math.round(performance.now() - t0);
      setLastMs(ms);
      setError(e.message || String(e));
      setStatus({ text: "Query error", tone: "bad" });
      setHistory(h => [{ sql: code, ms, rows: 0, ts: Date.now(), ok: false, err: e.message }, ...h].slice(0, 10));
    } finally { setRunning(false); }
  };

  const insertAtCursor = useCallback((text) => {
    setCode(c => (c && !c.endsWith(" ") && !c.endsWith("\n") ? c + " " : c) + text);
  }, []);

  const insertTableSelect = useCallback((tableName) => {
    setCode(`SELECT * FROM ${tableName};`);
    toast.success(`Loaded template for ${tableName}`);
  }, []);

  const exportCsv = () => {
    if (!output?.values?.length) { toast.error("No results to export"); return; }
    const rows = [output.columns, ...output.values];
    const csv = rows.map(r => r.map(v => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${cur.id || "query"}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  useEffect(() => {
    const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); run(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [code, cur?.id, companyKey]);

  const goPrev = () => setIdx(i => Math.max(0, i - 1));
  const goNext = () => {
    // Learning mode: block if current not solved
    if (mode === "learning" && cur && !solvedIds.has(cur.id)) {
      toast.info("📚 Learning Mode — solve this one before moving on.");
      return;
    }
    setIdx(i => Math.min(questions.length - 1, i + 1));
  };

  const mm = String(Math.floor(interviewSeconds / 60)).padStart(2, "0");
  const ss = String(interviewSeconds % 60).padStart(2, "0");

  const difficultyLabel = { beginner: "EASY", intermediate: "MEDIUM", advanced: "HARD" }[difficulty];
  const difficultyColor = { beginner: "#00FF88", intermediate: "#00D4FF", advanced: "#FFD166" }[difficulty];

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col bg-[#0D1117]">
      {/* Top brand bar */}
      <div className="border-b border-white/10 bg-[#0F1520]">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#00D4FF] to-[#00FF88] flex items-center justify-center text-[#0D1117] font-heading font-bold">S</div>
            <div>
              <div className="font-heading text-sm tracking-tight">SQL Practice</div>
              <div className="text-[10px] text-slate-500">by Data Hub</div>
            </div>
          </div>

          {/* HERO MODE SELECTOR — large, prominent, always visible */}
          <div
            className="flex items-center gap-1 p-1 rounded-lg bg-[#0D1117] border border-white/10"
            data-testid="mode-selector"
            role="tablist"
            aria-label="Practice mode"
          >
            <ModeTab mode="learning"  active={mode === "learning"}  onClick={() => setMode("learning")}  icon={BookOpen}  label="Learning"  testId="mode-learning" />
            <ModeTab mode="practice"  active={mode === "practice"}  onClick={() => setMode("practice")}  icon={Play}      label="Practice"  testId="mode-practice" />
            <ModeTab mode="interview" active={mode === "interview"} onClick={() => setMode("interview")} icon={Briefcase} label="Interview" testId="mode-interview" />
          </div>

          {/* Company selector — pushed to the right */}
          <div className="flex items-center gap-2 flex-wrap ml-auto" data-testid="company-selector">
            {COMPANIES.map(c => {
              const active = c.key === companyKey;
              return (
                <button
                  key={c.key}
                  onClick={() => setCompanyKey(c.key)}
                  data-testid={`company-${c.key}`}
                  title={c.name}
                  className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${active ? "text-white -translate-y-0.5" : "text-slate-400 hover:text-white hover:bg-white/5 border border-white/5"}`}
                  style={active ? {
                    background: `linear-gradient(135deg, ${c.color}22, ${c.color}11)`,
                    border: `1px solid ${c.color}`,
                    boxShadow: `0 0 0 3px ${c.color}22, 0 8px 24px -6px ${c.color}88`,
                  } : undefined}
                >
                  <img
                    src={c.logoUrl}
                    alt={c.name}
                    className={`w-4 h-4 object-contain transition-all ${active ? "" : "opacity-70 grayscale group-hover:grayscale-0"}`}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  <span className={active ? "font-semibold" : ""}>{c.name}</span>
                  <span className={`text-[9px] font-mono-editor px-1.5 py-0.5 rounded ${active ? "bg-white/10 text-white" : "bg-white/5 text-slate-400"}`}>{c.questions.length}Q</span>
                  {active && (
                    <span
                      className="absolute -bottom-1 left-3 right-3 h-0.5 rounded-full"
                      style={{ background: c.color, boxShadow: `0 0 8px ${c.color}` }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode description strip — reinforces what each mode does */}
        <div className="max-w-[1600px] mx-auto px-4 pb-2 -mt-1 flex items-center gap-2 text-[11px]">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-mono-editor"
            style={{
              color: MODE_META[mode].color,
              background: `${MODE_META[mode].color}12`,
              border: `1px solid ${MODE_META[mode].color}40`,
            }}
            data-testid="mode-badge"
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: MODE_META[mode].color }} />
            {mode === "learning" ? "Learning Mode" : mode === "practice" ? "Practice Mode" : "Interview Mode"}
          </span>
          <span className="text-slate-400">{MODE_META[mode].desc}</span>
        </div>

        {/* Sub-bar */}
        <div className="max-w-[1600px] mx-auto px-4 py-2 border-t border-white/5 flex items-center gap-4 flex-wrap text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs uppercase tracking-widest">Schema</span>
            <span className="px-2 py-1 rounded-md bg-[#0D1117] border font-mono-editor text-xs"
                  style={{ borderColor: `${company.color}55`, color: company.color }}>
              {company.name.toLowerCase()}
            </span>
            <span className="text-[10px] text-slate-500 font-mono-editor">{questions.length}Q</span>
            <Button onClick={() => setErdOpen(true)} variant="outline" size="sm" data-testid="btn-erd"
              className="h-7 border-white/15 bg-transparent hover:bg-white/5 ml-1">
              <GitBranch className="w-3.5 h-3.5 mr-1" /> ERD
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs uppercase tracking-widest">Engine</span>
            <span className="px-2 py-1 rounded-md bg-[#0D1117] border border-white/10 font-mono-editor text-xs">SQLite · sql.js</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs uppercase tracking-widest">Level</span>
            <div className="flex gap-1">
              {["beginner", "intermediate", "advanced"].map(d => (
                <button key={d}
                  onClick={() => { setDifficulty(d); setIdx(0); }}
                  data-testid={`level-${d}`}
                  className={`px-2 py-1 rounded-md text-xs font-medium border transition-colors ${difficulty === d ? "text-[#0D1117]" : "text-slate-300 hover:bg-white/5 border-white/10"}`}
                  style={difficulty === d ? { background: difficultyColor, borderColor: difficultyColor } : {}}>
                  {d === "beginner" ? "Easy" : d === "intermediate" ? "Medium" : "Hard"}
                </button>
              ))}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {mode === "interview" && (
              <div
                className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border font-mono-editor font-medium ${interviewSeconds <= 30 ? "border-red-400/50 bg-red-400/10 text-red-300 animate-pulse" : "border-yellow-400/40 bg-yellow-400/10 text-yellow-300"}`}
                data-testid="interview-timer"
                title="Time remaining for this question"
              >
                <Timer className="w-3.5 h-3.5" /> {mm}:{ss}
              </div>
            )}
            {mode === "learning" && cur && !solvedIds.has(cur.id) && (
              <div className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border border-[#00FF88]/40 bg-[#00FF88]/10 text-[#00FF88] font-medium" data-testid="learning-lock">
                <BookOpen className="w-3.5 h-3.5" /> Solve to unlock next
              </div>
            )}
            <div className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border font-medium ${
              status.tone === "good" ? "border-[#00FF88]/40 bg-[#00FF88]/10 text-[#00FF88]" :
              status.tone === "bad"  ? "border-red-400/40 bg-red-400/10 text-red-300" :
              "border-white/10 bg-white/5 text-slate-400"
            }`} data-testid="status-pill">
              {status.tone === "good" ? <CircleCheck className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
              {status.text}
            </div>
            <button onClick={goPrev} disabled={idx === 0} className="p-1.5 rounded-md hover:bg-white/5 disabled:opacity-30" data-testid="btn-prev-q"><ChevronLeft className="w-4 h-4" /></button>
            <div className="font-mono-editor text-xs text-slate-300">{idx + 1} / {questions.length}</div>
            <button onClick={goNext} disabled={idx >= questions.length - 1} className="p-1.5 rounded-md hover:bg-white/5 disabled:opacity-30" data-testid="btn-next-q"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* IDE layout */}
      <div className="flex-1 flex overflow-hidden max-w-[1600px] w-full mx-auto">
        <DatabaseSidebar
          company={company}
          collapsed={collapsed}
          onCollapse={() => setCollapsed(c => !c)}
          referencedTables={referencedTables}
          onColumnClick={insertAtCursor}
          onTableClick={insertTableSelect}
          onPreview={setPreviewTable}
        />

        {/* Center: editor + output */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-2 border-b border-white/5 bg-[#0D1117] flex items-center gap-2 flex-wrap">
            <span className="text-xs font-heading font-semibold text-[#00D4FF] px-2 py-1 rounded-md bg-[#00D4FF]/10">SQL</span>
            <Button onClick={run} disabled={!dbReady || running} data-testid="btn-run"
              className="h-8 rounded-md bg-[#00FF88] text-[#0D1117] hover:bg-[#33FFA1] font-semibold">
              {running ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
              Run <span className="ml-2 text-[10px] opacity-70">Ctrl / ⌘ ⏎</span>
            </Button>
            <Button onClick={() => setCode(c => formatSql(c))} variant="outline" size="sm" data-testid="btn-format"
              className="h-8 border-white/15 bg-transparent hover:bg-white/5">Format</Button>
            <Button onClick={() => setShowHint(v => !v)} variant="outline" size="sm" data-testid="btn-hint"
              disabled={mode === "interview"}
              title={mode === "interview" ? "Hints disabled in Interview Mode" : "Show hint"}
              className="h-8 border-[#00D4FF]/40 bg-[#00D4FF]/5 text-[#00D4FF] hover:bg-[#00D4FF]/10 disabled:opacity-30">
              <Lightbulb className="w-3.5 h-3.5 mr-1" /> Hint
            </Button>
            <Button onClick={() => setPaletteOpen(true)} variant="outline" size="sm" data-testid="btn-palette"
              className="h-8 border-white/15 bg-transparent hover:bg-white/5 gap-1.5">
              <CmdIcon className="w-3.5 h-3.5" />
              <kbd className="text-[10px] font-mono-editor bg-white/5 border border-white/10 px-1 py-0 rounded">K</kbd>
            </Button>
            <Button onClick={() => setShowSolution(v => !v)} variant="outline" size="sm" data-testid="btn-solution"
              disabled={mode === "interview"}
              title={mode === "interview" ? "Solutions disabled in Interview Mode" : "Show solution"}
              className="h-8 border-yellow-400/40 bg-yellow-400/5 text-yellow-300 hover:bg-yellow-400/10 ml-auto disabled:opacity-30">
              <Eye className="w-3.5 h-3.5 mr-1" /> Solution
            </Button>
          </div>

          <div className="relative flex-1 min-h-[240px] bg-[#0D1117] border-b border-white/5 overflow-hidden">
            <SqlEditor value={code} onChange={setCode} onRun={run} theme={theme}
              placeholder={`-- ${company.name} challenge · ${cur?.title}\n-- Referenced tables: ${referencedTables.join(", ") || "(auto)"}`} />
          </div>

          <div className="flex-1 min-h-[220px] bg-[#0F1520] flex flex-col">
            <div className="px-4 py-2 border-b border-white/5 flex items-center gap-4">
              <button onClick={() => setOutputTab("output")}
                className={`text-xs font-semibold pb-1 border-b-2 ${outputTab === "output" ? "text-[#00D4FF] border-[#00D4FF]" : "text-slate-400 border-transparent"}`}
                data-testid="tab-data-output">
                Data Output {output && <span className="ml-1 font-mono-editor text-[10px]">{output.values.length}</span>}
              </button>
              <button onClick={() => setOutputTab("expected")}
                className={`text-xs font-semibold pb-1 border-b-2 ${outputTab === "expected" ? "text-[#00FF88] border-[#00FF88]" : "text-slate-400 border-transparent"}`}
                data-testid="tab-expected-output">
                Expected Output
              </button>
              <button onClick={() => setOutputTab("history")}
                className={`text-xs font-semibold pb-1 border-b-2 flex items-center gap-1 ${outputTab === "history" ? "text-yellow-300 border-yellow-300" : "text-slate-400 border-transparent"}`}
                data-testid="tab-history">
                <History className="w-3 h-3" /> History {history.length > 0 && <span className="ml-1 font-mono-editor text-[10px]">{history.length}</span>}
              </button>

              <div className="ml-auto flex items-center gap-3 text-[10px] font-mono-editor text-slate-500">
                {lastMs != null && (<span className="inline-flex items-center gap-1" data-testid="query-timer"><Timer className="w-3 h-3" /> {lastMs} ms</span>)}
                <span>{solvedIds.size} / {questions.length} solved</span>
                <button onClick={exportCsv} disabled={!output?.values?.length}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded border border-white/10 hover:bg-white/5 disabled:opacity-40"
                  data-testid="btn-export-csv" title="Export CSV">
                  <Download className="w-3 h-3" /> CSV
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {outputTab === "expected" && <ExpectedOutput company={company} question={cur} />}
              {outputTab === "history" && (
                <div className="p-3 space-y-2" data-testid="history-list">
                  {history.length === 0 && <div className="py-8 text-center text-xs text-slate-500">No queries yet — press Run.</div>}
                  {history.map((h, i) => (
                    <button key={i} onClick={() => { setCode(h.sql); setOutputTab("output"); }}
                      className="w-full text-left rounded-md border border-white/5 hover:border-white/15 bg-[#0D1117] p-3 group"
                      data-testid={`history-item-${i}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${h.ok ? "bg-[#00FF88]" : "bg-red-400"}`} />
                        <span className="text-[10px] font-mono-editor text-slate-500">{new Date(h.ts).toLocaleTimeString()}</span>
                        <span className="ml-auto text-[10px] font-mono-editor text-slate-500">{h.rows} rows · {h.ms} ms</span>
                      </div>
                      <pre className="text-xs font-mono-editor text-slate-300 truncate group-hover:whitespace-pre-wrap">{h.sql}</pre>
                    </button>
                  ))}
                </div>
              )}
              {outputTab === "output" && (
                <>
                  {error && <pre className="p-4 text-xs text-red-400 font-mono-editor whitespace-pre-wrap" data-testid="query-error">{error}</pre>}
                  {!error && !output && (
                    <div className="p-6 text-center text-slate-500 text-xs" data-testid="no-results">
                      <div className="w-10 h-10 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-3">
                        <Play className="w-4 h-4" />
                      </div>
                      No results yet — write a query and press <span className="font-mono-editor text-[#00D4FF]">Ctrl / ⌘ ⏎</span> to run.
                    </div>
                  )}
                  {!error && output && (
                    <table className="text-xs font-mono-editor w-full">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5 sticky top-0">
                          {output.columns.map(c => <th key={c} className="text-left px-3 py-1.5 text-[#00D4FF] font-semibold">{c}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {output.values.slice(0, 200).map((r, i) => (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03]">
                            {r.map((v, j) => <td key={j} className="px-3 py-1 text-slate-300 whitespace-nowrap">{v == null ? <span className="text-slate-600 italic">NULL</span> : String(v)}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Challenge panel — CONTEXT / TASK / OUTPUT / RULES */}
        <div className="w-[360px] shrink-0 border-l border-white/5 bg-[#0F1520] flex flex-col" data-testid="challenge-panel">
          <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-widest font-heading font-bold" style={{ color: difficultyColor }}>
              {difficultyLabel} · {company.name}
            </div>
            <span className="text-[10px] font-mono-editor text-slate-500">{cur.id}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <h2 className="font-heading text-xl tracking-tight mb-4">{cur.title}</h2>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              {referencedTables.map(t => (
                <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-white/10 bg-[#0D1117] text-[10px] font-mono-editor text-slate-300">
                  <TableIcon className="w-3 h-3" style={{ color: company.color }} /> {t}
                </span>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Context</div>
                <p className="text-sm text-slate-300 leading-relaxed">{cur.context}</p>
              </div>

              <div className="p-4 rounded-lg border-l-2 bg-[#0D1117]" style={{ borderColor: difficultyColor }}>
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: difficultyColor }}>Task</div>
                <p className="text-sm text-white font-medium leading-relaxed">{cur.task}</p>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Required output</div>
                <div className="p-2.5 rounded-md bg-[#0D1117] border border-white/10 font-mono-editor text-xs text-[#00FF88]">
                  {cur.output}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Rules</div>
                <p className="text-xs text-slate-400 leading-relaxed">{cur.rules}</p>
              </div>

              {showHint && (
                <div className="p-3 rounded-md border border-[#00D4FF]/30 bg-[#00D4FF]/5 text-sm text-slate-200" data-testid="hint-panel">
                  <div className="text-[10px] uppercase tracking-widest text-[#00D4FF] mb-1">Hint</div>
                  {cur.hint}
                </div>
              )}
              {showSolution && (
                <div className="p-3 rounded-md border border-yellow-400/30 bg-yellow-400/5" data-testid="solution-panel">
                  <div className="text-[10px] uppercase tracking-widest text-yellow-300 mb-1">Solution</div>
                  <pre className="text-[11px] font-mono-editor text-slate-200 whitespace-pre-wrap">{cur.solution}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="border-t border-white/10 bg-[#0F1520]">
        <div className="max-w-[1600px] mx-auto px-4 py-2 flex items-center justify-between text-[11px] text-slate-500 font-mono-editor">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${dbReady ? "bg-[#00FF88]" : "bg-slate-500"} ${dbReady ? "pulse-ring" : ""}`} />
              {dbReady ? "Runtime ready" : "Loading engine…"}
            </span>
            <span>SQLite · sql.js</span>
            <span>Database: <span style={{ color: company.color }}>{company.name.toLowerCase()}</span></span>
          </div>
          <div className="flex items-center gap-4">
            {user && <span>Lv <span className="text-slate-300">{user.level}</span> · <span className="text-[#00D4FF]">{user.xp} XP</span></span>}
            {!user && <button onClick={() => nav("/")} className="hover:text-white flex items-center gap-1" data-testid="footer-signin"><HelpCircle className="w-3 h-3" /> Sign in to save progress</button>}
          </div>
        </div>
      </div>

      <ERDModal open={erdOpen} onOpenChange={setErdOpen} company={company} />
      <SamplePreviewModal open={!!previewTable} onOpenChange={(v) => !v && setPreviewTable(null)} table={previewTable} />

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        actions={[
          { id: "run", group: "Editor", label: "Run query", hint: "Ctrl/⌘ ↵", icon: Play, onSelect: run },
          { id: "next", group: "Navigation", label: "Next question", icon: ChevronRight, onSelect: goNext },
          { id: "prev", group: "Navigation", label: "Previous question", icon: ChevronLeft, onSelect: goPrev },
          { id: "erd", group: "Schema", label: `View ${company.name} ERD`, icon: GitBranch, onSelect: () => setErdOpen(true) },
          { id: "hint", group: "Help", label: "Toggle hint", icon: Lightbulb, onSelect: () => setShowHint(v => !v) },
          { id: "solution", group: "Help", label: "Show solution", icon: Eye, onSelect: () => setShowSolution(true) },
          { id: "export-csv", group: "Data", label: "Export results as CSV", icon: Download, onSelect: exportCsv },
          { id: "reset", group: "Editor", label: "Reset editor", icon: RotateCcw, onSelect: () => { setCode(""); setOutput(null); setError(null); setStatus({ text: "Not Started", tone: "muted" }); } },
          ...COMPANIES.map(c => ({ id: `co-${c.key}`, group: "Company", label: `Switch to ${c.name} schema`, icon: KeyRound, onSelect: () => setCompanyKey(c.key) })),
          ...company.tables.map(t => ({ id: `t-${t.name}`, group: "Insert", label: `SELECT * FROM ${t.name};`, icon: TableIcon, onSelect: () => insertTableSelect(t.name) })),
          ...company.tables.map(t => ({ id: `pv-${t.name}`, group: "Preview", label: `Preview rows from ${t.name}`, icon: Eye, onSelect: () => setPreviewTable(t) })),
        ]}
      />

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
