import React from "react";

// Crazycoder logo mark — on load the "</>" draws itself stroke-by-stroke (like it's being coded),
// then settles into the logo with a gentle idle breathing. Hover replays a quick pulse.
// Respects prefers-reduced-motion (shows the final logo, no motion).
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
        .cc-logo .cc-tile { transform-box: fill-box; transform-origin: center; }
        .cc-logo .stroke { transform-box: fill-box; transform-origin: center; }

        /* --- intro: tile pops in, then each stroke "draws" left→right like typing code --- */
        @keyframes cc-tile-in {
          0%   { transform: scale(.6) rotate(-8deg); opacity: 0; }
          60%  { transform: scale(1.06) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        @keyframes cc-draw { from { stroke-dashoffset: var(--len); } to { stroke-dashoffset: 0; } }
        /* --- idle: gentle breathing after the draw completes --- */
        @keyframes cc-l-breathe { 0%,100%{ transform: translateX(0);} 50%{ transform: translateX(-1.2px);} }
        @keyframes cc-r-breathe { 0%,100%{ transform: translateX(0);} 50%{ transform: translateX(1.2px);} }
        @keyframes cc-s-breathe { 0%,100%{ opacity:1;} 50%{ opacity:.6;} }
        /* blinking cursor that runs during the "typing" then fades */
        @keyframes cc-caret { 0%,100%{ opacity:0;} 45%{ opacity:0;} 46%,74%{ opacity:1;} 75%{ opacity:0;} }

        .cc-anim .cc-tile { animation: cc-tile-in .55s cubic-bezier(.34,1.56,.64,1) both; }

        .cc-anim .stroke {
          stroke-dasharray: var(--len);
          stroke-dashoffset: var(--len);
        }
        .cc-anim .cc-l { --len: 14; }
        .cc-anim .cc-s { --len: 14; }
        .cc-anim .cc-r { --len: 14; }

        /* after drawing, kick into the idle breathing (delays line up with each draw finishing) */
        .cc-anim .cc-l { animation: cc-draw .5s ease .35s forwards, cc-l-breathe 2.6s ease-in-out 1.6s infinite; }
        .cc-anim .cc-s { animation: cc-draw .5s ease .70s forwards, cc-s-breathe 2.6s ease-in-out 1.6s infinite; }
        .cc-anim .cc-r { animation: cc-draw .5s ease 1.05s forwards, cc-r-breathe 2.6s ease-in-out 1.6s infinite; }

        .cc-anim .cc-caret { animation: cc-caret 1.6s steps(1) 1 both; }

        /* hover: quick re-pulse */
        .cc-logo:hover .cc-l { animation: cc-l-breathe .8s ease-in-out infinite; }
        .cc-logo:hover .cc-r { animation: cc-r-breathe .8s ease-in-out infinite; }
        .cc-logo:hover .cc-s { animation: cc-s-breathe .8s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce){
          .cc-anim .cc-tile, .cc-anim .stroke, .cc-anim .cc-caret { animation: none !important; stroke-dashoffset: 0 !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
      <defs>
        <linearGradient id={`cc-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00D4FF" />
          <stop offset="100%" stopColor="#00FF88" />
        </linearGradient>
      </defs>
      <rect className="cc-tile" x="1" y="1" width="30" height="30" rx="8" fill={`url(#cc-${id})`} />
      <g stroke="#0D1117" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path className="stroke cc-l" d="M12 11 L7.5 16 L12 21" />
        <path className="stroke cc-s" d="M17.5 9.5 L14.5 22.5" />
        <path className="stroke cc-r" d="M20 11 L24.5 16 L20 21" />
      </g>
      {/* typing caret that blinks during the draw */}
      <rect className="cc-caret" x="25.5" y="12" width="1.6" height="8" rx="0.8" fill="#0D1117" />
    </svg>
  );
}
