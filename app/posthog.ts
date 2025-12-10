// app/posthog.ts
import posthog from 'posthog-js';

export function initPosthog() {
  if (typeof window === 'undefined') return;
  if (posthog.__loaded) return; // avoid double init

  posthog.init(
    process.env.NEXT_PUBLIC_POSTHOG_KEY || '',
    {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      capture_pageview: false, // you’ll trigger manually
    }
  );
  if (process.env.NODE_ENV === 'development') posthog.debug();
}

export { posthog };
