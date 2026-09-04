import React, { useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, ChevronDown, ChevronRight, Code2, BookOpen, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";

const REGION_SALES = [
  { region: "North", sales: 3550 },
  { region: "South", sales: 2200 },
  { region: "East",  sales: 1800 },
  { region: "West",  sales: 1500 },
];
const PRODUCT_MIX = [
  { name: "Widget", value: 2800 },
  { name: "Gadget", value: 4700 },
  { name: "Doohickey", value: 1550 },
];
const MONTHLY = [
  { month: "Jan", revenue: 1200 },
  { month: "Feb", revenue: 1650 },
  { month: "Mar", revenue: 1250 },
  { month: "Apr", revenue: 1900 },
  { month: "May", revenue: 2100 },
  { month: "Jun", revenue: 950 },
];
const COLORS = ["#00D4FF", "#00FF88", "#F58549"];

export default function PowerBIDashboard() {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-lg border border-white/10 bg-[#151B23] overflow-hidden" data-testid="pbi-dashboard">
      <div className="mb-5 grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#F2C811]/30 bg-[#F2C811]/5 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#F2C811]/20 flex items-center justify-center"><BookOpen className="w-4 h-4 text-[#F2C811]" /></div>
          <div className="min-w-0"><div className="font-heading text-sm">Power BI Concepts</div><div className="text-xs text-slate-400">You are here · 500+ questions on DAX, modelling, Power Query, visuals, RLS</div></div>
        </div>
        <Link to="/powerbi/dax" className="rounded-xl border border-white/10 bg-[#151B23] hover:border-[#F2C811]/40 hover:bg-[#F2C811]/5 transition-colors p-4 flex items-center gap-3 group" data-testid="goto-dax">
          <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center"><Code2 className="w-4 h-4 text-[#F2C811]" /></div>
          <div className="min-w-0 flex-1"><div className="font-heading text-sm flex items-center gap-1">DAX Practice <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" /></div><div className="text-xs text-slate-400">Write real measures against a star schema, graded live</div></div>
        </Link>
      </div>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors"
        data-testid="pbi-dashboard-toggle"
      >
        <div className="w-8 h-8 rounded-md bg-[#F58549]/15 border border-[#F58549]/40 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-[#F58549]" />
        </div>
        <div className="text-left flex-1">
          <div className="font-heading text-sm tracking-tight">Sample dashboard — <span className="text-[#F58549]">Sales overview</span></div>
          <div className="text-[11px] text-slate-500">Reference visuals for the concept questions on this page.</div>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
      </button>

      {open && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* KPI cards */}
          <div className="p-4 rounded-md border border-white/5 bg-[#0D1117]">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Total revenue</div>
            <div className="font-heading text-3xl">₹9,050</div>
            <div className="text-[11px] text-[#00FF88] mt-1">▲ 12% vs prev month</div>
          </div>
          <div className="p-4 rounded-md border border-white/5 bg-[#0D1117]">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Orders</div>
            <div className="font-heading text-3xl">10</div>
            <div className="text-[11px] text-slate-400 mt-1">2 pending · 8 delivered</div>
          </div>
          <div className="p-4 rounded-md border border-white/5 bg-[#0D1117]">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Top region</div>
            <div className="font-heading text-3xl text-[#00D4FF]">North</div>
            <div className="text-[11px] text-slate-400 mt-1">₹3,550 in sales</div>
          </div>

          {/* Bar chart */}
          <div className="md:col-span-2 p-4 rounded-md border border-white/5 bg-[#0D1117]">
            <div className="text-xs text-slate-400 mb-2">Sales by region</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={REGION_SALES}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                <XAxis dataKey="region" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip contentStyle={{ background: "#151B23", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12 }} />
                <Bar dataKey="sales" fill="#00D4FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="p-4 rounded-md border border-white/5 bg-[#0D1117]">
            <div className="text-xs text-slate-400 mb-2">Product mix</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={PRODUCT_MIX} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                  {PRODUCT_MIX.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#151B23", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Line chart */}
          <div className="md:col-span-3 p-4 rounded-md border border-white/5 bg-[#0D1117]">
            <div className="text-xs text-slate-400 mb-2">Monthly revenue trend</div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={MONTHLY}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip contentStyle={{ background: "#151B23", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12 }} />
                <Line type="monotone" dataKey="revenue" stroke="#00FF88" strokeWidth={2} dot={{ fill: "#00FF88", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
