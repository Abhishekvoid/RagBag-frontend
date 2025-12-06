"use client";

import { useState, useEffect } from "react";
import { Loader2, BrainCircuit, Search, Database, FileText, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GrainOverlay } from "@/components/ui/GrainOverlay";

const steps = [
  { text: "Analyzing document structure...", icon: FileText },
  { text: "Extracting semantic concepts...", icon: BrainCircuit },
  { text: "Generating vector embeddings...", icon: Database },
  { text: "Indexing knowledge base...", icon: Search },
  { text: "Finalizing study materials...", icon: Sparkles },
];

export function ProcessingState() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        // Stop at the last step, don't loop
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 2000); // Slower pace for that "thinking" feel

    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = steps[currentStepIndex].icon;

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full overflow-hidden">
      {/* Background Ambiance */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-background/50 z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] animate-pulse z-0" />
      <GrainOverlay intensity="subtle" className="opacity-30" />

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-md text-center">
        
        {/* Central Orb / Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
          <div className="relative w-20 h-20 bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
             <AnimatePresence mode="wait">
                <motion.div
                  key={currentStepIndex}
                  initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
                  transition={{ duration: 0.4 }}
                >
                  <CurrentIcon className="w-8 h-8 text-primary" />
                </motion.div>
             </AnimatePresence>
          </div>
          {/* Orbiting Loader Ring */}
          <div className="absolute inset-[-10px] border border-primary/20 rounded-3xl animate-spin-slow opacity-50" style={{ animationDuration: '10s' }} />
        </div>

        {/* Text Stream */}
        <div className="h-16 flex flex-col items-center justify-start overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center gap-2"
            >
              <h3 className="text-lg font-medium tracking-tight text-foreground">
                {steps[currentStepIndex].text}
              </h3>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-0" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-150" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-300" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Static Disclaimer */}
        <p className="text-xs text-muted-foreground/50 uppercase tracking-widest animate-pulse">
          Processing RAG Pipeline
        </p>

      </div>
    </div>
  );
}