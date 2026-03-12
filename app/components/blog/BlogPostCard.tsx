import Link from "next/link";
import EmailBucketBadges from "./EmailBucketBadges";
import type { BlogPost } from "../../lib/blogPosts";

const formatPublishDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-[#BEE9E8]/70 bg-white/95 shadow-lg shadow-[#0E79B2]/10 transition-transform duration-300 hover:-translate-y-1">
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>{formatPublishDate(post.publishedAt || post.createdAt)}</span>
        </div>

        <EmailBucketBadges buckets={post.emailBuckets} className="mt-3" />

        <h2 className="mt-3 text-xl font-bold leading-snug text-[#1F2937]">
          <Link
            href={`/blog/${post.slug}`}
            className="transition-colors hover:text-[#0E79B2]"
          >
            {post.title}
          </Link>
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-slate-600">{post.previewText}</p>

        <Link
          href={`/blog/${post.slug}`}
          className="mt-5 inline-flex items-center text-sm font-semibold text-[#0E79B2] transition-colors hover:text-[#0b5e8b]"
        >
          Read article
          <span className="ml-1" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}
