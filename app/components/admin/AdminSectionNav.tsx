import Link from "next/link";

const NAV_ITEMS = [
  {
    key: "blog",
    label: "Blog",
    href: "/admin/blog",
  },
  {
    key: "journeys",
    label: "Journeys",
    href: "/admin/journeys",
  },
  {
    key: "subscribers",
    label: "Subscribers",
    href: "/admin/subscribers",
  },
] as const;

export default function AdminSectionNav({
  current,
}: {
  current: (typeof NAV_ITEMS)[number]["key"];
}) {
  return (
    <nav className="mt-6 flex flex-wrap gap-3">
      {NAV_ITEMS.map((item) => {
        const isActive = item.key === current;

        return (
          <Link
            key={item.key}
            href={item.href}
            className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition ${
              isActive
                ? "border-[#0E79B2] bg-[#0E79B2] text-white"
                : "border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
