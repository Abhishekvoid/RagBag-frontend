import React from 'react';
import { EmptyState } from './EmptyState';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';
import { uploadDocument } from '@/features/notebook/api';


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



export function AddSourceView({ onSourceAdded }: { onSourceAdded:()=> void}) {

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async(e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return ;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await uploadDocument(formData);
     console.log("data", res);
      onSourceAdded(); 

    } catch (err){
      alert("Error Uploading file.")
    }
  }
  return (
    <div>
    <EmptyState
      icon={<UploadIcon />}
      title="Add a source to get started"
      description="Upload documents like PDFs, Word files, and more to begin chatting with your notes."
    >

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <Button className="mt-6" onClick={() => fileInputRef.current?.click()}>
        Upload a Source
      </Button>
    </EmptyState>
    </div>
  );
}