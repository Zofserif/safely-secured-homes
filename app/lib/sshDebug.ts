import type { PostHogDebugStatus } from "../posthog";
export type { PostHogDebugStatus };

export type LeadSendsStatus = {
  enabled: boolean;
  environment: "production" | "development";
  persisted: boolean;
};

export type SshDebugApi = {
  expireBonus?: () => void;
  reportsSoldOut?: () => void;
  normal?: () => void;
  leadSendsOn?: () => void;
  leadSendsOff?: () => void;
  leadSendsStatus?: () => LeadSendsStatus;
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
