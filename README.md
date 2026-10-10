# Tuk Tracker API

**Project:** RESTful API for Sri Lanka Police real-time tuk-tuk tracking and movement logging

**Student ID:** `COBSCCOMP241P-033`

**GitHub:** https://github.com/dilsha15720/tuktuk-tracker

## Overview

Tuk Tracker is a Node.js REST API for registering tuk-tuks, drivers, tracking devices, police jurisdictions, live locations, and historical movement pings. It supports HQ administrators, provincial officers, station officers, and device clients.

The API includes:

- Province, district, and police-station master data.
- Vehicle and driver CRUD with jurisdiction scoping.
- Device-key authentication for tracking devices.
- JWT access and refresh tokens for users.
- Current and historical vehicle locations.
- Pagination, filtering, sorting, field selection, and conditional GET caching.
- Audit logging for movement-history access.
- Swagger/OpenAPI documentation.
- Generated coursework simulation data and a live movement simulator.

## Stack

- Node.js 20
- JavaScript ES modules
- Express
- MongoDB and Mongoose
- JWT and bcrypt
- Joi validation
- Swagger UI Express and OpenAPI 3
- Jest, Supertest, and mongodb-memory-server
- ESLint and Prettier
- Render deployment with MongoDB Atlas

## Setup

Requirements:

- Node.js 20+
- MongoDB Atlas or local MongoDB
- npm

Install dependencies:

```bash
npm ci
```

Create the local environment file:

```bash
cp .env.example .env
```

Never commit `.env`, database passwords, bcrypt hashes, or `device-keys.json`.

## Environment Variables

Set these values in `.env` locally and in the Render dashboard:

```env
PORT=5000
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/tuk_tracker
JWT_SECRET=replace-with-a-long-secret
REFRESH_TOKEN_SECRET=replace-with-another-long-secret
JWT_EXPIRES_IN=8h
NODE_ENV=development
REQUIRE_MONGODB=true
CORS_ORIGINS=http://localhost:3000,http://localhost:5000
PUBLIC_URL=http://localhost:5000

ADMIN_USER=admin
ADMIN_PASS_HASH=replace-with-bcrypt-hash

OPERATOR_USER=device-001
OPERATOR_PASS_HASH=replace-with-bcrypt-hash
OPERATOR_STATION_ID=

PROVINCIAL_USER=provincial-officer
PROVINCIAL_PASS_HASH=replace-with-bcrypt-hash
PROVINCIAL_PROVINCE_ID=

STATION_USER=station-officer
STATION_PASS_HASH=replace-with-bcrypt-hash
STATION_ID=
STATION_DISTRICT_ID=
```

Use URL-encoded credentials in `MONGODB_URI`. Do not share passwords or full connection strings.

## Run the API

Development mode:

```bash
npm run dev
```

Production-style startup:

```bash
npm start
```

The server connects to MongoDB before listening. Health check:

```text
http://localhost:5000/health
```

Swagger UI:

```text
http://localhost:5000/api-docs
```

Canonical API prefix:

```text
/api/v1
```

Legacy `/api` aliases remain for older demonstration scripts.

## Main Endpoints

Authentication:

```text
POST /api/v1/auth/login
POST /api/v1/auth/refresh
```

Administration:

```text
GET /api/v1/provinces
GET /api/v1/provinces/:id/districts
GET /api/v1/districts
GET /api/v1/districts/:id/police-stations
```

Vehicles and drivers:

```text
GET|POST /api/v1/vehicles
GET|PATCH|DELETE /api/v1/vehicles/:id
GET|POST /api/v1/drivers
GET|PATCH|DELETE /api/v1/drivers/:id
```

Vehicle locations:

```text
GET /api/v1/vehicles/:id/location
GET /api/v1/vehicles/:id/locations?from=&to=
GET /api/v1/vehicles/locations/live?province=&district=
GET /api/v1/vehicles/locations/nearby?lat=&lng=&radius=
```

Device operations:

```text
POST|GET /api/v1/devices
PATCH /api/v1/devices/:id
POST /api/v1/devices/:deviceId/pings
POST /api/v1/devices/:deviceId/pings/batch
```

Device pings use the `X-Device-Key` header. A device key is returned only when a device is created or rotated.

## Coursework Seed Data

The full coursework seed creates:

- 9 provinces.
- 25 districts.
- 20 police stations.
- 3 demo role users.
- 220 vehicles.
- 220 drivers and devices.
- Seven days of active-hours movement history.
- JSON exports in `data/`.
- Raw device keys in ignored `device-keys.json`.

Run the seed:

```bash
npm run seed:coursework
```

Regenerate all coursework collections:

```bash
npm run seed:coursework -- --reset
```

The reset flag deletes the seeded collections before rebuilding them. Use it intentionally.

## Simulator

After running the coursework seed, start continuous simulated device movement:

```bash
API_URL=http://localhost:5000 PING_INTERVAL_SECONDS=30 npm run simulate
```

Run one tick only:

```bash
API_URL=http://localhost:5000 npm run simulate -- --once
```

The simulator reads `device-keys.json` and stores positions in ignored `simulator/state.json`.

## Tests and Quality Checks

Run the complete test suite:

```bash
npm test
```

Run lint:

```bash
npm run lint
```

Check formatting:

```bash
npm run format:check
```

Validate the coursework database counts:

```bash
npm run validate:simulation
```

## Deployment

### MongoDB Atlas

1. Create an Atlas cluster and database user.
2. Add your local IP and Render access under Network Access.
3. Set `MONGODB_URI` in Render without committing it to GitHub.
4. Seed the persistent database from a trusted machine with `npm run seed:coursework`.

### Render

This repository includes `render.yaml`.

1. Open Render and choose **New > Blueprint**.
2. Select this GitHub repository and the `main` branch.
3. Set all environment variable values in the Render dashboard.
4. Deploy the service.

Deployed API URL:

```text
https://YOUR-RENDER-SERVICE.onrender.com
```

Health URL:

```text
https://YOUR-RENDER-SERVICE.onrender.com/health
```

Swagger URL:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api-docs
```

OpenAPI source:

```text
src/docs/openapi.yaml
```

## Coursework Submission Checklist

- Replace `STUDENT_ID_HERE` with your actual student ID.
- Add the lecturer as a GitHub collaborator.
- Deploy the API publicly; do not submit localhost URLs.
- Add the deployed API URL and Swagger URL to the report appendix.
- Include the GitHub repository URL.
- Run the seed and validation commands and keep the output as evidence.
- Explain the architecture, security, database design, simulator, and tests in the viva.
- Write the report in your own words and follow the institution's academic-integrity requirements.
