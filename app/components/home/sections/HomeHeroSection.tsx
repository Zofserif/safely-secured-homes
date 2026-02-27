import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight, Gift, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildHomeScarcityCopy,
  getHomeScarcityStatusPillClasses,
  getHomeScarcityTimerPillClasses,
} from "../scarcityCopy";
import type { HomeCtaState, HomeScarcityState } from "../types";

const TRUST_CHECKS = [
  "Peace of Mind, Anywhere",
  "A Safer, Happier Family Home",
  "Modern Convenience Without Stress",
];

const TRUST_AUTOPLAY_INTERVAL_MS = 4000;
const TRUST_AUTOPLAY_RESUME_DELAY_MS = 6000;
const PROGRAMMATIC_SCROLL_WINDOW_MS = 900;

export default function HomeHeroSection({
  onPrimaryCtaClick,
  cta,
  scarcity,
}: {
  onPrimaryCtaClick: (
    target: HomeCtaState["target"],
    location: "hero_primary"
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
  const progressFillClass = scarcity.soldOut
    ? "bg-[#E53E3E]"
    : scarcity.urgencyTier === "critical"
      ? "bg-[#DD6B20]"
      : "bg-[#0E79B2]";
  const showBonusCard = !scarcity.bonusExpired && scarcity.show && !scarcity.soldOut;
  const bonusCard = (
    <div className="rounded-2xl border border-[#BEE9E8] bg-[#F0FAFF] p-3.5 shadow-sm sm:p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-white p-2 text-[#0E79B2] shadow-sm">
          <Gift className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#0E79B2]">
            1-Hour Bonus Active
          </p>
          <p className="text-sm font-bold leading-snug text-[#2D3748] sm:text-base">
            Free bonus: 5 practical home security upgrades you can do today.
          </p>
          <p className="mt-1 text-xs font-semibold text-[#2D3748] sm:text-sm">
            {scarcity.bonusEndsAt === null
              ? "Loading bonus timer..."
              : `Bonus expires in ${scarcity.bonusCountdown}`}
          </p>
        </div>
      </div>
    </div>
  );
  const [activeTrustIndex, setActiveTrustIndex] = useState(0);
  const trustCarouselRef = useRef<HTMLDivElement | null>(null);
  const trustPauseUntilMsRef = useRef(0);
  const programmaticScrollUntilMsRef = useRef(0);
  const trustScrollRafRef = useRef<number | null>(null);

  const syncActiveTrustFromScroll = useCallback(() => {
    const carousel = trustCarouselRef.current;
    if (!carousel) return;

    const slideWidth = carousel.clientWidth;
    if (slideWidth <= 0) return;

    const nextIndex = Math.round(carousel.scrollLeft / slideWidth);
    const clampedIndex = Math.max(0, Math.min(TRUST_CHECKS.length - 1, nextIndex));
    setActiveTrustIndex(clampedIndex);
  }, []);

  const pauseTrustAutoplay = useCallback(() => {
    trustPauseUntilMsRef.current = Date.now() + TRUST_AUTOPLAY_RESUME_DELAY_MS;
  }, []);

  const handleTrustCarouselScroll = useCallback(() => {
    if (trustScrollRafRef.current === null && typeof window !== "undefined") {
      trustScrollRafRef.current = window.requestAnimationFrame(() => {
        trustScrollRafRef.current = null;
        syncActiveTrustFromScroll();
      });
    }

    if (Date.now() > programmaticScrollUntilMsRef.current) {
      pauseTrustAutoplay();
    }
  }, [pauseTrustAutoplay, syncActiveTrustFromScroll]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const advanceTrustSlide = () => {
      if (mediaQuery.matches) return;
      if (document.visibilityState !== "visible") return;
      if (Date.now() < trustPauseUntilMsRef.current) return;

      const carousel = trustCarouselRef.current;
      if (!carousel) return;

      const slideWidth = carousel.clientWidth;
      if (slideWidth <= 0) return;

      const currentIndex = Math.round(carousel.scrollLeft / slideWidth);
      const nextIndex = (currentIndex + 1) % TRUST_CHECKS.length;
      programmaticScrollUntilMsRef.current =
        Date.now() + PROGRAMMATIC_SCROLL_WINDOW_MS;
      carousel.scrollTo({
        left: nextIndex * slideWidth,
        behavior: "smooth",
      });
      setActiveTrustIndex(nextIndex);
    };

    const intervalId = window.setInterval(
      advanceTrustSlide,
      TRUST_AUTOPLAY_INTERVAL_MS,
    );
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      syncActiveTrustFromScroll();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleResize = () => {
      const carousel = trustCarouselRef.current;
      if (!carousel) return;

      const slideWidth = carousel.clientWidth;
      if (slideWidth <= 0) return;

      carousel.scrollTo({
        left: activeTrustIndex * slideWidth,
        behavior: "auto",
      });
    };

    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", handleResize);

      if (trustScrollRafRef.current !== null) {
        window.cancelAnimationFrame(trustScrollRafRef.current);
        trustScrollRafRef.current = null;
      }
    };
  }, [activeTrustIndex, syncActiveTrustFromScroll]);

  return (
    <section
      id="home-hero"
      className="relative overflow-hidden px-4 pt-4 pb-8 sm:px-6 sm:pt-6 sm:pb-12 md:min-h-[calc(100svh-5rem)] lg:pt-20 lg:pb-24"
    >
      <div className="absolute top-0 right-0 -mr-48 -mt-48 h-[640px] w-[640px] rounded-full bg-[#BEE9E8]/40 blur-3xl opacity-60 pointer-events-none sm:-mr-40 sm:-mt-40 sm:h-[800px] sm:w-[800px]"></div>
      <div className="absolute bottom-0 left-0 -ml-44 -mb-44 h-[460px] w-[460px] rounded-full bg-[#BEE9E8]/30 blur-3xl opacity-60 pointer-events-none sm:-ml-40 sm:-mb-40 sm:h-[600px] sm:w-[600px]"></div>

      <div className="container relative z-10 mx-auto grid items-center gap-5 sm:gap-8 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="block relative lg:order-last"
        >
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 z-0 scale-105 rotate-2 rounded-4xl bg-linear-to-tr from-[#2D3748]/10 to-transparent transform sm:rotate-3 lg:rotate-6"></div>
            <div className="relative z-10 h-[clamp(220px,38vh,300px)] min-[390px]:h-[clamp(240px,40vh,340px)] overflow-hidden rounded-3xl border-2 border-white shadow-xl sm:h-[clamp(300px,44vh,430px)] sm:rounded-4xl sm:border-4 sm:shadow-2xl lg:h-[680px]">
              <Image
                src="/assets/img/Hero/pexels-vlada-karpovich-4609033.jpg"
                alt="Happy Family in Secure Home"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute right-0 bottom-0 left-0 bg-linear-to-t from-black/60 to-transparent p-3 sm:p-4 lg:p-8">
                <div className="flex items-center gap-1.5 text-xs font-medium text-white/90 sm:gap-2 sm:text-sm">
                  <ShieldCheck className="h-4 w-4 text-[#2E8B57]" />{" "}
                  100% Secure &
                  Private
                </div>
              </div>
            </div>
          </div>
          {showBonusCard && <div className="relative z-10 mt-5 hidden lg:block">{bonusCard}</div>}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#BEE9E8] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#2D3748] shadow-sm sm:mb-5 sm:px-4 sm:text-xs sm:tracking-wide lg:mb-8">
            <span className="h-2 w-2 rounded-full bg-[#2E8B57] animate-pulse"></span>
            <span>
              For Filipino Families Who Want Security Without Stress
            </span>
          </div>

          <h1 className="mb-3 text-[1.75rem] leading-[1.12] font-bold tracking-tight text-[#2D3748] min-[390px]:text-[1.9rem] sm:mb-5 sm:text-4xl lg:mb-8 lg:text-7xl">
            Your Personalized
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#2D3748] via-[#0E79B2] to-[#2D3748] decoration-[#0E79B2] decoration-4 underline underline-offset-4">
              Safe & Smart Home Plan
            </span>
          </h1>

          <p className="mb-5 max-w-xl text-[15px] leading-relaxed text-slate-600 sm:mb-6 sm:text-base lg:text-xl">
            In 60 seconds, get a <strong>free home panatag plan</strong> tailored
            to your layout, priorities, and routine so your family stays protected,
            whether you&apos;re in traffic, at work, or out of town.
          </p>

          <div className="rounded-2xl border border-[#BEE9E8]/80 bg-white/95 p-4 shadow-xl shadow-[#0E79B2]/8 sm:rounded-3xl sm:p-5 sm:shadow-2xl sm:shadow-[#0E79B2]/10 lg:p-6">
            <button
              onClick={() => onPrimaryCtaClick(cta.target, "hero_primary")}
              disabled={cta.disabled}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#0E79B2] px-6 py-3.5 text-[1.04rem] font-extrabold text-white shadow-lg shadow-[#0E79B2]/20 transition-all hover:-translate-y-1 hover:bg-[#0b5e8b] hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none sm:gap-3 sm:rounded-2xl sm:px-10 sm:py-4 sm:text-xl sm:shadow-xl sm:shadow-[#0E79B2]/25 sm:hover:shadow-2xl lg:py-5"
            >
              {cta.label}
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1 sm:h-6 sm:w-6" />
            </button>
            <p className="mt-2.5 text-center text-xs text-slate-600 sm:mt-3 sm:text-sm">
              Takes 60 seconds &#8226; No credit card &#8226; No obligation
            </p>

            {scarcity.show && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-center gap-2">
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
                {!scarcity.loading && !scarcity.error && (
                  <>
                    <div className="mt-3 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${progressFillClass} transition-all duration-700`}
                        style={{ width: `${progressPercent}%` }}
                        role="presentation"
                      />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-700 sm:text-sm">
                      {scarcity.reportsClaimed}/{reportsLimit} claimed this cycle
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {showBonusCard && <div className="mt-4 lg:hidden">{bonusCard}</div>}
        </motion.div>
      </div>

      <div className="container mx-auto mt-4 pt-3 sm:mt-8 sm:border-t sm:border-slate-200 sm:pt-6 lg:mt-12 lg:pt-8">
        <div className="sm:hidden">
          <div
            ref={trustCarouselRef}
            className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Trust highlights"
            onScroll={handleTrustCarouselScroll}
            onTouchStart={pauseTrustAutoplay}
            onMouseDown={pauseTrustAutoplay}
          >
            {TRUST_CHECKS.map((text, index) => (
              <div
                key={text}
                className="w-full shrink-0 snap-center px-1"
                aria-hidden={activeTrustIndex !== index}
              >
                <div className="flex items-center justify-center gap-2 text-sm font-semibold text-[#2D3748]">
                  <div className="rounded-full bg-[#2E8B57]/10 p-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#2E8B57]" />
                  </div>
                  {text}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2.5 flex items-center justify-center gap-1.5">
            {TRUST_CHECKS.map((text, index) => (
              <span
                key={`${text}-dot`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeTrustIndex === index
                    ? "w-4 bg-[#0E79B2]"
                    : "w-1.5 bg-slate-300"
                }`}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        <div className="hidden flex-wrap justify-center gap-4 opacity-80 transition-all duration-500 hover:opacity-100 sm:flex lg:gap-16">
          {TRUST_CHECKS.map((text, i) => (
            <div
              key={i}
              className="flex items-center gap-3 text-sm font-semibold text-[#2D3748] lg:text-base"
            >
              <div className="rounded-full bg-[#2E8B57]/10 p-1">
                <CheckCircle2 className="h-4 w-4 text-[#2E8B57] lg:h-5 lg:w-5" />
              </div>
              {text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
