-- Blog posts table for /blog, EmailJS campaigns, and /blog/[slug].
-- Run this in Supabase SQL editor.
-- `cta` stores the final trusted HTML fragment that is injected into both
-- EmailJS (`{{{cta}}}`) and the blog page. Do not store JSON or label-only text.
-- Use absolute `https://www.safelysecuredhomes.com/...` URLs so the same value
-- works in email and on the website. Use '' when a post has no CTA.
-- If you are migrating legacy rows:
-- 1. Run this file once to add the new columns and backfill subject/preview_text.
-- 2. Run `npm run backfill:blog-posts` to populate content/cta from legacy fields.
-- 3. Run this file again to drop the legacy columns after backfill is complete.

create extension if not exists pgcrypto;

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  subject text not null default '',
  title text not null,
  content text not null default '',
  preview_text text not null default '',
  cta text not null default '',
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
  add column if not exists created_at timestamptz not null default now();

alter table public.blog_posts
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'blog_posts'
      and column_name = 'published_at'
  ) then
    update public.blog_posts
    set created_at = (published_at::text || 'T00:00:00Z')::timestamptz
    where published_at is not null;
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
    set preview_text = coalesce(nullif(btrim(preview_text), ''), nullif(btrim(excerpt), ''), preview_text)
    where preview_text is null
       or btrim(preview_text) = '';
  end if;
end
$$;

update public.blog_posts
set subject = coalesce(nullif(btrim(subject), ''), nullif(btrim(title), ''), subject)
where subject is null
   or btrim(subject) = '';

drop index if exists blog_posts_published_at_idx;
create index if not exists blog_posts_created_at_idx
  on public.blog_posts (created_at desc);

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
alter table public.blog_posts drop constraint if exists blog_posts_asset_type_check;

do $$
declare
  has_excerpt boolean;
  has_published_at boolean;
  has_content_markdown boolean;
  needs_content_backfill boolean := false;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'blog_posts'
      and column_name = 'excerpt'
  ) into has_excerpt;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'blog_posts'
      and column_name = 'published_at'
  ) into has_published_at;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'blog_posts'
      and column_name = 'content_markdown'
  ) into has_content_markdown;

  if has_content_markdown then
    execute $sql$
      select exists (
        select 1
        from public.blog_posts
        where coalesce(btrim(content), '') = ''
          and coalesce(btrim(content_markdown), '') <> ''
      )
    $sql$
    into needs_content_backfill;
  end if;

  if needs_content_backfill then
    raise notice 'Legacy blog fields retained. Run `npm run backfill:blog-posts` and then rerun supabase/blog_posts.sql to drop legacy columns.';
    return;
  end if;

  if has_excerpt then
    execute 'alter table public.blog_posts drop column if exists excerpt';
  end if;

  if has_published_at then
    execute 'alter table public.blog_posts drop column if exists published_at';
  end if;

  if has_content_markdown then
    execute 'alter table public.blog_posts drop column if exists content_markdown';
  end if;

  execute 'alter table public.blog_posts drop column if exists cta_label';
  execute 'alter table public.blog_posts drop column if exists cta_url';
end
$$;

-- CTA examples for `blog_posts.cta`:
-- Free Plan
-- <div style="margin:24px 0 0 0;"><a href="https://www.safelysecuredhomes.com/form?source=blog_cta_free_plan" target="_blank" style="display:inline-block;border-radius:9999px;background-color:#0E79B2;color:#FFFFFF;font-weight:700;line-height:1.2;padding:14px 24px;text-decoration:none;">Get My Free Plan</a></div>
--
-- Book Call
-- <div style="margin:24px 0 0 0;"><a href="https://www.safelysecuredhomes.com/schedule-call?source=blog_cta_book_call" target="_blank" style="display:inline-block;border-radius:9999px;background-color:#0E79B2;color:#FFFFFF;font-weight:700;line-height:1.2;padding:14px 24px;text-decoration:none;">Book a Free Site Visit</a></div>
--
-- Checklist
-- <div style="margin:24px 0 0 0;"><a href="https://www.safelysecuredhomes.com/newsletter?source=blog_cta_checklist" target="_blank" style="display:inline-block;border-radius:9999px;background-color:#0E79B2;color:#FFFFFF;font-weight:700;line-height:1.2;padding:14px 24px;text-decoration:none;">Get the Free Home Safety Checklist</a></div>
--
-- Example row shape:
-- insert into public.blog_posts (
--   slug, subject, title, content, preview_text, cta, created_at
-- ) values (
--   'camera-placement-mistakes-families-make',
--   'Who Carries the "What-Ifs" for Your Home Tonight?',
--   'Who Carries the "What-Ifs" for Your Home Tonight?',
--   '<h2>The Weight of the What-Ifs</h2><p>Thank you for trusting us with your home...</p>',
--   'A personal story about nightly worries, peace of mind, and the first practical step families can take to feel safer at home.',
--   '<div style="margin:24px 0 0 0;"><a href="https://www.safelysecuredhomes.com/form?source=blog_cta_free_plan" target="_blank" style="display:inline-block;border-radius:9999px;background-color:#0E79B2;color:#FFFFFF;font-weight:700;line-height:1.2;padding:14px 24px;text-decoration:none;">Get My Free Plan</a></div>',
--   '2026-01-28T00:00:00Z'
-- );
