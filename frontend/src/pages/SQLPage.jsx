import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Database, ChevronRight, ChevronDown, Search, Play, Sparkles, Lightbulb,
  Eye, Check, X, Loader2, RotateCcw, ChevronLeft, HelpCircle, BookOpen,
  Briefcase, Award, Circle, CircleCheck, Flag, PanelLeftClose, PanelLeftOpen,
  Table as TableIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { sqlQuestions, SQL_SEED } from "@/lib/questions";
import UpgradeModal from "@/components/UpgradeModal";

// --- Database schema metadata (kept in sync with SQL_SEED) ---
const SCHEMA = {
  name: "default",
  engine: "SQLite · sql.js",
  tables: [
    {
      name: "employees",
      referenced: true,
      columns: [
        { name: "id",         type: "INTEGER",     tag: "PK" },
        { name: "name",       type: "TEXT",        tag: null },
        { name: "dept_id",    type: "INTEGER",     tag: "FK" },
        { name: "salary",     type: "INTEGER",     tag: null },
        { name: "hire_date",  type: "DATE",        tag: null },
      ],
    },
    {
      name: "departments",
      columns: [
        { name: "id",   type: "INTEGER", tag: "PK" },
        { name: "name", type: "TEXT",    tag: null },
      ],
    },
    {
      name: "customers",
      columns: [
        { name: "id",          type: "INTEGER", tag: "PK" },
        { name: "name",        type: "TEXT",    tag: null },
        { name: "city",        type: "TEXT",    tag: null },
        { name: "signup_date", type: "DATE",    tag: null },
      ],
    },
    {
      name: "orders",
      columns: [
        { name: "id",          type: "INTEGER", tag: "PK" },
        { name: "customer_id", type: "INTEGER", tag: "FK" },
        { name: "amount",      type: "INTEGER", tag: null },
        { name: "order_date",  type: "DATE",    tag: null },
        { name: "status",      type: "TEXT",    tag: null },
      ],
    },
    {
      name: "sales",
      columns: [
        { name: "id",        type: "INTEGER", tag: "PK" },
        { name: "region",    type: "TEXT",    tag: null },
        { name: "product",   type: "TEXT",    tag: null },
        { name: "amount",    type: "INTEGER", tag: null },
        { name: "sale_date", type: "DATE",    tag: null },
      ],
    },
  ],
};

// --- SQL.js loader (shared cache) ---
let sqlDbPromise = null;
async function getDb() {
  if (sqlDbPromise) return sqlDbPromise;
  sqlDbPromise = (async () => {
    if (!window.initSqlJs) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js";
        s.onload = resolve; s.onerror = reject;
        document.body.appendChild(s);
      });
    }
    const SQL = await window.initSqlJs({
      locateFile: (f) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${f}`,
    });
    const db = new SQL.Database();
    db.exec(SQL_SEED);
    return db;
  })();
  return sqlDbPromise;
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
function ModeTab({ active, onClick, icon: Icon, label, testId }) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${active ? "bg-[#151B23] text-white border border-white/10" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
    >
      <Icon className="w-4 h-4" /> {label}
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

function DatabaseSidebar({ collapsed, onCollapse, referencedTable, onColumnClick }) {
  const [expanded, setExpanded] = useState({ employees: true, departments: true });
  const [filter, setFilter] = useState("");

  const filteredTables = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return SCHEMA.tables;
    return SCHEMA.tables
      .map(t => ({
        ...t,
        columns: t.columns.filter(c => c.name.includes(q) || t.name.includes(q)),
      }))
      .filter(t => t.name.includes(q) || t.columns.length > 0);
  }, [filter]);

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
          <div className="w-7 h-7 rounded-md bg-[#00D4FF]/15 border border-[#00D4FF]/40 flex items-center justify-center">
            <Database className="w-3.5 h-3.5 text-[#00D4FF]" />
          </div>
          <div>
            <div className="font-heading text-sm tracking-tight">Database</div>
            <div className="text-[10px] text-slate-500 font-mono-editor">{SCHEMA.name}</div>
          </div>
        </div>
        <button onClick={onCollapse} className="p-1.5 rounded-md hover:bg-white/5 text-slate-400" data-testid="db-sidebar-collapse">
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 border-b border-white/5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter tables or columns"
            className="w-full bg-[#0D1117] border border-white/10 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#00D4FF]/50"
            data-testid="db-filter-input"
          />
        </div>
      </div>

      <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-slate-500 flex items-center justify-between">
        <span>Tables</span>
        <span className="font-mono-editor">{filteredTables.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {filteredTables.map(t => {
          const isOpen = expanded[t.name] ?? false;
          const isRef = t.name === referencedTable;
          return (
            <div key={t.name} className="mb-1">
              <button
                onClick={() => setExpanded(s => ({ ...s, [t.name]: !s[t.name] }))}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 text-left group"
                data-testid={`db-table-${t.name}`}
              >
                {isOpen ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
                <TableIcon className="w-3.5 h-3.5 text-[#00D4FF]" />
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
                    <button
                      key={c.name}
                      onClick={() => onColumnClick?.(`${t.name}.${c.name}`)}
                      className="w-full flex items-center gap-2 py-1 text-left hover:bg-white/5 rounded"
                      data-testid={`db-col-${t.name}-${c.name}`}
                    >
                      <span className="text-xs text-slate-300 font-mono-editor flex-1 truncate">{c.name}</span>
                      <TagPill tag={c.tag} />
                      <span className="text-[9px] text-slate-500 font-mono-editor">{c.type}</span>
                    </button>
                  ))}
                  <div className="mt-2 text-[10px] text-[#00D4FF] hover:underline cursor-pointer">View sample rows →</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExpectedOutput({ question }) {
  const [rows, setRows] = useState(null);
  const [cols, setCols] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDb().then(db => {
      try {
        const r = db.exec(question.answer);
        if (cancelled) return;
        if (r.length) {
          setCols(r[0].columns);
          setRows(r[0].values);
        } else {
          setCols([]); setRows([]);
        }
      } catch {
        setCols([]); setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [question.id, question.answer]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="text-[#00FF88] font-semibold">Expected Output</span>
          {rows && <span className="font-mono-editor text-[10px] text-slate-500">{rows.length} rows</span>}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {loading && <div className="p-4 text-xs text-slate-500">Computing expected output…</div>}
        {!loading && rows && (
          <table className="text-xs font-mono-editor w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 sticky top-0">
                {cols.map(c => <th key={c} className="text-left px-3 py-1.5 text-[#00FF88] font-semibold">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 50).map((r, i) => (
                <tr key={i} className="border-b border-white/5">
                  {r.map((v, j) => <td key={j} className="px-3 py-1 text-slate-300 whitespace-nowrap">{String(v)}</td>)}
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
  const nav = useNavigate();
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
  const [outputTab, setOutputTab] = useState("output"); // output | expected
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const editorRef = useRef(null);

  const questions = useMemo(() => sqlQuestions.filter(q => q.difficulty === difficulty), [difficulty]);
  const cur = questions[idx];

  useEffect(() => { getDb().then(() => setDbReady(true)).catch(e => setError(e.message)); }, []);
  useEffect(() => {
    setCode("");
    setOutput(null);
    setError(null);
    setShowHint(false);
    setShowSolution(false);
    setStatus({ text: "Not Started", tone: "muted" });
    setOutputTab("output");
  }, [cur?.id]);

  const referencedTable = useMemo(() => {
    const m = cur?.answer?.match(/from\s+([a-z_]+)/i);
    return m?.[1] || null;
  }, [cur]);

  const run = async () => {
    if (!code.trim()) { toast.error("Write a query first"); return; }
    setRunning(true);
    setError(null);
    try {
      const db = await getDb();
      const res = db.exec(code);
      const gotRows = res[0]?.values || [];
      const gotCols = res[0]?.columns || [];
      setOutput({ columns: gotCols, values: gotRows });

      const expected = db.exec(cur.answer);
      const expRows = expected[0]?.values || [];
      const a = JSON.stringify(gotRows.map(r => r.map(String)).sort());
      const b = JSON.stringify(expRows.map(r => r.map(String)).sort());
      const correct = gotRows.length === expRows.length && a === b;

      if (correct) {
        setStatus({ text: "Solved · +XP", tone: "good" });
        setSolvedIds(s => { const n = new Set(s); n.add(cur.id); return n; });
        toast.success("Correct! Query matches expected output.");
        if (user) {
          try {
            const { data } = await api.post("/progress", { module: "sql", question_id: cur.id, correct: true, difficulty });
            if (data?.user) setUser(data.user);
          } catch (e) { void e; }
        }
      } else {
        setStatus({ text: "Wrong output", tone: "bad" });
      }
    } catch (e) {
      setError(e.message || String(e));
      setStatus({ text: "Query error", tone: "bad" });
    } finally {
      setRunning(false);
    }
  };

  const insertAtCursor = useCallback((text) => {
    const el = editorRef.current;
    if (!el) { setCode(c => c + text); return; }
    const start = el.selectionStart ?? code.length;
    const end = el.selectionEnd ?? code.length;
    setCode(code.slice(0, start) + text + code.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + text.length;
    });
  }, [code]);

  // Ctrl/Cmd+Enter to run
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); run(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [code, cur?.id]);

  const goPrev = () => setIdx(i => Math.max(0, i - 1));
  const goNext = () => setIdx(i => Math.min(questions.length - 1, i + 1));

  const difficultyLabel = { beginner: "EASY", intermediate: "MEDIUM", advanced: "HARD" }[difficulty];
  const difficultyColor = { beginner: "#00FF88", intermediate: "#00D4FF", advanced: "#FFD166" }[difficulty];

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col bg-[#0D1117]">
      {/* Sub-header: Mode tabs + question navigator */}
      <div className="border-b border-white/10 bg-[#0F1520]">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 mr-auto">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#00D4FF] to-[#00FF88] flex items-center justify-center text-[#0D1117] font-heading font-bold">S</div>
            <div>
              <div className="font-heading text-sm tracking-tight">SQL Practice</div>
              <div className="text-[10px] text-slate-500">by Data Hub</div>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0D1117] border border-white/5">
            <ModeTab active={mode === "learning"}  onClick={() => setMode("learning")}  icon={BookOpen} label="Learning Mode"  testId="mode-learning" />
            <ModeTab active={mode === "practice"}  onClick={() => setMode("practice")}  icon={Play}     label="Practice Mode"  testId="mode-practice" />
            <ModeTab active={mode === "interview"} onClick={() => setMode("interview")} icon={Briefcase} label="Interview Mode" testId="mode-interview" />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setCode(""); setOutput(null); setError(null); setStatus({ text: "Not Started", tone: "muted" }); }}
            data-testid="btn-reset"
            className="text-slate-400 hover:text-white"
          >
            <RotateCcw className="w-4 h-4 mr-1" /> Reset
          </Button>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 py-2 border-t border-white/5 flex items-center gap-4 flex-wrap text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs uppercase tracking-widest">Schema</span>
            <span className="px-2 py-1 rounded-md bg-[#0D1117] border border-white/10 font-mono-editor text-xs">{SCHEMA.name}</span>
            <span className="text-[10px] text-slate-500 font-mono-editor">{questions.length}Q</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs uppercase tracking-widest">Engine</span>
            <span className="px-2 py-1 rounded-md bg-[#0D1117] border border-white/10 font-mono-editor text-xs">{SCHEMA.engine}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs uppercase tracking-widest">Level</span>
            <div className="flex gap-1">
              {["beginner", "intermediate", "advanced"].map(d => (
                <button
                  key={d}
                  onClick={() => { setDifficulty(d); setIdx(0); }}
                  data-testid={`level-${d}`}
                  className={`px-2 py-1 rounded-md text-xs font-medium border transition-colors ${difficulty === d ? "text-[#0D1117]" : "text-slate-300 hover:bg-white/5 border-white/10"}`}
                  style={difficulty === d ? { background: difficultyColor, borderColor: difficultyColor } : {}}
                >
                  {d === "beginner" ? "Easy" : d === "intermediate" ? "Medium" : "Hard"}
                </button>
              ))}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
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
            <Button onClick={() => setUpgradeOpen(true)} size="sm" className="rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-[#0D1117] hover:from-yellow-300 hover:to-amber-400 font-semibold h-8" data-testid="btn-challenge">
              <Flag className="w-3.5 h-3.5 mr-1" /> Challenge
            </Button>
          </div>
        </div>
      </div>

      {/* IDE 3-column layout */}
      <div className="flex-1 flex overflow-hidden max-w-[1600px] w-full mx-auto">
        <DatabaseSidebar
          collapsed={collapsed}
          onCollapse={() => setCollapsed(c => !c)}
          referencedTable={referencedTable}
          onColumnClick={insertAtCursor}
        />

        {/* Center: editor + output */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Editor toolbar */}
          <div className="px-4 py-2 border-b border-white/5 bg-[#0D1117] flex items-center gap-2 flex-wrap">
            <span className="text-xs font-heading font-semibold text-[#00D4FF] px-2 py-1 rounded-md bg-[#00D4FF]/10">SQL</span>
            <Button onClick={run} disabled={!dbReady || running} data-testid="btn-run"
              className="h-8 rounded-md bg-[#00FF88] text-[#0D1117] hover:bg-[#33FFA1] font-semibold">
              {running ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
              Run <span className="ml-2 text-[10px] opacity-70">Ctrl / ⌘ ⏎</span>
            </Button>
            <Button onClick={() => setCode(c => formatSql(c))} variant="outline" size="sm" data-testid="btn-format"
              className="h-8 border-white/15 bg-transparent hover:bg-white/5">
              Format
            </Button>
            <Button onClick={() => setShowHint(v => !v)} variant="outline" size="sm" data-testid="btn-hint"
              className="h-8 border-[#00D4FF]/40 bg-[#00D4FF]/5 text-[#00D4FF] hover:bg-[#00D4FF]/10">
              <Lightbulb className="w-3.5 h-3.5 mr-1" /> Hint {showHint ? "•" : "1"}
            </Button>
            <Button onClick={() => setShowSolution(v => !v)} variant="outline" size="sm" data-testid="btn-solution"
              className="h-8 border-yellow-400/40 bg-yellow-400/5 text-yellow-300 hover:bg-yellow-400/10 ml-auto">
              <Eye className="w-3.5 h-3.5 mr-1" /> Solution
            </Button>
          </div>

          {/* Editor + gutter */}
          <div className="relative flex-1 min-h-[240px] bg-[#0D1117] border-b border-white/5 flex">
            <div className="w-10 py-3 text-right pr-2 select-none border-r border-white/5 bg-[#0F1520]">
              {Array.from({ length: Math.max(8, code.split("\n").length) }).map((_, i) => (
                <div key={i} className="text-[10px] leading-6 text-slate-600 font-mono-editor">{i + 1}</div>
              ))}
            </div>
            <textarea
              ref={editorRef}
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={`-- Write your query here\nSELECT * FROM ${referencedTable || "employees"};`}
              spellCheck={false}
              className="flex-1 bg-transparent text-slate-100 font-mono-editor text-sm p-3 outline-none resize-none leading-6"
              data-testid="sql-editor"
            />
          </div>

          {/* Data output + Expected output tabs */}
          <div className="flex-1 min-h-[200px] bg-[#0F1520] flex flex-col">
            <div className="px-4 py-2 border-b border-white/5 flex items-center gap-4">
              <button
                onClick={() => setOutputTab("output")}
                className={`text-xs font-semibold pb-1 border-b-2 ${outputTab === "output" ? "text-[#00D4FF] border-[#00D4FF]" : "text-slate-400 border-transparent"}`}
                data-testid="tab-data-output"
              >
                Data Output {output && <span className="ml-1 font-mono-editor text-[10px]">{output.values.length}</span>}
              </button>
              <button
                onClick={() => setOutputTab("expected")}
                className={`text-xs font-semibold pb-1 border-b-2 ${outputTab === "expected" ? "text-[#00FF88] border-[#00FF88]" : "text-slate-400 border-transparent"}`}
                data-testid="tab-expected-output"
              >
                Expected Output
              </button>
              <div className="ml-auto text-[10px] text-slate-500 font-mono-editor">
                {solvedIds.size} / {questions.length} solved
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {outputTab === "expected" ? (
                <ExpectedOutput question={cur} />
              ) : (
                <>
                  {error && (
                    <pre className="p-4 text-xs text-red-400 font-mono-editor whitespace-pre-wrap" data-testid="query-error">{error}</pre>
                  )}
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
                          <tr key={i} className="border-b border-white/5">
                            {r.map((v, j) => <td key={j} className="px-3 py-1 text-slate-300 whitespace-nowrap">{String(v)}</td>)}
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

        {/* Right: Challenge panel */}
        <div className="w-[340px] shrink-0 border-l border-white/5 bg-[#0F1520] flex flex-col" data-testid="challenge-panel">
          <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-widest font-heading font-bold" style={{ color: difficultyColor }}>
              {difficultyLabel} CHALLENGE
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <h2 className="font-heading text-xl tracking-tight mb-3">{cur.title}</h2>
            <div className="mb-4 inline-flex items-center gap-1 px-2 py-1 rounded-md border border-white/10 bg-[#0D1117] text-[10px] uppercase tracking-widest text-slate-400">
              <Circle className="w-2 h-2 fill-[#00D4FF] text-[#00D4FF]" /> {referencedTable || "database"}
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">{cur.prompt}</p>

            <div className="p-4 rounded-lg border-l-2 bg-[#0D1117]" style={{ borderColor: difficultyColor }}>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Question</div>
              <p className="text-sm text-white font-medium leading-relaxed">{cur.prompt}</p>
            </div>

            {showHint && (
              <div className="mt-4 p-3 rounded-md border border-[#00D4FF]/30 bg-[#00D4FF]/5 text-sm text-slate-200" data-testid="hint-panel">
                <div className="text-[10px] uppercase tracking-widest text-[#00D4FF] mb-1">Hint</div>
                {cur.hint}
              </div>
            )}
            {showSolution && (
              <div className="mt-4 p-3 rounded-md border border-yellow-400/30 bg-yellow-400/5" data-testid="solution-panel">
                <div className="text-[10px] uppercase tracking-widest text-yellow-300 mb-1">Solution</div>
                <pre className="text-xs font-mono-editor text-slate-200 whitespace-pre-wrap">{cur.solution}</pre>
              </div>
            )}

            <div className="mt-6 text-xs text-slate-500">
              <div className="uppercase tracking-widest text-[10px] mb-1">Rules</div>
              Do not modify the seed data. Case-insensitive matches. Row order is normalised before comparison.
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
              {dbReady ? "Runtime ready" : "Booting SQL engine…"}
            </span>
            <span>SQLite · sql.js</span>
            <span>Database: {SCHEMA.name}</span>
          </div>
          <div className="flex items-center gap-4">
            {user && <span>Lv <span className="text-slate-300">{user.level}</span> · <span className="text-[#00D4FF]">{user.xp} XP</span></span>}
            {!user && <button onClick={() => nav("/")} className="hover:text-white flex items-center gap-1" data-testid="footer-signin"><HelpCircle className="w-3 h-3" /> Sign in to save progress</button>}
          </div>
        </div>
      </div>

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
