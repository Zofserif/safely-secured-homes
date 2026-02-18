import { useEffect, useState } from "react";
import {
  refreshBonusTimerFromStorage,
  resetBonusTimerForDebug,
} from "./useBonusTimer";

type UseHomeDebugControlsArgs = {
  reportsRemaining: number | null;
  reportsLoading: boolean;
  reportsError: boolean;
};

export const useHomeDebugControls = ({
  reportsRemaining,
  reportsLoading,
  reportsError,
}: UseHomeDebugControlsArgs): {
  effectiveReportsRemaining: number | null;
  effectiveReportsLoading: boolean;
  effectiveReportsError: boolean;
} => {
  const [debugReportsRemaining, setDebugReportsRemaining] = useState<
    number | null | undefined
  >(undefined);
  const [debugReportsLoading, setDebugReportsLoading] = useState<
    boolean | undefined
  >(undefined);
  const [debugReportsError, setDebugReportsError] = useState<
    boolean | undefined
  >(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const expireBonus = () => {
      const storageKey = "ssh_bonus_started_at";
      const startAt = Date.now() - 25 * 60 * 60 * 1000;
      localStorage.setItem(storageKey, new Date(startAt).toISOString());
      refreshBonusTimerFromStorage();
    };

    const setReportsSoldOut = () => {
      setDebugReportsRemaining(0);
      setDebugReportsLoading(false);
      setDebugReportsError(false);
      window.dispatchEvent(
        new CustomEvent("ssh-debug-reports", {
          detail: { remaining: 0, loading: false, error: false },
        }),
      );
    };

    const normal = () => {
      setDebugReportsRemaining(undefined);
      setDebugReportsLoading(undefined);
      setDebugReportsError(undefined);
      resetBonusTimerForDebug();
      window.dispatchEvent(
        new CustomEvent("ssh-debug-reports", { detail: { reset: true } }),
      );
    };

    (
      window as typeof window & { sshDebug?: Record<string, () => void> }
    ).sshDebug = {
      expireBonus,
      reportsSoldOut: setReportsSoldOut,
      normal,
    };

    return () => {
      delete (
        window as typeof window & { sshDebug?: Record<string, () => void> }
      ).sshDebug;
    };
  }, []);

  const effectiveReportsRemaining =
    debugReportsRemaining !== undefined ? debugReportsRemaining : reportsRemaining;
  const effectiveReportsLoading =
    debugReportsLoading !== undefined ? debugReportsLoading : reportsLoading;
  const effectiveReportsError =
    debugReportsError !== undefined ? debugReportsError : reportsError;

  return {
    effectiveReportsRemaining,
    effectiveReportsLoading,
    effectiveReportsError,
  };
};
