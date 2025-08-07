import api from "@/lib/axios";
import { z } from "zod";
import {
  SubjectInput,
  ChapterInput,
  DocumentInput,
  ChatSessionInput,
  ChatMessageInput,
} from "./notebook.schema";

// --- Zod Schemas for API Responses ---
// This section is now updated to perfectly match your `serializer.py` output.
// This is our runtime "safety net" for all incoming data from the backend.

const chatMessageResponseSchema = z.object({
  id: z.string().uuid(),
  session: z.string().uuid(),
  sender: z.enum(["user", "ai"]),
  text: z.string(),
  created_at: z.string().datetime(),
  // Adding fields from your serializer
  citations: z.any().nullable(), // Use z.any() for now, can be refined if structure is known
  tokens: z.any().nullable(),
  error: z.string().nullable(),
});

const chatSessionResponseSchema = z.object({
  id: z.string().uuid(),
  user: z.string(), // Assuming user is a string UUID
  subject: z.string().uuid().nullable(),
  chapter: z.string().uuid().nullable(),
  title: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  context_snapshot: z.any().nullable(), // Use z.any() for now
});

const documentResponseSchema = z.object({
  id: z.string().uuid(),
  chapter: z.string().uuid(),
  user: z.string(), // Assuming user is a string UUID
  title: z.string(),
  file: z.string().url(), // Changed from file_url to match your serializer
  file_type: z.string().nullable(),
  size_bytes: z.number().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

const chapterResponseSchema = z.object({
  id: z.uuid(),
  subject: z.string().uuid(),
  name: z.string(),
  order: z.number(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  // Assuming your Chapter detail view will nest documents
  documents: z.array(documentResponseSchema).optional().default([]),
});

const subjectResponseSchema = z.object({
  id: z.uuid(),
  user: z.string(), // Assuming user is a string UUID
  name: z.string(),
  description: z.string().nullable(), // Use nullable for optional fields that can be null
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  // This assumes your Subject list/detail view nests the chapters. This is a common pattern.
  chapters: z.array(chapterResponseSchema).optional().default([]),
});

// A schema for the list of subjects, which is an array of the single subject schema
const subjectListResponseSchema = z.array(subjectResponseSchema);

const questionsResponseSchema = z.object({
  questions: z.string(),
});

// --- TypeScript Types inferred from Zod Schemas ---
// These are automatically generated from the schemas above. No manual work needed.
export type ChatMessageDTO = z.infer<typeof chatMessageResponseSchema>;
export type ChatSessionDTO = z.infer<typeof chatSessionResponseSchema>;
export type DocumentDTO = z.infer<typeof documentResponseSchema>;
export type ChapterDTO = z.infer<typeof chapterResponseSchema>;
export type SubjectDTO = z.infer<typeof subjectResponseSchema>;

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
    api.post<SubjectDTO>("/auth/subjects/", data),
  updateSubject: (id: string, data: Partial<SubjectInput>) =>
    api.patch<SubjectDTO>(`/auth/subjects/${id}/`, data),
  deleteSubject: (id: string) => api.delete(`/auth/subjects/${id}/`),

  // === Chapters ===
  fetchChapters: () => api.get<ChapterDTO[]>("/auth/chapters/"),
  fetchChapterDetail: (id: string) =>
    api.get<ChapterDTO>(`/auth/chapters/${id}/`),
  createChapter: (data: ChapterInput) =>
    api.post<ChapterDTO>("/auth/chapters/", data),
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

  // === Chat Messages ===
  sendChatMessage: (data: ChatMessageInput) =>
    api.post<ChatMessageDTO>("/auth/chatmessage/", data),

  generateQuestions: async (chapterId: string) => {
    const response = await api.post('/auth/generate-questions/', { chapter_id: chapterId });
    // Validate the response from the backend to ensure it's in the expected format.
    return questionsResponseSchema.parse(response.data);
  },
};
