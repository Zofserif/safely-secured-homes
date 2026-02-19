import { X } from "lucide-react";
import type { BlueprintCard } from "../types";

type BlueprintModalProps = {
  activeBlueprint: BlueprintCard | null;
  onClose: () => void;
};

export default function BlueprintModal({
  activeBlueprint,
  onClose,
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
          <p className="text-xs uppercase tracking-[0.2em] text-white/70">
            Your Home Safety Blueprint
          </p>
          <h4 className="mt-2 text-2xl font-bold">{activeBlueprint.title}</h4>
        </div>
        <div className="max-h-[70vh] overflow-y-auto bg-white px-6 py-6">
          <div className="mt-5">{activeBlueprint.content}</div>
        </div>
      </div>
    </div>
  );
}
