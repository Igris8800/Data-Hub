import React from "react";
import ModulePractice from "@/components/ModulePractice";
import SQLRunner from "@/components/SQLRunner";
import QuestionCard from "@/components/QuestionCard";
import SQLReferenceTables from "@/components/SQLReferenceTables";

export default function SQLPage() {
  return (
    <ModulePractice
      moduleKey="sql"
      renderEmbed={() => <SQLReferenceTables />}
      render={(q, onSolved) => (
        q.source === "ai"
          ? <QuestionCard question={q} onSolved={onSolved} />
          : <SQLRunner question={q} onSolved={onSolved} />
      )}
    />
  );
}
