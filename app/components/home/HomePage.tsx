import { useState } from "react";
import CertModal from "../layout/CertModal";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import CaseStudiesSectionClient from "../case-studies/CaseStudiesSectionClient";
import { useHomeTestimonials } from "./hooks/useHomeTestimonials";
import HomeAboutSection from "./sections/HomeAboutSection";
import HomeCtaBannerSection from "./sections/HomeCtaBannerSection";
import HomeFaqSection from "./sections/HomeFaqSection";
import HomeHeroSection from "./sections/HomeHeroSection";
import HomePainPointsSection from "./sections/HomePainPointsSection";
import HomeReasonsAndFeaturesSection from "./sections/HomeReasonsAndFeaturesSection";
import HomeSimpleStepsSection from "./sections/HomeSimpleStepsSection";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import HomeTestimonialsSection from "./sections/HomeTestimonialsSection";
import HomeWhyTrustSection from "./sections/HomeWhyTrustSection";
import type { HomePageProps } from "./types";

export { resetBonusTimerForDebug } from "./hooks/useBonusTimer";

export default function HomePage({
  onPrimaryCtaClick,
  cta,
  scarcity,
}: HomePageProps) {
  const [expandedReason, setExpandedReason] = useState<number | null>(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const testimonials = useHomeTestimonials();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const showTestimonials = testimonials.length > 0;

  return (
    <div className="overflow-x-hidden bg-[#F7FAFC]">
      {showCertModal && <CertModal onClose={() => setShowCertModal(false)} />}

      <HomeHeroSection onPrimaryCtaClick={onPrimaryCtaClick} cta={cta} scarcity={scarcity} />
      <HomePainPointsSection />
      <HomeWhyTrustSection />
      <HomeSimpleStepsSection
        cta={cta}
        scarcity={scarcity}
        onPrimaryCtaClick={onPrimaryCtaClick}
      />
      {/* <CaseStudiesSectionClient /> */}
      {/* {showTestimonials && <HomeTestimonialsSection testimonials={testimonials} />} */}
      <HomeReasonsAndFeaturesSection
        expandedReason={expandedReason}
        onToggleReason={(index) => {
          setExpandedReason((current) => (current === index ? null : index));
        }}
      />
      <HomeAboutSection onOpenCertModal={() => setShowCertModal(true)} />
      <HomeFaqSection />
      <HomeCtaBannerSection
        onPrimaryCtaClick={onPrimaryCtaClick}
        cta={cta}
        scarcity={scarcity}
      />
    </div>
  );
}
