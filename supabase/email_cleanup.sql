-- Cleanup migration after verifying the app is running on supabase/email_core.sql.

drop view if exists public.newsletter_subscriber_active_campaigns;
drop view if exists public.newsletter_subscriber_campaign_history;

drop table if exists public.blog_post_email_buckets;
drop table if exists public.email_content_buckets;
drop table if exists public.campaign_sends;
drop table if exists public.campaign_enrollments;
drop table if exists public.email_campaign_steps;
drop table if exists public.email_campaigns;
