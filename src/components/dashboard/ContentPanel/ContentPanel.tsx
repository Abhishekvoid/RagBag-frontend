

// "use client";

// import { AddSourceView } from "./AddSourceView";
// import { ChatView } from "./ChatView";
// import { useNotebookStore } from "@/lib/store/useNotebook";
// import { Spinner } from "../Icons";

// export function ContentPanel() {
//   const subjects = useNotebookStore((state) => state.subjects);
//   const getActiveChapter = useNotebookStore((state) => state.getActiveChapter);
//   const fetchSubjects = useNotebookStore((state) => state.fetchSubjects);
//   const isLoading = useNotebookStore((state) => state.isLoading);

//   const activeChapter = getActiveChapter();


//   if (isLoading && subjects.length === 0) {
//     console.log("%c⏳ STATE: App is loading initial data...");
//     return (
//       <section className="bg-white/10 backdrop-blur-lg border border-white/20 col-span-5 bg-card rounded-lg flex flex-col h-full items-center justify-center border border-border">
//         <Spinner />
//       </section>
//     );
//   }

 
//   if (activeChapter) {

//     console.log(`%c✅ STATE: Entered Chapter -> "${activeChapter.name}"`);
   
//     if (!activeChapter.documents || activeChapter.documents.length === 0) {
//       console.log("%c📄 ...Chapter has no documents. Ready to add a source.");
//       return (
//         <section className="col-span-5 bg-card rounded-lg flex flex-col h-full items-center justify-center border border-border">
//           <AddSourceView onSourceAdded={fetchSubjects} />
//         </section>
//       );
//     }

//    console.log("%c💬 ...Chapter has documents. You are ready to chat!");
//     return (
//       <section className="col-span-5 bg-card rounded-lg flex flex-col h-full overflow-hidden border border-border">
//         <ChatView sources={activeChapter.documents} />
//       </section>
//     );
//   }
  
//   console.log("%c🏠 STATE: No chapter selected. Displaying default Add Source view.");
//   return (
//     <section className="col-span-5 bg-card rounded-lg flex flex-col h-full items-center justify-center border border-border">
//       <AddSourceView onSourceAdded={fetchSubjects} />
//     </section>
//   );
// }


// features/notebook/components/ContentPanel.tsx

"use client";

import { useNotebookStore, Chapter } from "@/lib/store/useNotebook"; 
import { ChatView } from "./ChatView";
import { AddSourceView } from "./AddSourceView";

export function ContentPanel() {
  
  const activeChapter = useNotebookStore((state) => {
    if (!state.activeChapterId) {
      return null;
    }
    return (
      state.subjects
        .flatMap((s) => s.chapters)
        .find((c) => c.id === state.activeChapterId) || null
    );
  });
  
  
  const fetchSubjects = useNotebookStore((state) => state.fetchSubjects);

  
  if (!activeChapter) {
    
    return (
        <section className="col-span-5 bg-card rounded-lg flex flex-col h-full items-center justify-center border border-border">
          <AddSourceView onSourceAdded={fetchSubjects} />
        </section>
    );
  }

  // Case 2: A chapter is selected. Check if it's ready for chat.
  const isReadyForChat =
    activeChapter.documents &&
    activeChapter.documents.length > 0 &&
    activeChapter.documents.some((doc) => doc.status === "COMPLETED");

  if (isReadyForChat) {
    // ✅ If ready, show the chat interface.
    return (
        <section className="col-span-5 bg-card rounded-lg flex flex-col h-full overflow-hidden border border-border">
          <ChatView chapter={activeChapter} />
        </section>
    );
  } else {
    // 📄 Otherwise, show the view for adding a source.
    return (
        <section className="col-span-5 bg-card rounded-lg flex flex-col h-full items-center justify-center border border-border">
          <AddSourceView chapter={activeChapter} onSourceAdded={fetchSubjects} />
        </section>
    );
  }


  
}
