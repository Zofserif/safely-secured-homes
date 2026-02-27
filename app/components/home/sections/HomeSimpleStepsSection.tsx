/* eslint-disable @next/next/no-img-element */

import { ChevronRight } from "lucide-react";
import {
  buildHomeScarcityCopy,
  getHomeScarcityStatusPillClasses,
  getHomeScarcityTimerPillClasses,
} from "../scarcityCopy";
import type { HomeCtaState, HomeScarcityState } from "../types";

export default function HomeSimpleStepsSection({
  cta,
  scarcity,
  onPrimaryCtaClick,
}: {
  cta: HomeCtaState;
  scarcity: HomeScarcityState;
  onPrimaryCtaClick: (
    target: HomeCtaState["target"],
    location: "midpage_primary"
  ) => void;
}) {
  const scarcityCopy = buildHomeScarcityCopy(scarcity);
  const reportsLimit = Math.max(1, scarcity.reportsLimit ?? 1);
  const progressPercent = Math.max(
    0,
    Math.min(100, (scarcity.reportsClaimed / reportsLimit) * 100),
  );
  const ctaSupportText = scarcity.show
    ? "In 60 seconds, get your personalized plan and practical next security steps."
    : "Your plan is ready. Open it now and continue your next security steps.";

  return (
    <section className="py-32 bg-white">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-20 text-[#2D3748]">
          3 Simple Steps to Start Your Plan
        </h2>
        <div className="grid md:grid-cols-3 gap-12">
          {[
            {
              img: "/assets/img/3 Simple Steps/Step 1.png",
              title: "Step 1: Quick home assessment",
              desc: "Answer a few guided questions so we understand your layout, concerns, and priorities.",
            },
            {
              img: "/assets/img/3 Simple Steps/Step 2.png",
              title: "Step 2: Receive your plan",
              desc: "Get a personalized recommendation designed for your home setup and comfort level.",
            },
            {
              img: "/assets/img/3 Simple Steps/Step 3.png",
              title: "Step 3: Optional consult & install",
              desc: "If you want help implementing, we guide the next steps and handle setup end to end.",
            },
          ].map((step, i) => (
            <div key={i} className="group cursor-default">
              <div className="mb-8 relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200 group-hover:shadow-[#0E79B2]/20 transition-all duration-500 aspect-square border-4 border-white">
                <div className="absolute inset-0 bg-[#2D3748]/0 group-hover:bg-[#2D3748]/10 transition-colors z-10"></div>
                <img
                  src={step.img}
                  alt={step.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md w-12 h-12 flex items-center justify-center rounded-full font-bold text-xl text-[#0E79B2] shadow-lg z-20">
                  {i + 1}
                </div>
              </div>
              <h3 className="font-bold text-2xl mb-4 text-[#2D3748]">{step.title}</h3>
              <p className="text-slate-600 leading-relaxed px-4">{step.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-14 mx-auto max-w-3xl rounded-3xl border border-[#BEE9E8] bg-[#F7FAFC] p-8 shadow-md text-left">
          <p className="text-sm uppercase tracking-wide font-semibold text-[#0E79B2] mb-2">
            Ready to see your plan?
          </p>
          <p className="text-slate-700 text-lg font-semibold mb-2">
            Get your personalized plan plus the free bonus checklist before this
            cycle closes.
          </p>
          <p className="text-slate-600 mb-4">{ctaSupportText}</p>

          {scarcity.show && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold sm:text-sm ${getHomeScarcityStatusPillClasses(scarcityCopy.tone, "light")}`}
              >
                {scarcityCopy.statusPill}
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold sm:text-sm ${getHomeScarcityTimerPillClasses("light")}`}
              >
                {scarcityCopy.timerPill}
              </span>
            </div>
          )}

          {scarcity.show && !scarcity.loading && !scarcity.error && (
            <div className="mb-5">
              <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    scarcity.soldOut ? "bg-[#E53E3E]" : "bg-[#0E79B2]"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-700 sm:text-sm">
                {scarcity.reportsClaimed}/{reportsLimit} claimed this cycle
              </p>
            </div>
          )}

          <button
            onClick={() => onPrimaryCtaClick(cta.target, "midpage_primary")}
            disabled={cta.disabled}
            className="w-full bg-[#0E79B2] hover:bg-[#0b5e8b] text-white py-4 rounded-2xl font-extrabold shadow-lg shadow-[#0E79B2]/20 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
          >
            {cta.label}
            <ChevronRight className="w-5 h-5" />
          </button>
          <p className="mt-3 text-xs sm:text-sm text-slate-600 text-center">
            Takes 60 seconds &#8226; No credit card &#8226; No obligation
          </p>
        </div>
      </div>
    </section>
  );
}
