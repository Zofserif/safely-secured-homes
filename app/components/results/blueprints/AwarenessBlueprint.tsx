import AccordionItem from "../../AccordionItem";
import { RESULTS_CALL_HREF } from "../constants";
import { BulletList, Section } from "./shared";

export default function AwarenessBlueprint() {
  return (
    <>
      <p className="text-sm text-slate-600 pb-1">
        A guard Dog is also asleep at night. When we rely our safety in a
        traditional solution in modern world, we receive an inconsistent
        results. A family&apos;s safety and comfort should stay awake 24/7.
      </p>
      <p className="text-sm text-slate-600">
        <span className="font-semibold text-slate-800">Our Goal:</span> To
        detect threats early, document what happened, and respond faster.
      </p>
      <div className="mt-4 rounded-2xl border border-slate-100 bg-[#F7FAFC] p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-800">
          This is where most homes are weakest:
        </p>
        <p className="mt-1 text-slate-600">
          When something happens last night, nobody is sure what they saw, and
          no evidence. Nobody is there to prevent, detect, and protect until its
          too late.
        </p>
        <p className="mt-1 text-slate-600">
          Don&apos;t make the mistake of most filipino family does. Saka lang gagawa
          ng paraan kapag may nangyari na.
        </p>
      </div>

      <Section
        title="3 Layers of Protection to get Ahead in 99% Filipino Homes"
        titleClassName="text-lg md:text-xl font-bold text-slate-900"
      >
        <div className="space-y-3">
          <AccordionItem title="Awareness (Know what is happening)">
            <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-4 marker:text-[#0E79B2]">
              <li>Motion alerts for entry points</li>
              <li>Clear visibility of gate/front/garage/side paths</li>
            </ul>
          </AccordionItem>

          <AccordionItem title="Evidence (If something happens, you are covered)">
            <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-4 marker:text-[#0E79B2]">
              <li>
                Recorded footage that clearly shows faces/plates (when possible)
              </li>
              <li>
                Reliable storage (not just &quot;I think it recorded&quot;)
              </li>
            </ul>
          </AccordionItem>

          <AccordionItem title="Response (Faster action, less panic)">
            <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-4 marker:text-[#0E79B2]">
              <li>
                Phone notifications that are set up correctly (not spammy)
              </li>
              <li>Family knows what to do when an alert triggers</li>
            </ul>
          </AccordionItem>
        </div>
      </Section>
      <Section
        title="That's why A Smart Safety System is your best Next Step"
        titleClassName="text-lg md:text-xl font-bold text-slate-900"
      >
        <div className="rounded-2xl border border-[#0E79B2]/20 bg-[#EAF4FB] p-4">
          <p className="text-base font-semibold text-slate-800">
            A properly planned CCTV system gives you:
          </p>
          <BulletList
            items={[
              "Early warning before a situation happens (Awareness)",
              "Proof for authorities, barangay reports, or disputes (Evidence)",
              "Confidence when you are away at home (Response)",
            ]}
          />
        </div>
        <div className="rounded-3xl border border-[#0E79B2]/40 bg-[#0E79B2] p-5 text-center text-white shadow-lg shadow-[#0E79B2]/30">
          <p className="mt-2 text-sm font-extrabold text-white/90">
            To achieve 100 Panatag Rating, a complete Home assessment if for you!
          </p>
          <a
            href={RESULTS_CALL_HREF}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-extrabold text-[#0E79B2] shadow-lg transition-transform hover:scale-[1.02]"
          >
            CALL US NOW
          </a>
        </div>
      </Section>
    </>
  );
}
