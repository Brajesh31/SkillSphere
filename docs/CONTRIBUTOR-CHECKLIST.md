# Contributor Checklist

Use this checklist when preparing a change that touches more than one layer of SkillSphere.

## Before implementation
- [ ] Read the relevant architecture and API documentation.
- [ ] Search existing issues and code paths.
- [ ] Identify affected user roles and data ownership.
- [ ] Decide whether the change affects API contracts or database shape.
- [ ] Identify privacy, security, and operational implications.

## During implementation
- [ ] Validate all untrusted inputs.
- [ ] Derive identity from verified server-side credentials.
- [ ] Enforce ownership and role permissions.
- [ ] Keep provider secrets on the backend.
- [ ] Avoid logging private data.
- [ ] Handle loading, error, empty, and success states.
- [ ] Avoid adding dependencies without a clear need.

## Before submitting
- [ ] Build the frontend.
- [ ] Run relevant lint checks and report the full lint status.
- [ ] Run backend syntax checks.
- [ ] Test success and failure paths.
- [ ] Test unauthorized access.
- [ ] Update relevant docs and examples.
- [ ] Confirm no secrets or real uploads are staged.
- [ ] Explain known limitations in the pull request.
