import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export default function UnsubscribeShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F7FAFC] text-[#2D3748]">
      <header className="container mx-auto flex items-center justify-between px-6 pb-6 pt-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/assets/img/Logo/navbar banner.png"
            alt="Safely Secured Homes"
            width={210}
            height={48}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-widest text-slate-500 transition-colors hover:text-[#0E79B2]"
        >
          Back to Home
        </Link>
      </header>

      <main className="container mx-auto px-6 pb-16 pt-8">
        <section className="mx-auto max-w-xl rounded-3xl border border-[#BEE9E8]/70 bg-white p-8 shadow-lg shadow-[#0E79B2]/10">
          <h1 className="text-3xl font-bold text-[#1F2937]">{title}</h1>
          <div className="mt-4 space-y-6">{children}</div>
        </section>
      </main>
    </div>
  );
}
