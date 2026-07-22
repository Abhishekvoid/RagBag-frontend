"use client";

import "@xyflow/react/dist/style.css";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "motion/react";
import { gsap } from "gsap";
import { ArrowLeft } from "lucide-react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ConnectionMode,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type ColorMode,
} from "@xyflow/react";
import type { Subject } from "@/lib/store/useNotebook";
import { useNotebookStore } from "@/lib/store/useNotebook";
import { SubjectNode, ChapterNode } from "./CanvasNodes";
import { FloatingEdge } from "./FloatingEdge";
import { bumpNode } from "./useCardMotion";
import {
  buildNotebookGraph,
  loadPositions,
  savePositions,
  type SubjectNodeData,
  type ChapterNodeData,
} from "./canvasGraph";

type CanvasNode = Node<SubjectNodeData | ChapterNodeData>;

const STORE_KEY = "notebook";
const nodeTypes = { subjectNode: SubjectNode, chapterNode: ChapterNode };
const edgeTypes = { floating: FloatingEdge };
const defaultEdgeOptions = {
  type: "floating",
  style: { stroke: "var(--border)", strokeWidth: 1.5 },
};

function Flow({ subjects }: { subjects: Subject[] }) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { getIntersectingNodes } = useReactFlow<CanvasNode>();
  const moveChapter = useNotebookStore((s) => s.moveChapter);

  const derived = useMemo(
    () => buildNotebookGraph(subjects, loadPositions(STORE_KEY)),
    [subjects],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>(
    derived.nodes,
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(derived.edges);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  // Zoom-expand transition when opening a chapter.
  const [opening, setOpening] = useState<{
    x: number;
    y: number;
    r: number;
    href: string;
  } | null>(null);

  // Re-sync when the notebook changes (e.g. a chapter was reassigned): rewire
  // edges to the new subject, add/remove nodes, but preserve on-screen positions
  // the user has dragged this session.
  useEffect(() => {
    setNodes((current) =>
      derived.nodes.map((n) => {
        const existing = current.find((c) => c.id === n.id);
        return existing ? { ...n, position: existing.position } : n;
      }),
    );
    setEdges(derived.edges);
  }, [derived, setNodes, setEdges]);

  // Reflect the current drop target as a highlight on the subject hubs.
  useEffect(() => {
    setNodes((current) =>
      current.map((n) =>
        n.type === "subjectNode"
          ? { ...n, data: { ...n.data, isDropTarget: n.id === dropTargetId } }
          : n,
      ),
    );
  }, [dropTargetId, setNodes]);

  const subjectHubUnder = useCallback(
    (node: CanvasNode): CanvasNode | undefined =>
      getIntersectingNodes(node).find((n) => n.type === "subjectNode"),
    [getIntersectingNodes],
  );

  const onNodeDrag = useCallback(
    (_: MouseEvent | TouchEvent, node: CanvasNode) => {
      if (node.type !== "chapterNode") return;
      const hub = subjectHubUnder(node);
      setDropTargetId((prev) => (prev === (hub?.id ?? null) ? prev : hub?.id ?? null));
    },
    [subjectHubUnder],
  );

  const persistPositions = useCallback((all: CanvasNode[]) => {
    const map: Record<string, { x: number; y: number }> = {};
    for (const n of all) map[n.id] = n.position;
    savePositions(STORE_KEY, map);
  }, []);

  const onNodeDragStop = useCallback(
    (_: MouseEvent | TouchEvent, node: CanvasNode, allNodes: CanvasNode[]) => {
      if (node.type === "chapterNode") {
        const hub = subjectHubUnder(node);
        if (hub) {
          moveChapter(node.id, hub.id); // store no-ops if unchanged
          // Hub reacts, chapter settles; the new edge draws itself in (CSS).
          bumpNode(node.id);
          bumpNode(hub.id, { ring: true });
        }
      }
      setDropTargetId(null);
      persistPositions(allNodes);
    },
    [subjectHubUnder, moveChapter, persistPositions],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: CanvasNode) => {
      if (node.type !== "chapterNode") return;
      const href = `/dashboard/chapter/${node.id}`;
      const card = document.querySelector<HTMLElement>(
        `.react-flow__node[data-id="${CSS.escape(node.id)}"] .canvas-card`,
      );
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (!card || prefersReduced) {
        router.push(href);
        return;
      }
      // Zoom into the card: it scales up while a ground-colored disc expands
      // from its centre, then we route into the workspace.
      const rect = card.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const r = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );
      gsap.to(card, {
        scale: 1.18,
        opacity: 0.85,
        duration: 0.42,
        ease: "power2.in",
      });
      setOpening({ x, y, r, href });
    },
    [router],
  );

  return (
    <>
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeDrag={onNodeDrag}
      onNodeDragStop={onNodeDragStop}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      connectionMode={ConnectionMode.Loose}
      nodesConnectable={false}
      colorMode={(resolvedTheme as ColorMode) ?? "light"}
      fitView
      fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
      minZoom={0.3}
      maxZoom={1.6}
      proOptions={{ hideAttribution: true }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={26}
        size={1.4}
        color="var(--canvas-dot)"
      />
      <MiniMap
        position="top-right"
        pannable
        zoomable
        nodeColor="var(--accent)"
        nodeStrokeColor="transparent"
        maskColor="color-mix(in srgb, var(--background) 55%, transparent)"
      />
      <Controls showInteractive={false} />
    </ReactFlow>

    <AnimatePresence>
      {opening && (
        <motion.div
          key="open"
          className="pointer-events-none fixed inset-0 z-[100] bg-background"
          initial={{ clipPath: `circle(0px at ${opening.x}px ${opening.y}px)` }}
          animate={{
            clipPath: `circle(${opening.r}px at ${opening.x}px ${opening.y}px)`,
          }}
          transition={{ duration: 0.44, ease: [0.16, 1, 0.3, 1] }}
          onAnimationComplete={() => router.push(opening.href)}
        />
      )}
    </AnimatePresence>
    </>
  );
}

export function KnowledgeCanvas({ subjects }: { subjects: Subject[] }) {
  const router = useRouter();
  const hasChapters = subjects.some((s) => (s.chapters?.length ?? 0) > 0);

  return (
    <div className="flex h-[100dvh] flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-3 md:px-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active-press"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[12px] tracking-wide text-muted-foreground">
          <span className="font-semibold text-foreground">Knowledge canvas</span>
        </div>
        <p className="ml-auto hidden font-mono text-[11px] tracking-wide text-muted-foreground/70 md:block">
          drag a chapter onto a subject to move it · click to open
        </p>
      </header>

      <div className="relative min-h-0 flex-1">
        {!hasChapters ? (
          <div className="flex h-full items-center justify-center px-8 text-center">
            <p className="max-w-[36ch] text-[13.5px] leading-relaxed text-muted-foreground">
              No chapters yet. Add chapters and subjects, then arrange them here
              and drag chapters between subjects.
            </p>
          </div>
        ) : (
          <ReactFlowProvider>
            <Flow subjects={subjects} />
          </ReactFlowProvider>
        )}
      </div>
    </div>
  );
}
