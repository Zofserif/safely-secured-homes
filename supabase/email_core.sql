-- Canonical email schema for newsletter subscribers, lead-journey enrollments,
-- and delivery history.
-- Run this before switching the app to the reset email model.

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

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null default 'there',
  status text not null default 'subscribed',
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  unsubscribe_token text not null default encode(gen_random_bytes(18), 'hex'),
  acquisition_source text not null default 'newsletter',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.newsletter_subscribers
  add column if not exists name text;

update public.newsletter_subscribers as ns
set name = coalesce(
  (
    select
      upper(left(token_lower, 1)) || substr(token_lower, 2)
    from (
      select
        lower(trim(token)) as token_lower,
        ordinality
      from regexp_split_to_table(
        split_part(
          split_part(lower(trim(coalesce(ns.email, ''))), '@', 1),
          '+',
          1
        ),
        '[._[:space:]-]+'
      ) with ordinality as token(token, ordinality)
    ) as tokens
    where token_lower <> ''
      and token_lower ~ '[a-z]'
    order by ordinality
    limit 1
  ),
  'there'
)
where name is null
   or btrim(name) = '';

update public.newsletter_subscribers
set email = lower(trim(email))
where email is not null
  and email <> lower(trim(email));

update public.newsletter_subscribers
set name = 'there'
where name is null
   or btrim(name) = '';

alter table if exists public.newsletter_subscribers
  alter column name set not null;

alter table if exists public.newsletter_subscribers
  add column if not exists status text;

update public.newsletter_subscribers
set status = 'subscribed'
where status is null
   or btrim(status) = '';

alter table if exists public.newsletter_subscribers
  alter column status set default 'subscribed';

alter table if exists public.newsletter_subscribers
  alter column status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'newsletter_subscribers_status_check'
  ) then
    alter table public.newsletter_subscribers
      add constraint newsletter_subscribers_status_check
      check (status in ('subscribed', 'unsubscribed', 'bounced', 'complained'));
  end if;
end
$$;

alter table if exists public.newsletter_subscribers
  add column if not exists subscribed_at timestamptz;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'newsletter_subscribers'
      and column_name = 'created_at'
  ) then
    update public.newsletter_subscribers
    set subscribed_at = coalesce(subscribed_at, created_at, now())
    where subscribed_at is null;
  else
    update public.newsletter_subscribers
    set subscribed_at = coalesce(subscribed_at, now())
    where subscribed_at is null;
  end if;
end
$$;

alter table if exists public.newsletter_subscribers
  alter column subscribed_at set default now();

alter table if exists public.newsletter_subscribers
  alter column subscribed_at set not null;

alter table if exists public.newsletter_subscribers
  add column if not exists unsubscribed_at timestamptz;

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

alter table if exists public.newsletter_subscribers
  add column if not exists acquisition_source text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'newsletter_subscribers'
      and column_name = 'source'
  ) then
    execute $sql$
      update public.newsletter_subscribers
      set acquisition_source = coalesce(
        nullif(btrim(acquisition_source), ''),
        nullif(btrim(source), ''),
        'newsletter'
      )
      where acquisition_source is null
         or btrim(acquisition_source) = ''
    $sql$;
  else
    update public.newsletter_subscribers
    set acquisition_source = coalesce(
      nullif(btrim(acquisition_source), ''),
      'newsletter'
    )
    where acquisition_source is null
       or btrim(acquisition_source) = '';
  end if;
end
$$;

alter table if exists public.newsletter_subscribers
  alter column acquisition_source set default 'newsletter';

update public.newsletter_subscribers
set acquisition_source = 'newsletter'
where acquisition_source is null
   or btrim(acquisition_source) = '';

alter table if exists public.newsletter_subscribers
  alter column acquisition_source set not null;

alter table if exists public.newsletter_subscribers
  add column if not exists utm_source text;

alter table if exists public.newsletter_subscribers
  add column if not exists utm_medium text;

alter table if exists public.newsletter_subscribers
  add column if not exists utm_campaign text;

alter table if exists public.newsletter_subscribers
  add column if not exists created_at timestamptz not null default now();

update public.newsletter_subscribers
set created_at = coalesce(created_at, subscribed_at, now())
where created_at is null;

alter table if exists public.newsletter_subscribers
  add column if not exists updated_at timestamptz not null default now();

update public.newsletter_subscribers
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'newsletter_subscribers'
      and con.contype = 'c'
      and (
        pg_get_constraintdef(con.oid) ilike '%first_name%'
        or pg_get_constraintdef(con.oid) ilike '%last_name%'
        or pg_get_constraintdef(con.oid) ilike '%contact_number%'
      )
  loop
    execute format(
      'alter table public.newsletter_subscribers drop constraint if exists %I',
      constraint_record.conname
    );
  end loop;
end;
$$;

alter table if exists public.newsletter_subscribers
  drop column if exists first_name;

alter table if exists public.newsletter_subscribers
  drop column if exists last_name;

alter table if exists public.newsletter_subscribers
  drop column if exists contact_number;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'newsletter_subscribers'
      and column_name = 'source'
  ) then
    alter table public.newsletter_subscribers
      drop column source;
  end if;
end
$$;

create unique index if not exists newsletter_subscribers_email_key
  on public.newsletter_subscribers (email);

create unique index if not exists newsletter_subscribers_unsubscribe_token_key
  on public.newsletter_subscribers (unsubscribe_token);

drop trigger if exists set_newsletter_subscribers_updated_at on public.newsletter_subscribers;
create trigger set_newsletter_subscribers_updated_at
before update on public.newsletter_subscribers
for each row execute function public.set_updated_at_timestamp();

alter table if exists public.newsletter_subscribers enable row level security;

drop policy if exists "Service role manages newsletter subscribers"
  on public.newsletter_subscribers;
create policy "Service role manages newsletter subscribers"
on public.newsletter_subscribers
for all
to public
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create table if not exists public.email_journey_enrollments (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.newsletter_subscribers (id) on delete cascade,
  journey_key text not null,
  status text not null default 'active',
  entered_at timestamptz not null default now(),
  exited_at timestamptz,
  exit_reason text not null default '',
  current_step_key text not null default '',
  current_step_order integer,
  assignment_reason text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_journey_enrollments_status_check'
  ) then
    alter table public.email_journey_enrollments
      add constraint email_journey_enrollments_status_check
      check (status in ('active', 'completed', 'cancelled'));
  end if;
end
$$;

create unique index if not exists email_journey_enrollments_one_active_per_journey_idx
  on public.email_journey_enrollments (subscriber_id, journey_key)
  where status = 'active';

create index if not exists email_journey_enrollments_subscriber_status_idx
  on public.email_journey_enrollments (subscriber_id, status, entered_at desc);

create index if not exists email_journey_enrollments_journey_status_idx
  on public.email_journey_enrollments (journey_key, status, entered_at desc);

drop trigger if exists set_email_journey_enrollments_updated_at
  on public.email_journey_enrollments;
create trigger set_email_journey_enrollments_updated_at
before update on public.email_journey_enrollments
for each row execute function public.set_updated_at_timestamp();

alter table if exists public.email_journey_enrollments enable row level security;

drop policy if exists "Service role manages email journey enrollments"
  on public.email_journey_enrollments;
create policy "Service role manages email journey enrollments"
on public.email_journey_enrollments
for all
to public
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create table if not exists public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.newsletter_subscribers (id) on delete cascade,
  enrollment_id uuid null references public.email_journey_enrollments (id) on delete set null,
  delivery_kind text not null,
  send_key text,
  journey_key text,
  step_key text not null default '',
  blog_post_id uuid null references public.blog_posts (id) on delete set null,
  provider_message_id text,
  status text not null default 'queued',
  queued_at timestamptz not null default now(),
  processed_at timestamptz,
  error_message text not null default '',
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_deliveries_kind_check'
  ) then
    alter table public.email_deliveries
      add constraint email_deliveries_kind_check
      check (delivery_kind in ('journey', 'broadcast'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_deliveries_status_check'
  ) then
    alter table public.email_deliveries
      add constraint email_deliveries_status_check
      check (status in ('queued', 'sent', 'failed'));
  end if;
end
$$;

create unique index if not exists email_deliveries_enrollment_step_key
  on public.email_deliveries (enrollment_id, step_key)
  where enrollment_id is not null
    and step_key <> '';

create unique index if not exists email_deliveries_send_key_subscriber_key
  on public.email_deliveries (send_key, subscriber_id)
  where send_key is not null
    and btrim(send_key) <> '';

create index if not exists email_deliveries_subscriber_idx
  on public.email_deliveries (subscriber_id, queued_at desc);

create index if not exists email_deliveries_enrollment_idx
  on public.email_deliveries (enrollment_id, queued_at desc);

create index if not exists email_deliveries_blog_post_idx
  on public.email_deliveries (blog_post_id, queued_at desc);

create index if not exists email_deliveries_send_key_idx
  on public.email_deliveries (send_key);

alter table if exists public.email_deliveries enable row level security;

drop policy if exists "Service role manages email deliveries"
  on public.email_deliveries;
create policy "Service role manages email deliveries"
on public.email_deliveries
for all
to public
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'campaign_enrollments'
  ) and exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'email_campaigns'
  ) then
    insert into public.email_journey_enrollments (
      id,
      subscriber_id,
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
      ce.id,
      ce.subscriber_id,
      ec.key,
      case
        when ce.status = 'completed' then 'completed'
        when ce.status = 'cancelled' then 'cancelled'
        when ce.status = 'paused' then 'cancelled'
        else 'active'
      end,
      coalesce(ce.entered_at, ce.created_at, now()),
      ce.exited_at,
      case
        when ce.status = 'paused' and coalesce(btrim(ce.exit_reason), '') = ''
          then 'migrated_from_paused'
        else coalesce(ce.exit_reason, '')
      end,
      coalesce(ce.current_step_key, ''),
      ce.current_step_order,
      coalesce(ce.assignment_reason, ''),
      coalesce(ce.created_at, ce.entered_at, now()),
      coalesce(ce.updated_at, ce.created_at, now())
    from public.campaign_enrollments as ce
    join public.email_campaigns as ec
      on ec.id = ce.campaign_id
    where ec.kind = 'journey'
      and (
        ec.key = 'lead_follow_up_journey'
        or exists (
          select 1
          from public.campaign_sends as cs
          where cs.enrollment_id = ce.id
        )
      )
      and not (
        ec.key = 'newsletter_welcome_journey'
        and not exists (
          select 1
          from public.campaign_sends as cs
          where cs.enrollment_id = ce.id
        )
      )
    on conflict (id) do update
    set
      subscriber_id = excluded.subscriber_id,
      journey_key = excluded.journey_key,
      status = excluded.status,
      entered_at = excluded.entered_at,
      exited_at = excluded.exited_at,
      exit_reason = excluded.exit_reason,
      current_step_key = excluded.current_step_key,
      current_step_order = excluded.current_step_order,
      assignment_reason = excluded.assignment_reason,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'campaign_sends'
  ) and exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'email_campaigns'
  ) then
    insert into public.email_deliveries (
      id,
      subscriber_id,
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
      cs.id,
      cs.subscriber_id,
      case
        when ec.kind = 'journey' then cs.enrollment_id
        else null
      end,
      case
        when ec.kind = 'broadcast' then 'broadcast'
        else 'journey'
      end,
      case
        when ec.kind = 'broadcast' then ec.key
        else null
      end,
      case
        when ec.kind = 'journey' then ec.key
        else null
      end,
      coalesce(cs.step_key, ''),
      coalesce(step.blog_post_id, ec.blog_post_id),
      cs.provider_message_id,
      case
        when cs.status in ('failed', 'bounced') then 'failed'
        when cs.status in ('sent', 'delivered', 'opened', 'clicked') then 'sent'
        else 'queued'
      end,
      coalesce(cs.queued_at, cs.created_at, now()),
      case
        when cs.status in ('failed', 'bounced')
          then coalesce(cs.failed_at, cs.bounced_at, cs.updated_at, cs.created_at)
        when cs.status in ('sent', 'delivered', 'opened', 'clicked')
          then coalesce(
            cs.sent_at,
            cs.delivered_at,
            cs.opened_at,
            cs.clicked_at,
            cs.updated_at,
            cs.created_at
          )
        else null
      end,
      coalesce(cs.error_message, ''),
      coalesce(cs.created_at, cs.queued_at, now())
    from public.campaign_sends as cs
    join public.email_campaigns as ec
      on ec.id = cs.campaign_id
    left join public.email_campaign_steps as step
      on step.campaign_id = cs.campaign_id
     and step.step_key = cs.step_key
    where ec.kind in ('journey', 'broadcast')
    on conflict (id) do update
    set
      subscriber_id = excluded.subscriber_id,
      enrollment_id = excluded.enrollment_id,
      delivery_kind = excluded.delivery_kind,
      send_key = excluded.send_key,
      journey_key = excluded.journey_key,
      step_key = excluded.step_key,
      blog_post_id = excluded.blog_post_id,
      provider_message_id = excluded.provider_message_id,
      status = excluded.status,
      queued_at = excluded.queued_at,
      processed_at = excluded.processed_at,
      error_message = excluded.error_message,
      created_at = excluded.created_at;
  end if;
end
$$;
