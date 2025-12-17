// instrumentation-client.js
import posthog from "posthog-js";

let initialized = false;

export function initPostHog() {
  if (typeof window === "undefined") return;
  if (initialized) return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  if (!key) {
    console.warn("PostHog key missing; skipping analytics init.");
    return;
  }

  posthog.init(key, {
    api_host: host,
    capture_pageview: false, // we capture manually
  });

  if (process.env.NODE_ENV === "development") {
    posthog.debug();
  }

  initialized = true;
}

export { posthog };
export default posthog;
