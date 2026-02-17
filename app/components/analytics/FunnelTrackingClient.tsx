"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import type {
  AnchorHTMLAttributes,
  ComponentProps,
  MouseEventHandler,
  ReactNode,
} from "react";
import {
  trackFunnelCtaClicked,
  trackFunnelOutcomeViewed,
  trackFunnelPageViewed,
  type FunnelContext,
  type FunnelOutcome,
  type FunnelPage,
} from "../../lib/analytics";

type PageTrackerProps = {
  page: FunnelPage;
  context?: FunnelContext;
  outcome?: FunnelOutcome;
};

export function FunnelPageMountTracker({ page, context, outcome }: PageTrackerProps) {
  const flowSource = context?.flow_source;
  const flowMode = context?.flow_mode;
  const sourceRaw = context?.source_raw;
  const resolvedContext = useMemo<FunnelContext | undefined>(() => {
    if (!flowSource || !flowMode) return undefined;
    if (!sourceRaw) {
      return {
        flow_source: flowSource,
        flow_mode: flowMode,
      };
    }

    return {
      flow_source: flowSource,
      flow_mode: flowMode,
      source_raw: sourceRaw,
    };
  }, [flowMode, flowSource, sourceRaw]);

  useEffect(() => {
    trackFunnelPageViewed(page, resolvedContext);

    if (outcome) {
      trackFunnelOutcomeViewed(outcome, page, resolvedContext);
    }
  }, [outcome, page, resolvedContext]);

  return null;
}

type FunnelTrackedLinkProps = Omit<ComponentProps<typeof Link>, "onClick"> & {
  page: FunnelPage;
  context?: FunnelContext;
  ctaId: string;
  ctaLocation: string;
  targetPath?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  children: ReactNode;
};

export function FunnelTrackedLink({
  page,
  context,
  ctaId,
  ctaLocation,
  targetPath,
  onClick,
  href,
  children,
  ...rest
}: FunnelTrackedLinkProps) {
  const resolvedTargetPath =
    targetPath ?? (typeof href === "string" ? href : href.pathname ?? undefined);

  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    trackFunnelCtaClicked(
      page,
      {
        cta_id: ctaId,
        cta_location: ctaLocation,
        target_path: resolvedTargetPath,
      },
      context
    );
    onClick?.(event);
  };

  return (
    <Link href={href} {...rest} onClick={handleClick}>
      {children}
    </Link>
  );
}

type FunnelTrackedAnchorProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "onClick"
> & {
  page: FunnelPage;
  context?: FunnelContext;
  ctaId: string;
  ctaLocation: string;
  targetUrl?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  children: ReactNode;
};

export function FunnelTrackedAnchor({
  page,
  context,
  ctaId,
  ctaLocation,
  targetUrl,
  onClick,
  href,
  children,
  ...rest
}: FunnelTrackedAnchorProps) {
  const resolvedTargetUrl = targetUrl ?? href;

  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    trackFunnelCtaClicked(
      page,
      {
        cta_id: ctaId,
        cta_location: ctaLocation,
        target_url: resolvedTargetUrl,
      },
      context
    );
    onClick?.(event);
  };

  return (
    <a href={href} {...rest} onClick={handleClick}>
      {children}
    </a>
  );
}
