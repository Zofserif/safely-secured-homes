import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

export async function GET(req: Request) {
  if (!supabase) {
    console.warn("Supabase env vars missing; skipping testimonials fetch.");
    return NextResponse.json({ testimonials: [] });
  }

  const { searchParams } = new URL(req.url);
  const limitParam = searchParams.get("limit");
  const limit = Math.max(1, Math.min(12, Number(limitParam) || 3));

  const fetchLimit = Math.max(limit * 5, 15);
  const { data, error } = await supabase
    .from("testimonials")
    .select(
      "id,first_name,last_name,location,rating,review,profile_image_url,created_at"
    )
    .order("rating", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(fetchLimit);

  if (error) {
    console.error("Failed to fetch testimonials:", error);
    return NextResponse.json({ testimonials: [] }, { status: 500 });
  }

  const items = data ?? [];
  const buckets = new Map<number, typeof items>();
  for (const item of items) {
    const rating = typeof item.rating === "number" ? item.rating : 0;
    const safeRating = Math.max(0, Math.min(5, rating));
    const bucket = buckets.get(safeRating) ?? [];
    bucket.push(item);
    buckets.set(safeRating, bucket);
  }

  const picked: typeof items = [];
  for (const rating of [5, 4, 3, 2, 1, 0]) {
    const bucket = buckets.get(rating);
    if (!bucket?.length) continue;
    const shuffled = shuffle(bucket);
    for (const item of shuffled) {
      if (picked.length >= limit) break;
      picked.push(item);
    }
    if (picked.length >= limit) break;
  }

  return NextResponse.json({ testimonials: picked });
}
