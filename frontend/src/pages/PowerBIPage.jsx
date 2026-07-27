import React from "react";
import ModulePractice from "@/components/ModulePractice";
import QuestionCard from "@/components/QuestionCard";
import PowerBIDashboard from "@/components/PowerBIDashboard";

export default function PowerBIPage() {
  return (
    <ModulePractice
      moduleKey="powerbi"
      renderEmbed={() => <PowerBIDashboard />}
      render={(q, onSolved) => <QuestionCard question={q} onSolved={onSolved} />}
    />
  );
}
