import React from "react";
import ModulePractice from "@/components/ModulePractice";
import QuestionCard from "@/components/QuestionCard";
import { Sheet, ExternalLink } from "lucide-react";

export default function ExcelPage() {
  return (
    <ModulePractice
      moduleKey="excel"
      renderEmbed={() => (
        <div className="p-4 rounded-lg border border-white/10 bg-[#151B23] flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-[#00FF88]/15 border border-[#00FF88]/40 flex items-center justify-center">
              <Sheet className="w-5 h-5 text-[#00FF88]" />
            </div>
            <div>
              <div className="font-heading text-lg tracking-tight">Excel Practice Workbook</div>
              <p className="text-xs text-slate-400">Open a blank Excel Online workbook alongside these questions for hands-on practice.</p>
            </div>
          </div>
          <a href="https://www.office.com/launch/excel?auth=1" target="_blank" rel="noreferrer noopener" data-testid="excel-online-link"
             className="text-sm px-4 py-2 rounded-full border border-[#00FF88]/40 text-[#00FF88] hover:bg-[#00FF88]/10 transition-colors inline-flex items-center gap-2">
            Open Excel Online <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
      render={(q, onSolved) => <QuestionCard question={q} onSolved={onSolved} />}
    />
  );
}
