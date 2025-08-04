"use client";

import { useNotebookStore } from "@/lib/store/useNotebook";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { notebookApi } from "@/features/notebook/notebook.api"; 
import { AxiosError } from "axios"; 

export function StudioPanel() {
 
  const activeChapter = useNotebookStore((state) => state.getActiveChapter());
  
 
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
  const isDisabled = !activeChapter || isGenerating;

  const handleGenerateQuestions = async () => {
    if (!activeChapter) return;
    
    setIsGenerating(true);
    setOutput("");
    setError(null);

    try {

      const response = await notebookApi.generateQuestions(activeChapter.id);
      setOutput(response.questions);

    } catch (err) {

      let errorMessage = "An unknown error occurred.";
      if (err instanceof AxiosError) {
       
        errorMessage = err.response?.data?.error || "An error occurred while communicating with the server.";
      }
      setError(errorMessage);
      setOutput(""); 
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <aside className="col-span-4 bg-card rounded-lg p-4 flex flex-col h-full overflow-y-auto border border-border">
      <h2 className="text-xl font-bold mb-4 text-card-foreground">Studio</h2>
      <div className="space-y-3 mb-4">
        <Button onClick={handleGenerateQuestions} disabled={isDisabled} className="w-full justify-center">
          {isGenerating ? "Generating..." : "✨ Generate Questions"}
        </Button>
        <Button disabled={isDisabled} className="w-full justify-center">
          Create Flashcards
        </Button>
      </div>
      <div className="flex-grow bg-background rounded-lg p-4 text-muted-foreground text-sm border border-border overflow-y-auto whitespace-pre-wrap">
        {error && <p className="text-destructive font-medium">{error}</p>}
        {isGenerating && !output && <p className="animate-pulse">✨ Generating insightful questions...</p>}
        {output}
        {!output && !error && !isGenerating && <p>Select a chapter and use the tools above to generate study materials.</p>}
      </div>
    </aside>
  );
}
