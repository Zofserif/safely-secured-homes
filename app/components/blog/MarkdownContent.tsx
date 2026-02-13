import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownContent({ markdown }: { markdown: string }) {
  const normalizedMarkdown = markdown.trim();

  if (!normalizedMarkdown) {
    return (
      <p className="text-base leading-relaxed text-slate-600">
        This article does not have content yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h2 className="mt-8 text-3xl font-bold leading-tight text-[#1F2937]">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h2 className="mt-8 text-3xl font-bold leading-tight text-[#1F2937]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-6 text-2xl font-bold leading-tight text-[#1F2937]">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-base leading-relaxed text-slate-700">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-slate-700">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-2 pl-5 text-base leading-relaxed text-slate-700">
              {children}
            </ol>
          ),
          li: ({ children }) => <li>{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[#0E79B2] underline decoration-[#0E79B2]/45 underline-offset-2 transition-colors hover:text-[#0b5e8b]"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-[#1F2937]">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#BEE9E8] pl-4 text-slate-600">
              {children}
            </blockquote>
          ),
        }}
      >
        {normalizedMarkdown}
      </ReactMarkdown>
    </div>
  );
}
