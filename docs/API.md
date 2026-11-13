# HTTP API Reference

This document inventories routes registered by the current Express application. It is based on route definitions in `backend/routes/`. Controller behavior and response fields may evolve; inspect the controller before relying on an undocumented payload shape.

## Base URL

Local development default:

```text
http://localhost:5000
```

The browser client uses `VITE_API_BASE_URL` and sends a JSON content type by default. For routes protected by `protect`, the client must send:

```http
Authorization: Bearer <JWT>
```

The middleware verifies the token and loads the associated user into `req.user`.

## Authentication routes

Prefix: `/api/auth`

| Method | Path | Middleware | Purpose |
|---|---|---|---|
| POST | `/signup` | None in route | Register a user and send an email OTP |
| POST | `/verify-otp` | None in route | Verify an email OTP |
| POST | `/login` | None in route | Authenticate and issue a JWT |
| GET | `/dashboard` | `protect` | Return dashboard user data |
| POST | `/forgot-password` | None in route | Start password reset email flow |
| POST | `/reset-password` | None in route | Verify reset OTP and update password |
| POST | `/logout` | None in route | Return logout confirmation |
| GET | `/me` | `protect` | Return the authenticated user |

The controller currently uses bcryptjs for password hashing and JWT for API authentication. OTP expiration is implemented through a MongoDB TTL index on the OTP model. The email message and TTL configuration currently disagree about the expiration period. See [Security review](SECURITY-REVIEW.md).

## Profile routes

Prefix: `/api/profile`

| Method | Path | Middleware in route | Purpose |
|---|---|---|---|
| PUT | `/last-active` | `protect` | Update current user's last-active timestamp |
| POST | `/:userId/photo` | No `protect` shown | Upload profile asset and update profile |
| PUT | `/:userId` | No `protect` shown | Create or update a profile |
| GET | `/explore` | No `protect` shown | Explore profiles with query filters |
| GET | `/:userId` | No `protect` shown | Fetch a profile |
| POST | `/endorse` | No `protect` shown | Endorse a skill |
| GET | `/matches` | No `protect` shown | Retrieve profile matches |
| GET | `/mentors/:skill` | No `protect` shown | Find mentors by skill |
| GET | `/stats/user/:userId` | No `protect` shown | User profile statistics |
| GET | `/stats/user` | `protect` | Authenticated user statistics |
| POST | `/room/create` | No `protect` shown | Create a room through the room controller |
| POST | `/room/join` | No `protect` shown | Join a room through the room controller |

The route table reflects middleware visible in the router file. It is not a security approval. In particular, profile mutation and room operations should enforce authentication and ownership before deployment.

## Connection routes

Prefix: `/api/connections`

| Method | Path | Middleware | Purpose |
|---|---|---|---|
| POST | `/connect/:targetUserId` | `protect` | Send a connection request |
| POST | `/respond/:connectionId` | `protect` | Accept or reject a request |
| GET | `/all` | `protect` | List accepted connections |
| GET | `/pending` | `protect` | List pending requests created by current user |
| GET | `/search` | `protect` | Search users |
| PUT | `/messages/mark-seen/:userId` | `protect` | Mark messages as seen through connection controller |
| GET | `/notifications` | `protect` | Retrieve connection notifications |

The search controller currently reads a user identifier from the session, while the route applies JWT middleware. That identity mismatch needs correction and testing.

## Message routes

Prefix: `/api/messages`

| Method | Path | Middleware | Purpose |
|---|---|---|---|
| POST | `/send` | `protect` | Send a direct message |
| POST | `/send-file` | `protect` and Multer | Upload and send a file |
| GET | `/check-new` | `protect` | Check for new messages |
| GET | `/unread-count/:userId` | `protect` | Get unread message count |
| GET | `/:userId` | `protect` | Retrieve conversation messages |
| PUT | `/mark-seen/:userId` | `protect` | Mark messages as seen |

The router rejects a missing or literal `undefined` user ID before invoking the conversation handler. Controllers must still verify that the authenticated user is authorized to access the requested conversation.

## Room and recording routes

Prefix: `/api/rooms`

| Method | Path | Middleware | Purpose |
|---|---|---|---|
| POST | `/create` | `protect` | Create a room |
| POST | `/join` | `protect` | Join a room |
| GET | `/:id` | `protect` | Retrieve a room |
| POST | `/recordings` | `protect` and Multer | Upload a recording |
| GET | `/recordings/user` | `protect` | List current user's recordings |
| DELETE | `/recordings/:id` | `protect` | Delete a recording |
| GET | `/recordings/download/:id` | `protect` | Download a recording |

The recording upload route currently configures a 500 MB file-size limit. A size cap alone is not sufficient validation. File type, content, ownership, storage quota, and download authorization must also be enforced.

## Statistics routes

Prefix: `/api/stats`

| Method | Path | Middleware | Purpose |
|---|---|---|---|
| GET | `/` | No `protect` shown | Calls the stats controller |
| GET | `/user` | `protect` | Returns hard-coded sample statistics |

The stats controller reads a session user ID, whereas the protected route uses JWT middleware. The protected `/user` route currently returns mock values. Do not use these values for reporting or business decisions.

## AI routes

Prefix: `/api/ai`

| Method | Path | Middleware | Purpose |
|---|---|---|---|
| POST | `/ask` | `protect` | Send a message and optional context to Gemini |

The controller expects a non-empty string `message` and accepts optional `context`. It returns an `answer` when successful and a service error when the provider is unavailable. Do not submit secrets or private user information as context.

## Response and error conventions

The current controllers use a mixture of `message`, `msg`, `error`, and feature-specific response properties. Status codes commonly include:
- `200` for successful operations.
- `400` for invalid input.
- `401` for missing or invalid authentication.
- `403` for authorization or verification failures.
- `404` for missing records.
- `500` for server-side failures.
- `502` or `503` for AI provider failures or missing configuration.

There is no single shared response envelope. Clients should handle errors per endpoint rather than assuming all routes return the same JSON shape.

## API change checklist

When adding or changing a route:
1. Add input validation and document required fields.
2. Apply authentication middleware where required.
3. Enforce record ownership and role authorization in the controller/service.
4. Avoid returning password hashes, tokens, OTPs, or private fields.
5. Define status codes and error payloads.
6. Add tests for unauthenticated, unauthorized, malformed, and successful requests.
7. Update this document and frontend API usage.
