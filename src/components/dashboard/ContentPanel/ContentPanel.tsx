
// "use client";

// import { useNotebookStore, Chapter } from "@/lib/store/useNotebook"; 
// import { ChatView } from "./ChatView";
// import { AddSourceView } from "./AddSourceView";
// import { ProcessingState } from "./ProcessingState";
// import { useWebSocket } from "@/hooks/useWebSocket"
// export function ContentPanel() {
  
//   const activeChapter = useNotebookStore((state) => {
//     if (!state.activeChapterId) {
//       return null;
//     }
//     return (
//       state.subjects
//         .flatMap((s) => s.chapters)
//         .find((c) => c.id === state.activeChapterId) || null
//     );
//   });
  
  
//   const fetchSubjects = useNotebookStore((state) => state.fetchSubjects);
//   const { socket } = useWebSocket();
  
//   if (!activeChapter) {
    
//     return (
//         <section className="col-span-5 bg-card rounded-lg flex flex-col h-full items-center justify-center border border-border">
//           <AddSourceView onSourceAdded={fetchSubjects} />
//         </section>
//     );
//   }

//   // Case 2: A chapter is selected. Check if it's ready for chat.
//   const isReadyForChat =
//     activeChapter.documents &&
//     activeChapter.documents.length > 0 &&
//     activeChapter.documents.some((doc) => doc.status === "COMPLETED");

//   if (isReadyForChat) {
//     // ✅ If ready, show the chat interface.
//     return (
//         <section className="col-span-5 bg-card rounded-lg flex flex-col h-full overflow-hidden border border-border">
//           <ChatView chapter={activeChapter} />
//         </section>
//     );
//   } else {
//     // 📄 Otherwise, show the view for adding a source.
//     return (
//         <section className="col-span-5 bg-card rounded-lg flex flex-col h-full items-center justify-center border border-border">
//           <AddSourceView chapter={activeChapter} onSourceAdded={fetchSubjects} />
//         </section>
//     );
//   }


"use client";

import { useEffect, useState } from "react"; // Import useState
import { useNotebookStore } from "@/lib/store/useNotebook";
import { ChatView } from "./ChatView";
import { AddSourceView } from "./AddSourceView";
import { useWebSocket } from "@/hooks/useWebSocket"; 

export function ContentPanel() {
  const activeChapter = useNotebookStore((state) => {
    if (!state.activeChapterId) return null;
    return state.subjects.flatMap((s) => s.chapters).find((c) => c.id === state.activeChapterId) || null;
  });

  const fetchSubjects = useNotebookStore((state) => state.fetchSubjects);
  const { socket } = useWebSocket();

  // --- NEW: State to force re-rendering of views ---
  const [viewKey, setViewKey] = useState(0);

  // --- Listen for notifications ---
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "send_notification" && (data.message === "notebook_updated" || data.message === "document_ready")) {
          console.log("🔔 WebSocket notification received. Refreshing data and UI.");
          
          // 1. Refresh the data in the store
          fetchSubjects();
          
          // 2. Force current view to reset. This kills the 'isProcessing' state.
          setViewKey(prev => prev + 1);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket, fetchSubjects]);
  // ------------------------------------

  // CASE 1: No chapter selected. Show Add Source view.
  if (!activeChapter) {
    return (
        // Add the key here. When viewKey changes, this entire section re-mounts.
        <section key={`add-source-${viewKey}`} className="col-span-5 bg-card rounded-lg flex flex-col h-full items-center justify-center border border-border">
          <AddSourceView onSourceAdded={fetchSubjects} />
        </section>
    );
  }

  // CASE 2: Chapter selected. Check if ready.
  const isReadyForChat = activeChapter.documents && activeChapter.documents.length > 0 && activeChapter.documents.some((doc) => doc.status === "COMPLETED");

  if (isReadyForChat) {
    return (
        // Add key here too, just in case updates happen while chatting
        <section key={`chat-${viewKey}`} className="col-span-5 bg-card rounded-lg flex flex-col h-full overflow-hidden border border-border">
          <ChatView chapter={activeChapter} />
        </section>
    );
  } else {
    // CASE 3: Chapter selected but processing. Show Add Source (contextual).
    return (
        // Add key here too
        <section key={`add-source-context-${viewKey}`} className="col-span-5 bg-card rounded-lg flex flex-col h-full items-center justify-center border border-border">
          <AddSourceView chapter={activeChapter} onSourceAdded={fetchSubjects} />
        </section>
    );
  }
}