import React, { useMemo, useState } from "react";
import { Sheet, ChevronDown, ChevronRight, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Sample sales dataset used across Excel questions.
const HEADERS = ["ID", "Region", "Product", "Amount", "Month", "Status"];
const DATA = [
  [1,  "North", "Widget",    500,  "Jan", "delivered"],
  [2,  "South", "Widget",    700,  "Jan", "delivered"],
  [3,  "North", "Gadget",    1200, "Feb", "delivered"],
  [4,  "East",  "Widget",    450,  "Feb", "cancelled"],
  [5,  "West",  "Gadget",    900,  "Mar", "delivered"],
  [6,  "North", "Doohickey", 350,  "Mar", "delivered"],
  [7,  "South", "Gadget",    1100, "Apr", "delivered"],
  [8,  "East",  "Doohickey", 800,  "Apr", "delivered"],
  [9,  "West",  "Widget",    600,  "May", "cancelled"],
  [10, "North", "Gadget",    1500, "May", "delivered"],
  [11, "South", "Doohickey", 400,  "Jun", "delivered"],
  [12, "East",  "Widget",    550,  "Jun", "delivered"],
];

const COLS = ["A", "B", "C", "D", "E", "F"];

// Very small formula evaluator — supports SUM, AVERAGE, COUNT, MAX, MIN, SUMIF, COUNTIF on the visible data.
// It parses ranges like B2:B13 and returns computed values. Not a full engine.
function colIdx(letter) { return letter.charCodeAt(0) - "A".charCodeAt(0); }
function parseRange(range) {
  const m = range.match(/^([A-F])(\d+):([A-F])(\d+)$/i);
  if (!m) return null;
  return {
    c1: colIdx(m[1].toUpperCase()), r1: parseInt(m[2], 10),
    c2: colIdx(m[3].toUpperCase()), r2: parseInt(m[4], 10),
  };
}
function values(range) {
  const r = parseRange(range);
  if (!r) return [];
  const out = [];
  for (let row = r.r1; row <= r.r2; row++) {
    for (let col = r.c1; col <= r.c2; col++) {
      // row 1 is header row visually — but our data rows are 1-indexed within DATA
      // We treat row 1 as headers and rows 2..13 as data.
      if (row === 1) continue;
      const d = DATA[row - 2];
      if (!d) continue;
      out.push(d[col]);
    }
  }
  return out;
}
function nums(arr) { return arr.map(v => typeof v === "number" ? v : parseFloat(v)).filter(v => !Number.isNaN(v)); }

export function evalFormula(input) {
  const f = input.trim();
  if (!f.startsWith("=")) return { error: "Formulas must start with '='" };
  const body = f.slice(1);

  const call = (name, args) => {
    switch (name.toUpperCase()) {
      case "SUM": {
        const arr = nums(values(args[0]));
        return arr.reduce((a, b) => a + b, 0);
      }
      case "AVERAGE": case "AVG": {
        const arr = nums(values(args[0]));
        if (!arr.length) return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
      }
      case "COUNT": {
        return nums(values(args[0])).length;
      }
      case "COUNTA": {
        return values(args[0]).filter(v => v !== "" && v != null).length;
      }
      case "MAX": {
        const arr = nums(values(args[0]));
        return arr.length ? Math.max(...arr) : 0;
      }
      case "MIN": {
        const arr = nums(values(args[0]));
        return arr.length ? Math.min(...arr) : 0;
      }
      case "SUMIF": {
        // SUMIF(criteria_range, criteria, [sum_range])
        const critRange = values(args[0]);
        const criteria = args[1]?.replace(/^["']|["']$/g, "");
        const sumRange = args[2] ? values(args[2]) : critRange;
        let total = 0;
        critRange.forEach((v, i) => {
          if (String(v) === criteria && typeof sumRange[i] === "number") total += sumRange[i];
        });
        return total;
      }
      case "COUNTIF": {
        const critRange = values(args[0]);
        const criteria = args[1]?.replace(/^["']|["']$/g, "");
        return critRange.filter(v => String(v) === criteria).length;
      }
      default:
        throw new Error(`Unsupported function: ${name}. Try SUM, AVERAGE, COUNT, MAX, MIN, SUMIF, COUNTIF.`);
    }
  };

  try {
    // Simple regex-based parse: FUNC(arg1, arg2, ...)
    const m = body.match(/^([A-Z]+)\s*\((.*)\)$/i);
    if (!m) {
      // Direct cell reference (e.g. =B2)
      const cellMatch = body.match(/^([A-F])(\d+)$/i);
      if (cellMatch) {
        const c = colIdx(cellMatch[1].toUpperCase());
        const r = parseInt(cellMatch[2], 10);
        if (r === 1) return HEADERS[c];
        return DATA[r - 2]?.[c];
      }
      throw new Error("Could not parse formula. Try =SUM(B2:B13) or similar.");
    }
    const name = m[1];
    // Split args at top-level commas (no nesting in MVP)
    const rawArgs = m[2].trim();
    const args = rawArgs ? rawArgs.split(/\s*,\s*/) : [];
    const result = call(name, args);
    return { result };
  } catch (e) {
    return { error: e.message };
  }
}

export default function ExcelSpreadsheet() {
  const [open, setOpen] = useState(true);
  const [formula, setFormula] = useState("=SUM(D2:D13)");
  const [output, setOutput] = useState(null);
  const [selection, setSelection] = useState(null); // {r,c}

  const preview = useMemo(() => {
    if (!formula) return null;
    return evalFormula(formula);
  }, [formula]);

  const run = () => setOutput(preview);

  const cell = (r, c) => {
    if (r === 0) return HEADERS[c];
    return DATA[r - 1]?.[c];
  };

  return (
    <div className="rounded-lg border border-white/10 bg-[#151B23] overflow-hidden" data-testid="excel-workbook">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors"
        data-testid="excel-workbook-toggle"
      >
        <div className="w-8 h-8 rounded-md bg-[#00FF88]/15 border border-[#00FF88]/40 flex items-center justify-center">
          <Sheet className="w-4 h-4 text-[#00FF88]" />
        </div>
        <div className="text-left flex-1">
          <div className="font-heading text-sm tracking-tight">Live workbook — <span className="text-[#00FF88]">sales</span></div>
          <div className="text-[11px] text-slate-500">Type a formula in the bar below and run it against the visible data.</div>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
      </button>

      {open && (
        <div>
          {/* Formula bar */}
          <div className="px-3 py-2 border-b border-white/5 bg-[#0D1117] flex items-center gap-2">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 w-8 text-center">fx</div>
            <input
              value={formula}
              onChange={e => setFormula(e.target.value)}
              onKeyDown={e => e.key === "Enter" && run()}
              placeholder="=SUM(D2:D13)"
              className="flex-1 bg-transparent outline-none text-sm font-mono-editor text-slate-100 placeholder:text-slate-500"
              data-testid="excel-formula-input"
            />
            <Button size="sm" onClick={run} className="rounded-full bg-[#00FF88] text-[#0D1117] hover:bg-[#33FFA1] font-medium h-8" data-testid="excel-formula-run">
              <Play className="w-3.5 h-3.5 mr-1" /> Run
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setFormula(""); setOutput(null); }} data-testid="excel-formula-clear">
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>

          {output && (
            <div className="px-4 py-2 border-b border-white/5 bg-[#0D1117] text-xs font-mono-editor" data-testid="excel-formula-output">
              {output.error
                ? <span className="text-red-400">Error · {output.error}</span>
                : <><span className="text-slate-500">Result · </span><span className="text-[#00FF88]">{String(output.result)}</span></>}
            </div>
          )}

          {/* Sheet */}
          <div className="overflow-auto max-h-80">
            <table className="text-xs font-mono-editor border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 top-0 z-10 bg-[#0D1117] w-10 border border-white/10"></th>
                  {COLS.map((c, i) => (
                    <th key={c}
                        className="min-w-[110px] px-3 py-1.5 border border-white/10 bg-[#0D1117] text-slate-400 text-[11px] font-semibold text-center">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: DATA.length + 1 }).map((_, r) => (
                  <tr key={r}>
                    <td className="sticky left-0 bg-[#0D1117] text-slate-500 text-[11px] font-semibold text-center border border-white/10 w-10">
                      {r + 1}
                    </td>
                    {COLS.map((_, c) => {
                      const isSelected = selection?.r === r && selection?.c === c;
                      const isHeader = r === 0;
                      return (
                        <td
                          key={c}
                          onClick={() => setSelection({ r, c })}
                          className={`px-3 py-1.5 border border-white/10 cursor-cell text-slate-200 ${isHeader ? "font-semibold text-[#00FF88] bg-[#0D1117]" : "bg-[#151B23]"} ${isSelected ? "outline outline-2 outline-[#00D4FF] -outline-offset-2" : ""}`}
                          data-testid={`excel-cell-${COLS[c]}${r + 1}`}
                        >
                          {String(cell(r, c) ?? "")}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2 border-t border-white/5 text-[10px] text-slate-500 flex justify-between">
            <span>{selection ? `Selected · ${COLS[selection.c]}${selection.r + 1}` : "Click any cell to inspect"}</span>
            <span>Supports SUM · AVERAGE · COUNT · MAX · MIN · SUMIF · COUNTIF</span>
          </div>
        </div>
      )}
    </div>
  );
}
