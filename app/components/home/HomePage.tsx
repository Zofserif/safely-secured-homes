import { useState } from "react";
import CertModal from "../layout/CertModal";
import { useBonusEndsAt } from "./hooks/useBonusTimer";
import { useHomeCtaAndScarcity } from "./hooks/useHomeCtaAndScarcity";
import { useHomeDebugControls } from "./hooks/useHomeDebugControls";
import { useHomeTestimonials } from "./hooks/useHomeTestimonials";
import { useSharedClockNowMs } from "./hooks/useSharedClock";
import HomeAboutSection from "./sections/HomeAboutSection";
import HomeCtaBannerSection from "./sections/HomeCtaBannerSection";
import HomeFaqSection from "./sections/HomeFaqSection";
import HomeHeroSection from "./sections/HomeHeroSection";
import HomePainPointsSection from "./sections/HomePainPointsSection";
import HomeReasonsAndFeaturesSection from "./sections/HomeReasonsAndFeaturesSection";
import HomeSimpleStepsSection from "./sections/HomeSimpleStepsSection";
import HomeTestimonialsSection from "./sections/HomeTestimonialsSection";
import HomeWhyTrustSection from "./sections/HomeWhyTrustSection";
import type { HomePageProps } from "./types";

export { resetBonusTimerForDebug } from "./hooks/useBonusTimer";

export default function HomePage({
  onNavigate,
  reportsRemaining,
  reportsLoading,
  reportsError,
  hasExistingPlan,
}: HomePageProps) {
  const [expandedReason, setExpandedReason] = useState<number | null>(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const nowMs = useSharedClockNowMs();
  const bonusEndsAt = useBonusEndsAt();
  const testimonials = useHomeTestimonials();
  const showTestimonials = false;

  const {
    effectiveReportsRemaining,
    effectiveReportsLoading,
    effectiveReportsError,
  } = useHomeDebugControls({
    reportsRemaining,
    reportsLoading,
    reportsError,
  });

  const { cta, scarcity } = useHomeCtaAndScarcity({
    reportsRemaining: effectiveReportsRemaining,
    reportsLoading: effectiveReportsLoading,
    reportsError: effectiveReportsError,
    hasExistingPlan,
    nowMs,
    bonusEndsAt,
  });

  return (
    <div className="overflow-x-hidden bg-[#F7FAFC]">
      {showCertModal && <CertModal onClose={() => setShowCertModal(false)} />}

      <HomeHeroSection onNavigate={onNavigate} cta={cta} scarcity={scarcity} />
      <HomePainPointsSection />
      {showTestimonials && <HomeTestimonialsSection testimonials={testimonials} />}
      <HomeAboutSection onOpenCertModal={() => setShowCertModal(true)} />
      <HomeWhyTrustSection />
      <HomeSimpleStepsSection />
      <HomeReasonsAndFeaturesSection
        expandedReason={expandedReason}
        onToggleReason={(index) => {
          setExpandedReason((current) => (current === index ? null : index));
        }}
      />
      <HomeFaqSection />
      <HomeCtaBannerSection onNavigate={onNavigate} cta={cta} scarcity={scarcity} />
    </div>
  );
}
