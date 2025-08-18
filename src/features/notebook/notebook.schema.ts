
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





export const subjectSchema = z.object({
  // id: z.uuid(),
  name: z.string().min(3, "Subject name can't be blank").trim(),
  description: z.string().optional(),
});

export const chapterSchema = z.object({
  subject: z.uuid("You must select a subject.").optional().nullable(),
  name: z.string().min(3, "chapter name can't be blank").trim(),
  order: z.number().min(1, "order must be poositive integer"),
});

export const documentSchema = z.object({
  chapter: z.uuid(),
  title: z.string().min(1, "Title cannot be empty").max(100, "Title too long"),
  file: z
    .instanceof(File)
    .refine((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      return ext
        ? (ALLOWED_EXTENSIONS as readonly string[]).includes(ext)
        : false;
    }, `Allowed file types are: ${ALLOWED_EXTENSIONS.join(", ")}`)
    .refine(
      (file) => file.size <= MAX_UPLOAD_SIZE,
      "File size must be less than 50MB"
    ),
});

export const chatSessionSchema = z.object({
  subject: z.uuid().optional().nullable(),
  chapter: z.uuid().optional().nullable(),
  title: z.string().min(3, "title can't be empty").optional(),
});

const senderEnum = ["user", "ai"] as const;
export const chatMessageSchema = z.object({
  session: z.uuid({ message: "Invalid session ID" }),
  sender: z.enum(senderEnum, { message: "Sender is required" }),
  text: z.string().min(1, "Message text cannot be empty"),
});


export const messageSchema = z.object({
  id: z.string().uuid(),
  sender: z.enum(senderEnum),
  text: z.string().min(1),
  created_at: z.string().optional(),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type ChatSessionInput = z.infer<typeof chatSessionSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;
export type ChapterInput = z.infer<typeof chapterSchema>;
export type SubjectInput = z.infer<typeof subjectSchema>;
export type Message = z.infer<typeof messageSchema>;