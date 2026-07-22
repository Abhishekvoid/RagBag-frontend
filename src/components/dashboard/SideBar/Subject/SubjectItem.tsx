import React from 'react';
import { ChevronRight, ChevronDown, Folder, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

// ==== CHAPTER ITEM (Local Import for Subject's list) ====
// Note: We usually use the separate component, but if you keep it here for self-containment:
interface ChapterItemProps {
  chapter: { id: string; name: string };
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const ChapterItem = React.memo(function ChapterItem({ chapter, isActive, onSelect, onDelete }: ChapterItemProps) {
  const reduce = useReducedMotion();
  return (
    <motion.li
      layout
      exit={
        reduce
          ? { opacity: 0 }
          : { opacity: 0, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }
      }
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      onClick={(e) => {
        e.stopPropagation(); // Prevent bubbling if needed
        onSelect();
      }}
      className={cn(
        "group flex items-center gap-2 w-full overflow-hidden rounded-md px-2 py-1.5 text-sm gradient-hover active-press cursor-pointer",
        isActive && "gradient-active"
      )}
    >
      <span className="min-w-0 flex-1 truncate">{chapter.name}</span>
      <button
        type="button"
        aria-label={`Delete chapter ${chapter.name}`}
        title="Delete chapter"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="ml-auto flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
      >
        <Trash2 className="size-3.5" />
      </button>
    </motion.li>
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
  onDeleteSubject: (id: string, name: string) => void;
  onDeleteChapter: (id: string, name: string) => void;
}

export const SubjectItem = React.memo(function SubjectItem({
  subject,
  isExpanded,
  activeChapterId,
  onToggle,
  onSelectChapter,
  onAddChapter,
  onDeleteSubject,
  onDeleteChapter,
}: SubjectItemProps) {
  const reduce = useReducedMotion();

  if (!Array.isArray(subject.chapters)) {
    return null;
  }

  return (
    <motion.div
      layout
      exit={
        reduce
          ? { opacity: 0 }
          : { opacity: 0, height: 0, marginTop: 0 }
      }
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
    >
      {/* Subject Header */}
      <div
        onClick={() => {
          onToggle();
        }}
        className={cn(
          "group flex items-center w-full gap-2 gradient-hover rounded-md px-2 py-1.5 text-sm text-left cursor-pointer transition-all duration-200"
        )}
      >
        <div className="flex min-w-0 flex-grow items-center gap-2">
          {isExpanded ? (
            <ChevronDown size={14} className="flex-shrink-0 text-muted-foreground opacity-100 text-foreground" />
          ) : (
            <ChevronRight size={14} className="flex-shrink-0 text-muted-foreground opacity-70 group-hover:opacity-100" />
          )}
          <Folder size={16} className="flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="min-w-0 flex-1 truncate font-semibold text-card-foreground group-hover:text-primary transition-colors">{subject.name}</span>
        </div>

        <div className="ml-auto flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent toggle on add
              onAddChapter(e);
            }}
            aria-label="Add chapter"
            title="Add chapter"
            className="p-1 rounded-md hover:bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          >
            <Plus size={16} className="text-muted-foreground hover:text-primary" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent toggle on delete
              onDeleteSubject(subject.id, subject.name);
            }}
            aria-label={`Delete subject ${subject.name}`}
            title="Delete subject"
            className="p-1 rounded-md hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          >
            <Trash2 size={15} className="text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      </div>

      {/* Chapters */}
      {isExpanded && (
        <ul className="pl-4 mt-1 flex flex-col gap-0.5 border-l border-border/40 ml-3">
          {subject.chapters.length === 0 ? (
            <li className="text-sm text-muted-foreground pl-4 py-1 italic opacity-50">No chapters yet</li>
          ) : (
            <AnimatePresence initial={false}>
              {subject.chapters.map((chapter) => (
                <ChapterItem
                  key={chapter.id}
                  chapter={chapter}
                  isActive={activeChapterId === chapter.id}
                  onSelect={() => onSelectChapter(chapter.id)}
                  onDelete={() => onDeleteChapter(chapter.id, chapter.name)}
                />
              ))}
            </AnimatePresence>
          )}
        </ul>
      )}
    </motion.div>
  );
});
