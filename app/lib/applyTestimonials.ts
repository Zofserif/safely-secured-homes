import { createClient } from "@supabase/supabase-js";
import {
  PUBLIC_TESTIMONIAL_SELECT,
  SOCIAL_PROOF_ENTRIES_TABLE,
  SOCIAL_PROOF_KIND_TESTIMONIAL,
} from "./socialProofEntries";
import {
  isMissingSupabaseTableError,
  type SupabaseTableError,
} from "./supabaseTableFallback";
import { filterHighSignalTestimonials } from "./testimonialQuality";

export type ApplyTestimonial = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  location: string | null;
  rating: number | null;
  review: string | null;
  profile_image_url: string | null;
  created_at: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

const LEGACY_TESTIMONIALS_TABLE = "testimonials";
const LEGACY_TESTIMONIAL_SELECT = [
  "id",
  "first_name",
  "last_name",
  "location",
  "rating",
  "review",
  "profile_image_url",
  "created_at",
].join(",");

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const isMissingSocialProofEntriesTableError = (
  error: SupabaseTableError | null | undefined,
) => isMissingSupabaseTableError(error, SOCIAL_PROOF_ENTRIES_TABLE);

export async function getApplyTestimonials(limit = 3): Promise<ApplyTestimonial[]> {
  if (!supabase) {
    console.warn("Supabase env vars missing; skipping apply testimonials fetch.");
    return [];
  }

  const fetchLimit = Math.max(limit * 5, 15);
  let { data, error } = await supabase
    .from(SOCIAL_PROOF_ENTRIES_TABLE)
    .select(PUBLIC_TESTIMONIAL_SELECT)
    .eq("kind", SOCIAL_PROOF_KIND_TESTIMONIAL)
    .eq("is_published", true)
    .order("rating", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(fetchLimit);

  if (error && isMissingSocialProofEntriesTableError(error)) {
    ({ data, error } = await supabase
      .from(LEGACY_TESTIMONIALS_TABLE)
      .select(LEGACY_TESTIMONIAL_SELECT)
      .eq("is_published", true)
      .order("rating", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(fetchLimit));
  }

  if (error) {
    console.error("Failed to fetch apply testimonials:", error);
    return [];
  }

  const items = filterHighSignalTestimonials(
    ((data as unknown as ApplyTestimonial[] | null) ?? []),
  );
  if (!items.length) {
    return [];
  }
  const buckets = new Map<number, ApplyTestimonial[]>();
  for (const item of items) {
    const rating = typeof item.rating === "number" ? item.rating : 0;
    const safeRating = Math.max(0, Math.min(5, rating));
    const bucket = buckets.get(safeRating) ?? [];
    bucket.push(item);
    buckets.set(safeRating, bucket);
  }

  const result: ApplyTestimonial[] = [];
  for (const rating of [5, 4, 3, 2, 1, 0]) {
    const bucket = buckets.get(rating);
    if (!bucket?.length) continue;
    const shuffled = shuffle(bucket);
    for (const item of shuffled) {
      if (result.length >= limit) break;
      result.push(item);
    }
    if (result.length >= limit) break;
  }

  return result;
}
