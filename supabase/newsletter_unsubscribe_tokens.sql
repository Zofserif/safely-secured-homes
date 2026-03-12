-- Retired by supabase/email_core.sql.
-- Keep this file only for reference while older environments are being cut over.

-- Migrates newsletter unsubscribe flow to opaque tokens and removes raw-email RPC access.
-- Run this in Supabase SQL editor.

create extension if not exists pgcrypto;

alter table if exists public.newsletter_subscribers
  add column if not exists unsubscribe_token text;

update public.newsletter_subscribers
set unsubscribe_token = lower(trim(unsubscribe_token))
where unsubscribe_token is not null
  and unsubscribe_token <> lower(trim(unsubscribe_token));

update public.newsletter_subscribers
set unsubscribe_token = encode(gen_random_bytes(18), 'hex')
where unsubscribe_token is null
   or btrim(unsubscribe_token) = '';

with duplicate_tokens as (
  select id
  from (
    select
      id,
      row_number() over (
        partition by unsubscribe_token
        order by subscribed_at asc nulls first, id asc
      ) as duplicate_index
    from public.newsletter_subscribers
    where unsubscribe_token is not null
      and btrim(unsubscribe_token) <> ''
  ) deduped
  where duplicate_index > 1
)
update public.newsletter_subscribers
set unsubscribe_token = encode(gen_random_bytes(18), 'hex')
where id in (select id from duplicate_tokens);

alter table if exists public.newsletter_subscribers
  alter column unsubscribe_token set default encode(gen_random_bytes(18), 'hex');

alter table if exists public.newsletter_subscribers
  alter column unsubscribe_token set not null;

create unique index if not exists newsletter_subscribers_unsubscribe_token_key
  on public.newsletter_subscribers (unsubscribe_token);

drop function if exists public.unsubscribe_newsletter_subscriber(text);
