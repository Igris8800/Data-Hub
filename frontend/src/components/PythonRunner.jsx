import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play, Loader2, Check, X, Lightbulb, Eye, EyeOff, Terminal } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";

let pyodidePromise = null;
async function getPyodide(setStatus) {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = (async () => {
    setStatus?.("Loading Python runtime (Pyodide)…");
    if (!window.loadPyodide) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js";
        s.onload = resolve; s.onerror = reject;
        document.body.appendChild(s);
      });
    }
    const py = await window.loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/" });
    setStatus?.("Loading pandas + numpy…");
    await py.loadPackage(["pandas", "numpy"]);
    setStatus?.("Ready.");
    return py;
  })();
  return pyodidePromise;
}

export default function PythonRunner({ question, onSolved }) {
  const { user, setUser } = useAuth();
  const [code, setCode] = useState(question.starter || "");
  const [output, setOutput] = useState("");
  const [error, setError] = useState(null);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("Click Run to load Python (first run ≈10MB).");
  const [result, setResult] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showSol, setShowSol] = useState(false);

  useEffect(() => {
    setCode(question.starter || "");
    setOutput("");
    setError(null);
    setResult(null);
    setShowHint(false);
    setShowSol(false);
  }, [question.id]);

  const run = async () => {
    if (!code.trim()) { toast.error("Write some code first"); return; }
    setRunning(true);
    setError(null);
    setOutput("");
    try {
      const py = await getPyodide(setStatus);
      // capture stdout
      py.runPython(`
import sys, io
_buf = io.StringIO()
sys.stdout = _buf
sys.stderr = _buf
`);
      await py.runPythonAsync(code);
      const out = py.runPython("_buf.getvalue()");
      py.runPython("sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__");
      const trimmed = (out || "").trimEnd();
      setOutput(trimmed);
      const correct = trimmed.trim() === (question.expectedOutput || "").trim();
      setResult(correct ? "correct" : "wrong");
      if (correct) {
        toast.success("Correct output!");
        onSolved?.(question);
        if (user) {
          try {
            const { data } = await api.post("/progress", {
              module: question.module,
              question_id: question.id,
              correct: true,
              difficulty: question.difficulty,
            });
            if (data?.user) setUser(data.user);
          } catch (e) { void e; }
        }
      } else {
        toast.error("Output doesn't match expected.");
      }
    } catch (e) {
      setError(e.message || String(e));
      setResult("wrong");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-6 rounded-lg border border-white/10 bg-[#151B23]" data-testid={`py-question-${question.id}`}>
      <div className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-1">{question.difficulty} · Python</div>
      <h3 className="font-heading text-xl tracking-tight mb-2">{question.title}</h3>
      <p className="text-slate-300 mb-2">{question.prompt}</p>

      {question.expectedOutput && (
        <div className="mb-3 text-xs text-slate-400 font-mono-editor">
          Expected output: <span className="text-[#00FF88]">{question.expectedOutput}</span>
        </div>
      )}

      <Textarea
        rows={6}
        value={code}
        onChange={e => setCode(e.target.value)}
        className="bg-[#0D1117] border-white/10 font-mono-editor text-sm mb-3"
        placeholder="print('Hello, Data Hub!')"
        data-testid="py-editor"
      />

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <Button onClick={run} disabled={running} className="rounded-full bg-[#00FF88] text-[#0D1117] hover:bg-[#33FFA1] font-medium" data-testid="py-run-btn">
          {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
          Run
        </Button>
        <Button variant="outline" onClick={() => setShowHint(v=>!v)} className="rounded-full border-white/15 bg-transparent" data-testid="py-hint-btn">
          <Lightbulb className="w-4 h-4 mr-2" /> {showHint ? "Hide hint" : "Hint"}
        </Button>
        <Button variant="ghost" onClick={() => setShowSol(v => !v)} data-testid="py-solution-btn">
          {showSol ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />} {showSol ? "Hide solution" : "Show solution"}
        </Button>
        {result === "correct" && <span className="ml-auto flex items-center gap-2 text-[#00FF88] text-sm font-medium" data-testid="py-correct"><Check className="w-4 h-4" /> Correct</span>}
        {result === "wrong" && <span className="ml-auto flex items-center gap-2 text-red-400 text-sm font-medium" data-testid="py-wrong"><X className="w-4 h-4" /> Not quite</span>}
      </div>

      <div className="rounded-md border border-white/10 bg-[#0D1117] p-3 font-mono-editor text-xs text-slate-300 min-h-[80px]" data-testid="py-output">
        <div className="text-slate-500 flex items-center gap-1 mb-2 text-[10px] uppercase tracking-widest"><Terminal className="w-3 h-3" /> Output</div>
        {running && <div className="text-[#00D4FF]">{status}</div>}
        {!running && !output && !error && <div className="text-slate-500">{status}</div>}
        {output && <pre className="whitespace-pre-wrap text-[#F8FAFC]">{output}</pre>}
        {error && <pre className="whitespace-pre-wrap text-red-400">{error}</pre>}
      </div>

      {showHint && <div className="mt-3 p-3 rounded-md border border-white/10 bg-[#0D1117] text-sm text-slate-300"><span className="text-[#00D4FF] font-medium">Hint · </span>{question.hint}</div>}
      {showSol && <div className="mt-3 p-3 rounded-md border border-white/10 bg-[#0D1117] text-sm text-slate-300 font-mono-editor whitespace-pre-wrap"><span className="text-[#00FF88] font-medium">Solution · </span>{question.solution}</div>}
    </div>
  );
}
