import React from 'react';

// ==== SVG ICONS ====
const FolderIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
       strokeLinejoin="round" className={className}>
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
  </svg>
);

const FileIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
       strokeLinejoin="round" className={className}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
  </svg>
);

const ChevronRight = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
       strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
       strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

// ==== CHAPTER ITEM (Local Import for Subject's list) ====
// Note: We usually use the separate component, but if you keep it here for self-containment:
interface ChapterItemProps {
  chapter: { id: string; name: string };
  isActive: boolean;
  onSelect: () => void;
}

const ChapterItem = React.memo(function ChapterItem({ chapter, isActive, onSelect }: ChapterItemProps) {
  console.log(`🔹 Rendering Chapter: ${chapter.name} (${chapter.id})`);

  return (
    <li
      onClick={(e) => {
        console.log(`📚 Chapter clicked: ${chapter.name}`);
        e.stopPropagation(); // Prevent bubbling if needed
        onSelect();
      }}
      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all duration-200 ${
        isActive 
          ? "gradient-active shadow-sm" 
          : "gradient-hover text-muted-foreground hover:text-foreground hover:pl-3"
      }`}
    >
      <FileIcon className={`flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
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
  console.log(`📁 Rendering Subject: ${subject.name} (${subject.id})`);

  if (!Array.isArray(subject.chapters)) {
    console.error(`❌ subject.chapters is not an array for subject: ${subject.name}`);
    return null;
  }

  const chapterIds = subject.chapters.map((c) => c.id);
  const hasDuplicateChapterIds = new Set(chapterIds).size !== chapterIds.length;
  if (hasDuplicateChapterIds) {
    const duplicates = chapterIds.filter((id, idx) => chapterIds.indexOf(id) !== idx);
    console.warn(`⚠️ Duplicate chapter IDs in subject "${subject.name}":`, duplicates);
  }

  return (
    <div>
      {/* Subject Header */}
      <div
        onClick={() => {
          console.log(`📂 Subject toggled: ${subject.name}`);
          onToggle();
        }}
        // Updated: Use gradient-hover here for the folder row
        className="group flex items-center w-full gap-2 p-2 rounded-md gradient-hover text-left cursor-pointer transition-all duration-200"
      >
        <div className="flex items-center gap-2 flex-grow">
          <ChevronRight
            className={`flex-shrink-0 transform transition-all duration-200 text-muted-foreground ${
              isExpanded ? 'rotate-90 opacity-100 text-foreground' : 'rotate-0 opacity-70 group-hover:opacity-100'
            }`}
          />
          <FolderIcon className="flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="font-semibold text-card-foreground truncate group-hover:text-primary transition-colors">{subject.name}</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent toggle on add
            console.log(`➕ Add chapter clicked for subject: ${subject.name}`);
            onAddChapter(e);
          }}
          className="ml-auto p-1 rounded-md hover:bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        >
          <PlusIcon className="text-muted-foreground hover:text-primary" />
        </button>
      </div>

      {/* Chapters */}
      {isExpanded && (
        <ul className="pl-4 mt-1 space-y-1 border-l border-border/40 ml-3">
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