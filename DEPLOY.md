# Deploying Data Hub (no Emergent)

Frontend → Vercel · Backend → Render · Database → MongoDB Atlas. All free tiers.

## 1. MongoDB Atlas (database)
1. https://cloud.mongodb.com → create a free M0 cluster.
2. Database Access → add a user (password auth). Network Access → allow 0.0.0.0/0 (Render's IPs vary).
3. Connect → Drivers → copy the connection string; replace <password>.

## 2. Render (backend)
1. https://render.com → New → **Blueprint** → pick `Igris8800/Data-Hub` (uses `render.yaml`).
2. Fill the env vars it asks for: `MONGO_URL` (from Atlas), `CORS_ORIGINS` (your Vercel URL, no trailing slash).
   Leave Razorpay blank until you have keys.
3. Deploy. Your API URL looks like `https://datahub-api.onrender.com`. Check `https://…/api/health` → `{"ok":true}`.
   Free tier sleeps after 15 min idle; the first request after that takes ~30 s.

## 3. Vercel (frontend)
Project → Settings → Environment Variables → add `REACT_APP_BACKEND_URL` = the Render URL (no trailing slash) → Redeploy.

## Optional
- `REACT_APP_GOOGLE_AUTH=1` re-enables the Google button (needs a non-Emergent OAuth flow first).
- Razorpay: set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` on Render to enable checkout.
