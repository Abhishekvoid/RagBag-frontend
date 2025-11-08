"use client";

import { useNotebookStore } from "@/lib/store/useNotebook";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState, useCallback } from "react"; 
import { FlashcardViewer } from "./FlashCards"; 

export function StudioPanel() {
  const activeChapter = useNotebookStore((state) => state.getActiveChapter());


  const generateFlashCardsStore = useNotebookStore(
    (state) => state.generateFlashCards
  );
  const fetchFlashCardsStore = useNotebookStore((state) => state.fetchFlashCards);
 

  const generateQuestionsFromStore = useNotebookStore(
    (state) => state.generateQuestions
  );
  const currentStudioView = useNotebookStore(
    (state) => state.currentStudioView
  );
  const setStudioView = useNotebookStore((state) => state.setStudioView);

  const isGenerating = activeChapter?.isGeneratingQuestions || false;
  const question = activeChapter?.questions || [];
  const hasQuestions = question.length > 0;

  const isGeneratingFlashCard = activeChapter?.isGeneratingFlashCard || false;
  const flashcards = activeChapter?.flashcards || [];
  const hasFlashCard = flashcards.length > 0; 

  const isDisabledFlashcard = !activeChapter || isGeneratingFlashCard;
  const isDisabledQuestions = !activeChapter || isGenerating; 

  const buttonText = "Generate Questions";
  const flashcardButtonText = "Generate Flashcards"; 

  const handleGenerateQuestions = async () => {
    if (!activeChapter) {
      console.warn("Attempt to generate questions without an active chapter.");
      return;
    }
    await generateQuestionsFromStore(activeChapter.id);
    setStudioView("questions");
  };

  const handleGenerateFlashCards = async () => {
    if (!activeChapter) {
      console.warn("Attempt to generate Flashcards without an active chapter.");
      return;
    }
    await generateFlashCardsStore(activeChapter.id); // Use the consolidated action
    setStudioView("flashcards");
  };

  
  const stableFetchFlashCards = useCallback(async () => {
    if (activeChapter?.id && !isGeneratingFlashCard) { // Only fetch if not currently generating
      console.log(`Fetching flashcards for chapter: ${activeChapter.id}`);
      await fetchFlashCardsStore(activeChapter.id);
    }
  }, [activeChapter?.id, fetchFlashCardsStore, isGeneratingFlashCard]);

  useEffect(() => {
    stableFetchFlashCards();
  }, [stableFetchFlashCards]);
  


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
                  disabled={isDisabledQuestions} 
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
                  disabled={isDisabledFlashcard}
                  className="w-full justify-center"
                >
                  {isGeneratingFlashCard ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Flashcards...
                    </>
                  ) : (
                    flashcardButtonText
                  )}
                </Button>
              </div>

              
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
                  <Button className="w-full justify-center animate-pulse opacity-80">
                    ✨ Generating insightful Flashcards...
                  </Button>
                ) : (
                  hasFlashCard && ( // Only show button if cards exist AND not generating
                    <Button
                      onClick={() => setStudioView("flashcards")}
                      variant="outline"
                      className="w-full justify-center"
                    >
                      View Flashcards ({flashcards.length})
                    </Button>
                  )
                )}
               
               
                {!isGeneratingFlashCard && !hasFlashCard && (
                    <p className="text-sm text-muted-foreground text-center">
                        No flashcards available. Click Generate Flashcards above.
                    </p>
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

             
              {activeChapter && (
                <FlashcardViewer
                  chapterId={activeChapter.id}
                  flashcards={flashcards}
                />
              )}

             
              {isGeneratingFlashCard && (
                <div className="text-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Generating flashcards...</p>
                </div>
              )}
              {!isGeneratingFlashCard && flashcards.length === 0 && (
                <div className="text-center p-4">
                  <p className="text-muted-foreground">
                    No flashcards found. Generate some!
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </aside>
  );
}