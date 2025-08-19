// components/ContentPanel.tsx

"use client";

import { AddSourceView } from "./AddSourceView";
import { ChatView } from "./ChatView";
// We no longer need EmptyState for the "Select a Chapter" view
// import { EmptyState } from "./EmptyState";
import { useNotebookStore } from "@/lib/store/useNotebook";
import { Spinner } from "../Icons";

export function ContentPanel() {
  const subjects = useNotebookStore((state) => state.subjects);
  const getActiveChapter = useNotebookStore((state) => state.getActiveChapter);
  const fetchSubjects = useNotebookStore((state) => state.fetchSubjects);
  const isLoading = useNotebookStore((state) => state.isLoading);

  const activeChapter = getActiveChapter();

  // 1. Handle the initial loading state to prevent UI flashes.
  if (isLoading && subjects.length === 0) {
    console.log("%c⏳ STATE: App is loading initial data...");
    return (
      <section className="col-span-5 bg-card rounded-lg flex flex-col h-full items-center justify-center border border-border">
        <Spinner />
      </section>
    );
  }

 
  if (activeChapter) {

    console.log(`%c✅ STATE: Entered Chapter -> "${activeChapter.name}"`);
   
    if (!activeChapter.documents || activeChapter.documents.length === 0) {
      console.log("%c📄 ...Chapter has no documents. Ready to add a source.");
      return (
        <section className="col-span-5 bg-card rounded-lg flex flex-col h-full items-center justify-center border border-border">
          <AddSourceView onSourceAdded={fetchSubjects} />
        </section>
      );
    }

   console.log("%c💬 ...Chapter has documents. You are ready to chat!");
    return (
      <section className="col-span-5 bg-card rounded-lg flex flex-col h-full overflow-hidden border border-border">
        <ChatView sources={activeChapter.documents} />
      </section>
    );
  }
  
  console.log("%c🏠 STATE: No chapter selected. Displaying default Add Source view.");
  return (
    <section className="col-span-5 bg-card rounded-lg flex flex-col h-full items-center justify-center border border-border">
      <AddSourceView onSourceAdded={fetchSubjects} />
    </section>
  );
}