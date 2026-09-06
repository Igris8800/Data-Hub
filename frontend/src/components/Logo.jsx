import React from "react";

// Crazycoder logo mark — a code-bracket "</>" motif in the brand cyan→green gradient.
// Usage: <Logo className="w-8 h-8" />  (size via className)
export default function Logo({ className = "w-8 h-8" }) {
  const id = React.useId();
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="Crazycoder logo" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`cc-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00D4FF" />
          <stop offset="100%" stopColor="#00FF88" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="8" fill={`url(#cc-${id})`} />
      {/* </> glyph */}
      <g stroke="#0D1117" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M12 11 L7.5 16 L12 21" />
        <path d="M20 11 L24.5 16 L20 21" />
        <path d="M17.5 9.5 L14.5 22.5" />
      </g>
    </svg>
  );
}
