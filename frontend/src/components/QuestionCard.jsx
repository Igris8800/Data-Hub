import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Check, X, Lightbulb, Play, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";

// Handles: mcq | fill | code (non-SQL/Python) — SQL and Python have their own runners
export default function QuestionCard({ question, onSolved }) {
  const { user, setUser } = useAuth();
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null); // 'correct' | 'wrong' | null
  const [showHint, setShowHint] = useState(false);
  const [showSol, setShowSol] = useState(false);

  useEffect(() => {
    setAnswer("");
    setResult(null);
    setShowHint(false);
    setShowSol(false);
  }, [question.id]);

  const norm = (s) => (s || "").toString().trim().replace(/\s+/g, " ").toLowerCase();

  const submit = async () => {
    if (!answer && question.type !== "mcq") {
      toast.error("Enter your answer first");
      return;
    }
    const correct = norm(answer) === norm(question.answer);
    setResult(correct ? "correct" : "wrong");
    if (correct) {
      toast.success("Correct! +XP");
      onSolved?.(question);
      // sync with backend if logged in
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
      toast.error("Not quite — try again or peek at the hint.");
    }
  };

  return (
    <div className="p-6 rounded-lg border border-white/10 bg-[#151B23]" data-testid={`question-card-${question.id}`}>
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-1">{question.difficulty} · {question.type}</div>
          <h3 className="font-heading text-xl tracking-tight">{question.title}</h3>
        </div>
      </div>

      <p className="text-slate-300 mb-5 leading-relaxed" data-testid="question-prompt">{question.prompt}</p>

      {question.type === "mcq" && (
        <div className="space-y-2 mb-4">
          {question.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => setAnswer(opt)}
              data-testid={`mcq-option-${i}`}
              className={`w-full text-left px-4 py-3 rounded-md border transition-colors text-sm ${answer === opt ? "border-[#00D4FF] bg-[#00D4FF]/5" : "border-white/10 hover:border-white/25 bg-[#0D1117]"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {question.type === "fill" && (
        <Input
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="Type your formula / answer…"
          className="bg-[#0D1117] border-white/10 font-mono-editor mb-4"
          data-testid="fill-input"
        />
      )}

      {question.type === "code" && !question.expectedOutput && !question.expectedRows && (
        <Textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="Write your answer…"
          rows={4}
          className="bg-[#0D1117] border-white/10 font-mono-editor mb-4"
          data-testid="code-input"
        />
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={submit} className="rounded-full bg-[#00FF88] text-[#0D1117] hover:bg-[#33FFA1] font-medium" data-testid="submit-btn">
          <Play className="w-4 h-4 mr-2" /> Check answer
        </Button>
        <Button variant="outline" onClick={() => setShowHint(v => !v)} className="rounded-full border-white/15 bg-transparent" data-testid="hint-btn">
          <Lightbulb className="w-4 h-4 mr-2" /> {showHint ? "Hide hint" : "Hint"}
        </Button>
        <Button variant="ghost" onClick={() => setShowSol(v => !v)} data-testid="solution-btn">
          {showSol ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />} {showSol ? "Hide solution" : "Show solution"}
        </Button>

        {result === "correct" && (
          <div className="ml-auto flex items-center gap-2 text-[#00FF88] font-medium text-sm" data-testid="result-correct">
            <Check className="w-4 h-4" /> Correct
          </div>
        )}
        {result === "wrong" && (
          <div className="ml-auto flex items-center gap-2 text-red-400 font-medium text-sm" data-testid="result-wrong">
            <X className="w-4 h-4" /> Try again
          </div>
        )}
      </div>

      {showHint && (
        <div className="mt-4 p-3 rounded-md border border-white/10 bg-[#0D1117] text-sm text-slate-300" data-testid="hint-panel">
          <span className="text-[#00D4FF] font-medium">Hint · </span>{question.hint}
        </div>
      )}
      {showSol && (
        <div className="mt-3 p-3 rounded-md border border-white/10 bg-[#0D1117] text-sm text-slate-300" data-testid="solution-panel">
          <span className="text-[#00FF88] font-medium">Solution · </span>
          <code className="font-mono-editor">{question.solution}</code>
        </div>
      )}
    </div>
  );
}
