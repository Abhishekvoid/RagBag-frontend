"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import { PenLine, Sparkles, MessageCircleQuestion } from "lucide-react";
import { useCoReadingStore } from "@/lib/store/useCoReading";
import {
  cleanExtractedText,
  toParagraphs,
  segmentParagraph,
  reanchor,
  type Anchor,
} from "@/lib/readerText";
import {
  HIGHLIGHT_COLORS,
  COLOR_LABEL,
  colorVar,
  asHighlightColor,
  type HighlightColor,
} from "@/lib/highlightColors";
import { cn } from "@/lib/utils";

interface ReaderPaneProps {
  chapterId: string;
  docId: string;
  rawText: string;
}

interface PendingSel {
  start: number;
  end: number;
  quoted: string;
  top: number;
  left: number;
}

export function ReaderPane({ chapterId, docId, rawText }: ReaderPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<PendingSel | null>(null);
  const [progress, setProgress] = useState(0);

  const notes = useCoReadingStore((s) => s.notesByChapter[chapterId]);
  const explainingFor = useCoReadingStore((s) => s.explainingFor);
  const lastColor = useCoReadingStore((s) => s.lastColor);
  const addNote = useCoReadingStore((s) => s.addNote);
  const setLastColor = useCoReadingStore((s) => s.setLastColor);
  const explain = useCoReadingStore((s) => s.explain);
  const askAbout = useCoReadingStore((s) => s.askAbout);
  const setTab = useCoReadingStore((s) => s.setTab);

  const fullText = useMemo(() => cleanExtractedText(rawText), [rawText]);
  const paragraphs = useMemo(() => toParagraphs(fullText), [fullText]);

  // Anchors for THIS document, re-anchored against the current text if offsets
  // drifted (quoted_text is the fallback locator).
  const anchors = useMemo<Anchor[]>(() => {
    const list = (notes ?? []).filter(
      (n) => n.document === docId && n.anchor_start != null && n.anchor_end != null,
    );
    const out: Anchor[] = [];
    for (const n of list) {
      const fixed = reanchor(fullText, n.quoted_text, n.anchor_start as number);
      if (fixed) out.push({ id: n.id, start: fixed[0], end: fixed[1] });
    }
    return out;
  }, [notes, docId, fullText]);

  const colorById = useMemo<Record<string, HighlightColor>>(() => {
    const map: Record<string, HighlightColor> = {};
    for (const n of notes ?? []) map[n.id] = asHighlightColor(n.color);
    return map;
  }, [notes]);

  const clearSel = useCallback(() => setSel(null), []);

  const onMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !containerRef.current) {
      setSel(null);
      return;
    }
    const range = selection.getRangeAt(0);
    const startP = elWithOffset(range.startContainer, containerRef.current);
    const endP = elWithOffset(range.endContainer, containerRef.current);
    if (!startP || !endP) {
      setSel(null);
      return;
    }
    const startBase = Number(startP.dataset.start);
    const endBase = Number(endP.dataset.start);

    const r1 = document.createRange();
    r1.selectNodeContents(startP);
    r1.setEnd(range.startContainer, range.startOffset);
    const start = startBase + r1.toString().length;

    const r2 = document.createRange();
    r2.selectNodeContents(endP);
    r2.setEnd(range.endContainer, range.endOffset);
    const end = endBase + r2.toString().length;

    if (end - start < 1) {
      setSel(null);
      return;
    }
    const quoted = fullText.slice(start, end).trim();
    if (!quoted) {
      setSel(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    const box = containerRef.current.getBoundingClientRect();
    setSel({
      start,
      end,
      quoted,
      top: rect.top - box.top + containerRef.current.scrollTop - 8,
      left: Math.min(
        Math.max(rect.left - box.left + rect.width / 2, 120),
        box.width - 120,
      ),
    });
  }, [fullText]);

  const onScroll = useCallback(() => {
    if (sel) setSel(null);
    const el = containerRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setProgress(max > 0 ? Math.min(1, el.scrollTop / max) : 0);
  }, [sel]);

  const doHighlight = async (color: HighlightColor) => {
    if (!sel) return;
    setLastColor(color);
    await addNote(chapterId, {
      kind: "highlight",
      document: docId,
      anchor_start: sel.start,
      anchor_end: sel.end,
      quoted_text: sel.quoted,
      body: "",
      color,
    });
    clearSel();
    window.getSelection()?.removeAllRanges();
  };

  const doNote = async () => {
    if (!sel) return;
    await addNote(chapterId, {
      kind: "note",
      document: docId,
      anchor_start: sel.start,
      anchor_end: sel.end,
      quoted_text: sel.quoted,
      body: "",
      color: lastColor,
    });
    setTab("notes");
    clearSel();
    window.getSelection()?.removeAllRanges();
  };

  const doExplain = async () => {
    if (!sel) return;
    const payload = { passage: sel.quoted, document: docId, anchorStart: sel.start, anchorEnd: sel.end };
    clearSel();
    window.getSelection()?.removeAllRanges();
    await explain(chapterId, payload);
  };

  const doAsk = () => {
    if (!sel) return;
    askAbout(sel.quoted);
    clearSel();
    window.getSelection()?.removeAllRanges();
  };

  const scrollToNote = (noteId: string) => {
    setTab("notes");
    // Let the rail switch, then surface the note.
    requestAnimationFrame(() => {
      document
        .querySelector(`[data-note-anchor="${noteId}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const isExplaining =
    sel != null && explainingFor === `${sel.start}:${sel.end}`;

  return (
    <div
      ref={containerRef}
      onMouseUp={onMouseUp}
      onScroll={onScroll}
      className="relative h-full overflow-y-auto scroll-smooth px-6 py-8 md:px-10 lg:px-14"
    >
      {/* Reading progress */}
      <div className="pointer-events-none sticky top-0 z-20 -mx-6 -mt-8 h-[2px] bg-transparent md:-mx-10 lg:-mx-14">
        <div
          className="h-full bg-primary/60 transition-[width] duration-150"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <article className="mx-auto max-w-[68ch]">
        {paragraphs.map((para, i) => {
          const segs = segmentParagraph(para, anchors);
          return (
            <p
              key={i}
              data-start={para.start}
              className="reader-paragraph mb-5 text-[16.5px] leading-[1.85] text-foreground/90"
            >
              {segs.map((seg, j) =>
                seg.noteId ? (
                  <mark
                    key={j}
                    data-note-id={seg.noteId}
                    onClick={() => scrollToNote(seg.noteId!)}
                    className={cn("hl", `hl-${colorById[seg.noteId] ?? "vermillion"}`)}
                  >
                    {seg.text}
                  </mark>
                ) : (
                  <span key={j}>{seg.text}</span>
                ),
              )}
            </p>
          );
        })}
      </article>

      {sel && (
        <div
          className="absolute z-30 -translate-x-1/2 -translate-y-full"
          style={{ top: sel.top, left: sel.left }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="flex items-center gap-0.5 rounded-xl border border-border bg-popover/95 p-1 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <div className="flex items-center gap-1 px-1">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={`Highlight · ${COLOR_LABEL[c]}`}
                  onClick={() => doHighlight(c)}
                  className="flex size-6 items-center justify-center rounded-md transition-colors hover:bg-secondary"
                >
                  <span
                    className="size-3.5 rounded-full ring-1 ring-black/15 dark:ring-white/20"
                    style={{ backgroundColor: colorVar(c) }}
                  />
                </button>
              ))}
            </div>
            <div className="mx-0.5 h-5 w-px bg-border" />
            <ActionBtn label="Note" onClick={doNote}>
              <PenLine size={15} />
            </ActionBtn>
            <ActionBtn label="Explain" onClick={doExplain} busy={isExplaining}>
              <Sparkles size={15} />
            </ActionBtn>
            <ActionBtn label="Ask" onClick={doAsk}>
              <MessageCircleQuestion size={15} />
            </ActionBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  label,
  onClick,
  children,
  busy,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-60",
      )}
    >
      <span className={cn("[&_svg]:size-[15px]", busy && "animate-pulse text-primary")}>
        {children}
      </span>
      {label}
    </button>
  );
}

// Walk up to the nearest paragraph element carrying a data-start offset.
function elWithOffset(node: Node, root: HTMLElement): HTMLElement | null {
  let el: Node | null = node;
  while (el && el !== root) {
    if (el instanceof HTMLElement && el.dataset.start !== undefined) return el;
    el = el.parentNode;
  }
  return null;
}
