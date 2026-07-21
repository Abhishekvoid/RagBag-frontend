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

  const startIngestion = useNotebookStore((state) => state.startIngestion);
  const setUploadPercent = useNotebookStore((state) => state.setUploadPercent);
  const dismissIngestion = useNotebookStore((state) => state.dismissIngestion);

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

    // Optimistic entry under a temp id so the UI never blanks out.
    const tempId = `temp-${Date.now()}`;
    startIngestion(tempId, file.name);

    try {
      console.log("🚀 Uploading...");
      const res = await notebookApi.uploadDocument(formData, (percent) => {
        setUploadPercent(tempId, percent);
      });
      console.log("✅ Upload success");

      // Rebind temp -> real document id so WS events (keyed by the real id) match.
      const realId = res.data.id;
      const store = useNotebookStore.getState();
      if (store.ingestions[tempId]) {
        store.startIngestion(realId, file.name);
        store.setUploadPercent(realId, 100);
        store.dismissIngestion(tempId);
      }

      setIsUploading(false);
    } catch (err) {
      console.error("❌ Upload failed:", err);
      dismissIngestion(tempId);
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
          <h2 className="pencil font-display text-2xl font-semibold tracking-tight text-foreground">
            {chapter ? "Add a source" : "Start your notebook"}
          </h2>
          <p className="text-muted-foreground text-sm">
            Drop in a PDF, DOCX, or TXT and StudyWise starts reading it.
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
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm font-medium text-muted-foreground">
                  Uploading to secure storage…
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
                    {isDragActive ? "Drop to upload" : "Click to upload or drag & drop"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Max 50MB · PDF, DOCX, TXT
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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