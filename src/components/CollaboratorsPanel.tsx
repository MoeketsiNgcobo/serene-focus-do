import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { TaskRow, CollaboratorRow } from "@/lib/projects.functions";
import {
  createCollaborator,
  updateCollaborator,
  deleteCollaborator,
} from "@/lib/projects.functions";
import { daysBetween, EXPERIENCE_OPTIONS } from "@/lib/project-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const HOURS_PER_DAY = 8;

type Stats = { assigned: number; progress: number; cost: number };

export function CollaboratorsPanel({
  chartId,
  collaborators,
  tasks,
}: {
  chartId: string;
  collaborators: CollaboratorRow[];
  tasks: TaskRow[];
}) {
  const queryClient = useQueryClient();
  const createFn = useServerFn(createCollaborator);
  const updateFn = useServerFn(updateCollaborator);
  const deleteFn = useServerFn(deleteCollaborator);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CollaboratorRow | null>(null);
  const [name, setName] = useState("");
  const [experience, setExperience] = useState<string>("Mid");
  const [cost, setCost] = useState("0");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["chart", chartId] });

  const stats = (id: string): Stats => {
    const assignedTasks = tasks.filter((t) => t.assignee_ids.includes(id));
    const done = assignedTasks.filter((t) => t.is_complete).length;
    const rate = collaborators.find((c) => c.id === id)?.hourly_cost ?? 0;
    const totalCost = assignedTasks.reduce(
      (sum, t) => sum + daysBetween(t.start_date, t.end_date) * HOURS_PER_DAY * rate,
      0,
    );
    return {
      assigned: assignedTasks.length,
      progress: assignedTasks.length ? Math.round((done / assignedTasks.length) * 100) : 0,
      cost: totalCost,
    };
  };

  const resetForm = () => {
    setName("");
    setExperience("Mid");
    setCost("0");
    setEditing(null);
  };

  const create = useMutation({
    mutationFn: () =>
      createFn({ data: { chartId, name: name.trim(), experience, hourly_cost: Number(cost) || 0 } }),
    onSuccess: () => {
      invalidate();
      setOpen(false);
      resetForm();
      toast.success("Collaborator added");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const update = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          id: editing!.id,
          chartId,
          name: name.trim(),
          experience,
          hourly_cost: Number(cost) || 0,
        },
      }),
    onSuccess: () => {
      invalidate();
      resetForm();
      toast.success("Collaborator updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Collaborator removed");
    },
  });

  const startEdit = (c: CollaboratorRow) => {
    setEditing(c);
    setName(c.name);
    setExperience(c.experience);
    setCost(String(c.hourly_cost));
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Collaborators</h2>
        <Dialog open={open} onOpenChange={(o) => (setOpen(o), o && resetForm())}>
          <DialogTrigger asChild>
            <Button size="sm" variant="secondary">
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add collaborator</DialogTitle>
            </DialogHeader>
            <CollabForm
              name={name}
              setName={setName}
              experience={experience}
              setExperience={setExperience}
              cost={cost}
              setCost={setCost}
            />
            <DialogFooter>
              <Button onClick={() => create.mutate()} disabled={!name.trim() || create.isPending}>
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {collaborators.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No collaborators yet. Add people to assign them to tasks.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead className="text-right">Rate/hr</TableHead>
                <TableHead className="text-right">Tasks</TableHead>
                <TableHead className="w-[160px]">Progress</TableHead>
                <TableHead className="text-right">Est. cost</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collaborators.map((c) => {
                const s = stats(c.id);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.experience}</TableCell>
                    <TableCell className="text-right">${c.hourly_cost.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{s.assigned}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={s.progress} className="h-2" />
                        <span className="w-9 text-right text-xs text-muted-foreground">
                          {s.progress}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      ${s.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEdit(c)}
                          aria-label="Edit collaborator"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Delete collaborator">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove {c.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                They will be unassigned from all tasks in this chart.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => remove.mutate(c.id)}>
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit collaborator</DialogTitle>
          </DialogHeader>
          <CollabForm
            name={name}
            setName={setName}
            experience={experience}
            setExperience={setExperience}
            cost={cost}
            setCost={setCost}
          />
          <DialogFooter>
            <Button onClick={() => update.mutate()} disabled={!name.trim() || update.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CollabForm({
  name,
  setName,
  experience,
  setExperience,
  cost,
  setCost,
}: {
  name: string;
  setName: (v: string) => void;
  experience: string;
  setExperience: (v: string) => void;
  cost: string;
  setCost: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Experience</Label>
          <Select value={experience} onValueChange={setExperience}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_OPTIONS.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Hourly cost ($)</Label>
          <Input
            type="number"
            min={0}
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
