"use client";

import { useEffect, useRef, useState } from "react";
import { useNotebookStore } from "@/lib/store/useNotebook";
import { ChatView } from "./ChatView";
import { AddSourceView } from "./AddSourceView";
import { IngestionProgress } from "./IngestionProgress";

// ── Processing Card ───────────────────────────────────────────────────────────

const STEPS = [
  { label: "Uploaded" },
  { label: "OCR complete" },
  { label: "Chunks generated" },
  { label: "Creating embeddings" },
  { label: "Finalizing index" },
];

function ProcessingCard() {
  const activeChapter = useNotebookStore((s) =>
    s.subjects
      .flatMap((subj) => subj.chapters)
      .find((c) => c.id === s.activeChapterId),
  );

  const doc = activeChapter?.documents?.[0];
  const status = doc?.status ?? "PENDING";

  const [animStep, setAnimStep] = useState(0);

  useEffect(() => {
    if (status === "PENDING") {
      setAnimStep(0);
      return;
    }
    if (status === "PROCESSING") {
      setAnimStep(1);
      const timers = [
        setTimeout(() => setAnimStep(2), 4000),
        setTimeout(() => setAnimStep(3), 9000),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [status]);

  const pct = Math.round((animStep / (STEPS.length - 1)) * 100);

  return (
    <div className="w-full max-w-sm bg-card border border-border rounded-xl p-7">
      <div className="mb-6">
        <p className="text-sm font-medium text-foreground">
          Processing document
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {status === "PENDING"
            ? "Waiting for worker…"
            : "This usually takes under a minute…"}
        </p>
      </div>

      <div className="flex flex-col">
        {STEPS.map((step, i) => {
          const done = i < animStep;
          const active = i === animStep;
          return (
            <div key={i} className="relative flex items-center gap-3 py-2.5">
              {i < STEPS.length - 1 && (
                <div className="absolute left-[9px] top-[30px] w-px h-[18px] bg-border" />
              )}
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                {done ? (
                  <svg
                    className="w-3.5 h-3.5 text-emerald-500"
                    fill="none"
                    viewBox="0 0 14 14"
                  >
                    <path
                      d="M2 7l3.5 3.5L12 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : active ? (
                  <div className="w-3.5 h-3.5 rounded-full border border-border border-t-foreground animate-spin" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-border mx-auto" />
                )}
              </div>
              <span
                className={`text-[13px] flex-1 transition-colors ${done || active ? "text-foreground" : "text-muted-foreground"
                  } ${active ? "font-medium" : ""}`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-border flex items-center gap-3">
        <div className="flex-1 h-0.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {pct}%
        </span>
      </div>
    </div>
  );
}

// ── Failed Card ───────────────────────────────────────────────────────────────

function FailedCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="w-full max-w-sm bg-card border border-destructive/30 rounded-xl p-7 text-center space-y-3">
      <p className="text-sm font-medium text-destructive">Processing failed</p>
      <p className="text-xs text-muted-foreground">
        Something went wrong while indexing your document.
      </p>
      <button
        onClick={onRetry}
        className="text-xs text-foreground border border-border rounded-md px-3 py-1.5 hover:bg-muted transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="col-span-5 bg-card rounded-lg flex flex-col h-full overflow-hidden border border-border">
      {children}
    </section>
  );
}

// ── ContentPanel ──────────────────────────────────────────────────────────────

export function ContentPanel() {
  const activeChapterId = useNotebookStore((s) => s.activeChapterId);
  const fetchSubjects = useNotebookStore((s) => s.fetchSubjects);
  const ingestions = useNotebookStore((s) => s.ingestions);
  const pollIngestions = useNotebookStore((s) => s.pollIngestions);

  // The most recent in-flight ingestion drives the live phase checklist.
  // This takes priority so the upload never leaves a blank gap — even before
  // a chapter exists to select.
  const inFlight = Object.values(ingestions);
  const activeIngestion = inFlight[inFlight.length - 1];

  // Polling backstop: while any ingestion is unfinished, reconcile with the
  // server so the card still advances/completes if live WS events don't arrive.
  const hasInFlightIngestion = inFlight.some(
    (i) => i.phase !== "ready" && i.phase !== "failed",
  );
  useEffect(() => {
    if (!hasInFlightIngestion) return;
    const t = setInterval(() => {
      pollIngestions();
    }, 3500);
    return () => clearInterval(t);
  }, [hasInFlightIngestion, pollIngestions]);

  const activeChapter = useNotebookStore((s) =>
    s.subjects
      .flatMap((subj) => subj.chapters)
      .find((c) => c.id === activeChapterId),
  );

  const documents = activeChapter?.documents ?? [];
  const hasDocs = documents.length > 0;
  const hasCompleted = documents.some((d) => d.status === "COMPLETED");
  const isProcessing = documents.some(
    (d) => d.status === "PROCESSING" || d.status === "PENDING",
  );
  const hasFailed = documents.some((d) => d.status === "FAILED");

  // Poll every 3s while processing so stale state auto-resolves
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isProcessing) {
      pollRef.current = setInterval(() => {
        fetchSubjects();
      }, 3000);
    } else {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isProcessing, fetchSubjects]);

  // ── A document is actively ingesting — show the live phase checklist ──
  if (activeIngestion) {
    return (
      <Shell>
        <div className="flex-1 flex items-center justify-center p-6">
          <IngestionProgress ingestion={activeIngestion} />
        </div>
      </Shell>
    );
  }

  // ── No chapter selected ──
  if (!activeChapter) {
    return (
      <Shell>
        <div className="flex-1 flex items-center justify-center">
          <AddSourceView onSourceAdded={fetchSubjects} />
        </div>
      </Shell>
    );
  }

  // ── Chapter exists but no documents yet ──
  if (!hasDocs) {
    return (
      <Shell>
        <div className="flex-1 flex items-center justify-center">
          <AddSourceView chapter={activeChapter} onSourceAdded={fetchSubjects} />
        </div>
      </Shell>
    );
  }

  // ── Document is processing / pending ──
  if (isProcessing) {
    return (
      <Shell>
        <div className="flex-1 flex items-center justify-center">
          <ProcessingCard />
        </div>
      </Shell>
    );
  }

  // ── Document failed ──
  if (hasFailed) {
    return (
      <Shell>
        <div className="flex-1 flex items-center justify-center">
          <FailedCard onRetry={fetchSubjects} />
        </div>
      </Shell>
    );
  }

  // ── Document ready — show chat ──
  if (hasCompleted) {
    return (
      <section className="col-span-5 bg-card rounded-lg flex flex-col h-full overflow-hidden border border-border">
        <ChatView chapter={activeChapter} />
      </section>
    );
  }

  // ── Fallback ──
  return (
    <Shell>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Preparing your document…
        </p>
      </div>
    </Shell>
  );
}
