"use client";

import React, { useState, useRef } from "react";
import { notebookApi } from "@/features/notebook/notebook.api";
import { Chapter, useNotebookStore } from "@/lib/store/useNotebook";
import { UploadCloud, FileText, X, Loader2, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AddSourceViewProps {
  onSourceAdded: () => void;
  chapter?: Chapter;
}

export function AddSourceView({ onSourceAdded, chapter }: AddSourceViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- HANDLERS ---

  const fetchSubjects = useNotebookStore((state) => state.fetchSubjects);

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    
    console.log("📂 File selected:", file.name); 
    
    setError(null);
    setIsUploading(true);
  

    const formData = new FormData();
    formData.append("file", file);
    if (chapter?.id) {
      formData.append("chapter", chapter.id);
    }

    try {
      console.log("🚀 Uploading...");
      await notebookApi.uploadDocument(formData);
      console.log("✅ Upload success");
      
      
      await fetchSubjects();
      setIsUploading(false);
      
      
    } catch (err) {
      console.error("❌ Upload failed:", err);
      setError("Upload failed. Please try a valid PDF or DOCX.");
      setIsUploading(false);

    }
  };



  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // --- RENDER ---

   return (
    <div className="flex flex-col items-center justify-center h-full w-full p-6">
      <div className="w-full max-w-lg">
        
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {chapter ? "Add Knowledge Source" : "Start Your Notebook"}
          </h2>
          <p className="text-muted-foreground text-sm">
            Upload a PDF, DOCX, or TXT file to begin the analysis.
          </p>
        </div>

        <motion.div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          layout
          className={cn(
            "relative group cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ease-out",
            "bg-card/50 h-64 flex flex-col items-center justify-center gap-4",
            isDragActive 
              ? "border-primary bg-primary/5 scale-[1.02] shadow-2xl shadow-primary/10" 
              : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30",
            error && "border-destructive/50 bg-destructive/5"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={(e) => {
                if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                e.target.value = ""; // Reset input
            }}
            className="hidden"
            disabled={isUploading}
          />

          <AnimatePresence mode="wait">
            {isUploading ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                  <Loader2 className="w-12 h-12 text-primary animate-spin relative z-10" />
                </div>
                <p className="text-sm font-medium text-muted-foreground animate-pulse">
                  Uploading to secure storage...
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center gap-4 text-center"
              >
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
                  isDragActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:scale-110 group-hover:text-foreground"
                )}>
                  {isDragActive ? (
                    <ArrowUp className="w-8 h-8 animate-bounce" />
                  ) : (
                    <UploadCloud className="w-8 h-8" />
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {isDragActive ? "Drop it like it's hot!" : "Click to upload or drag & drop"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    MAX 50MB • PDF, DOCX, TXT
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isUploading && (
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
          )}
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-between text-sm text-destructive"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" /> {error}
              </span>
              <button onClick={() => setError(null)} className="hover:text-destructive/80">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}