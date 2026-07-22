// Graph model + layout + persistence for the spatial knowledge canvas (v1).
//
// v1 nodes: one Subject node + its Chapter nodes, laid out radially. The user
// can drag nodes; positions persist per subject in localStorage. Edges are the
// (non-interactive) subject -> chapter links.

import type { Subject } from "@/lib/store/useNotebook";
import type { Node, Edge } from "@xyflow/react";

export type ChapterStatus = "ready" | "processing" | "empty";

export const LOOSE_SUBJECT_ID = "uncategorized-chapters";

export type SubjectNodeData = {
  name: string;
  chapterCount: number;
  sourceCount: number;
  readyCount: number;
  variant: "subject" | "unassigned";
  isDropTarget: boolean;
};

export type ChapterNodeData = {
  name: string;
  sourceCount: number;
  status: ChapterStatus;
};

export type XY = { x: number; y: number };
type PosMap = Record<string, XY>;

const storageKey = (subjectId: string) => `sw:canvas:${subjectId}`;

export function loadPositions(subjectId: string): PosMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(storageKey(subjectId)) || "{}");
  } catch {
    return {};
  }
}

export function savePositions(subjectId: string, positions: PosMap) {
  try {
    localStorage.setItem(storageKey(subjectId), JSON.stringify(positions));
  } catch {
    /* quota / private mode — layout just won't persist */
  }
}

export function chapterStatus(documents?: { status: string }[]): ChapterStatus {
  const docs = documents ?? [];
  if (docs.length === 0) return "empty";
  if (docs.some((d) => d.status === "PENDING" || d.status === "PROCESSING"))
    return "processing";
  return "ready";
}

// Layout constants: subjects sit in columns; each subject's chapters stack
// below its hub. Drag rearranges freely afterwards (positions persist).
const COL_W = 380;
const HUB_TO_CHAPTERS = 150;
const CHAPTER_GAP = 92;

/**
 * Build the whole-notebook graph: every subject as a hub with its chapters
 * stacked below, plus an "Unassigned" hub for loose chapters. Saved positions
 * (from a prior drag) always win over the computed defaults.
 */
export function buildNotebookGraph(subjects: Subject[], saved: PosMap) {
  // Real subjects first, the loose/unassigned pseudo-subject last.
  const ordered = [...subjects].sort((a, b) => {
    if (a.id === LOOSE_SUBJECT_ID) return 1;
    if (b.id === LOOSE_SUBJECT_ID) return -1;
    return 0;
  });

  const nodes: Node<SubjectNodeData | ChapterNodeData>[] = [];
  const edges: Edge[] = [];

  ordered.forEach((subject, col) => {
    const chapters = subject.chapters ?? [];
    const isLoose = subject.id === LOOSE_SUBJECT_ID;
    const hubX = col * COL_W;

    nodes.push({
      id: subject.id,
      type: "subjectNode",
      position: saved[subject.id] ?? { x: hubX, y: 0 },
      data: {
        name: isLoose ? "Unassigned" : subject.name,
        chapterCount: chapters.length,
        sourceCount: chapters.reduce(
          (sum, c) => sum + (c.documents?.length ?? 0),
          0,
        ),
        readyCount: chapters.filter(
          (c) => chapterStatus(c.documents) === "ready",
        ).length,
        variant: isLoose ? "unassigned" : "subject",
        isDropTarget: false,
      },
      draggable: true,
    });

    chapters.forEach((c, i) => {
      const fallback: XY = {
        x: hubX + 20,
        y: HUB_TO_CHAPTERS + i * CHAPTER_GAP,
      };
      nodes.push({
        id: c.id,
        type: "chapterNode",
        position: saved[c.id] ?? fallback,
        data: {
          name: c.name,
          sourceCount: c.documents?.length ?? 0,
          status: chapterStatus(c.documents),
        },
        draggable: true,
      });
      edges.push({
        id: `e-${subject.id}-${c.id}`,
        source: subject.id,
        target: c.id,
        type: "floating",
      });
    });
  });

  return { nodes, edges };
}
