import React, { useEffect, useState, useMemo } from "react";
import { Command } from "cmdk";
import { Search, Zap, Play, Sparkles, ChevronRight, Terminal, BarChart3 } from "lucide-react";
import { useTheme } from "@/lib/theme";

/**
 * Cmd+K command palette. Actions are simple thunks fed in via `actions`.
 * Each action has: { id, label, hint?, group?, icon?, onSelect }
 */
export default function CommandPalette({ open, onOpenChange, actions = [] }) {
  const [q, setQ] = useState("");
  const { toggle: toggleTheme } = useTheme();

  useEffect(() => { if (!open) setQ(""); }, [open]);

  // Global open shortcut (Cmd/Ctrl+K)
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        onOpenChange(v => !v);
      }
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  const themeAction = useMemo(() => ({
    id: "toggle-theme", label: "Toggle theme (Terminal ↔ Dashboard)", group: "App", icon: Terminal, onSelect: toggleTheme,
  }), [toggleTheme]);

  const groups = useMemo(() => {
    const all = [...actions, themeAction];
    const map = {};
    for (const a of all) (map[a.group || "Actions"] ??= []).push(a);
    return map;
  }, [actions, themeAction]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-24 backdrop-blur-sm bg-black/50"
      onClick={() => onOpenChange(false)}
      data-testid="cmdk-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-xl border border-white/10 bg-[#0F1520] shadow-2xl overflow-hidden"
        data-testid="cmdk-panel"
      >
        <Command shouldFilter loop>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
            <Search className="w-4 h-4 text-slate-400" />
            <Command.Input
              value={q}
              onValueChange={setQ}
              placeholder="Search actions, jump to question, run…"
              autoFocus
              className="flex-1 bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500"
              data-testid="cmdk-input"
            />
            <span className="text-[10px] font-mono-editor text-slate-500 px-2 py-0.5 rounded bg-white/5 border border-white/10">ESC</span>
          </div>
          <Command.List className="max-h-80 overflow-y-auto py-2">
            <Command.Empty className="px-4 py-8 text-center text-sm text-slate-500">
              No matches for "{q}"
            </Command.Empty>
            {Object.entries(groups).map(([group, items]) => (
              <Command.Group key={group} heading={<div className="px-4 py-1 text-[10px] uppercase tracking-widest text-slate-500">{group}</div>}>
                {items.map(a => {
                  const Icon = a.icon || ChevronRight;
                  return (
                    <Command.Item
                      key={a.id}
                      value={`${a.label} ${a.hint || ""} ${group}`}
                      onSelect={() => { a.onSelect?.(); onOpenChange(false); }}
                      className="px-4 py-2.5 text-sm text-slate-200 hover:bg-white/5 aria-selected:bg-[#00D4FF]/10 aria-selected:text-white cursor-pointer flex items-center gap-3"
                      data-testid={`cmdk-item-${a.id}`}
                    >
                      <Icon className="w-4 h-4 text-slate-500" />
                      <span className="flex-1">{a.label}</span>
                      {a.hint && <span className="text-[10px] font-mono-editor text-slate-500">{a.hint}</span>}
                    </Command.Item>
                  );
                })}
              </Command.Group>
            ))}
          </Command.List>
          <div className="px-4 py-2 border-t border-white/5 text-[10px] text-slate-500 flex items-center gap-3">
            <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-[#00D4FF]" /> Fuzzy search</span>
            <span className="flex items-center gap-1"><Play className="w-3 h-3 text-[#00FF88]" /> ↵ to run</span>
            <span className="ml-auto flex items-center gap-1"><Sparkles className="w-3 h-3 text-yellow-300" /> Cmd/Ctrl + K</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
