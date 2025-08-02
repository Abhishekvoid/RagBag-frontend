import api from "@/lib/axios";

// ---------- SUBJECT ------------

export const fetchSubjects = () => api.get("/subjects/");
export const createSubject = (data: { name: string; description?: string }) =>
  api.post("/subjects/", data);
export const updateSubject = (
  id: string,
  data: Partial<{ name: string; description: string }>
) => api.patch(`/subjects/${id}/`, data);
export const deleteSubject = (id: string) => api.delete(`/subject/${id}/`);
export const fetchSubjectsDetail = (id: string) => api.get(`/subjects/${id}/`);

// ------------ CHAPTER -----------

export const fetchChapters = () => api.get("/chapters/");
export const createChapters = (data: {
  subjects?: string;
  name: string;
  order: number;
}) => api.post(`/chapters/`, data);

export const deleteChapter = (id: string) => api.delete(`/chapters/${id}/`);
export const fetchChapterDetail = (id: string) => api.get(`/chapters/${id}/`);

// ------------ DOCUMENTs ----------

export const fectchDocuments = () => api.get("/documents/");
export const uploadDocument = (formData: FormData) =>
  api.post("/documents/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const updateDocument = (
  id: string,
  data: Partial<{ title: string; chapter?: string }>
) => api.patch(`/documents/${id}/`, data);
export const deleteDocument = (id: string) => api.delete(`/documents/${id}/`);
export const fetchDocumentDetail = (id: string) => api.get(`/documents/${id}/`);

// ------------ CHATSESSIONS -----------

export const fetchChatSessions = () => api.get("/chatsessions/");
export const createChatSession = (data: {
  subject?: string;
  chapter?: string;
  title?: string;
}) => api.post("/chatsessions/", data);
export const fetchChatSessionDetail = (id: string) =>
  api.get(`/chatsessions/${id}/`);

// --------- CHAT MESSAGES ---------
// Your Django uses 'chatmessage/' (not plural)
export const sendChatMessage = (data: {
  session: string;
  sender: "user" | "ai";
  text: string;
}) => api.post("/chatmessage/", data);
// export const fetchChatMessages = (sessionId: string) =>
//   api.get(`/chatmessage/?session=${sessionId}`);
