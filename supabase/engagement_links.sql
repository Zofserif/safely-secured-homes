-- Consolidated link storage for results, bonus claim, and limited-offer links.
-- Run this after `supabase/blog_posts.sql` and before app code that expects
-- `public.engagement_links`.

create extension if not exists pgcrypto;

create table if not exists public.engagement_links (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  link_key text not null,
  source_key text,
  contact_name text,
  contact_email text,
  contact_mobile text,
  note text,
  payload jsonb not null default '{}'::jsonb,
  blog_post_id uuid references public.blog_posts (id) on delete set null,
  shipping_name text,
  shipping_mobile text,
  shipping_address text,
  created_at timestamptz not null default now(),
  first_opened_at timestamptz,
  last_opened_at timestamptz,
  claim_expires_at timestamptz,
  claimed_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz
);

alter table public.engagement_links
  add column if not exists kind text;

alter table public.engagement_links
  add column if not exists link_key text;

alter table public.engagement_links
  add column if not exists source_key text;

alter table public.engagement_links
  add column if not exists contact_name text;

alter table public.engagement_links
  add column if not exists contact_email text;

alter table public.engagement_links
  add column if not exists contact_mobile text;

alter table public.engagement_links
  add column if not exists note text;

alter table public.engagement_links
  add column if not exists payload jsonb not null default '{}'::jsonb;

alter table public.engagement_links
  add column if not exists blog_post_id uuid references public.blog_posts (id) on delete set null;

alter table public.engagement_links
  add column if not exists shipping_name text;

alter table public.engagement_links
  add column if not exists shipping_mobile text;

alter table public.engagement_links
  add column if not exists shipping_address text;

alter table public.engagement_links
  add column if not exists created_at timestamptz not null default now();

alter table public.engagement_links
  add column if not exists first_opened_at timestamptz;

alter table public.engagement_links
  add column if not exists last_opened_at timestamptz;

alter table public.engagement_links
  add column if not exists claim_expires_at timestamptz;

alter table public.engagement_links
  add column if not exists claimed_at timestamptz;

alter table public.engagement_links
  add column if not exists expires_at timestamptz;

alter table public.engagement_links
  add column if not exists revoked_at timestamptz;

update public.engagement_links
set contact_email = lower(trim(contact_email))
where contact_email is not null
  and contact_email <> lower(trim(contact_email));

update public.engagement_links
set payload = '{}'::jsonb
where payload is null
   or jsonb_typeof(payload) <> 'object';

alter table public.engagement_links
  alter column kind set not null;

alter table public.engagement_links
  alter column link_key set not null;

alter table public.engagement_links
  alter column payload set default '{}'::jsonb;

alter table public.engagement_links
  alter column payload set not null;

alter table public.engagement_links
  alter column created_at set default now();

alter table public.engagement_links
  alter column created_at set not null;

alter table public.engagement_links
  drop constraint if exists engagement_links_kind_check;

alter table public.engagement_links
  add constraint engagement_links_kind_check
  check (kind in ('results', 'bonus_claim', 'limited_offer'));

alter table public.engagement_links
  drop constraint if exists engagement_links_link_key_format_check;

alter table public.engagement_links
  add constraint engagement_links_link_key_format_check
  check (link_key ~ '^[A-Za-z0-9_-]{16,64}$');

alter table public.engagement_links
  drop constraint if exists engagement_links_limited_offer_expiry_check;

alter table public.engagement_links
  add constraint engagement_links_limited_offer_expiry_check
  check (kind <> 'limited_offer' or expires_at is not null);

create unique index if not exists engagement_links_kind_link_key_key
  on public.engagement_links (kind, link_key);

create unique index if not exists engagement_links_kind_source_key_key
  on public.engagement_links (kind, source_key)
  where source_key is not null;

create index if not exists engagement_links_kind_contact_email_created_at_idx
  on public.engagement_links (kind, contact_email, created_at desc);

create index if not exists engagement_links_kind_blog_post_created_at_idx
  on public.engagement_links (kind, blog_post_id, created_at desc);

create index if not exists engagement_links_kind_expires_at_idx
  on public.engagement_links (kind, expires_at);

create index if not exists engagement_links_kind_claim_expires_at_idx
  on public.engagement_links (kind, claim_expires_at);

create index if not exists engagement_links_kind_claimed_at_idx
  on public.engagement_links (kind, claimed_at);

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'results_links'
  ) then
    insert into public.engagement_links (
      id,
      kind,
      link_key,
      contact_name,
      contact_email,
      contact_mobile,
      payload,
      created_at,
      expires_at,
      revoked_at
    )
    select
      rl.id,
      'results',
      rl.link_key,
      rl.name,
      case
        when rl.email is null or btrim(rl.email) = '' then null
        else lower(trim(rl.email))
      end,
      rl.mobile,
      case
        when jsonb_typeof(rl.payload) = 'object' then rl.payload
        else '{}'::jsonb
      end,
      coalesce(rl.created_at, now()),
      rl.expires_at,
      rl.revoked_at
    from public.results_links rl
    on conflict (id) do update
    set
      kind = excluded.kind,
      link_key = excluded.link_key,
      contact_name = excluded.contact_name,
      contact_email = excluded.contact_email,
      contact_mobile = excluded.contact_mobile,
      payload = excluded.payload,
      created_at = excluded.created_at,
      expires_at = excluded.expires_at,
      revoked_at = excluded.revoked_at;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'bonus_claim_links'
  ) then
    insert into public.engagement_links (
      id,
      kind,
      link_key,
      source_key,
      contact_name,
      contact_email,
      note,
      shipping_name,
      shipping_mobile,
      shipping_address,
      created_at,
      first_opened_at,
      last_opened_at,
      claim_expires_at,
      claimed_at,
      revoked_at
    )
    select
      bcl.id,
      'bonus_claim',
      bcl.link_key,
      bcl.source_key,
      bcl.recipient_name,
      case
        when bcl.recipient_email is null or btrim(bcl.recipient_email) = '' then null
        else lower(trim(bcl.recipient_email))
      end,
      bcl.note,
      bcl.shipping_name,
      bcl.shipping_mobile,
      bcl.shipping_address,
      coalesce(bcl.created_at, now()),
      bcl.opened_at,
      bcl.opened_at,
      bcl.claim_expires_at,
      bcl.claimed_at,
      bcl.revoked_at
    from public.bonus_claim_links bcl
    on conflict (id) do update
    set
      kind = excluded.kind,
      link_key = excluded.link_key,
      source_key = excluded.source_key,
      contact_name = excluded.contact_name,
      contact_email = excluded.contact_email,
      note = excluded.note,
      shipping_name = excluded.shipping_name,
      shipping_mobile = excluded.shipping_mobile,
      shipping_address = excluded.shipping_address,
      created_at = excluded.created_at,
      first_opened_at = excluded.first_opened_at,
      last_opened_at = excluded.last_opened_at,
      claim_expires_at = excluded.claim_expires_at,
      claimed_at = excluded.claimed_at,
      revoked_at = excluded.revoked_at;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'limited_offer_links'
  ) then
    insert into public.engagement_links (
      id,
      kind,
      link_key,
      source_key,
      contact_name,
      contact_email,
      blog_post_id,
      created_at,
      first_opened_at,
      last_opened_at,
      expires_at,
      revoked_at
    )
    select
      lol.id,
      'limited_offer',
      lol.link_key,
      lol.source_key,
      lol.recipient_name,
      case
        when lol.recipient_email is null or btrim(lol.recipient_email) = '' then null
        else lower(trim(lol.recipient_email))
      end,
      lol.blog_post_id,
      coalesce(lol.created_at, now()),
      lol.first_opened_at,
      lol.last_opened_at,
      lol.expires_at,
      lol.revoked_at
    from public.limited_offer_links lol
    on conflict (id) do update
    set
      kind = excluded.kind,
      link_key = excluded.link_key,
      source_key = excluded.source_key,
      contact_name = excluded.contact_name,
      contact_email = excluded.contact_email,
      blog_post_id = excluded.blog_post_id,
      created_at = excluded.created_at,
      first_opened_at = excluded.first_opened_at,
      last_opened_at = excluded.last_opened_at,
      expires_at = excluded.expires_at,
      revoked_at = excluded.revoked_at;
  end if;
end
$$;

alter table public.engagement_links enable row level security;

drop policy if exists "Service role manages engagement links"
  on public.engagement_links;
create policy "Service role manages engagement links"
on public.engagement_links
for all
to public
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
