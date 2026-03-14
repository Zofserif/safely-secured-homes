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
      className="text-slate-700 [&_a]:font-semibold [&_a]:text-[#0E79B2] [&_a]:underline [&_a]:decoration-[#0E79B2]/45 [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.95em] [&_strong]:font-semibold [&_strong]:text-[#1F2937]"
      dangerouslySetInnerHTML={{ __html: normalizedHtml }}
    />
  );
}
