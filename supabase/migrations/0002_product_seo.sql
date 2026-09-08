-- 0002_product_seo.sql
-- products never got the seo_title/seo_description/seo_og_image_id columns
-- that posts/pages have (0001_init.sql) — this closes that gap.
-- Run this in Supabase Dashboard > SQL Editor.

alter table public.products
  add column seo_title text,
  add column seo_description text,
  add column seo_og_image_id uuid references public.media (id);
