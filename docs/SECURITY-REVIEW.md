# Security Review

This file summarizes risks visible in the current implementation. It is not a penetration test or formal security certification. Each issue requires code remediation and a regression test before it can be considered closed.

## Critical: Realtime identity is client-controlled

Socket.IO is initialized without JWT handshake authentication. The room join payload includes user identity and host status, and event handlers rely on participant records populated from that payload.

**Required action:** authenticate sockets, derive identity from the verified token, derive host permissions from persisted room membership, and authorize every event. Add tests for forged identities and host events.

## High: Route authorization is inconsistent

Several profile routes and profile-router room operations are mounted without `protect`. Some endpoints may intentionally be public, but mutations must verify the caller and ownership.

**Required action:** create an explicit public/protected route matrix and enforce ownership at the resource boundary.

## High: OTP implementation has weak controls

OTP values are generated with `Math.random`, stored in the database, and expire via a five-minute TTL while the email text says ten minutes. Rate limiting and maximum verification attempts are not evident in the signup flow.

**Required action:** use a cryptographically secure generator, hash stored OTPs where practical, align expiry, add resend cooldowns and attempt limits, and avoid leaking whether an account exists.

## High: Uploads require access and content controls

The application accepts message, profile, and recording uploads and serves local directories. Recording upload allows a 500 MB payload.

**Required action:** validate file signatures and allowed types, enforce quotas, store files privately, and authorize each download/delete operation.

## High: Development fallback login

The auth controller includes test credentials for a database-unavailable development fallback.

**Required action:** remove this behavior from production code or make it impossible to activate in production through a fail-closed explicit development flag.

## Medium: Authentication identity is inconsistent

Some controllers read `req.user`, others read `req.session.userId`. This can cause failures and inconsistent authorization decisions.

**Required action:** standardize identity extraction and test every protected route.

## Medium: Browser token storage

The frontend stores JWT in local storage, which is accessible to JavaScript.

**Required action:** assess HttpOnly secure cookies and a CSRF strategy, and maintain strong XSS prevention.

## Medium: CORS configuration

Express and Socket.IO use hard-coded local development origins.

**Required action:** load validated origin configuration from the environment and test production CORS behavior.

## Medium: AI usage controls

The AI controller checks for a non-empty message but does not show a robust message length cap or per-user quota.

**Required action:** limit payload size, apply quotas, redact private context, and monitor provider costs.

## Medium: Tracked uploaded files

The Git tree contains user-upload-looking images, PDFs, office documents, and recordings.

**Required action:** verify consent and redistribution rights. Remove private data through a separately approved cleanup, considering Git history and any exposed clones.

## Verification checklist

- [ ] Socket handshake requires valid JWT.
- [ ] Server derives user and host identity.
- [ ] Every room event validates membership and role.
- [ ] Every write route authenticates and checks ownership.
- [ ] OTP generation, expiry, resend, and attempts are tested.
- [ ] Uploads validate file content, size, and ownership.
- [ ] Download routes prevent cross-user access.
- [ ] Production cannot use test login credentials.
- [ ] Controllers use a consistent authentication principal.
- [ ] CORS matches deployed frontend origins.
- [ ] AI requests have size and usage limits.
- [ ] Tracked uploads have documented publication permission.

A documentation-only commit does not fix these findings.
