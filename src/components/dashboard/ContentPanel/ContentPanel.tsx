"use client";

import { AddSourceView } from "./AddSourceView";
import { ChatView } from "./ChatView";
import { EmptyState } from "./EmptyState";
import { useNotebookStore } from "@/lib/store/useNotebook";

const ChapterIcon = () => (
  <svg
    xmlns="http://www.w.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-muted-foreground"
  >
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
  </svg>
);

export function ContentPanel() {
  // ✅ 1. Get the fetchSubjects action from the store
  const { activeChapter, fetchSubjects } = useNotebookStore((state) => ({
    activeChapter: state.getActiveChapter(),
    fetchSubjects: state.fetchSubjects,
  }));

  // State 1: No chapter is selected.
  if (!activeChapter) {
    return (
      <section className="col-span-5 bg-card rounded-lg flex flex-col h-full items-center justify-center border border-border">
        <EmptyState
          icon={<ChapterIcon />}
          title="Select a Chapter"
          description="Choose a chapter from the sidebar to start chatting with your documents."
        />
      </section>
    );
  }

  // State 2: A chapter is selected, but it has no documents.
  if (!activeChapter.documents || activeChapter.documents.length === 0) {
    return (
      <section className="col-span-5 bg-card rounded-lg flex flex-col h-full items-center justify-center border border-border">
        {/* ✅ 2. Pass fetchSubjects as the onSourceAdded prop */}
        <AddSourceView onSourceAdded={fetchSubjects} />
      </section>
    );
  }

  // State 3: A chapter is selected AND it has documents. Show the chat.
  return (
    <section className="col-span-5 bg-card rounded-lg flex flex-col h-full overflow-hidden border border-border">
      <ChatView sources={activeChapter.documents} />
    </section>
  );
}