
"use client";

import React, { useState, useEffect } from "react";
import { useNotebookStore } from "@/lib/store/useNotebook";
import { Button } from "@/components/ui/button";
import { FlashCard } from "@/features/notebook/notebook.schema"; 
import { ArrowLeft, ArrowRight } from "lucide-react"; 
import { Loader2 } from "lucide-react";

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
  if (!currentFlashcard && totalFlashcards === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <p className="text-lg mb-4 text-muted-foreground">
          No flashcards available in this chapter.
        </p>
        <Button onClick={() => setStudioView("controls")} className="mt-4">
          Generate Flashcards
        </Button>
      </div>
    );
  }

  // Handle case where currentFlashcard might be null (e.g., during rapid changes)
  if (!currentFlashcard) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <p className="text-lg mb-4 text-muted-foreground">
          Loading flashcard...
        </p>
        <Loader2 className="h-8 w-8 animate-spin text-primary" /> {/* Assuming you have Loader2 imported */}
      </div>
    );
  }


  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      {/* Back to Studio button, positioned absolutely */}
      <Button
        onClick={() => setStudioView("controls")}
        className="absolute top-4 left-4"
      >
        ← Back to Studio
      </Button>

      {/* --- Flashcard Display Area --- */}
      <div
        className={`relative w-full max-w-md h-64 bg-secondary rounded-lg shadow-lg cursor-pointer flex items-center justify-center text-center p-6
                    transition-transform duration-500 ease-in-out transform
                    ${isFlipped ? "rotateY-180" : ""}`}
        onClick={handleFlip}
        
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault(); 
            handleFlip();
          }
        }}
      >
       
        <div className={`text-2xl font-bold text-secondary-foreground absolute transition-opacity duration-200 ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
            {currentFlashcard.flashcard_front}
        </div>
        <div className={`text-xl text-muted-foreground absolute transition-opacity duration-200 ${isFlipped ? 'opacity-100' : 'opacity-0'}`}>
            {currentFlashcard.flashcard_back}
        </div>
      </div>

      {/* --- Navigation Buttons --- */}
      <div className="flex space-x-4 mt-6">
        <Button
          onClick={handlePrev}
          disabled={currentCardIndex === 0}
          variant="outline"
          size="icon"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleNext}
          disabled={currentCardIndex === totalFlashcards - 1}
          variant="outline"
          size="icon"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* --- Progress Indicator --- */}
      <p className="mt-4 text-muted-foreground">
        Card {currentCardIndex + 1} of {totalFlashcards}
      </p>

      {/* --- "Known" / "Need Review" Buttons --- */}
      <div className="flex space-x-4 mt-6">
        <Button
          onClick={handleMarkKnown}
          variant="default" // Using default variant for base styling
          className="bg-green-600 hover:bg-green-700 text-white" // Tailwind for success color
        >
          I Know This
        </Button>

        <Button
          onClick={handleMarkReview}
          variant="destructive" // Using destructive variant (often red) for contrast
          className="bg-yellow-600 hover:bg-yellow-700 text-white" // Tailwind for warning color (changed to white text for better contrast on yellow)
        >
          Need Review
        </Button>
      </div>

      {/* --- Current Flashcard Status Display (for debugging/info) --- */}
      <p className="mt-2 text-sm text-muted-foreground">
        Status:{" "}
        {currentFlashcard.known
          ? "Known"
          : currentFlashcard.need_review
          ? "Needs Review"
          : "New"}
      </p>
    </div>
  );
}