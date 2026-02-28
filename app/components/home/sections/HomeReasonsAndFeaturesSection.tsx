import Link from "next/link";
import {
  HeartHandshake,
  List,
  Shield,
  ShieldCheck,
  Signal,
  Sparkles,
} from "lucide-react";
import ReasonItem from "../../ReasonItem";

export default function HomeReasonsAndFeaturesSection({
  expandedReason,
  onToggleReason,
}: {
  expandedReason: number | null;
  onToggleReason: (index: number) => void;
}) {
  return (
    <div className="grid lg:grid-cols-2">
      <section className="py-24 px-6 lg:px-20 bg-[#2D3748] text-white">
        <h2 className="text-3xl font-bold mb-12">6 Reasons Families Choose Us</h2>
        <div className="space-y-4">
          {[
            {
              title: "Get a Perfect, Personalized Plan",
              desc: "We recognize that every home and family is unique. Our experts take the time to understand your specific needs and lifestyle, then design a custom security and smart home plan just for you.",
            },
            {
              title: "Complete Worry-Free Solutions",
              desc: "From the initial 1-on-1 site visit and consultation to expert installation, ongoing maintenance, and all-day support, we handle everything. We protect homes, not just sell and forget.",
            },
            {
              title: 'Transparent, "No-Surprise" Quotes',
              desc: 'What we quote is what you pay. No hidden cable fees or "extra labor" charges on installation day.',
            },
            {
              title: "Privacy-First Recommendations",
              desc: "We prioritize local control and practical camera placement so your home feels secure, not intrusive.",
            },
            {
              title: "Easy for the whole household",
              desc: "If it’s too hard to use, it’s useless. We set up simple, one-tap dashboards everyone can understand.",
            },
            {
              title: "Direct-to-Human Support",
              desc: "No chatbots. You get a direct line to a specialist who knows your specific home layout.",
            },
          ].map((reason, i) => (
            <ReasonItem
              key={i}
              title={reason.title}
              desc={reason.desc}
              isOpen={expandedReason === i}
              onClick={() => onToggleReason(i)}
            />
          ))}
        </div>
      </section>

      <section className="py-24 px-6 lg:px-20 bg-[#F7FAFC]">
        <h2 className="text-3xl font-bold mb-4 text-[#2D3748]">
          What we <span className="text-[#0E79B2] underline decoration-4">provide</span>
        </h2>
        <p className="text-slate-600 mb-12 text-lg">
          We provide the complete integrated system. From home security to smart home,
          we deliver a seamless experience.
        </p>
        <div className="grid sm:grid-cols-2 gap-6">
          {[
            {
              icon: List,
              title: "Free Design",
              desc: "Custom-tailored system for your layout.",
            },
            {
              icon: Sparkles,
              title: "Premium Products",
              desc: "High-quality CCTV & Smart devices.",
            },
            {
              icon: Signal,
              title: "Smart Integration",
              desc: "Control lights & locks remotely.",
            },
            {
              icon: Shield,
              title: "Pro Monitoring",
              desc: "Smart event filtering & reports.",
            },
            {
              icon: ShieldCheck,
              title: "Protection Plans",
              desc: "1-year warranty & health checks.",
            },
            {
              icon: HeartHandshake,
              title: "Continuous Support",
              desc: "Daily assistance via call/chat.",
            },
          ].map((feat, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-[#0E79B2] transition-colors"
            >
              <feat.icon className="w-8 h-8 text-[#0E79B2] mb-4" />
              <h4 className="font-bold text-[#2D3748] text-lg mb-2">{feat.title}</h4>
              <p className="text-sm text-slate-500">{feat.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-[#BEE9E8]/70 bg-white p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#2D3748]">
            Serving Metro Manila, Laguna, Quezon, Cavite, Rizal, Batangas
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/service-areas/luzon-cctv-installation"
              className="rounded-full border border-[#0E79B2] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0E79B2] transition-colors hover:bg-[#0E79B2] hover:text-white"
            >
              Luzon Hub
            </Link>
            <Link
              href="/service-areas/metro-manila"
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 transition-colors hover:border-[#0E79B2] hover:text-[#0E79B2]"
            >
              Metro Manila
            </Link>
            <Link
              href="/service-areas/laguna"
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 transition-colors hover:border-[#0E79B2] hover:text-[#0E79B2]"
            >
              Laguna
            </Link>
            <Link
              href="/service-areas/quezon"
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 transition-colors hover:border-[#0E79B2] hover:text-[#0E79B2]"
            >
              Quezon
            </Link>
            <Link
              href="/service-areas/cavite"
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 transition-colors hover:border-[#0E79B2] hover:text-[#0E79B2]"
            >
              Cavite
            </Link>
            <Link
              href="/service-areas/rizal"
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 transition-colors hover:border-[#0E79B2] hover:text-[#0E79B2]"
            >
              Rizal
            </Link>
            <Link
              href="/service-areas/batangas"
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 transition-colors hover:border-[#0E79B2] hover:text-[#0E79B2]"
            >
              Batangas
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
