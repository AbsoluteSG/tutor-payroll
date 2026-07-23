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
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLongPress } from "@/lib/use-long-press";
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
  longPress,
  children,
}: {
  id: string;
  editMode: boolean;
  longPress: ReturnType<typeof useLongPress>;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !editMode,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative", editMode && "touch-none select-none cursor-grab", isDragging && "opacity-80")}
      {...(editMode ? { ...attributes, ...listeners } : longPress)}
    >
      {editMode && (
        <div className="pointer-events-none absolute right-3 top-3 z-10 text-muted-foreground">
          <GripVertical className="size-5" />
        </div>
      )}
      {/* Inner wrapper carries the jiggle so it never fights dnd-kit's transform,
          and swallows clicks while rearranging. */}
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
  const longPress = useLongPress(() => setEditMode(true), 3000);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrder((prev) => {
      const next = arrayMove(prev, prev.indexOf(active.id as string), prev.indexOf(over.id as string));
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const ordered = reconcile(order, ids);
  const byId = new Map(items.map((i) => [i.id, i.node]));

  return (
    <>
      {editMode && (
        <div className="flex items-center justify-between rounded-lg border border-dashed p-3 text-sm">
          <span className="text-muted-foreground">Drag the cards to rearrange them.</span>
          <Button size="sm" onClick={() => setEditMode(false)}>
            Done
          </Button>
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ordered} strategy={verticalListSortingStrategy}>
          <div className="grid gap-6">
            {ordered.map((id) => (
              <SortableWidget key={id} id={id} editMode={editMode} longPress={longPress}>
                {byId.get(id)}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}
