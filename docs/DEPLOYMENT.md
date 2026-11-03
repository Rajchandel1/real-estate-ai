Development stability: use npm run dev (scripts/dev.mjs). It enforces one development server per checkout using .next-dev.lock, preventing concurrent writes to .next-dev. Browser layout smoke check: node scripts/check-public-layout.mjs [catalogue-url], with optional BROWSER_PATH. Verified catalogue, filters, contact dialog and property detail at 320, 375, 390, 768, 1024 and 1440px.

UI update: property details now have separate private/public pages. Private forms update optimistically and coalesce background saves; failures retain a draft with retry/download controls. Disjoint revision conflicts can be merged on retry. The global account strip is removed; sign-out is under profile. Colors apply immediately. Storage migration 20261030110000_property_image_access.sql is PREPARED LOCALLY ONLY: remote verification was blocked by automatic approval review usage limits. Existing property-images bucket was created earlier. Either deploy that membership policy migration or configure the server-only SUPABASE_SECRET_KEY to enable signed uploads.

Session pooler update: .env.local now uses aws-0-ap-northeast-2.pooler.supabase.com:5432 with the project-scoped postgres user and the existing local password. Standalone DB check succeeds against all 8 CRM tables.

Latest local diagnostic: direct DB hostname currently fails Node system DNS lookup (ENOTFOUND); IPv6-only resolution was confirmed through an external resolver. Use the project's Session pooler hostname for this machine. Dashboard now loads its initial workspace server-side and preserves the initial revision. Development builds use .next-dev to avoid collisions with production .next output.

Update: DATABASE_URL is now configured in .env.local and verified against all 8 tables. Database TLS validates the bundled Supabase CA certificate. Google login has been completed by the owner. Storage secret key and Turnstile settings remain separate setup steps.

## Current status (2026-10-30)

Original project verified. Neutral schema applied as migration 20261030045413, and the four empty legacy tables removed as migration 20261030045514. Local public Supabase settings and owner email are configured. Google provider is disabled; DATABASE_URL and SUPABASE_SECRET_KEY are missing. The local server runs at http://127.0.0.1:3000. Runtime Google login and CRM data operations still need configuration.

# Deployment checklist

Confirmed Supabase project: `huusdwrwsmlrqrwsgvfv`. The existing `supabase` MCP entry points to a different project. Use the authenticated `crm_supabase` entry after restarting the Codex extension/session so its tools load. Verify `get_project_url` before any remote writes.

## Database cutover

1. Inspect the original project's tables, exact row counts, migrations, foreign keys, security advisors and logs. Export a backup before deleting data.
2. Check that the neutral names do not already belong to another application. Apply `supabase/migrations/20261030045413_neutral_crm.sql`. This creates `agencies`, `agency_memberships`, `properties`, `leads`, `visits`, `public_submissions`, `audit_events`, `rate_limits`, and the public `property-images` bucket. Browser table grants are revoked; server actions enforce tenant membership. Keep privileged DB credentials server-only.
3. For a fresh database, the original historical migration may run first; the new app does not use its tables. For an existing database, reconcile remote migration history before running `supabase db push`; do not blindly replay historical migrations.
4. The user requested a clean start. After checking dependencies, run `supabase/legacy-reset.sql` against the confirmed project to remove the four known `forma_` tables. It uses explicit names and no CASCADE. Inspect any other legacy tables separately.
5. New agencies start empty. Set `CRM_OWNER_EMAIL` and `AGENCY_SLUG`, then sign in with the owner's verified Google account. Other users sign in once and are granted agent access in Settings → Agency team. Owners control branding, membership and record removal. Revoked memberships cannot bootstrap themselves back in.

## Environment and authentication

- Copy `.env.example` to `.env.local` and fill actual values. Never paste secrets in chat. Obtain the original project's publishable key, server secret key and pooler connection string. URL-encode special characters in DB passwords.
- Set an HTTPS `APP_ORIGIN` in production. Configure Google OAuth in Supabase and Google Cloud; allow the deployed `/auth/callback` URL and local callback for development. The Google Cloud callback is Supabase's `/auth/v1/callback` URL.
- Create a Cloudflare Turnstile widget restricted to the real host. Configure both Turnstile keys and a random `RATE_LIMIT_SECRET`. Production enquiries fail closed if these are missing.
- On Vercel, the app uses the platform's sanitized client IP header. On other hosts only set `TRUST_PROXY=true` when the proxy overwrites incoming forwarding headers. Otherwise the shared fallback limit applies; add CDN rate limiting before public exposure.
- Run `npm run env:check -- --production`, `npm run db:check`, then `npm run check`.

## Hosting and acceptance

- Use Node 22+ and `npm ci`, `npm run build`, `npm start` (or the host's Next.js integration). Keep the DB, Supabase and storage in a suitable region; use Supabase connection pooling.
- Probe `/api/health` for uptime. It returns only status and checks the CRM table is reachable. Connect platform error logs to alerts. Audit events record writes, enquiries and membership changes without copying contact data into logs.
- Verify owner login, revoked user denial, agent role restrictions, property create/edit/archive, valid/invalid upload, import/export, enquiry retry, visit conflicts, simultaneous tabs and mobile navigation against the deployed original project.
- Configure scheduled database backups or PITR, maintain a separate Storage backup, and perform a restore drill in an isolated database. Application JSON export is not a full infrastructure backup.
- Define and implement retention with the client. Periodically delete old rate-limit rows, expired idempotency records and unreferenced Storage images after a safe grace period. Do not delete objects still referenced by listings.

## Remaining production work

Local checks cannot certify live Google OAuth, Storage permissions, a production host, restore recovery, performance or user acceptance. Validate those after credentials are configured. Current UI still loads a workspace snapshot and submits it with a revision; writes persist only changed entities in transactions. Large teams/catalogues should move UI reads and mutations to paginated entity endpoints, and disjoint client changes can be merged on retry; conflicting changes to the same record require explicit review. Listings are capped at 1000 on the public page. Notification delivery and follow-up scheduling require a provider and delivery/retry configuration; they are not yet implemented. Image verification checks file signatures and size, not a full image decode or malware scan. The privacy notice should be reviewed for the client's actual retention and operating practices.
