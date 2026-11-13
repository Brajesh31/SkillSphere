# Security Policy

## Project status

SkillSphere is an actively developed full-stack application. It handles accounts, profile information, messages, room collaboration, uploaded files, and external provider credentials. The current implementation has security gaps documented in [Security review](docs/SECURITY-REVIEW.md). Do not assume the application is production-hardened.

## Supported versions

Security fixes should target the latest commit on the default branch. There are no formal release branches or guaranteed maintenance windows.

## Reporting a vulnerability

Do not publish credentials, private user data, or exploit details in a public issue.

Use GitHub private vulnerability reporting if it is enabled for this repository. Otherwise, contact the repository owner privately through GitHub.

Include:
- A concise description and potential impact.
- Affected endpoint, event, component, or file if known.
- Steps to reproduce using synthetic accounts and data.
- Relevant request/response details with tokens and personal data removed.
- Browser, operating system, Node.js, and npm versions where relevant.
- A suggested mitigation if available.

Do not test against accounts, systems, or data that you do not own or have permission to use.

## Response process

The maintainer will review reports as promptly as practical. There is no guaranteed response or remediation timeline. Please allow time for validation before publishing technical details.

A fix should include a regression test where practical. A vulnerability should not be marked resolved until the relevant code and tests have been reviewed.

## Secret handling

- Keep MongoDB, JWT, session, SMTP, and Gemini credentials on the server.
- Never place secrets in `VITE_*` frontend variables.
- Do not commit `.env` files, tokens, database exports, or private uploads.
- Rotate any credential that has been committed or exposed.
- Remember that deleting a secret from the latest commit does not remove it from Git history.

A Gemini API key was previously embedded in backend source and removed from the current version. Rotate that credential. Review Git history and any deployed copies.

## High-priority security areas

- Socket.IO handshake authentication and event authorization.
- HTTP route authentication and resource ownership.
- OTP generation, expiry, rate limiting, and attempt controls.
- Password reset and session binding.
- Upload validation, storage privacy, and download authorization.
- CORS and cookie configuration.
- Development fallback authentication.
- AI request limits and sensitive context handling.
- Privacy and publication permission for tracked upload files.

See [Security review](docs/SECURITY-REVIEW.md) for findings and remediation order.
