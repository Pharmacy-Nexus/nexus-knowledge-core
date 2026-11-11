# VITAL v1.4 — Medical Vault

- Added **My Documents** tab to VITAL's existing PWA.
- Added an owner-scoped private Supabase Storage bucket and metadata table.
- Added upload, list, filter, preview, download and delete for PDF/JPG/PNG/WebP (10 MiB max).
- Added Arabic/English UI copy and responsive mobile navigation (5 tabs).
- File paths use random UUIDs instead of user-provided filenames.
- Existing QR, emergency publications, cards and medical profile remain unchanged.
- Updated service worker cache version to refresh app assets.
- No seeded users, no demo records, and no new admin features.

### Status

- JavaScript syntax check: passed.
- Zero-dependency logic/render smoke test: passed.
- Browser automation: blocked by execution environment.
- Live Supabase Storage/database/security tests: not run. Required after deployment before using real medical records.
