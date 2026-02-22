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
- Local PostHog override state persists across reloads via `localStorage`.

## Asset Storage Strategy

This project uses a hybrid media strategy:

- Keep small, app-owned static assets in `public/assets` and track them in Git.
- Store dynamic media (email media and user uploads) in Supabase Storage.
- Keep `blog_posts` text-only (`slug`, `title`, `excerpt`, `published_at`, `content_markdown`).

### Supabase setup

1. Run `supabase/blog_posts.sql` to create/update the `blog_posts` schema.
2. Run `supabase/storage_assets.sql` to create storage buckets + policies.
3. Run `supabase/testimonials.sql` to create/update testimonial moderation schema for `/rate` and public testimonial feeds.
4. Optional: run `supabase/blog_posts_seed.sql` for sample content.
5. Run `supabase/results_links.sql` to enable DB-backed `/results?r=...` share links.
   This table also stores `first_name`, `last_name`, `email`, and `mobile` for each generated link.

### Optional environment variable

- `NEXT_PUBLIC_BRAND_FOOTER_LOGO_URL`: absolute or root-relative URL for the email footer logo.
  If omitted, the app uses `https://ukgfftcenpztjkynbymj.supabase.co/storage/v1/object/public/brand-assets/sssh-banner-logo.png`.

### Campaign Unsubscribe Link

- Generated blog campaign HTML includes:
  `https://safelysecuredhomes.com/unsubscribe?email={{email}}`
- Replace `{{email}}` with your provider's merge syntax if needed.
- If the merge value is missing/invalid, `/unsubscribe` shows a manual email fallback form.
- If you only use anon RLS policies, run `supabase/newsletter_unsubscribe_rpc.sql` so unsubscribe can still remove `newsletter_subscribers` rows via RPC.
