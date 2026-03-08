import { Check } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { resolveFirstName } from "../../../lib/contactName";
import {
  SOLUTION_OPTIONS,
  SOLUTION_OPTION_CARDS,
  type SolutionOptionCard,
  type SolutionOptionValue,
} from "../../../lib/formOptions";
import type { SolutionStepProps } from "../types";

const desktopSolutionCardOrderClasses: Record<SolutionOptionValue, string> = {
  [SOLUTION_OPTIONS.DONE_FOR_YOU_SETUP]: "lg:order-3",
  [SOLUTION_OPTIONS.ONE_ON_ONE_HOME_SECURITY_CONSULTATION]: "lg:order-2",
  [SOLUTION_OPTIONS.DIY_HOME_SAFETY_PLAN]: "lg:order-1",
};

const mobileSolutionCardOrder: readonly SolutionOptionValue[] = [
  SOLUTION_OPTIONS.DIY_HOME_SAFETY_PLAN,
  SOLUTION_OPTIONS.DONE_FOR_YOU_SETUP,
  SOLUTION_OPTIONS.ONE_ON_ONE_HOME_SECURITY_CONSULTATION,
];

const solutionOptionByValue = new Map(
  SOLUTION_OPTION_CARDS.map((option) => [option.value, option] as const),
);

const mobileSolutionCards: readonly SolutionOptionCard[] = mobileSolutionCardOrder
  .map((value) => solutionOptionByValue.get(value))
  .filter((option): option is SolutionOptionCard => option !== undefined);

export default function SolutionStep({
  formData,
  onNext,
  onUpdateField,
}: SolutionStepProps) {
  const firstName = resolveFirstName(formData.first_name);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const resizeRafRef = useRef<number | null>(null);
  const activeSlideIndexRef = useRef(0);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const selectedSlideIndex = mobileSolutionCards.findIndex(
    (option) => option.value === formData.solution,
  );
  const featuredSlideIndex = mobileSolutionCards.findIndex(
    (option) => option.isFeatured,
  );
  const initialSlideIndex = selectedSlideIndex >= 0
    ? selectedSlideIndex
    : featuredSlideIndex >= 0
      ? featuredSlideIndex
      : 0;

  const getCarouselSlides = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel) return [] as HTMLButtonElement[];
    return Array.from(
      carousel.querySelectorAll<HTMLButtonElement>('[data-solution-slide="true"]'),
    );
  }, []);

  const scrollToSlide = useCallback((index: number, behavior: ScrollBehavior) => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const slides = getCarouselSlides();
    const slide = slides[index];
    if (!slide) return;
    const centeredLeft = slide.offsetLeft - (carousel.clientWidth - slide.clientWidth) / 2;
    const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
    const targetLeft = Math.max(0, Math.min(centeredLeft, maxScrollLeft));
    carousel.scrollTo({
      left: targetLeft,
      behavior,
    });
    activeSlideIndexRef.current = index;
    setActiveSlideIndex(index);
  }, [getCarouselSlides]);

  const syncActiveSlideFromScroll = useCallback(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const slides = getCarouselSlides();
    if (slides.length === 0) return;

    const viewportCenter = carousel.scrollLeft + carousel.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide, index) => {
      const slideCenter = slide.offsetLeft + slide.clientWidth / 2;
      const distance = Math.abs(slideCenter - viewportCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    activeSlideIndexRef.current = closestIndex;
    setActiveSlideIndex(closestIndex);
  }, [getCarouselSlides]);

  const handleCarouselScroll = useCallback(() => {
    if (typeof window === "undefined") return;
    if (scrollRafRef.current !== null) return;

    scrollRafRef.current = window.requestAnimationFrame(() => {
      scrollRafRef.current = null;
      syncActiveSlideFromScroll();
    });
  }, [syncActiveSlideFromScroll]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 1023px)").matches) return;

    const frameId = window.requestAnimationFrame(() => {
      scrollToSlide(initialSlideIndex, "auto");
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [initialSlideIndex, scrollToSlide]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isTabletOrBelow = () => window.matchMedia("(max-width: 1023px)").matches;

    const handleViewportChange = () => {
      if (!isTabletOrBelow()) return;
      if (resizeRafRef.current !== null) return;

      resizeRafRef.current = window.requestAnimationFrame(() => {
        resizeRafRef.current = null;
        const fallbackIndex =
          selectedSlideIndex >= 0 ? selectedSlideIndex : activeSlideIndexRef.current;
        const targetIndex = Math.max(
          0,
          Math.min(fallbackIndex, mobileSolutionCards.length - 1),
        );
        scrollToSlide(targetIndex, "auto");
      });
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("orientationchange", handleViewportChange);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("orientationchange", handleViewportChange);
      if (resizeRafRef.current !== null) {
        window.cancelAnimationFrame(resizeRafRef.current);
        resizeRafRef.current = null;
      }
    };
  }, [scrollToSlide, selectedSlideIndex]);

  useEffect(() => {
    return () => {
      if (typeof window === "undefined") return;
      if (scrollRafRef.current === null) return;
      window.cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = null;
    };
  }, []);

  const renderSolutionCard = (
    option: SolutionOptionCard,
    className: string,
    isCarouselSlide = false,
  ) => {
    const isSelected = formData.solution === option.value;
    const highlightedButtonClass =
      "border-[#0E79B2] bg-[#0E79B2] text-white group-hover:bg-[#0C6798]";
    const neutralButtonClass =
      "border-slate-300 bg-white text-slate-900 group-hover:border-[#0E79B2] group-hover:bg-[#0E79B2] group-hover:text-white";
    const buttonToneClassName = isSelected
      ? highlightedButtonClass
      : neutralButtonClass;

    return (
      <button
        key={option.value}
        type="button"
        onClick={() => {
          onUpdateField("solution", option.value);
          onNext();
        }}
        data-solution-slide={isCarouselSlide ? "true" : undefined}
        className={`group relative flex h-full min-h-80 cursor-pointer select-none flex-col rounded-2xl border border-[#E2E8F0] bg-white p-5 text-left shadow-sm transition-[transform,box-shadow,border-color,background-color] duration-200 active:scale-[0.99] hover:-translate-y-0.5 hover:border-[#0E79B2]/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0E79B2]/30 ${className}`}
        aria-pressed={isSelected}
      >
        <div className="flex w-full justify-center lg:min-h-8 lg:items-start">
          <p className="pb-2 text-center text-3xl font-extrabold leading-snug text-[#1F2937] sm:text-4xl">
            {option.title}
          </p>
        </div>

        <div className="mt-2 lg:flex lg:min-h-8 lg:items-start">
          <p className="w-full text-center text-xs leading-relaxed text-slate-600">
            {option.subtitle}
          </p>
        </div>

        <ul className="mt-3 flex-1 space-y-1 lg:grid lg:grid-rows-3 lg:gap-1 lg:space-y-0">
          {option.benefits.map((benefit) => (
            <li
              key={benefit}
              className="flex items-start gap-2.5 text-sm leading-5 text-slate-700 lg:h-full lg:min-h-12"
            >
              <span
                className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EAF4FB] text-[#0E79B2]"
                aria-hidden="true"
              >
                <Check className="h-3 w-3" />
              </span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 pt-4">
          <div className="mx-auto mb-4 h-px w-2/3 bg-slate-200" />
          <div className="flex justify-center">
            <span
              className={`inline-flex min-h-10 items-center justify-center rounded-xl border px-5 py-2 text-sm font-semibold transition-colors ${buttonToneClassName}`}
            >
              {isSelected ? "Selected" : "This is for me"}
            </span>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-center text-2xl font-black tracking-tight text-[#1F2937] sm:text-3xl">
        Hi {firstName}, what kind of help would you need for your home?
      </h3>

      <div className="lg:hidden">
        <div
          ref={carouselRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-[5%] pb-1 scroll-px-[5%] scroll-smooth sm:px-[7%] sm:scroll-px-[7%] md:px-[11%] md:scroll-px-[11%] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          onScroll={handleCarouselScroll}
          aria-label="Solution options carousel"
        >
          {mobileSolutionCards.map((option) =>
            renderSolutionCard(
              option,
              "w-[90%] shrink-0 snap-center snap-always sm:w-[86%] md:w-[78%]",
              true,
            ),
          )}
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5">
          {mobileSolutionCards.map((option, index) => (
            <button
              key={`${option.value}-dot`}
              type="button"
              onClick={() => scrollToSlide(index, "smooth")}
              aria-label={`View ${option.title}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeSlideIndex === index
                  ? "w-4 bg-[#0E79B2]"
                  : "w-1.5 bg-slate-300"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="hidden grid-cols-1 gap-3 lg:grid lg:grid-cols-3 lg:gap-1">
        {SOLUTION_OPTION_CARDS.map((option) =>
          renderSolutionCard(
            option,
            desktopSolutionCardOrderClasses[option.value],
          ),
        )}
      </div>
    </div>
  );
}
