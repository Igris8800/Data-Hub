import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Trophy, Flame, Zap } from "lucide-react";

export default function Leaderboard() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/leaderboard").then(({ data }) => setRows(data)).finally(() => setLoading(false));
  }, []);
  const anon = (n) => n.split(" ")[0]?.charAt(0).toUpperCase() + n.split(" ")[0]?.slice(1);

  return (
    <div className="max-w-3xl mx-auto px-6 py-4">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.2em] text-[#00D4FF] mb-2 flex items-center gap-2"><Trophy className="w-4 h-4" /> Weekly leaderboard</div>
        <h1 className="font-heading text-4xl sm:text-5xl tracking-tighter leading-none">Top analysts.</h1>
        <p className="text-slate-400 mt-2">Anonymous. Top-20 by XP.</p>
      </div>

      {loading && <div className="text-slate-500">Loading…</div>}
      {!loading && rows.length === 0 && <div className="text-slate-500">No entries yet — be the first!</div>}
      <div className="rounded-lg border border-white/10 bg-[#151B23] overflow-hidden" data-testid="leaderboard-table">
        {rows.map((r, i) => (
          <div key={i} className={`flex items-center gap-4 px-5 py-3 border-b border-white/5 ${i < 3 ? "bg-white/[0.02]" : ""}`}>
            <div className={`w-8 text-center font-heading font-bold ${i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-slate-500"}`}>
              #{r.rank}
            </div>
            <div className="flex-1">
              <div className="text-slate-200 font-medium">{anon(r.name)}***</div>
              <div className="text-xs text-slate-500">{r.level}</div>
            </div>
            <div className="flex items-center gap-1 text-[#00D4FF] text-sm"><Zap className="w-3.5 h-3.5" /> {r.xp}</div>
            <div className="flex items-center gap-1 text-[#00FF88] text-sm"><Flame className="w-3.5 h-3.5" /> {r.streak}</div>
            <div className="text-xs text-slate-400 w-16 text-right">{r.solved} solved</div>
          </div>
        ))}
      </div>
    </div>
  );
}
