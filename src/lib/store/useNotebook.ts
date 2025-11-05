// features/notebook/notebook.store.ts

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { notebookApi } from "@/features/notebook/notebook.api";

import {
  SubjectInput,
  ChapterInput,
  DocumentDTO,
  SubjectDTO,
  ChapterDTO,
  RagChatMessageDTO,
  PaginatedMessages,
  GeneratedQuestion,
  FlashCard,
  FlashCardInput,
  chapterResponseSchema,
} from "@/features/notebook/notebook.schema";
import { v4 as uuidv4 } from "uuid";
import { promises } from "dns";
import { createGzip } from "zlib";
import { error } from "console";

// ============ TYPES =============

// Raw API message shape (DTO from backend)
export type MessageDTO = {
  id: string;
  text: string;
};

// Internal UI message type
export type Message = {
  id: string;
  sender: "user" | "ai";
  text: string;
  error?: boolean;
};

export type Chapter = ChapterDTO & {
  messages: Message[];
  pagination: {
    nextPageUrl: string | null;
    isLoading: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
  };
  hasHistoryLoaded: boolean;
  questions: GeneratedQuestion[];
  isGeneratingQuestions: boolean;
  flashcards: FlashCard[];
  isGeneratingFlashCard: boolean;
  flashcardError: string | null;
};

export type Subject = Omit<SubjectDTO, "chapters"> & {
  chapters: Chapter[];
};
type NotebookState = {
  subjects: Subject[];
  activeChapterId: string | null;
  isAiResponding: boolean;
  isLoading: boolean;
  error: string | null;
  currentStudioView: 'controls' | 'questions' | 'flashcards';

};

type NotebookActions = {
  fetchSubjects: () => Promise<void>;
  addSubject: (data: SubjectInput) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  addChapter: (data: ChapterInput) => Promise<void>;
  setActiveChapter: (chapterId: string | null) => void;
  getActiveChapter: () => Chapter | null;
  sendMessage: (text: string) => Promise<void>;
  loadChatHistory: (chapterId: string) => Promise<void>;
  loadMoreMessages: (chapterId: string) => Promise<void>;
  generateQuestions: (chapterId: string) => Promise<void>;
  fetchFlashCards: (chapterId: string) => Promise<void>;
  createFlashCards: (chapterId: string, data: FlashCardInput) => Promise<void>;
  setStudioView: (view: 'controls' | 'questions' | 'flashcards' ) => void;
};

// ==== STORE ===========
export const useNotebookStore = create<NotebookState & NotebookActions>()(
  devtools(
    (set, get) => ({
      subjects: [],
      activeChapterId: null,
      isAiResponding: false,
      isLoading: false,
      error: null,
      currentStudioView: 'controls',

      // --- DATA FETCHING ACTIONS ---
      fetchSubjects: async () => {
        set({ isLoading: true, error: null });
        try {
          // enforce consistent API client returning .data
          const subjectsFromApi = await notebookApi.fetchSubjects();

          const subjectsWithChatState: Subject[] = subjectsFromApi.map(
            (subject) => ({
              ...subject,
              chapters: subject.chapters.map((chapter) => ({
                ...chapter,
                messages: [],
                pagination: {
                  nextPageUrl: null,
                  isLoading: false,
                  isLoadingMore: false,
                  hasMore: true,
                },
                hasHistoryLoaded: false,
                questions: [],
                isGeneratingQuestions: false,
                flashcards: [],
                isGeneratingFlashCard: false,
                flashcardError: null,
              })),
            })
          );

          set({ subjects: subjectsWithChatState, isLoading: false });
        } catch (err) {
          console.error("NotebookStore Error - fetchSubjects:", err);
          set({
            error: "Failed to load your notebook. Please try again.",
            isLoading: false,
          });
        }
      },

      // --- CRUD ACTIONS ---
      addSubject: async (data: SubjectInput) => {
        try {
          
          const newSubjectFromApi = await notebookApi.createSubject(data);
          set((state) => ({
            subjects: [
              ...state.subjects,
              { ...newSubjectFromApi, chapters: [] },
            ],
          }));
        } catch (err) {
          console.error("NotebookStore Error - addSubject:", err);
          set({ error: "Failed to add subject" });
        }
      },

      deleteSubject: async (id: string) => {
        try {
          await notebookApi.deleteSubject(id);
          set((state) => ({
            subjects: state.subjects.filter((subject) => subject.id !== id),
          }));
        } catch (err) {
          console.error("NotebookStore Error - deleteSubject:", err);
          set({ error: "Failed to delete subject" });
        }
      },
      generateQuestions: async (chapterId: string) => {
        set((state) =>
          updateChapterState(state, chapterId, {
            isGeneratingQuestions: true,
          })
        );

        try {
          const newQuestions = await notebookApi.generateQuestions(chapterId);

          set((state) =>
            updateChapterState(state, chapterId, {
              questions: newQuestions,
              isGeneratingQuestions: false,
            })
          );
        } catch (error) {
          console.error("Failed to generate questions:", error);
          // 4. On error, just turn off the loading state
          set((state) =>
            updateChapterState(state, chapterId, {
              isGeneratingQuestions: false,
            })
          );
        }
      },
      addChapter: async (data: ChapterInput) => {
        try {
          const newChapterFromApi = await notebookApi.createChapter(data);

          const newChapterForStore = {
            ...newChapterFromApi,
            messages: [],
            pagination: {
              nextPageUrl: null,
              isLoading: false,
              isLoadingMore: false,
              hasMore: false,
            },
            hasHistoryLoaded: true,
            questions: [],
            isGeneratingQuestions: false,
            flashcards: [],
            isGeneratingFlashCard: false,
            flashcardError: null,
          };

          set((state) => ({
            subjects: state.subjects.map((subject) => {
              // Handle chapters with an assigned subject
              if (subject.id === newChapterForStore.subject) {
                return {
                  ...subject,
                  chapters: [...subject.chapters, newChapterForStore],
                };
              }
              // Handle chapters with NO assigned subject (put it in 'Uncategorized')
              if (
                newChapterForStore.subject === null &&
                subject.id === "uncategorized-chapters"
              ) {
                return {
                  ...subject,
                  chapters: [...subject.chapters, newChapterForStore],
                };
              }
              
              return subject;
            }),
          }));
        } catch (err) {
          console.error("NotebookStore Error - addChapter:", err);
          set({ error: "Failed to add chapter" });
        }
      },

      // --- ACTIVE STATE MANAGEMENT ---
      setActiveChapter: (chapterId) => {
        set({ activeChapterId: chapterId });
        if (chapterId) {
          const chapter = get().getActiveChapter();
          if (
            chapter &&
            chapter.messages.length === 0 &&
            chapter.pagination.hasMore
          ) {
            void get().loadChatHistory(chapterId);
          }
        }
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

      // --- CHAT & PAGINATION ACTIONS ---
      loadChatHistory: async (chapterId: string) => {
        const chapterState = get().getActiveChapter();
        if (!chapterState || chapterState.pagination.isLoading) return;

        set((state) =>
          updateChapterState(state, chapterId, {
            pagination: { ...chapterState.pagination, isLoading: true },
          })
        );

        try {
          const initialUrl = `/auth/chapters/${chapterId}/messages/`;
          const paginatedResponse: PaginatedMessages =
            await notebookApi.fetchChapterMessages(initialUrl);

          const messages: Message[] = paginatedResponse.results.map(
            (m: RagChatMessageDTO) => ({
              ...m,
            })
          );

          set((state) =>
            updateChapterState(state, chapterId, {
              messages,
              pagination: {
                ...chapterState.pagination,
                isLoading: false,
                nextPageUrl: paginatedResponse.next,
                hasMore: !!paginatedResponse.next,
              },
            })
          );
        } catch (err) {
          console.error("NotebookStore Error - loadChatHistory:", err);
          const current = get().getActiveChapter();
          if (current) {
            set((state) =>
              updateChapterState(state, chapterId, {
                pagination: { ...current.pagination, isLoading: false },
              })
            );
          }
        }
      },

      loadMoreMessages: async (chapterId: string) => {
        const chapterState = get().getActiveChapter();
        if (
          !chapterState ||
          !chapterState.pagination.nextPageUrl ||
          chapterState.pagination.isLoadingMore
        )
          return;

        set((state) =>
          updateChapterState(state, chapterId, {
            pagination: { ...chapterState.pagination, isLoadingMore: true },
          })
        );

        try {
          const paginatedResponse: PaginatedMessages =
            await notebookApi.fetchChapterMessages(
              chapterState.pagination.nextPageUrl
            );

          const newMessages: Message[] = paginatedResponse.results.map(
            (m: RagChatMessageDTO) => ({
              ...m,
            })
          );

          set((state) => {
            const currentChapter = findChapter(state, chapterId);
            if (!currentChapter) return state;

            return updateChapterState(state, chapterId, {
              messages: [...newMessages, ...currentChapter.messages],
              pagination: {
                ...currentChapter.pagination,
                isLoadingMore: false,
                nextPageUrl: paginatedResponse.next,
                hasMore: !!paginatedResponse.next,
              },
            });
          });
        } catch (err) {
          console.error("NotebookStore Error - loadMoreMessages:", err);
          const current = get().getActiveChapter();
          if (current) {
            set((state) =>
              updateChapterState(state, chapterId, {
                pagination: { ...current.pagination, isLoadingMore: false },
              })
            );
          }
        }
      },

      sendMessage: async (text: string) => {
        const activeChapter = get().getActiveChapter();
        if (!activeChapter) return;

        const userMessage: Message = { id: uuidv4(), sender: "user", text };

        set({ isAiResponding: true });
        set((state) =>
          updateChapterState(state, activeChapter.id, {
            messages: [...activeChapter.messages, userMessage],
          })
        );

        try {
          const aiResponse: MessageDTO = await notebookApi.sendRagMessage({
            chapterId: activeChapter.id,
            text,
          });

          const aiMessage: Message = { ...aiResponse, sender: "ai" };

          set((state) => {
            const currentChapter = findChapter(state, activeChapter.id);
            if (!currentChapter) return state;
            return updateChapterState(state, activeChapter.id, {
              messages: [...currentChapter.messages, aiMessage],
            });
          });
        } catch (err) {
          console.error("NotebookStore Error - sendMessage:", err);
          const errorMessage: Message = {
            id: uuidv4(),
            sender: "ai",
            text: "Sorry, I ran into an issue. Please try again.",
            error: true,
          };
          set((state) => {
            const currentChapter = findChapter(state, activeChapter.id);
            if (!currentChapter) return state;
            return updateChapterState(state, activeChapter.id, {
              messages: [...currentChapter.messages, errorMessage],
            });
          });
        } finally {
          set({ isAiResponding: false });
        }
      },

      fetchFlashCards: async (chapterId: string) => {
      set((state)=> 
        updateChapterState(state, chapterId, {  
          isGeneratingFlashCard: true,
          flashcardError: null,
        })
      );

      try {
        const newFlashCard= await notebookApi.fetchFlashCard(chapterId);

        set((state) =>
          updateChapterState (state, chapterId, {
            flashcards: newFlashCard,
            isGeneratingFlashCard: false,
          } )
        )
      } catch (error) {
        console.error("failed to create a FlashCard:", error);
  
      }
    
    },

    createFlashCards : async(chapterId: string, data: FlashCardInput) => {
      set((state) =>
        updateChapterState(state, chapterId, {
          isGeneratingFlashCard: true,
          flashcardError: null,
         
        })
      )

      try {

        const newFlashCard = await notebookApi.createFlashCard(chapterId, data);

        set((state) => {

          const currentChapter = findChapter(state, chapterId);
          if(!currentChapter){
            console.error("Chapter not found for creating flashcard:", chapterId);
            return state;
          }

          const updatedFlashCard = [  ...currentChapter.flashcards, newFlashCard];

          return updateChapterState(state, chapterId, {
            flashcards: updatedFlashCard,
            isGeneratingFlashCard: false,
          })
        })
      } catch (error) {
        console.error("failed creating flashcard", error);

        set((state) => 
          updateChapterState(state, chapterId, {
            isGeneratingFlashCard: false,
            flashcardError: "Failed to create a flashcard",
          }

          ) 
        )
        
      }
    },

    setStudioView: (view) => {
      set({ currentStudioView: view});
    }
    
    }), 
    { name: "StudyWiseNotebookStore" },

    
  )
  
);

// --- HELPERS ---
const findChapter = (state: NotebookState, chapterId: string) =>
  state.subjects.flatMap((s) => s.chapters).find((c) => c.id === chapterId);

const updateChapterState = (
  state: NotebookState,
  chapterId: string,
  updates: Partial<Chapter>
): NotebookState => ({
  ...state,
  subjects: state.subjects.map((subject) => ({
    ...subject,
    chapters: subject.chapters.map((chapter) =>
      chapter.id === chapterId ? { ...chapter, ...updates } : chapter
    ),
  })),
});
