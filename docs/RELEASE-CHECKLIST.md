# Release Readiness Checklist

This checklist is intended for a future release process. The repository does not currently define a formal release cadence.

## Code readiness
- [ ] Critical and high security findings are addressed.
- [ ] Full frontend lint passes.
- [ ] Frontend production build passes.
- [ ] Backend syntax and integration tests pass.
- [ ] Authentication and authorization regression tests pass.
- [ ] Socket.IO event authorization tests pass.
- [ ] Upload validation and access tests pass.

## Data readiness
- [ ] Database migrations or compatibility steps are documented.
- [ ] Backup and restore have been tested.
- [ ] Retention and deletion policies are defined.
- [ ] No private user uploads are included in the release artifact.

## Operations readiness
- [ ] Production secrets are configured and rotated.
- [ ] CORS and cookies match production domains.
- [ ] HTTPS is enforced.
- [ ] Upload storage is durable and private.
- [ ] Logs, metrics, and alerts are configured.
- [ ] Rollback steps are documented.

## Communication readiness
- [ ] Release notes describe actual changes.
- [ ] Breaking API or event changes are highlighted.
- [ ] Known limitations are documented.
- [ ] Support and vulnerability reporting links are available.
