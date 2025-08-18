import api from "@/lib/axios";
import { z } from "zod";
import type {
  SubjectInput,
  ChapterInput,
  DocumentInput,
  ChatSessionInput,
  ChatMessageInput,
  Message,

} from "./notebook.schema";
import { fetchChapterDetail } from "./api";

// --- Zod Schemas for API Responses ---
// This section is now updated to perfectly match your `serializer.py` output.
// This is our runtime "safety net" for all incoming data from the backend.

export const chatMessageResponseSchema = z.object({
  id: z.uuid(),
  session: z.uuid(),
  sender: z.enum(["user", "ai"]),
  text: z.string(),
  created_at: z.string().datetime(),
  // Adding fields from your serializer
  citations: z.any().nullable(), // Use z.any() for now, can be refined if structure is known
  tokens: z.any().nullable(),
  error: z.string().nullable(),
});

export const chatSessionResponseSchema = z.object({
  id: z.uuid(),
  user: z.string(),
  subject: z.uuid().nullable(),
  chapter: z.uuid().nullable(),
  title: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  context_snapshot: z.any().nullable(),
});

const documentResponseSchema = z.object({
  id: z.uuid(),
  chapter: z.uuid(),
  user: z.string(), // Assuming user is a string UUID
  title: z.string(),
  file: z.string().url(), // Changed from file_url to match your serializer
  file_type: z.string().nullable(),
  size_bytes: z.number().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export const chapterResponseSchema = z.object({
  id: z.uuid(),
  subject: z.uuid().nullable(),
  name: z.string(),
  order: z.number(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  documents: z.array(documentResponseSchema).optional().default([]),
});

export const subjectResponseSchema = z.object({
  id: z.union([z.uuid(), z.literal("uncategorized-chapters")]), 
  user: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  chapters: z.array(chapterResponseSchema).optional().default([]),
});

export const ragChatResponseSchema = z.object({
  id: z.uuid(),
  sender: z.literal("ai"),
  text: z.string(),
})

export const paginatedMessagesSchema = z.object({
  count: z.number(),
  next: z.url().nullable(),
  previous: z.string().url().nullable(),
  results: z.array(ragChatResponseSchema),
});

const subjectListResponseSchema = z.array(subjectResponseSchema);

const questionsResponseSchema = z.object({
  questions: z.string(),
});

// --- TypeScript Types inferred from Zod Schemas ---
// These are automatically generated from the schemas above. No manual work needed.
export type ChatMessageDTO = z.infer<typeof chatMessageResponseSchema>;
export type ChatSessionDTO = z.infer<typeof chatSessionResponseSchema> & {
  messages? : Message[];
};
export type DocumentDTO = z.infer<typeof documentResponseSchema> & {
  messages?:  Message[];
  chatHistory?: {
    nextPageUrl: string | null;
    isLoading: boolean;
    hasMore: boolean
  };
};
export type ChapterDTO = z.infer<typeof chapterResponseSchema>;
export type SubjectDTO = z.infer<typeof subjectResponseSchema>;
export type RagChatMessageDTO = z.infer<typeof ragChatResponseSchema>;
export type PaginatedMessages = z.infer<typeof paginatedMessagesSchema>;

// --- API Service Object ---
// The functions remain the same, but now they use the updated schemas for validation.
export const notebookApi = {
  // === Subjects ===
  fetchSubjects: async () => {
    const response = await api.get("/auth/subjects/");
    // **RUNTIME VALIDATION**: Zod now validates against the updated schema.
    return subjectListResponseSchema.parse(response.data);
  },
  fetchSubjectDetail: async (id: string) => {
    const response = await api.get(`/auth/subjects/${id}/`);
    return subjectResponseSchema.parse(response.data);
  },
   createSubject: (data: SubjectInput) =>
    api.post<SubjectDTO>("/auth/subjects/", data).then(res => res.data),
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
    api.post<ChapterDTO>("/auth/chapters/", data).then(res => res.data),
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
 sendRagMessage: async (
  payload: { chapterId: string; text: string }
): Promise<RagChatMessageDTO> => {
  try {
    const response = await api.post('/auth/rag-chat/', payload);
    return ragChatResponseSchema.parse(response.data);
  } catch (error) {
    console.error("API Error: sendRagMessage failed", error);
    throw error;
  }
},

  // === Chat Messages ===
  sendChatMessage: (data: ChatMessageInput) =>
    api.post<ChatMessageDTO>("/auth/chatmessage/", data),

  generateQuestions: async (chapterId: string) => {
    const response = await api.post('/auth/generate-questions/', { chapter_id: chapterId });
    // Validate the response from the backend to ensure it's in the expected format.
    return questionsResponseSchema.parse(response.data);
  },
};
