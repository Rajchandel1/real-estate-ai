-- App reads use server-only PostgreSQL credentials; anon/authenticated PostgREST roles get no access.
create extension if not exists pgcrypto;
create table if not exists public.forma_agencies(id uuid primary key default gen_random_uuid(),slug text not null unique,created_at timestamptz not null default now());
create table if not exists public.forma_memberships(user_id uuid not null references auth.users(id) on delete cascade,agency_id uuid not null references public.forma_agencies(id) on delete cascade,role text not null check(role in('owner','agent')),active boolean not null default true,primary key(user_id,agency_id));
create table if not exists public.forma_workspace(agency_id uuid primary key references public.forma_agencies(id) on delete cascade,payload jsonb not null,revision integer not null default 0,updated_at timestamptz not null default now());
create index if not exists forma_memberships_user on public.forma_memberships(user_id) where active;
alter table public.forma_agencies enable row level security;
alter table public.forma_memberships enable row level security;
alter table public.forma_workspace enable row level security;
revoke all on public.forma_agencies,public.forma_memberships,public.forma_workspace from anon,authenticated;
-- No public policies: browser-side access to these private snapshots is denied.

create table if not exists public.forma_public_submissions(id uuid primary key,agency_id uuid not null references public.forma_agencies(id),phone_hash text not null,created_at timestamptz not null default now());
create index if not exists forma_submissions_age on public.forma_public_submissions(created_at);
alter table public.forma_public_submissions enable row level security;
revoke all on public.forma_public_submissions from anon,authenticated;
