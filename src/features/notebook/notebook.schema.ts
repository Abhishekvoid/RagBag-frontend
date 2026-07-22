
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
  suggestions: z.array(z.string()).nullable().optional(),
});

export const sourceChipSchema = z.object({
  document_id: z.string(),
  title: z.string(),
  snippet: z.string(),
});

export const ragChatResponseSchema = z.object({
  id: z.uuid(),
  sender: z.enum(["user", "ai"]),
  text: z.string(),
  sources: z.array(sourceChipSchema).optional().default([]),
  followups: z.array(z.string()).optional().default([]),
});

// History messages come from ChatMessageSerializer, which returns `citations`
// (the persisted source chips) and `suggestions` (the persisted follow-ups) —
// NOT the live-response `sources`/`followups` shape. Parse that real shape so
// those fields survive; loadChatHistory maps them back onto the UI message.
export const paginatedMessagesSchema = z.object({
  count: z.number(),
  next: z.string().url().nullable(),
  previous: z.string().url().nullable(),
  results: z.array(chatMessageDTOSchema),
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

export const flashCardSchema =  z.object({
  id:z.uuid(),
  chapter: z.uuid().nullable(),
  flashcard_front: z.string().min(1, "Front cannot be empty"),
  flashcard_back: z.string().min(1, "Back cannot be empty"),
  known: z.boolean(),
  need_review: z.boolean(),
  created_at: z.string().datetime()
})

export const flashCardUpdateSchema = z.object({
  known: z.boolean().optional(),
  need_review: z.boolean().optional(),
})

// --- Co-reading: notes + document content ---
export const NOTE_KINDS = ["highlight", "note", "ai", "chat", "scratch"] as const;
export type NoteKind = (typeof NOTE_KINDS)[number];

export const noteSchema = z.object({
  id: z.uuid(),
  chapter: z.uuid(),
  document: z.uuid().nullable(),
  kind: z.enum(NOTE_KINDS),
  anchor_start: z.number().nullable(),
  anchor_end: z.number().nullable(),
  quoted_text: z.string(),
  body: z.string(),
  color: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type NoteDTO = z.infer<typeof noteSchema>;

export const documentContentSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  text: z.string(),
});
export type DocumentContentDTO = z.infer<typeof documentContentSchema>;

// Payload for creating a note (chapter comes from the URL).
export type NoteCreateInput = {
  kind: NoteKind;
  document?: string | null;
  anchor_start?: number | null;
  anchor_end?: number | null;
  quoted_text?: string;
  body?: string;
  color?: string;
};
export type QuestionsResponseDTO = z.infer<typeof questionsResponseSchema>;
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

export type FlashCard = z.infer<typeof flashCardSchema>;
export type FlashCardUpdate = z.infer<typeof flashCardUpdateSchema>;