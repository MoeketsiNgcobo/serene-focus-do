import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  listCharts,
  createChart,
  deleteChart,
  renameChart,
} from "@/lib/projects.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { toast } from "sonner";
import { GanttChartSquare, Plus, Trash2, Pencil, ArrowRight, Bot } from "lucide-react";

const chartsQuery = queryOptions({ queryKey: ["charts"], queryFn: () => listCharts() });

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: ({ context }) => context.queryClient.ensureQueryData(chartsQuery),
  component: Dashboard,
  errorComponent: ({ error }) => (
    <AppShell>
      <p className="text-sm text-destructive" role="alert">
        {error.message}
      </p>
    </AppShell>
  ),
});

function Dashboard() {
  const { data: charts } = useQuery(chartsQuery);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const createFn = useServerFn(createChart);
  const deleteFn = useServerFn(deleteChart);
  const renameFn = useServerFn(renameChart);

  const [newName, setNewName] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["charts"] });

  const create = useMutation({
    mutationFn: (name: string) => createFn({ data: { name } }),
    onSuccess: (chart) => {
      invalidate();
      setNewName("");
      setOpen(false);
      toast.success("Chart created");
      navigate({ to: "/chart/$chartId", params: { chartId: chart.id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Chart deleted");
    },
  });

  const rename = useMutation({
    mutationFn: (v: { id: string; name: string }) => renameFn({ data: v }),
    onSuccess: () => {
      invalidate();
      setEditing(null);
      toast.success("Renamed");
    },
  });

  return (
    <AppShell>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Your charts</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage Gantt charts for each project.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" /> New chart
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New chart</DialogTitle>
            </DialogHeader>
            <Input
              autoFocus
              placeholder="e.g. Website Redesign"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && newName.trim() && create.mutate(newName.trim())}
            />
            <DialogFooter>
              <Button
                onClick={() => create.mutate(newName.trim())}
                disabled={!newName.trim() || create.isPending}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {charts && charts.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <GanttChartSquare className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">No charts yet. Create your first project chart.</p>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> New chart
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {charts?.map((c) => (
            <Card key={c.id} className="group flex flex-col justify-between p-5">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{c.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {c.taskCount} {c.taskCount === 1 ? "task" : "tasks"}
                </p>
              </div>
              <div className="mt-5 flex items-center justify-between">
                <Link to="/chart/$chartId" params={{ chartId: c.id }}>
                  <Button variant="secondary" size="sm">
                    Open <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing({ id: c.id, name: c.name })}
                    aria-label="Rename"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Delete">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete “{c.name}”?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently deletes the chart and all its tasks and collaborators.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove.mutate(c.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename chart</DialogTitle>
          </DialogHeader>
          <Input
            value={editing?.name ?? ""}
            onChange={(e) => setEditing((p) => (p ? { ...p, name: e.target.value } : p))}
          />
          <DialogFooter>
            <Button
              onClick={() => editing && rename.mutate({ id: editing.id, name: editing.name.trim() })}
              disabled={!editing?.name.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
