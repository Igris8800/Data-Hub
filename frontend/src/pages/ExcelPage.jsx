import React from "react";
import ModulePractice from "@/components/ModulePractice";
import QuestionCard from "@/components/QuestionCard";
import ExcelSpreadsheet from "@/components/ExcelSpreadsheet";

export default function ExcelPage() {
  return (
    <ModulePractice
      moduleKey="excel"
      renderEmbed={() => <ExcelSpreadsheet />}
      render={(q, onSolved) => <QuestionCard question={q} onSolved={onSolved} />}
    />
  );
}
