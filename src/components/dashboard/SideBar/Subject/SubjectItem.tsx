import React from 'react';
import { ChevronRight, ChevronDown, Folder, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

// ==== CHAPTER ITEM (Local Import for Subject's list) ====
// Note: We usually use the separate component, but if you keep it here for self-containment:
interface ChapterItemProps {
  chapter: { id: string; name: string };
  isActive: boolean;
  onSelect: () => void;
}

const ChapterItem = React.memo(function ChapterItem({ chapter, isActive, onSelect }: ChapterItemProps) {
  return (
    <li
      onClick={(e) => {
        e.stopPropagation(); // Prevent bubbling if needed
        onSelect();
      }}
      className={cn(
        "group flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm gradient-hover active-press cursor-pointer",
        isActive && "gradient-active"
      )}
    >
      <span className="truncate">{chapter.name}</span>
    </li>
  );
});

// ==== SUBJECT ITEM ====

interface SubjectItemProps {
  subject: {
    id: string;
    name: string;
    chapters: Array<{ id: string; name: string }>;
  };
  isExpanded: boolean;
  activeChapterId: string | null;
  onToggle: () => void;
  onSelectChapter: (id: string) => void;
  onAddChapter: (event: React.MouseEvent) => void;
}

export const SubjectItem = React.memo(function SubjectItem({
  subject,
  isExpanded,
  activeChapterId,
  onToggle,
  onSelectChapter,
  onAddChapter,
}: SubjectItemProps) {
  if (!Array.isArray(subject.chapters)) {
    return null;
  }

  return (
    <div>
      {/* Subject Header */}
      <div
        onClick={() => {
          onToggle();
        }}
        className={cn(
          "group flex items-center w-full gap-2 gradient-hover rounded-md px-2 py-1.5 text-sm text-left cursor-pointer transition-all duration-200"
        )}
      >
        <div className="flex items-center gap-2 flex-grow">
          {isExpanded ? (
            <ChevronDown size={14} className="flex-shrink-0 text-muted-foreground opacity-100 text-foreground" />
          ) : (
            <ChevronRight size={14} className="flex-shrink-0 text-muted-foreground opacity-70 group-hover:opacity-100" />
          )}
          <Folder size={16} className="flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="font-semibold text-card-foreground truncate group-hover:text-primary transition-colors">{subject.name}</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent toggle on add
            onAddChapter(e);
          }}
          className="ml-auto p-1 rounded-md hover:bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        >
          <Plus size={16} className="text-muted-foreground hover:text-primary" />
        </button>
      </div>

      {/* Chapters */}
      {isExpanded && (
        <ul className="pl-4 mt-1 flex flex-col gap-0.5 border-l border-border/40 ml-3">
          {subject.chapters.length === 0 ? (
            <li className="text-sm text-muted-foreground pl-4 py-1 italic opacity-50">No chapters yet</li>
          ) : (
            subject.chapters.map((chapter) => (
              <ChapterItem
                key={chapter.id}
                chapter={chapter}
                isActive={activeChapterId === chapter.id}
                onSelect={() => onSelectChapter(chapter.id)}
              />
            ))
          )}
        </ul>
      )}
    </div>
  );
});
