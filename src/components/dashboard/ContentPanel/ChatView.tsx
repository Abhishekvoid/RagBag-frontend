"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BookOpenText } from "lucide-react";
import { useNotebookStore, Chapter } from "@/lib/store/useNotebook";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChatSkeleton } from "./ChatSkeleton";
import { AnswerMarkdown } from "./AnswerMarkdown";

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
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const hasReadableSource = chapter.documents.some((d) => d.status === "COMPLETED");

  const sendMessage = useNotebookStore((state) => state.sendMessage);
  const isAiResponding = useNotebookStore((state) => state.isAiResponding);

  const messages = useMemo(() => chapter.messages || [], [chapter.messages]);

  // Recommended questions only make sense for the most recent answer — acting
  // on an older answer's suggestions would be confusing. So only the last AI
  // message renders its follow-ups; the rest keep them stored but hidden.
  const lastAiMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === "ai") return messages[i].id;
    }
    return null;
  }, [messages]);

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

  const BotAvatar = () => (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary [&_svg]:size-4">
      <BotIcon />
    </span>
  );

  return (
    <>
      {/* Header */}
      <div className="z-10 flex flex-shrink-0 items-center justify-between gap-3 border-b border-border bg-background/60 px-5 py-3 backdrop-blur-sm">
        <div className="min-w-0">
          <h2 className="truncate font-display text-[15px] font-semibold tracking-tight text-foreground">
            {chapter.name}
          </h2>
          <p className="mt-0.5 truncate font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            {chapter.documents.length} source{chapter.documents.length === 1 ? "" : "s"} connected
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {hasReadableSource && (
            <button
              type="button"
              onClick={() => router.push(`/dashboard/chapter/${chapter.id}`)}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-primary/10 active-press"
            >
              <BookOpenText size={14} className="text-primary" />
              Open reading workspace
            </button>
          )}
          <span className="hidden items-center gap-2 rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground sm:inline-flex">
            <span className="size-1.5 rounded-full bg-primary olive-pulse" />
            Grounded
          </span>
        </div>
      </div>

      {/* Chat History Area */}
      <div ref={chatContainerRef} className="relative flex-grow overflow-y-auto scroll-smooth">
        {isLoadingHistory ? (
          <ChatSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary [&_svg]:size-7">
              <BotIcon />
            </span>
            <h3 className="pencil mt-5 font-display text-lg font-semibold text-foreground">
              Ask your first question
            </h3>
            <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
              Every answer is pulled straight from the sources in this chapter, and cited to the page.
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-7 px-5 py-6">
            {messages.map((msg) =>
              msg.sender === "user" ? (
                <div key={msg.id} className="flex justify-end duration-300 animate-in fade-in slide-in-from-bottom-2">
                  <div className="max-w-[82%] break-words rounded-2xl rounded-br-md bg-secondary px-4 py-3 text-[14.5px] leading-relaxed text-foreground">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex items-start gap-3 duration-300 animate-in fade-in slide-in-from-bottom-2">
                  <BotAvatar />
                  <div className="min-w-0 flex-1 break-words">
                    <AnswerMarkdown>{msg.text}</AnswerMarkdown>

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3">
                        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          Sources
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map((s, i) => (
                            <span
                              key={`${s.document_id}-${i}`}
                              title={s.snippet}
                              className="max-w-[220px] truncate rounded-md border border-border bg-secondary/40 px-2 py-1 text-[11px] text-muted-foreground"
                            >
                              {s.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.id === lastAiMessageId && msg.followups && msg.followups.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {msg.followups.map((q, i) => (
                          <button
                            key={i}
                            type="button"
                            disabled={isAiResponding}
                            onClick={() => sendMessage(q)}
                            className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-[12.5px] text-foreground transition-colors hover:bg-primary/10 disabled:opacity-50"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}

            {isAiResponding && (
              <div className="flex items-start gap-3">
                <BotAvatar />
                <div className="flex items-center gap-1.5 pt-2.5">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="size-1.5 animate-bounce rounded-full bg-primary/60"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="flex-shrink-0 border-t border-border bg-background/80 px-5 py-4 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="relative mx-auto flex max-w-3xl items-center gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Ask about "${chapter.name}"…`}
            className="h-12 flex-grow rounded-xl bg-secondary/60 pr-12 transition-colors focus:bg-secondary"
            disabled={isAiResponding || isLoadingHistory}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-1.5 top-1/2 size-9 -translate-y-1/2 rounded-lg transition-transform active:scale-95"
            disabled={isAiResponding || !inputValue.trim()}
          >
            <SendIcon />
          </Button>
        </form>
        <p className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-muted-foreground/60">
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </>
  );
}
