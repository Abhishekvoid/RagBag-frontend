// features/notebook/notebook.api.ts

import api from "@/lib/axios";
import { z } from "zod";
// --- NEW: Import all schemas and types from the single schema file ---
import {
  SubjectInput,
  ChapterInput,
  ChatSessionInput,
  ChatMessageInput,
  Message,
  SubjectDTO,
  ChapterDTO,
  DocumentDTO,
  ChatSessionDTO,
  ChatMessageDTO,
  RagChatMessageDTO,
  PaginatedMessages,
  subjectListResponseSchema,
  subjectResponseSchema,
  chapterResponseSchema,
  paginatedMessagesSchema,
  ragChatResponseSchema,
  questionsResponseSchema,
  generatedQuestionSchema,
  GeneratedQuestion,
} from "./notebook.schema";
import axios from "axios"; 

export const notebookApi = {
  oauthSignIn: async (payload: {
    email: string;
    name: string;
    provider: string;
  }) => {
    const response = await api.post("/auth/oauth-signin/", payload);
    return response.data;
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

  // === Documents ===
  fetchDocuments: () => api.get<DocumentDTO[]>("/auth/documents/"),
  fetchDocumentDetail: (id: string) =>
    api.get<DocumentDTO>(`/auth/documents/${id}/`),
  uploadDocument: (formData: FormData) =>
    api.post<DocumentDTO>("/auth/documents/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
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
      // --- NEW: Specific error handling for the 409 Conflict status code ---
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
};
