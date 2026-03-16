import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, ChevronRight, Gift, ShieldCheck } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import {
  buildHomeScarcityCopy,
  getHomeScarcityStatusPillClasses,
  getHomeScarcityTimerPillClasses,
} from "../scarcityCopy";
import { HOME_HERO_COPY } from "../heroCopy";
import type { HomeCtaState, HomeScarcityState } from "../types";

const TRUST_CHECKS = [
  "Peace of Mind, Anywhere",
  "A Safer, Happier Family Home",
  "Modern Convenience Without Stress",
];

const TRUST_AUTOPLAY_INTERVAL_MS = 4000;
const TRUST_AUTOPLAY_RESUME_DELAY_MS = 6000;
const PROGRAMMATIC_SCROLL_WINDOW_MS = 900;
const HERO_TEXT_COL_FR = 1;
const HERO_IMAGE_COL_FR = 1.25;
const HERO_DESKTOP_GRID_COLS = `minmax(0, ${HERO_TEXT_COL_FR}fr) minmax(0, ${HERO_IMAGE_COL_FR}fr)`;
const HERO_GRID_STYLE = {
  "--hero-grid-cols-lg": HERO_DESKTOP_GRID_COLS,
} as CSSProperties;
const HERO_HEADLINE_EMPHASIS_STYLE = {
  backgroundImage: "linear-gradient(to top, rgba(190, 233, 232, 0.85) 44%, transparent 44%)",
  borderRadius: "0.12em",
  boxDecorationBreak: "clone",
  color: "#2D3748",
  display: "inline-block",
  paddingInline: "0.1em",
  WebkitBoxDecorationBreak: "clone",
} satisfies CSSProperties;
const EMPTY_SUBSCRIBE = () => () => {};

type HeadlineSegment = {
  text: string;
  emphasized: boolean;
};

type SubcopySegment = {
  text: string;
  emphasized: boolean;
};

type AudiencePillProps = {
  className?: string;
};

const AudiencePill = ({ className = "" }: AudiencePillProps) => (
  <div
    className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.03em] text-slate-500 sm:px-3 sm:text-[11px] sm:tracking-[0.05em] ${className}`.trim()}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-[#2E8B57]/80"></span>
    <span>For Filipino Families Who Wants Security Without Stress</span>
  </div>
);

const parseHeadlineSegments = (headline: string): HeadlineSegment[] => {
  const markerOpen = "[[";
  const markerClose = "]]";
  const segments: HeadlineSegment[] = [];
  let cursor = 0;
  let foundMarker = false;

  while (cursor < headline.length) {
    const openIndex = headline.indexOf(markerOpen, cursor);
    if (openIndex === -1) {
      const trailing = headline.slice(cursor);
      if (trailing) segments.push({ text: trailing, emphasized: false });
      break;
    }

    const closeIndex = headline.indexOf(markerClose, openIndex + markerOpen.length);
    if (closeIndex === -1) {
      return [{ text: headline, emphasized: false }];
    }

    foundMarker = true;
    const before = headline.slice(cursor, openIndex);
    if (before) segments.push({ text: before, emphasized: false });

    const marked = headline.slice(openIndex + markerOpen.length, closeIndex);
    if (marked) segments.push({ text: marked, emphasized: true });

    cursor = closeIndex + markerClose.length;
  }

  if (!foundMarker || segments.length === 0) {
    return [{ text: headline, emphasized: false }];
  }

  return segments;
};

const parseSubcopyBoldSegments = (subcopy: string): SubcopySegment[] => {
  const marker = "**";
  const segments: SubcopySegment[] = [];
  let cursor = 0;
  let foundMarker = false;

  while (cursor < subcopy.length) {
    const openIndex = subcopy.indexOf(marker, cursor);
    if (openIndex === -1) {
      const trailing = subcopy.slice(cursor);
      if (trailing) segments.push({ text: trailing, emphasized: false });
      break;
    }

    const closeIndex = subcopy.indexOf(marker, openIndex + marker.length);
    if (closeIndex === -1) {
      return [{ text: subcopy, emphasized: false }];
    }

    foundMarker = true;
    const before = subcopy.slice(cursor, openIndex);
    if (before) segments.push({ text: before, emphasized: false });

    const marked = subcopy.slice(openIndex + marker.length, closeIndex);
    if (marked) segments.push({ text: marked, emphasized: true });

    cursor = closeIndex + marker.length;
  }

  if (!foundMarker || segments.length === 0) {
    return [{ text: subcopy, emphasized: false }];
  }

  return segments;
};

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
  const showBonusCard =
    scarcity.bonusEnabled &&
    !scarcity.bonusExpired &&
    scarcity.show &&
    !scarcity.soldOut;
  const soldOutSupportText =
    "Reports are sold out for this cycle. Join the newsletter to get notified when the Panatag Rating refreshes.";
  const prefersReducedMotion = useReducedMotion();
  const hasMounted = useSyncExternalStore(EMPTY_SUBSCRIBE, () => true, () => false);
  const headlineSegments = parseHeadlineSegments(HOME_HERO_COPY.headline);
  const subcopySegments = parseSubcopyBoldSegments(HOME_HERO_COPY.subcopy);
  const normalizedHeadline = headlineSegments.map((segment) => segment.text).join("");
  const isLongHeadline = normalizedHeadline.length > 80;
  const headlineSizeClasses = isLongHeadline
    ? "text-[1.62rem] min-[390px]:text-[1.82rem] sm:text-[2.4rem] lg:text-[clamp(2.4rem,5.4vw,4.05rem)]"
    : "text-[2rem] min-[390px]:text-[2.2rem] sm:text-[2.95rem] lg:text-[clamp(3.2rem,6.3vw,5.1rem)]";
  const shouldAnimateHero = hasMounted && prefersReducedMotion === false;
  const heroTextClassName = "order-3 min-w-0 w-full max-w-2xl lg:order-1 lg:max-w-none";
  const heroImageClassName = "relative order-2 block min-w-0 w-full lg:order-2";
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
            Free Bonus: A Panatag Home&apos;s Mug
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

  const heroTextContent = (
    <>
      <AudiencePill className="mb-2 hidden sm:mb-3 lg:mb-4 lg:inline-flex" />

      <h1
        className={`mb-4 text-balance leading-[1.02] font-bold tracking-tight text-[#2D3748] sm:mb-5 lg:mb-[clamp(0.85rem,2.1vh,1.5rem)] ${headlineSizeClasses}`}
      >
        {headlineSegments.map((segment, index) => {
          if (!segment.emphasized) {
            return <span key={`headline-${index}`}>{segment.text}</span>;
          }

          if (!shouldAnimateHero) {
            return (
              <span
                key={`headline-${index}`}
                style={HERO_HEADLINE_EMPHASIS_STYLE}
              >
                {segment.text}
              </span>
            );
          }

          return (
            <motion.span
              key={`headline-${index}`}
              style={HERO_HEADLINE_EMPHASIS_STYLE}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                delay: 0.08 + index * 0.03,
                ease: "easeOut",
              }}
            >
              {segment.text}
            </motion.span>
          );
        })}
      </h1>

      <p className="mb-5 max-w-xl text-[15px] leading-relaxed text-slate-500 sm:mb-6 sm:text-base lg:text-[clamp(1rem,2.25vh,1.18rem)]">
        {subcopySegments.map((segment, index) => {
          if (!segment.emphasized) {
            return <span key={`subcopy-${index}`}>{segment.text}</span>;
          }

          return <strong key={`subcopy-${index}`}>{segment.text}</strong>;
        })}
      </p>

      <div className="rounded-2xl border border-[#BEE9E8]/80 bg-white/90 p-4 shadow-lg shadow-[#0E79B2]/6 sm:rounded-3xl sm:p-5 sm:shadow-xl sm:shadow-[#0E79B2]/8 lg:p-[clamp(1rem,2.4vh,1.5rem)]">
        <button
          onClick={() => onPrimaryCtaClick(cta.target, "hero_primary")}
          disabled={cta.disabled}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#0E79B2] px-6 py-3.5 text-[1.04rem] font-extrabold text-white shadow-lg shadow-[#0E79B2]/20 transition-all hover:-translate-y-1 hover:bg-[#0b5e8b] hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none sm:gap-3 sm:rounded-2xl sm:px-10 sm:py-4 sm:text-xl sm:shadow-xl sm:shadow-[#0E79B2]/25 sm:hover:shadow-2xl lg:py-[clamp(0.85rem,1.8vh,1.25rem)]"
        >
          {cta.label}
          <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1 sm:h-6 sm:w-6" />
        </button>

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
                  {scarcity.reportsClaimed}/{reportsLimit} Homes got the Panatag Rating
                </p>
              </>
            )}
          </div>
        )}

        {scarcity.show && scarcity.soldOut && (
          <p className="mt-3 text-xs font-medium leading-relaxed text-slate-700 sm:text-sm">
            {soldOutSupportText}
          </p>
        )}
      </div>

      {showBonusCard && <div className="mt-4 lg:hidden">{bonusCard}</div>}
    </>
  );

  const heroImageContent = (
    <>
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 z-0 scale-105 rotate-2 rounded-4xl bg-linear-to-tr from-[#2D3748]/10 to-transparent transform sm:rotate-3 lg:rotate-6"></div>
        <div className="relative z-10 h-[clamp(220px,38vh,300px)] min-[390px]:h-[clamp(240px,40vh,340px)] overflow-hidden rounded-3xl border-2 border-white shadow-lg sm:h-[clamp(300px,44vh,430px)] sm:rounded-4xl sm:border-4 sm:shadow-xl lg:h-[clamp(430px,56vh,620px)] xl:h-[clamp(480px,62vh,680px)]">
          <Image
            src="/assets/img/Hero/pexels-vlada-karpovich-4609033.jpg"
            alt="Happy Family in Secure Home"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 hover:scale-[1.02]"
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
    </>
  );

  return (
    <section
      id="home-hero"
      className="relative overflow-hidden px-4 pt-4 pb-8 sm:px-6 sm:pt-6 sm:pb-12 md:min-h-[calc(100svh-5rem)] lg:pt-[clamp(2.5rem,7vh,5rem)] lg:pb-[clamp(2.5rem,8vh,6rem)]"
    >
      <div className="absolute top-0 right-0 -mr-48 -mt-48 h-[640px] w-[640px] rounded-full bg-[#BEE9E8]/40 blur-3xl opacity-60 pointer-events-none sm:-mr-40 sm:-mt-40 sm:h-[800px] sm:w-[800px]"></div>
      <div className="absolute bottom-0 left-0 -ml-44 -mb-44 h-[460px] w-[460px] rounded-full bg-[#BEE9E8]/30 blur-3xl opacity-60 pointer-events-none sm:-ml-40 sm:-mb-40 sm:h-[600px] sm:w-[600px]"></div>

      <div
        className="container relative z-10 mx-auto grid items-center gap-5 sm:gap-8 lg:grid-cols-(--hero-grid-cols-lg) lg:gap-16"
        style={HERO_GRID_STYLE}
      >
        <AudiencePill className="order-1 lg:hidden" />

        {shouldAnimateHero ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={heroTextClassName}
          >
            {heroTextContent}
          </motion.div>
        ) : (
          <div className={heroTextClassName}>{heroTextContent}</div>
        )}

        {shouldAnimateHero ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.95, delay: 0.35 }}
            className={heroImageClassName}
          >
            {heroImageContent}
          </motion.div>
        ) : (
          <div className={heroImageClassName}>{heroImageContent}</div>
        )}
      </div>

      <div className="container mx-auto mt-4 pt-3 sm:mt-8 sm:border-t sm:border-slate-200 sm:pt-6 lg:mt-[clamp(1.5rem,4vh,3rem)] lg:pt-[clamp(1rem,2.5vh,2rem)]">
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
