import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sheet, Database, Code2, BarChart3, Sigma, Flame, Zap, Trophy, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MODULES } from "@/lib/questions";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";

const ICONS = { Sheet, Database, Code2, BarChart3, Sigma };

export default function Home() {
  const { user } = useAuth();
  const [progress, setProgress] = useState({});

  useEffect(() => {
    if (!user) return;
    api.get("/progress").then(({ data }) => setProgress(data.modules || {})).catch(()=>{});
  }, [user]);

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.18] mix-blend-screen pointer-events-none"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1750969185331-e03829f72c7d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwzfHxhYnN0cmFjdCUyMGRhdGElMjBuZXR3b3JrJTIwZGFya3xlbnwwfHx8fDE3ODQ3OTUxMTJ8MA&ixlib=rb-4.1.0&q=85')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#00FF88] mb-6" data-testid="hero-eyebrow">
              <Sparkles className="w-3.5 h-3.5" /> 5 modules · 5000+ questions
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tighter leading-[1] mb-6">
              Learn. <span className="text-[#00D4FF]">Practice.</span><br />
              Get Hired as a<br />
              <span className="italic font-light">Data Analyst.</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-lg mb-8 leading-relaxed">
              Master <span className="text-[#00D4FF]">Excel</span>, <span className="text-[#00D4FF]">SQL</span>, <span className="text-[#00D4FF]">Python</span>, <span className="text-[#00D4FF]">Power&nbsp;BI</span> & <span className="text-[#00D4FF]">Statistics</span> with hands-on practice — completely free to start.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/sql">
                <Button className="rounded-full bg-[#00D4FF] text-[#0D1117] hover:bg-[#33DDFF] px-6 h-12 font-medium" data-testid="hero-start-btn">
                  Start Practicing <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/roadmap">
                <Button variant="outline" className="rounded-full border-white/15 bg-transparent px-6 h-12 hover:border-white/40" data-testid="hero-roadmap-btn">
                  90-day Roadmap
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-6 mt-10 text-sm text-slate-400">
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00FF88]" /> Browser-based editors</div>
              <div className="flex items-center gap-2"><Check className="w-4 h-4 text-[#00FF88]" /> No credit card</div>
            </div>
          </div>

          {/* Right column: mini stats card */}
          <div className="hidden md:block relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-[#00D4FF]/20 to-[#00FF88]/10 blur-3xl -z-10" />
            <div className="p-6 rounded-xl border border-white/10 bg-[#151B23]">
              <div className="flex items-center justify-between mb-5">
                <div className="text-xs uppercase tracking-widest text-slate-400">Your dashboard</div>
                {user && <div className="text-xs text-slate-400">Welcome back, <span className="text-white">{user.name.split(" ")[0]}</span></div>}
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Stat icon={<Zap className="w-4 h-4 text-[#00D4FF]" />} label="XP" value={user?.xp ?? 0} />
                <Stat icon={<Flame className="w-4 h-4 text-[#00FF88]" />} label="Streak" value={user?.streak ?? 0} />
                <Stat icon={<Trophy className="w-4 h-4 text-yellow-300" />} label="Solved" value={user?.total_solved ?? 0} />
              </div>
              <div className="space-y-3">
                {MODULES.slice(0, 3).map(m => {
                  const p = progress[m.key]?.solved || 0;
                  const total = 25;
                  return (
                    <div key={m.key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">{m.name}</span>
                        <span className="text-slate-500 font-mono-editor">{p}/{total} free</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (p/total)*100)}%`, background: m.accent }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AdSense banner placeholder */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-20 rounded-md border border-dashed border-white/15 bg-[#151B23]/40 flex items-center justify-center text-xs text-slate-500" data-testid="adsense-hero-placeholder">
          AdSense placeholder — leaderboard banner
        </div>
      </div>

      {/* MODULE GRID (Bento) */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="mb-10 flex items-end justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[#00D4FF] mb-2">Practice modules</div>
            <h2 className="font-heading text-3xl sm:text-4xl tracking-tight">Pick a track. Start solving.</h2>
          </div>
          <Link to="/leaderboard" className="text-sm text-slate-400 hover:text-[#00D4FF] flex items-center gap-2" data-testid="link-leaderboard">
            <Trophy className="w-4 h-4" /> Leaderboard
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-in">
          {MODULES.map((m, idx) => {
            const Icon = ICONS[m.icon] || Sheet;
            const solved = progress[m.key]?.solved || 0;
            const span = idx === 0 || idx === 3 ? "md:col-span-2" : "";
            return (
              <Link
                key={m.key}
                to={`/${m.key === "stats" ? "stats" : m.key === "powerbi" ? "powerbi" : m.key}`}
                data-testid={`module-card-${m.key}`}
                className={`group relative overflow-hidden p-8 rounded-xl border border-white/10 bg-[#151B23] hover:border-white/25 transition-[transform,border-color,background-color] duration-200 hover:-translate-y-1 ${span}`}
              >
                <div className="flex items-start justify-between mb-8">
                  <div
                    className="w-11 h-11 rounded-md flex items-center justify-center"
                    style={{ background: `${m.accent}15`, border: `1px solid ${m.accent}55` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: m.accent }} />
                  </div>
                  <div className="text-right text-xs font-mono-editor text-slate-500">
                    {m.total.toLocaleString()} Qs
                  </div>
                </div>
                <h3 className="font-heading text-2xl tracking-tight mb-1">{m.name}</h3>
                <p className="text-sm text-slate-400 mb-6">{m.tagline}</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Free sample · <span className="text-slate-300">{solved}/25 solved</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="mt-4 h-1 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full" style={{ width: `${(solved/25)*100}%`, background: m.accent }} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* WHY */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-8">
        {[
          { title: "Browser-based practice", desc: "SQL.js and Pyodide run entirely in your browser. Zero setup." },
          { title: "Real interview questions", desc: "Advanced sets drawn from actual company interviews (Google, Amazon, Meta, Flipkart)." },
          { title: "Duolingo-style streaks", desc: "Daily XP, badges and levels — Rookie to Master." },
        ].map((f,i) => (
          <div key={i} className="p-6 rounded-lg border border-white/10 bg-[#151B23]">
            <div className="w-8 h-8 mb-4 rounded-md bg-[#00D4FF]/10 border border-[#00D4FF]/30 flex items-center justify-center text-[#00D4FF] font-mono-editor text-sm">0{i+1}</div>
            <h3 className="font-heading text-lg tracking-tight mb-2">{f.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="p-3 rounded-md bg-[#0D1117] border border-white/5">
      <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">{icon}{label}</div>
      <div className="font-heading text-2xl">{value}</div>
    </div>
  );
}
