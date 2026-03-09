import { ArrowRight } from "lucide-react";
import type { BlueprintCard } from "../types";

type BlueprintCardsGridProps = {
  cards: BlueprintCard[];
  onSelect: (id: BlueprintCard["id"]) => void;
};

export default function BlueprintCardsGrid({
  cards,
  onSelect,
}: BlueprintCardsGridProps) {
  return (
    <div className="mb-2 grid gap-3 md:grid-cols-3 md:gap-4">
      {cards.map((card) => {
        const isFeatured = Boolean(card.featured);
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelect(card.id)}
            className={[
              "group relative cursor-pointer rounded-2xl border border-[#D1E4F2] bg-linear-to-br from-white via-white to-[#F4F9FE] p-4 text-left shadow-[0_18px_34px_-28px_rgba(17,86,127,0.5)] transition-all duration-300 ease-out active:scale-[0.99] sm:p-5",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E79B2]/60",
              "hover:-translate-y-1 hover:border-[#0E79B2]/70 hover:shadow-[0_24px_40px_-26px_rgba(14,121,178,0.55)] hover:ring-2 hover:ring-[#0E79B2]/15",
              isFeatured
                ? "border-[#0E79B2]/55 ring-1 ring-[#0E79B2]/25 bg-linear-to-br from-white via-[#F8FCFF] to-[#EAF4FB] md:scale-[1.02]"
                : "",
            ].join(" ")}
          >
            {isFeatured && (
              <span className="pointer-events-none absolute -inset-1 rounded-3xl bg-[#0E79B2]/15 blur-2xl opacity-70" />
            )}
            <div className="relative z-10">
              <h4 className="text-center text-lg font-bold text-[#112D40] sm:text-xl">
                {card.title}
              </h4>
              <p className="mt-2 text-center text-sm font-medium text-slate-600">
                {card.summary}
              </p>
              <div className="mt-3 flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#0E79B2]/45 bg-white px-3 py-1.5 text-xs font-bold text-[#0E79B2] transition-all group-hover:border-[#0E79B2] group-hover:bg-[#EAF4FB]">
                  Open Insight
                  <ArrowRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
