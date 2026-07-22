"use client";

// Floating edge: connects the border of the source node to the border of the
// target node (rather than fixed handles), so links look right when chapters
// are arranged radially around the subject. Adapted from React Flow's official
// floating-edges example for v12 (uses node.internals + measured size).

import {
  getBezierPath,
  useInternalNode,
  Position,
  type EdgeProps,
  type InternalNode,
  type Node,
} from "@xyflow/react";

function intersection(node: InternalNode<Node>, other: InternalNode<Node>) {
  const w = (node.measured.width ?? 0) / 2;
  const h = (node.measured.height ?? 0) / 2;
  const np = node.internals.positionAbsolute;
  const op = other.internals.positionAbsolute;
  const ow = (other.measured.width ?? 0) / 2;
  const oh = (other.measured.height ?? 0) / 2;

  const x2 = np.x + w;
  const y2 = np.y + h;
  const x1 = op.x + ow;
  const y1 = op.y + oh;

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1) || 1);
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  return { x: w * (xx3 + yy3) + x2, y: h * (-xx3 + yy3) + y2 };
}

function edgePosition(node: InternalNode<Node>, point: { x: number; y: number }) {
  const nx = Math.round(node.internals.positionAbsolute.x);
  const ny = Math.round(node.internals.positionAbsolute.y);
  const px = Math.round(point.x);
  const py = Math.round(point.y);
  if (px <= nx + 1) return Position.Left;
  if (px >= nx + (node.measured.width ?? 0) - 1) return Position.Right;
  if (py <= ny + 1) return Position.Top;
  return Position.Bottom;
}

export function FloatingEdge({ id, source, target, markerEnd, style }: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  // Guard until both nodes are measured (first paint has no size yet).
  if (
    !sourceNode?.measured?.width ||
    !targetNode?.measured?.width
  ) {
    return null;
  }

  const sp = intersection(sourceNode, targetNode);
  const tp = intersection(targetNode, sourceNode);

  const [path] = getBezierPath({
    sourceX: sp.x,
    sourceY: sp.y,
    sourcePosition: edgePosition(sourceNode, sp),
    targetPosition: edgePosition(targetNode, tp),
    targetX: tp.x,
    targetY: tp.y,
  });

  return (
    <path
      id={id}
      className="react-flow__edge-path rf-edge-draw"
      d={path}
      pathLength={1}
      markerEnd={markerEnd}
      style={style}
    />
  );
}
