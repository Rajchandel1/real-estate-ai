-- Neutral, tenant-scoped CRM schema. Legacy tables are intentionally not deleted here.
create table public.agencies (
 id uuid primary key default gen_random_uuid(), slug text unique not null check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 broker jsonb not null default '{}', revision integer not null default 0, timezone text not null default 'Asia/Kolkata',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.agency_memberships (
 user_id uuid not null references auth.users(id) on delete cascade, agency_id uuid not null references public.agencies(id) on delete cascade,
 role text not null check(role in ('owner','agent')), active boolean not null default true, primary key(user_id,agency_id)
);
create index agency_memberships_agency on public.agency_memberships(agency_id);
create table public.properties (
 id text not null, agency_id uuid not null references public.agencies(id) on delete cascade, title text not null,
 purpose text not null check(purpose in ('sale','rent')), type text not null check(type in ('apartment','villa','plot','commercial')),
 price double precision not null check(price>0), bhk integer not null check(bhk>=0), baths integer not null check(baths>=0),
 sqft double precision not null check(sqft>0), carpet_area double precision, location text not null, city text not null,
 status text not null check(status in ('Active','Inactive','Sold','Rented')), featured boolean not null default false,
 description text not null default '', amenities text[] not null default '{}', image text not null default '', furnishing text not null default '',
 society_name text not null default '', floor_number integer, total_floors integer, created_at timestamptz not null default now(), views integer not null default 0,
 primary key(agency_id,id), check(floor_number is null or total_floors is null or floor_number<=total_floors)
);
create index properties_catalogue on public.properties(agency_id,status,created_at desc);
create table public.leads (
 id text not null, agency_id uuid not null references public.agencies(id) on delete cascade, name text not null, phone text not null,
 email text not null default '', status text not null check(status in ('New','Contacted','Qualified','Visit booked','Closed')),
 source text not null, purpose text not null check(purpose in ('sale','rent')), budget text not null default '', location text not null default '',
 type text not null default 'Any', bhk text not null default 'Any', interests text[] not null default '{}', notes text not null default '',
 created_at timestamptz not null default now(), primary key(agency_id,id)
);
create index leads_phone on public.leads(agency_id,phone);
create index leads_pipeline on public.leads(agency_id,status,created_at desc);
create table public.visits (
 id text not null, agency_id uuid not null references public.agencies(id) on delete cascade, lead_id text not null, property_id text not null,
 date date not null, time text not null check(time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
 status text not null check(status in ('Requested','Confirmed','Completed','Cancelled')), created_at timestamptz not null default now(),
 primary key(agency_id,id), foreign key(agency_id,lead_id) references public.leads(agency_id,id),
 foreign key(agency_id,property_id) references public.properties(agency_id,id)
);
create unique index visits_available_slot on public.visits(agency_id,property_id,date,time) where status in ('Requested','Confirmed');
create index visits_buyer on public.visits(agency_id,lead_id);
create index visits_property on public.visits(agency_id,property_id);
create table public.public_submissions (
 agency_id uuid not null references public.agencies(id) on delete cascade, id uuid not null, phone_hash text not null,
 request_hash text not null, created_at timestamptz not null default now(), primary key(agency_id,id)
);
create index public_submissions_throttle on public.public_submissions(agency_id,phone_hash,created_at);
create table public.audit_events (
 id bigint generated always as identity primary key, agency_id uuid not null references public.agencies(id) on delete cascade,
 actor_id uuid references auth.users(id) on delete set null, action text not null, details jsonb not null default '{}', created_at timestamptz not null default now()
);
create index audit_events_agency on public.audit_events(agency_id,created_at desc);
create index audit_events_actor on public.audit_events(actor_id);
create table public.rate_limits (key text primary key, window_start timestamptz not null, count integer not null);
alter table public.agencies enable row level security;
alter table public.agency_memberships enable row level security;
alter table public.properties enable row level security;
alter table public.leads enable row level security;
alter table public.visits enable row level security;
alter table public.public_submissions enable row level security;
alter table public.audit_events enable row level security;
alter table public.rate_limits enable row level security;
-- Access is through authenticated, tenant-authorized server operations only.
revoke all on public.agencies,public.agency_memberships,public.properties,public.leads,public.visits,public.public_submissions,public.audit_events,public.rate_limits from anon,authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('property-images','property-images',true,5242880,array['image/jpeg','image/png','image/webp'])
 on conflict(id) do nothing;
