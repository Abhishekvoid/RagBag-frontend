"use client";

import { useEffect, useState } from "react";
import { useNotebookStore } from "@/lib/store/useNotebook";
import { ChatView } from "./ChatView";
import { AddSourceView } from "./AddSourceView";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Loader2 } from "lucide-react";

export function ContentPanel() {
  const activeChapter = useNotebookStore((state) => {
    if (!state.activeChapterId) return null;
    return (
      state.subjects
        .flatMap((s) => s.chapters)
        .find((c) => c.id === state.activeChapterId) || null
    );
  });

  const fetchSubjects = useNotebookStore((state) => state.fetchSubjects);
  const { socket } = useWebSocket();

  const [viewKey, setViewKey] = useState(0);

  // ✅ WebSocket sync (CORRECT)
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        if (
          data.type === "send_notification" &&
          (data.message === "notebook_updated" ||
            data.message === "document_ready")
        ) {
          console.log("🔔 WebSocket update received");

          (async () => {
            await fetchSubjects(); // wait for fresh data
            setViewKey((prev) => prev + 1); // force UI refresh
          })();
        }
      } catch (err) {
        console.error("WebSocket parse error:", err);
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket, fetchSubjects]);

  // ===============================
  // CASE 1: No chapter selected
  // ===============================
  if (!activeChapter) {
    return (
      <section
        key={`no-chapter-${viewKey}`}
        className="col-span-5 bg-card rounded-lg flex flex-col h-full items-center justify-center border border-border"
      >
        <AddSourceView onSourceAdded={fetchSubjects} />
      </section>
    );
  }

  // ===============================
  // STATE CALCULATION (IMPORTANT)
  // ===============================
  const hasDocuments =
    activeChapter.documents && activeChapter.documents.length > 0;

  const hasCompletedDoc =
    activeChapter.documents?.some((doc) => doc.status === "COMPLETED");

  const isProcessing =
    activeChapter.documents?.some(
      (doc) => doc.status === "PROCESSING" || doc.status === "PENDING"
    );

  // ===============================
  // CASE 2: NO DOCUMENTS → Upload UI
  // ===============================
  if (!hasDocuments) {
    return (
      <section
        key={`upload-${viewKey}`}
        className="col-span-5 bg-card rounded-lg flex flex-col h-full items-center justify-center border border-border"
      >
        <AddSourceView
          chapter={activeChapter}
          onSourceAdded={fetchSubjects}
        />
      </section>
    );
  }

  // ===============================
  // CASE 3: COMPLETED → Chat UI
  // ===============================
  if (hasCompletedDoc) {
    return (
      <section
        key={`chat-${viewKey}`}
        className="col-span-5 bg-card rounded-lg flex flex-col h-full overflow-hidden border border-border"
      >
        <ChatView chapter={activeChapter} />
      </section>
    );
  }

  // ===============================
  // CASE 4: PROCESSING → Loader UI
  // ===============================
  if (isProcessing) {
    return (
      <section
        key={`processing-${viewKey}`}
        className="col-span-5 bg-card rounded-lg flex flex-col h-full items-center justify-center border border-border"
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin w-8 h-8 text-primary" />
          <p className="text-sm text-muted-foreground">
            Processing your document...
          </p>
          <p className="text-xs text-muted-foreground/60">
            This usually takes a few seconds
          </p>
        </div>
      </section>
    );
  }

  // fallback (should never happen)
  return null;
}