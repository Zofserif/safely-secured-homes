This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Analytics (PostHog)

- Analytics is enabled only when `NEXT_PUBLIC_VERCEL_ENV=production`.
- Local development and preview deployments do not send PostHog events by default.
- In local development, you can use:
  - `window.sshDebug.posthogOn()`
  - `window.sshDebug.posthogOff()`
  - `window.sshDebug.posthogStatus()`
  - `window.sshDebug.ntfyTest()`
- Local PostHog override state persists across reloads via `localStorage`.

## Asset Storage Strategy

This project uses a hybrid media strategy:

- Keep small, app-owned static assets in `public/assets` and track them in Git.
- Store dynamic media (email media and user uploads) in Supabase Storage.
- Keep `blog_posts` shared between the blog site and EmailJS (`id`, `slug`, `subject`, `title`, `content`, `preview_text`, `cta`, `created_at`, `updated_at`).
  The `cta` field stores an HTML button fragment (or `''` when unused). See `supabase/blog_posts.sql` for copy-paste examples.

### Supabase setup

1. Run `supabase/blog_posts.sql` to create/update the `blog_posts` schema.
   If you are migrating from the old blog schema, run `npm run backfill:blog-posts` after the first SQL run, then rerun `supabase/blog_posts.sql` to drop the legacy columns.
2. Run `supabase/storage_assets.sql` to create storage buckets + policies.
3. Run `supabase/testimonials.sql` to create/update testimonial moderation schema for `/rate` and public testimonial feeds.
4. Optional: run `supabase/blog_posts_seed.sql` for sample content.
5. Run `supabase/results_links.sql` to enable DB-backed `/results?r=...` share links.
   This table also stores `first_name`, `email`, and `mobile` for each generated link.
6. Run `supabase/leads.sql` to align `leads` with canonical payload storage and remove legacy summary columns.
7. Run `supabase/newsletter_campaign_tracking.sql` to align `newsletter_subscribers` and add campaign definitions, enrollments, send history, and subscriber campaign views.
   This migration also backfills `name` from email for older `newsletter_subscribers` rows, enables RLS on the newsletter campaign tables, restricts campaign views to `service_role`, adds `email_campaign_steps`, and seeds the 4-step `lead_follow_up_journey`.
8. Optional: deploy `vercel.json` so Vercel runs `GET /api/cron/lead-journeys` once daily at `01:00 UTC` for Hobby-safe lead-journey sends.
   On Vercel Hobby, steps 2-4 are delivered on the first daily batch after they become due rather than at exact hour precision.

### Blog Email Organization

- `supabase/newsletter_campaign_tracking.sql` now seeds two reusable blog email buckets: `lead_journey` and `weekly_newsletter`.
- Public blog badges come only from manual `blog_post_email_buckets` assignments.
- Exact send history still comes from `email_campaigns` and `email_campaign_steps`.
- Weekly newsletter broadcasts should use one campaign row per send with the key format:
  `weekly_newsletter_YYYYMMDD_<slug>`

Assign a blog post to a bucket by slug:

```sql
insert into public.blog_post_email_buckets (blog_post_id, bucket_id)
select
  post.id,
  bucket.id
from public.blog_posts as post
join public.email_content_buckets as bucket
  on bucket.key = 'weekly_newsletter'
where post.slug = 'camera-placement-mistakes-families-make'
on conflict (blog_post_id, bucket_id) do nothing;
```

Create a weekly newsletter broadcast campaign for a blog post:

```sql
insert into public.email_campaigns (
  key,
  name,
  kind,
  objective_key,
  status,
  blog_post_id
)
select
  'weekly_newsletter_20260312_camera-placement-mistakes-families-make',
  'Weekly Newsletter - March 12, 2026',
  'broadcast',
  'weekly_newsletter',
  'draft',
  post.id
from public.blog_posts as post
where post.slug = 'camera-placement-mistakes-families-make'
on conflict (key) do update
set
  name = excluded.name,
  status = excluded.status,
  blog_post_id = excluded.blog_post_id,
  updated_at = now();
```

### Environment variables

- `NEXT_PUBLIC_BRAND_FOOTER_LOGO_URL`: absolute or root-relative URL for the email footer logo.
  If omitted, the app uses `https://ukgfftcenpztjkynbymj.supabase.co/storage/v1/object/public/brand-assets/sssh-banner-logo.png`.
- `NEXT_PUBLIC_GA4_MEASUREMENT_ID`: GA4 measurement ID (for example `G-XXXXXXXXXX`). When set, GA4 is initialized and lead/checklist/consult events are dual-written alongside PostHog.
- `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`: shared EmailJS template ID used by lead, checklist, and newsletter sends.
  The EmailJS template should render from the common fields `to_email`, `name`, `subject`, `title`, `preview_text`, `content`, and `cta`.
- `EMAILJS_PRIVATE_KEY`: optional server-only EmailJS private key used for cron and server-side campaign sends.
  If omitted, the app still uses the public EmailJS key and template for browser-safe sends.
- `NEXT_PUBLIC_SHOW_INTERNAL_EMAIL_ASSETS`: set to `true` to display the internal blog email-assets panel. Default behavior is hidden.
- `NEXT_PUBLIC_WHATSAPP_PREFILL_MESSAGE`: optional message prefilled in WhatsApp CTA links. Defaults to a home-security consultation intent message.
- `REPORT_CYCLE_ANCHOR_ISO`: ISO-8601 UTC timestamp that anchors 72-hour complimentary-plan cycles in `/api/reports-remaining`.
  Initial anchor value: `2026-02-26T09:42:57Z`.
  Changing this value re-anchors all future 72-hour cycles.
- `CRON_SECRET`: bearer token expected by `GET /api/cron/lead-journeys` in production.
  Vercel cron should send this value in the `Authorization: Bearer ...` header.
  This project uses a daily Hobby-safe cron schedule of `0 1 * * *`, which is about `09:00 PHT`.
- `NTFY_TOPIC_URL`: server-side ntfy publish URL for lead alerts (for example `https://ntfy.sh/your-topic`).
  If missing, lead inserts still succeed and ntfy notification delivery is skipped with a warning log.
- `NTFY_ACCESS_TOKEN`: server-side Bearer token used to authenticate ntfy lead alerts.
  If missing, lead inserts still succeed and ntfy notification delivery is skipped with a warning log.
- `DEBUG_NTFY_TEST`: optional flag (`true`) to allow `POST /api/leads/ntfy-test` outside local development.

### Campaign Unsubscribe Link

- Generated blog campaign HTML includes:
  `https://safelysecuredhomes.com/unsubscribe?email={{email}}`
- Replace `{{email}}` with your provider's merge syntax if needed.
- If the merge value is missing/invalid, `/unsubscribe` shows a manual email fallback form.
- If you only use anon RLS policies, run `supabase/newsletter_unsubscribe_rpc.sql` so unsubscribe can still mark subscribers as unsubscribed and cancel active enrollments via RPC.
