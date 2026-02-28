import { getSuccessStoriesPage } from "../../lib/successStories";
import CaseStudiesSectionContent from "./CaseStudiesSectionContent";

type CaseStudiesSectionProps = {
  ctaHref?: string;
  ctaLabel?: string;
};

export default async function CaseStudiesSection({
  ctaHref = "/form",
  ctaLabel = "Get My Free Plan",
}: CaseStudiesSectionProps) {
  const { stories } = await getSuccessStoriesPage({
    limit: 3,
    offset: 0,
  });

  if (!stories.length) {
    return null;
  }

  return (
    <CaseStudiesSectionContent
      stories={stories.slice(0, 3)}
      ctaHref={ctaHref}
      ctaLabel={ctaLabel}
    />
  );
}
