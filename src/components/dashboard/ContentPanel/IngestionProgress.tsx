"use client";

import { Check, Loader2, Circle, AlertTriangle } from "lucide-react";
import { useNotebookStore } from "@/lib/store/useNotebook";
import {
  Ingestion,
  IngestionPhase,
  PHASE_ORDER,
  PHASE_LABELS,
} from "@/features/notebook/ingestion";
import { cn } from "@/lib/utils";

function rank(p: IngestionPhase) {
  const i = PHASE_ORDER.indexOf(p);
  return i === -1 ? 99 : i;
}

export function IngestionProgress({ ingestion }: { ingestion: Ingestion }) {
  const retryIngestion = useNotebookStore((s) => s.retryIngestion);
  const dismissIngestion = useNotebookStore((s) => s.dismissIngestion);

  if (ingestion.phase === "failed") {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <p className="font-medium">Ingestion failed</p>
        </div>
        <p className="mt-2 break-words text-sm text-muted-foreground">
          {ingestion.error ||
            "Something went wrong while processing this document."}
        </p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => retryIngestion(ingestion.documentId)}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
          <button
            onClick={() => dismissIngestion(ingestion.documentId)}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  const current = rank(ingestion.phase);
  const isReady = ingestion.phase === "ready";

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border bg-card p-6">
      <p className="mb-4 font-medium text-foreground">
        Processing &ldquo;{ingestion.title || ingestion.filename}&rdquo;
      </p>
      <ul className="space-y-2.5">
        {PHASE_ORDER.map((phase) => {
          const done = isReady || rank(phase) < current;
          const active = !isReady && phase === ingestion.phase;

          return (
            <li key={phase} className="flex items-center gap-3 text-sm">
              <span className="inline-flex h-5 w-5 items-center justify-center">
                {done ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : active ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Circle className="h-3 w-3 text-muted-foreground/40" />
                )}
              </span>
              <span
                className={cn(
                  active
                    ? "text-foreground"
                    : done
                      ? "text-muted-foreground"
                      : "text-muted-foreground/50",
                )}
              >
                {PHASE_LABELS[phase]}
                {phase === "uploading" && active
                  ? ` ${ingestion.uploadPercent}%`
                  : ""}
                {phase === "embedding" && active && ingestion.batch
                  ? `  ·  batch ${ingestion.batch} of ${ingestion.totalBatches ?? "?"}`
                  : ""}
              </span>
            </li>
          );
        })}
      </ul>

      {ingestion.phase === "uploading" && (
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded bg-muted">
          <div
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${ingestion.uploadPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}
