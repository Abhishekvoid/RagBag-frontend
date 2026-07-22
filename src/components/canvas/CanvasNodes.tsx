"use client";

import { useRef } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { SubjectNodeData, ChapterNodeData } from "./canvasGraph";
import { useCardMotion } from "./useCardMotion";

// A single hidden handle per node; with connectionMode="loose" it serves as
// both endpoint for the floating edges (which compute their own geometry).
function HiddenHandle() {
  return (
    <Handle
      type="source"
      position={Position.Right}
      isConnectable={false}
      className="!h-0 !w-0 !min-w-0 !border-0 !bg-transparent !opacity-0"
    />
  );
}

export function SubjectNode({ data }: NodeProps) {
  const d = data as unknown as SubjectNodeData;
  const unassigned = d.variant === "unassigned";
  const ref = useRef<HTMLDivElement>(null);
  useCardMotion(ref);
  return (
    <div
      ref={ref}
      className={cn(
        "canvas-card relative w-[260px] rounded-2xl border px-5 py-4 shadow-[0_24px_60px_-34px_rgba(0,0,0,.55)] transition-colors",
        unassigned ? "border-dashed bg-card/50" : "bg-card",
        d.isDropTarget
          ? "border-primary ring-2 ring-primary/40"
          : "border-border",
      )}
    >
      <div
        className={cn(
          "font-mono text-[10.5px] uppercase tracking-[0.18em]",
          unassigned ? "text-muted-foreground" : "text-primary",
        )}
      >
        {unassigned
          ? "Unassigned"
          : `Subject · ${d.readyCount}/${d.chapterCount} ready`}
      </div>
      <h3 className="mt-1.5 font-display text-[22px] font-semibold leading-tight tracking-tight text-foreground">
        {d.name}
      </h3>
      <div className="mt-2 text-[12.5px] text-muted-foreground">
        {d.chapterCount} {d.chapterCount === 1 ? "chapter" : "chapters"} ·{" "}
        {d.sourceCount} {d.sourceCount === 1 ? "source" : "sources"}
      </div>
      {d.isDropTarget && (
        <div className="mt-2 font-mono text-[10.5px] text-primary">
          drop to move here
        </div>
      )}
      <HiddenHandle />
    </div>
  );
}

const STATUS_LABEL: Record<ChapterNodeData["status"], string> = {
  ready: "ready",
  processing: "processing",
  empty: "no sources",
};

export function ChapterNode({ data, selected }: NodeProps) {
  const d = data as unknown as ChapterNodeData;
  const ref = useRef<HTMLDivElement>(null);
  useCardMotion(ref);
  return (
    <div
      ref={ref}
      className={cn(
        "canvas-card group relative w-[220px] cursor-pointer rounded-xl border bg-card/90 px-4 py-3 shadow-[0_18px_44px_-32px_rgba(0,0,0,.5)] transition-colors",
        selected ? "border-primary" : "border-border hover:border-primary/50",
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            d.status === "ready" && "bg-primary",
            d.status === "processing" && "bg-primary/50 olive-pulse",
            d.status === "empty" && "bg-muted-foreground/40",
          )}
        />
        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-foreground">
          {d.name}
        </span>
      </div>
      <div className="mt-1.5 pl-4 text-[11.5px] text-muted-foreground">
        {d.sourceCount} {d.sourceCount === 1 ? "source" : "sources"} ·{" "}
        {STATUS_LABEL[d.status]}
      </div>
      <HiddenHandle />
    </div>
  );
}
