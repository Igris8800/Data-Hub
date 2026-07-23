import React from "react";
import ModulePractice from "@/components/ModulePractice";
import QuestionCard from "@/components/QuestionCard";

export default function StatsPage() {
  return (
    <ModulePractice
      moduleKey="stats"
      render={(q, onSolved) => <QuestionCard question={q} onSolved={onSolved} />}
    />
  );
}
