# Curl examples for Tuk Tracker API

Assumes server is running at http://localhost:5000

Get all routes:

```bash
curl -sS http://localhost:5000/api/routes | jq .
```

Get all tuks:

```bash
curl -sS http://localhost:5000/api/tuks | jq .
```

Get tuk by id:

```bash
curl -sS http://localhost:5000/api/tuks/<tukId> | jq .
```

Update tuk location (requires JWT token):

```bash
curl -X POST http://localhost:5000/api/tuks/<tukId>/location \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"latitude":6.9271,"longitude":79.8612}' | jq .
```

Admin login (get a token):

```bash
curl -sS -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | jq .
```

Bulk update locations (requires token):

```bash
curl -sS -X POST http://localhost:5000/api/locations/bulk-update \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '[{"busId":"BUS001","latitude":6.9271,"longitude":79.8612}]' | jq .
```
