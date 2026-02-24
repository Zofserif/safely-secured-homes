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
    <div className="grid gap-4 md:grid-cols-3 mb-8">
      {cards.map((card) => {
        const isFeatured = Boolean(card.featured);
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelect(card.id)}
            className={[
              "relative text-left bg-white border-2 border-slate-300/80 rounded-2xl p-5 shadow-sm transition-all duration-300",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E79B2]/60",
              "hover:-translate-y-1 hover:shadow-lg hover:border-[#0E79B2] hover:ring-2 hover:ring-[#0E79B2]/20",
              isFeatured
                ? "md:scale-[1.04] md:-translate-y-1 border-[#0E79B2]/70 ring-1 ring-[#0E79B2]/20 bg-linear-to-br from-white via-white to-[#EAF4FB]"
                : "",
            ].join(" ")}
          >
            {isFeatured && (
              <span className="pointer-events-none absolute -inset-1 rounded-3xl bg-[#0E79B2]/20 blur-2xl opacity-70" />
            )}
            <div className="relative z-10">
              <h4 className="text-center text-xl font-bold text-slate-800">
                {card.title}
              </h4>
              <div className="mt-3 flex justify-center">
                <span className="inline-flex items-center rounded-full border border-[#0E79B2]/30 bg-[#EAF4FB] px-3 py-1 text-xs font-semibold text-[#0E79B2]">
                  {card.summary}
                </span>
              </div>
              <p className="mt-3 text-xs font-semibold text-[#0E79B2] flex items-center gap-1">
                Click to view details <span aria-hidden="true">→</span>
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
