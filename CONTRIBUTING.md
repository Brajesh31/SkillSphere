# Contributing

Thanks for helping improve SkillSphere.

## Development setup

1. Install Node.js 20 or later and npm.
2. Configure MongoDB and backend environment variables using `backend/.env.example`.
3. Install and start the backend with `cd backend && npm ci && npm run dev`.
4. In a second terminal, install and start the frontend with `cd frontend && npm ci && npm run dev`.

## Validation

From `frontend/`, run:

```bash
npm run build
npx eslint src/api/axiosConfig.js
```

The full `npm run lint` command currently reports pre-existing errors in several pages. Do not suppress those errors to make CI appear green; avoid adding new lint violations and help reduce the existing backlog in focused changes.

From `backend/`, run:

```bash
npm ci
find . -name '*.js' -not -path '*/node_modules/*' -print0 | xargs -0 -n1 node --check
```

Test affected authentication, profile, connection, room, and real-time flows manually. Do not use production credentials or real user data for local testing.

## Pull requests

- Keep changes focused and explain the user impact.
- Include screenshots for frontend changes.
- Document new environment variables and API changes.
- Add or update tests where practical.
- Never commit secrets, local uploads, database dumps, or generated build output.
