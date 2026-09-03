import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

/** Appearance switch. Plain "Dark / Light" wording so nobody has to guess what it does. */
export default function ThemeToggle({ compact = false }) {
  const { theme, setTheme } = useTheme();
  const opts = [
    { key: "dark", icon: Moon, label: "Dark" },
    { key: "light", icon: Sun, label: "Light" },
  ];
  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 rounded-full border border-white/10 bg-[#0D1117]" data-testid="theme-toggle" role="radiogroup" aria-label="Appearance">
      {opts.map((o) => {
        const Icon = o.icon; const active = theme === o.key;
        return (
          <button key={o.key} onClick={() => setTheme(o.key)} data-testid={`theme-${o.key}-btn`} aria-checked={active} role="radio"
            title={o.key === "dark" ? "Switch to dark appearance" : "Switch to light appearance"}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${active ? (o.key === "dark" ? "bg-[#00D4FF] text-[#0D1117]" : "bg-yellow-300 text-[#0D1117]") : "text-slate-400 hover:text-white"}`}>
            <Icon className="w-3.5 h-3.5" />{!compact && <span>{o.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
