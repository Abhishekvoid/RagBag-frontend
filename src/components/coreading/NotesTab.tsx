"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Highlighter,
  PenLine,
  Sparkles,
  MessageSquareText,
  Trash2,
  Layers,
  X,
} from "lucide-react";
import { useCoReadingStore } from "@/lib/store/useCoReading";
import { AnswerMarkdown } from "@/components/dashboard/ContentPanel/AnswerMarkdown";
import type { NoteDTO, NoteKind } from "@/features/notebook/notebook.schema";
import {
  HIGHLIGHT_COLORS,
  COLOR_LABEL,
  colorVar,
  asHighlightColor,
} from "@/lib/highlightColors";
import { cn } from "@/lib/utils";

interface NotesTabProps {
  chapterId: string;
  docTitles: Record<string, string>;
}

const KIND_ICON: Record<NoteKind, typeof Highlighter> = {
  highlight: Highlighter,
  note: PenLine,
  ai: Sparkles,
  chat: MessageSquareText,
  scratch: PenLine,
};

export function NotesTab({ chapterId, docTitles }: NotesTabProps) {
  const notesRaw = useCoReadingStore((s) => s.notesByChapter[chapterId]);
  const notes = useMemo(() => notesRaw ?? [], [notesRaw]);
  const synthesize = useCoReadingStore((s) => s.synthesize);
  const synthesizing = useCoReadingStore((s) => s.synthesizing);
  const synthResult = useCoReadingStore((s) => s.synthResult);
  const clearSynth = useCoReadingStore((s) => s.clearSynth);
  const convertToFlashcards = useCoReadingStore((s) => s.convertToFlashcards);
  const converting = useCoReadingStore((s) => s.converting);
  const actionError = useCoReadingStore((s) => s.actionError);

  const [madeCount, setMadeCount] = useState<number | null>(null);

  const groups = useMemo(() => groupByDoc(notes), [notes]);

  const makeFlashcards = async () => {
    setMadeCount(null);
    const n = await convertToFlashcards(chapterId, notes.map((x) => x.id));
    if (n > 0) setMadeCount(n);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
        <button
          type="button"
          onClick={() => synthesize(chapterId)}
          disabled={synthesizing || notes.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
        >
          <Sparkles size={14} className={cn(synthesizing && "animate-pulse text-primary")} />
          {synthesizing ? "Synthesizing…" : "Synthesize"}
        </button>
        <button
          type="button"
          onClick={makeFlashcards}
          disabled={converting || notes.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
        >
          <Layers size={14} className={cn(converting && "animate-pulse text-primary")} />
          {converting ? "Making…" : "Make flashcards"}
        </button>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">
          {notes.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto scroll-smooth px-3 py-3">
        {madeCount != null && (
          <Banner onDismiss={() => setMadeCount(null)}>
            Created {madeCount} flashcard{madeCount === 1 ? "" : "s"}. Find them in Study.
          </Banner>
        )}
        {actionError && <Banner tone="error">{actionError}</Banner>}

        {synthResult && (
          <div className="mb-4 rounded-xl border border-primary/25 bg-primary/[0.06] p-3.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-primary">
                <Sparkles size={12} /> Study sheet
              </span>
              <button
                type="button"
                onClick={clearSynth}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>
            <AnswerMarkdown>{synthResult}</AnswerMarkdown>
          </div>
        )}

        {notes.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <PenLine size={22} className="mb-3 text-muted-foreground/60" />
            <p className="max-w-[24ch] text-[13px] leading-relaxed text-muted-foreground">
              Select any passage on the left to highlight it, write a note, or let
              the AI explain it.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map(([docId, items]) => (
              <div key={docId}>
                {Object.keys(docTitles).length > 1 && (
                  <p className="mb-2 truncate font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                    {docTitles[docId] ?? "Notes"}
                  </p>
                )}
                <div className="space-y-2.5">
                  {items.map((note) => (
                    <NoteCard key={note.id} chapterId={chapterId} note={note} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ScratchPad chapterId={chapterId} />
    </div>
  );
}

function NoteCard({ chapterId, note }: { chapterId: string; note: NoteDTO }) {
  const editNote = useCoReadingStore((s) => s.editNote);
  const removeNote = useCoReadingStore((s) => s.removeNote);
  const recolorNote = useCoReadingStore((s) => s.recolorNote);
  const Icon = KIND_ICON[note.kind];

  const [draft, setDraft] = useState(note.body);
  const [picking, setPicking] = useState(false);
  const editable = note.kind === "note";
  const color = asHighlightColor(note.color);
  const anchored = note.anchor_start != null;

  useEffect(() => setDraft(note.body), [note.body]);

  return (
    <div
      data-note-anchor={note.id}
      className="group/note rounded-xl border border-border bg-card/60 p-3 transition-colors hover:border-border/80"
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon size={13} style={{ color: colorVar(color) }} />
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {label(note.kind)}
        </span>

        {anchored && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setPicking((p) => !p)}
              className="flex size-4 items-center justify-center"
              aria-label="Change highlight color"
            >
              <span
                className="size-2.5 rounded-full ring-1 ring-black/15 dark:ring-white/20"
                style={{ backgroundColor: colorVar(color) }}
              />
            </button>
            {picking && (
              <div
                className="absolute left-0 top-5 z-20 flex gap-1 rounded-lg border border-border bg-popover p-1 shadow-lg"
                onMouseLeave={() => setPicking(false)}
              >
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={COLOR_LABEL[c]}
                    onClick={() => {
                      recolorNote(chapterId, note.id, c);
                      setPicking(false);
                    }}
                    className="flex size-5 items-center justify-center rounded-md hover:bg-secondary"
                  >
                    <span
                      className={cn(
                        "size-3 rounded-full ring-1 ring-black/15 dark:ring-white/20",
                        c === color && "ring-2 ring-foreground/50",
                      )}
                      style={{ backgroundColor: colorVar(c) }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => removeNote(chapterId, note.id)}
          className="ml-auto text-muted-foreground opacity-0 transition-all hover:text-primary group-hover/note:opacity-100"
          aria-label="Delete note"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {note.quoted_text && (
        <blockquote
          className="mb-2 border-l-2 pl-2.5 text-[12.5px] italic leading-relaxed text-muted-foreground"
          style={{ borderColor: `color-mix(in srgb, ${colorVar(color)} 55%, transparent)` }}
        >
          {truncate(note.quoted_text, 220)}
        </blockquote>
      )}

      {note.kind === "ai" || note.kind === "chat" ? (
        <div className="text-[13.5px] leading-relaxed">
          <AnswerMarkdown>{note.body}</AnswerMarkdown>
        </div>
      ) : editable ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => draft !== note.body && editNote(chapterId, note.id, draft)}
          placeholder="Write your note…"
          rows={2}
          className="w-full resize-none rounded-md bg-transparent text-[13.5px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />
      ) : null}
    </div>
  );
}

function ScratchPad({ chapterId }: { chapterId: string }) {
  const scratch = useCoReadingStore((s) => s.scratchByChapter[chapterId]);
  const loadScratch = useCoReadingStore((s) => s.loadScratch);
  const saveScratch = useCoReadingStore((s) => s.saveScratch);

  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (open && !loadedRef.current) {
      loadedRef.current = true;
      loadScratch(chapterId);
    }
  }, [open, chapterId, loadScratch]);

  useEffect(() => {
    if (scratch) setValue(scratch.body);
  }, [scratch]);

  // Debounced autosave.
  useEffect(() => {
    if (!open || !loadedRef.current) return;
    if (scratch && value === scratch.body) return;
    const t = setTimeout(() => saveScratch(chapterId, value), 900);
    return () => clearTimeout(t);
  }, [value, open, scratch, chapterId, saveScratch]);

  return (
    <div className="shrink-0 border-t border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Scratch pad
        <span className="font-mono text-[10px]">{open ? "hide" : "show"}</span>
      </button>
      {open && (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="A freeform space for this chapter. Saved automatically."
          rows={4}
          className="w-full resize-none border-t border-border bg-background px-3 py-2.5 text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />
      )}
    </div>
  );
}

function Banner({
  children,
  tone = "info",
  onDismiss,
}: {
  children: React.ReactNode;
  tone?: "info" | "error";
  onDismiss?: () => void;
}) {
  return (
    <div
      className={cn(
        "mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-[12.5px]",
        tone === "error"
          ? "border-primary/40 bg-primary/[0.08] text-foreground"
          : "border-border bg-secondary/50 text-muted-foreground",
      )}
    >
      <span className="flex-1">{children}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="hover:text-foreground">
          <X size={13} />
        </button>
      )}
    </div>
  );
}

function groupByDoc(notes: NoteDTO[]): [string, NoteDTO[]][] {
  const map = new Map<string, NoteDTO[]>();
  for (const n of notes) {
    const key = n.document ?? "_chapter";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(n);
  }
  return [...map.entries()];
}

function label(kind: NoteKind) {
  return kind === "ai" ? "AI" : kind;
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}
