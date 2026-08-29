import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table as TableIcon, KeyRound, Link as LinkIcon } from "lucide-react";

/**
 * Simple ERD viewer that lays out tables as cards in a responsive grid
 * and draws a small badge for PK/FK on each column.
 */
export default function ERDModal({ open, onOpenChange, company }) {
  if (!company) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0F1520] border-white/10 max-w-5xl" data-testid="erd-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{company.logo}</span>
            <span className="font-heading text-xl tracking-tight">{company.name} · Entity Relationship Diagram</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto p-1">
          {company.tables.map(t => (
            <div key={t.name} className="rounded-lg border border-white/10 bg-[#0D1117] overflow-hidden" data-testid={`erd-table-${t.name}`}>
              <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2" style={{ background: `${t.color || company.color}12` }}>
                <TableIcon className="w-3.5 h-3.5" style={{ color: t.color || company.color }} />
                <span className="font-mono-editor text-sm font-semibold" style={{ color: t.color || company.color }}>{t.name}</span>
                <span className="ml-auto text-[10px] text-slate-500 font-mono-editor">{t.rows.length} rows</span>
              </div>
              <table className="w-full text-xs font-mono-editor">
                <tbody>
                  {t.columns.map(c => (
                    <tr key={c.name} className="border-b border-white/5">
                      <td className="pl-3 pr-2 py-1.5 w-6">
                        {c.tag === "PK" ? <KeyRound className="w-3 h-3 text-yellow-300" title="Primary key" /> :
                         c.tag === "FK" ? <LinkIcon className="w-3 h-3 text-[#00D4FF]" title="Foreign key" /> : null}
                      </td>
                      <td className="py-1.5 text-slate-200">{c.name}</td>
                      <td className="py-1.5 pr-3 text-right text-[10px] text-slate-500">{c.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-4 pt-2">
          <span className="inline-flex items-center gap-1"><KeyRound className="w-3 h-3 text-yellow-300" /> Primary key</span>
          <span className="inline-flex items-center gap-1"><LinkIcon className="w-3 h-3 text-[#00D4FF]" /> Foreign key</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
