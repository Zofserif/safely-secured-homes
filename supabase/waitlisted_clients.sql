create extension if not exists pgcrypto;

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.waitlisted_clients (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null default 'there',
  status text not null default 'waitlisted',
  unsubscribe_token text not null default encode(gen_random_bytes(18), 'hex'),
  joined_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  source text not null default 'waitlist',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  pending_journey_enrollment boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

update public.waitlisted_clients
set email = lower(trim(email))
where email is not null
  and email <> lower(trim(email));

update public.waitlisted_clients
set name = 'there'
where name is null
   or btrim(name) = '';

alter table if exists public.waitlisted_clients
  alter column name set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'waitlisted_clients_status_check'
  ) then
    alter table public.waitlisted_clients
      add constraint waitlisted_clients_status_check
      check (status in ('waitlisted', 'unsubscribed', 'bounced', 'complained'));
  end if;
end
$$;

create unique index if not exists waitlisted_clients_email_key
  on public.waitlisted_clients (email);

create unique index if not exists waitlisted_clients_unsubscribe_token_key
  on public.waitlisted_clients (unsubscribe_token);

create index if not exists waitlisted_clients_pending_joined_idx
  on public.waitlisted_clients (pending_journey_enrollment, joined_at asc)
  where status = 'waitlisted';

drop trigger if exists set_waitlisted_clients_updated_at on public.waitlisted_clients;
create trigger set_waitlisted_clients_updated_at
before update on public.waitlisted_clients
for each row execute function public.set_updated_at_timestamp();

alter table if exists public.waitlisted_clients enable row level security;

drop policy if exists "Service role manages waitlisted clients"
  on public.waitlisted_clients;
create policy "Service role manages waitlisted clients"
on public.waitlisted_clients
for all
to public
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

alter table if exists public.email_journey_enrollments
  add column if not exists audience text;

alter table if exists public.email_journey_enrollments
  alter column audience set default 'newsletter';

alter table if exists public.email_journey_enrollments
  add column if not exists waitlisted_client_id uuid
    references public.waitlisted_clients (id) on delete cascade;

alter table if exists public.email_journey_enrollments
  alter column subscriber_id drop not null;

update public.email_journey_enrollments
set audience = 'newsletter'
where coalesce(btrim(audience), '') = '';

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'waitlist_journey_enrollments'
  ) then
    insert into public.email_journey_enrollments (
      id,
      audience,
      subscriber_id,
      waitlisted_client_id,
      journey_key,
      status,
      entered_at,
      exited_at,
      exit_reason,
      current_step_key,
      current_step_order,
      assignment_reason,
      created_at,
      updated_at
    )
    select
      id,
      'waitlist',
      null,
      waitlisted_client_id,
      journey_key,
      status,
      entered_at,
      exited_at,
      exit_reason,
      current_step_key,
      current_step_order,
      assignment_reason,
      created_at,
      updated_at
    from public.waitlist_journey_enrollments
    on conflict (id) do nothing;
  end if;
end
$$;

alter table if exists public.email_journey_enrollments
  alter column audience set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_journey_enrollments_audience_check'
  ) then
    alter table public.email_journey_enrollments
      add constraint email_journey_enrollments_audience_check
      check (audience in ('newsletter', 'waitlist'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_journey_enrollments_recipient_check'
  ) then
    alter table public.email_journey_enrollments
      add constraint email_journey_enrollments_recipient_check
      check (
        (
          audience = 'newsletter'
          and subscriber_id is not null
          and waitlisted_client_id is null
        )
        or (
          audience = 'waitlist'
          and waitlisted_client_id is not null
          and subscriber_id is null
        )
      );
  end if;
end
$$;

drop index if exists email_journey_enrollments_one_active_idx;
create unique index if not exists email_journey_enrollments_one_active_idx
  on public.email_journey_enrollments (subscriber_id)
  where audience = 'newsletter'
    and status = 'active'
    and subscriber_id is not null;

create unique index if not exists email_journey_enrollments_one_active_waitlist_idx
  on public.email_journey_enrollments (waitlisted_client_id)
  where audience = 'waitlist'
    and status = 'active'
    and waitlisted_client_id is not null;

create index if not exists email_journey_enrollments_waitlisted_client_status_idx
  on public.email_journey_enrollments (waitlisted_client_id, status, entered_at desc)
  where waitlisted_client_id is not null;

update public.waitlisted_clients as client
set pending_journey_enrollment = false
where exists (
  select 1
  from public.email_journey_enrollments as enrollment
  where enrollment.audience = 'waitlist'
    and enrollment.waitlisted_client_id = client.id
    and enrollment.status = 'active'
);

alter table if exists public.email_deliveries
  add column if not exists audience text;

alter table if exists public.email_deliveries
  alter column audience set default 'newsletter';

alter table if exists public.email_deliveries
  add column if not exists waitlisted_client_id uuid
    references public.waitlisted_clients (id) on delete cascade;

alter table if exists public.email_deliveries
  alter column subscriber_id drop not null;

update public.email_deliveries
set audience = 'newsletter'
where coalesce(btrim(audience), '') = '';

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'waitlist_email_deliveries'
  ) then
    insert into public.email_deliveries (
      id,
      audience,
      subscriber_id,
      waitlisted_client_id,
      enrollment_id,
      delivery_kind,
      send_key,
      journey_key,
      step_key,
      blog_post_id,
      provider_message_id,
      status,
      queued_at,
      processed_at,
      error_message,
      created_at
    )
    select
      id,
      'waitlist',
      null,
      waitlisted_client_id,
      enrollment_id,
      delivery_kind,
      send_key,
      journey_key,
      step_key,
      blog_post_id,
      provider_message_id,
      status,
      queued_at,
      processed_at,
      error_message,
      created_at
    from public.waitlist_email_deliveries
    on conflict (id) do nothing;
  end if;
end
$$;

alter table if exists public.email_deliveries
  alter column audience set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_deliveries_audience_check'
  ) then
    alter table public.email_deliveries
      add constraint email_deliveries_audience_check
      check (audience in ('newsletter', 'waitlist'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_deliveries_recipient_check'
  ) then
    alter table public.email_deliveries
      add constraint email_deliveries_recipient_check
      check (
        (
          audience = 'newsletter'
          and subscriber_id is not null
          and waitlisted_client_id is null
        )
        or (
          audience = 'waitlist'
          and waitlisted_client_id is not null
          and subscriber_id is null
        )
      );
  end if;
end
$$;

drop index if exists email_deliveries_send_key_subscriber_key;
create unique index if not exists email_deliveries_send_key_subscriber_key
  on public.email_deliveries (send_key, subscriber_id)
  where audience = 'newsletter'
    and subscriber_id is not null
    and send_key is not null
    and btrim(send_key) <> '';

create unique index if not exists email_deliveries_send_key_waitlisted_client_key
  on public.email_deliveries (send_key, waitlisted_client_id)
  where audience = 'waitlist'
    and waitlisted_client_id is not null
    and send_key is not null
    and btrim(send_key) <> '';

create index if not exists email_deliveries_waitlisted_client_idx
  on public.email_deliveries (waitlisted_client_id, queued_at desc)
  where waitlisted_client_id is not null;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'email_journeys'
  ) then
    insert into public.email_journeys (
      key,
      name,
      objective_key,
      badge_key,
      badge_name,
      status
    )
    values (
      'reports_waitlist_journey',
      'Reports Waitlist Journey',
      'waitlist',
      'waitlist',
      'Reports Waitlist',
      'draft'
    )
    on conflict (key) do update
    set
      name = excluded.name,
      objective_key = excluded.objective_key,
      badge_key = excluded.badge_key,
      badge_name = excluded.badge_name,
      updated_at = now();
  end if;
end
$$;
