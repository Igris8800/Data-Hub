from fastapi import FastAPI, APIRouter, HTTPException, Header, Depends, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import bcrypt
import jwt as pyjwt
import requests as pyrequests
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# --- Config ---
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ['JWT_SECRET']
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Data Hub API")
api_router = APIRouter(prefix="/api")

# --- Models ---
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserPublic(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    xp: int = 0
    level: str = "Rookie"
    streak: int = 0
    total_solved: int = 0
    is_premium: bool = False
    badges: List[str] = []

class ProgressUpdate(BaseModel):
    module: str  # excel|sql|python|stats|powerbi
    question_id: str
    correct: bool
    difficulty: str = "beginner"
    code: Optional[str] = None  # learner's last query / formula, restored when they return to the question

class AIQuestionRequest(BaseModel):
    module: str
    difficulty: str
    topic: Optional[str] = None

class RazorpayOrderRequest(BaseModel):
    plan: str  # monthly | yearly

class RazorpayVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

# --- Utils ---
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_jwt(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
        "iat": datetime.now(timezone.utc),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm="HS256")

def compute_level(xp: int) -> str:
    if xp >= 5000: return "Master"
    if xp >= 2000: return "Expert"
    if xp >= 800: return "Senior"
    if xp >= 200: return "Analyst"
    return "Rookie"

async def get_user_from_token(token: str) -> Optional[dict]:
    """Accepts either JWT (email/password) or Emergent session_token."""
    if not token:
        return None
    # Try JWT first
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        if user_id:
            user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
            if user:
                return user
    except Exception:
        pass
    # Try Emergent session_token
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if session:
        expires_at = session.get("expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at and expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at and expires_at < datetime.now(timezone.utc):
            return None
        user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
        return user
    return None

async def require_user(request: Request) -> dict:
    # Cookie first, then Authorization header
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    user = await get_user_from_token(token or "")
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

def user_to_public(user: dict) -> UserPublic:
    xp = user.get("xp", 0)
    return UserPublic(
        user_id=user["user_id"],
        email=user["email"],
        name=user.get("name", user["email"].split("@")[0]),
        picture=user.get("picture"),
        xp=xp,
        level=compute_level(xp),
        streak=user.get("streak", 0),
        total_solved=user.get("total_solved", 0),
        is_premium=user.get("is_premium", False),
        badges=user.get("badges", []),
    )

# --- Routes ---
@api_router.get("/")
async def root():
    return {"message": "Data Hub API", "status": "ok"}

# --- Auth: Email/Password ---
@api_router.post("/auth/signup")
async def signup(payload: SignupRequest):
    existing = await db.users.find_one({"email": payload.email.lower()}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": payload.email.lower(),
        "name": payload.name,
        "password_hash": hash_password(payload.password),
        "picture": None,
        "provider": "email",
        "xp": 0,
        "streak": 0,
        "last_active": datetime.now(timezone.utc).isoformat(),
        "total_solved": 0,
        "is_premium": False,
        "badges": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    token = create_jwt(user_id)
    return {"token": token, "user": user_to_public(user_doc).model_dump()}

@api_router.post("/auth/login")
async def login(payload: LoginRequest):
    user = await db.users.find_one({"email": payload.email.lower()}, {"_id": 0})
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_jwt(user["user_id"])
    return {"token": token, "user": user_to_public(user).model_dump()}

# --- Auth: Emergent Google Session Exchange ---
@api_router.post("/auth/session")
async def process_emergent_session(request: Request):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    # Call Emergent auth backend to exchange session_id
    try:
        r = pyrequests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
            timeout=10,
        )
        if r.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session_id")
        data = r.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auth exchange failed: {e}")

    email = data["email"].lower()
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        # update picture/name silently
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": data.get("name", existing["name"]), "picture": data.get("picture")}}
        )
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": email,
            "name": data.get("name", email.split("@")[0]),
            "picture": data.get("picture"),
            "provider": "google",
            "xp": 0,
            "streak": 0,
            "last_active": datetime.now(timezone.utc).isoformat(),
            "total_solved": 0,
            "is_premium": False,
            "badges": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user)

    session_token = data.get("session_token", uuid.uuid4().hex)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    resp = JSONResponse({
        "token": session_token,
        "user": user_to_public(user).model_dump(),
    })
    resp.set_cookie(
        "session_token", session_token,
        max_age=7 * 24 * 60 * 60,
        httponly=True, secure=True, samesite="none", path="/",
    )
    return resp

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await require_user(request)
    return user_to_public(user).model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request):
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    resp = JSONResponse({"ok": True})
    resp.delete_cookie("session_token", path="/")
    return resp

# --- Progress ---
@api_router.post("/progress")
async def update_progress(payload: ProgressUpdate, request: Request):
    user = await require_user(request)
    user_id = user["user_id"]
    now = datetime.now(timezone.utc)

    # Record attempt (idempotent per question)
    key = {"user_id": user_id, "module": payload.module, "question_id": payload.question_id}
    existing = await db.attempts.find_one(key, {"_id": 0})
    was_new = existing is None

    await db.attempts.update_one(
        key,
        {"$set": {
            # never downgrade a solved question to unsolved when a later attempt is wrong
            "correct": bool(payload.correct or (existing or {}).get("correct")),
            "difficulty": payload.difficulty,
            "updated_at": now.isoformat(),
            **({"code": payload.code[:20000]} if payload.code else {}),
        },
         "$setOnInsert": {"created_at": now.isoformat()},
         },
        upsert=True,
    )

    # Update XP + streak
    xp_gain = 0
    if payload.correct and (was_new or not existing.get("correct")):
        xp_gain = {"beginner": 10, "intermediate": 20, "advanced": 30}.get(payload.difficulty, 10)

    last_active = user.get("last_active")
    if isinstance(last_active, str):
        try:
            last_active = datetime.fromisoformat(last_active)
        except Exception:
            last_active = None
    streak = user.get("streak", 0)
    if last_active:
        if last_active.tzinfo is None:
            last_active = last_active.replace(tzinfo=timezone.utc)
        days_diff = (now.date() - last_active.date()).days
        if days_diff == 1:
            streak += 1
        elif days_diff > 1:
            streak = 1
        elif days_diff == 0 and streak == 0:
            streak = 1
    else:
        streak = 1

    total_solved = user.get("total_solved", 0)
    if payload.correct and (was_new or not existing.get("correct")):
        total_solved += 1

    new_xp = user.get("xp", 0) + xp_gain

    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {
            "xp": new_xp,
            "streak": streak,
            "total_solved": total_solved,
            "last_active": now.isoformat(),
        }},
    )
    updated = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": user_to_public(updated).model_dump(), "xp_gained": xp_gain}

@api_router.get("/progress")
async def get_progress(request: Request):
    user = await require_user(request)
    attempts = await db.attempts.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(5000)
    # Aggregate per module
    per_module: Dict[str, Dict[str, int]] = {}
    for a in attempts:
        m = a["module"]
        per_module.setdefault(m, {"solved": 0, "attempted": 0})
        per_module[m]["attempted"] += 1
        if a.get("correct"):
            per_module[m]["solved"] += 1
    return {"user": user_to_public(user).model_dump(), "modules": per_module, "attempts": attempts}

# --- AI Question Generation (currently un-gated — TODO: re-gate to premium once payments are live) ---
class AIGenerateBatch(BaseModel):
    module: str
    difficulty: str
    count: int = 1
    topic: Optional[str] = None

def _hash_q(module: str, prompt: str) -> str:
    import hashlib
    return hashlib.sha1(f"{module}::{prompt}".encode()).hexdigest()[:16]

async def _ai_generate_one(module: str, difficulty: str, topic: Optional[str]) -> dict:
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM library not available: {e}")

    system = (
        "You generate concise practice questions for a Data Analyst learning platform. "
        "Return STRICT JSON only (no markdown, no prose) with EXACTLY these keys: "
        "title (short string), prompt (question text), type ('mcq'|'fill'|'code'), "
        "options (array of 4 strings for mcq, else empty array), answer (correct answer as string; "
        "for mcq must exactly match one option), hint (one-line), solution (short explanation). "
        "Difficulty is inferred from context: beginner=easy fundamentals, intermediate=applied, advanced=interview-level."
    )
    prompt = (
        f"Generate ONE {difficulty} question for the '{module}' module."
        + (f" Focus topic: {topic}." if topic else "")
        + " Vary from typical textbook examples. Return only the JSON object."
    )
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"gen_{uuid.uuid4().hex[:10]}",
        system_message=system,
    ).with_model("anthropic", "claude-sonnet-4-6")

    text = ""
    async for ev in chat.stream_message(UserMessage(text=prompt)):
        if hasattr(ev, "content"):
            text += ev.content

    import json, re
    # Strip markdown code fences if present
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.M).strip()

    def _try_parse(s: str):
        # 1. Direct parse
        try:
            return json.loads(s)
        except Exception:
            pass
        # 2. Use raw_decode from first '{' — grabs first valid object even if trailing junk
        start = s.find("{")
        if start >= 0:
            try:
                dec = json.JSONDecoder()
                obj, _end = dec.raw_decode(s[start:])
                return obj
            except Exception:
                pass
        return None

    obj = _try_parse(cleaned)
    if obj is None:
        logger.warning(f"AI raw response (first 800 chars): {text[:800]!r}")
        raise HTTPException(status_code=500, detail="AI failed to produce JSON")

    q_id = f"ai-{module}-{_hash_q(module, obj.get('prompt',''))}"
    doc = {
        "id": q_id,
        "module": module,
        "difficulty": difficulty,
        "type": obj.get("type", "mcq"),
        "title": obj.get("title") or "AI Question",
        "prompt": obj.get("prompt") or "",
        "options": obj.get("options") or [],
        "answer": obj.get("answer") or obj.get("correct_answer") or "",
        "hint": obj.get("hint") or "",
        "solution": obj.get("solution") or "",
        "source": "ai",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    # Store (upsert on id)
    await db.ai_questions.update_one({"id": q_id}, {"$setOnInsert": doc}, upsert=True)
    return doc

@api_router.post("/ai/generate-question")
async def generate_question(payload: AIGenerateBatch, request: Request):
    # TODO: When payments go live, re-add: if not user.get("is_premium"): raise 402
    _ = await require_user(request)
    count = max(1, min(payload.count, 5))
    results = []
    for _i in range(count):
        try:
            results.append(await _ai_generate_one(payload.module, payload.difficulty, payload.topic))
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"AI gen failed: {e}")
    return {"generated": results, "total_in_bank": await db.ai_questions.count_documents({"module": payload.module, "difficulty": payload.difficulty})}

@api_router.get("/questions/{module}")
async def get_questions(module: str, difficulty: Optional[str] = None):
    """Public — returns AI-generated questions for the given module (already stored)."""
    q = {"module": module}
    if difficulty:
        q["difficulty"] = difficulty
    docs = await db.ai_questions.find(q, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"module": module, "questions": docs, "total": len(docs)}

# --- Adaptive difficulty helper ---
@api_router.get("/adaptive/{module}")
async def adaptive_progress(module: str, request: Request):
    """Returns rolling per-difficulty accuracy for the current user in the given module."""
    user = await require_user(request)
    attempts = await db.attempts.find(
        {"user_id": user["user_id"], "module": module}, {"_id": 0}
    ).sort("updated_at", -1).to_list(500)
    by_diff = {"beginner": [], "intermediate": [], "advanced": []}
    for a in attempts:
        d = a.get("difficulty", "beginner")
        if d in by_diff and len(by_diff[d]) < 10:
            by_diff[d].append(bool(a.get("correct")))
    def acc(arr):
        if not arr: return None
        return sum(1 for x in arr if x) / len(arr)
    return {
        "beginner_last10_accuracy": acc(by_diff["beginner"]),
        "intermediate_last10_accuracy": acc(by_diff["intermediate"]),
        "advanced_last10_accuracy": acc(by_diff["advanced"]),
        "recommend": (
            "advanced" if acc(by_diff["intermediate"]) and acc(by_diff["intermediate"]) >= 0.8 else
            "intermediate" if acc(by_diff["beginner"]) and acc(by_diff["beginner"]) >= 0.8 else
            None
        ),
    }

# --- Belt ranks (mirror of frontend/src/lib/belts.js) ---
BELTS = [
    ("White", 0, 0, 0), ("Yellow", 5, 0, 0), ("Orange", 15, 3, 0), ("Green", 30, 10, 0),
    ("Blue", 50, 20, 5), ("Purple", 70, 28, 15), ("Brown", 85, 33, 25), ("Black", 100, 33, 33),
]
def compute_belt(t: Dict[str, int]) -> Dict[str, Any]:
    total = sum(t.values()); medium = t.get("intermediate", 0); hard = t.get("advanced", 0)
    rank = 0
    for i, (_, need_total, need_med, need_hard) in enumerate(BELTS):
        if total >= need_total and medium >= need_med and hard >= need_hard:
            rank = i
        else:
            break
    return {"rank": rank, "name": BELTS[rank][0], "total": total, "medium": medium, "hard": hard}

# --- Skill report PDF (formerly "certificate") ---
@api_router.get("/certificate/{module}")
async def certificate(module: str, request: Request):
    from fastapi.responses import StreamingResponse
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import landscape, A4
    from reportlab.lib.colors import HexColor
    import io

    user = await require_user(request)

    # Verify user has solved enough (>= 20 of 25 free questions in this module)
    attempts = await db.attempts.find(
        {"user_id": user["user_id"], "module": module, "correct": True}, {"_id": 0}
    ).to_list(500)
    solved = len(attempts)
    tally = {"beginner": 0, "intermediate": 0, "advanced": 0}
    for a in attempts:
        if a.get("difficulty") in tally:
            tally[a["difficulty"]] += 1
    belt = compute_belt(tally)
    threshold = 20
    if solved < threshold or belt["rank"] < 3:
        raise HTTPException(status_code=400, detail=f"The skill report unlocks at Green belt (currently {belt['name']} belt, {solved} solved).")

    module_names = {
        "excel": "Excel Analytics",
        "sql": "SQL for Data",
        "python": "Python for Data Analysts",
        "powerbi": "Power BI",
        "stats": "Statistics",
    }
    module_label = module_names.get(module, module.title())

    buf = io.BytesIO()
    w, h = landscape(A4)
    c = canvas.Canvas(buf, pagesize=landscape(A4))

    # Background
    c.setFillColor(HexColor("#0D1117"))
    c.rect(0, 0, w, h, fill=1, stroke=0)

    # Border
    c.setStrokeColor(HexColor("#00D4FF"))
    c.setLineWidth(2)
    c.rect(20, 20, w - 40, h - 40, fill=0, stroke=1)
    c.setStrokeColor(HexColor("#00FF88"))
    c.setLineWidth(0.5)
    c.rect(30, 30, w - 60, h - 60, fill=0, stroke=1)

    # Header
    c.setFillColor(HexColor("#00D4FF"))
    c.setFont("Helvetica-Bold", 42)
    c.drawCentredString(w / 2, h - 110, "Skill Assessment Report")

    c.setFillColor(HexColor("#94A3B8"))
    c.setFont("Helvetica", 14)
    c.drawCentredString(w / 2, h - 145, "DATA HUB · Learn. Practice. Get Hired.")

    # Name
    c.setFillColor(HexColor("#F8FAFC"))
    c.setFont("Helvetica", 16)
    c.drawCentredString(w / 2, h - 210, "This is proudly presented to")

    c.setFont("Helvetica-Bold", 36)
    c.drawCentredString(w / 2, h - 260, user.get("name", "Analyst"))

    c.setStrokeColor(HexColor("#30363D"))
    c.setLineWidth(0.5)
    c.line(w / 2 - 180, h - 275, w / 2 + 180, h - 275)

    c.setFillColor(HexColor("#94A3B8"))
    c.setFont("Helvetica", 14)
    c.drawCentredString(w / 2, h - 310, f"has demonstrated {belt['name']} belt proficiency in")

    c.setFillColor(HexColor("#00FF88"))
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(w / 2, h - 350, f"{module_label} module")

    c.setFillColor(HexColor("#94A3B8"))
    c.setFont("Helvetica", 12)
    c.drawCentredString(w / 2, h - 390, f"Solved {solved} problems · {tally['beginner']} easy · {tally['intermediate']} medium · {tally['advanced']} hard · XP {user.get('xp', 0)}")

    # Footer
    cert_id = f"DH-{module.upper()}-{user['user_id'][-6:].upper()}-{datetime.now(timezone.utc).strftime('%Y%m%d')}"
    c.setFont("Helvetica", 10)
    c.drawString(60, 60, f"Report ID · {cert_id}")
    c.drawRightString(w - 60, 60, f"Issued · {datetime.now(timezone.utc).strftime('%d %b %Y')}")

    c.setFillColor(HexColor("#00D4FF"))
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(w / 2, 65, "datahub.app")

    c.showPage()
    c.save()
    buf.seek(0)

    filename = f"datahub-{module}-skill-report-{user['user_id'][-6:]}.pdf"
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

# --- Payments (USD) ---
# Server-side price map in cents — the client never sets the amount.
PLAN_PRICES = {
    "monthly": {"amount": 1000, "label": "$10 / month"},
    "yearly": {"amount": 3000, "label": "$30 / year"},
    "lifetime": {"amount": 10000, "label": "$100 lifetime"},
}

@api_router.get("/payments/config")
async def payments_config():
    return {
        "razorpay_key_id": RAZORPAY_KEY_ID,
        "configured": bool(RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET),
        "currency": "USD",
        "plans": {k: {"amount": v["amount"], "currency": "USD", "label": v["label"]} for k, v in PLAN_PRICES.items()},
    }

@api_router.post("/payments/order")
async def create_order(payload: RazorpayOrderRequest, request: Request):
    user = await require_user(request)
    if not (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET):
        raise HTTPException(status_code=503, detail="Razorpay not configured yet. Please contact support.")
    if payload.plan not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail="Unknown plan")
    import razorpay
    rzp = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    amount = PLAN_PRICES[payload.plan]["amount"]
    order = rzp.order.create({
        "amount": amount,
        "currency": "USD",
        "notes": {"user_id": user["user_id"], "plan": payload.plan},
    })
    await db.orders.insert_one({
        "order_id": order["id"],
        "user_id": user["user_id"],
        "plan": payload.plan,
        "amount": amount,
        "status": "created",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"order_id": order["id"], "amount": amount, "currency": "USD", "key_id": RAZORPAY_KEY_ID}

@api_router.post("/payments/verify")
async def verify_payment(payload: RazorpayVerifyRequest, request: Request):
    user = await require_user(request)
    if not (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET):
        raise HTTPException(status_code=503, detail="Razorpay not configured")
    import razorpay
    rzp = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    try:
        rzp.utility.verify_payment_signature({
            "razorpay_order_id": payload.razorpay_order_id,
            "razorpay_payment_id": payload.razorpay_payment_id,
            "razorpay_signature": payload.razorpay_signature,
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    await db.orders.update_one(
        {"order_id": payload.razorpay_order_id},
        {"$set": {"status": "paid", "payment_id": payload.razorpay_payment_id,
                   "paid_at": datetime.now(timezone.utc).isoformat()}},
    )
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"is_premium": True, "premium_since": datetime.now(timezone.utc).isoformat()}},
    )
    return {"ok": True}

# --- Newsletter ---
class NewsletterRequest(BaseModel):
    email: EmailStr

@api_router.post("/newsletter")
async def newsletter_signup(payload: NewsletterRequest):
    await db.newsletter.update_one(
        {"email": payload.email.lower()},
        {"$setOnInsert": {"email": payload.email.lower(),
                            "created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"ok": True}

# --- Business / team enquiries ---
class BusinessEnquiry(BaseModel):
    name: str
    email: EmailStr
    company: str = ""
    seats: int = 5
    message: str = ""

@api_router.post("/business/enquiry")
async def business_enquiry(payload: BusinessEnquiry):
    seats = max(1, int(payload.seats))
    # Per-seat annual price (USD) with volume discounts.
    if seats >= 100:
        per_seat = None  # custom pricing
    elif seats >= 50:
        per_seat = 18
    elif seats >= 20:
        per_seat = 21
    elif seats >= 5:
        per_seat = 24
    else:
        per_seat = 30
    doc = {
        "name": payload.name, "email": payload.email.lower(), "company": payload.company,
        "seats": seats, "message": payload.message,
        "quoted_per_seat": per_seat,
        "quoted_total": (per_seat * seats) if per_seat else None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.business_enquiries.insert_one(doc)
    return {"ok": True}

# --- Leaderboard ---
@api_router.get("/leaderboard")
async def leaderboard():
    users = await db.users.find({}, {"_id": 0, "name": 1, "xp": 1, "streak": 1, "total_solved": 1}).sort("xp", -1).to_list(20)
    result = []
    for i, u in enumerate(users):
        xp = u.get("xp", 0)
        result.append({
            "rank": i + 1,
            "name": u.get("name", "Analyst"),
            "xp": xp,
            "level": compute_level(xp),
            "streak": u.get("streak", 0),
            "solved": u.get("total_solved", 0),
        })
    return result

@api_router.get("/health")
async def health():
    return {"ok": True}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[o.strip() for o in os.environ.get('CORS_ORIGINS', '*').split(',') if o.strip()],
    # Also accept Vercel preview/deployment URLs (e.g. data-hub-abc123-user.vercel.app) and localhost dev servers.
    allow_origin_regex=os.environ.get('CORS_ORIGIN_REGEX', r"https://.*\.vercel\.app|http://localhost:\d+"),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
