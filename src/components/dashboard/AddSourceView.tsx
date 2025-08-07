import React from 'react';
import { EmptyState } from './EmptyState';
import { Button } from '@/components/ui/button';

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

interface AddSourceViewProps {
  onSourceAdded: () => void;
}

export function AddSourceView({ onSourceAdded }: AddSourceViewProps) {
  return (
    <EmptyState
      icon={<UploadIcon />}
      title="Add a source to get started"
      description="Upload documents like PDFs, Word files, and more to begin chatting with your notes."
    >
      {/* This Button is now correctly passed as 'children' */}
      <Button className="mt-6" onClick={onSourceAdded}>
        Upload a Source
      </Button>
    </EmptyState>
  );
}