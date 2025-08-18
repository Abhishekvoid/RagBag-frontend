"use client";

import { useState } from "react";
import { AddSourceView } from "./AddSourceView";
import { ChatView } from "./ChatView";
import { EmptyState } from "./EmptyState";
import { useNotebookStore } from "@/lib/store/useNotebook";


const ChapterIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
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

export interface Source {
  id: string;
  name: string;
}

export function ContentPanel() {
  const activeChapter = useNotebookStore((state) => state.getActiveChapter());
  const [sources, setSources] = useState<Source[]>([]);


  console.log("--- ContentPanel Re-rendered ---");
  console.log("Active Chapter:", activeChapter?.name);
  console.log("Does it have documents?", activeChapter?.documents?.length > 0);
  console.log("Are there messages in the chat?", message.length > 0);
  
  if (sources.length === 0) {
    return (
      <section className="col-span-5 bg-card rounded-lg flex flex-col h-full items-center justify-center border border-border">
        <AddSourceView onSourceAdded={() => {
          
          setSources([{ id: '1', name: 'My First Document.pdf' }]);
        }} />
      </section>
    );
  }

  // State 2: Sources exist, show the chat view
  return (
    <section className="col-span-5 bg-card rounded-lg flex flex-col h-full overflow-hidden border border-border">
      <ChatView sources={sources} />
    </section>
  );
}