# Security Policy

## Reporting

Do not disclose vulnerabilities, credentials, or user data in public issues. Use GitHub private vulnerability reporting for this repository if enabled. Otherwise, contact the repository owner privately through GitHub.

## Before deployment

- Set unique, strong `JWT_SECRET` and `SESSION_SECRET` values.
- Set `MONGODB_URI`, SMTP credentials, and `GEMINI_API_KEY` as server environment variables.
- Never put backend secrets in frontend `VITE_*` variables.
- Restrict CORS and Socket.IO origins to the actual frontend domain.
- Use HTTPS and secure cookies.
- Move user uploads to controlled durable storage and do not commit private user files.
- Review authentication, OTP expiry/rate limiting, authorization, upload validation, and room event authorization before production use.

A Gemini key was previously hardcoded in backend source and has been removed from the current version. Rotate that key. A new commit does not remove the value from Git history.
