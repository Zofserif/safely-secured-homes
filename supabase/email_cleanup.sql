-- Cleanup migration for the retired legacy email campaign schema.
--
-- Run order:
-- 1. Run supabase/email_cleanup_precheck.sql and save the baseline results.
-- 2. Perform the manual smoke checks listed in supabase/email_cleanup_runbook.md.
-- 3. Run this file.
-- 4. Run supabase/email_cleanup_postcheck.sql.
--
-- Preconditions:
-- - supabase/email_core.sql has already been run successfully.
-- - A project backup or external export has been taken.
-- - No external workflow still depends on the legacy campaign schema.
-- - supabase/newsletter_campaign_tracking.sql will not be re-run in this project.

drop view if exists public.newsletter_subscriber_active_campaigns;
drop view if exists public.newsletter_subscriber_campaign_history;

drop table if exists public.blog_post_email_buckets;
drop table if exists public.email_content_buckets;
drop table if exists public.campaign_sends;
drop table if exists public.campaign_enrollments;
drop table if exists public.email_campaign_steps;
drop table if exists public.email_campaigns;
