-- Pre-drop verification for the legacy email campaign cleanup.
-- Run this before supabase/email_cleanup.sql, while the legacy campaign tables
-- and views still exist in the current Supabase project.
--
-- Save the outputs from sections 1 and 5 so they can be compared after cleanup.

-- 1. Baseline row counts for canonical and legacy email objects.
select 'newsletter_subscribers' as object, count(*) as row_count
from public.newsletter_subscribers
union all
select 'email_journeys', count(*) from public.email_journeys
union all
select 'email_journey_steps', count(*) from public.email_journey_steps
union all
select 'email_journey_enrollments', count(*) from public.email_journey_enrollments
union all
select 'email_deliveries', count(*) from public.email_deliveries
union all
select 'email_campaigns', count(*) from public.email_campaigns
union all
select 'email_campaign_steps', count(*) from public.email_campaign_steps
union all
select 'campaign_enrollments', count(*) from public.campaign_enrollments
union all
select 'campaign_sends', count(*) from public.campaign_sends
union all
select 'email_content_buckets', count(*) from public.email_content_buckets
union all
select 'blog_post_email_buckets', count(*) from public.blog_post_email_buckets;

-- 2. Legacy journey enrollments that were not migrated into email_journey_enrollments.
-- Expected result: 0 rows.
select ce.id
from public.campaign_enrollments ce
join public.email_campaigns ec on ec.id = ce.campaign_id
left join public.email_journey_enrollments eje on eje.id = ce.id
where ec.kind = 'journey'
  and (
    ec.key = 'lead_follow_up_journey'
    or exists (
      select 1
      from public.campaign_sends cs
      where cs.enrollment_id = ce.id
    )
  )
  and not (
    ec.key = 'newsletter_welcome_journey'
    and not exists (
      select 1
      from public.campaign_sends cs
      where cs.enrollment_id = ce.id
    )
  )
  and eje.id is null
limit 20;

-- 3. Legacy sends that were not migrated into email_deliveries.
-- Expected result: 0 rows.
select cs.id
from public.campaign_sends cs
join public.email_campaigns ec on ec.id = cs.campaign_id
left join public.email_deliveries ed on ed.id = cs.id
where ec.kind in ('journey', 'broadcast')
  and ed.id is null
limit 20;

-- 4a. Canonical-table integrity: no subscriber should have more than one active journey.
-- Expected result: 0 rows.
select subscriber_id, count(*)
from public.email_journey_enrollments
where status = 'active'
group by subscriber_id
having count(*) > 1;

-- 4b. Canonical-table integrity: no duplicate delivery per enrollment/step.
-- Expected result: 0 rows.
select enrollment_id, step_key, count(*)
from public.email_deliveries
where enrollment_id is not null
  and step_key <> ''
group by enrollment_id, step_key
having count(*) > 1;

-- 4c. Canonical-table integrity: no duplicate broadcast send per send_key/subscriber.
-- Expected result: 0 rows.
select send_key, subscriber_id, count(*)
from public.email_deliveries
where send_key is not null
  and btrim(send_key) <> ''
group by send_key, subscriber_id
having count(*) > 1;

-- 5a. Canonical journey definitions must exist and be readable.
select key, status
from public.email_journeys
order by key;

-- 5b. Canonical journey steps must exist and be readable.
select journey_key, step_key, step_order, delay_days, is_active
from public.email_journey_steps
order by journey_key, step_order;
