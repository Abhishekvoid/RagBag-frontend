"use client";

import { useNotebookStore } from "@/lib/store/useNotebook";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function StudioPanel() {
  const activeChapter = useNotebookStore((state) => state.getActiveChapter());
  const generateQuestionsFromStore = useNotebookStore(
    (state) => state.generateQuestions
  );

  const isGenerating = activeChapter?.isGeneratingQuestions || false;
  const question = activeChapter?.questions || [];
  const hasQuestions = question.length > 0;

  const isDisabled = !activeChapter || isGenerating;

  const buttonText = hasQuestions
    ? "Regenerate Questions"
    : "Generate Questions";

  const handleGenerateQuestions = async () => {
    if (!activeChapter) {
      console.warn("Attempt to generate question without an active chapter.");
      return;
    }
    await generateQuestionsFromStore(activeChapter.id);
  };

  return (
    <aside className="col-span-4 bg-card rounded-lg p-4 flex flex-col h-full overflow-y-auto border border-border">
      <h2 className="text-xl font-bold mb-4 text-card-foreground">Studio</h2>
      <div className="space-y-3 mb-4">
        <Button
          onClick={handleGenerateQuestions}
          disabled={isDisabled}
          className="w-full justify-center"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            buttonText
          )}
        </Button>
        <Button disabled={isDisabled} className="w-full justify-center">
          Create Flashcards
        </Button>
      </div>
      <div className="flex-grow bg-background rounded-lg p-4 text-muted-foreground text-sm border border-border overflow-y-auto whitespace-pre-wrap">
        {!activeChapter && <p>Select a chapter to use Studio features.</p>}
        {isGenerating && activeChapter && (
          <p className="animate-pulse">✨ Generating insightful questions...</p>
        )}
        {activeChapter &&
          !isGenerating &&
          hasQuestions && ( // If questions exist and not generating
            <div className="mt-4 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Generated Questions:
              </h3>
              {question.map((q, index) => (
                <div
                  key={q.id || index}
                  className="border-b pb-4 last:border-b-0 last:pb-0"
                >
                  <p className="font-semibold text-foreground">
                    Q{index + 1}: {q.question_text}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    A: {q.answer_text}
                  </p>
                </div>
              ))}
            </div>
          )}
      </div>
    </aside>
  );
}
