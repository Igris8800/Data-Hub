import React from "react";
import ModulePractice from "@/components/ModulePractice";
import QuestionCard from "@/components/QuestionCard";
import { BarChart3, ExternalLink } from "lucide-react";

export default function PowerBIPage() {
  return (
    <ModulePractice
      moduleKey="powerbi"
      renderEmbed={() => (
        <div className="p-4 rounded-lg border border-white/10 bg-[#151B23] flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-[#F58549]/15 border border-[#F58549]/40 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#F58549]" />
            </div>
            <div>
              <div className="font-heading text-lg tracking-tight">Sample Power BI Dashboard</div>
              <p className="text-xs text-slate-400">Explore a public Power BI report while answering the concept questions.</p>
            </div>
          </div>
          <a href="https://community.fabric.microsoft.com/t5/Data-Stories-Gallery/bd-p/DataStoriesGallery" target="_blank" rel="noreferrer noopener" data-testid="powerbi-external-link"
             className="text-sm px-4 py-2 rounded-full border border-[#F58549]/40 text-[#F58549] hover:bg-[#F58549]/10 transition-colors inline-flex items-center gap-2">
            Open sample reports <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
      render={(q, onSolved) => <QuestionCard question={q} onSolved={onSolved} />}
    />
  );
}
