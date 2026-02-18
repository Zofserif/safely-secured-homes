import type { HomeCtaState, HomeScarcityState } from "../types";

export default function HomeCtaBannerSection({
  onNavigate,
  cta,
  scarcity,
}: {
  onNavigate: (p: string) => void;
  cta: HomeCtaState;
  scarcity: HomeScarcityState;
}) {
  return (
    <section className="py-20 px-6">
      <div className="container mx-auto">
        <div className="bg-[#2D3748] rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-[#2D3748]/30">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0E79B2]/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
              Ready for a Panatag Home?
            </h2>
            <p className="text-slate-300 text-xl mb-12">
              Get your plan now plus{" "}
              <span className="text-[#63B3ED] font-bold">FREE Bonus</span>: 5
              Secrets to a Panatag Home: The Smart Home Security Checklist.
            </p>
            <button
              onClick={() => onNavigate(cta.target)}
              disabled={cta.disabled}
              className="bg-[#0E79B2] hover:bg-[#0b5e8b] text-white text-xl px-14 py-6 rounded-full font-extrabold shadow-lg shadow-[#0E79B2]/25 transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100"
            >
              {cta.label}
            </button>
            {scarcity.show && (
              <div className="mt-4 flex items-start justify-center gap-2 text-xs sm:text-sm text-slate-300">
                <span
                  className="mt-1 h-2 w-2 rounded-full bg-[#E53E3E] animate-pulse"
                  aria-hidden="true"
                ></span>
                <span>
                  {scarcity.loading && "Checking report availability..."}
                  {!scarcity.loading &&
                    scarcity.error &&
                    "Availability check failed. Please try again shortly."}
                  {!scarcity.loading && !scarcity.error && scarcity.soldOut && (
                    <>
                      All 15 reports are claimed until{scarcity.countdownLabel}.
                      Check back soon for the free bonus.
                    </>
                  )}
                  {!scarcity.loading && !scarcity.error && !scarcity.soldOut && (
                    <>
                      Only {scarcity.reportsRemaining}/15 reports remaining until
                      {scarcity.countdownLabel}
                    </>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
