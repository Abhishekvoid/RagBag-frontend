// Ingestion phase state, reduced live from WebSocket ingestion_status events.

export type IngestionPhase =
  | "uploading" | "reading" | "naming" | "chunking"
  | "embedding" | "storing" | "ready" | "failed";

// Ordered for rendering the checklist and preventing out-of-order regressions.
export const PHASE_ORDER: IngestionPhase[] = [
  "uploading", "reading", "naming", "chunking",
  "embedding", "storing", "ready",
];

export const PHASE_LABELS: Record<IngestionPhase, string> = {
  uploading: "Uploading file",
  reading: "Reading document",
  naming: "Naming chapter",
  chunking: "Chunking text",
  embedding: "Embedding",
  storing: "Storing in Pinecone",
  ready: "Ready",
  failed: "Failed",
};

export interface IngestionStatusEvent {
  type: "ingestion_status";
  document_id: string;
  phase: Exclude<IngestionPhase, "uploading">;
  chapter_id?: string;
  title?: string;
  batch?: number;
  total_batches?: number;
  error?: string;
}

export interface Ingestion {
  documentId: string;
  filename: string;
  phase: IngestionPhase;
  uploadPercent: number;   // 0-100, meaningful during 'uploading'
  chapterId: string | null;
  title: string | null;
  batch: number | null;
  totalBatches: number | null;
  error: string | null;
}

export function makeOptimisticIngestion(
  documentId: string,
  filename: string,
): Ingestion {
  return {
    documentId,
    filename,
    phase: "uploading",
    uploadPercent: 0,
    chapterId: null,
    title: null,
    batch: null,
    totalBatches: null,
    error: null,
  };
}

function phaseRank(p: IngestionPhase): number {
  const i = PHASE_ORDER.indexOf(p);
  return i === -1 ? 99 : i; // 'failed' sorts last / always wins
}

export function applyIngestionEvent(
  prev: Ingestion | undefined,
  evt: IngestionStatusEvent,
): Ingestion {
  const base: Ingestion =
    prev ?? makeOptimisticIngestion(evt.document_id, "Document");

  // Never regress to an earlier phase from a late/duplicate event,
  // except 'failed' which always takes over.
  const nextPhase: IngestionPhase =
    evt.phase === "failed" || phaseRank(evt.phase) >= phaseRank(base.phase)
      ? evt.phase
      : base.phase;

  return {
    ...base,
    phase: nextPhase,
    uploadPercent: nextPhase === "uploading" ? base.uploadPercent : 100,
    chapterId: evt.chapter_id ?? base.chapterId,
    title: evt.title ?? base.title,
    batch: evt.batch ?? (nextPhase === "embedding" ? base.batch : null),
    totalBatches: evt.total_batches ?? base.totalBatches,
    error: evt.error ?? (nextPhase === "failed" ? base.error : null),
  };
}
