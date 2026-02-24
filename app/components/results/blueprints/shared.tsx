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
  <section className="mt-7 first:mt-0">
    <h5
      className={`text-base font-semibold tracking-tight text-slate-900 ${titleClassName ?? ""}`}
    >
      {title}
    </h5>
    <div className="mt-3 space-y-3">{children}</div>
  </section>
);

export const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2.5">
    {items.map((item, index) => (
      <li
        key={`${item}-${index}`}
        className="flex items-start gap-3 text-sm leading-relaxed text-slate-700"
      >
        <span className="mt-1.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0E79B2]/12 text-[11px] font-bold text-[#0E79B2]">
          ✓
        </span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

export const MiniCheck = ({ text }: { text: string }) => (
  <div className="mt-6 rounded-2xl border border-[#0E79B2]/20 bg-[#0E79B2]/6 p-4 text-sm leading-relaxed text-slate-700">
    <span className="font-semibold text-[#0E79B2]">Mini-check:</span> {text}
  </div>
);

export const BlueprintLead = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <p className={`text-sm leading-relaxed text-slate-600 ${className}`}>{children}</p>
);

export const GoalBanner = ({ goal }: { goal: string }) => (
  <div className="mt-3 rounded-2xl border border-[#0E79B2]/20 bg-[#EAF4FB] px-4 py-3">
    <p className="text-sm font-semibold text-slate-800">
      Our Goal:
      <span className="ml-1 font-medium text-slate-700">{goal}</span>
    </p>
  </div>
);

type ChecklistCardAccent = "blue" | "green" | "amber";

const CHECKLIST_ACCENT_STYLES: Record<
  ChecklistCardAccent,
  {
    border: string;
    badge: string;
    marker: string;
  }
> = {
  blue: {
    border: "border-[#0E79B2]/20",
    badge: "bg-[#0E79B2]/10 text-[#0E79B2]",
    marker: "bg-[#0E79B2]/12 text-[#0E79B2]",
  },
  green: {
    border: "border-[#2E8B57]/20",
    badge: "bg-[#2E8B57]/10 text-[#2E8B57]",
    marker: "bg-[#2E8B57]/12 text-[#2E8B57]",
  },
  amber: {
    border: "border-[#FFB300]/25",
    badge: "bg-[#FFB300]/15 text-[#B46B00]",
    marker: "bg-[#FFB300]/20 text-[#9C5D00]",
  },
};

export const ChecklistCard = ({
  title,
  items,
  description,
  badge,
  icon,
  accent = "blue",
}: {
  title: string;
  items: string[];
  description?: string;
  badge?: string;
  icon?: string;
  accent?: ChecklistCardAccent;
}) => {
  const styles = CHECKLIST_ACCENT_STYLES[accent];

  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-sm ${styles.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          {icon && (
            <span className="text-base" aria-hidden="true">
              {icon}
            </span>
          )}
          <h6 className="text-sm font-semibold text-slate-900">{title}</h6>
        </div>
        {badge && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${styles.badge}`}
          >
            {badge}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
      )}

      <ul className="mt-3 space-y-2.5">
        {items.map((item, index) => (
          <li
            key={`${title}-${item}-${index}`}
            className="flex items-start gap-3 text-sm leading-relaxed text-slate-700"
          >
            <span
              className={`mt-1.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${styles.marker}`}
            >
              ✓
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const InfoCallout = ({
  title,
  children,
  tone = "info",
}: {
  title: string;
  children: ReactNode;
  tone?: "info" | "warning";
}) => {
  const style =
    tone === "warning"
      ? "border-[#FFB300]/30 bg-[#FFF7E5]"
      : "border-[#0E79B2]/20 bg-[#F7FAFC]";

  return (
    <div className={`mt-4 rounded-2xl border p-4 text-sm text-slate-700 ${style}`}>
      <p className="font-semibold text-slate-900">{title}</p>
      <div className="mt-1 space-y-1.5 leading-relaxed text-slate-600">
        {children}
      </div>
    </div>
  );
};
