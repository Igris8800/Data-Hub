import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight, Sheet, Database, Code2, BarChart3, Sigma, Flame, Zap, Trophy,
  Sparkles, Check, Star, Mail, Award, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MODULES } from "@/lib/questions";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import AuthModal from "@/components/AuthModal";
import UpgradeModal from "@/components/UpgradeModal";
import { BELTS } from "@/lib/belts";
import { MODE_GUIDE } from "@/components/ModeGuide";
import { toast } from "sonner";

const ICONS = { Sheet, Database, Code2, BarChart3, Sigma };

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
const GOOGLE_AUTH = process.env.REACT_APP_GOOGLE_AUTH === "1";
const startGoogleAuth = () => {
  const redirectUrl = window.location.origin + "/";
  window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
};

const ROLES = ["Data Analyst", "SQL Engineer", "BI Developer", "Python Analyst", "Business Analyst"];

const TRACKS = [
  {
    title: "Become a Data Analyst",
    icon: BarChart3,
    tint: "#00FF88",
    to: "/sql",
    desc: "Structured 90-day path from Excel to SQL to Python to portfolio.",
  },
  {
    title: "Master SQL for interviews",
    icon: Database,
    tint: "#00D4FF",
    to: "/sql",
    desc: "Real interview questions from Google, Amazon, Meta, Flipkart & Swiggy.",
  },
  {
    title: "Statistics fluency",
    icon: Sigma,
    tint: "#B892FF",
    to: "/stats",
    desc: "Master hypothesis testing, regression and A/B testing in bite-sized quizzes.",
  },
];

const FEATURED = [
  { title: "Window functions deep dive", module: "SQL", level: "Advanced", hours: "3 hr", rating: "4.8", by: "Data Hub" },
  { title: "Pandas groupby & pivot", module: "Python", level: "Intermediate", hours: "2 hr", rating: "4.9", by: "Data Hub" },
  { title: "DAX Time Intelligence", module: "Power BI", level: "Advanced", hours: "2 hr", rating: "4.7", by: "Data Hub" },
];

const CATEGORIES = [
  "Artificial Intelligence", "Machine Learning", "Python", "SQL", "ChatGPT",
  "Data Analysis", "Probability & Statistics", "Data Engineering", "Excel",
];

const TECH_LOGOS = [
  { name: "Python", color: "#3776AB", glyph: "py" },
  { name: "SQL", color: "#00D4FF", glyph: "sql" },
  { name: "OpenAI", color: "#10A37F", glyph: "◉" },
  { name: "Claude", color: "#E8A87C", glyph: "✦" },
  { name: "Power BI", color: "#F2C811", glyph: "▢" },
  { name: "R", color: "#276DC3", glyph: "R" },
  { name: "Copilot", color: "#8B5CF6", glyph: "◈" },
  { name: "Databricks", color: "#FF3621", glyph: "▲" },
  { name: "Snowflake", color: "#29B5E8", glyph: "❄" },
  { name: "Excel", color: "#217346", glyph: "X" },
];



const COMPANY_LOGOS = ["Google", "Microsoft", "Amazon", "Flipkart", "Swiggy", "Adobe"];

export default function Home() {
  const { user } = useAuth();
  const [progress, setProgress] = useState({});
  const [roleIdx, setRoleIdx] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setRoleIdx(i => (i + 1) % ROLES.length), 2600);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get("/progress").then(({ data }) => setProgress(data.modules || {})).catch(() => {});
  }, [user]);

  const subscribe = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    try {
      await api.post("/newsletter", { email: newsletterEmail });
      toast.success("You're in! Check your inbox for tips.");
      setNewsletterEmail("");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Try a different email");
    }
  };

  return (
    <div className="min-h-screen">
      {/* HERO — 3-column split */}
      <section className="relative overflow-hidden border-b border-white/5">
        {/* Faint tech grid backdrop */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
             style={{ backgroundImage: "linear-gradient(rgba(0,212,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.6) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

        <div className="relative max-w-7xl mx-auto px-6 py-14 lg:py-20 grid lg:grid-cols-[1.05fr_0.95fr_1fr] gap-8 items-start">
          {/* LEFT — value prop */}
          <div className="pt-4">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#00FF88] mb-6" data-testid="hero-eyebrow">
              <Sparkles className="w-3.5 h-3.5" /> 5,000+ questions · Free to start
            </div>
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-[64px] tracking-tighter leading-[0.98] mb-6">
              Become a
              <br />
              <span className="relative inline-block min-h-[1.1em]">
                {ROLES.map((r, i) => (
                  <span
                    key={r}
                    className={`absolute left-0 top-0 whitespace-nowrap transition-opacity duration-500 ${i === roleIdx ? "opacity-100" : "opacity-0"}`}
                    style={{ color: "#00FF88" }}
                    aria-hidden={i !== roleIdx}
                  >
                    {r}.
                  </span>
                ))}
                {/* placeholder keeps line height */}
                <span className="invisible">{ROLES[0]}.</span>
              </span>
            </h1>
            <p className="text-lg text-slate-300 max-w-md mb-8 leading-relaxed">
              Trusted by <span className="text-white font-semibold">37,000+ learners</span> across India and beyond. Practice hands-on in your browser — no setup, no credit card.
            </p>
            <Button
              onClick={() => nav("/sql")}
              className="rounded-full bg-[#00FF88] text-[#0D1117] hover:bg-[#33FFA1] px-6 h-12 font-semibold text-base"
              data-testid="hero-start-btn"
            >
              Start Learning for Free
            </Button>
            <div className="mt-8 flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-[#FF6B35] flex items-center justify-center text-white font-heading font-bold text-sm">G2</div>
              <div className="flex items-center gap-0.5 text-[#FFC93C]">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <span className="text-sm text-slate-300 font-medium">4.7/5</span>
            </div>
          </div>

          {/* CENTER — Signup card */}
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-br from-[#00D4FF]/25 via-transparent to-[#00FF88]/25 blur-2xl -z-10" />
            <div className="rounded-2xl border border-white/10 bg-[#0F1520] p-6 shadow-2xl">
              <h2 className="font-heading text-2xl tracking-tight text-center mb-5">Create your free account</h2>
              {user ? (
                <div className="text-center py-6">
                  <div className="text-slate-400 text-sm mb-3">Welcome back,</div>
                  <div className="font-heading text-xl text-white mb-4">{user.name}</div>
                  <Button onClick={() => nav("/profile")} className="w-full rounded-full bg-[#00D4FF] text-[#0D1117] hover:bg-[#33DDFF] font-medium" data-testid="hero-goto-profile">
                    Go to your dashboard <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <>
                  {GOOGLE_AUTH && (<>
                  <button
                    onClick={startGoogleAuth}
                    className="w-full bg-[#00FF88] hover:bg-[#33FFA1] text-[#0D1117] rounded-md py-3 font-semibold flex items-center justify-center gap-2 transition-colors"
                    data-testid="hero-google-btn"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="#0D1117" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#0D1117" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#0D1117" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#0D1117" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
                    Sign up with Google
                  </button>
                  <div className="mt-3 text-center">
                    <button
                      onClick={() => setAuthOpen(true)}
                      className="text-sm text-slate-400 hover:text-white"
                      data-testid="hero-more-options"
                    >
                      Show more options ▾
                    </button>
                  </div>
                  <div className="flex items-center gap-3 my-4 text-[10px] uppercase tracking-widest text-slate-500">
                    <span className="h-px bg-white/10 flex-1" /> or <span className="h-px bg-white/10 flex-1" />
                  </div>
                  </>)}
                  <button
                    onClick={() => setAuthOpen(true)}
                    className={`w-full ${GOOGLE_AUTH ? "bg-transparent border border-white/15 hover:border-white/30 hover:bg-white/5 text-white" : "bg-[#00FF88] hover:bg-[#33FFA1] text-[#0D1117] font-semibold"} rounded-md py-3 font-medium flex items-center justify-center gap-2 transition-colors`}
                    data-testid="hero-email-btn"
                  >
                    <Mail className="w-4 h-4" /> {GOOGLE_AUTH ? "Email" : "Sign up with email"}
                  </button>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-4">
                    By continuing, you accept our <span className="text-[#00D4FF]">Terms</span> and <span className="text-[#00D4FF]">Privacy Policy</span>. Your data is stored securely.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* RIGHT — Business panel with purple accent */}
          <div className="relative">
            <div
              className="rounded-2xl overflow-hidden relative p-8 pb-40 h-full"
              style={{
                background: "linear-gradient(160deg, #1E0B4B 0%, #4B1FB3 55%, #7C3AED 100%)",
              }}
            >
              <h3 className="font-heading text-2xl lg:text-3xl tracking-tight text-white mb-1">
                OpenAI trains your models.
              </h3>
              <p className="font-heading text-2xl lg:text-3xl tracking-tight italic mb-6" style={{ color: "#B892FF" }}>
                We train your people.
              </p>
              <button
                onClick={() => setUpgradeOpen(true)}
                className="bg-[#0D1117] text-white text-sm px-4 py-2 rounded-md font-medium hover:bg-black transition-colors"
                data-testid="hero-business-btn"
              >
                Data Hub for Business
              </button>

              <div className="mt-8 grid grid-cols-3 gap-y-4 gap-x-6 items-center">
                {COMPANY_LOGOS.map((c) => (
                  <div key={c} className="text-white/80 text-sm font-heading font-medium tracking-tight">{c}</div>
                ))}
              </div>

              {/* Decorative circle image */}
              <div className="absolute -bottom-8 right-4 w-48 h-48 rounded-full overflow-hidden border-4 border-white/10 hidden md:block">
                <img
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=400&h=400&q=70"
                  alt="Team working"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRACKS strip */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-6 flex items-center justify-between">
          <div className="uppercase text-[11px] tracking-[0.25em] text-slate-500">Curated career tracks</div>
          <Link to="/roadmap" className="text-sm text-[#00D4FF] hover:underline flex items-center gap-1" data-testid="link-see-tracks">
            See all tracks <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger-in">
          {TRACKS.map((t, i) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.title}
                to={t.to}
                data-testid={`track-card-${i}`}
                className="group p-6 rounded-xl border border-white/10 bg-[#151B23] hover:border-white/25 transition-[transform,border-color] duration-200 hover:-translate-y-1"
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center mb-5"
                  style={{ background: `${t.tint}18`, border: `1px solid ${t.tint}55` }}
                >
                  <Icon className="w-5 h-5" style={{ color: t.tint }} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-heading text-lg tracking-tight">{t.title}</h3>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 group-hover:text-white transition-transform" />
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{t.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURED courses */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURED.map((c, i) => (
            <div key={i} className="p-5 rounded-xl border border-white/10 bg-[#151B23]" data-testid={`featured-course-${i}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-md bg-[#0D1117] border border-white/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#00D4FF]" />
                </div>
                <div className="font-heading text-base tracking-tight">{c.title}</div>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-[#FFC93C] fill-current" /> {c.rating}+</span>
                <span>·</span>
                <span>{c.level}</span>
                <span>·</span>
                <span>{c.hours}</span>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 uppercase tracking-widest text-slate-400">{c.module}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MODULE bento grid */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="mb-8">
          <div className="uppercase text-[11px] tracking-[0.25em] text-[#00D4FF] mb-2">Practice modules</div>
          <h2 className="font-heading text-3xl sm:text-4xl tracking-tight">Pick a track. Start solving.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MODULES.map((m, idx) => {
            const Icon = ICONS[m.icon] || Sheet;
            const solved = progress[m.key]?.solved || 0;
            const span = idx === 0 || idx === 3 ? "md:col-span-2" : "";
            return (
              <Link
                key={m.key}
                to={`/${m.key}`}
                data-testid={`module-card-${m.key}`}
                className={`group relative overflow-hidden p-7 rounded-xl border border-white/10 bg-[#151B23] hover:border-white/25 transition-[transform,border-color] duration-200 hover:-translate-y-1 ${span}`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-11 h-11 rounded-md flex items-center justify-center"
                       style={{ background: `${m.accent}15`, border: `1px solid ${m.accent}55` }}>
                    <Icon className="w-5 h-5" style={{ color: m.accent }} />
                  </div>
                  <div className="text-right text-xs font-mono-editor text-slate-500">
                    {m.total.toLocaleString()} Qs
                  </div>
                </div>
                <h3 className="font-heading text-2xl tracking-tight mb-1">{m.name}</h3>
                <p className="text-sm text-slate-400 mb-5">{m.tagline}</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">Free sample · <span className="text-slate-300">{solved}/25 solved</span></div>
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

      {/* CATEGORIES pills */}
      <section className="max-w-7xl mx-auto px-6 pb-14">
        <h3 className="font-heading text-2xl tracking-tight mb-5">Explore by category</h3>
        <div className="flex items-center gap-3 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => nav("/sql")}
              data-testid={`category-${c.toLowerCase().replace(/[^a-z]+/g, '-')}`}
              className="px-5 py-2 rounded-full border border-white/10 bg-[#151B23] hover:border-[#00D4FF] hover:text-[#00D4FF] text-slate-200 text-sm transition-colors"
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* TECH LOGOS */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <h3 className="font-heading text-2xl tracking-tight mb-5">Learn the world's most in-demand technologies</h3>
        <div className="flex items-center gap-3 flex-wrap">
          {TECH_LOGOS.map((t) => (
            <div
              key={t.name}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-white/10 bg-[#151B23] hover:border-white/25 transition-colors"
              data-testid={`tech-logo-${t.name.toLowerCase()}`}
            >
              <span
                className="w-6 h-6 rounded-md flex items-center justify-center font-heading font-bold text-[11px]"
                style={{ background: `${t.color}20`, color: t.color, border: `1px solid ${t.color}66` }}
              >
                {t.glyph}
              </span>
              <span className="text-sm font-medium text-slate-200">{t.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* HOW PRACTICE WORKS — the three modes */}
      <section className="max-w-7xl mx-auto px-6 pb-16" id="modes">
        <div className="mb-6">
          <div className="uppercase text-[11px] tracking-[0.25em] text-[#00D4FF] mb-2">How practice works</div>
          <h2 className="font-heading text-3xl sm:text-4xl tracking-tight">Three modes. One workbench.</h2>
          <p className="text-slate-400 mt-2 text-sm max-w-xl">Every module runs real code in your browser — SQL against a database, formulas in a live sheet. Choose how you want to work through the problems.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {MODE_GUIDE.map((m) => { const Icon = m.icon; return (
            <div key={m.key} className="p-5 rounded-xl bg-[#0D1117] border border-white/10" data-testid={`home-mode-${m.key}`}>
              <div className="flex items-center gap-2 mb-1"><Icon className="w-4 h-4" style={{ color: m.color }} /><div className="font-heading text-lg tracking-tight">{m.title}</div></div>
              <div className="text-[10px] uppercase tracking-widest mb-3" style={{ color: m.color }}>{m.tagline}</div>
              <ul className="text-xs text-slate-400 space-y-1.5">{m.points.slice(0, 3).map((pt) => <li key={pt} className="flex gap-2"><span style={{ color: m.color }}>•</span>{pt}</li>)}</ul>
            </div>
          ); })}
        </div>
      </section>

      {/* SKILL LEVELS dark panel */}
      <section className="max-w-7xl mx-auto px-6 pb-16" id="pricing-anchor">
        <div className="rounded-2xl p-8 md:p-12 relative overflow-hidden" style={{ background: "radial-gradient(ellipse at top left, rgba(0, 212, 255, 0.15), transparent 50%), radial-gradient(ellipse at bottom right, rgba(255, 209, 102, 0.12), transparent 50%), #0F1520", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
            <div>
              <div className="uppercase text-[11px] tracking-[0.25em] text-yellow-300 mb-2 flex items-center gap-2"><Award className="w-4 h-4" /> Skill assessment</div>
              <h2 className="font-heading text-3xl sm:text-4xl tracking-tight">Your belt is earned, not awarded.</h2>
              <p className="text-slate-400 mt-2 text-sm max-w-xl">No course completion badges. Your rank in each module is computed from the problems you can actually solve — and harder belts need harder problems. It's an honest answer to "how good am I at SQL right now?"</p>
            </div>
            <Link to={user ? "/profile" : "#"} onClick={(e) => { if (!user) { e.preventDefault(); setAuthOpen(true); } }} className="text-sm text-[#00D4FF] hover:underline inline-flex items-center gap-1" data-testid="see-skill-levels">
              See my skill levels <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2" data-testid="belt-ladder">
            {BELTS.map((b, i) => (
              <div key={b.name} className="p-3 rounded-xl bg-[#0D1117] border border-white/10 text-center">
                <div className="mx-auto w-10 h-3 rounded-sm border border-white/20 mb-2" style={{ background: b.color }} />
                <div className="font-heading text-sm">{b.name}</div>
                <div className="text-[10px] text-slate-500 mt-1 leading-snug">{i === 0 ? "Start here" : `${b.total} solved${b.hard ? ` · ${b.hard} hard` : b.medium ? ` · ${b.medium} medium` : ""}`}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-4">Green belt and above can download a skill report (PDF) showing exactly which difficulty tiers you've cleared — useful for a CV or a hiring manager.</p>
        </div>
      </section>

      {/* STATS strip */}
      <section className="max-w-7xl mx-auto px-6 pb-16 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { k: "5,000+", v: "practice questions" },
          { k: "125", v: "free sample Qs" },
          { k: "90 days", v: "to job-ready" },
          { k: "5", v: "career tracks" },
        ].map((s) => (
          <div key={s.k} className="p-5 rounded-xl border border-white/10 bg-[#151B23]">
            <div className="font-heading text-3xl md:text-4xl tracking-tighter text-white">{s.k}</div>
            <div className="text-xs uppercase tracking-widest text-slate-500 mt-1">{s.v}</div>
          </div>
        ))}
      </section>

      {/* NEWSLETTER CTA band */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div
          className="rounded-2xl p-10 md:p-14 flex flex-col md:flex-row md:items-center gap-6"
          style={{
            background: "linear-gradient(120deg, #0D1117 0%, #0D1117 40%, rgba(0, 212, 255, 0.12) 100%)",
            border: "1px solid rgba(0, 212, 255, 0.2)",
          }}
        >
          <div className="flex-1">
            <div className="uppercase text-[11px] tracking-[0.25em] text-[#00FF88] mb-2">Weekly analyst tips · free</div>
            <h2 className="font-heading text-3xl sm:text-4xl tracking-tight mb-2">Get sharper every Sunday.</h2>
            <p className="text-slate-300 max-w-lg">One SQL puzzle, one Python tip, one dashboard idea. Zero fluff.</p>
          </div>
          <form onSubmit={subscribe} className="flex gap-2 min-w-[300px]" data-testid="hero-newsletter-form">
            <Input
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="you@company.com"
              className="bg-[#0D1117] border-white/10 h-12"
              data-testid="hero-newsletter-input"
            />
            <Button type="submit" className="rounded-full bg-[#00FF88] text-[#0D1117] hover:bg-[#33FFA1] font-semibold h-12 px-6" data-testid="hero-newsletter-submit">
              Subscribe
            </Button>
          </form>
        </div>
      </section>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
