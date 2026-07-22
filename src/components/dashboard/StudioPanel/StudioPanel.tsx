"use client";

import { useNotebookStore } from "@/lib/store/useNotebook";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Layers, ArrowLeft, ArrowUpRight } from "lucide-react";
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
  const fetchQuestionsStore = useNotebookStore((state) => state.fetchQuestions);
  const currentStudioView = useNotebookStore(
    (state) => state.currentStudioView
  );
  const setStudioView = useNotebookStore((state) => state.setStudioView);
  const sendMessage = useNotebookStore((state) => state.sendMessage);
  const isAiResponding = useNotebookStore((state) => state.isAiResponding);

  const handleAskInChat = (text: string) => {
    if (isAiResponding) return;
    sendMessage(text);
  };

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

  // Load previously-generated questions on chapter change, mirroring flashcards
  // so saved questions reappear instead of vanishing after a chapter switch.
  const stableFetchQuestions = useCallback(async () => {
    if (activeChapter?.id && !isGenerating) {
      await fetchQuestionsStore(activeChapter.id);
    }
  }, [activeChapter?.id, fetchQuestionsStore, isGenerating]);

  useEffect(() => {
    stableFetchQuestions();
  }, [stableFetchQuestions]);

  return (
    <aside className="col-span-4 bg-card rounded-lg p-4 flex flex-col h-full overflow-y-auto border border-border">
      <div className="mb-5">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Studio</span>
        <h2 className="pencil font-display text-lg font-semibold tracking-tight text-foreground">Study tools</h2>
      </div>

      {!activeChapter ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <Sparkles className="size-6 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Select a chapter to generate questions and flashcards.</p>
        </div>
      ) : (
        <>
          {/* 🧭 View: Controls (Default) */}
          {currentStudioView === "controls" && (
            <>
              {/* --- Generate --- */}
              <div className="space-y-2.5 mb-6">
                <Button
                  onClick={handleGenerateQuestions}
                  disabled={isDisabledQuestions}
                  className="h-11 w-full justify-center rounded-xl"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      {buttonText}
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleGenerateFlashCards}
                  disabled={isDisabledFlashcard}
                  variant="secondary"
                  className="h-11 w-full justify-center rounded-xl"
                >
                  {isGeneratingFlashCard ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Layers className="mr-2 h-4 w-4" />
                      {flashcardButtonText}
                    </>
                  )}
                </Button>
              </div>

              <div className="border-t border-border pt-4 space-y-2.5">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Your content
                </span>

                <Button
                  onClick={() => setStudioView("questions")}
                  variant="outline"
                  disabled={!hasQuestions && !isGenerating}
                  className="h-11 w-full justify-between rounded-xl"
                >
                  View questions
                  <span className="font-mono text-xs text-muted-foreground">{question.length}</span>
                </Button>

                <Button
                  onClick={() => setStudioView("flashcards")}
                  variant="outline"
                  disabled={!hasFlashCard && !isGeneratingFlashCard}
                  className="h-11 w-full justify-between rounded-xl"
                >
                  View flashcards
                  <span className="font-mono text-xs text-muted-foreground">{flashcards.length}</span>
                </Button>
              </div>
            </>
          )}

          {/* 🧭 View: Questions */}
          {currentStudioView === "questions" && (
            <div className="flex flex-col flex-grow">
              <Button
                onClick={() => setStudioView("controls")}
                className="mb-3 w-fit gap-1.5 px-2 text-muted-foreground hover:text-foreground"
                variant="ghost"
              >
                <ArrowLeft className="size-4" />
                Back to studio
              </Button>

              {isGenerating ? (
                <QuestionsSkeleton />
              ) : hasQuestions ? (
                <div className="mt-2 space-y-3 duration-500 animate-in fade-in slide-in-from-bottom-2">
                  <div className="mb-1 flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    <h3 className="font-display text-base font-semibold text-foreground">Study questions</h3>
                    <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">{question.length}</span>
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Your answer key for this chapter. Skim to review, or send any question to chat to go deeper.
                  </p>

                  {question.map((q, index) => (
                    <div
                      key={q.id || index}
                      className="group rounded-xl border border-border bg-secondary/40 p-4 transition-colors hover:border-primary/30"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="mt-px inline-flex shrink-0 items-center justify-center rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] font-medium text-primary tabular-nums">
                          Q{index + 1}
                        </span>
                        <p className="text-[14px] font-medium leading-relaxed text-foreground">
                          {q.question_text}
                        </p>
                      </div>
                      <p className="mt-2.5 border-l-2 border-primary/40 pl-3 text-[13.5px] leading-relaxed text-muted-foreground">
                        {q.answer_text}
                      </p>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleAskInChat(q.question_text)}
                          disabled={isAiResponding}
                          className="active-press inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
                        >
                          Ask in chat
                          <ArrowUpRight className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
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