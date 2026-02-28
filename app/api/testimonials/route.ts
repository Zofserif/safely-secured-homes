import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { filterHighSignalTestimonials } from "../../lib/testimonialQuality";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MAX_LENGTH = 80;
const LOCATION_MAX_LENGTH = 120;
const REVIEW_MIN_LENGTH = 10;
const REVIEW_MAX_LENGTH = 1200;
const SPAM_WINDOW_MINUTES = 10;
const IP_COOLDOWN_MS = 15_000;

const ipCooldownByAddress = new Map<string, number>();

type SupabaseError = {
  code?: string | null;
  message?: string;
};

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const isMissingPublishedColumnError = (
  error: SupabaseError | null | undefined
) =>
  error?.code === "42703" &&
  String(error?.message ?? "").includes("is_published");

const getClientIp = (req: Request) => {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return null;
};

const enforceIpCooldown = (ip: string) => {
  const now = Date.now();
  for (const [key, timestamp] of ipCooldownByAddress.entries()) {
    if (now - timestamp > IP_COOLDOWN_MS * 5) {
      ipCooldownByAddress.delete(key);
    }
  }

  const lastSubmittedAt = ipCooldownByAddress.get(ip);
  if (typeof lastSubmittedAt === "number" && now - lastSubmittedAt < IP_COOLDOWN_MS) {
    return false;
  }

  ipCooldownByAddress.set(ip, now);
  return true;
};

const createPublicTestimonialsQuery = (limit: number, onlyPublished: boolean) => {
  if (!supabase) return null;

  const query = supabase
    .from("testimonials")
    .select(
      "id,first_name,last_name,location,rating,review,profile_image_url,created_at"
    )
    .order("rating", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  return onlyPublished ? query.eq("is_published", true) : query;
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
  let { data, error } = await createPublicTestimonialsQuery(fetchLimit, true)!;

  if (error && isMissingPublishedColumnError(error)) {
    console.warn(
      'Supabase column "testimonials.is_published" not found yet; falling back to legacy query.'
    );
    ({ data, error } = await createPublicTestimonialsQuery(fetchLimit, false)!);
  }

  if (error) {
    console.error("Failed to fetch testimonials:", error);
    return NextResponse.json({ testimonials: [] }, { status: 500 });
  }

  const items = filterHighSignalTestimonials(data ?? []);
  if (!items.length) {
    return NextResponse.json({ testimonials: [] });
  }
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

export async function POST(req: Request) {
  if (!supabase) {
    console.warn("Supabase env vars missing; skipping testimonial insert.");
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Invalid request body", code: "invalid_json" },
      { status: 400 }
    );
  }

  const firstName = normalizeText(body.first_name);
  const lastName = normalizeText(body.last_name);
  const email = normalizeText(body.email).toLowerCase();
  const location = normalizeText(body.location);
  const review = normalizeText(body.review);
  const website = normalizeText(body.website);
  const ratingValue =
    typeof body.rating === "number"
      ? body.rating
      : typeof body.rating === "string"
        ? Number(body.rating)
        : Number.NaN;

  if (website) {
    return NextResponse.json(
      { error: "Spam detected", code: "honeypot_triggered" },
      { status: 422 }
    );
  }

  if (
    !firstName ||
    !lastName ||
    !email ||
    !location ||
    !review ||
    !Number.isInteger(ratingValue)
  ) {
    return NextResponse.json(
      { error: "Missing required fields", code: "missing_required_fields" },
      { status: 422 }
    );
  }

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: "Invalid email address", code: "invalid_email" },
      { status: 422 }
    );
  }

  if (firstName.length > NAME_MAX_LENGTH || lastName.length > NAME_MAX_LENGTH) {
    return NextResponse.json(
      { error: "Name is too long", code: "name_too_long" },
      { status: 422 }
    );
  }

  if (location.length > LOCATION_MAX_LENGTH) {
    return NextResponse.json(
      { error: "Location is too long", code: "location_too_long" },
      { status: 422 }
    );
  }

  if (review.length < REVIEW_MIN_LENGTH || review.length > REVIEW_MAX_LENGTH) {
    return NextResponse.json(
      { error: "Review length is invalid", code: "review_length_invalid" },
      { status: 422 }
    );
  }

  if (ratingValue < 1 || ratingValue > 5) {
    return NextResponse.json(
      { error: "Rating must be between 1 and 5", code: "invalid_rating" },
      { status: 422 }
    );
  }

  const clientIp = getClientIp(req);
  if (clientIp && !enforceIpCooldown(clientIp)) {
    return NextResponse.json(
      { error: "Please wait before sending another review", code: "ip_cooldown" },
      { status: 429 }
    );
  }

  const spamWindowStart = new Date(
    Date.now() - SPAM_WINDOW_MINUTES * 60 * 1000
  ).toISOString();

  const { data: duplicateRows, error: duplicateError } = await supabase
    .from("testimonials")
    .select("id")
    .eq("email", email)
    .eq("review", review)
    .gte("created_at", spamWindowStart)
    .limit(1);

  if (duplicateError) {
    console.error("Failed duplicate testimonial check:", duplicateError);
    return NextResponse.json(
      { error: "Unable to process testimonial right now" },
      { status: 500 }
    );
  }

  if ((duplicateRows ?? []).length > 0) {
    return NextResponse.json(
      {
        error: "Duplicate review detected. Please try again later.",
        code: "duplicate_submission",
      },
      { status: 429 }
    );
  }

  const { error } = await supabase.from("testimonials").insert({
    first_name: firstName,
    last_name: lastName,
    email,
    location,
    rating: ratingValue,
    review,
    is_published: false,
  });

  if (error) {
    console.error("Failed to insert testimonial:", error);
    if (error.code === "23502" || error.code === "23514" || error.code === "22P02") {
      return NextResponse.json(
        { error: "Invalid testimonial data", code: "invalid_data" },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { error: "Failed to submit testimonial" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { ok: true, status: "pending_approval" },
    { status: 201 }
  );
}
