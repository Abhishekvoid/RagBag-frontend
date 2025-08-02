"use client";

import { useNotebookStore } from "@/lib/store/useNotebook";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ContentPanel() {
  const activeChapter = useNotebookStore((state) => state.getActiveChapter());

  if (!activeChapter) {
    return (
      <section className="col-span-5 bg-card rounded-lg flex flex-col h-full items-center justify-center border border-border">
        <div className="text-center p-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto text-muted-foreground mb-4"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
          </svg>
          <h2 className="text-2xl font-bold text-card-foreground">
            {" "}
            Select a Chapter{" "}
          </h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Choose a chapter from you notebook on the left to begin reading,
            uploading documents, and chatting with the Docs
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="col-span-5 bg-card rounded-lg flex flec-col h-full overflow-hidden border border-border">
      <div className="flex-grow p-6 overflow-y-auto">
        <h1 className="text-3xl font-bold text-card-foreground mb-4">
          {activeChapter.name}
        </h1>
        <div className="prose prose-invert max-w-none text-muted-foreground">
          <p>
            Document content for &quot;{activeChapter.name}&quot; will be
            displayed here. You can upload PDFs, Word documents, and more to
            start interacting with them.
          </p>
        </div>

        <div className="border-t border-border pt-4 mt-6">
          <h3 className="text-lg font semibold mb-4"> Chat with Docs</h3>
          <div className=" space-y-4">
            <div className="p-3 rounded-lg bg-secondary">
              <p className="font-bold text-sm mb-1 text-secondary-foreground">
                StudyWise AI
              </p>
              <p className="text-secondary-foreground">
                Welcome! Ask me anythig about &quot;{activeChapter.name}&quot;
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-border flex-shrink-0 bg-card">
        <form className="relative flex gap-2">
            <Input
                placeholder={`Ask about "${activeChapter.name}"...`}
                className="flex-grow"
            />
            <Button type="submit">
                Send
            </Button>
        </form>
      </div>
    </section>
  );
}
