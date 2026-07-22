"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { cn } from "@/lib/utils";

/**
 * Strip marker-only lines (a bare "*", "-", "+", "•", or "1.") that LLMs emit
 * as pseudo-separators between sections. Left in, react-markdown renders them as
 * empty bullets/numbers floating with no text next to them.
 */
function stripEmptyListMarkers(md: string): string {
  return md
    .split("\n")
    .filter((line) => !/^\s*(?:[-*+•]|\d+[.)])\s*$/.test(line))
    .join("\n");
}

// A whole line that is a single emphasis span, e.g. "**term**" or "*term*".
const isStandaloneEmphasis = (l: string) => {
  const t = l.trim();
  return (
    /^\*\*[^*]+\*\*$/.test(t) ||
    /^__[^_]+__$/.test(t) ||
    /^\*[^*]+\*$/.test(t) ||
    /^_[^_]+_$/.test(t)
  );
};

const isStructuralLine = (l: string) =>
  /^\s{0,3}(#{1,6}\s|>|[-*+]\s|\d+[.)]\s|\|)/.test(l) ||
  /^\s{0,3}([-_*]\s?){3,}\s*$/.test(l);

/**
 * Un-fragment sentences that remark-breaks would otherwise shatter. LLMs love
 * putting each bold key-term on its own line, which strands the continuing
 * punctuation ("," / ".") and the bold spans on separate lines. This reattaches:
 *   - lines that START with sentence punctuation → glued to the previous text
 *     line with no space (even across blank lines);
 *   - a bold/italic-only line sitting directly under a text line → inlined with
 *     a space (adjacency only, so blank-separated bold subheadings survive).
 * Code fences are left untouched.
 */
function unwrapInlineFragments(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inCode = false;

  for (const raw of lines) {
    if (/^\s*```/.test(raw)) {
      inCode = !inCode;
      out.push(raw);
      continue;
    }
    if (inCode) {
      out.push(raw);
      continue;
    }

    const trimmed = raw.trim();

    // Stranded continuation punctuation → reattach to the nearest text line.
    if (trimmed !== "" && /^\s*[,.;:!?)](\s|$)/.test(raw)) {
      let i = out.length - 1;
      while (i >= 0 && out[i].trim() === "") i--;
      if (i >= 0 && !isStructuralLine(out[i])) {
        out.length = i + 1;
        out[i] = out[i].replace(/\s+$/, "") + trimmed;
        continue;
      }
    }

    // Bold/italic term placed on its own line directly under text → inline it.
    const prev = out.length ? out[out.length - 1] : null;
    if (
      trimmed !== "" &&
      isStandaloneEmphasis(raw) &&
      prev !== null &&
      prev.trim() !== "" &&
      !isStructuralLine(prev) &&
      !isStandaloneEmphasis(prev)
    ) {
      out[out.length - 1] = prev.replace(/\s+$/, "") + " " + trimmed;
      continue;
    }

    out.push(raw);
  }

  return out.join("\n");
}

/**
 * AnswerMarkdown — the rendering layer for grounded AI answers.
 *
 * Goal: Claude / Perplexity-level readability on the Onyx + Paper theme.
 * - remark-gfm  → real lists, tables, task lists, autolinks, strikethrough
 * - remark-breaks → single newlines become line breaks (LLMs lean on them)
 * Every element is themed with tokens (vermillion --primary as the one accent),
 * a comfortable reading measure, and a consistent vertical rhythm.
 */
export function AnswerMarkdown({ children }: { children: string }) {
  const cleaned = unwrapInlineFragments(stripEmptyListMarkers(children));
  return (
    <div
      className={cn(
        "max-w-[68ch] text-[14.5px] leading-[1.75] text-foreground/90",
        // consistent rhythm: no top margin on the first block, none on the last
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          // --- Headings ---------------------------------------------------
          h1: ({ children }) => (
            <h1 className="mt-6 mb-3 font-display text-[19px] font-semibold tracking-tight text-foreground">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-6 mb-2.5 font-display text-[17px] font-semibold tracking-tight text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-5 mb-2 font-display text-[15px] font-semibold tracking-tight text-foreground">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-4 mb-1.5 text-[14px] font-semibold text-foreground">{children}</h4>
          ),

          // --- Text -------------------------------------------------------
          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          del: ({ children }) => (
            <del className="text-muted-foreground line-through">{children}</del>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline decoration-primary/40 underline-offset-2 transition-colors hover:decoration-primary"
            >
              {children}
            </a>
          ),

          // --- Lists (hanging indent so wrapped lines align under the text)
          ul: ({ children }) => (
            <ul className="mb-4 ml-1 list-disc space-y-1.5 pl-4 marker:text-primary/70">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-1 list-decimal space-y-1.5 pl-4 marker:font-mono marker:text-muted-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1 leading-[1.7]">{children}</li>,

          // --- Blockquote -------------------------------------------------
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-2 border-primary/40 pl-4 text-muted-foreground italic">
              {children}
            </blockquote>
          ),

          // --- Code -------------------------------------------------------
          pre: ({ children }) => (
            <pre className="my-4 overflow-x-auto rounded-xl border border-border bg-secondary/60 p-4 text-[13px] leading-relaxed">
              {children}
            </pre>
          ),
          code: ({ className, children }) => {
            const text = String(children);
            const isBlock = /language-/.test(className || "") || text.includes("\n");
            if (isBlock) {
              // inside <pre>; let the block own the surface
              return <code className={cn("font-mono text-foreground/90", className)}>{children}</code>;
            }
            return (
              <code className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[13px] text-primary">
                {children}
              </code>
            );
          },

          // --- Rule -------------------------------------------------------
          hr: () => <hr className="my-6 border-border" />,

          // --- Tables (GFM) ----------------------------------------------
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-border">
              <table className="w-full border-collapse text-[13.5px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-secondary/60">{children}</thead>,
          th: ({ children }) => (
            <th className="border-b border-border px-3 py-2 text-left font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-border px-3 py-2 align-top text-foreground/85">
              {children}
            </td>
          ),
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}
