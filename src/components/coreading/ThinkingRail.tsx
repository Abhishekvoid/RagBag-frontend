"use client";

import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { MessageSquare, NotebookPen } from "lucide-react";
import { useCoReadingStore } from "@/lib/store/useCoReading";
import { ChatTab } from "./ChatTab";
import { NotesTab } from "./NotesTab";
import type { Chapter } from "@/lib/store/useNotebook";
import { cn } from "@/lib/utils";

export function ThinkingRail({
  chapter,
  docTitles,
}: {
  chapter: Chapter;
  docTitles: Record<string, string>;
}) {
  const tab = useCoReadingStore((s) => s.tab);
  const setTab = useCoReadingStore((s) => s.setTab);
  const noteCount = useCoReadingStore((s) => s.notesByChapter[chapter.id])?.length ?? 0;
  const reduce = useReducedMotion();

  return (
    <div className="flex h-full flex-col bg-card/40">
      {/* Segmented toggle */}
      <div className="shrink-0 border-b border-border px-3 py-3">
        <div className="flex rounded-xl border border-border bg-background/60 p-0.5">
          <SegBtn active={tab === "chat"} onClick={() => setTab("chat")}>
            <MessageSquare size={14} /> Chat
          </SegBtn>
          <SegBtn active={tab === "notes"} onClick={() => setTab("notes")}>
            <NotebookPen size={14} /> Notes
            {noteCount > 0 && (
              <span
                className={cn(
                  "ml-0.5 rounded-full px-1.5 py-px font-mono text-[10px]",
                  tab === "notes"
                    ? "bg-primary/15 text-primary"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {noteCount}
              </span>
            )}
          </SegBtn>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            className="h-full"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -5 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {tab === "chat" ? (
              <ChatTab chapter={chapter} />
            ) : (
              <NotesTab chapterId={chapter.id} docTitles={docTitles} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function SegBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-1.5 text-[13px] font-medium transition-colors",
        active
          ? "bg-secondary text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
