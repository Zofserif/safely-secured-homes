"use client";

import { useEffect, useState } from "react";
import type { SuccessStory } from "../../lib/successStories";
import CaseStudiesSectionContent from "./CaseStudiesSectionContent";

type CaseStudiesSectionClientProps = {
  ctaHref?: string;
  ctaLabel?: string;
};

export default function CaseStudiesSectionClient({
  ctaHref = "/form",
  ctaLabel = "Get My Free Plan",
}: CaseStudiesSectionClientProps) {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchStories = async () => {
      try {
        const response = await fetch("/api/success-stories?offset=0&limit=3", {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Failed to load case studies.");
        }
        const data = (await response.json().catch(() => null)) as
          | { stories?: SuccessStory[] }
          | null;
        if (isMounted) {
          setStories(Array.isArray(data?.stories) ? data.stories.slice(0, 3) : []);
        }
      } catch {
        if (isMounted) {
          setStories([]);
        }
      } finally {
        if (isMounted) {
          setLoaded(true);
        }
      }
    };

    void fetchStories();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!loaded || stories.length === 0) {
    return null;
  }

  return (
    <CaseStudiesSectionContent
      stories={stories}
      ctaHref={ctaHref}
      ctaLabel={ctaLabel}
    />
  );
}
