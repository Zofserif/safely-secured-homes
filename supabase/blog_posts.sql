-- Blog posts table for /blog, EmailJS campaigns, and /blog/[slug].
-- Run this in the Supabase SQL editor before using /admin/blog.
-- `content` and `cta` remain the trusted rendered HTML used by the website
-- and newsletter email sends.
-- `content_markdown` and `cta_markdown` are the admin editor source fields
-- used to derive those rendered HTML values on save.
-- `cta_label` and `cta_url` remain for legacy compatibility only.
--
-- Rollout notes:
-- 1. Run this file once to add the admin/status fields and backfill visibility.
-- 2. Run `npm run backfill:blog-admin-fields` once to populate source fields
--    for existing rows that only have rendered HTML.
-- 3. If you are still migrating from the old legacy markdown-only schema,
--    run `npm run backfill:blog-posts` before step 2.

create extension if not exists pgcrypto;

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  subject text not null default '',
  title text not null,
  content text not null default '',
  preview_text text not null default '',
  cta text not null default '',
  status text not null default 'draft',
  published_at timestamptz,
  content_markdown text not null default '',
  cta_markdown text not null default '',
  cta_label text not null default '',
  cta_url text not null default '',
  newsletter_enabled boolean not null default false,
  newsletter_send_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blog_posts
  add column if not exists subject text not null default '';

alter table public.blog_posts
  add column if not exists content text not null default '';

alter table public.blog_posts
  add column if not exists preview_text text not null default '';

alter table public.blog_posts
  add column if not exists cta text not null default '';

alter table public.blog_posts
  add column if not exists status text not null default 'draft';

alter table public.blog_posts
  add column if not exists published_at timestamptz;

alter table public.blog_posts
  add column if not exists content_markdown text not null default '';

alter table public.blog_posts
  add column if not exists cta_markdown text not null default '';

alter table public.blog_posts
  add column if not exists cta_label text not null default '';

alter table public.blog_posts
  add column if not exists cta_url text not null default '';

alter table public.blog_posts
  add column if not exists newsletter_enabled boolean not null default false;

alter table public.blog_posts
  add column if not exists newsletter_send_key text;

alter table public.blog_posts
  add column if not exists created_at timestamptz not null default now();

alter table public.blog_posts
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'blog_posts_status_check'
  ) then
    alter table public.blog_posts
      add constraint blog_posts_status_check
      check (status in ('draft', 'published'));
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'blog_posts'
      and column_name = 'excerpt'
  ) then
    update public.blog_posts
    set preview_text = coalesce(
      nullif(btrim(preview_text), ''),
      nullif(btrim(excerpt), ''),
      preview_text
    )
    where preview_text is null
       or btrim(preview_text) = '';
  end if;
end
$$;

update public.blog_posts
set subject = coalesce(nullif(btrim(subject), ''), nullif(btrim(title), ''), subject)
where subject is null
   or btrim(subject) = '';

update public.blog_posts
set status = 'published'
where status is null
   or btrim(status) = '';

update public.blog_posts
set published_at = coalesce(published_at, created_at)
where status = 'published'
  and published_at is null;

drop index if exists blog_posts_created_at_idx;
create index if not exists blog_posts_created_at_idx
  on public.blog_posts (created_at desc);

drop index if exists blog_posts_published_at_idx;
create index if not exists blog_posts_published_at_idx
  on public.blog_posts (published_at desc)
  where status = 'published';

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

-- Cleanup for older schemas that still carried unused blog metadata columns.
alter table public.blog_posts drop column if exists read_time_minutes;
alter table public.blog_posts drop column if exists tags;
alter table public.blog_posts drop column if exists cover_image;
alter table public.blog_posts drop column if exists email_assets;
alter table public.blog_posts drop column if exists sections;
alter table public.blog_posts drop column if exists asset_url;
alter table public.blog_posts drop column if exists asset_type;
alter table public.blog_posts drop column if exists alt_text;
alter table public.blog_posts drop constraint if exists blog_posts_asset_type_check;
alter table public.blog_posts drop column if exists excerpt;

-- CTA examples for `blog_posts.cta_markdown`:
-- Free Plan
-- [Get My Free Plan](https://www.safelysecuredhomes.com/form?source=blog_cta_free_plan)
--
-- Book Call
-- Need help deciding? [Book a Free Site Visit](https://www.safelysecuredhomes.com/schedule-call?source=blog_cta_book_call)
--
-- Checklist
-- [Get the Free Home Safety Checklist](https://www.safelysecuredhomes.com/newsletter?source=blog_cta_checklist)
--
-- Example row shape:
-- insert into public.blog_posts (
--   slug, subject, title, content, preview_text, cta, status, published_at,
--   content_markdown, cta_markdown, newsletter_enabled, created_at
-- ) values (
--   'camera-placement-mistakes-families-make',
--   'Who Carries the "What-Ifs" for Your Home Tonight?',
--   'Who Carries the "What-Ifs" for Your Home Tonight?',
--   '<h2>The Weight of the What-Ifs</h2><p>Thank you for trusting us with your home...</p>',
--   'A personal story about nightly worries, peace of mind, and the first practical step families can take to feel safer at home.',
--   '<p><a href="https://www.safelysecuredhomes.com/form?source=blog_cta_free_plan">Get My Free Plan</a></p>',
--   'published',
--   '2026-01-28T00:00:00Z',
--   '## The Weight of the What-Ifs\n\nThank you for trusting us with your home...',
--   '[Get My Free Plan](https://www.safelysecuredhomes.com/form?source=blog_cta_free_plan)',
--   true,
--   '2026-01-28T00:00:00Z'
-- );
