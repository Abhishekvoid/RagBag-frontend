"use client";

import type { Source } from "@/lib/citations";
import { cn } from "@/lib/utils";

interface SourcesRailProps {
  sources: Source[];
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
}

export function SourcesRail({ sources, hoveredId, onHover }: SourcesRailProps) {
  if (sources.length === 0) return null;
  return (
    <div className="mt-4 pt-3 border-t border-border/60">
      <p className="font-mono text-micro text-muted-foreground mb-2">
        {"// "}{sources.length} source{sources.length === 1 ? "" : "s"}
      </p>
      <div className="flex flex-col gap-1.5">
        {sources.map((s) => (
          <div
            key={s.id}
            onMouseEnter={() => onHover?.(s.id)}
            onMouseLeave={() => onHover?.(null)}
            className={cn(
              "rounded-md border border-border/60 bg-card px-3 py-2 transition-colors duration-120",
              hoveredId === s.id && "border-primary/50 bg-primary/5",
            )}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm text-foreground truncate">{s.title}</span>
              {s.page ? (
                <span className="font-mono text-micro text-muted-foreground shrink-0">
                  p{s.page}
                </span>
              ) : null}
            </div>
            {s.snippet ? (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {s.snippet}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
