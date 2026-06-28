import { useEffect, useState } from "react";
import type { TaskRow, CollaboratorRow } from "@/lib/projects.functions";
import { CATEGORY_OPTIONS } from "@/lib/project-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TaskFormValue = {
  name: string;
  category: string;
  start_date: string;
  end_date: string;
  notes: string;
  assignee_ids: string[];
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function TaskDialog({
  open,
  onOpenChange,
  initial,
  collaborators,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: TaskRow | null;
  collaborators: CollaboratorRow[];
  onSubmit: (v: TaskFormValue) => void;
  pending: boolean;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("General");
  const [start, setStart] = useState(today());
  const [end, setEnd] = useState(today());
  const [notes, setNotes] = useState("");
  const [assignees, setAssignees] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setCategory(initial?.category ?? "General");
      setStart(initial?.start_date ?? today());
      setEnd(initial?.end_date ?? today());
      setNotes(initial?.notes ?? "");
      setAssignees(initial?.assignee_ids ?? []);
    }
  }, [open, initial]);

  const valid = name.trim() && start && end && end >= start;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit task" : "New task"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Task name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Wireframes" />
          </div>
          <div className="space-y-1">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Start date</Label>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>End date</Label>
              <Input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Details, links, context…"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Assignees</Label>
            {collaborators.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Add collaborators first to assign them.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {collaborators.map((c) => {
                  const checked = assignees.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) =>
                          setAssignees((prev) =>
                            v ? [...prev, c.id] : prev.filter((id) => id !== c.id),
                          )
                        }
                      />
                      <span className="truncate">{c.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={!valid || pending}
            onClick={() =>
              onSubmit({
                name: name.trim(),
                category,
                start_date: start,
                end_date: end,
                notes,
                assignee_ids: assignees,
              })
            }
          >
            {initial ? "Save changes" : "Create task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
