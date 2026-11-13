# SkillSphere Architecture

## 1. System overview

SkillSphere is a browser-based full-stack application. The frontend is a React 19 single-page application served by Vite during development. The backend is an Express 5 application running on Node.js. MongoDB stores users, profiles, rooms, connections, messages, and recording metadata through Mongoose models. Socket.IO provides low-latency events for room collaboration.

The backend is the intended trust boundary for database operations and provider credentials. The browser should only receive public configuration such as the API base URL. A value exposed through a Vite `VITE_*` variable is bundled into frontend assets and must never be treated as a secret.

## 2. Runtime components

### Frontend

The `frontend/src` tree is organized around:
- `pages/`: route-level screens for login, signup, dashboard, discovery, connections, profile, room creation/joining, room sessions, and recordings.
- `components/`: shared navigation, profile, chat, participant, notification, and chatbot UI.
- `api/axiosConfig.js`: Axios instance configured with `VITE_API_BASE_URL`; it attaches the JWT stored in browser local storage as a bearer token.
- `context/RoomContext.jsx`: shared room-related client state.
- `styles/` and CSS files: page and component styling.

The frontend stores the login token in local storage according to the current API client contract. This exposes the token to JavaScript executing in the page, so XSS prevention and a future move to secure HttpOnly cookie-based authentication deserve consideration.

### Backend

The backend is organized around:
- `server.js`: Express initialization, middleware, MongoDB connection, route mounting, static upload paths, and HTTP server setup.
- `routes/`: URL and HTTP method registration.
- `controllers/`: request handling and business operations.
- `models/`: Mongoose schemas.
- `middleware/authMiddleware.js`: bearer JWT verification and user lookup.
- `uploads/`: local files written by upload controllers and served by Express.

### External services

- MongoDB is the persistent data store.
- Nodemailer connects to the configured SMTP provider.
- Google Generative AI is called from the AI controller.
- The browser uses Socket.IO client to connect to the backend's Socket.IO server.

## 3. Request lifecycle

For a typical protected HTTP request:
1. The browser calls the Axios instance.
2. The request interceptor reads the token from local storage.
3. If present, the client adds an Authorization bearer header.
4. Express receives the request and routes it to a controller.
5. A route using `protect` invokes JWT verification.
6. The middleware loads the user record, excluding the password, and attaches it to `req.user`.
7. The controller validates input, performs database or provider work, and sends a JSON response.

Not every route is protected. A route's existence under a resource prefix does not imply authentication or authorization. Consult [API reference](API.md) and [Security review](SECURITY-REVIEW.md).

## 4. Realtime lifecycle

The HTTP server is passed to `initializeSocket` from the room controller. Socket.IO maintains an in-process map of active rooms and participants. Clients emit events to join, leave, send messages, request screen sharing, raise hands, and invoke host actions.

Unlike the HTTP `protect` middleware, the current Socket.IO initialization does not verify a JWT during the handshake. Several event handlers accept client-supplied identity and room values. This is a critical trust-boundary gap. See [Realtime rooms](REALTIME-ROOMS.md).

## 5. Persistence and ephemeral state

MongoDB stores long-lived application records. In contrast, the Socket.IO participant map, active screen-share state, and other live room coordination are stored in process memory. A restart loses that live state. Multiple backend instances would maintain separate maps and therefore disagree about room participants unless a shared adapter and shared state strategy are introduced.

Uploaded file bytes are written to local disk. File metadata may be stored in MongoDB, but local disk is not shared automatically across instances and may be ephemeral on many hosting platforms.

## 6. Authentication and sessions

The project uses JWT bearer tokens for protected API routes and express-session for some password reset and session-oriented controller paths. These are separate identity mechanisms in the current codebase. The authentication design should be consolidated so controllers do not inconsistently read `req.user`, `req.session.userId`, and reset-session fields.

Production configuration requires JWT and session secrets and MongoDB. Development fallbacks exist in source and must not be mistaken for production security controls.

## 7. Suggested module boundaries

As the application grows, consider separating:
1. Route validation and request schemas.
2. Authentication and authorization policy.
3. Domain services for users, connections, rooms, and messages.
4. Persistence repositories.
5. Upload storage adapters.
6. Realtime authentication and room authorization.
7. Provider adapters for email and AI.
8. Observability and audit logging.

This is a proposed direction. The current code remains a controller-oriented Express application.

## 8. Operational boundaries

Before production:
- Replace hard-coded development CORS origins with validated environment configuration.
- Authenticate Socket.IO handshakes.
- Authorize every room event using server-derived identity.
- Restrict upload access and validate content.
- Add rate limiting and abuse detection.
- Move uploads to durable private object storage.
- Add structured logging and health checks.
- Define graceful shutdown and database readiness behavior.

Related guides: [Data model](DATA-MODEL.md), [API](API.md), [Realtime rooms](REALTIME-ROOMS.md), and [Deployment](DEPLOYMENT.md).
