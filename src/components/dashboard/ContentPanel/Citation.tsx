"use client";

import { motion } from "motion/react";
import { FileText } from "lucide-react";
import type { Source } from "@/lib/citations";
import { cn } from "@/lib/utils";

interface CitationProps {
  source: Source;
  active?: boolean;
  onActivate?: (id: string) => void;
  onHover?: (id: string | null) => void;
}

export function Citation({ source, active, onActivate, onHover }: CitationProps) {
  const label =
    source.title.length > 24 ? source.title.slice(0, 23) + "…" : source.title;
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => onActivate?.(source.id)}
      onMouseEnter={() => onHover?.(source.id)}
      onMouseLeave={() => onHover?.(null)}
      title={source.title}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 mx-0.5 align-baseline",
        "font-mono text-meta leading-none transition-all duration-120",
        "border-primary/30 bg-primary/10 text-primary hover:-translate-y-px hover:bg-primary/15 hover:border-primary/50",
        active && "bg-primary/20 border-primary/60 -translate-y-px",
      )}
    >
      <FileText size={11} className="opacity-70" />
      {label}
      {source.page ? <span className="opacity-60">· p{source.page}</span> : null}
    </motion.button>
  );
}
