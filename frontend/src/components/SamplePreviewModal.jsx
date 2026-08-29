import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table as TableIcon } from "lucide-react";

export default function SamplePreviewModal({ open, onOpenChange, table }) {
  if (!table) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0F1520] border-white/10 max-w-4xl" data-testid="sample-preview-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TableIcon className="w-4 h-4" style={{ color: table.color || "#00D4FF" }} />
            <span className="font-heading text-lg tracking-tight">
              Sample Data · <span style={{ color: table.color || "#00D4FF" }}>{table.name}</span>
            </span>
            <span className="ml-2 text-xs text-slate-500 font-mono-editor">{table.rows.length} rows</span>
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-auto max-h-[60vh] rounded-md border border-white/5 bg-[#0D1117]">
          <table className="text-xs font-mono-editor w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 sticky top-0">
                {table.columns.map(c => (
                  <th key={c.name} className="text-left px-3 py-2">
                    <div className="font-semibold" style={{ color: table.color || "#00D4FF" }}>{c.name}</div>
                    <div className="text-[9px] text-slate-500 font-normal">{c.type}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03]">
                  {r.map((v, j) => (
                    <td key={j} className="px-3 py-1.5 text-slate-300 whitespace-nowrap">{v == null ? <span className="text-slate-600 italic">NULL</span> : String(v)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
