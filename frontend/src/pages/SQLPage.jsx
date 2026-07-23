import React from "react";
import ModulePractice from "@/components/ModulePractice";
import SQLRunner from "@/components/SQLRunner";

export default function SQLPage() {
  return (
    <ModulePractice
      moduleKey="sql"
      render={(q, onSolved) => <SQLRunner question={q} onSolved={onSolved} />}
    />
  );
}
