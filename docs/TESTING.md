# Testing Guide

## What CI currently checks

The quality workflow performs a focused frontend lint step, a Vite production build, and backend JavaScript syntax checks. It does not currently run a full integration suite against MongoDB, SMTP, Gemini, or Socket.IO.

A green workflow indicates only that the configured steps passed. The full frontend lint command has known outstanding errors and is not equivalent to the focused CI lint step.

## Install dependencies

```bash
cd backend
npm ci
cd ../frontend
npm ci
```

## Frontend validation

```bash
npm run build
npm run lint
npx eslint src/api/axiosConfig.js
```

The last command is the narrow lint check currently used by CI. The full lint command should be run periodically to measure and reduce the existing lint backlog.

## Backend syntax validation

```bash
cd backend
find . -name '*.js' -not -path '*/node_modules/*' -print0 | xargs -0 -n1 node --check
```

This validates syntax but does not execute controllers or connect to external services.

## Manual test scenarios

### Authentication
- Signup with valid and malformed values.
- Confirm duplicate email and username behavior.
- Verify correct, incorrect, expired, and reused OTPs.
- Confirm OTP resend and brute-force limits once implemented.
- Login before and after email verification.
- Reset a password and confirm the old password no longer works.
- Test expired and malformed JWTs.

### Authorization
- Call every protected route without a token.
- Call routes with a valid token for another user.
- Attempt to update or delete records owned by another account.
- Confirm public profile routes expose only intended fields.

### Profiles and connections
- Create, update, and explore profiles.
- Search by skill, username, and role.
- Send duplicate connection requests.
- Accept/reject requests as recipient and as unrelated user.
- Verify reverse connection state and notification behavior.

### Messages and uploads
- Send a direct message.
- Retrieve conversation as sender, recipient, and unrelated account.
- Mark messages seen.
- Upload valid, invalid, oversized, and misleading-extension files.
- Attempt cross-user download and deletion.

### Rooms and Socket.IO
- Join and leave as authorized participants.
- Reconnect with the same user.
- Attempt spoofed user IDs and host flags.
- Attempt host actions as a participant.
- Disconnect host and verify host reassignment.
- Attempt room access using an unrelated room ID.
- Verify state behavior after server restart.

### AI
- Call without JWT.
- Call with empty or very long message.
- Call with missing API key.
- Simulate provider errors and quota exhaustion.
- Confirm logs do not contain secrets or private prompt context.

## Automated test direction

Recommended test layers:
1. Pure unit tests for validators and domain functions.
2. HTTP integration tests using Supertest and a disposable MongoDB.
3. Socket.IO integration tests using authenticated client connections.
4. Upload tests using synthetic fixture files.
5. Browser tests for critical registration, profile, connection, and room workflows.

Use synthetic data and isolated test credentials. Never point automated tests at production accounts or storage.

## Pull request evidence

State the exact commands run, whether they passed, and what was tested manually. If the full lint command remains failing, report it as failing rather than citing only the narrower CI check.
