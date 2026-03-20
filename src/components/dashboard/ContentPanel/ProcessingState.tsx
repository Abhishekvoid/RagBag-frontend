"use client";

import { useState, useEffect } from "react";
import {
  BrainCircuit,
  Search,
  Database,
  FileText,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GrainOverlay } from "@/components/ui/GrainOverlay";

const steps = [
  { text: "Analyzing document structure", icon: FileText },
  { text: "Extracting semantic concepts", icon: BrainCircuit },
  { text: "Generating embeddings", icon: Database },
  { text: "Indexing knowledge base", icon: Search },
  { text: "Finalizing study materials", icon: Sparkles },
];

export function ProcessingState() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = steps[currentStepIndex].icon;

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full overflow-hidden px-6">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-background/50 z-0" />
      <div className="absolute w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] animate-pulse z-0" />
      <GrainOverlay intensity="subtle" className="opacity-30" />

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-md text-center">

        {/* 🔥 Header (NEW - PRODUCT FEEL) */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Preparing your document
          </h2>
          <p className="text-sm text-muted-foreground">
            AI is building your knowledge base
          </p>
        </div>

        {/* Orb */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />

          <div className="relative w-20 h-20 bg-card/60 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
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

          <div className="absolute inset-[-10px] border border-primary/20 rounded-3xl animate-spin-slow opacity-50" style={{ animationDuration: "10s" }} />
        </div>

        {/* Current Step */}
        <div className="h-16 flex flex-col items-center justify-start overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-2"
            >
              <h3 className="text-base font-medium text-foreground">
                {steps[currentStepIndex].text}
              </h3>

              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-150" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-300" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 🔥 NEW: Progress Steps (THIS MAKES IT FEEL REAL) */}
        <div className="w-full space-y-2 mt-2">
          {steps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isDone = index < currentStepIndex;

            return (
              <div
                key={index}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all
                ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : isDone
                    ? "text-muted-foreground/60"
                    : "text-muted-foreground/40"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full
                  ${
                    isActive
                      ? "bg-primary animate-pulse"
                      : isDone
                      ? "bg-primary/40"
                      : "bg-muted"
                  }`}
                />
                {step.text}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground/50 uppercase tracking-widest mt-2">
          RAG pipeline processing
        </p>
      </div>
    </div>
  );
}