import React from "react";
import { Badge } from "@/components/ui/badge";

const LEVELS = [
  { key: "beginner", label: "Beginner", tint: "text-[#00FF88] border-[#00FF88]/40" },
  { key: "intermediate", label: "Intermediate", tint: "text-[#00D4FF] border-[#00D4FF]/40" },
  { key: "advanced", label: "Advanced", tint: "text-yellow-300 border-yellow-300/40" },
];

export default function DifficultySelector({ value, onChange }) {
  return (
    <div className="flex items-center gap-2 flex-wrap" data-testid="difficulty-selector">
      {LEVELS.map(l => (
        <button
          key={l.key}
          onClick={() => onChange(l.key)}
          data-testid={`difficulty-${l.key}-btn`}
          className={`px-4 py-1.5 rounded-full text-sm border transition-colors font-medium ${l.tint} ${value === l.key ? "bg-white/5" : "opacity-60 hover:opacity-100 hover:bg-white/5"}`}
        >
          {l.label}
          <Badge variant="outline" className="ml-2 text-[10px] py-0 border-white/15 text-slate-400 font-normal">Free</Badge>
        </button>
      ))}
    </div>
  );
}
