
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useNotebookStore } from "@/lib/store/useNotebook";
import { Button } from "@/components/ui/button";
import { FlashCard } from "@/features/notebook/notebook.schema";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { FlashcardSkeleton } from "./FlashcardSkeleton";

interface FlashcardViewerProps {
  chapterId: string;
  flashcards: FlashCard[];
}

export function FlashcardViewer({
  chapterId,
  flashcards,
}: FlashcardViewerProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const reduce = useReducedMotion();

  // Correctly get the singular updateFlashCard action from the store
  const updateFlashCards = useNotebookStore((state) => state.updateFlashCards);
  const setStudioView = useNotebookStore((state) => state.setStudioView);



  // --- Reset viewer state if flashcards prop changes (e.g., new generation) ---
  useEffect(() => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
  }, [flashcards, chapterId]); // Reset when flashcards array or chapter changes

  // --- Helper Functions ---
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false); // Reset flip state for the new card
    } else {
      // Logic for when you reach the end of flashcards
      console.log("End of flashcards! Implement results screen here.");
      // You'll add a 'showResults' state and render a results component here later.
    }
  };

  const handlePrev = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false); // Reset flip state for the new card
    }
  };

  const handleMarkKnown = async () => {
    if (!currentFlashcard) return;
    await updateFlashCards(currentFlashcard.id, {
      known: true,
      need_review: false,
    });
    handleNext(); // Move to the next card after marking
  };

  const handleMarkReview = async () => {
    if (!currentFlashcard) return;
    await updateFlashCards(currentFlashcard.id, {
      known: false,
      need_review: true,
    });
    handleNext(); // Move to the next card after marking
  };

  // --- Render Logic ---
  const currentFlashcard = flashcards[currentCardIndex];
  const totalFlashcards = flashcards.length;

  // Handle empty state (no flashcards generated or available)
  if (!currentFlashcard) {
    return <FlashcardSkeleton />;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 relative">
      <Button
        variant="ghost"
        onClick={() => setStudioView("controls")}
        className="absolute top-4 left-4 gap-2"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      {/* Card deck — current card in front, upcoming cards peek behind, blurred */}
      <div className="relative h-64 w-full max-w-md">
        {/* Upcoming cards, stacked and blurred behind the current one */}
        {[2, 1].map((depth) => {
          const card = flashcards[currentCardIndex + depth];
          if (!card) return null;
          return (
            <div
              key={card.id}
              aria-hidden
              className="absolute inset-0 rounded-xl border border-border bg-card shadow-sm transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                transform: `translateY(-${depth * 16}px) scale(${1 - depth * 0.05})`,
                filter: `blur(${depth * 2}px)`,
                opacity: depth === 1 ? 0.6 : 0.32,
              }}
            />
          );
        })}

        {/* Current card — springs forward as the deck advances */}
        <AnimatePresence initial={false}>
          <motion.div
            key={currentFlashcard.id}
            initial={reduce ? false : { opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -12 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="absolute inset-0"
          >
            <div
              className="group h-full w-full cursor-pointer"
              style={{ perspective: "1000px" }}
              onClick={handleFlip}
            >
              <div
                className="relative h-full w-full rounded-xl border border-border bg-card shadow-lg transition-transform duration-500"
                style={{ transformStyle: "preserve-3d", transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-xl bg-card p-6 text-center"
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(0deg)",
                    opacity: isFlipped ? 0 : 1,
                    transition: "opacity 0ms linear 250ms",
                  }}
                >
                  <h3 className="select-none text-xl font-semibold leading-relaxed">
                    {currentFlashcard.flashcard_front}
                  </h3>
                  <p className="absolute bottom-4 text-xs uppercase tracking-widest text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    Tap to reveal
                  </p>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-xl bg-card p-6 text-center"
                  style={{
                    transform: "rotateY(180deg)",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    opacity: isFlipped ? 1 : 0,
                    transition: "opacity 0ms linear 250ms",
                  }}
                >
                  <p className="select-none text-lg leading-relaxed text-muted-foreground">
                    {currentFlashcard.flashcard_back}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4 mt-8">
        <Button
          onClick={handlePrev}
          disabled={currentCardIndex === 0}
          variant="outline"
          size="icon"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-muted-foreground tabular-nums">
          {currentCardIndex + 1} / {totalFlashcards}
        </span>
        <Button
          onClick={handleNext}
          disabled={currentCardIndex === totalFlashcards - 1}
          variant="outline"
          size="icon"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-6">
        <Button
          onClick={handleMarkReview}
          variant="outline" 
          className="border-yellow-500/20 text-yellow-600 hover:bg-yellow-500/10 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300"
        >
          Needs Review
        </Button>
        <Button
          onClick={handleMarkKnown}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          I Know This
        </Button>
      </div>
    </div>
  );
}