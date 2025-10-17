
import { z } from "zod";
const ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "jpg",
  "jpeg",
  "png",
  "gif",
] as const;
const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;





export const subjectInputSchema = z.object({
  name: z.string().min(1, "Subject name can't be blank").trim(),
  description: z.string().optional(),
});

export const chapterInputSchema = z.object({
  subject: z.uuid("You must select a subject.").optional().nullable(),
  name: z.string().min(1, "Chapter name can't be blank").trim(),
  order: z.number().min(1, "Order must be a positive integer").optional(),
});

export const documentInputSchema = z.object({
  chapter: z.uuid(),
  title: z.string().min(1, "Title cannot be empty").max(100, "Title too long"),
  file: z.instanceof(File)
    .refine(
      (file) => file.size <= MAX_UPLOAD_SIZE,
      "File size must be less than 50MB"
    )
    .refine((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      return ext ? (ALLOWED_EXTENSIONS as readonly string[]).includes(ext) : false;
    }, `Allowed file types are: ${ALLOWED_EXTENSIONS.join(", ")}`),
});

// --- NEW: Schemas for chat inputs ---
export const chatSessionInputSchema = z.object({
  subject: z.uuid().optional().nullable(),
  chapter: z.uuid().optional().nullable(),
  title: z.string().min(1, "Title can't be empty").optional(),
});

export const chatMessageInputSchema = z.object({
  session: z.uuid({ message: "Invalid session ID" }),
  text: z.string().min(1, "Message text cannot be empty"),
});

// Exporting the TypeScript types for form inputs
export type SubjectInput = z.infer<typeof subjectInputSchema>;
export type ChapterInput = z.infer<typeof chapterInputSchema>;
export type DocumentInput = z.infer<typeof documentInputSchema>;
export type ChatSessionInput = z.infer<typeof chatSessionInputSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageInputSchema>;

// ==================================================================
// --- API Response (DTO) Schemas (For validating backend data) ---
// ==================================================================

export const documentResponseSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
  error_message: z.string().nullable(),
  created_at: z.string(),
});

export const chapterResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  subject: z.uuid().nullable(),
  documents: z.array(documentResponseSchema),
  order: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const subjectResponseSchema = z.object({
  id: z.union([z.uuid(), z.literal("uncategorized-chapters")]),
  name: z.string(),
  chapters: z.array(chapterResponseSchema),
  description: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export const subjectListResponseSchema = z.array(subjectResponseSchema);

const senderEnum = ["user", "ai"] as const;

// --- NEW: Schemas for chat responses ---
export const chatSessionDTOSchema = z.object({
    id: z.uuid(),
    user: z.uuid(),
    subject: z.uuid().nullable(),
    chapter: z.uuid().nullable(),
    title: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    context_snapshot: z.string().nullable(),
});

export const chatMessageDTOSchema = z.object({
  id: z.uuid(),
  session: z.uuid(),
  sender: z.enum(senderEnum),
  text: z.string(),
  tokens: z.number().nullable(),
  citations: z.any().nullable(),
  error: z.string().nullable(),
  created_at: z.string(),
});

export const ragChatResponseSchema = z.object({
  id: z.uuid(),
  sender: z.enum(["user", "ai"]),
  text: z.string(),
});

export const paginatedMessagesSchema = z.object({
  count: z.number(),
  next: z.string().url().nullable(),
  previous: z.string().url().nullable(),
  results: z.array(ragChatResponseSchema),
});
export const questionsResponseSchema = z.object({
  questions: z.array(z.string()),
});

export const generatedQuestionSchema = z.object({
  id: z.uuid(),
  question_text:z.string(),
  answer_text: z.string(),
  created_at: z.string().datetime(),
})
export type QuestionsResponseDTO = z.infer<typeof questionsResponseSchema>;
// Exporting all the TypeScript types for API responses and UI components
export type DocumentDTO = z.infer<typeof documentResponseSchema>;
export type ChapterDTO = z.infer<typeof chapterResponseSchema>;
export type SubjectDTO = z.infer<typeof subjectResponseSchema>;
export type ChatSessionDTO = z.infer<typeof chatSessionDTOSchema>;
export type ChatMessageDTO = z.infer<typeof chatMessageDTOSchema>;
export type RagChatMessageDTO = z.infer<typeof ragChatResponseSchema>;
export type PaginatedMessages = z.infer<typeof paginatedMessagesSchema>;
export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
export type Message = {
    id: string;
    sender: "user" | "ai";
    text: string;
    error?: boolean;
};


