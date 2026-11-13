# Deployment Guide

## Deployment status

The repository includes development configuration and a GitHub Actions quality workflow. It does not currently define a complete production deployment topology, infrastructure-as-code setup, or a tested multi-instance architecture. Use this guide as a deployment checklist, not as a claim that production deployment is turnkey.

## Components to deploy

1. React frontend built by Vite.
2. Node.js Express API.
3. MongoDB database.
4. SMTP provider for account and password-reset email.
5. Google Gemini API access if the AI assistant is enabled.
6. Durable private file storage for profile assets, message attachments, and recordings.
7. A realtime-compatible Socket.IO deployment with authenticated connections.

## Build the frontend

From `frontend/`:

```bash
npm ci
npm run build
```

The generated static assets are written to `frontend/dist`. Set `VITE_API_BASE_URL` to the public HTTPS API origin before building. Vite variables are embedded at build time; changing the server environment after the build does not rewrite the already-built bundle.

Serve the static build through a CDN or static hosting provider. Configure SPA fallback routing so direct navigation to frontend routes serves `index.html`.

## Run the backend

From `backend/`:

```bash
npm ci
npm start
```

Configure all required backend environment variables. In production, the server checks for `JWT_SECRET`, `SESSION_SECRET`, and `MONGODB_URI` before startup.

Use a process manager or platform runtime that restarts failed processes and forwards termination signals. Add graceful shutdown handling for HTTP and MongoDB before relying on this for production.

## Database

- Use a dedicated production database and least-privilege database account.
- Restrict network access to approved application hosts.
- Enable backups and test restoration.
- Monitor connection limits, slow queries, and storage growth.
- Review unique indexes and duplicate-key error handling.
- Avoid sharing production data with local development environments.

## CORS and Socket.IO

The current Express CORS allowlist and Socket.IO origin are hard-coded to localhost development addresses. Replace them with a validated production origin configuration before deployment. Do not use wildcard origins with credentialed requests.

Socket.IO currently lacks handshake authentication and relies on in-memory participant state. Do not expose room collaboration publicly until socket identity and room authorization are enforced. A multi-instance deployment also requires shared Socket.IO coordination.

## Sessions and cookies

Production sessions are stored in MongoDB through connect-mongo. Review cookie configuration for `secure`, `httpOnly`, `sameSite`, domain, and trusted proxy behavior. The application currently combines JWT and express-session patterns; consolidate the authentication contract before depending on session-based flows.

## File storage

Do not rely on instance-local `backend/uploads` for durable production files. Use private object storage, server-generated object keys, authorization checks, file validation, retention policies, and backups. The current tracked upload samples should be reviewed for privacy before distributing the repository.

## Secrets

Use the hosting platform's secret manager. Do not commit production `.env` files or expose server keys through Vite. Rotate credentials previously committed to Git history, including the Gemini key previously embedded in backend source.

## Pre-launch checklist

- [ ] Production environment variables configured and validated.
- [ ] MongoDB backup and restore tested.
- [ ] HTTPS enabled for frontend and API.
- [ ] CORS restricted to known frontend origin.
- [ ] Socket.IO handshake authentication implemented.
- [ ] Every HTTP and realtime action enforces authorization.
- [ ] OTP and login rate limiting implemented.
- [ ] Password reset and email verification flows tested end to end.
- [ ] Upload type, size, ownership, and download rules enforced.
- [ ] Private object storage configured.
- [ ] Development fallback login removed or disabled.
- [ ] Mock statistics replaced or clearly labeled.
- [ ] Logs avoid credentials and personal data.
- [ ] Monitoring and alerting configured.
- [ ] Automated tests cover critical flows.
- [ ] Existing repository uploads reviewed for publication permission.
