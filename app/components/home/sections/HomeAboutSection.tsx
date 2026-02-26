/* eslint-disable @next/next/no-img-element */

import { Award, FileCheck } from "lucide-react";

export default function HomeAboutSection({
  onOpenCertModal,
}: {
  onOpenCertModal: () => void;
}) {
  return (
    <section className="py-32 bg-[#2D3748] text-white relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      ></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="w-full lg:w-1/2">
            <div className="relative mx-auto max-w-md">
              <img
                src="/assets/img/About us Assets/Smart casual circle profile picture.png"
                alt="Troy - Founder"
                className="relative rounded-4xl w-full shadow-2xl border border-slate-600/50"
                width={400}
                height={400}
              />

              <div
                className="md:absolute md:-bottom-10 md:-right-10 bg-white text-[#2D3748] p-6 rounded-2xl shadow-xl max-w-xs mx-auto mt-8 md:mt-0 md:mx-0 cursor-pointer hover:scale-105 transition-transform"
                onClick={onOpenCertModal}
              >
                <div className="flex items-center gap-2 mb-2 border-b border-gray-100 pb-2">
                  <Award className="w-6 h-6 text-[#0E79B2]" />
                  <span className="font-bold text-lg">Certified Expert</span>
                </div>
                <ul className="space-y-2 pointer-events-none">
                  <li className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <FileCheck className="w-4 h-4 text-[#2E8B57]" />
                    Security CCTV Solution & Integrator
                  </li>
                  <li className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <FileCheck className="w-4 h-4 text-[#2E8B57]" />
                    Smart Home Access Control Specialist
                  </li>
                  <li className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <FileCheck className="w-4 h-4 text-[#2E8B57]" />
                    Security & Smart Home Maintenance
                  </li>
                  <li className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <FileCheck className="w-4 h-4 text-[#2E8B57]" />
                    System Surveyor
                  </li>
                </ul>
                <div className="text-center mt-3">
                  <span className="text-xs text-[#0E79B2] font-semibold underline">
                    View Certificate
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2">
            <div className="inline-block px-4 py-1 rounded-full border border-[#63B3ED]/30 bg-[#63B3ED]/10 text-[#63B3ED] text-xs font-bold uppercase tracking-widest mb-6">
              Our Mission
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
              Your <span className="text-[#63B3ED] italic">Safe</span> &{" "}
              <span className="text-[#63B3ED] italic">Smart</span> Home, <br />
              Without the Hassle
            </h2>
            <div className="space-y-6 text-slate-300 text-lg leading-relaxed font-light">
              <p>
                Security decisions can feel overwhelming when every product claims
                to be the best. Our role is to turn that noise into a clear plan
                you can trust.
              </p>
              <div className="pl-6 border-l-4 border-[#0E79B2] my-8">
                <p className="text-white text-xl italic font-serif">
                  &quot;You’re trusting us with your home and your peace of mind and I
                  take that personally.&quot;
                </p>
              </div>
              <p>
                Hi I’m <strong>Troy</strong>, founder of Safely Secured Homes. My
                mission is simple: make home safety reliable, privacy-conscious, and
                easy for every member of the family to use.
              </p>
              <p>
                My team and I have helped families and business owners across Luzon
                build practical setups that fit real routines, not generic
                templates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
