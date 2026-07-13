-- Full schema for Tamak by Bhavneet (migrated from Firestore).
-- Document-shaped tables: (id text PK, data jsonb) + STORED generated columns
-- for the few fields queried/ordered/uniqued in SQL. Date columns are text
-- (ISO 8601 strings) because timestamptz casts are not immutable in generated
-- columns; ISO strings sort chronologically.

create table if not exists products (
  id   text primary key,
  data jsonb not null,
  slug   text    generated always as (data->>'slug') stored,
  active boolean generated always as (coalesce((data->>'active')::boolean, true)) stored,
  updated_at timestamptz not null default now()
);
create index if not exists products_slug_idx on products (slug);

create table if not exists orders (
  id   text primary key default gen_random_uuid()::text,
  data jsonb not null,
  user_id        text generated always as (data->>'userId') stored,
  status         text generated always as (data->>'status') stored,
  customer_email text generated always as (lower(data->'customer'->>'email')) stored,
  created_at     text generated always as (data->>'createdAt') stored
);
create index if not exists orders_user_id_idx on orders (user_id);
create index if not exists orders_customer_email_idx on orders (customer_email);
create index if not exists orders_created_at_idx on orders (created_at desc);

create table if not exists categories (
  id   text primary key,
  data jsonb not null
);

create table if not exists content (
  id   text primary key,
  data jsonb not null
);

create table if not exists settings (
  id   text primary key,
  data jsonb not null
);

create table if not exists subscribers (
  id   text primary key default gen_random_uuid()::text,
  data jsonb not null,
  email      text generated always as (lower(data->>'email')) stored,
  status     text generated always as (data->>'status') stored,
  created_at text generated always as (data->>'createdAt') stored
);
create unique index if not exists subscribers_email_uq on subscribers (email);

create table if not exists campaigns (
  id   text primary key default gen_random_uuid()::text,
  data jsonb not null,
  created_at text generated always as (data->>'createdAt') stored
);
create index if not exists campaigns_created_at_idx on campaigns (created_at desc);

create table if not exists audit_log (
  id   bigint generated always as identity primary key,
  data jsonb not null,
  at   text generated always as (data->>'at') stored
);
create index if not exists audit_log_at_idx on audit_log (at desc);

create table if not exists media_library (
  id   text primary key default gen_random_uuid()::text,
  data jsonb not null,
  prefix      text generated always as (data->>'prefix') stored,
  uploaded_at text generated always as (data->>'uploadedAt') stored
);
create index if not exists media_library_uploaded_at_idx on media_library (uploaded_at desc);
create index if not exists media_library_prefix_idx on media_library (prefix);

-- Admin allowlist tied to Supabase Auth users.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS on everywhere, NO policies: anon/authenticated are fully blocked.
-- All app access goes through the service-role server client (bypasses RLS),
-- mirroring the previous "Firebase Admin SDK bypasses rules" architecture.
alter table products      enable row level security;
alter table orders        enable row level security;
alter table categories    enable row level security;
alter table content       enable row level security;
alter table settings      enable row level security;
alter table subscribers   enable row level security;
alter table campaigns     enable row level security;
alter table audit_log     enable row level security;
alter table media_library enable row level security;
alter table profiles      enable row level security;
