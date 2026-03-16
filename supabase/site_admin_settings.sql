-- Singleton admin-managed launch controls for public site behavior.
-- Run this in Supabase SQL editor.

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.site_admin_settings (
  settings_key text primary key default 'global',
  bonus_enabled boolean not null default false,
  panatag_cycle_limit integer not null default 15,
  results_review_cta_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_admin_settings
  add column if not exists settings_key text;

alter table public.site_admin_settings
  add column if not exists bonus_enabled boolean not null default false;

alter table public.site_admin_settings
  add column if not exists panatag_cycle_limit integer not null default 15;

alter table public.site_admin_settings
  add column if not exists results_review_cta_enabled boolean not null default true;

alter table public.site_admin_settings
  add column if not exists created_at timestamptz not null default now();

alter table public.site_admin_settings
  add column if not exists updated_at timestamptz not null default now();

update public.site_admin_settings
set settings_key = 'global'
where settings_key is null
   or btrim(settings_key) = '';

update public.site_admin_settings
set bonus_enabled = false
where bonus_enabled is null;

update public.site_admin_settings
set panatag_cycle_limit = 15
where panatag_cycle_limit is null
   or panatag_cycle_limit < 1;

update public.site_admin_settings
set results_review_cta_enabled = true
where results_review_cta_enabled is null;

alter table public.site_admin_settings
  alter column settings_key set default 'global';

alter table public.site_admin_settings
  alter column settings_key set not null;

alter table public.site_admin_settings
  alter column bonus_enabled set default false;

alter table public.site_admin_settings
  alter column bonus_enabled set not null;

alter table public.site_admin_settings
  alter column panatag_cycle_limit set default 15;

alter table public.site_admin_settings
  alter column panatag_cycle_limit set not null;

alter table public.site_admin_settings
  alter column results_review_cta_enabled set default true;

alter table public.site_admin_settings
  alter column results_review_cta_enabled set not null;

alter table public.site_admin_settings
  drop constraint if exists site_admin_settings_singleton_key_check;

alter table public.site_admin_settings
  add constraint site_admin_settings_singleton_key_check
  check (settings_key = 'global');

alter table public.site_admin_settings
  drop constraint if exists site_admin_settings_cycle_limit_check;

alter table public.site_admin_settings
  add constraint site_admin_settings_cycle_limit_check
  check (panatag_cycle_limit >= 1);

insert into public.site_admin_settings (
  settings_key,
  bonus_enabled,
  panatag_cycle_limit,
  results_review_cta_enabled
)
values (
  'global',
  false,
  15,
  true
)
on conflict (settings_key) do nothing;

drop trigger if exists set_site_admin_settings_updated_at on public.site_admin_settings;
create trigger set_site_admin_settings_updated_at
before update on public.site_admin_settings
for each row execute function public.set_updated_at_timestamp();

alter table public.site_admin_settings enable row level security;

drop policy if exists "Service role manages site admin settings"
  on public.site_admin_settings;
create policy "Service role manages site admin settings"
on public.site_admin_settings
for all
to public
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
