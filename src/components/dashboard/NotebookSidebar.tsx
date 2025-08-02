"use client";

import { useEffect } from "react";
import { useNotebookStore } from "@/lib/store/useNotebook";
import { Button } from "@/components/ui/button";
import { NewSubjectModal } from "./NewSubjectModal"; // We will build this next

export function NotebookSidebar() {
  const {
    subjects,
    activeChapterId,
    setActiveChapter,
    fetchSubjects,
    isLoading,
    error,
  } = useNotebookStore();

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // 1. Handle the initial loading state
  if (isLoading) {
    return (
      <aside className="col-span-3 bg-card rounded-lg p-4 flex items-center justify-center h-full border border-border">
        <p className="text-muted-foreground animate-pulse">
          Loading Notebook...
        </p>
      </aside>
    );
  }

  // 2. Handle the error state
  if (error) {
    return (
      <aside className="col-span-3 bg-card rounded-lg p-4 flex flex-col items-center justify-center h-full border border-border">
        <p className="text-destructive text-center mb-4">{error}</p>
        <Button onClick={fetchSubjects}>Try Again</Button>
      </aside>
    );
  }

  // 3. Render the main UI when data is successfully loaded
  return (
    <aside className="col-span-3 bg-card rounded-lg p-4 flex flex-col h-full overflow-y-auto border border-border">
      <h2 className="text-xl font-bold mb-4 text-card-foreground">
        My Notebook
      </h2>
      <div className="flex gap-2 mb-4">
        <NewSubjectModal />
        <Button variant="secondary" size="sm" className="flex-1">
          New Chapter
        </Button>
      </div>
      <div className="space-y-2">
        {subjects.map((subject) => (
          <div key={subject.id}>
            <div className="flex items-center gap-2 p-2 rounded-md">
              <span className="font-semibold text-card-foreground truncate">
                {subject.name}
              </span>
            </div>
            <ul className="pl-6 mt-1 space-y-1">
              {subject.chapters.map((chapter) => (
                <li
                  key={chapter.id}
               
                  onClick={() => setActiveChapter(chapter.id)}
                  className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                    activeChapterId === chapter.id
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50 text-muted-foreground"
                  }`}
                >
                  <span className="truncate">{chapter.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}
