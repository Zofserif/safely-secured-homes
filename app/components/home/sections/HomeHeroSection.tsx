/* eslint-disable react/no-unescaped-entities */

import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight, Gift, ShieldCheck } from "lucide-react";
import type { HomeCtaState, HomeScarcityState } from "../types";

export default function HomeHeroSection({
  onNavigate,
  cta,
  scarcity,
}: {
  onNavigate: (p: string) => void;
  cta: HomeCtaState;
  scarcity: HomeScarcityState;
}) {
  return (
    <section className="relative pt-4 pb-10 sm:pt-6 sm:pb-14 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
      <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[800px] h-[800px] bg-[#BEE9E8]/40 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[600px] h-[600px] bg-[#BEE9E8]/30 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

      <div className="container mx-auto grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="block relative lg:order-last"
        >
          <div className="absolute inset-0 bg-linear-to-tr from-[#2D3748]/10 to-transparent rounded-4xl transform rotate-3 lg:rotate-6 scale-105 z-0"></div>
          <div className="relative rounded-4xl overflow-hidden shadow-2xl border-4 border-white z-10 h-40 sm:h-52 lg:h-[600px]">
            <Image
              src="/assets/img/Hero/pexels-vlada-karpovich-4609033.jpg"
              alt="Happy Family in Secure Home"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-4 lg:p-8">
              <div className="flex items-center gap-2 text-white/90 font-medium text-sm">
                <ShieldCheck className="w-4 h-4 text-[#2E8B57]" /> 100% Secure &
                Private
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 bg-white border border-[#BEE9E8] rounded-full px-4 py-1.5 mb-6 lg:mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#2E8B57] animate-pulse"></span>
            <span className="text-[#2D3748] font-semibold text-xs uppercase tracking-wide">
              For Families Who Want Protection Without Losing Comfort
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-7xl font-bold text-[#2D3748] mb-4 sm:mb-6 lg:mb-8 leading-[1.1] tracking-tight">
            A Panatag Family's
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#2D3748] via-[#0E79B2] to-[#2D3748] decoration-[#0E79B2] decoration-4 underline underline-offset-4">
              Safe and Smart Plan
            </span>
            <span className="text-[#0E79B2] font-serif italic"> Today</span>
          </h1>

          <p className="text-slate-600 text-base sm:text-lg lg:text-xl leading-relaxed mb-3 sm:mb-4 lg:mb-5 max-w-xl">
            In 60 seconds, get a <strong>FREE home security plan</strong> so you
            know your family is safe, even when you’re away. Designed for Filipino
            homes: check on your kids, your entrance, or your whole house without
            sacrificing comfort.
          </p>
          <p className="text-slate-500 text-sm sm:text-base lg:text-base italic leading-relaxed mb-6 sm:mb-8 lg:mb-10 max-w-xl">
            If your plan doesn’t fit your home, message or call us within 7 days
            and we’ll revise it for free until it’s clear and practical for your
            layout. Privacy-first: We won’t recommend placements that make your
            family feel watched or uncomfortable.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-stretch">
            <div className="flex flex-col gap-2 w-full sm:flex-3">
              <button
                onClick={() => onNavigate(cta.target)}
                disabled={cta.disabled}
                className="bg-[#0E79B2] hover:bg-[#0b5e8b] text-white text-xl px-10 py-5 rounded-2xl font-extrabold shadow-xl shadow-[#0E79B2]/25 transition-all hover:-translate-y-1 hover:shadow-2xl flex items-center justify-center gap-3 group w-full h-full disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {cta.label}
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
              {scarcity.show && (
                <div className="flex items-start gap-2 text-xs sm:text-sm justify-center text-slate-600">
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
                        All 15 reports are claimed. Report will refresh in:{" "}
                        {scarcity.countdownLabel}.
                      </>
                    )}
                    {!scarcity.loading && !scarcity.error && !scarcity.soldOut && (
                      <>
                        Only {scarcity.reportsRemaining}/15 Plan remaining until
                        {scarcity.countdownLabel}
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>

            {!scarcity.bonusExpired && scarcity.show && !scarcity.soldOut && (
              <div className="w-full sm:flex-2 flex flex-col items-start">
                <div className="relative flex items-center gap-3 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl border border-[#BEE9E8] shadow-xl animate-bounce-slow w-full sm:h-[68px] sm:self-start">
                  <div className="bg-[#BEE9E8]/60 p-1 rounded-xl text-[#0E79B2]">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-[clamp(8px,0.7vw,10px)] font-extrabold text-[#0E79B2] uppercase tracking-normal leading-none">
                      Free Bonus Included
                    </p>
                    <p className="text-[clamp(10px,0.85vw,12px)] font-extrabold text-[#2D3748] leading-snug">
                      5 Home Security Must-Have Secrets you can do Today!
                    </p>
                  </div>
                </div>
                <div className="mt-2 inline-flex items-center gap-2 bg-white/90 text-[#2D3748] text-[clamp(8px,0.7vw,10px)] font-semibold px-2.5 py-1 rounded-full shadow-lg border border-[#BEE9E8] backdrop-blur-sm self-center">
                  <span
                    className="h-2 w-2 rounded-full bg-[#E53E3E] animate-pulse"
                    aria-hidden="true"
                  ></span>
                  <span className="uppercase tracking-normal text-[#0E79B2]">
                    {scarcity.bonusEndsAt === null
                      ? "Loading bonus timer..."
                      : `Bonus expires in ${scarcity.bonusCountdown}`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="container mx-auto mt-12 lg:mt-16 pt-10 border-t border-slate-200">
        <div className="flex flex-wrap justify-center gap-4 lg:gap-16 opacity-80 hover:opacity-100 transition-all duration-500">
          {[
            "Peace of Mind, Anywhere",
            "A Safer, Happier Family Home",
            "Modern Convenience Without Stress",
          ].map((text, i) => (
            <div
              key={i}
              className="flex items-center gap-3 font-semibold text-[#2D3748] text-sm lg:text-base"
            >
              <div className="bg-[#2E8B57]/10 p-1 rounded-full">
                <CheckCircle2 className="text-[#2E8B57] w-4 h-4 lg:w-5 lg:h-5" />
              </div>
              {text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
