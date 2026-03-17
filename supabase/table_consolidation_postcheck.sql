-- Post-drop verification for the link and social-proof table consolidation.
-- Run this immediately after `supabase/table_consolidation_cleanup.sql`.

-- Expected result: 0 rows.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'results_links',
    'bonus_claim_links',
    'limited_offer_links',
    'testimonials',
    'success_stories'
  );

select kind, count(*) as row_count
from public.engagement_links
group by kind
order by kind;

select kind, count(*) as row_count
from public.social_proof_entries
group by kind
order by kind;

-- Expected result: 0 rows.
select kind, link_key, count(*)
from public.engagement_links
group by kind, link_key
having count(*) > 1;

-- Expected result: 0 rows.
select kind, source_key, count(*)
from public.engagement_links
where source_key is not null
group by kind, source_key
having count(*) > 1;
