"use client";

import Link from "next/link";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  Panel,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import type { EventTreeNode } from "./event-tree-client";

const MAX_TREE_DEPTH = 8;
const MAX_CHOICES_PER_NODE = 6;
const HORIZONTAL_GAP = 460;
const VERTICAL_GAP = 280;

type EventCardData = {
  kind: "event";
  eventId: number;
  title: string;
  eventType: string;
  isActive: boolean;
  choiceCount: number;
  incomingCount: number;
};

type NoteCardData = {
  kind: "note";
  title: string;
  subtitle: string;
  tone: "neutral" | "warn";
};

type FlowData = EventCardData | NoteCardData;
type FlowNode = Node<FlowData>;
type FlowEdge = Edge;

const nodeTypes = {
  event: EventCardNode,
  note: NoteCardNode,
};

export function EventTreeFlow({
  events,
  rootIds,
}: {
  events: EventTreeNode[];
  rootIds: number[];
}) {
  const { nodes: initialNodes, edges: initialEdges, stats } = useMemo(
    () => buildEventFlow(events, rootIds),
    [events, rootIds],
  );
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <span>{stats.eventNodes} event nodes</span>
        <span>{edges.length} edges</span>
        <span>{stats.noteNodes} terminal/missing nodes</span>
        {stats.hiddenChoices > 0 ? <span>{stats.hiddenChoices} choices bị ẩn để sơ đồ nhẹ hơn</span> : null}
        {stats.skippedBackLinks > 0 ? <span>{stats.skippedBackLinks} liên kết ngược/cycle không vẽ</span> : null}
      </div>

      <div className="h-[72vh] min-h-[640px] overflow-hidden rounded-2xl border border-zinc-200 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.08),_transparent_40%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(244,244,245,0.95))] shadow-inner dark:border-zinc-700 dark:bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.12),_transparent_35%),linear-gradient(180deg,_rgba(10,10,10,0.96),_rgba(24,24,27,0.98))]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.16 }}
          minZoom={0.2}
          maxZoom={1.3}
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable
          selectNodesOnDrag={false}
          selectionOnDrag={false}
          panActivationKeyCode="Control"
          panOnDrag={[0]}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{
            type: "smoothstep",
            animated: false,
            markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
            style: { strokeWidth: 1.5, stroke: "#78716c" },
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.2}
            color="rgba(113, 113, 122, 0.25)"
          />
          <Controls showInteractive={false} />
          <Panel
            position="top-left"
            className="max-w-sm rounded-xl border border-zinc-200/80 bg-white/92 px-3 py-2 text-xs leading-5 text-zinc-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-950/88 dark:text-zinc-300"
          >
            Kéo node để sắp xếp lại. Giữ Ctrl rồi kéo nền để pan, cuộn để zoom. Root nodes nằm trên cùng; các nhánh cụt hoặc đích thiếu được hiển thị bằng node phụ.
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

function buildEventFlow(events: EventTreeNode[], rootIds: number[]) {
  const byId = new Map(events.map((event) => [event.id, event]));
  const incomingCount = new Map(events.map((event) => [event.id, 0]));

  for (const event of events) {
    for (const choice of event.choicesFromHere) {
      if (choice.nextEventId != null && incomingCount.has(choice.nextEventId)) {
        incomingCount.set(choice.nextEventId, (incomingCount.get(choice.nextEventId) ?? 0) + 1);
      }
    }
  }

  const levelById = new Map<number, number>();
  const rootSeeds = rootIds.length > 0 ? rootIds : events.slice(0, 1).map((event) => event.id);
  fillLevels({
    seeds: rootSeeds,
    startDepth: 0,
    byId,
    levelById,
  });

  let detachedStartDepth =
    levelById.size === 0 ? 0 : Math.max(...levelById.values()) + 2;

  for (const event of events) {
    if (levelById.has(event.id)) continue;
    fillLevels({
      seeds: [event.id],
      startDepth: detachedStartDepth,
      byId,
      levelById,
    });
    detachedStartDepth = Math.max(...levelById.values()) + 2;
  }

  const buckets = new Map<number, FlowNode[]>();
  const edges: FlowEdge[] = [];
  let hiddenChoices = 0;
  let skippedBackLinks = 0;
  let noteNodes = 0;

  for (const event of events) {
    const level = levelById.get(event.id);
    if (level == null) continue;

    pushBucketNode(buckets, level, {
      id: `event-${event.id}`,
      type: "event",
      data: {
        kind: "event",
        eventId: event.id,
        title: event.title,
        eventType: event.type,
        isActive: event.isActive,
        choiceCount: event.choicesFromHere.length,
        incomingCount: incomingCount.get(event.id) ?? 0,
      },
      position: { x: 0, y: 0 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    });

    const visibleChoices = event.choicesFromHere.slice(0, MAX_CHOICES_PER_NODE);
    hiddenChoices += Math.max(0, event.choicesFromHere.length - visibleChoices.length);

    for (const choice of visibleChoices) {
      const edgeLabel = truncateLabel(choice.content);

      if (choice.nextEventId == null) {
        noteNodes += 1;
        pushBucketNode(buckets, level + 1, {
          id: `end-${choice.id}`,
          type: "note",
          data: {
            kind: "note",
            title: "Kết thúc nhánh",
            subtitle: edgeLabel,
            tone: "neutral",
          },
          position: { x: 0, y: 0 },
          targetPosition: Position.Top,
        });

        edges.push({
          id: `edge-${choice.id}`,
          source: `event-${event.id}`,
          target: `end-${choice.id}`,
          label: edgeLabel,
          labelShowBg: true,
          labelBgPadding: [6, 3],
          labelBgBorderRadius: 999,
          style: { stroke: "#94a3b8", strokeDasharray: "5 4" },
        });
        continue;
      }

      const nextLevel = levelById.get(choice.nextEventId);
      if (nextLevel == null || !byId.has(choice.nextEventId)) {
        noteNodes += 1;
        pushBucketNode(buckets, level + 1, {
          id: `missing-${choice.id}`,
          type: "note",
          data: {
            kind: "note",
            title: `Thiếu event #${choice.nextEventId}`,
            subtitle: edgeLabel,
            tone: "warn",
          },
          position: { x: 0, y: 0 },
          targetPosition: Position.Top,
        });

        edges.push({
          id: `edge-${choice.id}`,
          source: `event-${event.id}`,
          target: `missing-${choice.id}`,
          label: edgeLabel,
          labelShowBg: true,
          labelBgPadding: [6, 3],
          labelBgBorderRadius: 999,
          style: { stroke: "#fb7185", strokeDasharray: "5 4" },
        });
        continue;
      }

      if (nextLevel <= level) {
        skippedBackLinks += 1;
        continue;
      }

      edges.push({
        id: `edge-${choice.id}`,
        source: `event-${event.id}`,
        target: `event-${choice.nextEventId}`,
        label: edgeLabel,
        labelShowBg: true,
        labelBgPadding: [6, 3],
        labelBgBorderRadius: 999,
        labelStyle: {
          fontSize: 11,
          fill: "#44403c",
        },
      });
    }
  }

  const nodes = layoutBuckets(buckets);

  return {
    nodes,
    edges,
    stats: {
      eventNodes: events.length,
      noteNodes,
      hiddenChoices,
      skippedBackLinks,
    },
  };
}

function fillLevels({
  seeds,
  startDepth,
  byId,
  levelById,
}: {
  seeds: number[];
  startDepth: number;
  byId: Map<number, EventTreeNode>;
  levelById: Map<number, number>;
}) {
  const queue = seeds.map((id) => ({ id, depth: startDepth }));

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    const existingDepth = levelById.get(current.id);
    if (existingDepth != null && existingDepth <= current.depth) continue;

    levelById.set(current.id, current.depth);

    if (current.depth - startDepth >= MAX_TREE_DEPTH) continue;

    const event = byId.get(current.id);
    if (!event) continue;

    for (const choice of event.choicesFromHere.slice(0, MAX_CHOICES_PER_NODE)) {
      if (choice.nextEventId != null && byId.has(choice.nextEventId)) {
        queue.push({ id: choice.nextEventId, depth: current.depth + 1 });
      }
    }
  }
}

function pushBucketNode(
  buckets: Map<number, FlowNode[]>,
  level: number,
  node: FlowNode,
) {
  const nodes = buckets.get(level) ?? [];
  nodes.push(node);
  buckets.set(level, nodes);
}

function layoutBuckets(buckets: Map<number, FlowNode[]>) {
  const levels = [...buckets.keys()].sort((a, b) => a - b);
  const laidOutNodes: FlowNode[] = [];

  for (const level of levels) {
    const nodes = buckets.get(level) ?? [];
    const startX = -((nodes.length - 1) * HORIZONTAL_GAP) / 2;
    const levelOffset = level % 2 === 0 ? 0 : HORIZONTAL_GAP / 5;

    nodes.forEach((node, index) => {
      laidOutNodes.push({
        ...node,
        position: {
          x: startX + index * HORIZONTAL_GAP + levelOffset,
          y: level * VERTICAL_GAP,
        },
      });
    });
  }

  return laidOutNodes;
}

function truncateLabel(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length <= 42) return normalized || "(choice trống)";
  return `${normalized.slice(0, 39)}...`;
}

function EventCardNode({ data }: NodeProps<Node<EventCardData, "event">>) {
  return (
    <div className="w-[280px] rounded-2xl border border-zinc-200 bg-white/96 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.08)] dark:border-zinc-700 dark:bg-zinc-950/92">
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-amber-500 !bg-white dark:!bg-zinc-950" />
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-zinc-100 px-2 py-1 font-mono text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
            #{data.eventId}
          </span>
          <span className="rounded-full border border-zinc-300 px-2 py-1 text-zinc-600 dark:border-zinc-600 dark:text-zinc-300">
            {data.eventType}
          </span>
          <span
            className={`rounded-full px-2 py-1 ${
              data.isActive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {data.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{data.title}</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {data.choiceCount} choices · {data.incomingCount} incoming
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/game-admin/events/${data.eventId}`}
            className="nodrag nopan text-sm text-amber-900 underline-offset-2 hover:underline dark:text-amber-200"
          >
            Mở chi tiết
          </Link>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2 !border-amber-500 !bg-white dark:!bg-zinc-950" />
    </div>
  );
}

function NoteCardNode({ data }: NodeProps<Node<NoteCardData, "note">>) {
  const toneClass =
    data.tone === "warn"
      ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200"
      : "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200";

  return (
    <div className={`w-[220px] rounded-xl border px-3 py-3 text-xs shadow-sm ${toneClass}`}>
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-2 !border-slate-400 !bg-white dark:!bg-zinc-950" />
      <p className="font-semibold">{data.title}</p>
      <p className="mt-1 line-clamp-2 opacity-80">{data.subtitle}</p>
    </div>
  );
}
