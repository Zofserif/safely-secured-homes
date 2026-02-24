import { X } from "lucide-react";
import type { BlueprintCard } from "../types";

type BlueprintModalProps = {
  activeBlueprint: BlueprintCard | null;
  onClose: () => void;
  isCompleted: boolean;
  onToggleComplete: () => void;
};

export default function BlueprintModal({
  activeBlueprint,
  onClose,
  isCompleted,
  onToggleComplete,
}: BlueprintModalProps) {
  if (!activeBlueprint) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-md"
        aria-label="Close blueprint details"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.6)] ring-1 ring-slate-200"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/20 p-2 text-white shadow-sm backdrop-blur hover:bg-white/30"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="bg-linear-to-r from-[#0E79B2] via-[#1B8CCB] to-[#0E79B2] px-6 py-5 text-white">
          <h4 className=" text-2xl font-bold">{activeBlueprint.title}</h4>
        </div>
        <div className="max-h-[70vh] overflow-y-auto bg-white px-6 py-4">
          {activeBlueprint.content}
        </div>
        <div className="border-t border-slate-200 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onToggleComplete}
            className={[
              "w-full rounded-xl px-4 py-3 text-sm font-bold transition-colors",
              isCompleted
                ? "border border-[#0E79B2]/30 bg-white text-[#0E79B2] hover:bg-[#F7FAFC]"
                : "bg-[#0E79B2] text-white hover:bg-[#0b5e8b]",
            ].join(" ")}
          >
            {isCompleted ? "Mark as Incomplete" : "Mark as Complete"}
          </button>
        </div>
      </div>
    </div>
  );
}
