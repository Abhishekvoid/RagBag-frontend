"use client";

import { useState, useRef, useEffect } from "react";
import { useNotebookStore } from "@/lib/store/useNotebook";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DocumentDTO } from "@/features/notebook/notebook.api";
import { cn } from "@/lib/utils";

// --- Icons ---
const SendIcon = () => (
    <svg xmlns="http://www.w.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
);
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const BotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
);


interface ChatViewProps {
  // Use the correct DTO type for the sources
  sources: DocumentDTO[];
}

export function ChatView({ sources }: ChatViewProps) {
  // --- STATE & STORE HOOKS ---
  const [inputValue, setInputValue] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Use atomic selectors for performance
  const getActiveChapter = useNotebookStore((state) => state.getActiveChapter);
  const sendMessage = useNotebookStore((state) => state.sendMessage);
  const isAiResponding = useNotebookStore((state) => state.isAiResponding);
  
  const activeChapter = getActiveChapter();
  const messages = activeChapter?.messages || [];

  // --- EFFECTS ---
  // This effect handles auto-scrolling to the latest message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages.length]);

  // --- HANDLERS ---
  const handleSubmit = (e: React.FormEvent) => {
    // This is the crucial line that prevents the page from reloading on submit
    e.preventDefault();

    // Guard clause to prevent empty or duplicate messages
    if (!inputValue.trim() || isAiResponding) return;

    sendMessage(inputValue.trim());
    setInputValue(""); // Clear the input immediately after sending
  };
  
  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <h2 className="text-lg font-semibold text-foreground">Chat with: {activeChapter?.name || '...'}</h2>
        <p className="text-sm text-muted-foreground">
          {sources.length} source(s) available
        </p>
      </div>

      {/* Chat History */}
      <div ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex items-start gap-4", msg.sender === "user" && "flex-row-reverse")}>
            <div className={cn("p-2 rounded-full", msg.sender === 'user' ? 'bg-primary/10 text-primary' : 'bg-muted')}>
              {msg.sender === "user" ? <UserIcon /> : <BotIcon />}
            </div>
            <div className={cn("p-3 rounded-lg max-w-[80%]", msg.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground", msg.error && "bg-destructive text-destructive-foreground")}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {/* Loading indicator for when the AI is responding */}
        {isAiResponding && (
            <div className="flex items-start gap-4">
                <div className="p-2 rounded-full bg-muted"><BotIcon/></div>
                <div className="p-3 rounded-lg bg-muted text-muted-foreground">
                    <span className="animate-pulse">Thinking...</span>
                </div>
            </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-border flex-shrink-0 bg-background">
        <form onSubmit={handleSubmit} className="relative flex gap-2 items-center">
          <Input 
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)} 
            placeholder="Ask about your sources..." 
            className="flex-grow pr-12" 
            disabled={isAiResponding} // Disable input while AI is working
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7" 
            disabled={isAiResponding || !inputValue.trim()} // Disable button while AI is working or if input is empty
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