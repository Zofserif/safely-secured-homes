-- Bonus shipping claim links for /bonus/<token>.
-- Run this in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.bonus_claim_links (
  id uuid primary key default gen_random_uuid(),
  link_key text not null unique,
  source_key text,
  recipient_name text,
  recipient_email text,
  note text,
  created_at timestamptz not null default now(),
  opened_at timestamptz,
  claim_expires_at timestamptz,
  claimed_at timestamptz,
  revoked_at timestamptz,
  shipping_name text,
  shipping_mobile text,
  shipping_address text
);

alter table public.bonus_claim_links
  add column if not exists source_key text;

alter table public.bonus_claim_links
  add column if not exists recipient_name text;

alter table public.bonus_claim_links
  add column if not exists recipient_email text;

alter table public.bonus_claim_links
  add column if not exists note text;

alter table public.bonus_claim_links
  add column if not exists created_at timestamptz not null default now();

alter table public.bonus_claim_links
  add column if not exists opened_at timestamptz;

alter table public.bonus_claim_links
  add column if not exists claim_expires_at timestamptz;

alter table public.bonus_claim_links
  add column if not exists claimed_at timestamptz;

alter table public.bonus_claim_links
  add column if not exists revoked_at timestamptz;

alter table public.bonus_claim_links
  add column if not exists shipping_name text;

alter table public.bonus_claim_links
  add column if not exists shipping_mobile text;

alter table public.bonus_claim_links
  add column if not exists shipping_address text;

update public.bonus_claim_links
set recipient_email = lower(trim(recipient_email))
where recipient_email is not null
  and recipient_email <> lower(trim(recipient_email));

alter table public.bonus_claim_links
  drop constraint if exists bonus_claim_links_key_format_check;

alter table public.bonus_claim_links
  add constraint bonus_claim_links_key_format_check
  check (link_key ~ '^[A-Za-z0-9_-]{16,64}$');

create index if not exists bonus_claim_links_claim_expires_at_idx
  on public.bonus_claim_links (claim_expires_at);

create index if not exists bonus_claim_links_claimed_at_idx
  on public.bonus_claim_links (claimed_at);

create unique index if not exists bonus_claim_links_source_key_key
  on public.bonus_claim_links (source_key)
  where source_key is not null;

alter table public.bonus_claim_links enable row level security;

drop policy if exists "Service role manages bonus claim links"
  on public.bonus_claim_links;
create policy "Service role manages bonus claim links"
on public.bonus_claim_links
for all
to public
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
