import { NextResponse } from "next/server";
import { getSuccessStoriesPage } from "../../lib/successStories";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? "6");
  const offset = Number(searchParams.get("offset") ?? "0");

  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 24) : 6;
  const safeOffset = Number.isFinite(offset) ? Math.max(offset, 0) : 0;

  const { stories, hasMore } = await getSuccessStoriesPage({
    limit: safeLimit,
    offset: safeOffset,
  });

  return NextResponse.json({ stories, hasMore });
}
