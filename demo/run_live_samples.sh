#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
BASE_URL="${BASE_URL:-http://localhost:5000}"
OUTDIR="$ROOT/demo"
mkdir -p "$OUTDIR"

echo "Testing API at $BASE_URL"

# Check server is up
if ! curl -sS "$BASE_URL/" >/dev/null 2>&1; then
  echo "ERROR: Server not reachable at $BASE_URL. Start server with 'npm start' and retry." >&2
  exit 2
fi

# Login to get JWT
LOGIN_RESP=$(curl -sS -X POST "$BASE_URL/api/auth/login" -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' || true)
if echo "$LOGIN_RESP" | grep -q 'token' >/dev/null 2>&1; then
  JWT=$(echo "$LOGIN_RESP" | sed -n 's/.*"token"\s*:\s*"\([^"]*\)".*/\1/p')
  echo "Obtained JWT token (length ${#JWT})"
else
  echo "WARN: Could not obtain JWT token. Response:" >&2
  echo "$LOGIN_RESP" | sed -n '1,200p' >&2
  JWT=""
fi

# helper to save JSON prettified when jq present
save_json(){
  local url="$1"; local out="$2"
  if [ -n "$JWT" ]; then
    RESP=$(curl -sS -H "Authorization: Bearer $JWT" "$url" || true)
  else
    RESP=$(curl -sS "$url" || true)
  fi
  if command -v jq >/dev/null 2>&1; then
    echo "$RESP" | jq . >"$out"
  else
    echo "$RESP" >"$out"
  fi
  echo "Saved $url -> $out"
}

save_json "$BASE_URL/api/tuks" "$OUTDIR/sample_tuks.json"
save_json "$BASE_URL/api/routes" "$OUTDIR/sample_routes.json"

echo "Done. Check $OUTDIR for sample_*.json"
