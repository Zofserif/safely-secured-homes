import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const socialProofEntriesModule = (await import(
  new URL("../app/lib/socialProofEntries.ts", import.meta.url).href
)) as typeof import("../app/lib/socialProofEntries");
const testimonialQualityModule = (await import(
  new URL("../app/lib/testimonialQuality.ts", import.meta.url).href
)) as typeof import("../app/lib/testimonialQuality");

const { PUBLIC_TESTIMONIAL_SELECT, SUCCESS_STORY_SELECT } =
  socialProofEntriesModule;
const { filterHighSignalTestimonials } = testimonialQualityModule;

assert.match(
  PUBLIC_TESTIMONIAL_SELECT,
  /review:content/,
  "testimonial selects should alias content back to review",
);
assert.match(
  PUBLIC_TESTIMONIAL_SELECT,
  /profile_image_url:image_url/,
  "testimonial selects should alias image_url back to profile_image_url",
);
assert.match(
  SUCCESS_STORY_SELECT,
  /testimonial:content/,
  "success-story selects should alias content back to testimonial",
);

assert.deepEqual(
  filterHighSignalTestimonials([
    { review: "test" },
    {
      review:
        "We finally sleep better at night because the camera placement advice was practical and easy to follow.",
    },
  ]),
  [
    {
      review:
        "We finally sleep better at night because the camera placement advice was practical and easy to follow.",
    },
  ],
  "social-proof filters should still reject low-signal placeholder reviews",
);

const testimonialsRouteSource = readFileSync(
  new URL("../app/api/testimonials/route.ts", import.meta.url),
  "utf8",
);
const applyTestimonialsSource = readFileSync(
  new URL("../app/lib/applyTestimonials.ts", import.meta.url),
  "utf8",
);
const successStoriesSource = readFileSync(
  new URL("../app/lib/successStories.ts", import.meta.url),
  "utf8",
);

assert.match(
  testimonialsRouteSource,
  /SOCIAL_PROOF_ENTRIES_TABLE/,
  "testimonial routes should read from the consolidated social proof table",
);
assert.match(
  testimonialsRouteSource,
  /\.eq\("kind", SOCIAL_PROOF_KIND_TESTIMONIAL\)/,
  "testimonial routes should scope queries to kind='testimonial'",
);
assert.match(
  testimonialsRouteSource,
  /\.eq\("content", review\)/,
  "duplicate testimonial checks should use the consolidated content column",
);
assert.match(
  applyTestimonialsSource,
  /\.eq\("kind", SOCIAL_PROOF_KIND_TESTIMONIAL\)/,
  "apply-page testimonials should scope to kind='testimonial'",
);
assert.match(
  successStoriesSource,
  /\.eq\("kind", SOCIAL_PROOF_KIND_SUCCESS_STORY\)/,
  "success stories should scope to kind='success_story'",
);

console.log("All social proof entry checks passed.");
