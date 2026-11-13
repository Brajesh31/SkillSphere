# Contributing to SkillSphere

Thank you for contributing. SkillSphere spans a React frontend, Express API, MongoDB models, uploads, authentication, and realtime collaboration. A useful contribution should improve correctness, security, accessibility, maintainability, or user experience without hiding existing limitations.

## 1. Start with the documentation

Before making changes, read:
- [README](README.md) for setup and project scope.
- [Architecture](docs/ARCHITECTURE.md) for system boundaries.
- [API reference](docs/API.md) for route behavior.
- [Security review](docs/SECURITY-REVIEW.md) for known risks.
- [Testing guide](docs/TESTING.md) for validation expectations.

Search existing issues and pull requests before starting. For a substantial feature, open an issue to agree on the behavior and data model first.

## 2. Development environment

Use a supported Node.js LTS version and npm. Install dependencies independently:

```bash
cd backend
npm ci
cd ../frontend
npm ci
```

Configure local environment files from the committed examples. Never use production credentials or real user data for development.

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend in a separate terminal:

```bash
cd frontend
npm run dev
```

MongoDB must be available for database-backed workflows. SMTP and Gemini credentials are needed only for their respective integrations.

## 3. Branching and commits

Create a focused branch from the latest default branch:

```bash
git checkout main
git pull --ff-only
git checkout -b fix/short-description
```

Suggested prefixes:
- `fix/`: defect correction.
- `feat/`: user-visible feature.
- `docs/`: documentation.
- `test/`: automated or manual test infrastructure.
- `refactor/`: structural change without intended behavior change.
- `security/`: security hardening.

Use clear commit messages such as `fix: authorize room participant events` or `docs: describe upload retention`.

## 4. Frontend expectations

- Keep components focused and reusable.
- Handle loading, error, empty, and success states.
- Use semantic HTML and accessible labels.
- Avoid storing secrets in frontend environment variables.
- Keep API calls in the existing API layer where practical.
- Avoid duplicating authentication or request behavior.
- Test responsive layouts and keyboard interaction for UI changes.
- Do not add new lint violations. The full project lint command has existing debt, so do not claim it passes unless it does.

## 5. Backend expectations

- Validate request bodies, query parameters, and route parameters.
- Apply authentication and resource ownership checks.
- Derive user identity from verified server-side credentials, not client-supplied IDs.
- Keep controllers focused and move reusable domain logic into services when appropriate.
- Handle database errors and duplicate-key cases deliberately.
- Avoid returning password hashes, OTPs, tokens, or private user fields.
- Rate-limit sensitive actions such as login, signup, OTP, password reset, uploads, and AI requests.
- Keep provider credentials on the server.
- Use safe file naming and strict upload validation.
- Avoid logging secrets or personal data.

## 6. Realtime expectations

Socket.IO events are part of the security boundary. Every event must validate the authenticated socket principal, room membership, role, and payload. Do not trust client-supplied user IDs, host flags, or timestamps. Include tests for spoofed identities and unauthorized room actions.

## 7. Database and data changes

When changing a Mongoose model:
- Explain the schema change and compatibility impact.
- Consider existing documents and migration needs.
- Add indexes only when justified by query patterns.
- Handle missing and malformed historical data.
- Update [Data model](docs/DATA-MODEL.md).
- Test both successful and rejected operations.

Do not silently remove fields or data that may be in use by the frontend.

## 8. Upload and privacy rules

Do not commit real profile images, message attachments, recordings, database dumps, or user documents. Use synthetic fixtures. Any change to upload behavior must consider file signature, size, ownership, storage location, download authorization, quotas, retention, and cleanup.

The repository currently contains tracked files under `backend/uploads/`. Do not add more real user content. Report privacy concerns privately where appropriate.

## 9. Validation

Frontend:

```bash
cd frontend
npm run build
npm run lint
npx eslint src/api/axiosConfig.js
```

Backend:

```bash
cd backend
find . -name '*.js' -not -path '*/node_modules/*' -print0 | xargs -0 -n1 node --check
```

Run relevant manual workflows using synthetic accounts and a test database. For auth, upload, message, and room changes, test unauthorized and malformed requests as well as the happy path.

The full frontend lint command currently has existing failures. Report its actual status. A focused lint step or successful build does not mean the entire codebase is lint-clean.

## 10. Documentation

Update documentation when a change affects:
- Setup or environment variables.
- API routes, payloads, or status codes.
- Authentication and authorization.
- Socket.IO event names or payloads.
- MongoDB models.
- Upload limits, storage, or retention.
- Deployment, scripts, or supported runtime versions.

Clearly distinguish implemented behavior from proposed work and known limitations.

## 11. Pull request checklist

- [ ] The PR has a focused scope and linked issue where appropriate.
- [ ] Authorization is enforced on affected resources.
- [ ] Inputs and uploads are validated.
- [ ] No secrets or private user files are included.
- [ ] Database changes consider existing records.
- [ ] Realtime events validate identity and permissions.
- [ ] Frontend build was run when relevant.
- [ ] Backend syntax and relevant tests were run.
- [ ] Full lint status is reported honestly.
- [ ] Documentation and examples match the implementation.
- [ ] Screenshots or recordings are included for meaningful UI changes.
- [ ] Known risks and follow-up work are stated.

## 12. Review process

Reviewers may request tests, smaller scope, security fixes, or documentation changes. Keep review discussion constructive and technical. Do not bypass failing checks by deleting tests or broadly disabling lint rules.

## 13. Reporting bugs

Use the bug report template. Include the environment, exact reproduction steps, expected and actual behavior, and relevant redacted logs. Never post JWTs, OTPs, passwords, database URIs, SMTP credentials, or private user content.
