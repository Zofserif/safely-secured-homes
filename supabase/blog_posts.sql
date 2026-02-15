-- Blog posts table for /blog and /blog/[slug].
-- Run this in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  published_at date not null default current_date,
  content_markdown text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_published_at_idx
  on public.blog_posts (published_at desc);

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_blog_posts_updated_at on public.blog_posts;
create trigger set_blog_posts_updated_at
before update on public.blog_posts
for each row execute function public.set_updated_at_timestamp();

-- Cleanup for existing databases that still have old columns.
alter table public.blog_posts drop column if exists read_time_minutes;
alter table public.blog_posts drop column if exists tags;
alter table public.blog_posts drop column if exists cover_image;
alter table public.blog_posts drop column if exists email_assets;
alter table public.blog_posts drop column if exists sections;
alter table public.blog_posts drop column if exists asset_url;
alter table public.blog_posts drop column if exists asset_type;
alter table public.blog_posts drop column if exists alt_text;
alter table public.blog_posts add column if not exists content_markdown text not null default '';
alter table public.blog_posts drop constraint if exists blog_posts_asset_type_check;

-- Example row shape:
-- insert into public.blog_posts (
--   slug, title, excerpt, published_at, content_markdown
-- ) values (
--   'camera-placement-mistakes-families-make',
--   '7 Camera Placement Mistakes Families Make (and How to Fix Them)',
--   'Most camera setups fail because of placement, not equipment.',
--   '2026-01-28',
--   '## Start with Risk Zones, Not Camera Count\n\nMany homeowners buy cameras first and plan coverage later.'
-- );
