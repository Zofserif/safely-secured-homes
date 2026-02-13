import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import BlogPostCard from "../components/blog/BlogPostCard";
import Footer from "../components/layout/Footer";
import { getBlogPosts } from "../lib/blogPosts";
import { ogImageUrl, siteName, siteUrl } from "../lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: `Blog | ${siteName}`,
  description:
    "Practical home security insights, newsletter-style guides, and copy-ready email campaign assets from Safely Secured Homes.",
  openGraph: {
    title: `Blog | ${siteName}`,
    description:
      "Practical home security insights, newsletter-style guides, and copy-ready email campaign assets from Safely Secured Homes.",
    url: new URL("/blog", siteUrl),
    siteName,
    type: "website",
    images: [
      {
        url: ogImageUrl,
        width: 1260,
        height: 750,
        alt: "Safely Secured Homes blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Blog | ${siteName}`,
    description:
      "Practical home security insights, newsletter-style guides, and copy-ready email campaign assets from Safely Secured Homes.",
    images: [ogImageUrl],
  },
};

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#1F2937]">
      <div className="relative overflow-hidden">
        <div className="absolute -top-32 -right-20 h-[420px] w-[420px] rounded-full bg-[#BEE9E8]/45 blur-3xl opacity-80 pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-16 h-[420px] w-[420px] rounded-full bg-[#63B3ED]/15 blur-3xl opacity-80 pointer-events-none"></div>
        <div className="absolute top-24 left-1/2 h-[720px] w-[720px] -translate-x-1/2 rounded-full bg-[#0E79B2]/10 blur-3xl opacity-60 pointer-events-none"></div>

        <header className="container mx-auto px-6 pb-6 pt-8">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center">
            <div className="hidden sm:block"></div>
            <Link href="/" className="flex justify-center">
              <Image
                src="/assets/img/Logo/navbar banner.png"
                alt="Safely Secured Homes"
                width={210}
                height={48}
                className="h-9 w-auto object-contain"
                priority
              />
            </Link>
            <div className="flex justify-end">
              <Link
                href="/newsletter"
                className="text-xs font-semibold uppercase tracking-widest text-slate-500 transition-colors hover:text-[#0E79B2]"
              >
                Join Newsletter
              </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 pb-16 lg:pb-24">
          <section className="max-w-3xl">
            <h1 className="text-4xl font-bold leading-tight text-[#1F2937] sm:text-5xl lg:text-6xl">
              Newsletter Blog
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Security articles designed to be useful in two ways: practical
              reading for families and ready-to-use content blocks for email
              marketing campaigns.
            </p>
          </section>

          {posts.length > 0 ? (
            <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <BlogPostCard key={post.slug} post={post} />
              ))}
            </section>
          ) : (
            <section className="mt-10 max-w-3xl rounded-3xl border border-[#BEE9E8]/70 bg-white/95 p-8 text-center shadow-lg shadow-[#0E79B2]/10">
              <h2 className="text-2xl font-bold text-[#1F2937]">
                No blog posts published yet
              </h2>
              <p className="mt-3 text-slate-600">
                Add rows to your Supabase <code>blog_posts</code> table and
                they will appear here automatically.
              </p>
            </section>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
