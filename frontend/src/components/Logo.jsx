import React from "react";

// Crazycoder logo mark — animated code-bracket "</>" in the brand cyan→green gradient.
// Brackets gently breathe outward and the slash pulses; hover speeds it up. Respects reduced-motion.
export default function Logo({ className = "w-8 h-8", animate = true }) {
  const id = React.useId();
  return (
    <svg
      viewBox="0 0 32 32"
      className={`${className} cc-logo${animate ? " cc-anim" : ""}`}
      role="img"
      aria-label="Crazycoder logo"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>{`
        @keyframes cc-lbracket { 0%,100%{ transform: translateX(0); } 50%{ transform: translateX(-1.3px); } }
        @keyframes cc-rbracket { 0%,100%{ transform: translateX(0); } 50%{ transform: translateX(1.3px); } }
        @keyframes cc-slash    { 0%,100%{ opacity: 1; transform: translateY(0); } 50%{ opacity:.55; transform: translateY(-0.6px); } }
        .cc-logo .cc-l, .cc-logo .cc-r, .cc-logo .cc-s { transform-box: fill-box; transform-origin: center; }
        .cc-anim .cc-l { animation: cc-lbracket 2.4s ease-in-out infinite; }
        .cc-anim .cc-r { animation: cc-rbracket 2.4s ease-in-out infinite; }
        .cc-anim .cc-s { animation: cc-slash 2.4s ease-in-out infinite; }
        .cc-logo:hover .cc-l, .cc-logo:hover .cc-r, .cc-logo:hover .cc-s { animation-duration: 0.9s; }
        @media (prefers-reduced-motion: reduce){
          .cc-anim .cc-l, .cc-anim .cc-r, .cc-anim .cc-s { animation: none !important; }
        }
      `}</style>
      <defs>
        <linearGradient id={`cc-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00D4FF" />
          <stop offset="100%" stopColor="#00FF88" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="8" fill={`url(#cc-${id})`} />
      <g stroke="#0D1117" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path className="cc-l" d="M12 11 L7.5 16 L12 21" />
        <path className="cc-r" d="M20 11 L24.5 16 L20 21" />
        <path className="cc-s" d="M17.5 9.5 L14.5 22.5" />
      </g>
    </svg>
  );
}
