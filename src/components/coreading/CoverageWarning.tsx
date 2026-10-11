import type { DocumentDTO, CoverageAudit } from "@/features/notebook/notebook.schema";

export function CoverageNotice({ audit, title }: { audit?: CoverageAudit; title?: string }) {
  if (audit?.code !== "INCOMPLETE_COVERAGE") return null;
  return <p role="status" className="break-words text-sm leading-relaxed">
    {title && <strong>{title}: </strong>}We couldn’t read pages {audit.pages?.map((p) => p.page_number).join(", ")}.
    {" "}Upload clearer scans to include them in answers and summaries.
  </p>;
}

export function CoverageWarning({ documents }: { documents: DocumentDTO[] }) {
  const affected = documents.filter((d) => d.coverage_audit?.code || d.active_coverage?.code);
  if (!affected.length) return null;
  return <div className="max-h-36 shrink-0 space-y-2 overflow-y-auto border-b border-border bg-secondary/50 px-4 py-3">
    {affected.map((doc) => <div key={doc.id}>
      <CoverageNotice audit={doc.active_coverage} title={doc.title} />
      {doc.coverage_audit?.code && doc.coverage_audit.version !== doc.active_coverage?.version && <>
        <CoverageNotice audit={doc.coverage_audit} title={`${doc.title} — latest upload attempt`} />
        {((doc.active_version ?? 0) > 0 || doc.status === "COMPLETED") && <p className="text-sm text-muted-foreground">The previous version remains available.</p>}
      </>}
    </div>)}
  </div>;
}
