"use client";

import { useNotebookStore } from "@/lib/store/useNotebook";
import { ChatView } from "./ChatView";
import { AddSourceView } from "./AddSourceView";

export function ContentPanel() {
  const activeChapterId = useNotebookStore((s) => s.activeChapterId);

  const activeChapter = useNotebookStore((s) =>
    s.subjects
      .flatMap((subj) => subj.chapters)
      .find((c) => c.id === activeChapterId),
  );

  const fetchSubjects = useNotebookStore((s) => s.fetchSubjects);

  // 🟡 CASE 0: No chapter selected
  if (!activeChapter) {
    return (
      <section className="col-span-5 bg-card rounded-lg flex flex-col h-full items-center justify-center border border-border">
        <AddSourceView onSourceAdded={fetchSubjects} />
      </section>
    );
  }

  const documents = activeChapter.documents ?? [];

  const hasDocs = documents.length > 0;

  const hasCompleted = documents.some((d) => d.status === "COMPLETED");

  const isProcessing = documents.some(
    (d) => d.status === "PROCESSING" || d.status === "PENDING",
  );

  const hasFailed = documents.some((d) => d.status === "FAILED");

  if (!hasDocs) {
    return (
      <section className="col-span-5 bg-card rounded-lg flex flex-col h-full items-center justify-center border border-border">
        <AddSourceView chapter={activeChapter} onSourceAdded={fetchSubjects} />
      </section>
    );
  }

  if (isProcessing) {
    return (
      <section className="col-span-5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-10 h-10 border-2 border-primary rounded-full border-t-transparent" />

          <p className="text-sm font-medium text-foreground">
            Processing your document...
          </p>

          <p className="text-xs text-muted-foreground">
            Extracting → Chunking → Embedding → Indexing
          </p>
        </div>
      </section>
    );
  }

  if (hasFailed) {
    return (
      <section className="col-span-5 flex items-center justify-center">
        <div className="text-center space-y-2 text-destructive">
          <p className="font-medium">❌ Processing failed</p>
          <p className="text-xs">Please re-upload your document</p>
        </div>
      </section>
    );
  }
  if (hasCompleted) {
    return (
      <section className="col-span-5 bg-card rounded-lg flex flex-col h-full overflow-hidden border border-border">
        <ChatView chapter={activeChapter} />
      </section>
    );
  }

  return (
    <section className="col-span-5 bg-card rounded-lg flex flex-col h-full items-center justify-center border border-border">
      <p className="text-sm text-muted-foreground">
        Preparing your document...
      </p>
    </section>
  );
}
