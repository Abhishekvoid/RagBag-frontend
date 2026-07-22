"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useNotebookStore } from "@/lib/store/useNotebook";
import { getAccessToken, refreshAccessToken } from "@/lib/authToken";
import { CoReadingWorkspace } from "@/components/coreading/CoReadingWorkspace";
import { Grain } from "@/components/ui/kit";

export default function ChapterWorkspacePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();
  const subjects = useNotebookStore((s) => s.subjects);
  const [ready, setReady] = useState(false);

  // Bootstrap: restore session if needed, hydrate the notebook, mark the
  // chapter active so the store's chat targets it (and loads its history).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!getAccessToken()) await refreshAccessToken();
      } catch {
        router.push("/auth/login");
        return;
      }
      const store = useNotebookStore.getState();
      store.initWebSocket();
      if (store.subjects.length === 0) await store.fetchSubjects();
      if (!active) return;
      store.setActiveChapter(id);
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, [id, router]);

  const chapter = useMemo(
    () => subjects.flatMap((s) => s.chapters).find((c) => c.id === id) ?? null,
    [subjects, id],
  );

  // Keep the chapter active as the store rehydrates (drives sendMessage + history).
  useEffect(() => {
    if (chapter) useNotebookStore.getState().setActiveChapter(id);
  }, [chapter, id]);

  if (!ready) {
    return <FullScreenState>Opening your reading workspace…</FullScreenState>;
  }
  if (!chapter) {
    return (
      <FullScreenState>
        <p className="mb-4">We couldn&apos;t find that chapter.</p>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <ArrowLeft size={15} /> Back to dashboard
        </button>
      </FullScreenState>
    );
  }

  return (
    <>
      <Grain />
      <CoReadingWorkspace chapter={chapter} />
    </>
  );
}

function FullScreenState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-background px-6 text-center text-[14px] text-muted-foreground">
      {children}
    </div>
  );
}
