"use client";

import { useNotebookStore } from "@/lib/store/useNotebook";
import { Button } from "@/components/ui/button";
import { Loader2, Stethoscope, View } from "lucide-react";
import { useEffect, useState } from "react";
import { warn } from "console";

export function StudioPanel() {
  

  const activeChapter = useNotebookStore((state) => state.getActiveChapter());
  const generateQuestionsFromStore = useNotebookStore(
    (state) => state.generateQuestions
  );
  const generateFlashCardsFromStore = useNotebookStore(
    (state) => state.generateFlashCards
  )
  const currentStudioView = useNotebookStore(
    (state) => state.currentStudioView
  );
  const setStudioView = useNotebookStore((state) => state.setStudioView);
  const generateFlashCards = useNotebookStore((state) => state.generateFlashCards);
  const fetchFlashCards = useNotebookStore((state) => state.fetchFlashCards);
  const updateFlashCards = useNotebookStore((state) => state.updateFlashCards);
  const deleteFlashCard = useNotebookStore((state) => state.deleteFlashCards);

  const isGenerating = activeChapter?.isGeneratingQuestions || false;
  const question = activeChapter?.questions || [];
  const hasQuestions = question.length > 0;

  const isGeneratingFlashCard = activeChapter?.isGeneratingFlashCard || false;
  const flashcards = activeChapter?.flashcards || [];
  const hasFlashCard = flashcards.length > 0;

  const isDisabledflashcard = !activeChapter || isGeneratingFlashCard;
  const isDisabled = !activeChapter || isGenerating;

  const buttonText = "Generate Questions";
  const flashcardButtonText = "Generate FlashCards";

  
  const handleGenerateQuestions = async () => {
    if (!activeChapter) {
      console.warn("Attempt to generate question without an active chapter.");
      return;
    }
    await generateQuestionsFromStore(activeChapter.id);
    setStudioView("questions");
  };

  const handleGenerateFlashCards = async() => {
    if(!activeChapter) {
      console.warn("Attempt to generate Flashcard without an active chapter.");
      return;
      
    }
    await generateFlashCardsFromStore(activeChapter.id);
    setStudioView("flashcards");
  }
 

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

        
              </div>

              <div className="space-y-3 mb-6">
                <Button
                  onClick={handleGenerateFlashCards}
                  disabled={isDisabledflashcard}
                  className="w-full justify-center"
                >
                  {isGeneratingFlashCard ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating FlashCard...
                    </>
                  ) : (
                    flashcardButtonText
                  )}
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

                {isGeneratingFlashCard ? (
                  <Button
                    
                    className="w-full justify-center animate-pulse opacity-80"
                  >
                    ✨ Generating insightful Flashcards...
                  </Button>
                ) : (
                  hasFlashCard && (
                    <Button
                      onClick={() => setStudioView("flashcards")}
                      variant="outline"
                      className="w-full justify-center"
                    >
                      View Flashcards
                    </Button>
                  )
                )}

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
              {!isGeneratingFlashCard && hasFlashCard && (
                <div className="mt-4 space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    Generated flashcards:
                  </h3>
                  {flashcards.map((cards, index) => (
                    <div
                      key={cards.id || index}
                      className="border-b pb-4 last:border-b-0 last:pb-0"
                    >
                      <p className="font-semibold text-foreground">
                        Q{index + 1}: {cards.flashcard_front}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        A: {cards.flashcard_back}
                      </p>
                    </div>
                  ))}
                </div>
                
              )}
             <p>No flashcards yet. Try generating some!</p>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
