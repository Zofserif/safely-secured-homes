import { getApplyTestimonials } from "../../lib/applyTestimonials";

const renderHearts = (rating: number) =>
  Array.from({ length: 5 }, (_, index) => {
    const filled = index < rating;
    return (
      <svg
        key={`heart-${index}`}
        viewBox="0 0 24 24"
        className="h-6 w-6 sm:h-7 sm:w-7"
        fill={filled ? "#0E79B2" : "none"}
        stroke={filled ? "#0E79B2" : "#CBD5E1"}
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <path d="M12 20.25s-7.5-4.35-9.3-8.55C1.6 8.7 3.4 6 6.3 6c1.8 0 3.15 1.05 3.7 2.1C10.55 7.05 11.9 6 13.7 6c2.9 0 4.7 2.7 3.6 5.7-1.8 4.2-9.3 8.55-9.3 8.55z" />
      </svg>
    );
  });

export default async function ApplyTestimonialsSection() {
  const testimonials = await getApplyTestimonials(3);

  if (!testimonials.length) {
    return null;
  }

  return (
    <section className="mt-12">
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D3748]">
          What homeowners are saying
        </h2>
        <p className="text-slate-600 mt-3 text-sm sm:text-base">
          Real feedback from families who started their security journey with us.
        </p>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((item) => {
          const rating = Math.max(0, Math.min(5, item.rating ?? 0));
          const fullName = [item.first_name, item.last_name]
            .filter(Boolean)
            .join(" ")
            .trim();
          const initials = fullName
            .split(" ")
            .filter(Boolean)
            .map((part) => part[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
          return (
            <article
              key={item.id}
              className="rounded-3xl border border-[#DCE6F1] bg-white/95 p-6 shadow-[0_18px_40px_rgba(14,121,178,0.08)] flex flex-col text-left"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-[#E6F4FF] flex items-center justify-center overflow-hidden text-[#0E79B2] font-semibold">
                  {item.profile_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.profile_image_url}
                      alt={fullName || "Homeowner"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{initials || "H"}</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-[#1F2937]">
                    {fullName || "Homeowner"}
                  </p>
                  {item.location && (
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {item.location}
                    </p>
                  )}
                </div>
              </div>

              <div
                className="mt-4 flex items-center justify-center gap-1.5"
                aria-label={`Rating ${rating} out of 5`}
              >
                {renderHearts(rating)}
              </div>

              <p className="mt-4 text-slate-700 text-sm sm:text-base leading-relaxed flex-1">
                {item.review}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
