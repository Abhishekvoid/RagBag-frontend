
import api from "@/lib/axios";
import { z } from "zod";

import {
  SubjectInput,
  ChapterInput,
  ChatSessionInput,
  ChatMessageInput,
  SubjectDTO,
  ChapterDTO,
  DocumentDTO,
  ChatSessionDTO,
  ChatMessageDTO,
  RagChatMessageDTO,
  PaginatedMessages,
  subjectListResponseSchema,
  subjectResponseSchema,
  paginatedMessagesSchema,
  ragChatResponseSchema,
  generatedQuestionSchema,
  GeneratedQuestion,
  flashCardSchema,
  FlashCard,
  flashCardUpdateSchema,
  noteSchema,
  documentContentSchema,
  documentPageSchema,
  DocumentPageDTO,
  NoteDTO,
  NoteCreateInput,
  DocumentContentDTO,
} from "./notebook.schema";
import axios from "axios";

export const notebookApi = {
  // Short-lived, single-use credential for the notifications socket. The JWT is
  // sent here in an Authorization header and never placed in the socket URL.
  createWsTicket: async (): Promise<string> => {
    const response = await api.post("/auth/ws-ticket/");
    return response.data.ticket;
  },
  // === Subjects ===
  fetchSubjects: async () => {
    const response = await api.get("/auth/subjects/");
    return subjectListResponseSchema.parse(response.data);
  },
  fetchSubjectDetail: async (id: string) => {
    const response = await api.get(`/auth/subjects/${id}/`);
    return subjectResponseSchema.parse(response.data);
  },
  createSubject: (data: SubjectInput) =>
    api.post<SubjectDTO>("/auth/subjects/", data).then((res) => res.data),
  updateSubject: (id: string, data: Partial<SubjectInput>) =>
    api.patch<SubjectDTO>(`/auth/subjects/${id}/`, data),
  deleteSubject: (id: string) => api.delete(`/auth/subjects/${id}/`),

  // === Chapters ===
  fetchChapters: () => api.get<ChapterDTO[]>("/auth/chapters/"),
  fetchChapterDetail: (id: string) =>
    api.get<ChapterDTO>(`/auth/chapters/${id}/`),

  fetchChapterMessages: async (url: string): Promise<PaginatedMessages> => {
    const response = await api.get(url);
    return paginatedMessagesSchema.parse(response.data);
  },

  createChapter: (data: ChapterInput) =>
    api.post<ChapterDTO>("/auth/chapters/", data).then((res) => res.data),
  deleteChapter: (id: string) => api.delete(`/auth/chapters/${id}/`),
  // Reassign a chapter to a subject (or null to make it loose/unassigned).
  moveChapter: (id: string, subject: string | null) =>
    api.patch(`/auth/chapters/${id}/`, { subject }),

  // === Documents ===
  fetchDocuments: () => api.get<DocumentDTO[]>("/auth/documents/"),
  fetchDocumentDetail: (id: string) =>
    api.get<DocumentDTO>(`/auth/documents/${id}/`),
  uploadDocument: (
    formData: FormData,
    onUploadProgress?: (percent: number) => void,
  ) =>
    api.post<DocumentDTO>("/auth/documents/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (onUploadProgress && e.total) {
          onUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    }),
  retryDocument: (id: string) => api.post(`/auth/documents/${id}/retry/`),
  updateDocument: (
    id: string,
    data: Partial<{ title: string; chapter?: string }>
  ) => api.patch(`/auth/documents/${id}/`, data),
  deleteDocument: (id: string) => api.delete(`/auth/documents/${id}/`),

  // === Chat Sessions ===
  fetchChatSessions: () => api.get<ChatSessionDTO[]>("/auth/chatsessions/"),
  fetchChatSessionDetail: (id: string) =>
    api.get<ChatSessionDTO>(`/auth/chatsessions/${id}/`),
  createChatSession: (data: ChatSessionInput) =>
    api.post<ChatSessionDTO>("/auth/chatsessions/", data),

  // === RAG Chat (New) ===
  sendRagMessage: async (payload: {
    chapterId: string;
    text: string;
  }): Promise<RagChatMessageDTO> => {
    try {
      const apiPayload = {
        chapter: payload.chapterId,
        text: payload.text,
      };
      const response = await api.post("/auth/rag-chat/", apiPayload);
      return ragChatResponseSchema.parse(response.data);
    } catch (error) {
      console.error("API Error: sendRagMessage failed", error);
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        const errorMessage =
          error.response.data?.error || "Document not ready for chat.";
        throw new Error(errorMessage);
      }
      throw error;
    }
  },

  // === Chat Messages ===
  sendChatMessage: (data: ChatMessageInput) =>
    api.post<ChatMessageDTO>("/auth/chatmessage/", data),

  generateQuestions: async (
    chapterId: string
  ): Promise<GeneratedQuestion[]> => {
    try {
      const response = await api.post(
        `/auth/chapters/${chapterId}/generate-questions/`
      );
      return z.array(generatedQuestionSchema).parse(response.data);
    } catch (error) {
      console.error("API Error: generateQuestions failed", error);
      throw error;
    }
  },

  fetchQuestions: async (chapterId: string): Promise<GeneratedQuestion[]> => {
    const response = await api.get(`/auth/chapters/${chapterId}/questions/`);
    return z.array(generatedQuestionSchema).parse(response.data);
  },

  
  generateFlashCards: async (chapterId: string): Promise<FlashCard[]> => {
    try {
      const response = await api.post(`/auth/chapters/${chapterId}/generate-flashcards/`);
      return z.array(flashCardSchema).parse(response.data);
    } catch (error) {
      console.error("API Error: generateFlashcards failed", error);
      throw error;
    }
  },


  fetchFlashCards: async (chapterId: string) => {
    const response = await api.get(`/auth/chapters/${chapterId}/flashcards/`)
    return z.array(flashCardSchema).parse(response.data)
  },
  
  updatedFlashCard : async (id: string, data: z.infer<typeof flashCardUpdateSchema>) => {
    const response = await api.patch(`/auth/flashcards/${id}/`, data)
    return flashCardSchema.parse(response.data)
  },

  deleteFlashCard: async (id: string) => {
    await api.delete(`/auth/flashcards/${id}/`);
  },

  // === Co-reading: document content ===
  fetchDocumentContent: async (id: string): Promise<DocumentContentDTO> => {
    const response = await api.get(`/auth/documents/${id}/content/`);
    return documentContentSchema.parse(response.data);
  },

  fetchDocumentPages: async (id: string): Promise<DocumentPageDTO[]> => {
    const response = await api.get(`/auth/documents/${id}/pages/`);
    return z.array(documentPageSchema).parse(response.data);
  },

  // === Co-reading: notes CRUD ===
  fetchNotes: async (chapterId: string): Promise<NoteDTO[]> => {
    const response = await api.get(`/auth/chapters/${chapterId}/notes/`);
    return z.array(noteSchema).parse(response.data);
  },
  createNote: async (
    chapterId: string,
    payload: NoteCreateInput,
  ): Promise<NoteDTO> => {
    const response = await api.post(`/auth/chapters/${chapterId}/notes/`, payload);
    return noteSchema.parse(response.data);
  },
  updateNote: async (
    id: string,
    patch: Partial<Pick<NoteDTO, "body" | "kind" | "color">>,
  ): Promise<NoteDTO> => {
    const response = await api.patch(`/auth/notes/${id}/`, patch);
    return noteSchema.parse(response.data);
  },
  deleteNote: async (id: string) => {
    await api.delete(`/auth/notes/${id}/`);
  },

  // === Co-reading: scratch pad (single get-or-create note per chapter) ===
  fetchScratch: async (chapterId: string): Promise<NoteDTO> => {
    const response = await api.get(`/auth/chapters/${chapterId}/scratch/`);
    return noteSchema.parse(response.data);
  },
  saveScratch: async (chapterId: string, body: string): Promise<NoteDTO> => {
    const response = await api.put(`/auth/chapters/${chapterId}/scratch/`, { body });
    return noteSchema.parse(response.data);
  },

  // === Co-reading: smart AI actions ===
  explainPassage: async (
    chapterId: string,
    payload: {
      passage: string;
      document?: string | null;
      anchor_start?: number | null;
      anchor_end?: number | null;
    },
  ): Promise<NoteDTO> => {
    const response = await api.post(`/auth/chapters/${chapterId}/explain/`, payload);
    return noteSchema.parse(response.data);
  },
  notesToFlashcards: async (
    chapterId: string,
    noteIds: string[],
  ): Promise<FlashCard[]> => {
    const response = await api.post(
      `/auth/chapters/${chapterId}/notes-to-flashcards/`,
      { note_ids: noteIds },
    );
    return z.array(flashCardSchema).parse(response.data);
  },
  synthesizeNotes: async (chapterId: string): Promise<string> => {
    const response = await api.post(`/auth/chapters/${chapterId}/synthesize-notes/`);
    return z.object({ summary: z.string() }).parse(response.data).summary;
  },

};
