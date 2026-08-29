# Data Hub — Product Requirements Document

## Original Problem Statement
A combined interactive learning and practice platform for aspiring data analysts covering Excel, SQL, Python, Power BI and Statistics. 5000 questions total (1000 per module), 20-25 free per module across all difficulty levels, rest gated behind a ₹499/month or ₹2999/year Razorpay subscription. In-browser SQL.js and Pyodide editors, roadmap page, XP/streak gamification, both JWT and Google (Emergent) auth, AI question generation via Claude Sonnet 4.5 (Emergent Universal LLM key).

## User Choices (from ask_human)
- AI question generation: Both — seed + Claude Sonnet 4.5 on-demand
- Payments: Razorpay (user will provide keys later)
- Auth: Both JWT (email/password) + Emergent Google Auth
- In-browser SQL.js + Pyodide: confirmed
- Scope for v1: Platform shell + 20-25 free questions per module + lock UI for rest

## Architecture
- **Frontend**: React + Tailwind + shadcn/ui + Framer Motion. SQL.js (CDN) for SQL runner, Pyodide (CDN) for Python runner.
- **Backend**: FastAPI + Motor (MongoDB). JWT for email/password auth, Emergent session_token for Google Auth. Razorpay SDK stubbed until keys provided.
- **Database**: MongoDB collections — `users`, `user_sessions`, `attempts`, `orders`, `newsletter`.
- **Design**: Dark navy/black (#0D1117) + electric blue (#00D4FF) + emerald green (#00FF88). Outfit / IBM Plex Sans / JetBrains Mono fonts.

## Modules & Free Question Counts (v1)
| Module    | Beginner | Intermediate | Advanced | Total free |
|-----------|----------|--------------|----------|-----------|
| Excel     | 9        | 9            | 7        | 25         |
| SQL       | 9        | 9            | 7        | 25         |
| Python    | 9        | 9            | 7        | 25         |
| Power BI  | 9        | 9            | 7        | 25         |
| Statistics| 9        | 9            | 7        | 25         |

Total ≈125 free seed questions. Locked pool per module: ~975.

## Endpoints (backend)
Auth: POST /api/auth/signup, /api/auth/login, /api/auth/session, GET /api/auth/me, POST /api/auth/logout
Progress: POST /api/progress, GET /api/progress
AI: POST /api/ai/generate-question (premium)
Payments: GET /api/payments/config, POST /api/payments/order, POST /api/payments/verify
Newsletter: POST /api/newsletter
Leaderboard: GET /api/leaderboard

## Pages (frontend)
/, /excel, /sql, /python, /powerbi, /stats, /roadmap, /profile, /leaderboard, auth callback via URL fragment.

## What's Implemented (2026-02-23)
- Homepage with hero, dashboard card, bento module grid, feature strip, AdSense placeholders
- 5 module pages (Excel/SQL/Python/Power BI/Statistics) with difficulty selector, sidebar, lock previews, upgrade modal every 5 solved
- In-browser SQL.js editor with 5 seed tables + expected-output validation
- In-browser Pyodide runner (pandas + numpy) with stdout comparison
- MCQ and Fill-in-the-blank question cards
- 90-day roadmap with 18 items, checkable, localStorage-persisted
- Auth: JWT email/password + Emergent Google OAuth callback handler
- Razorpay checkout wired (falls back to friendly "coming soon" when keys empty)
- Newsletter signup, leaderboard, profile page with per-module progress bars
- XP + streak + level (Rookie→Master) + total_solved sync via /api/progress
- AI question generator endpoint (Claude Sonnet 4.5, premium-gated)

## What's Implemented (2026-02-25 — Iteration 3)
- **SQL IDE mode toggle relocated** to a prominent hero position right next to the "SQL Practice" logo (top-left). ModeTab component now renders as a large 3-way segmented control (Learning / Practice / Interview) with the active mode's brand color (green / cyan / yellow) filling the tab.
- **Mode description badge strip** added below the top bar: `data-testid=mode-badge` reinforces "Learning Mode · Sequential · hints allowed" / "Practice Mode · Jump around · full toolkit" / "Interview Mode · 5-min timer · no hints or solution".
- **Company logos**: Amazon / Netflix / Uber / Google / Meta now use real brand SVGs from cdn.simpleicons.org (`logoUrl` per company). Selected company shows an outer boxShadow glow in the brand color.
- **Question bank expanded to 45 questions/module** across Excel, SQL, Python, Statistics, Power BI (17 beginner / 17 intermediate / 11 advanced), up from 25/module. Total seed questions: 225.
- **Verified**: testing agent iteration_3.json — 100% (9/9 review checks pass).

## What's Implemented (2026-02-24 — Iteration 2)
- **AI question bank growth**: `/api/ai/generate-question` (un-gated for now, TODO re-gate to premium once Razorpay live) generates questions via Claude Sonnet 4.5 and persists them in `db.ai_questions` with hash-based dedup. `/api/questions/{module}` returns the growing bank.
- **Frontend "Grow bank with AI (+3)" button** on every module page — appends fresh AI questions into the sidebar with ★ marker.
- **PDF certificate generator** at `/api/certificate/{module}` using reportlab. Landscape A4 with brand colors, cert ID, XP, level. Threshold: 20 correct answers in that module.
- **Profile certificate downloads**: per-module button (data-testid `cert-download-<key>`) shows progress toward threshold and downloads PDF when unlocked.
- **Adaptive difficulty routing**: consecutive-correct streak per (module, difficulty) tracked in localStorage `dh_streak_<module>_<difficulty>`. After 5 in a row, a Sonner toast prompts the user to advance to the next difficulty with a one-tap action.
- **Adaptive backend endpoint** `/api/adaptive/{module}` returns rolling last-10 accuracy per difficulty and a `recommend` next level.
- **Profile bug fix**: loading state respected so direct-URL / hard-reload of /profile no longer redirects logged-in users to home.

## Deferred / Backlog
- P0: Actual Razorpay keys → real subscription flow
- P1: Expand question bank to ~1000/module (AI generator can help)
- P1: Certificate PDF download for premium users
- P1: Excel Online / Power BI iframe deep embed (currently link-out)
- P2: Drag-and-drop, debug-the-error and image-based question types
- P2: Adaptive difficulty (auto-move to harder Qs after 8/10)
- P2: Badges/RankX system with real award logic
