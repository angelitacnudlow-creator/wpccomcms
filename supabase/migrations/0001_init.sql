-- 0001_init.sql
-- Phase 1 foundation schema. Run this in Supabase Dashboard > SQL Editor
-- (or `supabase db push` if you switch to the CLI later).

-- ============================================================
-- Enums
-- ============================================================
create type public.user_role as enum ('admin', 'editor', 'author', 'contributor', 'customer');
create type public.content_status as enum ('draft', 'scheduled', 'published');
create type public.comment_status as enum ('pending', 'approved', 'spam');
create type public.order_status as enum ('pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled');
create type public.payment_method as enum ('cod', 'stripe_demo');

-- ============================================================
-- Profiles (extends auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'customer',
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new Supabase Auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    'customer'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper used throughout RLS policies below. SECURITY DEFINER avoids
-- recursive-RLS issues when a policy needs to know the caller's role.
create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_user_role() in ('admin', 'editor'), false);
$$;

-- ============================================================
-- Media library
-- ============================================================
create table public.media (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  url text not null,
  alt_text text,
  caption text,
  mime_type text,
  width int,
  height int,
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- Taxonomies (categories / tags / product_category)
-- ============================================================
create table public.taxonomies (
  id uuid primary key default gen_random_uuid(),
  key text not null unique
);

create table public.terms (
  id uuid primary key default gen_random_uuid(),
  taxonomy_id uuid not null references public.taxonomies (id) on delete cascade,
  name text not null,
  slug text not null,
  unique (taxonomy_id, slug)
);

insert into public.taxonomies (key) values ('category'), ('tag'), ('product_category');

-- ============================================================
-- Posts
-- ============================================================
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content jsonb not null default '[]'::jsonb,
  featured_image_id uuid references public.media (id),
  status public.content_status not null default 'draft',
  author_id uuid not null references public.profiles (id),
  seo_title text,
  seo_description text,
  seo_og_image_id uuid references public.media (id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.post_terms (
  post_id uuid not null references public.posts (id) on delete cascade,
  term_id uuid not null references public.terms (id) on delete cascade,
  primary key (post_id, term_id)
);

-- ============================================================
-- Pages
-- ============================================================
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content jsonb not null default '[]'::jsonb,
  template text not null default 'default',
  status public.content_status not null default 'draft',
  seo_title text,
  seo_description text,
  seo_og_image_id uuid references public.media (id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Comments (login required — no guest name/email path)
-- ============================================================
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  body text not null,
  status public.comment_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- ============================================================
-- Menus & menu items
-- ============================================================
create table public.menus (
  id uuid primary key default gen_random_uuid(),
  key text not null unique
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.menus (id) on delete cascade,
  label text not null,
  url text not null,
  parent_id uuid references public.menu_items (id) on delete cascade,
  sort_order int not null default 0
);

insert into public.menus (key) values ('header'), ('footer');

-- ============================================================
-- Reusable content blocks (footer / sidebar / announcement bar)
-- ============================================================
create table public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  region text not null,
  content jsonb not null default '[]'::jsonb,
  sort_order int not null default 0
);

-- ============================================================
-- Site settings (singleton)
-- ============================================================
create table public.site_settings (
  id int primary key default 1,
  site_name text not null default 'My Site',
  tagline text,
  logo_media_id uuid references public.media (id),
  favicon_media_id uuid references public.media (id),
  primary_color text default '#111111',
  social_links jsonb not null default '{}'::jsonb,
  constraint single_row check (id = 1)
);

insert into public.site_settings (id) values (1);

-- ============================================================
-- Redirects
-- ============================================================
create table public.redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique,
  to_path text not null,
  status_code int not null default 301
);

-- ============================================================
-- Contact form submissions
-- ============================================================
create table public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_key text not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Products / variants / images (prices stored as integer poysha, BDT * 100)
-- ============================================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description jsonb not null default '[]'::jsonb,
  status public.content_status not null default 'draft',
  base_price_bdt int not null default 0,
  featured_image_id uuid references public.media (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text not null unique,
  name text not null,
  price_bdt int not null,
  stock int not null default 0,
  attributes jsonb not null default '{}'::jsonb
);

create table public.product_images (
  product_id uuid not null references public.products (id) on delete cascade,
  media_id uuid not null references public.media (id) on delete cascade,
  sort_order int not null default 0,
  primary key (product_id, media_id)
);

-- ============================================================
-- Cart (login required)
-- ============================================================
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.cart_items (
  cart_id uuid not null references public.carts (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id),
  quantity int not null check (quantity > 0),
  primary key (cart_id, variant_id)
);

-- ============================================================
-- Orders (BDT, COD-first, Stripe test-mode as secondary demo path)
-- ============================================================
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  phone text,
  status public.order_status not null default 'pending',
  payment_method public.payment_method not null default 'cod',
  stripe_session_id text,
  currency text not null default 'BDT',
  subtotal_bdt int not null,
  total_bdt int not null,
  shipping_address jsonb not null,
  created_at timestamptz not null default now()
);

create table public.order_items (
  order_id uuid not null references public.orders (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id),
  quantity int not null check (quantity > 0),
  unit_price_bdt int not null,
  primary key (order_id, variant_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.media enable row level security;
alter table public.taxonomies enable row level security;
alter table public.terms enable row level security;
alter table public.posts enable row level security;
alter table public.post_terms enable row level security;
alter table public.pages enable row level security;
alter table public.comments enable row level security;
alter table public.menus enable row level security;
alter table public.menu_items enable row level security;
alter table public.content_blocks enable row level security;
alter table public.site_settings enable row level security;
alter table public.redirects enable row level security;
alter table public.form_submissions enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- profiles: read own row, or any row if staff. Self-service update of own
-- row is allowed, but a trigger below blocks non-admins from changing
-- their own `role` column (otherwise any user could self-promote to admin).
create policy "profiles_select_own_or_staff" on public.profiles
  for select using (id = auth.uid() or public.is_staff());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    -- auth.uid() is null when called via the service-role client (trusted
    -- server-side admin actions) — only block role changes made by a
    -- logged-in, non-admin user acting on their own/another's row.
    if auth.uid() is not null and public.current_user_role() <> 'admin' then
      raise exception 'Only admins can change a profile role';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

-- media: public read; staff + authors/contributors can upload.
create policy "media_select_all" on public.media for select using (true);
create policy "media_insert_creators" on public.media
  for insert with check (public.current_user_role() in ('admin', 'editor', 'author', 'contributor'));
create policy "media_modify_staff" on public.media
  for update using (public.is_staff());
create policy "media_delete_staff" on public.media
  for delete using (public.is_staff());

-- taxonomies/terms: public read; staff write.
create policy "taxonomies_select_all" on public.taxonomies for select using (true);
create policy "taxonomies_write_staff" on public.taxonomies for all using (public.is_staff()) with check (public.is_staff());
create policy "terms_select_all" on public.terms for select using (true);
create policy "terms_write_staff" on public.terms for all using (public.is_staff()) with check (public.is_staff());

-- posts: public read published; author reads/writes own; staff full access.
create policy "posts_select_published_or_own_or_staff" on public.posts
  for select using (status = 'published' or author_id = auth.uid() or public.is_staff());
create policy "posts_insert_creators" on public.posts
  for insert with check (
    author_id = auth.uid()
    and public.current_user_role() in ('admin', 'editor', 'author', 'contributor')
  );
create policy "posts_update_own_or_staff" on public.posts
  for update using (author_id = auth.uid() or public.is_staff());
create policy "posts_delete_staff" on public.posts
  for delete using (public.is_staff());

create policy "post_terms_select_all" on public.post_terms for select using (true);
create policy "post_terms_write_creators" on public.post_terms
  for all using (
    public.is_staff()
    or exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
  )
  with check (
    public.is_staff()
    or exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
  );

-- pages: public read published; staff write (pages have no per-author ownership model).
create policy "pages_select_published_or_staff" on public.pages
  for select using (status = 'published' or public.is_staff());
create policy "pages_write_staff" on public.pages for all using (public.is_staff()) with check (public.is_staff());

-- comments: read approved, or own, or staff. Insert requires login (any role). Own pending edit/delete, or staff moderates.
create policy "comments_select_approved_or_own_or_staff" on public.comments
  for select using (status = 'approved' or user_id = auth.uid() or public.is_staff());
create policy "comments_insert_own" on public.comments
  for insert with check (user_id = auth.uid());
create policy "comments_update_own_or_staff" on public.comments
  for update using (user_id = auth.uid() or public.is_staff());
create policy "comments_delete_own_or_staff" on public.comments
  for delete using (user_id = auth.uid() or public.is_staff());

-- menus/menu_items/content_blocks/site_settings/redirects: public read, staff write.
create policy "menus_select_all" on public.menus for select using (true);
create policy "menus_write_staff" on public.menus for all using (public.is_staff()) with check (public.is_staff());
create policy "menu_items_select_all" on public.menu_items for select using (true);
create policy "menu_items_write_staff" on public.menu_items for all using (public.is_staff()) with check (public.is_staff());
create policy "content_blocks_select_all" on public.content_blocks for select using (true);
create policy "content_blocks_write_staff" on public.content_blocks for all using (public.is_staff()) with check (public.is_staff());
create policy "site_settings_select_all" on public.site_settings for select using (true);
create policy "site_settings_write_admin" on public.site_settings
  for update using (public.current_user_role() = 'admin');
create policy "redirects_select_all" on public.redirects for select using (true);
create policy "redirects_write_staff" on public.redirects for all using (public.is_staff()) with check (public.is_staff());

-- form_submissions: anyone (including anonymous) can submit; only staff can read.
create policy "form_submissions_insert_all" on public.form_submissions for insert with check (true);
create policy "form_submissions_select_staff" on public.form_submissions for select using (public.is_staff());

-- products/variants/images: public read published products (and their variants/images); staff write.
create policy "products_select_published_or_staff" on public.products
  for select using (status = 'published' or public.is_staff());
create policy "products_write_staff" on public.products for all using (public.is_staff()) with check (public.is_staff());

create policy "product_variants_select_all" on public.product_variants for select using (true);
create policy "product_variants_write_staff" on public.product_variants for all using (public.is_staff()) with check (public.is_staff());

create policy "product_images_select_all" on public.product_images for select using (true);
create policy "product_images_write_staff" on public.product_images for all using (public.is_staff()) with check (public.is_staff());

-- carts/cart_items: strictly own cart only (staff do not get a bypass here — no business need).
create policy "carts_all_own" on public.carts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "cart_items_all_own" on public.cart_items
  for all using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));

-- orders/order_items: own orders, or staff. Staff can update status; customers can only insert/select their own.
create policy "orders_select_own_or_staff" on public.orders
  for select using (user_id = auth.uid() or public.is_staff());
create policy "orders_insert_own" on public.orders
  for insert with check (user_id = auth.uid());
create policy "orders_update_staff" on public.orders
  for update using (public.is_staff());

create policy "order_items_select_own_or_staff" on public.order_items
  for select using (
    public.is_staff()
    or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy "order_items_insert_own" on public.order_items
  for insert with check (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
