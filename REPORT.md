# Tuk Tracker Project Report

**Student ID:** YOUR_STUDENT_ID_HERE

## Executive summary

This report documents the design, implementation, and deployment of the Tuk Tracker API — a RESTful backend service that enables real-time tracking and management of tuk/tuktuk vehicles (referred to as "buses" in the code base) and their routes. The system provides endpoints for listing and managing routes and vehicles, updating and retrieving vehicle locations, and a protected administrative interface for seeding and managing data. The project was developed using modern JavaScript (Node.js ES6+) and MongoDB for persistence. The primary goals were to produce a well-structured API that follows REST principles, demonstrate secure administrative actions via JWT-based authentication, and provide clear documentation via OpenAPI/Swagger for evaluation and integration purposes.

This report contains: a business requirements analysis that clarifies stakeholder needs and functional/non-functional requirements; a detailed description of the design and architecture decisions; implementation notes covering project organization and key modules; deployment and appendix with links for verification (Swagger URL, deployed API URL, and GitHub repository); and an assessment of limitations and scaling considerations.

## 1. Business Requirements Analysis

1.1 Stakeholders and roles

- Instructor / Course Assessor: verifies the coursework meets module learning outcomes and evaluation criteria.
- Student Developer: implements the solution, documents the work and submits the required report and codebase.
- System Administrator/Operator: deploys and maintains the API in production.
- Client/Application Developer: integrates the API into a front-end or a mobile tracking dashboard.

1.2 Problem statement and objectives

Transport operators and city administrators need a lightweight backend that allows them to track tuk/tuktuk vehicles in near-real-time, associate vehicles with routes, and access location history when necessary. The core objective is to provide a standards-compliant RESTful API that supports:

- CRUD operations for routes and vehicles.
- Secure authentication for administrative endpoints.
- Location updates for vehicles and retrieval of latest locations.
- A seed facility to load simulated data for demonstration and evaluation.

1.3 Functional requirements

- Public endpoints to list routes and vehicles and retrieve individual vehicle details.
- Protected endpoints (require admin JWT) for creating routes, creating vehicles, updating vehicle locations, and bulk location updates.
- Authentication endpoint returning JWT tokens for admin credentials.
- A seeding script that loads sample simulation data into the database.
- OpenAPI/Swagger documentation published at /api-docs for evaluation and integration.

1.4 Non-functional requirements

- Performance: the API should respond to typical read requests within 200–500ms on modest infrastructure for evaluation.
- Security: administrative endpoints protected with signed JWT tokens; secrets stored in environment variables.
- Maintainability: clear project structure and documentation to allow graders and future developers to understand and extend the system.
- Deployability: application should be easily containerized or hosted on cloud platforms (Render/Railway/Heroku) using environment variables for configuration.

## 2. Design and Architecture

2.1 High-level architecture

The system follows a classic three-tier architecture: client (front-end or API consumer), API server (Express.js application), and database (MongoDB). The API server provides REST endpoints, performs validation and authorization, and persists data in MongoDB using the Mongoose ODM.

Key components:

- API Server: Node.js + Express, handles routing, request parsing, authentication, and swagger documentation.
- Database: MongoDB, stores collections for vehicles, routes, and any audit/seed data.
- Seed/Simulation: a script that populates the DB with sample data used during demonstrations.

2.2 Data models

The main domain entities are:

- Vehicle (Bus): fields include id, registration, routeId, currentLocation (latitude, longitude, timestamp), and meta fields (status, capacity).
- Route: fields include id, name, stops (array of coordinates or named stops), schedule metadata.
- LocationUpdate: for write operations, includes latitude, longitude and timestamp. In implementation, location updates are stored as either the latest location on the vehicle document or as separate entries if persistent history is required.

2.3 Authentication and authorization

The app uses JWT for stateless authentication. Administrative credentials (username and password) are configured via environment variables for the coursework. The login endpoint validates the provided credentials and issues a signed JWT with a reasonable expiry (for example, 8 hours). Protected routes require the presence of a valid Authorization header with the Bearer token.

2.4 API design principles

- Resource-oriented endpoints using plural nouns (e.g., /api/buses, /api/routes).
- Use of standard HTTP verbs (GET, POST, PUT, DELETE) to represent read and state-change operations.
- Clear status codes and JSON-formatted error responses.
- Pagination or filtering can be added for endpoints that may return large lists.

2.5 Error handling and logging

Errors are normalized into JSON responses with an HTTP status code and an error message. Server-side errors are logged to the console (sufficient for coursework evaluation); in production a centralized logging solution (e.g., Logstash, Papertrail) would be used.

## 3. Implementation

3.1 Technology stack

- Node.js (ES6+), using modern syntax and modules.
- Express.js for routing and middleware.
- MongoDB with Mongoose for data modeling and persistence.
- dotenv for environment-based configuration.
- jsonwebtoken for token creation and verification.
- swagger-ui-express + an OpenAPI definition for documentation.

3.2 Project structure and responsibilities

- server.js: application entry point, middleware registration, route mounting and Swagger UI integration.
- src/config: database connection utilities.
- src/models: Mongoose schemas for buses and routes.
- src/controllers: handler functions for the API routes.
- src/routes: route definitions wiring HTTP endpoints to controllers.
- src/seed: seed script to populate the database with simulation data.
- data/: contains simulation-data.json used by the seed script.

3.3 Key implementation details

Seeding: The seed script reads simulation data and inserts documents for routes and vehicles. This facilitates demonstrations when MongoDB is available.

Location updates: The API supports posting a location for a vehicle which updates the vehicle's current location. For bulk updates, an endpoint accepts an array of updates and processes them in a batch.

Authentication: The login endpoint compares provided credentials against environment variables and issues JWT tokens. A middleware verifies tokens and populates the request user context for protected endpoints.

Swagger documentation: The OpenAPI YAML file describes endpoints, request bodies, response formats, and example payloads. This is served at /api-docs for graders to inspect the API contract.

3.4 Testing and verification

For coursework evaluation the following manual tests are recommended:

- Validate the login flow: POST to /api/auth/login with admin credentials from .env; expect a token in response.
- Use the token to call protected endpoints such as POST /api/routes and POST /api/buses/:id/location.
- Call public endpoints GET /api/routes and GET /api/buses to verify data retrieval.
- Inspect the Swagger UI at /api-docs to verify the documented contract matches runtime behavior.

Automated testing was not included in the scaffold to keep the submission lightweight; adding unit and integration tests (using Jest or Mocha + Supertest) is recommended if time permits.

## 4. Deployment (Appendix - mandatory)

4.1 Immediate submission checklist (fill before submission)

- Deployed API URL (public): https://<your-deployment-url>
- Swagger UI: https://<your-deployment-url>/api-docs
- GitHub repository: https://github.com/<your-username>/tuk-tracker-api
- AI tools and prompts used (if any): list here

4.2 Suggested deployment approach

For coursework, a simple approach is to deploy the Node.js app to a platform such as Render, Railway, or Heroku. These platforms allow you to set environment variables (MONGODB_URI, JWT_SECRET, ADMIN_USER, ADMIN_PASS) and provide a public URL for the API. Example steps:

- Create an account on the chosen host and a new Web Service deployment.
- Connect the GitHub repository (or deploy via a Docker image) and set build/start commands (npm install and npm start).
- Configure environment variables securely in the host dashboard.
- Verify health by visiting the public URL and the /api-docs path.

Security note: Never commit secrets to the repository. Use host environment variable configuration for production secrets.

## 5. Limitations, Scaling and Further Concerns

5.1 Current limitations

- Real-time updates: the current design updates vehicle locations via HTTP POST requests. For truly real-time dashboards (with push updates to multiple clients), a WebSocket or server-sent events approach would be preferable.
- Persistence of location history: the present schema stores the latest location on the vehicle document; a time-series collection would be required to store historical position data at scale.
- Authentication model: environment-based admin credentials are suitable for coursework but not for production; a proper user database with hashed passwords and role-based access control should replace this.

5.2 Scaling considerations

- Horizontal scaling: the API can be scaled by adding instances behind a load balancer (the app is stateless if JWT is used and no in-memory sessions are present).
- Database scaling: MongoDB can be scaled via replica sets and sharding. For heavy time-series data, use a time-series optimized database or a dedicated collection with appropriate indexing.
- Caching: for heavy read workloads, incorporate caching (Redis or CDN) to reduce DB load.

5.3 Security and operational concerns

- Secrets management: use a secrets manager (e.g., Vault, cloud provider secrets) rather than environment variables for production.
- Rate limiting and abuse protection: implement rate limiting for public endpoints and stricter controls for authenticated endpoints.
- Monitoring: integrate health checks and observability (metrics, traces, logs) for production.

## 6. Conclusion

This coursework submission delivers a standards-compliant RESTful API scaffold for tuk/tuktuk tracking with clear documentation and seeding utilities for demonstration. The design emphasizes clarity, separation of concerns, and straightforward deployment. Enhancements for full production readiness include adding real-time streaming, persistent location history, improved authentication and authorization, and operational tooling for security and observability.

## Appendix — Example API endpoints summary

- POST /api/auth/login — obtain admin JWT (body: username, password)
- GET /api/routes — list routes
- POST /api/routes — create route (admin)
- GET /api/tuks — list tuks
- GET /api/tuks/:id — get tuk details
- POST /api/tuks/:id/location — update tuk location (admin/operator)
- POST /api/locations/bulk-update — bulk location updates (admin)

---

If you confirm, I will:

- replace placeholder Student ID and GitHub username with your provided values;
- expand any section further or export to PDF-ready markdown and a printable format;
- proceed to create the GitHub push checklist and commands (step B) and then implement steps C and D.

