"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import type { SuccessStory } from "../../lib/successStories";

const formatStoryDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

type Props = {
  initialStories: SuccessStory[];
  initialHasMore: boolean;
  pageSize: number;
};

export default function SuccessStoriesClient({
  initialStories,
  initialHasMore,
  pageSize,
}: Props) {
  const [stories, setStories] = useState<SuccessStory[]>(initialStories);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [supportsObserver, setSupportsObserver] = useState(true);
  const loadingRef = useRef(false);
  const lastOffsetRef = useRef<number | null>(null);

  const handleLoadMore = useCallback(async () => {
    if (loadingRef.current || loading) return;
    if (!hasMore) return;
    const offset = stories.length;
    if (lastOffsetRef.current === offset) return;
    lastOffsetRef.current = offset;
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/success-stories?offset=${offset}&limit=${pageSize}`,
        { cache: "no-store" }
      );
      if (!response.ok) {
        throw new Error("Failed to load success stories.");
      }
      const data = (await response.json()) as {
        stories: SuccessStory[];
        hasMore: boolean;
      };
      setStories((prev) => {
        const existingIds = new Set(prev.map((story) => story.id));
        const merged = [...prev];
        for (const story of data.stories ?? []) {
          if (!existingIds.has(story.id)) {
            existingIds.add(story.id);
            merged.push(story);
          }
        }
        return merged;
      });
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      console.error(err);
      setError("Could not load more stories. Please try again.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [hasMore, loading, pageSize, stories.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSupportsObserver("IntersectionObserver" in window);
  }, []);

  useEffect(() => {
    if (!hasMore) return;
    if (!supportsObserver) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          handleLoadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleLoadMore, hasMore, loading, stories.length, supportsObserver]);

  if (stories.length === 0) {
    return (
      <div className="mt-8 text-center text-sm text-slate-500">
        Success stories will appear here soon.
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="columns-1 md:columns-2 lg:columns-3 gap-x-6">
        {stories.map((story) => {
          const initials = story.name
            ? story.name
                .split(" ")
                .filter(Boolean)
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
            : "SH";
          const displayDate =
            formatStoryDate(story.story_date) ??
            formatStoryDate(story.created_at);

          const mediaType = story.media_type ?? (story.media_url ? "image" : null);

          return (
            <article
              key={story.id}
              className="bg-white/95 border border-[#BEE9E8]/70 rounded-3xl p-6 shadow-lg shadow-[#0E79B2]/10 flex flex-col mb-6 break-inside-avoid w-full align-top"
            >
              {story.media_url && (
                <div className="relative mb-4 overflow-hidden rounded-2xl border border-[#BEE9E8]/60 bg-[#F7FAFC]">
                  {mediaType === "video" ? (
                    <>
                      <video
                        className="w-full h-48 object-cover"
                        controls
                        preload="metadata"
                      >
                        <source src={story.media_url} />
                      </video>
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-black/40 text-white">
                          <Play className="w-6 h-6" />
                        </span>
                      </div>
                    </>
                  ) : (
                    <img
                      src={story.media_url}
                      alt={story.name ?? "Success story media"}
                      className="w-full h-48 object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
              )}
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-full bg-[#BEE9E8]/60 flex items-center justify-center text-sm font-bold text-[#0E79B2] overflow-hidden">
                  {story.image_url ? (
                    <img
                      src={story.image_url}
                      alt={story.name ?? "Success story"}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-[#2D3748]">
                    {story.name ?? "Safely Secured Homes Client"}
                  </p>
                  <p className="text-xs text-slate-500">{story.location}</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-4 leading-relaxed flex-1">
                “{story.testimonial}”
              </p>
              {displayDate && (
                <p className="text-xs text-slate-500 mt-4">{displayDate}</p>
              )}
            </article>
          );
        })}
      </div>

      {hasMore && (
        <div className="mt-8 flex flex-col items-center gap-3">
          {supportsObserver ? (
            <div
              ref={sentinelRef}
              className="h-10 w-full flex items-center justify-center text-sm text-slate-500"
            >
              {loading ? "Loading more stories..." : "Loading more..."}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loading}
              className="inline-flex items-center justify-center bg-white border border-[#BEE9E8] text-[#0E79B2] px-6 py-3 rounded-full font-semibold shadow-sm hover:bg-[#F7FAFC] disabled:opacity-60"
            >
              {loading ? "Loading..." : "Load more"}
            </button>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
