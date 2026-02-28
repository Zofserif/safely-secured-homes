import Link from "next/link";
import type { SuccessStory } from "../../lib/successStories";

const PROBLEM_COPY =
  "Needed dependable coverage for entry points and blind spots without making the home feel intrusive.";
const SOLUTION_COPY =
  "Privacy-first camera placement, practical installation planning, and simple household walkthrough.";
const PRICE_RANGE_COPY = "Final quote shared after site visit.";

const formatStoryDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const getOutcomeCopy = (story: SuccessStory) => {
  const raw = (story.testimonial ?? "").trim();
  if (!raw) {
    return "Household confidence improved after installation and guided setup.";
  }
  return raw.length > 180 ? `${raw.slice(0, 177)}...` : raw;
};

type CaseStudiesSectionContentProps = {
  stories: SuccessStory[];
  ctaHref?: string;
  ctaLabel?: string;
};

export default function CaseStudiesSectionContent({
  stories,
  ctaHref = "/form",
  ctaLabel = "Get My Free Plan",
}: CaseStudiesSectionContentProps) {
  if (!stories.length) return null;

  return (
    <section className="mt-16 rounded-3xl border border-[#BEE9E8]/70 bg-white/95 p-6 shadow-lg shadow-[#0E79B2]/10 sm:p-8">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          Recent Installs
        </p>
        <h2 className="mt-3 text-2xl font-bold text-[#1F2937] sm:text-3xl">
          Real Home Security Case Studies
        </h2>
        <p className="mt-3 text-sm text-slate-600 sm:text-base">
          Three recent installs showing how we solve practical security gaps for
          Filipino households.
        </p>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {stories.slice(0, 3).map((story, index) => {
          const storyDate = formatStoryDate(story.story_date ?? story.created_at);
          const locationLine = [story.location, storyDate].filter(Boolean).join(" • ");

          return (
            <article
              key={story.id}
              className="rounded-2xl border border-[#DCE6F1] bg-[#F8FAFC] p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0E79B2]">
                Install {index + 1}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-600">
                {locationLine || "Luzon service area"}
              </p>

              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div>
                  <p className="font-semibold text-[#1F2937]">Problem</p>
                  <p className="mt-1">{PROBLEM_COPY}</p>
                </div>
                <div>
                  <p className="font-semibold text-[#1F2937]">Solution</p>
                  <p className="mt-1">{SOLUTION_COPY}</p>
                </div>
                <div>
                  <p className="font-semibold text-[#1F2937]">Outcome</p>
                  <p className="mt-1">{getOutcomeCopy(story)}</p>
                </div>
                <div>
                  <p className="font-semibold text-[#1F2937]">Price range</p>
                  <p className="mt-1">{PRICE_RANGE_COPY}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          href={ctaHref}
          className="inline-flex items-center justify-center rounded-full bg-[#0E79B2] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0b5e8b]"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
