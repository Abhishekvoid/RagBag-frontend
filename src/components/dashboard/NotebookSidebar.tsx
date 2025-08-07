"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useNotebookStore } from "@/lib/store/useNotebook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewSubjectModal } from "./NewSubjectModal";
import { NewChapterModal } from "./NewChapterModal";

const FolderIcon = ({ className }: { className?: string }) => ( /* Full SVG code here */ <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path></svg> );
const FileIcon = ({ className }: { className?: string }) => ( /* Full SVG code here */ <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg> );
const ChevronRight = ({ className }: { className?: string }) => ( /* Full SVG code here */ <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6" /></svg> );
const SearchIcon = ({ className }: { className?: string }) => ( /* Full SVG code here */ <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> );
const PlusIcon = ({ className }: { className?: string }) => ( /* Full SVG code here */ <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> );

export function NotebookSidebar() {
  const { subjects, activeChapterId, setActiveChapter, fetchSubjects, isLoading, error } = useNotebookStore();
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [subjectForNewChapter, setSubjectForNewChapter] = useState<string | null>(null);

  const toggleSubject = (subjectId: string) => { setExpandedSubjects(prev => ({...prev, [subjectId]: !prev[subjectId]})); };

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjects;
    const lowercasedQuery = searchQuery.toLowerCase();
    return subjects.map(subject => {
      const subjectMatch = subject.name.toLowerCase().includes(lowercasedQuery);
      const matchingChapters = subject.chapters.filter(c => c.name.toLowerCase().includes(lowercasedQuery));
      if (subjectMatch || matchingChapters.length > 0) {
        return { ...subject, chapters: subjectMatch ? subject.chapters : matchingChapters };
      }
      return null;
    }).filter((s): s is NonNullable<typeof s> => s !== null);
  }, [subjects, searchQuery]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const newExpandedState: Record<string, boolean> = {};
      for (const subject of filteredSubjects) { newExpandedState[subject.id] = true; }
      setExpandedSubjects(newExpandedState);
    }
  }, [searchQuery, filteredSubjects]);

  const handleAddNewChapterClick = (event: React.MouseEvent, subjectId: string) => {
    event.stopPropagation();
    setSubjectForNewChapter(subjectId);
    setIsChapterModalOpen(true);
  };

  if (isLoading) { return <aside className="...loading state...">...</aside>; }
  if (error) { return <aside className="...error state...">...</aside>; }

  return (
    <aside className="col-span-3 bg-card rounded-lg p-4 flex flex-col h-full overflow-y-auto border border-border">
      <h2 className="text-xl font-bold mb-4 text-card-foreground">
        My Notebook
      </h2>
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
          placeholder="Search subjects or chapters..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="px-2 py-1">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground">Your Subjects</h3>
      </div>

      <div className="space-y-1 mt-2">
        {/* --- The OUTER loop for subjects --- */}
        {filteredSubjects.map((subject) => {
          // DEBUGGING LINE: Check the chapter IDs for this subject
          console.log(
            `Chapters for subject "${subject.name}":`,
            subject.chapters.map(c => c.id)
          );

          return (
            <div key={subject.id}> 
              <div
                onClick={() => toggleSubject(subject.id)}
                className="group flex items-center w-full gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 flex-grow">
                  <ChevronRight
                    className={`
                      flex-shrink-0
                      transform transition-all duration-200
                      ${expandedSubjects[subject.id] ? 'rotate-90' : 'rotate-0'}
                      ${expandedSubjects[subject.id] ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                    `}
                  />
                  <FolderIcon className="flex-shrink-0" />
                  <span className="font-semibold text-card-foreground truncate">{subject.name}</span>
                </div>
                <button
                  onClick={(e) => handleAddNewChapterClick(e, subject.id)}
                  className="ml-auto p-1 rounded-md hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                >
                  <PlusIcon className="text-muted-foreground" />
                </button>
              </div>
              
              {expandedSubjects[subject.id] && (
                <ul className="pl-12 mt-1 space-y-1">
                  {/* --- The INNER loop for chapters --- */}
                  {subject.chapters.map((chapter) => (
                    <li
                      key={chapter.id}
                      onClick={() => setActiveChapter(chapter.id)}
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                        activeChapterId === chapter.id
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50 text-muted-foreground"
                      }`}
                    >
                      <FileIcon className="text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{chapter.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <NewChapterModal
        isOpen={isChapterModalOpen}
        onOpenChange={setIsChapterModalOpen}
        defaultSubjectId={subjectForNewChapter}
      />
    </aside>
  );
}