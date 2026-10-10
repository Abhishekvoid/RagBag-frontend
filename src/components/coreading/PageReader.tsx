"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import axios from "axios";
import { notebookApi } from "@/features/notebook/notebook.api";
import type { DocumentPageDTO } from "@/features/notebook/notebook.schema";
import { ReaderPane } from "./ReaderPane";
import { cn } from "@/lib/utils";

const MARKER = /(\[\?[^\]]*\])/g;

interface PageReaderProps {
  docId: string;
  chapterId: string;
  fallbackText: string; // flat canonical text, for non-PDF / pre-migration docs
  citation?: { page: number; version: number };
}

/**
 * Paginated reader for vision-reconstructed documents. Shows each page's clean
 * markdown; `[?word]` markers (words the model was unsure of) are tappable and
 * reveal the original page scan so the reader can verify against it.
 */
export function PageReader({ docId, chapterId, fallbackText, citation }: PageReaderProps) {
  const [pages, setPages] = useState<DocumentPageDTO[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let alive = true;
    setPages(null);
    setErr(null);
    notebookApi
      .fetchDocumentPages(docId, citation?.version)
      .then((p) => alive && setPages(p))
      .catch((error) => {
        if (alive) setErr(axios.isAxiosError(error) && error.response?.status === 409
          ? "This source has changed since the answer was written. Ask again for an updated citation."
          : "Couldn't load this source. Please reload to try again.");
      });
    return () => {
      alive = false;
    };
  }, [docId, citation?.version]);

  useEffect(() => {
    if (pages && citation) {
      const target = ref.current?.querySelector<HTMLElement>(`[data-page="${citation.page}"]`);
      target?.scrollIntoView({ block: "start", behavior: "instant" });
      target?.focus({ preventScroll: true });
    }
  }, [pages, citation?.page]);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? Math.min(1, el.scrollTop / max) : 0);
  }, []);

  if (err || (pages && citation && !pages.some((p) => p.page_number === citation.page))) {
    return <p role="alert" className="px-6 py-8 text-sm text-foreground">
      {err ?? "This cited page is unavailable. Ask again for an updated citation."}
    </p>;
  }
  // Only genuinely unpaginated documents use the flat reader.
  if (pages && pages.length === 0) {
    return <ReaderPane chapterId={chapterId} docId={docId} rawText={fallbackText} />;
  }
  if (!pages) return <PageSkeleton />;

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      className="relative h-full overflow-y-auto scroll-smooth px-6 py-8 md:px-10 lg:px-14"
    >
      <div className="pointer-events-none sticky top-0 z-20 -mx-6 -mt-8 h-[2px] md:-mx-10 lg:-mx-14">
        <div
          className="h-full bg-primary/60 transition-[width] duration-150"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      {pages.map((p) => (
        <Page key={p.page_number} page={p} cited={citation?.page === p.page_number} />
      ))}
    </div>
  );
}

function Page({ page, cited }: { page: DocumentPageDTO; cited: boolean }) {
  const [showScan, setShowScan] = useState(cited);
  return (
    <section data-page={page.page_number} tabIndex={-1} aria-label={`Page ${page.page_number}`}
      className="mx-auto mb-12 max-w-[68ch] focus-visible:outline-2 focus-visible:outline-primary">
      <div className="mb-3 flex items-center justify-between border-b border-border/60 pb-2">
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Page {page.page_number}
        </span>
        {page.image_url && (
          <button
            type="button"
            onClick={() => setShowScan((v) => !v)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ImageIcon size={13} /> {showScan ? "Hide scan" : "View scan"}
          </button>
        )}
      </div>

      {showScan && page.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={page.image_url}
          alt={`Original scan of page ${page.page_number}`}
          className="mb-4 w-full rounded-lg border border-border"
        />
      )}

      <PageMarkdown md={page.reconstructed_md} onMarker={() => setShowScan(true)} />
    </section>
  );
}

// Minimal markdown: headings (# .. ######), bullets (dash, star, or •), and
// blank-line paragraphs — the entire subset the vision model emits.
function PageMarkdown({ md, onMarker }: { md: string; onMarker: () => void }) {
  const blocks: React.ReactNode[] = [];
  let para: string[] = [];

  const flush = () => {
    if (!para.length) return;
    blocks.push(
      <p key={blocks.length} className="mb-4 text-[16.5px] leading-[1.85] text-foreground/90">
        <Inline text={para.join(" ")} onMarker={onMarker} />
      </p>,
    );
    para = [];
  };

  for (const raw of md.split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flush();
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)/);
    const b = line.match(/^\s*[-*•]\s+(.*)/);
    if (h) {
      flush();
      blocks.push(
        <p
          key={blocks.length}
          className={cn(
            "mb-3 mt-5 font-display font-semibold tracking-tight",
            h[1].length <= 2 ? "text-[20px]" : "text-[16.5px]",
          )}
        >
          <Inline text={h[2]} onMarker={onMarker} />
        </p>,
      );
    } else if (b) {
      flush();
      blocks.push(
        <p key={blocks.length} className="mb-1.5 flex gap-2 text-[16.5px] leading-[1.75] text-foreground/90">
          <span className="select-none text-primary">•</span>
          <span>
            <Inline text={b[1]} onMarker={onMarker} />
          </span>
        </p>,
      );
    } else {
      para.push(line);
    }
  }
  flush();
  return <>{blocks}</>;
}

/** Split a line on `[?word]` markers, rendering each as a tappable, dotted-underline span. */
function Inline({ text, onMarker }: { text: string; onMarker: () => void }) {
  return (
    <>
      {text.split(MARKER).map((part, i) => {
        if (part.startsWith("[?") && part.endsWith("]")) {
          const word = part.slice(2, -1) || "illegible";
          return (
            <button
              key={i}
              type="button"
              onClick={onMarker}
              title="Unsure reading — tap to check the original scan"
              className="rounded-sm text-primary underline decoration-dotted decoration-primary/70 underline-offset-2 transition-colors hover:bg-primary/10"
            >
              {word}
            </button>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-[68ch] space-y-3 px-6 py-10 md:px-10 lg:px-14">
      {[40, 92, 100, 84, 96, 70, 100, 88].map((w, i) => (
        <div
          key={i}
          className="h-4 animate-pulse rounded bg-secondary/70"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  );
}
