"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpenText, ChevronDown, FileText } from "lucide-react";
import { useCoReadingStore } from "@/lib/store/useCoReading";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ReaderPane } from "./ReaderPane";
import { ThinkingRail } from "./ThinkingRail";
import type { Chapter } from "@/lib/store/useNotebook";
import { cn } from "@/lib/utils";

export function CoReadingWorkspace({ chapter }: { chapter: Chapter }) {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 1024px)", true);
  const [mobilePane, setMobilePane] = useState<"read" | "work">("read");

  const activeDocId = useCoReadingStore((s) => s.activeDocId);
  const setActiveDoc = useCoReadingStore((s) => s.setActiveDoc);
  const contentByDoc = useCoReadingStore((s) => s.contentByDoc);
  const loadDocumentContent = useCoReadingStore((s) => s.loadDocumentContent);
  const loadNotes = useCoReadingStore((s) => s.loadNotes);
  const clearSynth = useCoReadingStore((s) => s.clearSynth);

  // Only completed documents can be read.
  const readableDocs = useMemo(
    () => chapter.documents.filter((d) => d.status === "COMPLETED"),
    [chapter.documents],
  );
  const docTitles = useMemo(
    () => Object.fromEntries(readableDocs.map((d) => [d.id, d.title])),
    [readableDocs],
  );

  // Load notes for the chapter. synthResult is a single global field, so clear
  // the previous chapter's study sheet on switch to avoid leaking it here.
  useEffect(() => {
    clearSynth();
    loadNotes(chapter.id);
  }, [chapter.id, loadNotes, clearSynth]);

  // Default the active doc to the most recent completed one.
  useEffect(() => {
    if (readableDocs.length === 0) return;
    const stillValid = readableDocs.some((d) => d.id === activeDocId);
    if (!stillValid) {
      const latest = [...readableDocs].sort((a, b) =>
        a.created_at < b.created_at ? 1 : -1,
      )[0];
      setActiveDoc(latest.id);
    }
  }, [readableDocs, activeDocId, setActiveDoc]);

  // Fetch content for the active document.
  useEffect(() => {
    if (activeDocId) loadDocumentContent(activeDocId);
  }, [activeDocId, loadDocumentContent]);

  const content = activeDocId ? contentByDoc[activeDocId] : undefined;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background text-foreground">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-3 md:px-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active-press"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex min-w-0 items-center gap-2">
          <BookOpenText size={16} className="shrink-0 text-primary" />
          <h1 className="truncate font-display text-[15px] font-semibold tracking-tight">
            {chapter.name}
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {readableDocs.length > 1 && activeDocId && (
            <div className="relative">
              <FileText
                size={14}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <select
                value={activeDocId}
                onChange={(e) => setActiveDoc(e.target.value)}
                className="max-w-[220px] truncate rounded-lg border border-border bg-card/60 py-1.5 pl-8 pr-7 text-[12.5px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              >
                {readableDocs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </header>

      {/* Mobile pane switch */}
      {!isDesktop && (
        <div className="flex shrink-0 gap-1 border-b border-border p-2">
          {(["read", "work"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setMobilePane(p)}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-[13px] font-medium capitalize transition-colors",
                mobilePane === p
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {p === "read" ? "Read" : "Discuss"}
            </button>
          ))}
        </div>
      )}

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Reader */}
        <div
          className={cn(
            "min-w-0 flex-1",
            !isDesktop && mobilePane !== "read" && "hidden",
          )}
        >
          <ReaderContent content={content} chapterId={chapter.id} docId={activeDocId} />
        </div>

        {/* Rail */}
        <div
          className={cn(
            "border-l border-border",
            isDesktop ? "w-[400px] shrink-0" : mobilePane === "work" ? "flex-1" : "hidden",
          )}
        >
          <ThinkingRail chapter={chapter} docTitles={docTitles} />
        </div>
      </div>
    </div>
  );
}

function ReaderContent({
  content,
  chapterId,
  docId,
}: {
  content: ReturnType<typeof useCoReadingStore.getState>["contentByDoc"][string] | undefined;
  chapterId: string;
  docId: string | null;
}) {
  if (!docId) {
    return (
      <CenterMsg>No readable source in this chapter yet. Upload one to start reading.</CenterMsg>
    );
  }
  if (!content || content.status === "loading") {
    return <ReaderSkeleton />;
  }
  if (content.status === "error") {
    return <CenterMsg>{content.message}</CenterMsg>;
  }
  return <ReaderPane chapterId={chapterId} docId={docId} rawText={content.content.text} />;
}

function ReaderSkeleton() {
  return (
    <div className="mx-auto max-w-[68ch] space-y-3 px-6 py-10 md:px-10 lg:px-14">
      {[92, 100, 84, 96, 70, 100, 88, 94, 60].map((w, i) => (
        <div
          key={i}
          className="h-4 animate-pulse rounded bg-secondary/70"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  );
}

function CenterMsg({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center px-8 text-center">
      <p className="max-w-[36ch] text-[13.5px] leading-relaxed text-muted-foreground">
        {children}
      </p>
    </div>
  );
}
