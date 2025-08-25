import React from "react";
import { EmptyState } from "./EmptyState";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { notebookApi } from "@/features/notebook/notebook.api";
import { Chapter } from "@/lib/store/useNotebook";

// ✅ The requested UploadIcon component
const UploadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-primary"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export interface AddSourceViewProps {
  onSourceAdded: () => void;
  chapter?: Chapter;
}

export function AddSourceView({ onSourceAdded, chapter }: AddSourceViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !chapter ) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    

    try {
      await notebookApi.uploadDocument(formData);
      onSourceAdded();
    } catch (err) {
      alert("Error Uploading file.");
    }
  };

  const document = chapter?.documents?.[0];
  return (
    <div>
      <EmptyState
        icon={<UploadIcon />}
        title={
          chapter
            ? `Add a source to "${chapter.name}"`
            : "Add a source to get started"
        }
        description={
          chapter
            ? "Upload a document to begin chatting."
            : "Select or create a chapter to begin."
        }
      >
        {document?.status === "PROCESSING" && (
          <p className="mt-4 text-primary"> Analyzing your document...</p>
        )}
        {document?.status === "FAILED" && (
          <p className="mt-4 text-destructive">
            {" "}
            Error: {document.error_message}
          </p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          className="hidden"
        />

        <Button className="mt-6" onClick={() => fileInputRef.current?.click()} >
          Upload a Source  
        </Button>
      </EmptyState>
    </div>
  );
}
