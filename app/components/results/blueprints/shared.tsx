import type { ReactNode } from "react";

export const Section = ({
  title,
  children,
  titleClassName,
}: {
  title: string;
  children: ReactNode;
  titleClassName?: string;
}) => (
  <div className="mt-6">
    <h5
      className={`text-base font-semibold text-slate-800 ${titleClassName ?? ""}`}
    >
      {title}
    </h5>
    <div className="mt-3 space-y-3">{children}</div>
  </div>
);

export const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2">
    {items.map((item) => (
      <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#0E79B2]" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

export const MiniCheck = ({ text }: { text: string }) => (
  <div className="mt-6 rounded-2xl border border-[#0E79B2]/20 bg-[#0E79B2]/5 p-4 text-sm text-slate-700">
    <span className="font-semibold text-[#0E79B2]">Mini-check:</span> {text}
  </div>
);
