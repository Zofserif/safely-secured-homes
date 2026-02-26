/* eslint-disable @next/next/no-img-element */

import type { HomeCtaState } from "../types";

export default function HomeSimpleStepsSection({
  cta,
  onPrimaryCtaClick,
}: {
  cta: HomeCtaState;
  onPrimaryCtaClick: (
    target: HomeCtaState["target"],
    location: "midpage_primary"
  ) => void;
}) {
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
        <div className="mt-14 mx-auto max-w-xl rounded-3xl border border-[#BEE9E8] bg-[#F7FAFC] p-8 shadow-sm">
          <p className="text-sm uppercase tracking-wide font-semibold text-[#0E79B2] mb-3">
            Ready to see your plan?
          </p>
          <p className="text-slate-600 mb-6">
            Start now and get your free recommendation in about 60 seconds, made
            for your home and family routine.
          </p>
          <button
            onClick={() => onPrimaryCtaClick(cta.target, "midpage_primary")}
            disabled={cta.disabled}
            className="w-full bg-[#0E79B2] hover:bg-[#0b5e8b] text-white py-4 rounded-2xl font-bold shadow-lg shadow-[#0E79B2]/20 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {cta.label}
          </button>
        </div>
      </div>
    </section>
  );
}
