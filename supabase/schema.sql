-- ============================================================
-- VISE Dashboard — Supabase Schema
-- Run this in the Supabase SQL editor for your project.
-- ============================================================

-- ENUMS
create type facility_type as enum ('material_production', 'manufacturing');
create type user_role as enum ('viewer', 'editor');

-- ============================================================
-- TABLES
-- ============================================================

create table resources (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  category    text,
  created_at  timestamptz not null default now()
);

create table blueprints (
  id              uuid primary key default gen_random_uuid(),
  name            text not null unique,
  description     text,
  output_quantity integer not null default 1,
  notes           text,
  created_at      timestamptz not null default now()
);

create table blueprint_materials (
  id            uuid primary key default gen_random_uuid(),
  blueprint_id  uuid not null references blueprints(id) on delete cascade,
  resource_id   uuid references resources(id) on delete set null,
  material_name text,
  quantity      integer not null default 1,
  constraint chk_material check (resource_id is not null or material_name is not null)
);

create table facilities (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  type       facility_type not null,
  notes      text,
  created_at timestamptz not null default now()
);

-- Material production: one resource assignment per facility
create table facility_resource_assignments (
  id              uuid primary key default gen_random_uuid(),
  facility_id     uuid not null references facilities(id) on delete cascade,
  resource_id     uuid not null references resources(id) on delete cascade,
  production_rate numeric(10,2),
  notes           text,
  unique(facility_id)
);

-- Manufacturing: multiple blueprint assignments per facility
create table facility_blueprint_assignments (
  id               uuid primary key default gen_random_uuid(),
  facility_id      uuid not null references facilities(id) on delete cascade,
  blueprint_id     uuid not null references blueprints(id) on delete cascade,
  quantity_per_run integer not null default 1,
  notes            text,
  unique(facility_id, blueprint_id)
);

create table storefronts (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  location   text,
  notes      text,
  is_open    boolean not null default true,
  created_at timestamptz not null default now()
);

create table storefront_listings (
  id                 uuid primary key default gen_random_uuid(),
  storefront_id      uuid not null references storefronts(id) on delete cascade,
  blueprint_id       uuid not null references blueprints(id) on delete cascade,
  price              numeric(12,2),
  quantity_available integer,
  notes              text,
  unique(storefront_id, blueprint_id)
);

-- User roles — linked to Supabase auth users
create table user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role    user_role not null default 'viewer'
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table resources                      enable row level security;
alter table blueprints                     enable row level security;
alter table blueprint_materials            enable row level security;
alter table facilities                     enable row level security;
alter table facility_resource_assignments  enable row level security;
alter table facility_blueprint_assignments enable row level security;
alter table storefronts                    enable row level security;
alter table storefront_listings            enable row level security;
alter table user_roles                     enable row level security;

-- Helper: get current user's role
create or replace function current_user_role()
returns user_role
language sql
security definer
stable
as $$
  select role from user_roles where user_id = auth.uid();
$$;

-- READ: any authenticated user can read all data
create policy "auth read resources"    on resources    for select using (auth.role() = 'authenticated');
create policy "auth read blueprints"   on blueprints   for select using (auth.role() = 'authenticated');
create policy "auth read bp_materials" on blueprint_materials for select using (auth.role() = 'authenticated');
create policy "auth read facilities"   on facilities   for select using (auth.role() = 'authenticated');
create policy "auth read fac_res"      on facility_resource_assignments  for select using (auth.role() = 'authenticated');
create policy "auth read fac_bp"       on facility_blueprint_assignments for select using (auth.role() = 'authenticated');
create policy "auth read storefronts"  on storefronts  for select using (auth.role() = 'authenticated');
create policy "auth read sf_listings"  on storefront_listings for select using (auth.role() = 'authenticated');
create policy "read own role"          on user_roles   for select using (auth.uid() = user_id);

-- WRITE: only editors can mutate data
-- resources
create policy "editor insert resources" on resources for insert with check (current_user_role() = 'editor');
create policy "editor update resources" on resources for update using (current_user_role() = 'editor');
create policy "editor delete resources" on resources for delete using (current_user_role() = 'editor');

-- blueprints
create policy "editor insert blueprints" on blueprints for insert with check (current_user_role() = 'editor');
create policy "editor update blueprints" on blueprints for update using (current_user_role() = 'editor');
create policy "editor delete blueprints" on blueprints for delete using (current_user_role() = 'editor');

-- blueprint_materials
create policy "editor insert bp_materials" on blueprint_materials for insert with check (current_user_role() = 'editor');
create policy "editor update bp_materials" on blueprint_materials for update using (current_user_role() = 'editor');
create policy "editor delete bp_materials" on blueprint_materials for delete using (current_user_role() = 'editor');

-- facilities
create policy "editor insert facilities" on facilities for insert with check (current_user_role() = 'editor');
create policy "editor update facilities" on facilities for update using (current_user_role() = 'editor');
create policy "editor delete facilities" on facilities for delete using (current_user_role() = 'editor');

-- facility_resource_assignments
create policy "editor insert fac_res" on facility_resource_assignments for insert with check (current_user_role() = 'editor');
create policy "editor update fac_res" on facility_resource_assignments for update using (current_user_role() = 'editor');
create policy "editor delete fac_res" on facility_resource_assignments for delete using (current_user_role() = 'editor');

-- facility_blueprint_assignments
create policy "editor insert fac_bp" on facility_blueprint_assignments for insert with check (current_user_role() = 'editor');
create policy "editor update fac_bp" on facility_blueprint_assignments for update using (current_user_role() = 'editor');
create policy "editor delete fac_bp" on facility_blueprint_assignments for delete using (current_user_role() = 'editor');

-- storefronts
create policy "editor insert storefronts" on storefronts for insert with check (current_user_role() = 'editor');
create policy "editor update storefronts" on storefronts for update using (current_user_role() = 'editor');
create policy "editor delete storefronts" on storefronts for delete using (current_user_role() = 'editor');

-- storefront_listings
create policy "editor insert sf_listings" on storefront_listings for insert with check (current_user_role() = 'editor');
create policy "editor update sf_listings" on storefront_listings for update using (current_user_role() = 'editor');
create policy "editor delete sf_listings" on storefront_listings for delete using (current_user_role() = 'editor');

-- ============================================================
-- INITIAL SETUP (run once after creating your first user)
-- Replace <your-user-uuid> with the UUID from auth.users
-- ============================================================
-- insert into user_roles (user_id, role) values ('<your-user-uuid>', 'editor');

-- ============================================================
-- MIGRATION 1 — Resource KG rework
-- Run these if you already applied the original schema above.
-- ============================================================

-- Add weight_kg to resources (informational weight per unit)
alter table resources add column if not exists weight_kg numeric(10,3);

-- Rename quantity → weight_kg in blueprint_materials
alter table blueprint_materials rename column quantity to weight_kg;
alter table blueprint_materials alter column weight_kg set default 1.0;
alter table blueprint_materials alter column weight_kg type numeric(10,3) using weight_kg::numeric(10,3);

-- ============================================================
-- MIGRATION 2 — Kingdom expansion
-- ============================================================

create type territory_status as enum ('controlled', 'contested', 'developing', 'lost');
create type relation_status as enum ('allied', 'neutral', 'hostile', 'at_war', 'trade_partner');

create table territories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  status      territory_status not null default 'controlled',
  notes       text,
  created_at  timestamptz not null default now()
);

-- Link facilities and storefronts to territories
alter table facilities  add column if not exists territory_id uuid references territories(id) on delete set null;
alter table storefronts add column if not exists territory_id uuid references territories(id) on delete set null;

-- Resource nodes in a territory
create table territory_resources (
  id           uuid primary key default gen_random_uuid(),
  territory_id uuid not null references territories(id) on delete cascade,
  resource_id  uuid not null references resources(id) on delete cascade,
  notes        text,
  unique(territory_id, resource_id)
);

-- Members (kingdom roster)
create table members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  rank       text,
  discord    text,
  notes      text,
  created_at timestamptz not null default now()
);

-- Member assignments to facilities or storefronts
create table member_assignments (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references members(id) on delete cascade,
  facility_id   uuid references facilities(id) on delete set null,
  storefront_id uuid references storefronts(id) on delete set null,
  role_notes    text
);

-- External factions
create table factions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  status      relation_status not null default 'neutral',
  notes       text,
  created_at  timestamptz not null default now()
);

-- Treaties with factions
create table treaties (
  id          uuid primary key default gen_random_uuid(),
  faction_id  uuid not null references factions(id) on delete cascade,
  title       text not null,
  description text,
  created_at  timestamptz not null default now()
);

-- RLS for new tables
alter table territories        enable row level security;
alter table territory_resources enable row level security;
alter table members            enable row level security;
alter table member_assignments enable row level security;
alter table factions           enable row level security;
alter table treaties           enable row level security;

-- Read policies
create policy "auth read territories"         on territories         for select using (auth.role() = 'authenticated');
create policy "auth read territory_resources" on territory_resources for select using (auth.role() = 'authenticated');
create policy "auth read members"             on members             for select using (auth.role() = 'authenticated');
create policy "auth read member_assignments"  on member_assignments  for select using (auth.role() = 'authenticated');
create policy "auth read factions"            on factions            for select using (auth.role() = 'authenticated');
create policy "auth read treaties"            on treaties            for select using (auth.role() = 'authenticated');

-- Write policies (editors only)
create policy "editor insert territories"         on territories         for insert with check (current_user_role() = 'editor');
create policy "editor update territories"         on territories         for update using  (current_user_role() = 'editor');
create policy "editor delete territories"         on territories         for delete using  (current_user_role() = 'editor');

create policy "editor insert territory_resources" on territory_resources for insert with check (current_user_role() = 'editor');
create policy "editor update territory_resources" on territory_resources for update using  (current_user_role() = 'editor');
create policy "editor delete territory_resources" on territory_resources for delete using  (current_user_role() = 'editor');

create policy "editor insert members"             on members             for insert with check (current_user_role() = 'editor');
create policy "editor update members"             on members             for update using  (current_user_role() = 'editor');
create policy "editor delete members"             on members             for delete using  (current_user_role() = 'editor');

create policy "editor insert member_assignments"  on member_assignments  for insert with check (current_user_role() = 'editor');
create policy "editor update member_assignments"  on member_assignments  for update using  (current_user_role() = 'editor');
create policy "editor delete member_assignments"  on member_assignments  for delete using  (current_user_role() = 'editor');

create policy "editor insert factions"            on factions            for insert with check (current_user_role() = 'editor');
create policy "editor update factions"            on factions            for update using  (current_user_role() = 'editor');
create policy "editor delete factions"            on factions            for delete using  (current_user_role() = 'editor');

create policy "editor insert treaties"            on treaties            for insert with check (current_user_role() = 'editor');
create policy "editor update treaties"            on treaties            for update using  (current_user_role() = 'editor');
create policy "editor delete treaties"            on treaties            for delete using  (current_user_role() = 'editor');
