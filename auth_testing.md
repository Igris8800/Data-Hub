# Emergent OAuth Testing Playbook (Data Hub)

## Test User & Session (JWT path)
Signup endpoint creates the JWT bearer token — no Google needed:

```bash
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d= -f2)
TOKEN=$(curl -s -X POST "$API_URL/api/auth/signup" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"qa+$(date +%s)@ex.com\",\"password\":\"TestPass!234\",\"name\":\"QA\"}" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
curl -s "$API_URL/api/auth/me" -H "Authorization: Bearer $TOKEN"
```

## Simulate an Emergent Google Session (only if backend was patched with a mock)
There's no need to hit Emergent's live OAuth for e2e — assert instead that the frontend
correctly redirects to `https://auth.emergentagent.com/?redirect=<origin>/` when
the "Continue with Google" button is clicked.
