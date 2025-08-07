"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useNotebookStore } from "@/lib/store/useNotebook";
import { useDebounce } from "@/hooks/useDebounce";
import { SubjectItem } from "./SubjectItem";
import { ChapterItem } from "./ChapterItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewSubjectModal } from "./NewSubjectModal";
import { NewChapterModal } from "./NewChapterModal";

const SearchIcon = ({ className }: { className?: string }) => ( <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> );


export const InboxIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>

  
);

export const CollectionIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}>
    <rect width="8" height="8" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  </svg>
);

// Add this icon for your "Alone Chapters" heading
export const SparkleIcon = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}>
        <path d="M12 3L9.5 8.5L4 11L9.5 13.5L12 19L14.5 13.5L20 11L14.5 8.5L12 3z" />
        <path d="M5 3v4" />
        <path d="M19 17v4" />
        <path d="M3 5h4" />
        <path d="M17 19h4" />
    </svg>
);
const Spinner = () => (
  <svg
    className="animate-spin h-5 w-5 text-muted-foreground"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export function NotebookSidebar() {
  const { subjects, activeChapterId, setActiveChapter, fetchSubjects, isLoading, error } = useNotebookStore();
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [subjectForNewChapter, setSubjectForNewChapter] = useState<string | null>(null);

  const [isUncategorizedExpanded, setIsUncategorizedExpanded] = useState(false);

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects(prev => ({ ...prev, [subjectId]: !prev[subjectId] }));
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const filteredSubjects = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      const uniqueSubjects = Array.from(new Map(subjects.map(item => [item.id, item])).values());
      return uniqueSubjects;
    }

    const lowercasedQuery = debouncedSearchQuery.toLowerCase();
    const uniqueSource = Array.from(new Map(subjects.map(item => [item.id, item])).values());
    
    const results = uniqueSource.map(subject => {
        const subjectMatch = subject.name.toLowerCase().includes(lowercasedQuery);
        const matchingChapters = subject.chapters.filter(c => c.name.toLowerCase().includes(lowercasedQuery));
        if (subjectMatch || matchingChapters.length > 0) {
            return { ...subject, chapters: subjectMatch ? subject.chapters : matchingChapters };
        }
        return null;
    });

    return results.filter((subject): subject is NonNullable<typeof subject> => subject !== null);
  }, [subjects, debouncedSearchQuery]);

  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      const newExpandedState = Object.fromEntries(filteredSubjects.map(s => [s.id, true]));
      setExpandedSubjects(newExpandedState);
    }
  }, [debouncedSearchQuery, filteredSubjects]);

  const handleAddNewChapterClick = (event: React.MouseEvent, subjectId: string) => {
    event.stopPropagation();
    setSubjectForNewChapter(subjectId);
    setIsChapterModalOpen(true);
  };

  if (isLoading && subjects.length === 0) {
    return (
      <aside className="col-span-3 bg-card rounded-lg p-4 flex items-center justify-center h-full border border-border">
        <div className="text-center">
          <Spinner />
          <p className="mt-2 text-muted-foreground">Loading Your Notebook...</p>
        </div>
      </aside>
    );
  }

  if (error) {
    return <aside>Error: {error}</aside>;
  }
  
  // ✅ FIX: Move the separation logic here, right before rendering
  const uncategorized = filteredSubjects.find(s => s.id === 'uncategorized-chapters');
  const regularSubjects = filteredSubjects.filter(s => s.id !== 'uncategorized-chapters');

  return (
    <aside className="col-span-3 bg-card rounded-lg p-4 flex flex-col h-full overflow-y-auto border border-border">
      {/* Header and Controls */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-bold text-card-foreground">My Notebook</h2>
        {isLoading && <Spinner />}
      </div>
      
      <div className="flex gap-2 mb-4">
        <NewSubjectModal />
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => {
            setSubjectForNewChapter(null);
            setIsChapterModalOpen(true);
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
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-grow overflow-y-auto -mr-4 pr-4">

        {/* ✅ CORRECTED: "Alone Chapters" Section */}
        {uncategorized && uncategorized.chapters.length > 0 && (
          <div className="px-2 pt-2 pb-1">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
              <SparkleIcon />
              <span>Alone Chapters</span>
            </div>
            <ul className="space-y-1">
              {(isUncategorizedExpanded 
                ? uncategorized.chapters 
                : uncategorized.chapters.slice(0, 5)
              ).map(chapter => (
                <ChapterItem
                  key={chapter.id}
                  chapter={chapter}
                  isActive={activeChapterId === chapter.id}
                  onSelect={() => setActiveChapter(chapter.id)}
                />
              ))}
            </ul>
            
            {uncategorized.chapters.length > 5 && (
              <Button 
                variant="link" 
                className="p-0 h-auto mt-2 text-sm text-muted-foreground"
                onClick={() => setIsUncategorizedExpanded(!isUncategorizedExpanded)}
              >
                {isUncategorizedExpanded 
                  ? 'Show Less' 
                  : `Show ${uncategorized.chapters.length - 5} More...`}
              </Button>
            )}
            <hr className="my-4 border-border/20" />
          </div>
        )}

        {/* Subjects Section */}
        <div className="px-2 pt-2 pb-1">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
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
              <p className="px-2 text-sm text-muted-foreground">No subjects yet.</p>
            )}
          </div>
        </div>
      </div>

      <NewChapterModal
        isOpen={isChapterModalOpen}
        onOpenChange={setIsChapterModalOpen}
        defaultSubjectId={subjectForNewChapter}
      />
    </aside>
  );
}