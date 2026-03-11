export default function HtmlContent({ html }: { html: string }) {
  const normalizedHtml = html.trim();

  if (!normalizedHtml) {
    return (
      <p className="text-base leading-relaxed text-slate-600">
        This article does not have content yet.
      </p>
    );
  }

  return (
    <div
      className="space-y-4 text-slate-700 [&_a]:font-semibold [&_a]:text-[#0E79B2] [&_a]:underline [&_a]:decoration-[#0E79B2]/45 [&_a]:underline-offset-2 [&_blockquote]:border-l-4 [&_blockquote]:border-[#BEE9E8] [&_blockquote]:pl-4 [&_blockquote]:text-slate-600 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.95em] [&_h2]:mt-8 [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:leading-tight [&_h2]:text-[#1F2937] [&_h3]:mt-6 [&_h3]:text-2xl [&_h3]:font-bold [&_h3]:leading-tight [&_h3]:text-[#1F2937] [&_li]:leading-relaxed [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_p]:text-base [&_p]:leading-relaxed [&_strong]:font-semibold [&_strong]:text-[#1F2937] [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5"
      dangerouslySetInnerHTML={{ __html: normalizedHtml }}
    />
  );
}
