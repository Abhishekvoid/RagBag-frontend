"use client";

import ReactMarkdown from "react-markdown";
import { useState, useRef, useEffect } from "react";
import { useNotebookStore, Chapter, Message } from "@/lib/store/useNotebook";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- Icons ---
const SendIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);
const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const BotIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 8V4H8" />
    <rect width="16" height="12" x="4" y="8" rx="2" />
    <path d="M2 14h2" />
    <path d="M20 14h2" />
    <path d="M15 13v2" />
    <path d="M9 13v2" />
  </svg>
);

export interface ChatViewProps {
  chapter: Chapter;
}

export function ChatView({ chapter }: ChatViewProps) {
  // --- STATE & STORE HOOKS ---
  const [inputValue, setInputValue] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const sendMessage = useNotebookStore((state) => state.sendMessage);
  const isAiResponding = useNotebookStore((state) => state.isAiResponding);

  const messages = chapter.messages || [];

  // --- EFFECTS ---
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages.length]);

  // --- HANDLERS ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isAiResponding) return;
    sendMessage(inputValue.trim());
    setInputValue("");
  };

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <h2 className="text-lg font-semibold text-foreground">
          Chat with: {chapter.name}
        </h2>
        <p className="text-sm text-muted-foreground">
          {chapter.documents.length} source(s) available
        </p>
      </div>

      {/* Chat History */}
      <div
        ref={chatContainerRef}
        className="flex-grow p-4 overflow-y-auto space-y-6"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex items-start gap-4",
              msg.sender === "user" && "flex-row-reverse"
            )}
          >
            <div
              className={cn(
                "p-2 rounded-full",
                msg.sender === "user"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted"
              )}
            >
              {msg.sender === "user" ? <UserIcon /> : <BotIcon />}
            </div>

            <div
              className={cn(
                "p-3 rounded-lg max-w-[80%] prose dark:prose-invert",
                msg.sender === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
            {/* --- END OF CHANGE --- */}
          </div>
        ))}
        {/* Loading indicator for when the AI is responding */}
        {isAiResponding && (
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-full bg-muted">
              <BotIcon />
            </div>
            <div className="p-3 rounded-lg bg-muted text-muted-foreground">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-border flex-shrink-0 bg-background">
        <form
          onSubmit={handleSubmit}
          className="relative flex gap-2 items-center"
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your sources..."
            className="flex-grow pr-12"
            disabled={isAiResponding}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7"
            disabled={isAiResponding || !inputValue.trim()}
          >
            <SendIcon />
          </Button>
        </form>
        <p className="text-xs text-center text-muted-foreground mt-2">
          StudyWise can be inaccurate. Please double-check its responses.
        </p>
      </div>
    </>
  );
}
