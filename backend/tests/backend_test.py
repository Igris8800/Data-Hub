"""
Data Hub backend API tests.
Covers auth (signup/login/me), progress + XP, leaderboard, payments config/order,
AI generation gates, and newsletter.
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://data-mastery-hub-4.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

TS = int(time.time())
EMAIL = f"qa+datahub-{TS}-{uuid.uuid4().hex[:6]}@example.com"
PASSWORD = "TestPass!234"
NAME = "QA Analyst"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth(session):
    r = session.post(f"{API}/auth/signup", json={"email": EMAIL, "password": PASSWORD, "name": NAME}, timeout=30)
    assert r.status_code == 200, f"signup failed: {r.status_code} {r.text}"
    data = r.json()
    return {"token": data["token"], "user": data["user"]}


# ---------- Health ----------
class TestHealth:
    def test_api_root(self, session):
        r = session.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        assert r.json().get("status") == "ok"


# ---------- Auth: Signup / Login / Me ----------
class TestAuth:
    def test_signup_success(self, auth):
        assert isinstance(auth["token"], str) and len(auth["token"]) > 20
        u = auth["user"]
        assert u["email"] == EMAIL
        assert u["name"] == NAME
        assert u["xp"] == 0
        assert u["streak"] == 0
        assert u["level"] == "Rookie"
        assert u["total_solved"] == 0
        assert u["is_premium"] is False
        assert "user_id" in u

    def test_signup_duplicate_rejected(self, session, auth):
        r = session.post(f"{API}/auth/signup", json={"email": EMAIL, "password": PASSWORD, "name": NAME}, timeout=15)
        assert r.status_code == 400

    def test_login_wrong_password(self, session):
        r = session.post(f"{API}/auth/login", json={"email": EMAIL, "password": "wrong-pass"}, timeout=15)
        assert r.status_code == 401

    def test_login_success(self, session, auth):
        r = session.post(f"{API}/auth/login", json={"email": EMAIL, "password": PASSWORD}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["user"]["email"] == EMAIL
        assert isinstance(data["token"], str)

    def test_me_requires_auth(self, session):
        r = session.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_me_with_bearer(self, session, auth):
        r = session.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {auth['token']}"}, timeout=15)
        assert r.status_code == 200
        u = r.json()
        assert u["email"] == EMAIL
        assert u["xp"] == 0


# ---------- Progress + XP ----------
class TestProgress:
    def test_progress_unauth(self, session):
        r = session.post(f"{API}/progress", json={"module": "stats", "question_id": "q1", "correct": True, "difficulty": "beginner"}, timeout=15)
        assert r.status_code == 401

    def test_progress_correct_grants_xp(self, session, auth):
        headers = {"Authorization": f"Bearer {auth['token']}"}
        r = session.post(f"{API}/progress", json={"module": "stats", "question_id": "stats_q_test1", "correct": True, "difficulty": "beginner"}, headers=headers, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["xp_gained"] == 10
        assert data["user"]["xp"] >= 10
        assert data["user"]["total_solved"] >= 1

    def test_progress_idempotent_correct(self, session, auth):
        """Re-submitting the same correct answer must NOT double-count XP."""
        headers = {"Authorization": f"Bearer {auth['token']}"}
        # Get current xp
        me = session.get(f"{API}/auth/me", headers=headers, timeout=15).json()
        before_xp = me["xp"]
        before_solved = me["total_solved"]
        r = session.post(f"{API}/progress", json={"module": "stats", "question_id": "stats_q_test1", "correct": True, "difficulty": "beginner"}, headers=headers, timeout=15)
        assert r.status_code == 200
        assert r.json()["xp_gained"] == 0
        me2 = session.get(f"{API}/auth/me", headers=headers, timeout=15).json()
        assert me2["xp"] == before_xp
        assert me2["total_solved"] == before_solved

    def test_progress_advanced_xp(self, session, auth):
        headers = {"Authorization": f"Bearer {auth['token']}"}
        r = session.post(f"{API}/progress", json={"module": "sql", "question_id": "sql_adv_1", "correct": True, "difficulty": "advanced"}, headers=headers, timeout=15)
        assert r.status_code == 200
        assert r.json()["xp_gained"] == 30

    def test_get_progress(self, session, auth):
        headers = {"Authorization": f"Bearer {auth['token']}"}
        r = session.get(f"{API}/progress", headers=headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "modules" in data
        assert "stats" in data["modules"]
        assert data["modules"]["stats"]["solved"] >= 1


# ---------- Leaderboard ----------
class TestLeaderboard:
    def test_leaderboard_public(self, session, auth):
        r = session.get(f"{API}/leaderboard", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        if len(data) >= 2:
            for i in range(len(data) - 1):
                assert data[i]["xp"] >= data[i + 1]["xp"], "leaderboard not sorted by xp desc"
        # each row shape
        if data:
            row = data[0]
            for k in ("rank", "name", "xp", "level", "streak", "solved"):
                assert k in row


# ---------- Payments ----------
class TestPayments:
    def test_config(self, session):
        r = session.get(f"{API}/payments/config", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["configured"] is False
        assert data["plans"]["monthly"]["amount"] == 49900
        assert data["plans"]["yearly"]["amount"] == 299900

    def test_order_returns_503_when_unconfigured(self, session, auth):
        headers = {"Authorization": f"Bearer {auth['token']}"}
        r = session.post(f"{API}/payments/order", json={"plan": "monthly"}, headers=headers, timeout=15)
        assert r.status_code == 503

    def test_order_requires_auth(self, session):
        r = session.post(f"{API}/payments/order", json={"plan": "monthly"}, timeout=15)
        assert r.status_code == 401


# ---------- AI Generate ----------
class TestAIGenerate:
    def test_ai_requires_auth(self, session):
        r = session.post(f"{API}/ai/generate-question", json={"module": "sql", "difficulty": "beginner"}, timeout=15)
        assert r.status_code == 401

    def test_ai_requires_premium(self, session, auth):
        headers = {"Authorization": f"Bearer {auth['token']}"}
        r = session.post(f"{API}/ai/generate-question", json={"module": "sql", "difficulty": "beginner"}, headers=headers, timeout=30)
        assert r.status_code == 402


# ---------- Newsletter ----------
class TestNewsletter:
    def test_newsletter_valid(self, session):
        r = session.post(f"{API}/newsletter", json={"email": f"nl-{TS}@example.com"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["ok"] is True

    def test_newsletter_invalid(self, session):
        r = session.post(f"{API}/newsletter", json={"email": "not-an-email"}, timeout=15)
        assert r.status_code == 422
