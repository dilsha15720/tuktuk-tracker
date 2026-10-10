# NB6007CEM Web API Development Coursework Report

## Real-Time Three-Wheeler Tracking and Movement Logging API

**Student name:** SACHINI DILSHA PANDITHARATHNA<br>
**Student ID:** COBSCCOMP241P-033<br>
**Course:** BSc (Hons) Computing<br>
**Module:** NB6007CEM - Web API Development<br>
**Batch:** 24.2P<br>
**Repository:** https://github.com/dilsha15720/tuktuk-tracker<br>
**Report status:** Draft for student verification and personal editing

> This report is a technical draft based on the implemented project. Before submission, the student should verify every claim against the deployed service, rewrite sections in their own words, add the final deployment links, and ensure the report follows the institution's academic-integrity requirements.

## Executive Summary

This project implements Tuk Tracker, a RESTful API for a Sri Lanka Police real-time three-wheeler tracking and movement logging system. The business case requires an API that can register vehicles, drivers, tracking devices, administrative jurisdictions, and GPS movement events. The API also needs to support authorized police users at headquarters, provincial, and station levels, together with secure device clients that submit location pings.

The solution uses Node.js 20, JavaScript ES modules, Express, MongoDB, and Mongoose. It exposes a versioned API under `/api/v1`, documents the contract with OpenAPI 3 and Swagger UI, and protects operations with JWT access tokens, refresh tokens, role authorization, and device API keys. MongoDB models separate current location data from historical pings. This allows fast live-location reads while retaining an append-only movement record for investigations.

The project includes a generated demonstration dataset containing nine provinces, twenty-five districts, twenty police stations, 220 vehicles, drivers and devices, and seven days of simulated movement data. A simulator can continue sending device pings through the batch API. Automated tests use Jest, Supertest, and mongodb-memory-server to verify authentication, authorization, validation, CRUD operations, pagination, duplicate handling, jurisdiction scoping, conditional GET responses, and device authentication.

The implementation is designed to reach a strong level against the assessment rubric because it demonstrates REST resource design, security controls, modular code, persistent data, filtering, sorting, pagination, conditional requests, tests, deployment configuration, and operational documentation.

## 1. Business Requirements Analysis

### 1.1 Business context

Sri Lanka Police and related law-enforcement agencies need centralized visibility of registered three-wheelers. The first stage of the proposed system focuses on vehicle visibility and investigative logging rather than a mobile application or a complete police information system. The API must accept GPS-based location pings from tracking devices and make current and historical movement information available to authorized users.

The system is deliberately implemented as an API-only solution. A client application is not required for the coursework. Swagger UI, curl, Postman, and the simulator provide practical evidence of server-client communication and asynchronous data retrieval. This keeps the implementation within the stated scope while still demonstrating the functionality expected from a real backend.

### 1.2 Stakeholders

The main stakeholders are:

- **HQ administrators:** manage national data, vehicles, users, devices, and operational oversight.
- **Provincial officers:** view and manage resources within a province.
- **Station officers:** view resources within an assigned district or station and investigate movement history.
- **Tracking devices and tuk-tuk operators:** submit authenticated location updates.
- **System operators:** deploy the service, configure MongoDB Atlas, monitor health, and manage secrets.
- **Course assessor:** evaluates REST design, security, architecture, implementation quality, version control, testing, deployment, and report quality.

### 1.3 Functional requirements

The API provides the following functional capabilities:

1. Authenticate users and issue access and refresh tokens.
2. Authorize requests according to HQ, provincial, and station roles.
3. Register provinces, districts, police stations, vehicles, drivers, and devices.
4. Create, read, update, and delete vehicles and drivers.
5. Create and manage device credentials without storing raw API keys.
6. Submit one device location ping or a batch of up to 100 pings.
7. Reject pings outside Sri Lankan latitude and longitude limits.
8. Reject pings more than five minutes in the future.
9. Skip duplicate pings using a unique vehicle/timestamp index.
10. Return a vehicle's last-known location.
11. Query a vehicle's historical movement within a maximum seven-day window.
12. View the latest locations for a province or district jurisdiction.
13. Search nearby vehicles using a MongoDB 2dsphere index.
14. Provide pagination, sorting, filtering, field selection, ETags, and 304 responses.
15. Record audit entries whenever movement history is accessed.
16. Provide Swagger documentation, a health endpoint, seed scripts, and a CLI simulator.

### 1.4 Non-functional requirements

The API uses a modular structure with routes, controllers, services, models, middleware, utilities, configuration, database scripts, documentation, tests, and simulator code. Secrets are supplied through environment variables and are not committed. Request bodies, query strings, and route parameters are sanitized against MongoDB operator injection. Joi validates input before controllers execute. Password hashes and device API-key hashes are excluded from normal responses.

The service is stateless at the HTTP layer because authentication uses signed JWTs. MongoDB indexes support jurisdiction filtering, vehicle lookup, history queries, uniqueness, and geographic search. The application can run locally or on Render while using MongoDB Atlas for persistent storage.

## 2. Solution Architecture

### 2.1 High-level architecture

The system uses a three-layer architecture:

```text
Client / Swagger / Simulator / Device
                    |
              Express API
     Middleware -> Routes -> Controllers
                    |
                Services
                    |
              Mongoose Models
                    |
               MongoDB Atlas
```

`app.js` creates the Express application and registers security, parsing, sanitization, routes, Swagger, and error middleware. `server.js` is the runtime entry point. It connects to MongoDB before opening the HTTP port, which prevents the service from accepting traffic when production persistence is unavailable. The service uses the configured `PORT` environment variable.

The `/api/v1` router is the canonical public API. Legacy `/api` aliases remain temporarily for existing demonstration scripts, but new clients should use `/api/v1`.

### 2.2 Project organization

- `app.js`: Express application and middleware pipeline.
- `server.js`: MongoDB connection and HTTP startup.
- `src/routes`: HTTP resource definitions.
- `src/controllers`: request and response orchestration.
- `src/services`: reusable business and database operations.
- `src/models`: Mongoose schemas and indexes.
- `src/middleware`: validation, sanitization, authentication, auditing, and errors.
- `src/utils`: JWT, jurisdiction, caching, and error helpers.
- `src/config` and `src/db`: database configuration and database boundary.
- `src/docs/openapi.yaml`: OpenAPI 3 specification served through Swagger UI.
- `src/db/seed.js`: full coursework-scale seed generator.
- `simulator/run.js`: continuous device movement simulator.
- `tests`: automated API and integration tests.
- `data`: generated demonstration exports and simulation metadata.

### 2.3 Data architecture

The data model separates stable identities, jurisdiction ownership, current state, and historical events.

- **Province:** national administrative province.
- **District:** district linked to a province.
- **PoliceStation:** station linked to a district.
- **User:** authenticated human with a role and optional jurisdiction IDs.
- **Vehicle:** registered tuk-tuk with plate number, jurisdiction, driver, device, and status.
- **Driver:** driver identity that can be associated with a vehicle.
- **Device:** tracking device linked to a vehicle and protected by a hashed API key.
- **LocationPing:** append-only historical GeoJSON movement event.
- **VehicleLastLocation:** one current location document per vehicle.
- **AuditLog:** accountability record for sensitive actions such as history access.

`LocationPing` and `VehicleLastLocation` are intentionally separate. Historical pings can grow to millions of documents and must preserve every event for investigations. The current-location collection stays at one document per vehicle, enabling fast live-map reads without scanning history. Both collections retain jurisdiction IDs to avoid joins when applying province, district, or station filters.

## 3. REST API Design

The API uses plural nouns and standard HTTP methods. Collection operations use `GET` and `POST`; individual resources use `GET`, `PATCH`, and `DELETE`. Successful creation returns HTTP 201 and a `Location` header. Successful deletion returns 204. Invalid identifiers return 400, validation failures return 422, duplicate resources return 409, missing resources return 404, missing or invalid authentication returns 401, and insufficient permissions return 403.

Important resources include `/vehicles`, `/drivers`, `/devices`, `/provinces`, `/districts`, `/police-stations`, and location history resources. Vehicle listing supports page, limit, filtering, sorting, search, and field selection. The API also supports ETag and Last-Modified headers for read-heavy current-location endpoints. A client can send `If-None-Match` or `If-Modified-Since` and receive 304 when the content has not changed.

Device clients use `X-Device-Key`. Keys are generated from secure random bytes and only their SHA-256 hashes are stored. The plain key is returned once when a device is created or rotated. The device middleware identifies the device from its key prefix, compares hashes with a timing-safe operation, and attaches the device and vehicle ID to the request.

## 4. Security and Privacy Controls

JWT login uses bcrypt password hashes for database users and supports configured role accounts for coursework demonstrations. Access tokens contain the username, role, subject, and jurisdiction scope. Refresh tokens use a separate secret and can be exchanged for a new token pair. The authentication middleware verifies bearer tokens and returns a safe 401 response for missing, invalid, or expired tokens.

Role middleware enforces least privilege. HQ administrators have unrestricted access. Provincial officers are limited by province ID. Station officers are limited by district or station ID. Device credentials are separate from human user credentials and can be revoked without changing a user account.

Helmet sets security headers, CORS accepts only configured origins, and rate limiting protects the API. Login has a stricter rate limit than ordinary API traffic. The sanitizer rejects request keys beginning with `$` or containing a dot before they reach Mongoose queries. Joi validation strips unknown fields and bounds numeric, date, identifier, and enum values.

Central error middleware converts Joi, JWT, Mongoose validation, invalid ObjectId, and duplicate-key errors into a consistent response containing `status`, `code`, `message`, and `details`. Production responses do not include stack traces or internal database messages.

History access is audited. Each audit entry records the authenticated user, endpoint, query parameters, IP address, action, resource type, and timestamp. This supports the investigative purpose of the system and provides evidence of accountability in the demonstration.

## 5. Implementation and Simulation

### 5.1 Simulation data

The full coursework seed creates all nine provinces and twenty-five districts, with twenty police stations mapped to realistic districts. It creates 220 registered vehicles, drivers, and devices. It generates seven days of movement history before the current date. Location pings are written in batches of 5,000 to avoid oversized database operations.

The movement generator gives each vehicle a home district centre and random-walk radius. Vehicles generate pings during the active period from approximately 06:00 to 22:00. Speed varies during the day, with higher values around morning and evening peaks. At night vehicles are inactive. A subset of vehicles changes toward a neighbouring district centre during part of the simulation to provide anomaly examples for investigation and jurisdiction demonstrations.

Generated JSON files are written under `data/` for report evidence and repeatable demonstrations. Device keys are written to `device-keys.json`, which is ignored by Git because it contains credentials. The simulator reads these keys, remembers the previous local position in `simulator/state.json`, and posts batches at a configurable interval.

### 5.2 Seed and run commands

The implementation provides separate commands for the original Tuk demonstration and the full coursework dataset. The full dataset can be generated with `npm run seed:coursework`. The destructive `--reset` flag deletes seeded collections before regeneration and should be used only when intentional.

The server is started with `npm start`. The health endpoint is `/health`, and Swagger is available at `/api-docs`. The simulator can run continuously with an API URL and interval or run once for a short viva demonstration.

## 6. Testing and Verification

The project uses Jest, Supertest, and mongodb-memory-server. The test suite covers:

- Successful and failed login.
- Refresh-token rotation and invalid refresh-token rejection.
- Missing JWT and insufficient jurisdiction access.
- Vehicle and driver CRUD.
- Duplicate plate conflict responses.
- Invalid ObjectId responses.
- Joi validation and NoSQL injection rejection.
- Device creation, rotation, revocation, and invalid device keys.
- Single and batch pings with duplicate handling.
- Last-known location and chronological history.
- Seven-day history limits.
- Live jurisdiction filtering and nearby geographic queries.
- ETag and 304 conditional responses.
- Administration pagination and Link headers.
- Audit records for history access.

The latest local verification completed with 17 passing tests and zero ESLint errors or warnings. GitHub Actions runs `npm ci`, `npm run lint`, and `npm test` on Node 20. The workflow uses Ubuntu 22.04 for compatibility with mongodb-memory-server.

### 6.1 Evidence and quality decisions

The tests are intentionally written at the HTTP boundary rather than only testing isolated helper functions. This proves that routing, middleware order, validation, authentication, database operations, and response status codes work together. mongodb-memory-server gives each test suite an isolated MongoDB instance, so test data does not depend on the development Atlas database. The tests create representative province, district, station, vehicle, device, and location documents before exercising the endpoint.

The duplicate tests are particularly important for the tracking requirement. A device can resend a ping when a network acknowledgement is lost. The unique vehicle and timestamp index prevents duplicate history entries, while unordered insertion allows other pings in the same batch to succeed. The test verifies both accepted and duplicate counts. This demonstrates a practical reliability decision rather than only a happy-path implementation.

The conditional request tests also reflect an operational concern. Live location requests may be repeated frequently by a dashboard. ETag and Last-Modified headers allow clients to revalidate cheaply and receive a 304 response when a vehicle has not changed. The response body is hashed to create an ETag, while the newest `updatedAt` or `recordedAt` value becomes Last-Modified. Cache-Control requires authenticated clients to revalidate rather than treating sensitive operational data as permanently public.

### 6.2 Persistence and indexing rationale

Mongoose schemas validate field types and enforce the core integrity rules before MongoDB writes. Unique indexes protect plate numbers, licence numbers, device codes, and vehicle/timestamp combinations. Jurisdiction IDs are stored directly on vehicles and location documents because operational queries should not require repeated population joins. The history collection is indexed by vehicle and time, and by district and time, supporting both investigative searches and station-level filtering. The 2dsphere index supports nearby queries using GeoJSON points in the required `[longitude, latitude]` order.

The latest-location collection is updated using a timestamp comparison. An older or delayed ping cannot replace a newer live position. This protects the live view when devices reconnect and deliver buffered messages out of order. The historical collection still receives valid events, preserving an accurate audit trail even when the current position does not change.

### 6.3 Maintainability and viva explanation

The implementation separates HTTP concerns from database concerns. Routes describe URL and middleware composition. Controllers translate requests into responses and status codes. Services contain reusable business rules such as token creation, resource pagination, device-key generation, and movement ingestion. Models describe persistence constraints and indexes. Middleware handles cross-cutting concerns such as authentication, role checking, input sanitization, validation, auditing, and error formatting.

This structure is intentionally understandable for a viva. For example, a device ping can be explained as a sequence: the device key middleware verifies the SHA-256 digest with a timing-safe comparison; Joi checks coordinates, speed, heading, and timestamp; the service creates a GeoJSON LocationPing; unordered insertion skips duplicate timestamps; and VehicleLastLocation is updated only if the timestamp is newer. The same sequence maps directly to the coursework requirements and can be demonstrated using Swagger or the simulator.

### 6.4 Deployment and operational readiness

The application does not listen until the database connection has been attempted. This prevents a deployment from appearing healthy while silently writing to temporary memory. Render receives the same environment variable names used locally, but secret values are entered through the platform dashboard. The `/health` endpoint is suitable for Render's health check and confirms that the HTTP process is running; a production extension could additionally report database readiness separately.

The CI workflow checks out the repository on every push to `main` and every pull request targeting `main`. It installs the lockfile dependencies with `npm ci`, runs ESLint, and runs the integration test suite. Pinning the runner to Ubuntu 22.04 avoids system-library drift affecting the MongoDB memory-server binary. This gives the project repeatable quality evidence before deployment.

## 7. Deployment Appendix

### 7.1 MongoDB Atlas

A MongoDB Atlas cluster provides persistent storage. A database user must be created in Atlas Database Access. The deployment IP or development IP must be allowed through Network Access. The connection URI is stored only in environment variables and is never committed to GitHub.

### 7.2 Render

The repository includes `render.yaml` for a free Render web service. The build command is `npm ci`, the start command is `npm start`, and the health check path is `/health`. Secret values are configured in the Render dashboard rather than committed to the repository.

**Deployed API URL:**

```text
https://YOUR-RENDER-SERVICE.onrender.com
```

**Health check URL:**

```text
https://YOUR-RENDER-SERVICE.onrender.com/health
```

**Swagger UI URL:**

```text
https://YOUR-RENDER-SERVICE.onrender.com/api-docs
```

**OpenAPI source:**

```text
src/docs/openapi.yaml
```

### 7.3 GitHub and collaboration

**Repository:** https://github.com/dilsha15720/tuktuk-tracker<br>
**Lecturer collaborator:** Add the lecturer through GitHub repository Settings -> Collaborators.

## 8. Limitations and Future Work

The system uses HTTP location updates rather than WebSockets or server-sent events. A production dashboard would benefit from push notifications or a message broker. The in-memory fallback is useful for local tests but must never be used for production data. The coursework role accounts and configuration-based credentials should be replaced with a full identity-management service for a larger deployment.

Location history can grow quickly. MongoDB time-series collections, retention policies, archival storage, and stronger aggregation indexes should be evaluated at scale. Device key rotation and audit records should be integrated with an operational alerting system. Observability could be expanded with metrics, distributed tracing, structured log storage, and alerts for abnormal movement patterns.

## 9. Conclusion

Tuk Tracker provides a complete, modular REST API for the initial Sri Lanka Police three-wheeler tracking scenario. It addresses the coursework requirements through persistent MongoDB data, administrative jurisdiction modelling, secure user and device authentication, movement history, simulation data, validation, automated testing, OpenAPI documentation, CI, and deployment configuration. The remaining submission work is to complete the public deployment, replace deployment placeholders, add the lecturer as a collaborator, and ensure the final report is reviewed and personalized before submission.

## Academic Integrity Note

This report is a project documentation draft. The student must verify the technical claims, add final deployment evidence, and rewrite or edit the report in their own voice in accordance with the coursework announcement and academic-integrity requirements.
