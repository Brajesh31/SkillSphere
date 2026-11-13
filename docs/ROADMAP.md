# SkillSphere Roadmap

This roadmap is a proposed sequence based on the current source tree. Items are not implemented unless they are already described in the main README as current capabilities.

## Priority 0: Security and authorization

- Authenticate Socket.IO connections.
- Derive identity and room role from verified server-side data.
- Authorize all realtime events.
- Protect profile mutations and room operations.
- Add record ownership checks to messages and recordings.
- Replace weak OTP generation and add rate limits.
- Remove development fallback credentials from production paths.
- Validate uploads and secure downloads.

**Done when:** negative tests prove unauthorized access is rejected across HTTP and realtime surfaces.

## Priority 1: Authentication consistency

- Standardize on JWT-derived `req.user` or a clearly defined cookie/session model.
- Remove mixed `req.session.userId` assumptions.
- Define logout and token invalidation behavior.
- Harden password reset session binding.
- Normalize input and duplicate-account handling.

## Priority 2: Data integrity

- Reconcile User and Profile fields.
- Clarify embedded versus standalone Session model responsibilities.
- Make connection acceptance safe under concurrent requests.
- Add indexes based on query plans.
- Replace mock statistics with real, authorized data.
- Define user deletion and data retention.

## Priority 3: Upload platform

- Audit tracked upload content and repository history.
- Move uploads to private object storage.
- Add content inspection, quotas, and retention.
- Implement authorized downloads and reliable cleanup.

## Priority 4: Frontend quality

- Resolve all full-project ESLint failures.
- Add tests for API client and core components.
- Improve accessible form validation and error states.
- Reduce duplicated network and state logic.
- Add browser tests for core user journeys.

## Priority 5: Realtime reliability

- Introduce a shared Socket.IO adapter.
- Persist or reconstruct room membership safely.
- Handle reconnection and server restarts.
- Add event schemas, quotas, and audit logging.
- Verify media permissions and host transitions.

## Priority 6: Operations

- Add health and readiness endpoints.
- Add structured logs, metrics, and alerting.
- Document backup and restore procedures.
- Add dependency update automation.
- Define release and migration practices.

Feature expansion should not outrun authorization, data integrity, and testing. A new collaboration feature is not valuable if users can spoof room identity or access another user's files.
