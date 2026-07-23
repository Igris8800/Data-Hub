import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play, Loader2, Check, X, Lightbulb, Eye, EyeOff, Database } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { SQL_SEED } from "@/lib/questions";

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

export default function SQLRunner({ question, onSolved }) {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [output, setOutput] = useState(null);
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showSol, setShowSol] = useState(false);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    setCode("");
    setOutput(null);
    setError(null);
    setResult(null);
    setShowHint(false);
    setShowSol(false);
  }, [question.id]);

  useEffect(() => {
    getDb().then(() => setDbReady(true)).catch(e => setError("Failed to load SQL engine: " + e.message));
  }, []);

  const run = async () => {
    if (!code.trim()) { toast.error("Write a query first"); return; }
    setRunning(true);
    setError(null);
    try {
      const db = await getDb();
      const res = db.exec(code);
      if (res.length === 0) {
        setOutput({ columns: [], values: [] });
      } else {
        setOutput(res[0]);
      }
      // Compare with expected
      const expected = db.exec(question.answer);
      const gotRows = res[0]?.values?.length || 0;
      const expRows = expected[0]?.values?.length || 0;
      // simple correctness: same rows count + same first column length
      let correct = gotRows === expRows;
      if (correct && expected[0]) {
        // Also check value-set match for first N cols
        const a = JSON.stringify(res[0].values.map(r => r.map(String)).sort());
        const b = JSON.stringify(expected[0].values.map(r => r.map(String)).sort());
        correct = a === b;
      }
      setResult(correct ? "correct" : "wrong");
      if (correct) {
        toast.success("Correct! Query matches expected output.");
        onSolved?.(question);
        if (user) {
          try {
            await api.post("/progress", {
              module: question.module,
              question_id: question.id,
              correct: true,
              difficulty: question.difficulty,
            });
          } catch (e) { void e; }
        }
      } else {
        toast.error("Output doesn't match expected result — check hint.");
      }
    } catch (e) {
      setError(e.message || String(e));
      setResult("wrong");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-6 rounded-lg border border-white/10 bg-[#151B23]" data-testid={`sql-question-${question.id}`}>
      <div className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-1">{question.difficulty} · SQL</div>
      <h3 className="font-heading text-xl tracking-tight mb-2">{question.title}</h3>
      <p className="text-slate-300 mb-4">{question.prompt}</p>

      <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
        <Database className="w-3.5 h-3.5" />
        <span>Tables: employees · departments · customers · orders · sales {dbReady ? "· ready" : "· loading…"}</span>
      </div>

      <Textarea
        rows={5}
        value={code}
        onChange={e => setCode(e.target.value)}
        placeholder="SELECT * FROM employees;"
        className="bg-[#0D1117] border-white/10 font-mono-editor text-sm mb-3"
        data-testid="sql-editor"
      />

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <Button onClick={run} disabled={!dbReady || running} className="rounded-full bg-[#00FF88] text-[#0D1117] hover:bg-[#33FFA1] font-medium" data-testid="sql-run-btn">
          {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
          Run query
        </Button>
        <Button variant="outline" onClick={() => setShowHint(v=>!v)} className="rounded-full border-white/15 bg-transparent" data-testid="sql-hint-btn">
          <Lightbulb className="w-4 h-4 mr-2" /> {showHint ? "Hide hint" : "Hint"}
        </Button>
        <Button variant="ghost" onClick={() => setShowSol(v => !v)} data-testid="sql-solution-btn">
          {showSol ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />} {showSol ? "Hide solution" : "Show solution"}
        </Button>
        {result === "correct" && <span className="ml-auto flex items-center gap-2 text-[#00FF88] text-sm font-medium" data-testid="sql-correct"><Check className="w-4 h-4" /> Correct</span>}
        {result === "wrong" && <span className="ml-auto flex items-center gap-2 text-red-400 text-sm font-medium" data-testid="sql-wrong"><X className="w-4 h-4" /> Not quite</span>}
      </div>

      {error && (
        <pre className="text-xs bg-[#0D1117] border border-red-500/30 rounded-md p-3 text-red-400 font-mono-editor overflow-auto" data-testid="sql-error">{error}</pre>
      )}
      {output && !error && (
        <div className="rounded-md border border-white/10 bg-[#0D1117] overflow-auto max-h-64" data-testid="sql-output">
          <table className="text-xs font-mono-editor w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {output.columns.map((c,i) => <th key={i} className="text-left px-3 py-2 text-[#00D4FF]">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {output.values.slice(0, 100).map((r, i) => (
                <tr key={i} className="border-b border-white/5">
                  {r.map((v, j) => <td key={j} className="px-3 py-1.5 text-slate-300">{String(v)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showHint && <div className="mt-3 p-3 rounded-md border border-white/10 bg-[#0D1117] text-sm text-slate-300"><span className="text-[#00D4FF] font-medium">Hint · </span>{question.hint}</div>}
      {showSol && <div className="mt-3 p-3 rounded-md border border-white/10 bg-[#0D1117] text-sm text-slate-300 font-mono-editor"><span className="text-[#00FF88] font-medium">Solution · </span>{question.solution}</div>}
    </div>
  );
}
