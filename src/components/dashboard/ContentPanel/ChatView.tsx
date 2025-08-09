"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Source } from "./ContentPanel";

// ✅ Defines the component's props
interface ChatViewProps {
  sources: Source[];
}

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
);

// ✅ Exports the component and uses the props definition
export function ChatView({ sources }: ChatViewProps) {
  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <h2 className="text-lg font-semibold text-foreground">Chat</h2>
        <p className="text-sm text-muted-foreground">
          {sources.length} source(s) available
        </p>
      </div>

      {/* Chat History */}
      <div className="flex-grow p-4 overflow-y-auto space-y-6">
        {/* Your chat messages will be rendered here */}
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-border flex-shrink-0 bg-background">
        <form className="relative flex gap-2 items-center">
          <Input
            placeholder="Ask about your sources..."
            className="flex-grow pr-12"
          />
          <Button type="submit" size="icon" className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7">
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