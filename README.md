# Property CRM

Next.js 15, React 19, Supabase Google Auth, server-only PostgreSQL and Supabase Storage.

## Local setup

1. Run `npm ci` with Node 22+.
2. Copy `.env.example` to `.env.local` and fill actual settings for the confirmed Supabase project `huusdwrwsmlrqrwsgvfv`. Keep secrets out of source control and chat.
3. Inspect existing remote tables and migration history before applying `supabase/migrations/20261030045413_neutral_crm.sql`.
4. Configure Google OAuth and callback URLs, then set `CRM_OWNER_EMAIL` and `AGENCY_SLUG`. The owner's first login creates an empty agency.
5. Run `npm run env:check`, `npm run db:check`, `npm run check`, and `npm run dev`.

The application uses neutral table names: agencies, agency_memberships, properties, leads, visits, public_submissions, audit_events and rate_limits. It no longer reads or writes the legacy `forma_` tables. The original migration remains as historical source. The user-requested removal of the four known legacy tables is prepared in `supabase/legacy-reset.sql`; it was executed against the confirmed project after verifying all four legacy tables were empty.

## Validation

`npm run check` runs TypeScript, automated tests (including an isolated embedded PostgreSQL migration/constraint test), and the production build. `npm run env:check -- --production` checks required production settings without printing secrets. `/api/health` checks CRM database availability.

## Access and data

Only approved agency memberships can read or mutate private records. Owners manage agents in Settings, branding and destructive workspace changes. New Google users can sign in but do not gain agency access until an owner grants it. Direct anon/authenticated table access is denied; privileged database and Storage credentials stay server-only.

Saves are serialized in the browser, use optimistic concurrency across devices, and persist changed entities transactionally. On a conflict, reload before retrying. Public enquiries use scoped idempotency, atomic throttling, Turnstile in production, future-time validation and a database-enforced visit slot constraint. Image uploads use signed URLs, bucket MIME/size limits and a server file-signature check.

## Live cutover

Read [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for exact setup, legacy removal, acceptance checks, backups and remaining operational work. The `crm_supabase` MCP entry is authenticated for the confirmed project; its tools are now available in this session. The existing `supabase` entry is a different project and must not be used for this database.

The neutral schema and legacy cleanup have been applied remotely. Google login has been completed and the runtime DB connection is verified. The Storage secret key remains missing. Actual login, hosted uploads and deployment require those settings and acceptance verification. A passing local build is not proof of those external steps.
