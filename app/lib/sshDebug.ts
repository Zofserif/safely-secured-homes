import type { PostHogDebugStatus } from "../posthog";
export type { PostHogDebugStatus };

export type LeadSendsStatus = {
  enabled: boolean;
  environment: "production" | "development";
  persisted: boolean;
};

export type NtfyTestMode = "stored_lead" | "synthetic";

export type NtfyTestSuccessResult = {
  ok: true;
  mode: NtfyTestMode;
  ntfy_status: "sent" | "skipped";
  reason?: "missing_config";
};

export type NtfyTestErrorResult = {
  ok: false;
  mode: NtfyTestMode;
  error: string;
};

export type NtfyTestResult = NtfyTestSuccessResult | NtfyTestErrorResult;

export type SshDebugApi = {
  bonusOn?: () => void;
  expireBonus?: () => void;
  reportsSoldOut?: () => void;
  normal?: () => void;
  leadSendsOn?: () => void;
  leadSendsOff?: () => void;
  leadSendsStatus?: () => LeadSendsStatus;
  ntfyTest?: () => Promise<NtfyTestResult>;
  posthogOn?: () => void;
  posthogOff?: () => void;
  posthogStatus?: () => PostHogDebugStatus;
};

type SshDebugMethodName = keyof SshDebugApi;

declare global {
  interface Window {
    sshDebug?: SshDebugApi;
  }
}

export const registerSshDebugMethods = (methods: Partial<SshDebugApi>) => {
  if (typeof window === "undefined") {
    return () => {
      // No-op during SSR.
    };
  }

  const api = window.sshDebug ?? {};
  Object.assign(api, methods);
  window.sshDebug = api;

  return () => {
    const currentApi = window.sshDebug;
    if (!currentApi) return;

    const methodNames = Object.keys(methods) as SshDebugMethodName[];
    for (const name of methodNames) {
      if (currentApi[name] === methods[name]) {
        delete currentApi[name];
      }
    }

    if (Object.keys(currentApi).length === 0) {
      delete window.sshDebug;
    }
  };
};
