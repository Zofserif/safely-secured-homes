import { useEffect, useState } from "react";
import { isHighSignalReview } from "../../../lib/testimonialQuality";
import type { HomeTestimonial } from "../types";

type ApiTestimonial = {
  id: string | number | null;
  first_name?: string | null;
  last_name?: string | null;
  location?: string | null;
  rating?: number | null;
  review?: string | null;
  profile_image_url?: string | null;
};

const isApiTestimonial = (value: unknown): value is ApiTestimonial => {
  if (!value || typeof value !== "object") return false;
  return "id" in value && "review" in value;
};

export const useHomeTestimonials = () => {
  const [testimonials, setTestimonials] = useState<HomeTestimonial[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchTestimonials = async () => {
      try {
        const response = await fetch("/api/testimonials?limit=3", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch testimonials");
        }

        const data = await response.json();
        const rawItems: unknown[] = Array.isArray(data?.testimonials)
          ? data.testimonials
          : [];

        const mapped: HomeTestimonial[] = rawItems
          .filter(isApiTestimonial)
          .map((item) => {
            const fullName = [item.first_name, item.last_name]
              .filter(Boolean)
              .join(" ")
              .trim();
            const ratingValue = typeof item.rating === "number" ? item.rating : 0;

            return {
              id: String(item.id ?? ""),
              review: String(item.review ?? ""),
              name: fullName || "Homeowner",
              location: item.location ? String(item.location) : "",
              rating: Math.max(0, Math.min(5, ratingValue)),
              profileImageUrl: item.profile_image_url ?? null,
            } as HomeTestimonial;
          })
          .filter((item) => item.id && isHighSignalReview(item.review));

        if (isMounted && mapped.length) {
          setTestimonials(mapped);
        }
      } catch (error) {
        console.warn("Failed to load testimonials:", error);
      }
    };

    void fetchTestimonials();

    return () => {
      isMounted = false;
    };
  }, []);

  return testimonials;
};
