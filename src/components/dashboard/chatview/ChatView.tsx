"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import ReactMarkdown from "react-markdown";
import { useNotebookStore, Chapter, Message } from "@/lib/store/useNotebook";
import { UserIcon, AiIcon } from "./Icons";
import { cn } from "@/lib/utils";

const ChatMessage = ({ message }: { message: Message }) => {
  const isUser = message.sender === "user";

  // ADD THIS DEBUG LINE
  console.log(
    "Raw message text with line breaks:",
    JSON.stringify(message.text)
  );

  return (
    <div className={`flex items-start gap-4 ${isUser ? "justify-end" : ""}`}>
      <div
        className={`shrink-0 size-8 rounded-full flex items-center justify-center ${
          isUser ? "bg-primary/10 text-primary" : "bg-muted"
        }`}
      >
        {isUser ? (
          <UserIcon className="size-5" />
        ) : (
          <AiIcon className="size-5" />
        )}
      </div>
      <div
        className={`p-4 rounded-lg max-w-xl ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        <p className="font-bold text-sm mb-1">
          {isUser ? "You" : "StudyWise AI"}
        </p>

        {/* ADD THIS DEBUG SECTION TEMPORARILY */}
        <div className="mb-2 text-xs bg-red-100 p-1">
          <strong>Debug - Character count:</strong> {message.text.length}
          <br />
          <strong>Contains \\n\\n:</strong>{" "}
          {message.text.includes("\n\n") ? "YES" : "NO"}
          <br />
          <strong>First 100 chars:</strong>{" "}
          {JSON.stringify(message.text.substring(0, 100))}
        </div>

        <p className="leading-relaxed whitespace-pre-wrap">{message.text}</p>
      </div>
    </div>
  );
};

interface ChatViewProps {
  chapter: Chapter;
}

export function ChatView({ chapter }: ChatViewProps) {
  const [inputValue, setInputValue] = useState("");
  const isAiResponding = useNotebookStore((state) => state.isAiResponding);
  const sendMessage = useNotebookStore((state) => state.sendMessage);

  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = chapter.messages || [];

  // This effect automatically scrolls to the bottom when a new message is added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isAiResponding) return;

    sendMessage(inputValue);
    setInputValue("");
  };

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <h2 className="text-lg font-semibold text-foreground">
          {chapter.name}
        </h2>
        <p className="text-sm text-muted-foreground">
          {chapter.documents?.length || 0} source(s)
        </p>
      </div>

      {/* Chat History */}
      <div ref={scrollRef} className="flex-grow p-4 overflow-y-auto space-y-6">
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
                "p-full shrink-0",
                msg.sender === "user"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted"
              )}
            >
              {msg.sender === "user" ? <UserIcon /> : <AiIcon />}
            </div>
            <div
              className={cn(
                "p-3 rounded-lg max-w-[80%] prose dark:prose-invert",
                msg.sender === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
                msg.error && "bg-destructive text-destructive-foreground"
              )}
            >
              {/* Using the markdown renderer to display the AI's response */}
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          </div>
        ))}
        {isAiResponding && (
          <div className="flex items-start gap-4">
            <div className="shrink-0 p-full bg-muted">
              <AiIcon />
            </div>
            <div className="p-3 rounded-lg bg-muted max-w-[80%]">
              <p className="font-bold text-sm mb-1 text-primary">
                StudyWise AI
              </p>
              <p className="leading-relaxed animate-pulse">Thinking...</p>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-border flex-shrink-0 bg-background">
        <form
          className="relative flex gap-2 items-center"
          onSubmit={handleSubmit}
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Ask about "${chapter.name}"...`}
            className="flex-grow pr-12 h-12"
            disabled={isAiResponding}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            disabled={isAiResponding}
          >
            {/* Send Icon SVG */}
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
          </Button>
        </form>
        <p className="text-xs text-center text-muted-foreground mt-2">
          StudyWise can be inaccurate. Please double-check its responses.
        </p>
      </div>
    </>
  );
}
