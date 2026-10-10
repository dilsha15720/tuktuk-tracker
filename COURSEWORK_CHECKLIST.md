# Tuk Tracker Coursework Checklist

## Implemented in the API

- REST resources for routes, tuk-tuks, master data, current locations, and movement history.
- Paginated, filtered, searchable, sortable Tuk listing with conditional GET support.
- Operational Tuk statistics grouped by status.
- JWT login with `admin` and `operator` roles.
- Admin-only vehicle and route management.
- Operator/admin location updates with persisted history pings.
- Province, district, and police-station filtering endpoints.
- OpenAPI 3 Swagger UI at `/api-docs`.
- `/health` endpoint for deployment checks.
- Helmet security headers, rate limiting, bounded JSON requests, and request logging.
- MongoDB indexes for location history and administrative lookups.
- Idempotent coursework seed and validation commands.

## Coursework data evidence

Run these commands after correcting the Atlas URI:

```bash
npm run seed
npm run validate:simulation
```

Expected minimums:

- 9 provinces
- 25 districts
- 20 police stations
- 200 registered tuk-tuks
- 5,600 simulation location pings across seven days

## Demo sequence

1. Open `/health` and `/api-docs` on the deployed URL.
2. Log in through `POST /api/auth/login` as the configured admin.
3. Use the bearer token in Swagger Authorize.
4. List provinces, districts, and police stations.
5. List tuk-tuks with status or route filters.
6. Submit a location update and open the tuk history endpoint.
7. Query history with `from`, `to`, and `limit` parameters.
8. Demonstrate Tuk filtering, pagination, sorting, and `304 Not Modified` caching.
9. Demonstrate that an operator can update location but cannot delete a tuk.

## User-owned submission tasks

- Replace `YOUR_STUDENT_ID_HERE` in `README.md`.
- Rotate the MongoDB password previously exposed in chat.
- Set the corrected `MONGODB_URI` in local `.env` and Render secrets.
- Add the Render service URL and Swagger URL to the report appendix.
- Add the lecturer as a GitHub collaborator.
- Write the report in your own words and explain the implementation in the viva.
