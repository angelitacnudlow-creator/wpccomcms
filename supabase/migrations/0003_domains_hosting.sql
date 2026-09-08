-- 0003_domains_hosting.sql
-- Domain & Hosting storefront — see MASTER_PROMPT.md §17 for the full scope.
-- Run this in Supabase Dashboard > SQL Editor.

-- products gets a type discriminator; existing rows default to 'physical'
alter table public.products add column service_type text not null default 'physical'
  check (service_type in ('physical', 'hosting'));

-- hosting-specific spec fields, kept off `products` itself so that table
-- doesn't grow mostly-null columns for the physical-goods case. Pricing
-- reuses product_variants unchanged (one variant per billing cycle).
create table public.hosting_plan_specs (
  product_id uuid primary key references public.products (id) on delete cascade,
  disk_gb int,
  bandwidth_gb int,
  mailboxes int,
  databases int,
  hosted_domains int,
  feature_bullets jsonb not null default '[]'::jsonb
);

-- Domains are not products (no single product page — a live price list +
-- a free-text name field). Dedicated small table:
create table public.domain_tlds (
  id uuid primary key default gen_random_uuid(),
  tld text not null unique,
  register_price_bdt int not null,
  renewal_price_bdt int not null,
  status public.content_status not null default 'published'
);

-- order_items needs a non-variant path for domain line items — a domain has
-- no pre-existing variant row, it's whatever name the customer typed. Its
-- primary key was (order_id, variant_id), and Postgres won't let a PK
-- column be made nullable — swap to a surrogate id first.
alter table public.order_items drop constraint order_items_pkey;
alter table public.order_items add column id uuid not null default gen_random_uuid();
alter table public.order_items add primary key (id);
alter table public.order_items
  alter column variant_id drop not null,
  add column description text;

-- The piece that ties an order to an ongoing, renewable service.
create type public.subscription_status as enum
  ('pending_payment', 'pending_provisioning', 'active', 'expiring_soon', 'expired', 'cancelled');

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  service_type text not null check (service_type in ('hosting', 'domain')),
  product_id uuid references public.products (id),
  domain_tld_id uuid references public.domain_tlds (id),
  domain_name text,
  billing_cycle text check (billing_cycle in ('monthly', 'yearly')),
  term_years int,
  status public.subscription_status not null default 'pending_payment',
  current_period_end date,
  created_at timestamptz not null default now()
);

alter table public.orders
  add column subscription_id uuid references public.subscriptions (id),
  add column order_kind text not null default 'one_time'
    check (order_kind in ('one_time', 'new_service', 'renewal'));

-- RLS: domain_tlds mirrors redirects (public read, staff write).
alter table public.domain_tlds enable row level security;
create policy "domain_tlds_select_all" on public.domain_tlds for select using (true);
create policy "domain_tlds_write_staff" on public.domain_tlds for all using (public.is_staff()) with check (public.is_staff());

-- RLS: subscriptions mirrors orders (owner-or-staff read, owner insert, staff update).
alter table public.subscriptions enable row level security;
create policy "subscriptions_select_own_or_staff" on public.subscriptions
  for select using (user_id = auth.uid() or public.is_staff());
create policy "subscriptions_insert_own" on public.subscriptions
  for insert with check (user_id = auth.uid());
create policy "subscriptions_update_staff" on public.subscriptions
  for update using (public.is_staff());

-- hosting_plan_specs mirrors product_variants (public read, staff write).
alter table public.hosting_plan_specs enable row level security;
create policy "hosting_plan_specs_select_all" on public.hosting_plan_specs for select using (true);
create policy "hosting_plan_specs_write_staff" on public.hosting_plan_specs for all using (public.is_staff()) with check (public.is_staff());
