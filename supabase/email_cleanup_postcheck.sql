-- Post-drop verification for the legacy email campaign cleanup.
-- Run this immediately after supabase/email_cleanup.sql.
--
-- Compare the counts from section 2 with the saved baseline counts from
-- supabase/email_cleanup_precheck.sql. The canonical counts should match.

-- 1. Confirm the retired legacy tables and views are gone.
-- Expected result: 0 rows.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'email_campaigns',
    'email_campaign_steps',
    'campaign_enrollments',
    'campaign_sends',
    'email_content_buckets',
    'blog_post_email_buckets'
  )
union all
select table_name
from information_schema.views
where table_schema = 'public'
  and table_name in (
    'newsletter_subscriber_campaign_history',
    'newsletter_subscriber_active_campaigns'
  );

-- 2. Canonical row counts. Compare these with the saved precheck baseline.
select 'newsletter_subscribers' as object, count(*) as row_count
from public.newsletter_subscribers
union all
select 'email_journeys', count(*) from public.email_journeys
union all
select 'email_journey_steps', count(*) from public.email_journey_steps
union all
select 'email_journey_enrollments', count(*) from public.email_journey_enrollments
union all
select 'email_deliveries', count(*) from public.email_deliveries;

-- 3a. Canonical-table integrity: no subscriber should have more than one active journey.
-- Expected result: 0 rows.
select subscriber_id, count(*)
from public.email_journey_enrollments
where status = 'active'
group by subscriber_id
having count(*) > 1;

-- 3b. Canonical-table integrity: no duplicate delivery per enrollment/step.
-- Expected result: 0 rows.
select enrollment_id, step_key, count(*)
from public.email_deliveries
where enrollment_id is not null
  and step_key <> ''
group by enrollment_id, step_key
having count(*) > 1;

-- 3c. Canonical-table integrity: no duplicate broadcast send per send_key/subscriber.
-- Expected result: 0 rows.
select send_key, subscriber_id, count(*)
from public.email_deliveries
where send_key is not null
  and btrim(send_key) <> ''
group by send_key, subscriber_id
having count(*) > 1;

-- 4a. Canonical journey definitions still exist and are readable.
select key, status
from public.email_journeys
order by key;

-- 4b. Canonical journey steps still exist and are readable.
select journey_key, step_key, step_order, delay_days, is_active
from public.email_journey_steps
order by journey_key, step_order;
