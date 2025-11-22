"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Loader2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  "Uploading document...",
  "Extracting text content...",
  "Chunking into semantic segments...",
  "Generating vector embeddings...",
  "Indexing into knowledge base...",
];

export function ProcessingState() {
  const [currentStep, setCurrentStep] = useState(0);

 
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 1500); 

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 animate-in fade-in duration-500">
      <div className="bg-muted/30 p-6 rounded-full mb-6 animate-pulse">
        <FileText className="w-12 h-12 text-primary/50" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2">Processing Document</h3>
      <p className="text-muted-foreground mb-8 text-center max-w-xs">
        We are analyzing your file to make it chat-ready. This usually takes a few seconds.
      </p>

      <div className="w-full max-w-sm space-y-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isPending = index > currentStep;

          return (
            <div 
              key={index} 
              className={cn(
                "flex items-center gap-3 text-sm transition-all duration-300",
                isPending ? "opacity-40" : "opacity-100"
              )}
            >
              <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 animate-in zoom-in duration-300" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                )}
              </div>
              <span className={cn(
                "font-medium",
                isCurrent ? "text-foreground" : "text-muted-foreground"
              )}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}