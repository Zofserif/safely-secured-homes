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
  The admin workflow also stores `status`, `published_at`, `content_markdown`, `cta_label`, `cta_url`, `newsletter_enabled`, and `newsletter_send_key`.
  Single line breaks in `content_markdown` are preserved as `<br />` inside paragraph HTML for both blog pages and newsletter emails.

### Supabase setup

1. Run `supabase/blog_posts.sql` to create/update the `blog_posts` schema.
   If you are migrating from the old blog schema, run `npm run backfill:blog-posts` after the first SQL run.
2. Run `npm run backfill:blog-admin-fields` once to populate `content_markdown`, `cta_label`, and `cta_url` from the existing rendered HTML rows.
3. Run `npm run backfill:blog-content-html -- --dry-run` to preview stored `content` rows that should be regenerated from `content_markdown`, then rerun without `--dry-run` to apply the fix.
4. Run `supabase/storage_assets.sql` to create storage buckets + policies.
5. Run `supabase/testimonials.sql` to create/update testimonial moderation schema for `/rate` and public testimonial feeds.
6. Optional: run `supabase/blog_posts_seed.sql` for sample content.
7. Run `supabase/results_links.sql` to enable DB-backed `/results?r=...` share links.
   This table also stores `first_name`, `email`, and `mobile` for each generated link.
8. Run `supabase/leads.sql` to align `leads` with canonical payload storage and remove legacy summary columns.
9. Run `supabase/email_core.sql` to align `newsletter_subscribers`, create `email_journeys`, `email_journey_steps`, `email_journey_enrollments`, and `email_deliveries`, seed the lead and smart-home journeys, and backfill existing subscriber/journey/send data from the legacy campaign tables when present.
10. After verifying the app is running on the reset model, run `supabase/email_cleanup_precheck.sql`, complete the manual smoke checks in `supabase/email_cleanup_runbook.md`, run `supabase/email_cleanup.sql`, then run `supabase/email_cleanup_postcheck.sql` to confirm the retired campaign and bucket tables are gone and the canonical counts are unchanged.
    Do not run `supabase/newsletter_campaign_tracking.sql` again in that cleaned project.
11. Optional: deploy `vercel.json` so Vercel runs `GET /api/cron/email-journeys` once daily at `01:00 UTC` for Hobby-safe journey sends.
   On Vercel Hobby, steps 2-4 are delivered on the first daily batch after they become due rather than at exact hour precision.

### Blog Email Organization

- Public blog badges are derived from DB-backed active journey usage plus past weekly broadcast sends.
- Exact send history now lives in `email_deliveries`.
- Weekly newsletter broadcasts are one-off sends keyed as `weekly_YYYYMMDD_<slug>`.
- Weekly newsletter sends automatically skip subscribers who are currently in an active journey.

Send a weekly newsletter for a blog post:

```bash
npm run send:weekly-newsletter -- --slug camera-placement-mistakes-families-make
```

Optional flags:

- `--date YYYY-MM-DD` to force the `send_key` date component.
- `--limit N` to send to only the first `N` subscribed recipients.

### Environment variables

- `NEXT_PUBLIC_GA4_MEASUREMENT_ID`: GA4 measurement ID (for example `G-XXXXXXXXXX`). When set, GA4 is initialized and lead/checklist/consult events are dual-written alongside PostHog.
- `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`: shared EmailJS template ID used by lead, checklist, and newsletter sends.
  The EmailJS template should render from the common fields `to_email`, `name`, `subject`, `title`, `preview_text`, `content`, and `cta`.
  App-generated emails append the shared branded footer and unsubscribe link inside `cta`.
- `ADMIN_PASSWORD`: password used by `/admin/login`.
- `ADMIN_SESSION_SECRET`: server-only secret used to sign the admin session cookie.
- `EMAILJS_PRIVATE_KEY`: optional server-only EmailJS private key used for cron and server-side journey/newsletter sends.
  If omitted, the app still uses the public EmailJS key and template for browser-safe sends.
- `NEXT_PUBLIC_SHOW_INTERNAL_EMAIL_ASSETS`: set to `true` to display the internal blog email-assets panel. Default behavior is hidden.
- `NEXT_PUBLIC_WHATSAPP_PREFILL_MESSAGE`: optional message prefilled in WhatsApp CTA links. Defaults to a home-security consultation intent message.
- `REPORT_CYCLE_ANCHOR_ISO`: ISO-8601 UTC timestamp that anchors 72-hour complimentary-plan cycles in `/api/reports-remaining`.
  Initial anchor value: `2026-02-26T09:42:57Z`.
  Changing this value re-anchors all future 72-hour cycles.
- `CRON_SECRET`: bearer token expected by `GET /api/cron/email-journeys` in production.
  Vercel cron should send this value in the `Authorization: Bearer ...` header.
  This project uses a daily Hobby-safe cron schedule of `0 1 * * *`, which is about `09:00 PHT`.
- `NTFY_TOPIC_URL`: server-side ntfy publish URL for lead alerts (for example `https://ntfy.sh/your-topic`).
  If missing, lead inserts still succeed and ntfy notification delivery is skipped with a warning log.
- `NTFY_ACCESS_TOKEN`: server-side Bearer token used to authenticate ntfy lead alerts.
  If missing, lead inserts still succeed and ntfy notification delivery is skipped with a warning log.
- `DEBUG_NTFY_TEST`: optional flag (`true`) to allow `POST /api/leads/ntfy-test` outside local development.

### Campaign Unsubscribe Link

- App-generated emails append the shared branded footer automatically at send time.
- The footer logo uses `/public/assets/img/Email/email-footer-logo.jpg` and links to `https://www.safelysecuredhomes.com`.
- The app now uses token-based links in the form:
  `https://safelysecuredhomes.com/unsubscribe/<token>`
- `supabase/newsletter_unsubscribe_tokens.sql` is retired by `supabase/email_core.sql`.
