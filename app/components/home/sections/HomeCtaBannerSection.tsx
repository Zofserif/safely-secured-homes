import { ChevronRight } from "lucide-react";
import {
  buildHomeScarcityCopy,
  getHomeScarcityStatusPillClasses,
  getHomeScarcityTimerPillClasses,
} from "../scarcityCopy";
import type { HomeCtaState, HomeScarcityState } from "../types";

export default function HomeCtaBannerSection({
  onPrimaryCtaClick,
  cta,
  scarcity,
}: {
  onPrimaryCtaClick: (
    target: HomeCtaState["target"],
    location: "cta_banner_primary"
  ) => void;
  cta: HomeCtaState;
  scarcity: HomeScarcityState;
}) {
  const scarcityCopy = buildHomeScarcityCopy(scarcity);
  const reportsLimit = Math.max(1, scarcity.reportsLimit ?? 1);
  const progressPercent = Math.max(
    0,
    Math.min(100, (scarcity.reportsClaimed / reportsLimit) * 100),
  );
  const ctaSupportText = scarcity.soldOut
    ? "Reports are sold out for this cycle. Join the newsletter to get notified when the Panatag Rating refreshes."
    : scarcity.show
      ? "In 60 seconds, get your personalized plan and practical next security steps."
      : "Your personalized plan is already ready. Open it now and take the next step.";
  const heroSupportText = scarcity.bonusEnabled
    ? "Get your personalized recommendation plus the Free Bonus: A Panatag Home's Mug with zero pressure."
    : "Get your personalized recommendation with zero pressure before this cycle closes.";

  return (
    <section className="py-20 px-6">
      <div className="container mx-auto">
        <div className="bg-[#2D3748] rounded-[3rem] p-8 md:p-14 lg:p-20 relative overflow-hidden shadow-2xl shadow-[#2D3748]/30">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0E79B2]/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] font-bold text-[#63B3ED] mb-3">
                Final chance this cycle
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                Claim your free Panatag home plan before this cycle closes.
              </h2>
              <p className="text-slate-300 text-base sm:text-lg mb-5">
                {heroSupportText}
              </p>

              {scarcity.show && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold sm:text-sm ${getHomeScarcityStatusPillClasses(scarcityCopy.tone, "dark")}`}
                    >
                      {scarcityCopy.statusPill}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold sm:text-sm ${getHomeScarcityTimerPillClasses("dark")}`}
                    >
                      {scarcityCopy.timerPill}
                    </span>
                  </div>
                  {!scarcity.loading && !scarcity.error && (
                    <div>
                      <div className="h-2 rounded-full bg-[#4A5568] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            scarcity.soldOut ? "bg-[#E53E3E]" : "bg-[#63B3ED]"
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="mt-2 text-xs sm:text-sm text-slate-300 font-semibold">
                        {scarcity.reportsClaimed}/{reportsLimit} claimed this cycle
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-[#63B3ED]/30 bg-[#111827]/70 backdrop-blur-sm p-6 sm:p-8">
              <p className="text-slate-300 text-sm sm:text-base mb-4">
                {ctaSupportText}
              </p>
              <button
                onClick={() => onPrimaryCtaClick(cta.target, "cta_banner_primary")}
                disabled={cta.disabled}
                className="w-full bg-[#0E79B2] hover:bg-[#0b5e8b] text-white text-base sm:text-lg px-8 py-4 rounded-2xl font-extrabold shadow-lg shadow-[#0E79B2]/25 transition-all hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {cta.label}
                <ChevronRight className="w-5 h-5" />
              </button>
              <p className="mt-3 text-center text-xs sm:text-sm text-slate-400">
                Takes 60 seconds &#8226; No credit card &#8226; No obligation
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
