import { create } from "zustand";
import {
  notebookApi,
  SubjectDTO,
  ChapterDTO,
} from "@/features/notebook/notebook.api";
import {
  SubjectInput,
  ChapterInput,
} from "@/features/notebook/notebook.schema";

// ============ types =============
export type Chapter = ChapterDTO & {
  chatHistory: { role: "user" | "ai"; text: string }[];
};

type Subject = Omit<SubjectDTO, "chapters"> & {
  chapters: Chapter[];
};

type NotebookState = {
  subjects: Subject[];
  activeChapterId: string | null;
  isLoading: boolean;
  error: string | null;
};

type NotebookActions = {
  fetchSubjects: () => Promise<void>;
  addSubject: (data: SubjectInput) => Promise<void>;
  updateSubject: (id: string, data: Partial<SubjectInput>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  addChapter: (data: ChapterInput) => Promise<void>;
  setActiveChapter: (chapterId: string | null) => void;
  getActiveChapter: () => Chapter | null;
};

// ==== STORE ===========
export const useNotebookStore = create<NotebookState & NotebookActions>(
  (set, get) => ({
    subjects: [],
    activeChapterId: null,
    isLoading: false,
    error: null,

    // --- ACTIONS ---
    fetchSubjects: async () => {
      set({ isLoading: true, error: null });
      try {
        const subjectsFromApi = await notebookApi.fetchSubjects();
        const uniqueSubjects = Array.from(new Map(subjectsFromApi.map(subject => [subject.id, subject])).values());
        const subjectsWithChat = uniqueSubjects.map((subject) => ({
          ...subject,
          chapters: subject.chapters.map((chapter) => ({
            ...chapter,
            chatHistory: [],
          })),
        }));
        set({ subjects: subjectsWithChat, isLoading: false });
      } catch (error) {
        console.error("Zustand Store Error - Failed to fetch subjects:", error);
        set({
          error: "Failed to load your notebook. Please try again.",
          isLoading: false,
        });
      }
    },

    addSubject: async (data: SubjectInput) => {
      try {
        const response = await notebookApi.createSubject(data);
        const newSubjectFromApi = response.data;

        set((state) => {
          // Check if a subject with this ID already exists
          const subjectExists = state.subjects.some(
            (subject) => subject.id === newSubjectFromApi.id
          );
          
          if (subjectExists) {
            return {};
          }
        
          return {
            subjects: [...state.subjects, { ...newSubjectFromApi, chapters: [] }],
          };
        });
      } catch (error) {
        console.error("Zustand Store Error - Failed to create subject:", error);
        throw new Error("Could not create the subject on the server.");
      }
    },

    updateSubject: async (id: string, data: Partial<SubjectInput>) => {
      try {
        const response = await notebookApi.updateSubject(id, data);
        const updatedSubjectFromApi = response.data;
    
        set((state) => ({
          subjects: state.subjects.map((subject) => {
           
            if (subject.id === id) {
              
              const { chapters, ...restOfApiData } = updatedSubjectFromApi;
    
           
              return { ...subject, ...restOfApiData };
            }
           
            return subject;
          }),
        }));
      } catch (error) {
        console.error("Zustand Store Error - Failed to update subject:", error);
        throw new Error("Could not update the subject.");
      }
    },

    deleteSubject: async (id: string) => {
      try {
       
        await notebookApi.deleteSubject(id);
        set((state) => ({
          subjects: state.subjects.filter((subject) => subject.id !== id),
        }));
      } catch (error) {
        console.error("Zustand Store Error - Failed to delete subject:", error);
        throw new Error("Could not delete the subject.");
      }
    },

    // --- ROBUST ADD CHAPTER ACTION ---
    addChapter: async (data: ChapterInput) => {
      try {
        const response = await notebookApi.createChapter(data);
        const newChapterFromApi = response.data;
        
        set((state) => ({
          subjects: state.subjects.map((subject) => {
            if (subject.id === newChapterFromApi.subject) {
              // Check if the chapter already exists in this subject
              const chapterExists = subject.chapters.some(
                (chapter) => chapter.id === newChapterFromApi.id
              );
              // If it exists, return the subject unmodified
              if (chapterExists) {
                return subject;
              }
              // Otherwise, add the new chapter
              return {
                ...subject,
                chapters: [...subject.chapters, { ...newChapterFromApi, chatHistory: [] }],
              };
            }
            return subject;
          }),
        }));
      } catch (error) {
        console.error("Zustand Store Error - Failed to create chapter:", error);
        throw new Error("Could not create the chapter.");
      }
    },

    setActiveChapter: (chapterId) => {
      set({ activeChapterId: chapterId });
    },

    getActiveChapter: () => {
      const state = get();
      if (!state.activeChapterId) return null;
      return (
        state.subjects
          .flatMap((s) => s.chapters)
          .find((c) => c.id === state.activeChapterId) || null
      );
    },
  })
);