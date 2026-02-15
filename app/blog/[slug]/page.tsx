import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import EmailAssetsPanel from "../../components/blog/EmailAssetsPanel";
import MarkdownContent from "../../components/blog/MarkdownContent";
import Footer from "../../components/layout/Footer";
import BlogPostingJsonLd from "../../components/seo/BlogPostingJsonLd";
import BreadcrumbJsonLd from "../../components/seo/BreadcrumbJsonLd";
import { getBlogPostBySlug, getBlogSlugs } from "../../lib/blogPosts";
import { ogImageUrl, siteName, siteUrl } from "../../lib/site";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 300;

const formatPublishDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

export const generateStaticParams = async () => {
  const slugs = await getBlogSlugs();
  return slugs.map((slug) => ({ slug }));
};

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Article Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: new URL(`/blog/${post.slug}`, siteUrl),
      siteName,
      type: "article",
      publishedTime: post.publishedAt,
      images: [
        {
          url: ogImageUrl,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [ogImageUrl],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#1F2937]">
      <BlogPostingJsonLd
        slug={post.slug}
        title={post.title}
        description={post.excerpt}
        publishedAt={post.publishedAt}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", item: "/" },
          { name: "Blog", item: "/blog" },
          { name: post.title, item: `/blog/${post.slug}` },
        ]}
      />
      <div className="relative overflow-hidden">
        <div className="absolute -top-32 -right-20 h-[420px] w-[420px] rounded-full bg-[#BEE9E8]/45 blur-3xl opacity-80 pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-16 h-[420px] w-[420px] rounded-full bg-[#63B3ED]/15 blur-3xl opacity-80 pointer-events-none"></div>

        <header className="container mx-auto px-6 pb-6 pt-8">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center">
            <div className="flex">
              <Link
                href="/blog"
                className="text-xs font-semibold uppercase tracking-widest text-slate-500 transition-colors hover:text-[#0E79B2]"
              >
                Back to Blog
              </Link>
            </div>
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
          <div className="mx-auto max-w-5xl">
            <article className="rounded-3xl border border-[#BEE9E8]/70 bg-white/95 p-6 shadow-lg shadow-[#0E79B2]/10 sm:p-8">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>{formatPublishDate(post.publishedAt)}</span>
              </div>

              <h1 className="mt-4 text-3xl font-bold leading-tight text-[#1F2937] sm:text-4xl lg:text-5xl">
                {post.title}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
                {post.excerpt}
              </p>

              <div className="mt-10">
                <MarkdownContent markdown={post.markdownContent} />
              </div>

              <div className="mt-10 rounded-2xl border border-[#BEE9E8]/70 bg-[#F8FAFC] p-4 sm:p-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-[#2D3748]">
                  Serving Metro Manila, Laguna, Quezon, Cavite, Rizal, Batangas
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Explore location-specific home security guides and service
                  details for your area in Luzon.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href="/service-areas/luzon-cctv-installation"
                    className="rounded-full border border-[#0E79B2] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0E79B2] transition-colors hover:bg-[#0E79B2] hover:text-white"
                  >
                    Luzon Hub
                  </Link>
                  <Link
                    href="/service-areas/metro-manila"
                    className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 transition-colors hover:border-[#0E79B2] hover:text-[#0E79B2]"
                  >
                    Metro Manila
                  </Link>
                  <Link
                    href="/service-areas/laguna"
                    className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 transition-colors hover:border-[#0E79B2] hover:text-[#0E79B2]"
                  >
                    Laguna
                  </Link>
                  <Link
                    href="/service-areas/quezon"
                    className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 transition-colors hover:border-[#0E79B2] hover:text-[#0E79B2]"
                  >
                    Quezon
                  </Link>
                  <Link
                    href="/service-areas/cavite"
                    className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 transition-colors hover:border-[#0E79B2] hover:text-[#0E79B2]"
                  >
                    Cavite
                  </Link>
                  <Link
                    href="/service-areas/rizal"
                    className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 transition-colors hover:border-[#0E79B2] hover:text-[#0E79B2]"
                  >
                    Rizal
                  </Link>
                  <Link
                    href="/service-areas/batangas"
                    className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 transition-colors hover:border-[#0E79B2] hover:text-[#0E79B2]"
                  >
                    Batangas
                  </Link>
                </div>
              </div>

              <div className="mt-12">
                <EmailAssetsPanel emailAssets={post.emailAssets} />
              </div>
            </article>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
