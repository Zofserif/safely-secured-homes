import { createClient } from "@supabase/supabase-js";

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

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export async function getApplyTestimonials(limit = 3): Promise<ApplyTestimonial[]> {
  if (!supabase) {
    console.warn("Supabase env vars missing; skipping apply testimonials fetch.");
    return [];
  }

  const fetchLimit = Math.max(limit * 5, 15);
  const { data, error } = await supabase
    .from("testimonials")
    .select(
      "id,first_name,last_name,location,rating,review,profile_image_url,created_at"
    )
    .order("rating", { ascending: false, nullsLast: true })
    .order("created_at", { ascending: false })
    .limit(fetchLimit);

  if (error) {
    console.error("Failed to fetch apply testimonials:", error);
    return [];
  }

  const items = data ?? [];
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
