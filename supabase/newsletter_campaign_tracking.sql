-- Newsletter subscriber + campaign tracking schema.
-- Run this in Supabase SQL editor.

create extension if not exists pgcrypto;

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
where name is null or btrim(name) = '';

update public.newsletter_subscribers
set email = lower(trim(email))
where email is not null
  and email <> lower(trim(email));

update public.newsletter_subscribers
set name = 'there'
where name is null or btrim(name) = '';

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
  add column if not exists acquisition_source text;

update public.newsletter_subscribers
set acquisition_source = coalesce(
  nullif(btrim(acquisition_source), ''),
  nullif(btrim(source), ''),
  'newsletter'
)
where acquisition_source is null
   or btrim(acquisition_source) = '';

update public.newsletter_subscribers
set source = acquisition_source
where source is null
   or btrim(source) = '';

alter table if exists public.newsletter_subscribers
  add column if not exists utm_source text;

alter table if exists public.newsletter_subscribers
  add column if not exists utm_medium text;

alter table if exists public.newsletter_subscribers
  add column if not exists utm_campaign text;

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table if exists public.newsletter_subscribers enable row level security;

drop policy if exists "Service role manages newsletter subscribers"
  on public.newsletter_subscribers;
create policy "Service role manages newsletter subscribers"
on public.newsletter_subscribers
for all
to public
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create table if not exists public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  kind text not null,
  objective_key text not null,
  status text not null default 'draft',
  blog_post_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.email_campaigns
  add column if not exists blog_post_id uuid null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_campaigns_kind_check'
  ) then
    alter table public.email_campaigns
      add constraint email_campaigns_kind_check
      check (kind in ('broadcast', 'journey'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_campaigns_status_check'
  ) then
    alter table public.email_campaigns
      add constraint email_campaigns_status_check
      check (status in ('draft', 'active', 'paused', 'archived'));
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'blog_posts'
  ) and not exists (
    select 1
    from pg_constraint
    where conname = 'email_campaigns_blog_post_id_fkey'
  ) then
    alter table public.email_campaigns
      add constraint email_campaigns_blog_post_id_fkey
      foreign key (blog_post_id)
      references public.blog_posts (id)
      on delete set null;
  end if;
end
$$;

drop trigger if exists set_email_campaigns_updated_at on public.email_campaigns;
create trigger set_email_campaigns_updated_at
before update on public.email_campaigns
for each row execute function public.set_updated_at_timestamp();

alter table if exists public.email_campaigns enable row level security;

drop policy if exists "Service role manages email campaigns"
  on public.email_campaigns;
create policy "Service role manages email campaigns"
on public.email_campaigns
for all
to public
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

insert into public.blog_posts (
  slug,
  subject,
  title,
  content,
  preview_text,
  cta,
  created_at,
  updated_at
)
values (
  'what-happens-during-a-home-security-site-visit',
  'What Happens During a Home Security Site Visit?',
  'What Happens During a Home Security Site Visit?',
  $post_4$
<h2>A Site Visit Is a Planning Session, Not a Pressure Tactic</h2>
<p>A good site visit should help your family feel clearer, not more overwhelmed. The goal is to understand your layout, your daily routines, and the practical risks around your entry points, blind spots, lighting, and emergency readiness.</p>
<p>We are not there to push the biggest package. We are there to identify what actually matters for your home and what can wait.</p>
<h2>What We Usually Check</h2>
<p>Every home is different, but most visits include a walk-through of the gate, main door, side access, driveway, windows, stairways, and any areas where visibility drops at night.</p>
<ul>
  <li>Entry points that need stronger visibility or deterrence.</li>
  <li>Camera placements that avoid glare and capture useful angles.</li>
  <li>Lighting opportunities that improve both safety and footage quality.</li>
  <li>Power, storage, and wiring constraints that affect reliability.</li>
</ul>
<h2>How To Prepare for the Visit</h2>
<p>You do not need a perfect checklist. It helps to gather the household concerns that come up most often: late arrivals, children coming home first, blind spots near the gate, or the areas that feel least secure after dark.</p>
<ul>
  <li>List the 2 or 3 zones that worry you most.</li>
  <li>Note who needs app access, alerts, or playback access.</li>
  <li>Bring any homeowner or landlord restrictions into the conversation.</li>
</ul>
<h2>What You Should Leave With</h2>
<p>By the end of a useful site visit, you should understand the priority zones, the recommended first phase, and the tradeoffs between “good enough now” and “better later.”</p>
<p>The next step should feel practical and staged, not vague or rushed.</p>
$post_4$,
  'See what a home security site visit actually covers so your family can prepare, ask better questions, and move forward with confidence.',
  '<div style="margin:24px 0 0 0;"><a href="https://www.safelysecuredhomes.com/schedule-call?source=blog_cta_site_visit" target="_blank" style="display:inline-block;border-radius:9999px;background-color:#0E79B2;color:#FFFFFF;font-weight:700;line-height:1.2;padding:14px 24px;text-decoration:none;">Book a Free Site Visit</a></div>',
  timestamptz '2026-02-02T00:00:00Z',
  timestamptz '2026-02-02T00:00:00Z'
)
on conflict (slug) do update
set
  subject = excluded.subject,
  title = excluded.title,
  content = excluded.content,
  preview_text = excluded.preview_text,
  cta = excluded.cta,
  created_at = excluded.created_at,
  updated_at = now();

create table if not exists public.email_campaign_steps (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.email_campaigns (id) on delete cascade,
  step_key text not null,
  step_order integer not null,
  delay_days integer not null default 0,
  blog_post_id uuid not null references public.blog_posts (id) on delete restrict,
  cta_override_html text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_campaign_steps_delay_days_check'
  ) then
    alter table public.email_campaign_steps
      add constraint email_campaign_steps_delay_days_check
      check (delay_days >= 0);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_campaign_steps_campaign_id_step_key_key'
  ) then
    alter table public.email_campaign_steps
      add constraint email_campaign_steps_campaign_id_step_key_key
      unique (campaign_id, step_key);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'email_campaign_steps_campaign_id_step_order_key'
  ) then
    alter table public.email_campaign_steps
      add constraint email_campaign_steps_campaign_id_step_order_key
      unique (campaign_id, step_order);
  end if;
end
$$;

create index if not exists email_campaign_steps_campaign_active_order_idx
  on public.email_campaign_steps (campaign_id, is_active, step_order);

drop trigger if exists set_email_campaign_steps_updated_at on public.email_campaign_steps;
create trigger set_email_campaign_steps_updated_at
before update on public.email_campaign_steps
for each row execute function public.set_updated_at_timestamp();

alter table if exists public.email_campaign_steps enable row level security;

drop policy if exists "Service role manages email campaign steps"
  on public.email_campaign_steps;
create policy "Service role manages email campaign steps"
on public.email_campaign_steps
for all
to public
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create table if not exists public.campaign_enrollments (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.newsletter_subscribers (id) on delete cascade,
  campaign_id uuid not null references public.email_campaigns (id) on delete cascade,
  status text not null default 'active',
  entered_at timestamptz not null default now(),
  exited_at timestamptz null,
  exit_reason text not null default '',
  current_step_key text not null default '',
  current_step_order integer null,
  assignment_method text not null default 'rule',
  assignment_reason text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'campaign_enrollments_status_check'
  ) then
    alter table public.campaign_enrollments
      add constraint campaign_enrollments_status_check
      check (status in ('active', 'paused', 'completed', 'cancelled'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'campaign_enrollments_assignment_method_check'
  ) then
    alter table public.campaign_enrollments
      add constraint campaign_enrollments_assignment_method_check
      check (assignment_method in ('rule', 'manual'));
  end if;
end
$$;

create unique index if not exists campaign_enrollments_one_active_per_campaign_idx
  on public.campaign_enrollments (subscriber_id, campaign_id)
  where status = 'active';

create index if not exists campaign_enrollments_subscriber_status_idx
  on public.campaign_enrollments (subscriber_id, status, entered_at desc);

create index if not exists campaign_enrollments_campaign_status_idx
  on public.campaign_enrollments (campaign_id, status, entered_at desc);

drop trigger if exists set_campaign_enrollments_updated_at on public.campaign_enrollments;
create trigger set_campaign_enrollments_updated_at
before update on public.campaign_enrollments
for each row execute function public.set_updated_at_timestamp();

alter table if exists public.campaign_enrollments enable row level security;

drop policy if exists "Service role manages campaign enrollments"
  on public.campaign_enrollments;
create policy "Service role manages campaign enrollments"
on public.campaign_enrollments
for all
to public
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create table if not exists public.campaign_sends (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.newsletter_subscribers (id) on delete cascade,
  campaign_id uuid not null references public.email_campaigns (id) on delete cascade,
  enrollment_id uuid null references public.campaign_enrollments (id) on delete set null,
  step_key text not null default '',
  provider_message_id text null,
  status text not null default 'queued',
  queued_at timestamptz not null default now(),
  sent_at timestamptz null,
  delivered_at timestamptz null,
  opened_at timestamptz null,
  clicked_at timestamptz null,
  bounced_at timestamptz null,
  failed_at timestamptz null,
  error_message text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'campaign_sends_status_check'
  ) then
    alter table public.campaign_sends
      add constraint campaign_sends_status_check
      check (status in ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'));
  end if;
end
$$;

create index if not exists campaign_sends_subscriber_idx
  on public.campaign_sends (subscriber_id, queued_at desc);

create index if not exists campaign_sends_campaign_idx
  on public.campaign_sends (campaign_id, queued_at desc);

create index if not exists campaign_sends_enrollment_idx
  on public.campaign_sends (enrollment_id, queued_at desc);

create index if not exists campaign_sends_provider_message_idx
  on public.campaign_sends (provider_message_id);

create unique index if not exists campaign_sends_enrollment_step_key_idx
  on public.campaign_sends (enrollment_id, step_key);

drop trigger if exists set_campaign_sends_updated_at on public.campaign_sends;
create trigger set_campaign_sends_updated_at
before update on public.campaign_sends
for each row execute function public.set_updated_at_timestamp();

alter table if exists public.campaign_sends enable row level security;

drop policy if exists "Service role manages campaign sends"
  on public.campaign_sends;
create policy "Service role manages campaign sends"
on public.campaign_sends
for all
to public
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

insert into public.email_campaigns (
  key,
  name,
  kind,
  objective_key,
  status
)
values
  (
    'newsletter_welcome_journey',
    'Newsletter Welcome Journey',
    'journey',
    'welcome',
    'active'
  ),
  (
    'lead_follow_up_journey',
    'Lead Follow-up Journey',
    'journey',
    'education',
    'active'
  )
on conflict (key) do update
set
  name = excluded.name,
  kind = excluded.kind,
  objective_key = excluded.objective_key,
  status = excluded.status;

insert into public.email_campaign_steps (
  campaign_id,
  step_key,
  step_order,
  delay_days,
  blog_post_id,
  cta_override_html,
  is_active
)
select
  campaign.id,
  seed.step_key,
  seed.step_order,
  seed.delay_days,
  blog_post.id,
  seed.cta_override_html,
  true
from public.email_campaigns as campaign
join (
  values
    (
      'lead_day_0_story',
      1,
      0,
      'camera-placement-mistakes-families-make',
      '<div style="margin:24px 0 0 0;"><a href="https://www.safelysecuredhomes.com/schedule-call?source=lead_journey_day_0" target="_blank" style="display:inline-block;border-radius:9999px;background-color:#0E79B2;color:#FFFFFF;font-weight:700;line-height:1.2;padding:14px 24px;text-decoration:none;">Book a Free Site Visit</a></div>'
    ),
    (
      'lead_day_3_lighting',
      2,
      3,
      'smart-lighting-rules-for-safer-nights',
      '<div style="margin:24px 0 0 0;"><a href="https://www.safelysecuredhomes.com/schedule-call?source=lead_journey_day_3" target="_blank" style="display:inline-block;border-radius:9999px;background-color:#0E79B2;color:#FFFFFF;font-weight:700;line-height:1.2;padding:14px 24px;text-decoration:none;">Book a Free Site Visit</a></div>'
    ),
    (
      'lead_day_6_routine',
      3,
      6,
      'weekly-security-routine-15-minutes',
      '<div style="margin:24px 0 0 0;"><a href="https://www.safelysecuredhomes.com/schedule-call?source=lead_journey_day_6" target="_blank" style="display:inline-block;border-radius:9999px;background-color:#0E79B2;color:#FFFFFF;font-weight:700;line-height:1.2;padding:14px 24px;text-decoration:none;">Book a Free Site Visit</a></div>'
    ),
    (
      'lead_day_10_site_visit',
      4,
      10,
      'what-happens-during-a-home-security-site-visit',
      '<div style="margin:24px 0 0 0;"><a href="https://www.safelysecuredhomes.com/schedule-call?source=lead_journey_day_10" target="_blank" style="display:inline-block;border-radius:9999px;background-color:#0E79B2;color:#FFFFFF;font-weight:700;line-height:1.2;padding:14px 24px;text-decoration:none;">Book a Free Site Visit</a></div>'
    )
) as seed(step_key, step_order, delay_days, slug, cta_override_html)
  on campaign.key = 'lead_follow_up_journey'
join public.blog_posts as blog_post
  on blog_post.slug = seed.slug
on conflict (campaign_id, step_key) do update
set
  step_order = excluded.step_order,
  delay_days = excluded.delay_days,
  blog_post_id = excluded.blog_post_id,
  cta_override_html = excluded.cta_override_html,
  is_active = excluded.is_active,
  updated_at = now();

create or replace view public.newsletter_subscriber_campaign_history as
select
  ns.id as subscriber_id,
  ns.email,
  ns.name as subscriber_name,
  ns.status as subscriber_status,
  ns.acquisition_source,
  ns.utm_source,
  ns.utm_medium,
  ns.utm_campaign,
  ce.id as enrollment_id,
  ce.status as enrollment_status,
  ce.entered_at,
  ce.exited_at,
  ce.exit_reason,
  ce.current_step_key,
  ce.current_step_order,
  ce.assignment_method,
  ce.assignment_reason,
  ec.id as campaign_id,
  ec.key as campaign_key,
  ec.name as campaign_name,
  ec.kind as campaign_kind,
  ec.objective_key,
  ec.status as campaign_status
from public.newsletter_subscribers ns
left join public.campaign_enrollments ce on ce.subscriber_id = ns.id
left join public.email_campaigns ec on ec.id = ce.campaign_id;

create or replace view public.newsletter_subscriber_active_campaigns as
select
  subscriber_id,
  email,
  subscriber_name,
  subscriber_status,
  acquisition_source,
  utm_source,
  utm_medium,
  utm_campaign,
  enrollment_id,
  entered_at,
  current_step_key,
  current_step_order,
  assignment_method,
  assignment_reason,
  campaign_id,
  campaign_key,
  campaign_name,
  campaign_kind,
  objective_key,
  campaign_status
from public.newsletter_subscriber_campaign_history
where enrollment_status = 'active';

revoke all on table public.newsletter_subscriber_campaign_history
from public, anon, authenticated;
grant select on table public.newsletter_subscriber_campaign_history
to service_role;

revoke all on table public.newsletter_subscriber_active_campaigns
from public, anon, authenticated;
grant select on table public.newsletter_subscriber_active_campaigns
to service_role;
