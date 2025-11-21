"use client";

import { useNotebookStore } from "@/lib/store/useNotebook";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import React, { useEffect, useCallback } from "react"; 
import { FlashcardViewer } from "./FlashCards"; 
import { QuestionsSkeleton } from "./QuestionsSkeleton"; // Import the new skeleton

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
    // 1. UX IMPROVEMENT: Switch view IMMEDIATELY to show skeleton
    setStudioView("questions");
    // 2. Then fetch data
    await generateQuestionsFromStore(activeChapter.id);
  };

  const handleGenerateFlashCards = async () => {
    if (!activeChapter) {
      console.warn("Attempt to generate Flashcards without an active chapter.");
      return;
    }
    // 1. UX IMPROVEMENT: Switch view IMMEDIATELY
    setStudioView("flashcards");
    await generateFlashCardsStore(activeChapter.id); 
  };
  
  const stableFetchFlashCards = useCallback(async () => {
    if (activeChapter?.id && !isGeneratingFlashCard) { 
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
        <p className="text-muted-foreground">Select a chapter to use Studio features.</p>
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

                {/* View Questions Button */}
                <Button
                  onClick={() => setStudioView("questions")}
                  variant="outline"
                  disabled={!hasQuestions && !isGenerating}
                  className="w-full justify-center"
                >
                  View Questions ({question.length})
                </Button>

                {/* View Flashcards Button */}
                <Button
                  onClick={() => setStudioView("flashcards")}
                  variant="outline"
                  disabled={!hasFlashCard && !isGeneratingFlashCard}
                  className="w-full justify-center"
                >
                  View Flashcards ({flashcards.length})
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
                variant="ghost" // Consistent back button style
              >
                ← Back to Studio
              </Button>

              {/* SKELETON LOGIC */}
              {isGenerating ? (
                <QuestionsSkeleton />
              ) : hasQuestions ? (
                <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">AI Generated</span>
                    Study Questions
                  </h3>
                  
                  {question.map((q, index) => (
                    <div
                      key={q.id || index}
                      className="border-b border-border/50 pb-4 last:border-b-0 last:pb-0"
                    >
                      <p className="font-semibold text-foreground">
                        <span className="text-muted-foreground mr-2">Q{index + 1}.</span>
                        {q.question_text}
                      </p>
                      <div className="mt-2 pl-8 text-sm text-muted-foreground border-l-2 border-border pl-3">
                        {q.answer_text}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  No questions generated yet.
                </div>
              )}
            </div>
          )}

          {/* 🧭 View: Flashcards */}
          {currentStudioView === "flashcards" && (
            <div className="flex flex-col flex-grow">
              {/* No back button needed here, FlashcardViewer has its own */}
              
              {/* We handle the skeleton inside FlashcardViewer itself for that component */}
              <FlashcardViewer
                chapterId={activeChapter.id}
                flashcards={flashcards}
              />
            </div>
          )}
        </>
      )}
    </aside>
  );
}