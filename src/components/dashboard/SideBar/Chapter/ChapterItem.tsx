import React from 'react';

const FileIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
       strokeLinejoin="round" className={className}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
  </svg>
);

interface ChapterItemProps {
  chapter: { id: string; name: string };
  isActive: boolean;
  onSelect: () => void;
}
export const ChapterItem = React.memo(function ChapterItem({ chapter, isActive, onSelect }: ChapterItemProps) {
  return (
    <li
      onClick={onSelect}
      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
        isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50 text-muted-foreground"
      }`}
    >
      <FileIcon className="text-muted-foreground flex-shrink-0" />
      <span className="truncate">{chapter.name}</span>
    </li>
  );
});