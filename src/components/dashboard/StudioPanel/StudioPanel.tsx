"use client";

import { useNotebookStore } from "@/lib/store/useNotebook";
import { Button } from "@/components/ui/button";
import { Loader2, View } from "lucide-react";
import { useEffect, useState } from "react";

export function StudioPanel() {
  const [frontText, setFrontText] = useState("");
  const [backText, setBackText] = useState("");

  const activeChapter = useNotebookStore((state) => state.getActiveChapter());
  const generateQuestionsFromStore = useNotebookStore(
    (state) => state.generateQuestions
  );

  const currentStudioView = useNotebookStore(
    (state) => state.currentStudioView
  );
  const setStudioView = useNotebookStore((state) => state.setStudioView);
  const createFlashCards = useNotebookStore((state) => state.createFlashCards);
  const fetchFlashCards = useNotebookStore((state) => state.fetchFlashCards);

  const isGenerating = activeChapter?.isGeneratingQuestions || false;
  const question = activeChapter?.questions || [];
  const hasQuestions = question.length > 0;

  const isGeneratingFlashCard = activeChapter?.isGeneratingFlashCard || false;
  const flashcards = activeChapter?.flashcards || [];
  const hasFlashCard = flashcards.length > 0;

  const isDisabledflashcard = !activeChapter || isGeneratingFlashCard;
  const isDisabled = !activeChapter || isGenerating;

  const buttonText = "Generate Questions";

  const handleStudioView = async () => {
    if (!activeChapter) {
      console.warn("Attempt to generate without an chapter.");
      return;
    }
  };
  const handleGenerateQuestions = async () => {
    if (!activeChapter) {
      console.warn("Attempt to generate question without an active chapter.");
      return;
    }
    await generateQuestionsFromStore(activeChapter.id);
    setStudioView("questions");
  };

  const handleFetchFlashCards = async () => {
    if (!activeChapter) {
      console.warn("Attempt to create falshcard without an active chapter.");
      return;
    }
    await fetchFlashCards(activeChapter.id);
  };

  const handleCreateflashCards = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!activeChapter) return;

    await createFlashCards(activeChapter.id, {
      flashcard_front: frontText,
      flashcard_back: backText,
    });
    setFrontText("");
    setBackText("");
  };
  useEffect(() => {
    if (activeChapter) {
      fetchFlashCards(activeChapter.id);
    }
  }, [activeChapter?.id]);

  return (
    <aside className="col-span-4 bg-card rounded-lg p-4 flex flex-col h-full overflow-y-auto border border-border">
      <h2 className="text-xl font-bold mb-4 text-card-foreground">Studio</h2>

      {!activeChapter ? (
        <p>Select a chapter to use Studio features.</p>
      ) : (
        <>
          {/* 🧭 View: Controls (Default) */}
          {currentStudioView === "controls" && (
            <>
              {/* --- Primary Controls Section --- */}
              <div className="space-y-3 mb-6">
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

                <Button
                  onClick={handleFetchFlashCards}
                  disabled={isDisabledflashcard}
                  className="w-full justify-center"
                >
                  Create Flashcards
                </Button>
              </div>

              {/* --- Secondary "View" Section --- */}
              <div className="border-t border-border pt-4 space-y-3">
                <h3 className="text-md font-semibold text-foreground mb-2">
                  View Your Content
                </h3>

                {isGenerating ? (
                  <Button
                    disabled
                    className="w-full justify-center animate-pulse opacity-80"
                  >
                    ✨ Generating insightful questions...
                  </Button>
                ) : (
                  hasQuestions && (
                    <Button
                      onClick={() => setStudioView("questions")}
                      variant="outline"
                      className="w-full justify-center"
                    >
                      View Questions
                    </Button>
                  )
                )}

                <Button
                  onClick={() => setStudioView("flashcards")}
                  disabled={isDisabledflashcard}
                  variant="outline"
                  className="w-full justify-center"
                >
                  View Flashcards
                </Button>
              </div>
            </>
          )}

          {/* 🧭 View: Questions */}
          {currentStudioView === "questions" && (
            <div className="flex flex-col flex-grow">
              <Button
                onClick={() => setStudioView("controls")}
                className="mb-3 w-fit"
              >
                ← Back to Studio
              </Button>
              {!isGenerating && hasQuestions && (
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
          )}

          {/* 🧭 View: Flashcards */}
          {currentStudioView === "flashcards" && (
            <div className="flex flex-col flex-grow">
              <Button
                onClick={() => setStudioView("controls")}
                className="mb-3 w-fit"
              >
                ← Back to Studio
              </Button>
              <p>Flashcards will appear here later...</p>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
