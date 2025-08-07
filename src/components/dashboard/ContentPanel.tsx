"use client";

import { useState } from "react";
import { AddSourceView } from "./AddSourceView";
import { ChatView } from "./ChatView";

// ✅ The 'export' keyword makes this type available to other files
export interface Source {
  id: string;
  name: string;
}

export function ContentPanel() {
  const [sources, setSources] = useState<Source[]>([]);

  // State 1: No sources have been uploaded
  if (sources.length === 0) {
    return (
      <section className="col-span-5 bg-card rounded-lg flex flex-col h-full items-center justify-center border border-border">
        <AddSourceView onSourceAdded={() => {
          // This is a placeholder for your actual file upload logic.
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