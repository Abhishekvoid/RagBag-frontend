// features/notebook/notebook.store.ts

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { notebookApi } from "@/features/notebook/notebook.api";

import {
  SubjectInput,
  ChapterInput,
  SubjectDTO,
  ChapterDTO,
  ChatMessageDTO,
  PaginatedMessages,
  GeneratedQuestion,
  FlashCard,
  FlashCardUpdate,
} from "@/features/notebook/notebook.schema";
import { v4 as uuidv4 } from "uuid";
import { getAccessToken } from "@/lib/authToken";
import {
  Ingestion,
  IngestionStatusEvent,
  applyIngestionEvent,
  makeOptimisticIngestion,
} from "@/features/notebook/ingestion";

let ws: WebSocket | null = null;

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
  sources?: { document_id: string; title: string; snippet: string }[];
  followups?: string[];
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
  currentStudioView: "controls" | "questions" | "flashcards";
  ingestions: Record<string, Ingestion>;
  onIngestionReady?: (chapterId: string) => void;
};

type NotebookActions = {
  fetchSubjects: () => Promise<void>;
  addSubject: (data: SubjectInput) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  addChapter: (data: ChapterInput) => Promise<void>;
  deleteChapter: (id: string) => Promise<void>;
  setActiveChapter: (chapterId: string | null) => void;
  getActiveChapter: () => Chapter | null;
  initWebSocket: () => void;
  sendMessage: (text: string) => Promise<void>;
  loadChatHistory: (chapterId: string) => Promise<void>;
  loadMoreMessages: (chapterId: string) => Promise<void>;
  generateQuestions: (chapterId: string) => Promise<void>;
  fetchQuestions: (chapterId: string) => Promise<void>;
  generateFlashCards: (chapterId: string) => Promise<void>;
  fetchFlashCards: (chapterId: string) => Promise<void>;
  updateFlashCards: (flashCardId: string, data: FlashCardUpdate) => void;
  deleteFlashCards: (flashcardId: string) => void;
  setStudioView: (view: "controls" | "questions" | "flashcards") => void;
  startIngestion: (documentId: string, filename: string) => void;
  setUploadPercent: (documentId: string, percent: number) => void;
  dismissIngestion: (documentId: string) => void;
  retryIngestion: (documentId: string) => Promise<void>;
  seedInFlightIngestions: () => Promise<void>;
  pollIngestions: () => Promise<void>;
  // Reassign a chapter to another subject (targetSubjectId), or make it loose
  // ("uncategorized-chapters" or null). Its chats/flashcards/questions/notes
  // are chapter-scoped and move with it.
  moveChapter: (chapterId: string, targetSubjectId: string | null) => Promise<void>;
};

// Prefer an explicit WS URL; otherwise derive it from the API host so the socket
// always follows the same backend as REST (http→ws, https→wss). Falling back to
// a hardcoded prod host is what made a local browser talk to production while
// local Celery pushed events nobody was listening for.
const WS_BASE =
  process.env.NEXT_PUBLIC_WS_URL ||
  (process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/^http/, "ws")
    : "wss://ragbag-backend-production.up.railway.app");

// ==== STORE ===========
export const useNotebookStore = create<NotebookState & NotebookActions>()(
  devtools(
    (set, get) => ({
      subjects: [],
      activeChapterId: null,
      isAiResponding: false,
      isLoading: false,
      error: null,
      currentStudioView: "controls",
      ingestions: {},
      onIngestionReady: undefined,
      initWebSocket: () => {
        if (ws) return; 

        const token = getAccessToken(); 
        if (!token) return;

        ws = new WebSocket(`${WS_BASE}/ws/notifications/?token=${token}`);

        ws.onopen = () => {
          console.log("WS Connected");
        };

        ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);

            console.log("WS EVENT:", data);

            if (data.type === "ingestion_status") {
              const evt = data as IngestionStatusEvent;
              set((state) => ({
                ingestions: {
                  ...state.ingestions,
                  [evt.document_id]: applyIngestionEvent(
                    state.ingestions[evt.document_id],
                    evt,
                  ),
                },
              }));

              if (evt.phase === "ready") {
                await get().fetchSubjects();
                const chapterId = evt.chapter_id ?? null;
                if (chapterId) {
                  get().setActiveChapter(chapterId);
                  get().onIngestionReady?.(chapterId);
                }
                // Remove the finished card shortly after the swap.
                setTimeout(
                  () => get().dismissIngestion(evt.document_id),
                  1200,
                );
              }
              return;
            }

            // Legacy coarse events still trigger a refresh.
            if (
              data.message === "notebook_updated" ||
              data.message === "document_ready"
            ) {
              await get().fetchSubjects();
            }
          } catch (e) {
            console.error("WS parse error", e);
          }
        };

        ws.onclose = () => {
          console.log("WS Disconnected → retrying...");
          ws = null;
          setTimeout(() => get().initWebSocket(), 3000);
        };
      },
      // --- DATA FETCHING ACTIONS ---
      fetchSubjects: async () => {
        set({ isLoading: true, error: null });
        try {
          // enforce consistent API client returning .data
          const subjectsFromApi = await notebookApi.fetchSubjects();

          // Preserve client-only chapter state (chat history, questions,
          // flashcards, pagination) across refetches. fetchSubjects only owns
          // server fields (name, documents, order); wiping the rest would blank
          // an open chapter whenever the list is refreshed — e.g. when the
          // collapsed-sidebar peek mounts, or a WS/poll refresh fires.
          const existingChapters = new Map<string, Chapter>();
          for (const subject of get().subjects) {
            for (const chapter of subject.chapters) {
              existingChapters.set(chapter.id, chapter);
            }
          }

          const subjectsWithChatState: Subject[] = subjectsFromApi.map(
            (subject) => ({
              ...subject,
              chapters: subject.chapters.map((chapter) => {
                const prev = existingChapters.get(chapter.id);
                return {
                  ...chapter,
                  messages: prev?.messages ?? [],
                  pagination: prev?.pagination ?? {
                    nextPageUrl: null,
                    isLoading: false,
                    isLoadingMore: false,
                    hasMore: true,
                  },
                  hasHistoryLoaded: prev?.hasHistoryLoaded ?? false,
                  questions: prev?.questions ?? [],
                  isGeneratingQuestions: prev?.isGeneratingQuestions ?? false,
                  flashcards: prev?.flashcards ?? [],
                  isGeneratingFlashCard: prev?.isGeneratingFlashCard ?? false,
                  flashcardError: prev?.flashcardError ?? null,
                };
              }),
            }),
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

      // --- INGESTION STATUS ACTIONS ---
      startIngestion: (documentId, filename) => {
        set((state) => ({
          ingestions: {
            ...state.ingestions,
            [documentId]: makeOptimisticIngestion(documentId, filename),
          },
        }));
      },

      setUploadPercent: (documentId, percent) => {
        set((state) => {
          const cur = state.ingestions[documentId];
          if (!cur) return {} as Partial<NotebookState>;
          return {
            ingestions: {
              ...state.ingestions,
              [documentId]: { ...cur, uploadPercent: percent },
            },
          };
        });
      },

      dismissIngestion: (documentId) => {
        set((state) => {
          const next = { ...state.ingestions };
          delete next[documentId];
          return { ingestions: next };
        });
      },

      retryIngestion: async (documentId) => {
        try {
          await notebookApi.retryDocument(documentId);
          set((state) => {
            const cur = state.ingestions[documentId];
            if (!cur) return {} as Partial<NotebookState>;
            return {
              ingestions: {
                ...state.ingestions,
                [documentId]: {
                  ...cur,
                  phase: "reading",
                  error: null,
                  uploadPercent: 100,
                },
              },
            };
          });
        } catch (err) {
          console.error("retryIngestion failed:", err);
        }
      },

      seedInFlightIngestions: async () => {
        try {
          const res = await notebookApi.fetchDocuments();
          const docs = res.data;
          set((state) => {
            const next = { ...state.ingestions };
            for (const d of docs) {
              if (
                (d.status === "PENDING" || d.status === "PROCESSING") &&
                !next[d.id]
              ) {
                const seed = makeOptimisticIngestion(d.id, d.title || "Document");
                // Coarse resume: show a generic processing phase until a
                // live WS event refines it.
                next[d.id] = { ...seed, phase: "reading", uploadPercent: 100 };
              }
            }
            return { ingestions: next };
          });
        } catch (err) {
          console.error("seedInFlightIngestions failed:", err);
        }
      },

      // Polling backstop for the live ingestion card: WebSocket phase events are
      // an optimization, not a guarantee (a dropped socket, a missed event, or a
      // misconfigured WS URL would otherwise strand the card on "uploading"
      // forever). While anything is in-flight this reconciles against the server
      // so the card advances, completes (opening the new chapter), or fails —
      // exactly what a manual refresh does today.
      pollIngestions: async () => {
        const active = Object.values(get().ingestions).filter(
          (i) => i.phase !== "ready" && i.phase !== "failed",
        );
        if (active.length === 0) return;

        try {
          const res = await notebookApi.fetchDocuments();
          const byId = new Map(res.data.map((d) => [d.id, d]));

          for (const ing of active) {
            const doc = byId.get(ing.documentId);
            if (!doc) continue;

            if (doc.status === "COMPLETED") {
              await get().fetchSubjects();
              const chapter = get()
                .subjects.flatMap((s) => s.chapters)
                .find((c) =>
                  c.documents?.some((d) => d.id === ing.documentId),
                );
              set((state) => ({
                ingestions: {
                  ...state.ingestions,
                  [ing.documentId]: {
                    ...state.ingestions[ing.documentId],
                    phase: "ready",
                    uploadPercent: 100,
                  },
                },
              }));
              if (chapter) get().setActiveChapter(chapter.id);
              get().onIngestionReady?.(chapter?.id ?? "");
              setTimeout(() => get().dismissIngestion(ing.documentId), 1000);
            } else if (doc.status === "FAILED") {
              set((state) => ({
                ingestions: {
                  ...state.ingestions,
                  [ing.documentId]: {
                    ...state.ingestions[ing.documentId],
                    phase: "failed",
                    error: doc.error_message ?? "Processing failed",
                  },
                },
              }));
            } else if (ing.phase === "uploading") {
              // Server is processing but the card is still on "uploading" — no
              // WS event advanced it. Nudge it to a coarse "reading" so it
              // reflects that work is underway.
              set((state) => ({
                ingestions: {
                  ...state.ingestions,
                  [ing.documentId]: {
                    ...state.ingestions[ing.documentId],
                    phase: "reading",
                    uploadPercent: 100,
                  },
                },
              }));
            }
          }
        } catch (err) {
          console.error("pollIngestions failed:", err);
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
        // Capture position so a failed delete rolls back into place.
        const prevSubjects = get().subjects;
        const index = prevSubjects.findIndex((s) => s.id === id);
        if (index === -1) return;
        const subject = prevSubjects[index];

        // Optimistic removal — AnimatePresence plays the exit animation.
        set((state) => ({
          subjects: state.subjects.filter((s) => s.id !== id),
        }));

        try {
          await notebookApi.deleteSubject(id);
        } catch (err) {
          console.error("NotebookStore Error - deleteSubject:", err);
          // Rollback: re-insert the subject at its original position.
          set((state) => {
            const restored = [...state.subjects];
            restored.splice(index, 0, subject);
            return { subjects: restored, error: "Failed to delete subject" };
          });
        }
      },
      generateQuestions: async (chapterId: string) => {
        set((state) =>
          updateChapterState(state, chapterId, {
            isGeneratingQuestions: true,
          }),
        );

        try {
          const newQuestions = await notebookApi.generateQuestions(chapterId);

          set((state) =>
            updateChapterState(state, chapterId, {
              questions: newQuestions,
              isGeneratingQuestions: false,
            }),
          );
        } catch (error) {
          console.error("Failed to generate questions:", error);
          // 4. On error, just turn off the loading state
          set((state) =>
            updateChapterState(state, chapterId, {
              isGeneratingQuestions: false,
            }),
          );
        }
      },
      fetchQuestions: async (chapterId: string) => {
        try {
          const questions = await notebookApi.fetchQuestions(chapterId);
          set((state) =>
            updateChapterState(state, chapterId, { questions }),
          );
        } catch (error) {
          console.error("Failed to fetch questions:", error);
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

      deleteChapter: async (id: string) => {
        // Capture the chapter's home + position so a failed delete can be
        // rolled back exactly where it was (the row animates back in).
        const prevSubjects = get().subjects;
        const prevActiveChapterId = get().activeChapterId;
        let subjectId: string | null = null;
        let chapterIndex = -1;
        let chapter: Chapter | undefined;
        for (const subject of prevSubjects) {
          const idx = subject.chapters.findIndex((c) => c.id === id);
          if (idx !== -1) {
            subjectId = subject.id;
            chapterIndex = idx;
            chapter = subject.chapters[idx];
            break;
          }
        }
        if (!chapter) return;

        // Optimistic removal — drop the chapter from whichever subject holds
        // it, including the "uncategorized-chapters" pseudo-subject for loose
        // chapters. AnimatePresence plays the row's exit animation.
        set((state) => ({
          subjects: state.subjects.map((subject) => ({
            ...subject,
            chapters: subject.chapters.filter((c) => c.id !== id),
          })),
          activeChapterId:
            state.activeChapterId === id ? null : state.activeChapterId,
        }));

        try {
          await notebookApi.deleteChapter(id);
        } catch (err) {
          console.error("NotebookStore Error - deleteChapter:", err);
          // Rollback: re-insert the chapter at its original position.
          set((state) => ({
            subjects: state.subjects.map((subject) => {
              if (subject.id !== subjectId) return subject;
              const restored = [...subject.chapters];
              restored.splice(chapterIndex, 0, chapter!);
              return { ...subject, chapters: restored };
            }),
            activeChapterId: prevActiveChapterId,
            error: "Failed to delete chapter",
          }));
        }
      },

      moveChapter: async (chapterId, targetSubjectId) => {
        const LOOSE = "uncategorized-chapters";
        const toLoose =
          targetSubjectId === null || targetSubjectId === LOOSE;
        const apiSubject = toLoose ? null : targetSubjectId;
        const destId = toLoose ? LOOSE : targetSubjectId;

        const prevSubjects = get().subjects;
        let fromId: string | null = null;
        let fromIndex = -1;
        let chapter: Chapter | undefined;
        for (const subject of prevSubjects) {
          const idx = subject.chapters.findIndex((c) => c.id === chapterId);
          if (idx !== -1) {
            fromId = subject.id;
            fromIndex = idx;
            chapter = subject.chapters[idx];
            break;
          }
        }
        // No-op if the chapter isn't found or is already in the destination.
        if (!chapter || fromId === destId) return;

        const moved: Chapter = { ...chapter, subject: apiSubject };

        // Optimistic: pull from the old home, drop into the destination.
        set((state) => ({
          subjects: state.subjects.map((subject) => {
            if (subject.id === fromId) {
              return {
                ...subject,
                chapters: subject.chapters.filter((c) => c.id !== chapterId),
              };
            }
            if (subject.id === destId) {
              return { ...subject, chapters: [...subject.chapters, moved] };
            }
            return subject;
          }),
        }));

        try {
          await notebookApi.moveChapter(chapterId, apiSubject);
        } catch (err) {
          console.error("NotebookStore Error - moveChapter:", err);
          // Rollback: remove from destination, restore to its old slot.
          set((state) => ({
            subjects: state.subjects.map((subject) => {
              if (subject.id === destId) {
                return {
                  ...subject,
                  chapters: subject.chapters.filter((c) => c.id !== chapterId),
                };
              }
              if (subject.id === fromId) {
                const restored = [...subject.chapters];
                restored.splice(fromIndex, 0, chapter!);
                return { ...subject, chapters: restored };
              }
              return subject;
            }),
            error: "Failed to move chapter",
          }));
        }
      },

      // --- ACTIVE STATE MANAGEMENT ---
      setActiveChapter: (chapterId) => {
        set({ activeChapterId: chapterId });
        if (chapterId) {
          const chapter = get().getActiveChapter();
          if (chapter && !chapter.hasHistoryLoaded) {
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
          }),
        );

        try {
          const initialUrl = `/auth/chapters/${chapterId}/messages/`;
          const paginatedResponse: PaginatedMessages =
            await notebookApi.fetchChapterMessages(initialUrl);

          const messages: Message[] = paginatedResponse.results
            .reverse()
            .map(toUiMessage);

          set((state) =>
            updateChapterState(state, chapterId, {
              messages,
              hasHistoryLoaded: true,
              pagination: {
                ...chapterState.pagination,
                isLoading: false,
                nextPageUrl: paginatedResponse.next,
                hasMore: !!paginatedResponse.next,
              },
            }),
          );
        } catch (err) {
          console.error("NotebookStore Error - loadChatHistory:", err);
          const current = get().getActiveChapter();
          if (current) {
            set((state) =>
              updateChapterState(state, chapterId, {
                pagination: { ...current.pagination, isLoading: false },
              }),
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
          }),
        );

        try {
          const paginatedResponse: PaginatedMessages =
            await notebookApi.fetchChapterMessages(
              chapterState.pagination.nextPageUrl,
            );

          const newMessages: Message[] = paginatedResponse.results.map(toUiMessage);

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
              }),
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
          }),
        );

        try {
          const aiResponse = await notebookApi.sendRagMessage({
            chapterId: activeChapter.id,
            text,
          });

          const aiMessage: Message = {
            id: aiResponse.id,
            sender: "ai",
            text: aiResponse.text,
            sources: aiResponse.sources ?? [],
            followups: aiResponse.followups ?? [],
          };

          set((state) => {
            const currentChapter = findChapter(state, activeChapter.id);
            if (!currentChapter) return state;
            return updateChapterState(state, activeChapter.id, {
              messages: [...currentChapter.messages, aiMessage],
            });
          });
        } catch (err) {
          console.error("NotebookStore Error - sendMessage:", err);

          let messageText = "Sorry, I ran into an issue.";

          if (err instanceof Error) {
            // 🚀 THIS IS KEY
            if (err.message.includes("not ready")) {
              messageText =
                "⏳ Your document is still processing. Please wait a few seconds...";
            } else {
              messageText = err.message;
            }
          }

          const errorMessage: Message = {
            id: uuidv4(),
            sender: "ai",
            text: messageText,
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

      generateFlashCards: async (chapterId: string) => {
        set((state) =>
          updateChapterState(state, chapterId, {
            isGeneratingFlashCard: true,
            flashcardError: null,
          }),
        );

        try {
          const newFlashCard = await notebookApi.generateFlashCards(chapterId);

          set((state) =>
            updateChapterState(state, chapterId, {
              flashcards: newFlashCard,
              isGeneratingFlashCard: false,
            }),
          );
        } catch (error) {
          console.error("failed generate FlashCards:", error);

          const message =
            error instanceof Error
              ? error.message
              : "failed to generate Flashcards";
          set((state) =>
            updateChapterState(state, chapterId, {
              isGeneratingFlashCard: false,
              flashcardError: message,
            }),
          );
        }
      },

      fetchFlashCards: async (chapterId: string) => {
        set((state) =>
          updateChapterState(state, chapterId, {
            flashcardError: null,
          }),
        );

        try {
          const fetchFlashCards = await notebookApi.fetchFlashCards(chapterId);
          set((state) =>
            updateChapterState(state, chapterId, {
              flashcards: fetchFlashCards,
            }),
          );
        } catch (error) {
          console.error("failed to fetchFlashacrds");

          const message =
            error instanceof Error
              ? error.message
              : "failed to generate Flashcards";
          set((state) =>
            updateChapterState(state, chapterId, {
              flashcardError: message,
            }),
          );
        }
      },

      updateFlashCards: async (flashcardId: string, data: FlashCardUpdate) => {
        try {
          const updateFlashCard = await notebookApi.updatedFlashCard(
            flashcardId,
            data,
          );

          set((state) => {
            const activeChapterId = get().activeChapterId;

            const currentChapter = state.subjects
              .flatMap((subject) => subject.chapters)
              .find((chapter) => chapter.id === activeChapterId);

            if (!currentChapter) {
              console.warn(
                "Active chapter not found or flashcard not associated with active chapter:",
                activeChapterId,
                flashcardId,
              );
              return state;
            }

            if (!currentChapter.flashcards) {
              console.warn("current chapter dont have flashcard to update");
              return state;
            }

            const updateFlashCards = currentChapter.flashcards.map((card) =>
              card.id === flashcardId ? updateFlashCard : card,
            );

            return updateChapterState(state, currentChapter.id, {
              flashcards: updateFlashCards,
            });
          });
        } catch (error) {
          console.error("Failed to update the flashcard status:", error);
          throw error;
        }
      },

      deleteFlashCards: async (flashcardId: string) => {
        const activeChapterId = get().activeChapterId;
        try {
          await notebookApi.deleteFlashCard(flashcardId);

          set((state) => {
            const currentChapter = state.subjects
              .flatMap((subject) => subject.chapters)
              .find((chapter) => chapter.id === activeChapterId);

            if (!currentChapter) {
              console.warn(
                "Actice chapter not found or flashcards not associated with active chapter:",
                activeChapterId,
                flashcardId,
              );
              return state;
            }

            const updateFlashCards = currentChapter.flashcards.filter(
              (card) => card.id !== flashcardId,
            );

            return updateChapterState(state, currentChapter.id, {
              flashcards: updateFlashCards,
            });
          });
        } catch (error) {
          console.error("Failed to delete flashcard:", error);
          throw error;
        }
      },

      setStudioView: (view) => {
        set({ currentStudioView: view });
      },
    }),
    { name: "StudyWiseNotebookStore" },
  ),
);

// --- HELPERS ---
const findChapter = (state: NotebookState, chapterId: string) =>
  state.subjects.flatMap((s) => s.chapters).find((c) => c.id === chapterId);

// Map a persisted chat message (ChatMessageSerializer shape) onto the UI
// message type, translating the stored `citations`/`suggestions` fields back
// into the `sources`/`followups` the ChatView renders.
const toUiMessage = (m: ChatMessageDTO): Message => ({
  id: m.id,
  sender: m.sender,
  text: m.text,
  error: !!m.error,
  sources: Array.isArray(m.citations)
    ? (m.citations as { document_id: string; title: string; snippet: string }[])
    : [],
  followups: m.suggestions ?? [],
});

const updateChapterState = (
  state: NotebookState,
  chapterId: string,
  updates: Partial<Chapter>,
): NotebookState => ({
  ...state,
  subjects: state.subjects.map((subject) => ({
    ...subject,
    chapters: subject.chapters.map((chapter) =>
      chapter.id === chapterId ? { ...chapter, ...updates } : chapter,
    ),
  })),
});
