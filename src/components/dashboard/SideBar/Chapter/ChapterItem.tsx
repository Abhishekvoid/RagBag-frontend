import React from 'react';
import { cn } from '@/lib/utils';

interface ChapterItemProps {
  chapter: { id: string; name: string };
  isActive: boolean;
  onSelect: () => void;
}
export const ChapterItem = React.memo(function ChapterItem({ chapter, isActive, onSelect }: ChapterItemProps) {
  return (
    <li
      onClick={onSelect}
      className={cn(
        "group flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm gradient-hover active-press cursor-pointer",
        isActive && "gradient-active"
      )}
    >
      {/* No index available in this component's scope — mono number omitted (see task report) */}
      <span className="truncate">{chapter.name}</span>
    </li>
  );
});
