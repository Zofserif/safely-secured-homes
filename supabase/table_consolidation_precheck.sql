-- Compare the consolidated tables with the legacy link and social-proof tables
-- before running `supabase/table_consolidation_cleanup.sql`.

select 'results_links' as legacy_table,
  count(*) as legacy_count,
  (
    select count(*)
    from public.engagement_links
    where kind = 'results'
  ) as consolidated_count
from public.results_links
union all
select 'bonus_claim_links',
  count(*),
  (
    select count(*)
    from public.engagement_links
    where kind = 'bonus_claim'
  )
from public.bonus_claim_links
union all
select 'limited_offer_links',
  count(*),
  (
    select count(*)
    from public.engagement_links
    where kind = 'limited_offer'
  )
from public.limited_offer_links
union all
select 'testimonials',
  count(*),
  (
    select count(*)
    from public.social_proof_entries
    where kind = 'testimonial'
  )
from public.testimonials
union all
select 'success_stories',
  count(*),
  (
    select count(*)
    from public.social_proof_entries
    where kind = 'success_story'
  )
from public.success_stories;

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

-- Expected result: 0 rows.
select id
from public.engagement_links
where kind = 'limited_offer'
  and expires_at is null
limit 20;

-- Expected result: 0 rows.
select id
from public.social_proof_entries
where kind = 'testimonial'
  and coalesce(content, '') = ''
limit 20;
