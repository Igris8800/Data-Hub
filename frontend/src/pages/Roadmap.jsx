import React, { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, ExternalLink, Sheet, Database, Code2, BarChart3, Sigma, GraduationCap } from "lucide-react";

const ROADMAP = [
  {
    month: "Month 1",
    subtitle: "Foundations · Excel & Statistics",
    color: "#00FF88",
    icon: Sheet,
    items: [
      { title: "Excel — Formulas & functions (SUM, IF, VLOOKUP, XLOOKUP)", link: "https://exceljet.net/" },
      { title: "Excel — PivotTables & PivotCharts", link: "https://support.microsoft.com/en-us/office/create-a-pivottable" },
      { title: "Excel — Power Query basics", link: "https://learn.microsoft.com/en-us/power-query/" },
      { title: "Stats — Mean, median, mode, spread", link: "https://www.khanacademy.org/math/statistics-probability" },
      { title: "Stats — Probability & distributions", link: "https://seeing-theory.brown.edu/" },
      { title: "Stats — Hypothesis testing basics", link: "https://www.statisticshowto.com/" },
    ],
  },
  {
    month: "Month 2",
    subtitle: "SQL Mastery",
    color: "#00D4FF",
    icon: Database,
    items: [
      { title: "SELECT, WHERE, ORDER BY, aggregates", link: "https://sqlbolt.com/" },
      { title: "JOINs (INNER / LEFT / RIGHT / FULL / SELF)", link: "https://www.sql-practice.online/" },
      { title: "GROUP BY, HAVING, subqueries", link: "https://mode.com/sql-tutorial/" },
      { title: "Window functions (ROW_NUMBER, RANK, LAG)", link: "https://learnsql.com/blog/sql-window-functions-cheat-sheet/" },
      { title: "CTEs & recursive queries", link: "https://www.postgresql.org/docs/current/queries-with.html" },
      { title: "Interview practice (Google/Amazon/Meta)", link: "https://leetcode.com/problemset/database/" },
    ],
  },
  {
    month: "Month 3",
    subtitle: "Python + Power BI + Portfolio",
    color: "#FFD166",
    icon: Code2,
    items: [
      { title: "Python basics: types, loops, functions", link: "https://docs.python.org/3/tutorial/" },
      { title: "Pandas: filtering, groupby, merges", link: "https://pandas.pydata.org/docs/user_guide/index.html" },
      { title: "NumPy + Matplotlib essentials", link: "https://numpy.org/learn/" },
      { title: "Power BI — Data modeling & DAX", link: "https://learn.microsoft.com/en-us/power-bi/" },
      { title: "Power BI — Time intelligence & RLS", link: "https://learn.microsoft.com/en-us/dax/time-intelligence-functions-dax" },
      { title: "Build 3 portfolio dashboards (Sales, HR, Marketing)", link: "https://github.com/rfordatascience/tidytuesday" },
    ],
  },
];

export default function Roadmap() {
  const [checked, setChecked] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("datahub_roadmap") || "[]")); } catch { return new Set(); }
  });
  const toggle = (id) => setChecked(s => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    localStorage.setItem("datahub_roadmap", JSON.stringify([...n]));
    return n;
  });

  const total = ROADMAP.reduce((a, m) => a + m.items.length, 0);
  const done = checked.size;

  return (
    <div className="max-w-4xl mx-auto px-6 py-4">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-[0.2em] text-[#00D4FF] mb-2 flex items-center gap-2"><GraduationCap className="w-4 h-4" /> 90-Day Roadmap</div>
        <h1 className="font-heading text-4xl sm:text-5xl tracking-tighter leading-none mb-3">From zero to Data Analyst.</h1>
        <p className="text-slate-400 max-w-2xl">A focused 90-day path with resources at every step. Tick items off as you go — progress is saved locally.</p>
        <div className="mt-6 flex items-center gap-4">
          <div className="text-3xl font-heading">{done}<span className="text-slate-500">/{total}</span></div>
          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden max-w-md">
            <div className="h-full bg-gradient-to-r from-[#00D4FF] to-[#00FF88]" style={{ width: `${(done/total)*100}%` }} />
          </div>
          <div className="text-sm text-slate-500">{Math.round((done/total)*100)}% complete</div>
        </div>
      </div>

      <div className="relative border-l border-white/10 pl-8 space-y-14">
        {ROADMAP.map((m, mi) => {
          const Icon = m.icon;
          return (
            <div key={m.month} className="relative" data-testid={`roadmap-month-${mi+1}`}>
              <div
                className="absolute -left-[42px] top-0 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: m.color, boxShadow: `0 0 0 4px #0D1117` }}
              >
                <Icon className="w-4 h-4 text-[#0D1117]" />
              </div>
              <div className="text-xs uppercase tracking-[0.2em] mb-1" style={{ color: m.color }}>{m.month}</div>
              <h2 className="font-heading text-2xl tracking-tight mb-5">{m.subtitle}</h2>

              <ul className="space-y-2">
                {m.items.map((it, i) => {
                  const id = `${mi}-${i}`;
                  const isChecked = checked.has(id);
                  return (
                    <li key={id} className="p-3 rounded-md border border-white/5 bg-[#151B23] flex items-start gap-3 hover:border-white/15 transition-colors">
                      <Checkbox checked={isChecked} onCheckedChange={() => toggle(id)} data-testid={`roadmap-item-${id}`} className="mt-0.5" />
                      <div className="flex-1">
                        <div className={`text-sm ${isChecked ? "line-through text-slate-500" : "text-slate-200"}`}>{it.title}</div>
                        <a href={it.link} target="_blank" rel="noreferrer noopener" className="text-xs text-[#00D4FF] hover:underline inline-flex items-center gap-1 mt-1">
                          Free resource <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
