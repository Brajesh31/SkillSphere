# Troubleshooting

## Dependency installation fails

- Use a supported Node.js LTS release.
- Run `npm ci` from the relevant `backend/` or `frontend/` directory.
- Do not mix package managers or delete lockfiles to bypass dependency conflicts.
- Check network access to the npm registry and available disk space.

## Frontend starts but API requests fail

Confirm that the backend is running and that `frontend/.env` has the correct `VITE_API_BASE_URL`. Restart Vite after changing the value. Inspect the browser Network panel for the request URL, response status, and CORS errors.

## Backend starts but database operations fail

Check `MONGODB_URI`, database availability, credentials, network allowlists, and database permissions. The development server may continue listening after a failed database connection, so a listening port is not proof of database readiness.

## OTP emails fail

Check SMTP credentials, provider security requirements, and network access. Do not use a personal account password where an app password is required. The current OTP model TTL is five minutes while the email text says ten minutes, so verify expiry behavior in the source.

## JWT errors

Confirm that the frontend sends `Authorization: Bearer <token>`, the token has not expired, and backend JWT secret has not changed unexpectedly. A changed secret invalidates previously issued tokens.

## CORS errors

The current server contains hard-coded localhost origins. A frontend running on another hostname or port may be blocked. Update the allowlist to the exact trusted origin. Avoid wildcard origins when credentials are enabled.

## Socket.IO does not connect

Check the backend origin, Socket.IO CORS configuration, reverse-proxy WebSocket support, and browser console. The current server configuration is localhost-oriented. Do not expose it publicly until handshake authentication and event authorization are implemented.

## Upload errors

Check the multipart field name, file-size limits, disk space, directory permissions, and controller-specific Multer configuration. Message and recording upload limits may differ. A successful local upload does not guarantee production persistence.

## Build succeeds but lint fails

The full frontend lint command has existing issues. CI currently runs a narrower lint check and the production build. Review the full ESLint output and fix violations incrementally rather than disabling rules globally.

## AI assistant errors

Confirm `GEMINI_API_KEY` is set in the backend environment, restart the server after editing the file, and check provider quota and model availability. Never expose the key in frontend configuration or issue reports.

## Reporting an issue

Use the GitHub bug report template. Include Node/npm versions, operating system, exact command, relevant redacted logs, and steps to reproduce. Remove passwords, JWTs, OTPs, database URIs, and personal data.
