"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { FileText, Trash2 } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

interface ChapterItemProps {
  chapter: { id: string; name: string };
  isActive: boolean;
  onSelect: () => void;
  /** Position in its list — drives the entrance stagger. */
  index?: number;
  /** When provided, renders a hover-revealed delete button. */
  onDelete?: () => void;
}

const spring = { type: "spring" as const, stiffness: 480, damping: 40 };

export const ChapterItem = React.memo(function ChapterItem({
  chapter,
  isActive,
  onSelect,
  index = 0,
  onDelete,
}: ChapterItemProps) {
  const reduce = useReducedMotion();

  return (
    <motion.li
      layout
      onClick={onSelect}
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={
        reduce
          ? { opacity: 0 }
          : { opacity: 0, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }
      }
      transition={{ duration: 0.28, delay: Math.min(index, 8) * 0.035, ease: [0.16, 1, 0.3, 1] }}
      whileTap={reduce ? undefined : { scale: 0.985 }}
      className={cn(
        "group relative flex w-full cursor-pointer items-center gap-2.5 overflow-hidden rounded-lg px-2.5 py-2 text-sm",
        isActive
          ? "font-medium text-foreground"
          : "text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground",
      )}
    >
      {/* Active state — a single shared background + rule that slides between
          rows via layout animation. Only the active row mounts these, so
          Framer animates them from the previously-active row's position. */}
      {isActive && (
        <>
          <motion.span
            layoutId="chapter-active-bg"
            className="absolute inset-0 -z-10 rounded-lg bg-primary/10"
            transition={spring}
          />
          <motion.span
            layoutId="chapter-active-rule"
            aria-hidden
            className="absolute bottom-0 left-0 top-0 my-auto h-4 w-[3px] rounded-full bg-primary"
            transition={spring}
          />
        </>
      )}

      <motion.span
        aria-hidden
        className="shrink-0"
        whileHover={reduce ? undefined : { scale: 1.15, rotate: -4 }}
        transition={{ type: "spring", stiffness: 400, damping: 12 }}
      >
        <FileText
          className={cn(
            "size-4 transition-colors",
            isActive ? "text-primary" : "text-muted-foreground/50 group-hover:text-muted-foreground",
          )}
        />
      </motion.span>

      <span className="min-w-0 flex-1 truncate">{chapter.name}</span>

      {onDelete && (
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
      )}
    </motion.li>
  );
});
