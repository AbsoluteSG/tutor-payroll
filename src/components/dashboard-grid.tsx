"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Item = { id: string; node: ReactNode };

/** Keep saved ids that still exist, then append any new widgets at the end. */
function reconcile(saved: string[], ids: string[]): string[] {
  const kept = saved.filter((id) => ids.includes(id));
  const added = ids.filter((id) => !kept.includes(id));
  return [...kept, ...added];
}

function SortableWidget({
  id,
  editMode,
  isFirst,
  isLast,
  onMove,
  children,
}: {
  id: string;
  editMode: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMove: (id: string, dir: -1 | 1) => void;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
    // Let the browser scroll/tap normally until a drag actually begins; dnd-kit
    // manages the gesture via the sensor's delay/tolerance.
    touchAction: "manipulation",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative", editMode && "cursor-grab", isDragging && "opacity-80 cursor-grabbing")}
      // The whole card is the drag surface (hold to lift into a drag).
      {...attributes}
      {...listeners}
    >
      {editMode && (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1">
          {/* Reliable click/keyboard reorder alongside dragging. Stop the pointer
              from starting a drag when the buttons are used. */}
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Move up"
            disabled={isFirst}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onMove(id, -1)}
          >
            <ChevronUp />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Move down"
            disabled={isLast}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onMove(id, 1)}
          >
            <ChevronDown />
          </Button>
          <span className="pointer-events-none pl-0.5 text-muted-foreground">
            <GripVertical className="size-5" />
          </span>
        </div>
      )}
      {/* Inner wrapper carries the jiggle so it never fights dnd-kit's transform,
          and swallows clicks on inner links/buttons while rearranging. */}
      <div className={cn(editMode && !isDragging && "animate-jiggle", editMode && "pointer-events-none")}>
        {children}
      </div>
    </div>
  );
}

export function DashboardGrid({ items, storageKey }: { items: Item[]; storageKey: string }) {
  const ids = items.map((i) => i.id);
  const [order, setOrder] = useState<string[]>(ids);
  const [editMode, setEditMode] = useState(false);
  // dnd-kit generates non-deterministic aria ids that don't match between
  // server and client, so keep it out of SSR: render a plain grid until mounted.
  const [mounted, setMounted] = useState(false);

  // Not in edit mode: press-and-hold 3s to lift a card straight into a drag
  // (iPhone-style). Once in edit mode: drags start immediately on a small move.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: editMode ? { distance: 6 } : { delay: 3000, tolerance: 8 },
    }),
  );

  // Load the saved order once on mount. Reading localStorage during render
  // would cause a hydration mismatch (the server has no localStorage), so this
  // deliberate one-time client-only sync belongs in an effect.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOrder(reconcile(JSON.parse(raw) as string[], ids));
      }
    } catch {
      /* ignore malformed storage */
    }
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function persist(next: string[]) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    return next;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrder((prev) =>
      persist(arrayMove(prev, prev.indexOf(active.id as string), prev.indexOf(over.id as string))),
    );
  }

  function moveBy(id: string, dir: -1 | 1) {
    setOrder((prev) => {
      const from = prev.indexOf(id);
      const to = from + dir;
      if (from < 0 || to < 0 || to >= prev.length) return prev;
      return persist(arrayMove(prev, from, to));
    });
  }

  const ordered = reconcile(order, ids);
  const byId = new Map(items.map((i) => [i.id, i.node]));

  // Server / pre-hydration: plain grid, no dnd-kit (keeps SSR markup stable).
  if (!mounted) {
    return (
      <div className="grid gap-6">
        {ordered.map((id) => (
          <div key={id}>{byId.get(id)}</div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {editMode
            ? "Drag the cards, or use the arrows, to rearrange them."
            : "Tip: press & hold a card (or tap Rearrange) to reorder."}
        </span>
        <Button variant={editMode ? "default" : "outline"} size="sm" onClick={() => setEditMode((v) => !v)}>
          {editMode ? "Done" : "Rearrange"}
        </Button>
      </div>
      <DndContext
        // Stable id so dnd-kit's aria-describedby matches between server and
        // client render (otherwise its auto-counter causes a hydration mismatch).
        id="dashboard-widgets"
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragStart={() => setEditMode(true)}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ordered} strategy={verticalListSortingStrategy}>
          <div className="grid gap-6">
            {ordered.map((id, i) => (
              <SortableWidget
                key={id}
                id={id}
                editMode={editMode}
                isFirst={i === 0}
                isLast={i === ordered.length - 1}
                onMove={moveBy}
              >
                {byId.get(id)}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}
