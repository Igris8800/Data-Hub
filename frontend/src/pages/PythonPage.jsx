import React from "react";
import ModulePractice from "@/components/ModulePractice";
import PythonRunner from "@/components/PythonRunner";
import QuestionCard from "@/components/QuestionCard";

export default function PythonPage() {
  return (
    <ModulePractice
      moduleKey="python"
      render={(q, onSolved) => (
        q.type === "code" && q.source !== "ai"
          ? <PythonRunner question={q} onSolved={onSolved} />
          : <QuestionCard question={q} onSolved={onSolved} />
      )}
    />
  );
}
