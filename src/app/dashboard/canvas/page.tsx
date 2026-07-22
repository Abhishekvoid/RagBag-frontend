"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useNotebookStore } from "@/lib/store/useNotebook";
import { getAccessToken, refreshAccessToken } from "@/lib/authToken";
import { KnowledgeCanvas } from "@/components/canvas/KnowledgeCanvas";
import { Grain } from "@/components/ui/kit";

export default function CanvasPage() {
  const router = useRouter();
  const subjects = useNotebookStore((s) => s.subjects);
  const [ready, setReady] = useState(false);

  // Bootstrap: restore session if needed, then hydrate the whole notebook.
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
      if (store.subjects.length === 0) await store.fetchSubjects();
      if (!active) return;
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-background px-6 text-center text-[14px] text-muted-foreground">
        Opening the knowledge canvas…
      </div>
    );
  }

  return (
    <>
      <Grain />
      <KnowledgeCanvas subjects={subjects} />
    </>
  );
}
