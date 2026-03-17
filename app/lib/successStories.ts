import { createClient } from "@supabase/supabase-js";
import {
  SOCIAL_PROOF_ENTRIES_TABLE,
  SOCIAL_PROOF_KIND_SUCCESS_STORY,
  SUCCESS_STORY_SELECT,
} from "./socialProofEntries";
import {
  isMissingSupabaseTableError,
  type SupabaseTableError,
} from "./supabaseTableFallback";

export type SuccessStory = {
  id: string;
  name: string | null;
  location: string;
  testimonial: string;
  image_url: string | null;
  media_url: string | null;
  media_type: "image" | "video" | null;
  story_date: string | null;
  created_at: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : null;

const LEGACY_SUCCESS_STORIES_TABLE = "success_stories";
const LEGACY_SUCCESS_STORY_SELECT = [
  "id",
  "name",
  "location",
  "testimonial",
  "image_url",
  "media_url",
  "media_type",
  "story_date",
  "created_at",
].join(",");

const isMissingSocialProofEntriesTableError = (
  error: SupabaseTableError | null | undefined,
) => isMissingSupabaseTableError(error, SOCIAL_PROOF_ENTRIES_TABLE);

export async function getSuccessStoriesPage(options?: {
  limit?: number;
  offset?: number;
}): Promise<{ stories: SuccessStory[]; hasMore: boolean }> {
  const limit = options?.limit ?? 6;
  const offset = options?.offset ?? 0;

  if (!supabase) {
    console.warn("Supabase env vars missing; skipping success stories fetch.");
    return { stories: [], hasMore: false };
  }

  let { data, error } = await supabase
    .from(SOCIAL_PROOF_ENTRIES_TABLE)
    .select(SUCCESS_STORY_SELECT)
    .eq("kind", SOCIAL_PROOF_KIND_SUCCESS_STORY)
    .order("story_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);

  if (error && isMissingSocialProofEntriesTableError(error)) {
    ({ data, error } = await supabase
      .from(LEGACY_SUCCESS_STORIES_TABLE)
      .select(LEGACY_SUCCESS_STORY_SELECT)
      .order("story_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit));
  }

  if (error) {
    console.error("Failed to fetch success stories:", error);
    return { stories: [], hasMore: false };
  }

  const items = (data as unknown as SuccessStory[] | null) ?? [];
  const hasMore = items.length > limit;
  return { stories: items.slice(0, limit), hasMore };
}
