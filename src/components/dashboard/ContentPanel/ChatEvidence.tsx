"use client";

import Link from "next/link";
import { useNotebookStore, type Message } from "@/lib/store/useNotebook";

/** Shared by dashboard chat and the reading workspace. */
export function ChatEvidence({ message, chapterId, retryQuestion }: {
  message: Message;
  chapterId: string;
  retryQuestion?: string;
}) {
  const sendMessage = useNotebookStore((s) => s.sendMessage);
  const busy = useNotebookStore((s) => s.isAiResponding);

  return (
    <>
      {!!message.sources?.length && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Answer sources">
          {message.sources.map((source, index) => {
            const params = new URLSearchParams({ document: source.document_id });
            const exactPage = source.page_number != null && source.version != null;
            if (exactPage) {
              params.set("page", String(source.page_number));
              params.set("version", String(source.version));
            }
            return (
              <Link
                key={`${source.document_id}-${source.page_number}-${index}`}
                href={`/dashboard/chapter/${encodeURIComponent(source.chapter_id ?? chapterId)}?${params}`}
                title={source.snippet}
                className="max-w-full break-words rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary"
              >
                {source.title}{exactPage ? ` · Page ${source.page_number}` : " · Document"}
                {source.is_fallback_scope && " · Other notes"}
              </Link>
            );
          })}
        </div>
      )}
      {message.is_unanswered && !message.error && retryQuestion && (
        <button
          type="button"
          disabled={busy}
          onClick={() => sendMessage(retryQuestion, true)}
          className="mt-3 rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
        >
          Search my other notes
        </button>
      )}
    </>
  );
}
