"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Send, Bookmark, Check } from "lucide-react";
import { useNotebookStore, type Chapter } from "@/lib/store/useNotebook";
import { useCoReadingStore } from "@/lib/store/useCoReading";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnswerMarkdown } from "@/components/dashboard/ContentPanel/AnswerMarkdown";
import { ChatSkeleton } from "@/components/dashboard/ContentPanel/ChatSkeleton";
import { cn } from "@/lib/utils";

export function ChatTab({ chapter }: { chapter: Chapter }) {
  const [inputValue, setInputValue] = useState("");
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sendMessage = useNotebookStore((s) => s.sendMessage);
  const isAiResponding = useNotebookStore((s) => s.isAiResponding);

  const pendingAsk = useCoReadingStore((s) => s.pendingAsk);
  const consumePendingAsk = useCoReadingStore((s) => s.consumePendingAsk);
  const addNote = useCoReadingStore((s) => s.addNote);

  const messages = useMemo(() => chapter.messages || [], [chapter.messages]);
  const isLoadingHistory = chapter.pagination?.isLoading && messages.length === 0;

  // "Ask" handoff from the reader prefills the input and focuses it.
  useEffect(() => {
    if (pendingAsk) {
      setInputValue(
        `About this passage: "${truncate(pendingAsk, 240)}" — `,
      );
      consumePendingAsk();
      inputRef.current?.focus();
    }
  }, [pendingAsk, consumePendingAsk]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isAiResponding]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isAiResponding) return;
    sendMessage(inputValue.trim());
    setInputValue("");
  };

  const saveAsNote = async (id: string, text: string) => {
    const note = await addNote(chapter.id, { kind: "chat", body: text });
    if (note) setSaved((s) => ({ ...s, [id]: true }));
  };

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth">
        {isLoadingHistory ? (
          <ChatSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <p className="max-w-xs text-[13.5px] leading-relaxed text-muted-foreground">
              Ask anything about this source. Every answer is grounded in the text
              on the left, and you can keep any answer as a note.
            </p>
          </div>
        ) : (
          <div className="space-y-5 px-4 py-5">
            {messages.map((msg) =>
              msg.sender === "user" ? (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[88%] break-words rounded-2xl rounded-br-md bg-secondary px-3.5 py-2.5 text-[14px] leading-relaxed text-foreground">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="group/msg break-words">
                  <AnswerMarkdown>{msg.text}</AnswerMarkdown>
                  {!msg.error && (
                    <button
                      type="button"
                      onClick={() => saveAsNote(msg.id, msg.text)}
                      disabled={saved[msg.id]}
                      className={cn(
                        "mt-2 inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11.5px] transition-colors",
                        saved[msg.id]
                          ? "text-primary"
                          : "text-muted-foreground opacity-0 hover:bg-secondary hover:text-foreground group-hover/msg:opacity-100",
                      )}
                    >
                      {saved[msg.id] ? <Check size={13} /> : <Bookmark size={13} />}
                      {saved[msg.id] ? "Saved" : "Save as note"}
                    </button>
                  )}
                </div>
              ),
            )}
            {isAiResponding && (
              <div className="flex items-center gap-1.5 pt-1">
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="size-1.5 animate-bounce rounded-full bg-primary/60"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border bg-background/80 px-3 py-3 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about this source…"
            className="h-11 flex-grow rounded-xl bg-secondary/60 pr-11 text-[14px] transition-colors focus:bg-secondary"
            disabled={isAiResponding || isLoadingHistory}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-1.5 top-1/2 size-8 -translate-y-1/2 rounded-lg active-press"
            disabled={isAiResponding || !inputValue.trim()}
          >
            <Send size={16} />
          </Button>
        </form>
      </div>
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}
