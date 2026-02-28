import { HeartHandshake, ListChecks, Lock, ShieldUser } from "lucide-react";

export default function HomeWhyTrustSection() {
  return (
    <section className="py-32 bg-[#F7FAFC]">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-[#2D3748]">
            Why families trust us with their home and privacy
          </h2>
        </div>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            {
              icon: ListChecks,
              title: "Only what you need",
              desc: "No upsells. We recommend the minimum setup that solves your worry.",
            },
            {
              icon: Lock,
              title: "Privacy first",
              desc: "We avoid intrusive placement and keep control in your hands.",
            },
            {
              icon: ShieldUser,
              title: "For Filipino Families",
              desc: "Personalized solutions tailored for Filipino families.",
            },
            {
              icon: HeartHandshake,
              title: "We’re here after install",
              desc: "Friendly training and responsive support when you need it.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center p-8 bg-white rounded-3xl shadow-sm border border-transparent hover:border-[#BEE9E8] transition-all"
            >
              <div className="w-20 h-20 bg-[#F7FAFC] rounded-full flex items-center justify-center mb-6 shadow-inner text-[#0E79B2]">
                <item.icon className="w-10 h-10" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-[#2D3748]">{item.title}</h3>
              <p className="text-slate-600 max-w-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
