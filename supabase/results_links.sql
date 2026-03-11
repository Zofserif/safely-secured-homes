-- Shareable results-links table for /results?r=<key>.
-- Run this in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.results_links (
  id uuid primary key default gen_random_uuid(),
  link_key text not null unique,
  name text,
  email text,
  mobile text,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz
);

alter table public.results_links
  add column if not exists name text;

alter table public.results_links
  add column if not exists email text;

alter table public.results_links
  add column if not exists mobile text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'results_links'
      and column_name = 'first_name'
  ) then
    execute $sql$
      update public.results_links
      set name = coalesce(nullif(btrim(name), ''), nullif(btrim(first_name), ''))
      where name is null or btrim(name) = ''
    $sql$;

    execute 'alter table public.results_links drop column if exists first_name';
  end if;
end
$$;

alter table public.results_links
  drop column if exists last_name;

alter table public.results_links
  drop constraint if exists results_links_key_format_check;

alter table public.results_links
  add constraint results_links_key_format_check
  check (link_key ~ '^[A-Za-z0-9_-]{16,64}$');

create index if not exists results_links_created_at_idx
  on public.results_links (created_at desc);

create index if not exists results_links_expires_at_idx
  on public.results_links (expires_at);

create index if not exists results_links_email_idx
  on public.results_links (email);

alter table public.results_links enable row level security;

drop policy if exists "Service role manages results links" on public.results_links;
create policy "Service role manages results links"
on public.results_links
for all
to public
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
