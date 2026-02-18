/* eslint-disable @next/next/no-img-element */

import { Sparkles } from "lucide-react";
import type { HomeTestimonial } from "../types";

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

export default function HomeTestimonialsSection({
  testimonials,
}: {
  testimonials: HomeTestimonial[];
}) {
  return (
    <section className="relative py-24 sm:py-28 bg-linear-to-b from-[#F7FAFC] via-white to-[#E9F5F4] border-y border-slate-200 overflow-hidden">
      <div className="absolute -top-24 -right-24 w-[360px] h-[360px] bg-[#BEE9E8]/45 rounded-full blur-3xl opacity-70 pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-16 w-[320px] h-80 bg-[#63B3ED]/20 rounded-full blur-3xl opacity-70 pointer-events-none"></div>
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-white/90 border border-[#BEE9E8] rounded-full px-4 py-1.5 mb-5 shadow-sm">
            <Sparkles className="w-4 h-4 text-[#0E79B2]" />
            <span className="text-[#2D3748] font-semibold text-xs uppercase tracking-wide">
              Trusted Testimonials
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2D3748] mb-4">
            What Our Clients Say
          </h2>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">
            Families across Luzon sleep soundly because of Safely Secured Homes.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="group bg-white/90 p-7 sm:p-8 rounded-3xl shadow-lg shadow-[#0E79B2]/8 border border-slate-200/70 relative overflow-hidden"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-[#E6F4FF] rounded-full flex items-center justify-center text-[#0E79B2] font-bold text-base overflow-hidden">
                  {testimonial.profileImageUrl ? (
                    <img
                      src={testimonial.profileImageUrl}
                      alt={testimonial.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{testimonial.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-[#2D3748] text-base">{testimonial.name}</div>
                  {testimonial.location && (
                    <div className="text-sm text-slate-500">{testimonial.location}</div>
                  )}
                </div>
              </div>
              <div
                className="mt-4 flex items-center justify-center gap-1"
                aria-label={`Rating ${testimonial.rating} out of 5`}
              >
                {renderHearts(testimonial.rating)}
              </div>
              <p className="text-slate-700 mb-1 mt-5 relative z-10 text-base sm:text-lg leading-relaxed font-medium">
                &quot;{testimonial.review}&quot;
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
