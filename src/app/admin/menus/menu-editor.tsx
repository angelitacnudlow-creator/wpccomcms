"use client";

import { useActionState, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { saveMenu, type MenuFormState } from "./actions";

type Item = { id: string; label: string; url: string };

const initialState: MenuFormState = {};

export function MenuEditor({
  menuKey,
  title,
  initialItems,
}: {
  menuKey: "header" | "footer";
  title: string;
  initialItems: { label: string; url: string }[];
}) {
  const [items, setItems] = useState<Item[]>(
    initialItems.map((i) => ({ ...i, id: crypto.randomUUID() })),
  );
  const boundSave = saveMenu.bind(null, menuKey);
  const [state, formAction, pending] = useActionState(boundSave, initialState);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  return (
    <div className="max-w-xl space-y-4">
      <h2 className="text-lg font-medium">{title}</h2>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((item) => (
              <SortableItem
                key={item.id}
                item={item}
                onChange={(next) =>
                  setItems((prev) => prev.map((i) => (i.id === item.id ? next : i)))
                }
                onRemove={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setItems((prev) => [...prev, { id: crypto.randomUUID(), label: "", url: "" }])}
      >
        <Plus className="size-4" /> Add item
      </Button>

      <form action={formAction}>
        <input
          type="hidden"
          name="items"
          value={JSON.stringify(items.map(({ label, url }) => ({ label, url })))}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : `Save ${title.toLowerCase()}`}
        </Button>
        {state.error && <p className="mt-2 text-sm text-destructive">{state.error}</p>}
        {state.ok && <p className="mt-2 text-sm text-muted-foreground">Saved.</p>}
      </form>
    </div>
  );
}

function SortableItem({
  item,
  onChange,
  onRemove,
}: {
  item: Item;
  onChange: (item: Item) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-md border bg-card p-2",
        isDragging && "z-10 opacity-80 shadow-lg",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-4" />
      </button>
      <Input
        aria-label="Menu item label"
        value={item.label}
        onChange={(e) => onChange({ ...item, label: e.target.value })}
        placeholder="Label"
        className="flex-1"
      />
      <Input
        aria-label="Menu item URL"
        value={item.url}
        onChange={(e) => onChange({ ...item, url: e.target.value })}
        placeholder="/about"
        className="flex-1"
      />
      <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} aria-label="Remove">
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
