// Co-reading workspace store: document reader text, notes, scratch pad, and the
// smart AI actions. Deliberately separate from useNotebook (the big notebook
// store) — the Chat tab reuses useNotebook.sendMessage; everything note-shaped
// lives here.

import { create } from "zustand";
import { notebookApi } from "@/features/notebook/notebook.api";
import { useNotebookStore } from "@/lib/store/useNotebook";
import type {
  NoteDTO,
  NoteCreateInput,
  DocumentContentDTO,
} from "@/features/notebook/notebook.schema";
import { DEFAULT_HIGHLIGHT, type HighlightColor } from "@/lib/highlightColors";

type ContentState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; content: DocumentContentDTO };

type RailTab = "chat" | "notes";

interface CoReadingState {
  contentByDoc: Record<string, ContentState>;
  notesByChapter: Record<string, NoteDTO[]>;
  scratchByChapter: Record<string, NoteDTO | undefined>;
  activeDocId: string | null;
  tab: RailTab;
  /** Passage handed from "Ask" to prefill the Chat input; ChatTab consumes it. */
  pendingAsk: string | null;
  /** Last-used highlight tone, so the next highlight/note reuses it. */
  lastColor: HighlightColor;
  // transient AI flags
  explainingFor: string | null; // anchor key currently being explained
  synthesizing: boolean;
  synthResult: string | null;
  converting: boolean;
  actionError: string | null;
}

interface CoReadingActions {
  setActiveDoc: (docId: string | null) => void;
  setTab: (tab: RailTab) => void;
  askAbout: (passage: string) => void;
  consumePendingAsk: () => void;
  loadDocumentContent: (docId: string) => Promise<void>;
  loadNotes: (chapterId: string) => Promise<void>;
  setLastColor: (color: HighlightColor) => void;
  addNote: (chapterId: string, payload: NoteCreateInput) => Promise<NoteDTO | null>;
  editNote: (chapterId: string, noteId: string, body: string) => Promise<void>;
  recolorNote: (chapterId: string, noteId: string, color: HighlightColor) => Promise<void>;
  removeNote: (chapterId: string, noteId: string) => Promise<void>;
  loadScratch: (chapterId: string) => Promise<void>;
  saveScratch: (chapterId: string, body: string) => Promise<void>;
  explain: (
    chapterId: string,
    args: { passage: string; document: string | null; anchorStart: number; anchorEnd: number },
  ) => Promise<void>;
  synthesize: (chapterId: string) => Promise<void>;
  clearSynth: () => void;
  convertToFlashcards: (chapterId: string, noteIds: string[]) => Promise<number>;
  reset: () => void;
}

const sortNotes = (notes: NoteDTO[]) =>
  [...notes].sort((a, b) => {
    const ad = a.document ?? "";
    const bd = b.document ?? "";
    if (ad !== bd) return ad < bd ? -1 : 1;
    const as = a.anchor_start ?? Number.MAX_SAFE_INTEGER;
    const bs = b.anchor_start ?? Number.MAX_SAFE_INTEGER;
    if (as !== bs) return as - bs;
    return a.created_at < b.created_at ? -1 : 1;
  });

export const useCoReadingStore = create<CoReadingState & CoReadingActions>(
  (set, get) => ({
    contentByDoc: {},
    notesByChapter: {},
    scratchByChapter: {},
    activeDocId: null,
    tab: "chat",
    pendingAsk: null,
    lastColor: DEFAULT_HIGHLIGHT,
    explainingFor: null,
    synthesizing: false,
    synthResult: null,
    converting: false,
    actionError: null,

    setActiveDoc: (docId) => set({ activeDocId: docId }),
    setTab: (tab) => set({ tab }),
    askAbout: (passage) => set({ tab: "chat", pendingAsk: passage }),
    consumePendingAsk: () => set({ pendingAsk: null }),
    setLastColor: (color) => set({ lastColor: color }),

    loadDocumentContent: async (docId) => {
      const existing = get().contentByDoc[docId];
      if (existing && existing.status === "ready") return;
      set((s) => ({
        contentByDoc: { ...s.contentByDoc, [docId]: { status: "loading" } },
      }));
      try {
        const content = await notebookApi.fetchDocumentContent(docId);
        set((s) => ({
          contentByDoc: {
            ...s.contentByDoc,
            [docId]: { status: "ready", content },
          },
        }));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not load this document.";
        set((s) => ({
          contentByDoc: {
            ...s.contentByDoc,
            [docId]: { status: "error", message },
          },
        }));
      }
    },

    loadNotes: async (chapterId) => {
      try {
        const notes = await notebookApi.fetchNotes(chapterId);
        set((s) => ({
          notesByChapter: {
            ...s.notesByChapter,
            [chapterId]: sortNotes(notes.filter((n) => n.kind !== "scratch")),
          },
        }));
      } catch (err) {
        console.error("loadNotes failed:", err);
      }
    },

    addNote: async (chapterId, payload) => {
      try {
        const note = await notebookApi.createNote(chapterId, payload);
        set((s) => ({
          notesByChapter: {
            ...s.notesByChapter,
            [chapterId]: sortNotes([...(s.notesByChapter[chapterId] ?? []), note]),
          },
        }));
        return note;
      } catch (err) {
        console.error("addNote failed:", err);
        set({ actionError: "Could not save note." });
        return null;
      }
    },

    editNote: async (chapterId, noteId, body) => {
      // optimistic
      const prev = get().notesByChapter[chapterId] ?? [];
      set((s) => ({
        notesByChapter: {
          ...s.notesByChapter,
          [chapterId]: prev.map((n) => (n.id === noteId ? { ...n, body } : n)),
        },
      }));
      try {
        await notebookApi.updateNote(noteId, { body });
      } catch (err) {
        console.error("editNote failed:", err);
        set((s) => ({
          notesByChapter: { ...s.notesByChapter, [chapterId]: prev },
          actionError: "Could not update note.",
        }));
      }
    },

    recolorNote: async (chapterId, noteId, color) => {
      const prev = get().notesByChapter[chapterId] ?? [];
      set((s) => ({
        lastColor: color,
        notesByChapter: {
          ...s.notesByChapter,
          [chapterId]: prev.map((n) => (n.id === noteId ? { ...n, color } : n)),
        },
      }));
      try {
        await notebookApi.updateNote(noteId, { color });
      } catch (err) {
        console.error("recolorNote failed:", err);
        set((s) => ({
          notesByChapter: { ...s.notesByChapter, [chapterId]: prev },
        }));
      }
    },

    removeNote: async (chapterId, noteId) => {
      const prev = get().notesByChapter[chapterId] ?? [];
      set((s) => ({
        notesByChapter: {
          ...s.notesByChapter,
          [chapterId]: prev.filter((n) => n.id !== noteId),
        },
      }));
      try {
        await notebookApi.deleteNote(noteId);
      } catch (err) {
        console.error("removeNote failed:", err);
        set((s) => ({
          notesByChapter: { ...s.notesByChapter, [chapterId]: prev },
          actionError: "Could not delete note.",
        }));
      }
    },

    loadScratch: async (chapterId) => {
      try {
        const scratch = await notebookApi.fetchScratch(chapterId);
        set((s) => ({
          scratchByChapter: { ...s.scratchByChapter, [chapterId]: scratch },
        }));
      } catch (err) {
        console.error("loadScratch failed:", err);
      }
    },

    saveScratch: async (chapterId, body) => {
      try {
        const scratch = await notebookApi.saveScratch(chapterId, body);
        set((s) => ({
          scratchByChapter: { ...s.scratchByChapter, [chapterId]: scratch },
        }));
      } catch (err) {
        console.error("saveScratch failed:", err);
      }
    },

    explain: async (chapterId, { passage, document, anchorStart, anchorEnd }) => {
      const key = `${anchorStart}:${anchorEnd}`;
      set({ explainingFor: key, actionError: null });
      try {
        const note = await notebookApi.explainPassage(chapterId, {
          passage,
          document,
          anchor_start: anchorStart,
          anchor_end: anchorEnd,
        });
        set((s) => ({
          notesByChapter: {
            ...s.notesByChapter,
            [chapterId]: sortNotes([...(s.notesByChapter[chapterId] ?? []), note]),
          },
          tab: "notes",
        }));
      } catch (err) {
        console.error("explain failed:", err);
        set({ actionError: "Explain is unavailable right now. Please retry." });
      } finally {
        set({ explainingFor: null });
      }
    },

    synthesize: async (chapterId) => {
      set({ synthesizing: true, actionError: null, synthResult: null });
      try {
        const summary = await notebookApi.synthesizeNotes(chapterId);
        set({ synthResult: summary });
      } catch (err) {
        console.error("synthesize failed:", err);
        set({ actionError: "Could not synthesize notes right now." });
      } finally {
        set({ synthesizing: false });
      }
    },

    clearSynth: () => set({ synthResult: null }),

    convertToFlashcards: async (chapterId, noteIds) => {
      set({ converting: true, actionError: null });
      try {
        const cards = await notebookApi.notesToFlashcards(chapterId, noteIds);
        // Reflect the new deck in the notebook store's Studio panel.
        await useNotebookStore.getState().fetchFlashCards(chapterId);
        return cards.length;
      } catch (err) {
        console.error("convertToFlashcards failed:", err);
        set({ actionError: "Could not make flashcards right now." });
        return 0;
      } finally {
        set({ converting: false });
      }
    },

    reset: () =>
      set({ activeDocId: null, tab: "chat", synthResult: null, actionError: null }),
  }),
);
