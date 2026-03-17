# Legacy Email Cleanup Runbook

This runbook applies to the current intermediate Supabase state where both of
these coexist:

- Canonical runtime schema from `supabase/email_core.sql`
- Retired legacy campaign schema from `supabase/newsletter_campaign_tracking.sql`

The cleanup removes only the retired legacy objects:

- `email_campaigns`
- `email_campaign_steps`
- `campaign_enrollments`
- `campaign_sends`
- `email_content_buckets`
- `blog_post_email_buckets`
- `newsletter_subscriber_campaign_history`
- `newsletter_subscriber_active_campaigns`

Keep the canonical runtime schema and domain tables:

- `newsletter_subscribers`
- `email_journeys`
- `email_journey_steps`
- `email_journey_enrollments`
- `email_deliveries`
- `engagement_links`
- `blog_posts`
- `leads`
- `site_admin_settings`
- `social_proof_entries`

## Preconditions

1. `supabase/email_core.sql` has already been run successfully in this Supabase project.
2. No external dashboards, scripts, automations, or manual workflows still depend on the legacy campaign tables or views.
3. A project backup or external export exists before any drop statements are run.
4. `supabase/newsletter_campaign_tracking.sql` will not be run again in this environment after cleanup.

## Execution Order

1. Run `supabase/email_cleanup_precheck.sql` in the Supabase SQL editor.
2. Save the output from the baseline count query and the canonical journey queries.
3. Perform manual smoke checks in the app:
   - `/admin/journeys`
   - `/admin/subscribers`
   - any blog/admin email-usage screen that depends on `email_deliveries`
4. If any precheck query or manual smoke check fails, stop here.
5. Run `supabase/email_cleanup.sql`.
6. Run `supabase/email_cleanup_postcheck.sql`.
7. Repeat the same manual smoke checks after cleanup.
8. Record this Supabase project as cleaned and mark the legacy campaign schema as retired.

## Notes

- `supabase/email_core.sql` is safe to keep after cleanup because its legacy
  backfill blocks are guarded by `if exists` checks.
- `supabase/email_cleanup.sql` is intentionally narrow. It only drops the
  retired campaign/bucket objects and leaves the canonical runtime schema alone.
