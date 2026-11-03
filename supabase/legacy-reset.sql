-- Run ONLY against confirmed project huusdwrwsmlrqrwsgvfv AFTER inspecting these exact tables,
-- exporting any required data, and applying/verifying the new schema.
-- User requested a clean reset. RESTRICT is deliberate: unexpected dependencies stop the transaction.
begin;
drop table if exists public.forma_public_submissions restrict;
drop table if exists public.forma_workspace restrict;
drop table if exists public.forma_memberships restrict;
drop table if exists public.forma_agencies restrict;
commit;
