import type { BlogPostEmailBucket } from "../../lib/blogPosts";

const joinClassNames = (...values: Array<string | undefined>) =>
  values.filter(Boolean).join(" ");

export default function EmailBucketBadges({
  buckets,
  className,
}: {
  buckets: BlogPostEmailBucket[];
  className?: string;
}) {
  if (buckets.length === 0) return null;

  return (
    <div className={joinClassNames("flex flex-wrap gap-2", className)}>
      {buckets.map((bucket) => (
        <span
          key={bucket.key}
          className="inline-flex items-center rounded-full border border-[#0E79B2]/20 bg-[#E8F5FB] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#0B5E8B]"
        >
          {bucket.name}
        </span>
      ))}
    </div>
  );
}
