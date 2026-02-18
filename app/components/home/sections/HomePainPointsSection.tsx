import { motion } from "framer-motion";
import { Activity, MapPin, Moon } from "lucide-react";

export default function HomePainPointsSection() {
  return (
    <section className="py-32 bg-white relative">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-[#2D3748] mb-6">
            Do you worry about your family&apos;s{" "}
            <span className="text-[#0E79B2] underline decoration-4 underline-offset-4">
              safety
            </span>{" "}
            at home?
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Whether you’re at work, stuck in traffic, or out of town, that
            “what if?” never fully goes away.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: MapPin,
              title: "Away But Unsure",
              desc: "Stuck in traffic on EDSA or SLEX? Stop guessing if you locked the gate or if the kids got home safe. Know instantly with a single glance at your phone",
            },
            {
              icon: Moon,
              title: 'The "Silent" Worry',
              desc: "From a toddler sleeping in the other room to elderly parents moving around downstairs. You shouldn't have to constantly patrol your own house to know everyone is okay",
            },
            {
              icon: Activity,
              title: "Always On Alert",
              desc: "You double-check locks and you’re never fully present during family time because safety is always on your mind.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="group p-8 bg-[#F7FAFC] rounded-3xl border border-slate-100 hover:border-[#63B3ED] hover:bg-white hover:shadow-2xl hover:shadow-[#0E79B2]/5 transition-all duration-300"
            >
              <div className="mx-auto w-14 h-14 bg-white rounded-2xl border border-slate-100 flex items-center justify-center mb-6 shadow-sm group-hover:bg-[#0E79B2] group-hover:text-white transition-colors">
                <item.icon className="w-7 h-7 text-[#2D3748] group-hover:text-white" />
              </div>
              <h3 className="font-bold text-xl text-[#2D3748] mb-3">{item.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
