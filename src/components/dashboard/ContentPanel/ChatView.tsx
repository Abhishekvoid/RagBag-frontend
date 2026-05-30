"use client";

import ReactMarkdown from "react-markdown";
import { useState, useRef, useEffect } from "react";
import { useNotebookStore, Chapter } from "@/lib/store/useNotebook";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatSkeleton } from "./ChatSkeleton";

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

  const isLoadingHistory =
    chapter.pagination?.isLoading && messages.length === 0;

  // --- EFFECTS ---
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages.length, isAiResponding]);

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
      <div className="p-4 border-b border-border flex-shrink-0 bg-background/50 backdrop-blur-sm z-10">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          {chapter.name}
        </h2>
        <p className="text-xs text-muted-foreground">
          {chapter.documents.length} source(s) connected
        </p>
      </div>

      {/* Chat History Area */}
      <div
        ref={chatContainerRef}
        className="flex-grow overflow-y-auto relative scroll-smooth"
      >
        {isLoadingHistory ? (
          // 1. UX POLISH: Show Futuristic Skeleton while loading
          <ChatSkeleton />
        ) : messages.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center opacity-60">
            <BotIcon />
            <p className="mt-4">No messages yet. Ask something!</p>
          </div>
        ) : (
          // Actual Messages
          <div className="p-4 space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                  msg.sender === "user" && "flex-row-reverse",
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-full shrink-0",
                    msg.sender === "user"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {msg.sender === "user" ? <UserIcon /> : <BotIcon />}
                </div>

                <div
                  className={cn(
                    "p-4 px-6 rounded-2xl max-w-[90%] prose prose-headings:text-foreground prose-p:mb-6 prose-p:mt-6 prose-p:leading-relaxed prose-p:text-sm prose-strong:font-semibold prose-ul:mt-6 prose-ul:mb-6 prose-li:leading-relaxed prose-li:mb-2 shadow-lg",
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary-foreground rounded-tr-none border"
                      : "bg-card/95 backdrop-blur-sm border border-border/50 rounded-tl-none",
                  )}
                >
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p className="mb-8 leading-7 first:mt-0 last:mb-0">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="mt-6 mb-6 space-y-3 list-disc ml-6">
                          {children}
                        </ul>
                      ),
                      li: ({ children }) => (
                        <li className="mb-3 leading-7">{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-foreground">
                          {children}
                        </strong>
                      ),
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

            {/* Loading indicator for when the AI is responding */}
            {isAiResponding && (
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-full bg-muted text-muted-foreground shrink-0">
                  <BotIcon />
                </div>
                <div className="p-3 px-4 rounded-2xl rounded-tl-none bg-card border border-border text-muted-foreground text-sm flex items-center gap-2">
                  <div className="flex gap-1">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-border flex-shrink-0 bg-background/80 backdrop-blur-md">
        <form
          onSubmit={handleSubmit}
          className="relative flex gap-2 items-center"
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Ask about "${chapter.name}"...`}
            className="flex-grow pr-12 h-12 bg-card/50 focus:bg-card transition-all"
            disabled={isAiResponding || isLoadingHistory}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-md transition-transform active:scale-95"
            disabled={isAiResponding || !inputValue.trim()}
          >
            <SendIcon />
          </Button>
        </form>
        <p className="text-[10px] text-center text-muted-foreground/60 mt-2">
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </>
  );
}
