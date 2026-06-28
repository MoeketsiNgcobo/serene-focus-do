import type { TaskRow, CollaboratorRow } from "@/lib/projects.functions";
import { categoryColorVar, daysBetween, fmtDate } from "@/lib/project-utils";
import { Check, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  tasks: TaskRow[];
  collaborators: CollaboratorRow[];
  onToggle: (t: TaskRow) => void;
  onEdit: (t: TaskRow) => void;
  onDelete: (t: TaskRow) => void;
};

export function GanttChart({ tasks, collaborators, onToggle, onEdit, onDelete }: Props) {
  if (tasks.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No tasks yet. Add a task to see the timeline.
      </p>
    );
  }

  const starts = tasks.map((t) => new Date(t.start_date + "T00:00:00").getTime());
  const ends = tasks.map((t) => new Date(t.end_date + "T00:00:00").getTime());
  const min = Math.min(...starts);
  const max = Math.max(...ends);
  const totalDays = Math.max(1, Math.round((max - min) / 86400000) + 1);

  const collabName = (id: string) => collaborators.find((c) => c.id === id)?.name ?? "?";

  // Build month markers across the span.
  const markers: { label: string; pct: number }[] = [];
  const cursor = new Date(min);
  cursor.setDate(1);
  while (cursor.getTime() <= max) {
    const offset = Math.round((cursor.getTime() - min) / 86400000);
    markers.push({
      label: cursor.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
      pct: (offset / totalDays) * 100,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="relative mb-2 ml-[200px] h-5 border-b">
          {markers.map((m, i) => (
            <span
              key={i}
              className="absolute -translate-x-1/2 text-xs text-muted-foreground"
              style={{ left: `${Math.min(98, Math.max(2, m.pct))}%` }}
            >
              {m.label}
            </span>
          ))}
        </div>

        <div className="space-y-2">
          {tasks.map((t) => {
            const offset = Math.round(
              (new Date(t.start_date + "T00:00:00").getTime() - min) / 86400000,
            );
            const len = daysBetween(t.start_date, t.end_date);
            const left = (offset / totalDays) * 100;
            const width = (len / totalDays) * 100;
            const color = categoryColorVar(t.category);
            return (
              <div key={t.id} className="group flex items-center gap-3">
                <div className="flex w-[200px] shrink-0 items-center gap-2">
                  <button
                    onClick={() => onToggle(t)}
                    aria-label="Toggle complete"
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      t.is_complete
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {t.is_complete && <Check className="h-3 w-3" />}
                  </button>
                  <span
                    className={`truncate text-sm ${
                      t.is_complete ? "text-muted-foreground line-through" : "text-foreground"
                    }`}
                    title={t.name}
                  >
                    {t.name}
                  </span>
                </div>

                <div className="relative h-8 flex-1 rounded bg-muted/50">
                  <div
                    className="absolute top-1 flex h-6 items-center rounded px-2 text-xs font-medium text-white shadow-sm"
                    style={{
                      left: `${left}%`,
                      width: `${Math.max(width, 2)}%`,
                      backgroundColor: color,
                      opacity: t.is_complete ? 0.55 : 1,
                    }}
                    title={`${fmtDate(t.start_date)} – ${fmtDate(t.end_date)} · ${t.category}`}
                  >
                    <span className="truncate">
                      {t.assignee_ids.map(collabName).join(", ") || t.category}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(t)} aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(t)}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
