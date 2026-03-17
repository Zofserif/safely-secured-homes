-- Drop the legacy tables after the app is running on `engagement_links` and
-- `social_proof_entries`, and `supabase/table_consolidation_precheck.sql`
-- matches.

drop table if exists public.results_links;
drop table if exists public.bonus_claim_links;
drop table if exists public.limited_offer_links;
drop table if exists public.testimonials;
drop table if exists public.success_stories;
