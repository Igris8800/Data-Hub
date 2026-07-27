import React, { useState } from "react";
import { Database, ChevronDown, ChevronRight } from "lucide-react";

// Schema + sample rows for the in-browser SQLite. Kept in sync with SQL_SEED in questions.js.
const TABLES = [
  {
    name: "employees",
    color: "#00D4FF",
    columns: ["id", "name", "dept_id", "salary", "hire_date"],
    types:   ["INT",  "TEXT", "INT",     "INT",    "DATE"],
    rows: [
      [1, "Alice",  1, 90000,  "2021-03-14"],
      [2, "Bob",    2, 75000,  "2020-07-10"],
      [3, "Carol",  1, 120000, "2019-01-22"],
      [4, "David",  3, 68000,  "2022-11-02"],
      [5, "Eve",    2, 95000,  "2021-06-30"],
    ],
    hidden: 3,
  },
  {
    name: "departments",
    color: "#00FF88",
    columns: ["id", "name"],
    types:   ["INT", "TEXT"],
    rows: [
      [1, "Engineering"],
      [2, "Sales"],
      [3, "Marketing"],
    ],
    hidden: 0,
  },
  {
    name: "customers",
    color: "#FFD166",
    columns: ["id", "name", "city", "signup_date"],
    types:   ["INT", "TEXT", "TEXT", "DATE"],
    rows: [
      [1, "Ravi",  "Mumbai",    "2023-01-05"],
      [2, "Priya", "Delhi",     "2023-02-19"],
      [3, "Sam",   "Bengaluru", "2023-03-11"],
    ],
    hidden: 2,
  },
  {
    name: "orders",
    color: "#F58549",
    columns: ["id", "customer_id", "amount", "order_date", "status"],
    types:   ["INT", "INT",         "INT",    "DATE",       "TEXT"],
    rows: [
      [1, 1, 1200, "2024-01-10", "delivered"],
      [2, 1, 540,  "2024-02-01", "delivered"],
      [3, 2, 999,  "2024-01-15", "cancelled"],
      [4, 3, 2500, "2024-02-20", "delivered"],
    ],
    hidden: 6,
  },
  {
    name: "sales",
    color: "#B892FF",
    columns: ["id", "region", "product", "amount", "sale_date"],
    types:   ["INT", "TEXT", "TEXT", "INT", "DATE"],
    rows: [
      [1, "North", "Widget",    500,  "2024-01-01"],
      [2, "South", "Widget",    700,  "2024-01-05"],
      [3, "North", "Gadget",    1200, "2024-02-10"],
    ],
    hidden: 5,
  },
];

export default function SQLReferenceTables() {
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState("employees");
  const table = TABLES.find(t => t.name === active);

  return (
    <div className="rounded-lg border border-white/10 bg-[#151B23] overflow-hidden" data-testid="sql-reference-panel">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors"
        data-testid="sql-reference-toggle"
      >
        <div className="w-8 h-8 rounded-md bg-[#00D4FF]/15 border border-[#00D4FF]/40 flex items-center justify-center">
          <Database className="w-4 h-4 text-[#00D4FF]" />
        </div>
        <div className="text-left flex-1">
          <div className="font-heading text-sm tracking-tight">Reference tables</div>
          <div className="text-[11px] text-slate-500">5 tables · click a tab to inspect columns and sample rows</div>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
      </button>

      {open && (
        <div>
          {/* Tab pills */}
          <div className="flex items-center gap-2 flex-wrap px-4 py-3 border-b border-white/5">
            {TABLES.map(t => (
              <button
                key={t.name}
                onClick={() => setActive(t.name)}
                data-testid={`sql-ref-tab-${t.name}`}
                className={`px-3 py-1 rounded-full text-xs font-mono-editor border transition-colors ${active === t.name ? "text-[#0D1117]" : "text-slate-300 hover:bg-white/5"}`}
                style={active === t.name ? { background: t.color, borderColor: t.color } : { borderColor: "rgba(255,255,255,0.15)" }}
              >
                {t.name}
              </button>
            ))}
          </div>

          {/* Schema + rows */}
          <div className="overflow-auto max-h-72">
            <table className="text-xs font-mono-editor w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 sticky top-0">
                  {table.columns.map((c, i) => (
                    <th key={c} className="text-left px-4 py-2">
                      <div style={{ color: table.color }} className="font-semibold">{c}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{table.types[i]}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((r, ri) => (
                  <tr key={ri} className="border-b border-white/5 hover:bg-white/5">
                    {r.map((v, ci) => <td key={ci} className="px-4 py-1.5 text-slate-300">{String(v)}</td>)}
                  </tr>
                ))}
                {table.hidden > 0 && (
                  <tr className="text-slate-500 text-center">
                    <td colSpan={table.columns.length} className="px-4 py-2 italic">…and {table.hidden} more rows in the live database</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
