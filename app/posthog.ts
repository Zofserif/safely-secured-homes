import posthog from "posthog-js";

const POSTHOG_DEBUG_STORAGE_KEY = "ssh_debug_posthog_enabled";
const DEFAULT_POSTHOG_HOST = "/ingest";
const IS_LOCAL_DEV = process.env.NODE_ENV !== "production";
const IS_PRODUCTION_DEPLOYMENT =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

let initialized = false;

export type PostHogDebugSource =
  | "production_deployment"
  | "local_debug_override"
  | "disabled";

export type PostHogDebugStatus = {
  enabled: boolean;
  environment: "production" | "development";
  persisted: boolean;
  source: PostHogDebugSource;
};

const isBrowser = () => typeof window !== "undefined";

const readPersistedPostHogEnabled = (): boolean | null => {
  if (!isBrowser()) return null;
  if (!IS_LOCAL_DEV) return null;

  try {
    const raw = localStorage.getItem(POSTHOG_DEBUG_STORAGE_KEY);
    if (raw === "true") return true;
    if (raw === "false") return false;
  } catch {
    // Ignore localStorage read errors.
  }

  return null;
};

const getPostHogEnablementSource = (): PostHogDebugSource => {
  if (IS_PRODUCTION_DEPLOYMENT) return "production_deployment";
  if (IS_LOCAL_DEV && readPersistedPostHogEnabled() === true) {
    return "local_debug_override";
  }
  return "disabled";
};

export const isPostHogEnabled = () => getPostHogEnablementSource() !== "disabled";

export function initPostHog() {
  if (!isBrowser()) return;

  if (!isPostHogEnabled()) {
    if (initialized) {
      posthog.opt_out_capturing();
    }
    return;
  }

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (!key) {
    console.warn("PostHog key missing; skipping analytics init.");
    return;
  }

  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || DEFAULT_POSTHOG_HOST;

  if (!initialized) {
    posthog.init(key, {
      api_host: host,
      capture_pageview: false, // we capture manually
    });
    initialized = true;
  }

  posthog.opt_in_capturing();
}

export const setPostHogEnabledForDebug = (enabled: boolean) => {
  if (!IS_LOCAL_DEV) {
    console.warn(
      "[sshDebug] PostHog toggles are available only in local development."
    );
    return;
  }

  if (isBrowser()) {
    try {
      localStorage.setItem(POSTHOG_DEBUG_STORAGE_KEY, String(enabled));
    } catch {
      console.warn(
        "[sshDebug] Unable to persist PostHog debug state in localStorage."
      );
    }
  }

  if (enabled) {
    initPostHog();
    return;
  }

  if (initialized) {
    posthog.opt_out_capturing();
  }
};

export const getPostHogDebugStatus = (): PostHogDebugStatus => {
  const persisted = readPersistedPostHogEnabled() !== null;
  const source = getPostHogEnablementSource();

  return {
    enabled: source !== "disabled",
    environment: IS_LOCAL_DEV ? "development" : "production",
    persisted,
    source,
  };
};

export { posthog };
export default posthog;
