import React, { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql, SQLite } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";

const SCHEMA_HINTS = {
  employees:   ["id", "name", "dept_id", "salary", "hire_date"],
  departments: ["id", "name"],
  customers:   ["id", "name", "city", "signup_date"],
  orders:      ["id", "customer_id", "amount", "order_date", "status"],
  sales:       ["id", "region", "product", "amount", "sale_date"],
};

const lightThemeExt = EditorView.theme({
  "&": { backgroundColor: "transparent", color: "#0F172A" },
  ".cm-content": { caretColor: "#0284C7" },
  ".cm-gutters": { backgroundColor: "#EEF2F7", color: "#94A3B8", border: "none" },
  ".cm-activeLineGutter": { backgroundColor: "rgba(2,132,199,0.08)" },
  ".cm-activeLine": { backgroundColor: "rgba(2,132,199,0.04)" },
  ".cm-selectionBackground, ::selection": { backgroundColor: "#B9E4FF !important" },
});

const darkOverride = EditorView.theme({
  "&": { backgroundColor: "transparent" },
  ".cm-gutters": { backgroundColor: "#0F1520", color: "#475569", border: "none" },
  ".cm-activeLineGutter": { backgroundColor: "rgba(0,212,255,0.06)" },
  ".cm-activeLine": { backgroundColor: "rgba(0,212,255,0.04)" },
});

export default React.forwardRef(function SqlEditor(
  { value, onChange, onRun, theme = "dark", placeholder },
  ref
) {
  const extensions = useMemo(() => [
    sql({ dialect: SQLite, schema: SCHEMA_HINTS, upperCaseKeywords: true }),
    EditorView.lineWrapping,
    theme === "light" ? lightThemeExt : darkOverride,
    EditorView.domEventHandlers({
      keydown(e) {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          onRun?.();
          return true;
        }
        return false;
      },
    }),
  ], [theme, onRun]);

  return (
    <div ref={ref} className="h-full w-full" data-testid="cm-sql-editor">
      <CodeMirror
        value={value}
        height="100%"
        theme={theme === "light" ? undefined : oneDark}
        extensions={extensions}
        onChange={onChange}
        placeholder={placeholder}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          foldGutter: false,
        }}
        style={{ fontSize: 13, fontFamily: "JetBrains Mono, monospace", height: "100%" }}
      />
    </div>
  );
});
