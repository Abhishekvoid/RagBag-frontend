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
import { getAccessToken } from "@/utils/storage";
import { SidebarSkeleton } from "./SidebarSkeleton"; 

import { SearchIcon, CollectionIcon, SparkleIcon } from "../Icons";

const WS_BASE =
  process.env.NEXT_PUBLIC_WS_URL ||
  "wss://ragbag-backend-production.up.railway.app";
export function NotebookSidebar() {
  const {
    subjects,
    activeChapterId,
    setActiveChapter,
    fetchSubjects,
    isLoading,
    error,
  } = useNotebookStore();
  
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [subjectForNewChapter, setSubjectForNewChapter] = useState<string | null>(null);
  const [isUncategorizedExpanded, setIsUncategorizedExpanded] = useState(false);

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects((prev) => ({ ...prev, [subjectId]: !prev[subjectId] }));
  };

  // Initial Fetch
  useEffect(() => {
    fetchSubjects();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // WebSocket logic
  useEffect(() => {
    const authToken = getAccessToken(); 
    if (!authToken) return;

    const ws = new WebSocket(`${WS_BASE}/ws/notifications/?token=${authToken}`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.message === "notebook_updated") {
          fetchSubjects(); 
        }
      } catch (e) {
        console.error("WebSocket error", e);
      }
    };
    return () => ws.close();
  }, [fetchSubjects]);

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

  // --- FIX: Safe Data Extraction ---
  // We extract these variables here so we don't need confusing optional chaining in the JSX
  const uncategorizedSubject = filteredSubjects.find((s) => s.id === "uncategorized-chapters");
  // If undefined, default to empty array. No '!' needed.
  const uncategorizedChapters = uncategorizedSubject?.chapters || [];
  
  const regularSubjects = filteredSubjects.filter(s => s.id !== "uncategorized-chapters");

  // --- RENDER ---

  return (
    <aside className="col-span-3 bg-card rounded-lg p-4 flex flex-col h-full overflow-y-auto border border-border">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-bold text-card-foreground tracking-tight">My Notebook</h2>
      </div>

      {/* Controls */}
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
          New Chapter
        </Button>
      </div>

      <div className="relative mb-4">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search..."
          className="pl-10 bg-background/50 focus:bg-background transition-colors"
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
          
          {/* "Alone Chapters" Section */}
          {uncategorizedChapters.length > 0 && (
            <div className="px-2 pt-2 pb-1">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                <SparkleIcon />
                <span>Alone Chapters</span>
              </div>
              <ul className="space-y-1">
                {(isUncategorizedExpanded
                  ? uncategorizedChapters
                  : uncategorizedChapters.slice(0, 5)
                ).map((chapter) => (
                  <ChapterItem
                    key={chapter.id}
                    chapter={chapter}
                    isActive={activeChapterId === chapter.id}
                    onSelect={() => setActiveChapter(chapter.id)}
                  />
                ))}
              </ul>

              {uncategorizedChapters.length > 5 && (
                <Button
                  variant="link"
                  className="p-0 h-auto mt-2 text-sm text-muted-foreground"
                  onClick={() => setIsUncategorizedExpanded(!isUncategorizedExpanded)}
                >
                  {isUncategorizedExpanded ? "Show Less" : "Show More..."}
                </Button>
              )}
              <hr className="my-4 border-border/40" />
            </div>
          )}

          {/* Subjects Section */}
          <div className="px-2 pt-2 pb-1">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              <CollectionIcon />
              <span>Subjects</span>
            </div>
            <div className="space-y-1">
              {regularSubjects.length > 0 ? (
                regularSubjects.map((subject) => (
                  <SubjectItem
                    key={subject.id}
                    subject={subject}
                    isExpanded={!!expandedSubjects[subject.id]}
                    activeChapterId={activeChapterId}
                    onToggle={() => toggleSubject(subject.id)}
                    onSelectChapter={setActiveChapter}
                    onAddChapter={(e) => handleAddNewChapterClick(e, subject.id)}
                  />
                ))
              ) : (
                <p className="px-2 text-sm text-muted-foreground italic">
                  No subjects yet. Create one!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <NewChapterModal
        isOpen={isChapterModalOpen}
        onOpenChange={setIsChapterModalOpen}
        defaultSubjectId={subjectForNewChapter}
      />
    </aside>
  );
}