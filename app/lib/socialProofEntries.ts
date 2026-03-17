export const SOCIAL_PROOF_ENTRIES_TABLE = "social_proof_entries";

export const SOCIAL_PROOF_KIND_TESTIMONIAL = "testimonial";
export const SOCIAL_PROOF_KIND_SUCCESS_STORY = "success_story";

export const PUBLIC_TESTIMONIAL_SELECT = [
  "id",
  "first_name",
  "last_name",
  "location",
  "rating",
  "review:content",
  "profile_image_url:image_url",
  "created_at",
].join(",");

export const SUCCESS_STORY_SELECT = [
  "id",
  "name",
  "location",
  "testimonial:content",
  "image_url",
  "media_url",
  "media_type",
  "story_date",
  "created_at",
].join(",");
