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
            "correct": payload.correct,
            "difficulty": payload.difficulty,
            "updated_at": now.isoformat(),
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

# --- AI Question Generation (Premium only) ---
@api_router.post("/ai/generate-question")
async def generate_question(payload: AIQuestionRequest, request: Request):
    user = await require_user(request)
    if not user.get("is_premium"):
        raise HTTPException(status_code=402, detail="Premium subscription required")

    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM library not available: {e}")

    system = (
        "You generate practice questions for a Data Analyst learning platform. "
        "Output STRICT JSON with keys: title, prompt, type (mcq|code|fill), "
        "options (list of 4 for mcq else empty), correct_answer (string), hint, solution, difficulty."
    )
    prompt = (
        f"Generate one {payload.difficulty} question for module '{payload.module}'."
        + (f" Topic: {payload.topic}." if payload.topic else "")
        + " Return only JSON."
    )
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"gen_{user['user_id']}_{uuid.uuid4().hex[:8]}",
        system_message=system,
    ).with_model("anthropic", "claude-sonnet-4-6")

    text = ""
    async for ev in chat.stream_message(UserMessage(text=prompt)):
        if hasattr(ev, "content"):
            text += ev.content
    # Extract JSON
    import json, re
    m = re.search(r"\{.*\}", text, re.S)
    if not m:
        raise HTTPException(status_code=500, detail="AI failed to produce JSON")
    try:
        data = json.loads(m.group(0))
    except Exception:
        raise HTTPException(status_code=500, detail="AI returned invalid JSON")
    data["id"] = f"ai_{uuid.uuid4().hex[:10]}"
    return data

# --- Razorpay (payments) ---
@api_router.get("/payments/config")
async def payments_config():
    return {
        "razorpay_key_id": RAZORPAY_KEY_ID,
        "configured": bool(RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET),
        "plans": {
            "monthly": {"amount": 49900, "currency": "INR", "label": "₹499 / month"},
            "yearly": {"amount": 299900, "currency": "INR", "label": "₹2999 / year"},
        },
    }

@api_router.post("/payments/order")
async def create_order(payload: RazorpayOrderRequest, request: Request):
    user = await require_user(request)
    if not (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET):
        raise HTTPException(status_code=503, detail="Razorpay not configured yet. Please contact support.")
    import razorpay
    rzp = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    amount = 49900 if payload.plan == "monthly" else 299900
    order = rzp.order.create({
        "amount": amount,
        "currency": "INR",
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
    return {"order_id": order["id"], "amount": amount, "currency": "INR", "key_id": RAZORPAY_KEY_ID}

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

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
