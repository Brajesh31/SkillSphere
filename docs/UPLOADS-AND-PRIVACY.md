# Uploads, Storage, and Privacy

## Current storage implementation

The backend contains upload directories for profiles, messages, and recordings. Multer is used for file uploads, and Express serves selected directories through static middleware.

The room router configures recording upload with a maximum file size of 500 MB. The message controller has its own upload configuration. Profile uploads are handled through profile controller middleware. Review each upload implementation before changing limits or accepted formats.

## Local disk is not durable shared storage

Local disk is convenient for development, but it creates operational problems:
- Files may disappear when a hosting instance is rebuilt or replaced.
- Multiple backend instances do not automatically share uploaded content.
- Backups and retention need to be managed separately from MongoDB.
- Static serving can expose files without record-level authorization.
- Large files can consume disk and bandwidth unexpectedly.

For production, use private object storage with signed, short-lived access URLs or an authenticated download proxy.

## Validation requirements

A safe upload flow should:
1. Authenticate the user before accepting the upload.
2. Validate the target record and the user's authorization to attach a file.
3. Enforce a strict size limit appropriate to the file category.
4. Allowlist expected file types and inspect file signatures, not only extensions or browser-provided MIME values.
5. Generate storage names on the server.
6. Store files outside executable or public application directories.
7. Scan files where the threat model requires it.
8. Apply per-user quotas and rate limits.
9. Record ownership and metadata.
10. Authorize every download and delete operation.
11. Clean up orphaned files after failed database operations.
12. Define retention and deletion behavior.

Do not trust an original filename or path supplied by the client.

## Repository privacy issue

The current Git tree contains files under `backend/uploads/`, including PDFs, a DOCX, WebM recordings, and profile images. These are tracked repository objects. The files may contain personal or confidential information.

Before sharing or deploying the repository:
- Confirm that every file is synthetic or that the owner has explicitly approved publication.
- Confirm permission to redistribute the file and any embedded media.
- Remove private or unnecessary samples through a separately reviewed repository cleanup.
- Consider repository history, not only the latest working tree. Deleting a file in a new commit does not erase earlier Git objects.
- If personal information was exposed, follow the appropriate privacy response process.

This documentation change intentionally does not delete or rewrite those uploaded files.

## Recommended retention model

Define separate retention periods for:
- Profile images and avatars.
- Direct-message attachments.
- Meeting recordings.
- Temporary upload files.
- Deleted user content and backup copies.

Deletion should remove both metadata and stored bytes, with retryable cleanup and an auditable result. Legal or organizational retention requirements may override ordinary deletion windows.

## Operational monitoring

Monitor total storage, per-user usage, failed uploads, upload duration, download errors, and unusual request volume. Avoid logging file contents, authentication headers, or private signed URLs.
