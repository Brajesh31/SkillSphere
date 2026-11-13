# Environment Configuration

## Configuration model

The backend loads environment variables with dotenv from `backend/server.js` and the authentication controller. The frontend uses Vite environment variables at build time.

Keep backend secrets in `backend/.env`. Keep only public configuration in `frontend/.env`. The `VITE_` prefix means a value is exposed to the browser bundle. Never place a password, API key, signing secret, database URI, or SMTP credential in a Vite variable.

## Backend variables

Start with `backend/.env.example`:

```dotenv
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/skillsphere
JWT_SECRET=replace-with-a-long-random-secret
SESSION_SECRET=replace-with-a-different-long-random-secret
EMAIL_USER=your-smtp-account@example.com
EMAIL_PASS=your-smtp-app-password
GEMINI_API_KEY=your-gemini-api-key
```

| Variable | Description | Guidance |
|---|---|---|
| `PORT` | Express HTTP port | Use the platform-provided port in hosting environments |
| `NODE_ENV` | Runtime environment | Set to `production` for production configuration checks |
| `MONGODB_URI` | MongoDB connection | Use a dedicated database user with least privilege |
| `JWT_SECRET` | JWT signing key | Generate a high-entropy random value; never reuse the session secret |
| `SESSION_SECRET` | Express session signing key | Generate a separate high-entropy random value |
| `EMAIL_USER` | SMTP login identity | Use a dedicated application account |
| `EMAIL_PASS` | SMTP credential | Use an app password or provider secret, not an account password |
| `GEMINI_API_KEY` | Google AI credential | Server-side only; rotate if previously exposed |

The backend throws during production startup when JWT secret, session secret, or MongoDB URI is missing. Development-only fallback values exist in source and must never be used as production secrets.

## Frontend variable

`frontend/.env.example` contains:

```dotenv
VITE_API_BASE_URL=http://localhost:5000
```

This is a public base URL. For a deployed environment, set it to the HTTPS API origin before running the Vite production build.

## Local setup

From `backend/`:

```bash
cp .env.example .env
```

From `frontend/`:

```bash
cp .env.example .env
```

On Windows PowerShell, use `Copy-Item .env.example .env`.

## Secret generation

Generate secrets with a cryptographically secure generator. For example, Node.js can generate a random hex value:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Run it separately for JWT and session secrets. Do not paste the generated values into issues, pull requests, screenshots, or chat logs.

## Production handling

- Store backend variables in the hosting provider's secret manager.
- Do not upload `.env` files to Git.
- Rotate credentials that have appeared in source control or logs.
- Do not log full connection strings or authorization headers.
- Use separate credentials for development, staging, and production.
- Restrict MongoDB network access and database roles.
- Review frontend build output to confirm no secrets are present.

## Troubleshooting configuration

If MongoDB does not connect, verify the URI, network allowlist, database credentials, and server availability. If OTP email fails, verify SMTP host/provider settings and app credentials. If the AI endpoint returns service unavailable, check the backend's Gemini key. If browser requests fail due to CORS, review the hard-coded origin list in `backend/server.js` and Socket.IO configuration.
