"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useNotebookStore } from "@/lib/store/useNotebook";
import { useDebounce } from "@/hooks/useDebounce";
import { SubjectItem } from "./Subject/SubjectItem";
import { ChapterItem } from "./Chapter/ChapterItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewSubjectModal } from "./Subject/NewSubjectModal";
import { NewChapterModal } from "./Chapter/NewChapterModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
// import { getAccessToken } from "@/utils/storage";
import { SidebarSkeleton } from "./SidebarSkeleton";

import { SearchIcon, CollectionIcon } from "../Icons";
import { Plus, Loader2, PanelLeftClose, PanelLeftOpen, Files } from "lucide-react";
import { LayoutGroup, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface NotebookSidebarProps {
  /** Collapse the panel (shown when pinned open). */
  onCollapse?: () => void;
  /** Pin the panel open (shown in the floating hover-peek state). */
  onPin?: () => void;
  /** Rendering inside the floating peek overlay (transparent chrome). */
  floating?: boolean;
}

// const WS_BASE =
//   process.env.NEXT_PUBLIC_WS_URL ||
//   "wss://ragbag-backend-production.up.railway.app";
export function NotebookSidebar({ onCollapse, onPin, floating = false }: NotebookSidebarProps = {}) {
  const {
    subjects,
    activeChapterId,
    setActiveChapter,
    fetchSubjects,
    isLoading,
    error,
    ingestions,
    deleteSubject,
    deleteChapter,
  } = useNotebookStore();

  // In-flight uploads shown as live "Processing…" rows until they resolve
  // into real chapters. Once ready, the entry is dismissed and the real
  // chapter appears in the list below.
  const processingRows = Object.values(ingestions).filter(
    (i) => i.phase !== "ready",
  );

  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [subjectForNewChapter, setSubjectForNewChapter] = useState<string | null>(null);
  const [isUncategorizedExpanded, setIsUncategorizedExpanded] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<
    { kind: "subject" | "chapter"; id: string; name: string } | null
  >(null);

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects((prev) => ({ ...prev, [subjectId]: !prev[subjectId] }));
  };

  const requestDeleteSubject = (id: string, name: string) =>
    setPendingDelete({ kind: "subject", id, name });
  const requestDeleteChapter = (id: string, name: string) =>
    setPendingDelete({ kind: "chapter", id, name });

  const confirmDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.kind === "subject") {
      void deleteSubject(pendingDelete.id);
    } else {
      void deleteChapter(pendingDelete.id);
    }
  };

  // Initial Fetch
  useEffect(() => {
    fetchSubjects();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // WebSocket logic
  // useEffect(() => {
  //   const authToken = getAccessToken(); 
  //   if (!authToken) return;

  //   const ws = new WebSocket(`${WS_BASE}/ws/notifications/?token=${authToken}`);

  //   ws.onmessage = (event) => {
  //     try {
  //       const data = JSON.parse(event.data);
  //       if (data.message === "notebook_updated") {
  //         fetchSubjects(); 
  //       }
  //     } catch (e) {
  //       console.error("WebSocket error", e);
  //     }
  //   };
  //   return () => ws.close();
  // }, [fetchSubjects]);

  // Filter logic
  const filteredSubjects = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      const uniqueSubjects = Array.from(
        new Map(subjects.map((item) => [item.id, item])).values()
      );
      return uniqueSubjects;
    }

    const lowercasedQuery = debouncedSearchQuery.toLowerCase();
    const uniqueSource = Array.from(
      new Map(subjects.map((item) => [item.id, item])).values()
    );

    const results = uniqueSource.map((subject) => {
      const subjectMatch = subject.name.toLowerCase().includes(lowercasedQuery);
      const matchingChapters = subject.chapters.filter((c) =>
        c.name.toLowerCase().includes(lowercasedQuery)
      );
      if (subjectMatch || matchingChapters.length > 0) {
        return {
          ...subject,
          chapters: subjectMatch ? subject.chapters : matchingChapters,
        };
      }
      return null;
    });

    return results.filter(
      (subject): subject is NonNullable<typeof subject> => subject !== null
    );
  }, [subjects, debouncedSearchQuery]);

  // Search Expand logic
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      const newExpandedState = Object.fromEntries(
        filteredSubjects.map((s) => [s.id, true])
      );
      setExpandedSubjects(newExpandedState);
    }
  }, [debouncedSearchQuery, filteredSubjects]);

  const handleAddNewChapterClick = (event: React.MouseEvent, subjectId: string) => {
    event.stopPropagation();
    setSubjectForNewChapter(subjectId);
    setIsChapterModalOpen(true);
  };


  const uncategorizedSubject = filteredSubjects.find((s) => s.id === "uncategorized-chapters");
  const uncategorizedChapters = uncategorizedSubject?.chapters || [];
  const regularSubjects = filteredSubjects.filter(s => s.id !== "uncategorized-chapters");

  // --- RENDER ---
  return (
    <aside
      className={cn(
        "flex h-full flex-col overflow-y-auto p-4",
        floating ? "bg-transparent" : "border-r border-border/60 bg-background",
      )}
    >

      <div className="mb-4 flex items-center gap-2">
        <h2 className="pencil font-display text-lg font-semibold tracking-tight text-foreground">My Notebook</h2>
        {floating
          ? onPin && (
              <button
                type="button"
                onClick={onPin}
                aria-label="Keep notebook open"
                title="Keep open"
                className="active-press ml-auto flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <PanelLeftOpen className="size-4" />
              </button>
            )
          : onCollapse && (
              <button
                type="button"
                onClick={onCollapse}
                aria-label="Collapse notebook"
                title="Collapse notebook  (Ctrl/Cmd+B)"
                className="active-press ml-auto flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <PanelLeftClose className="size-4" />
              </button>
            )}
      </div>


      <div className="flex gap-2 mb-4">
        <NewSubjectModal />
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 active-press"
          onClick={() => {
            setSubjectForNewChapter(null);
            setIsChapterModalOpen(true)
            setActiveChapter(null);
          }}
        >
          <Plus size={16} />
          New Chapter
        </Button>
      </div>

      <div className="relative mb-4">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search notebook…"
          className="pl-10 rounded-xl bg-secondary/50 focus:bg-secondary transition-colors"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Main Content Area */}
      {isLoading && subjects.length === 0 ? (
        <SidebarSkeleton />
      ) : error ? (
        <div className="text-destructive text-sm p-2 text-center">{error}</div>
      ) : (
        <div className="flex-grow overflow-y-auto -mr-4 pr-4 animate-in fade-in duration-300">

          {/* Live ingestion rows */}
          {processingRows.length > 0 && (
            <ul className="flex flex-col px-4 pt-2 gap-0.5">
              {processingRows.map((ing) => (
                <li
                  key={ing.documentId}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground"
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                  <span className="truncate">
                    {ing.title || ing.filename}
                    <span className="text-muted-foreground/60">
                      {ing.phase === "failed"
                        ? " · failed"
                        : ` · ${ing.phase}`}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <LayoutGroup>
          {/* Loose Chapters Section */}
          {uncategorizedChapters.length > 0 && (
            <div className="px-2 pt-2 pb-1">
              <div className="mb-2 flex items-center gap-2 px-1">
                <Files className="size-3.5 text-muted-foreground" />
                <span className="font-mono text-micro uppercase tracking-wider text-muted-foreground">Loose chapters</span>
                <span className="ml-auto font-mono text-[11px] tabular-nums text-muted-foreground/50">
                  {uncategorizedChapters.length}
                </span>
              </div>
              <ul className="flex flex-col gap-0.5">
                <AnimatePresence initial={false}>
                  {(isUncategorizedExpanded
                    ? uncategorizedChapters
                    : uncategorizedChapters.slice(0, 5)
                  ).map((chapter, i) => (
                    <ChapterItem
                      key={chapter.id}
                      chapter={chapter}
                      index={i}
                      isActive={activeChapterId === chapter.id}
                      onSelect={() => setActiveChapter(chapter.id)}
                      onDelete={() => requestDeleteChapter(chapter.id, chapter.name)}
                    />
                  ))}
                </AnimatePresence>
              </ul>

              {uncategorizedChapters.length > 5 && (
                <button
                  type="button"
                  className="mt-2 ml-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground/70 transition-colors hover:text-primary"
                  onClick={() => setIsUncategorizedExpanded(!isUncategorizedExpanded)}
                >
                  {isUncategorizedExpanded
                    ? "Show less"
                    : `Show ${uncategorizedChapters.length - 5} more`}
                </button>
              )}
              <hr className="my-4 border-border/40" />
            </div>
          )}

          {/* Subjects Section */}
          <div className="px-2 pt-2 pb-1">
            <div className="mb-2 flex items-center gap-2 px-1">
              <CollectionIcon />
              <span className="font-mono text-micro uppercase tracking-wider text-muted-foreground">Subjects</span>
              {regularSubjects.length > 0 && (
                <span className="ml-auto font-mono text-[11px] tabular-nums text-muted-foreground/50">
                  {regularSubjects.length}
                </span>
              )}
            </div>
            {regularSubjects.length > 0 ? (
              <div className="flex flex-col gap-0.5">
                <AnimatePresence initial={false}>
                  {regularSubjects.map((subject) => (
                    <SubjectItem
                      key={subject.id}
                      subject={subject}
                      isExpanded={!!expandedSubjects[subject.id]}
                      activeChapterId={activeChapterId}
                      onToggle={() => toggleSubject(subject.id)}
                      onSelectChapter={setActiveChapter}
                      onAddChapter={(e) => handleAddNewChapterClick(e, subject.id)}
                      onDeleteSubject={requestDeleteSubject}
                      onDeleteChapter={requestDeleteChapter}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="mt-1 flex flex-col items-center gap-2.5 rounded-xl border border-dashed border-border/70 px-4 py-7 text-center">
                <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground [&_svg]:size-4">
                  <CollectionIcon />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground/80">No subjects yet</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    Group related chapters into a subject to keep things tidy.
                  </p>
                </div>
              </div>
            )}
          </div>
          </LayoutGroup>
        </div>
      )}

      <NewChapterModal
        isOpen={isChapterModalOpen}
        onOpenChange={setIsChapterModalOpen}
        defaultSubjectId={subjectForNewChapter}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={pendingDelete ? `Delete "${pendingDelete.name}"?` : ""}
        description={
          pendingDelete?.kind === "subject"
            ? "This removes the subject and all of its chapters and documents. This can't be undone."
            : "This removes the chapter and all of its documents. This can't be undone."
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </aside>
  );
}