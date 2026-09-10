import { useEffect } from "react";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Prominent, always-visible Prev / Next control for the practice pages.
 * Sits at the foot of the challenge panel (right where the task is read) so the learner never has to
 * reach the far top-right corner to move on. Also wires Left / Right arrow keys — ignored while typing
 * in an input, textarea, contenteditable, or a CodeMirror editor so it never fights the code editors.
 */
export default function QuestionNav({ idx, total, onPrev, onNext, nextLocked = false, accent = "#00FF88" }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || t?.isContentEditable || (t?.closest && t.closest(".cm-editor"))) return;
      if (e.key === "ArrowRight") { e.preventDefault(); onNext(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); onPrev(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPrev, onNext]);

  return (
    <div className="shrink-0 border-t border-white/10 bg-[#0F1520] px-3 py-2.5 flex items-center gap-2" data-testid="question-nav">
      <Button variant="outline" onClick={onPrev} disabled={idx === 0}
        className="flex-1 h-10 border-white/15 bg-transparent hover:bg-white/5 text-slate-200 disabled:opacity-30" data-testid="qnav-prev">
        <ChevronLeft className="w-4 h-4 mr-1" /> Prev
      </Button>
      <span className="shrink-0 text-xs font-mono-editor text-slate-400 tabular-nums px-1" aria-live="polite">{idx + 1} / {total}</span>
      <Button onClick={onNext} disabled={idx >= total - 1}
        className="flex-1 h-10 font-semibold text-[#0D1117] hover:opacity-90 disabled:opacity-30" style={{ background: accent }} data-testid="qnav-next"
        title={nextLocked ? "Next question is locked" : "Next question (→)"}>
        {nextLocked ? <Lock className="w-4 h-4 mr-1" /> : null} Next <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}
