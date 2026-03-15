-- Limited-time offer links for /offer/<token>.
-- Run this in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.limited_offer_links (
  id uuid primary key default gen_random_uuid(),
  link_key text not null unique,
  source_key text,
  recipient_name text,
  recipient_email text,
  blog_post_id uuid references public.blog_posts (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  first_opened_at timestamptz,
  last_opened_at timestamptz,
  revoked_at timestamptz
);

alter table public.limited_offer_links
  add column if not exists source_key text;

alter table public.limited_offer_links
  add column if not exists recipient_name text;

alter table public.limited_offer_links
  add column if not exists recipient_email text;

alter table public.limited_offer_links
  add column if not exists blog_post_id uuid references public.blog_posts (id) on delete set null;

alter table public.limited_offer_links
  add column if not exists created_at timestamptz not null default now();

alter table public.limited_offer_links
  add column if not exists expires_at timestamptz;

alter table public.limited_offer_links
  add column if not exists first_opened_at timestamptz;

alter table public.limited_offer_links
  add column if not exists last_opened_at timestamptz;

alter table public.limited_offer_links
  add column if not exists revoked_at timestamptz;

update public.limited_offer_links
set recipient_email = lower(trim(recipient_email))
where recipient_email is not null
  and recipient_email <> lower(trim(recipient_email));

alter table public.limited_offer_links
  drop constraint if exists limited_offer_links_key_format_check;

alter table public.limited_offer_links
  add constraint limited_offer_links_key_format_check
  check (link_key ~ '^[A-Za-z0-9_-]{16,64}$');

alter table public.limited_offer_links
  alter column expires_at set not null;

create index if not exists limited_offer_links_expires_at_idx
  on public.limited_offer_links (expires_at);

create index if not exists limited_offer_links_blog_post_idx
  on public.limited_offer_links (blog_post_id, created_at desc);

create unique index if not exists limited_offer_links_source_key_key
  on public.limited_offer_links (source_key)
  where source_key is not null;

alter table public.limited_offer_links enable row level security;

drop policy if exists "Service role manages limited offer links"
  on public.limited_offer_links;
create policy "Service role manages limited offer links"
on public.limited_offer_links
for all
to public
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
