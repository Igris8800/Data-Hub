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

## Deferred / Backlog
- P0: Actual Razorpay keys → real subscription flow
- P1: Expand question bank to ~1000/module (AI generator can help)
- P1: Certificate PDF download for premium users
- P1: Excel Online / Power BI iframe deep embed (currently link-out)
- P2: Drag-and-drop, debug-the-error and image-based question types
- P2: Adaptive difficulty (auto-move to harder Qs after 8/10)
- P2: Badges/RankX system with real award logic
