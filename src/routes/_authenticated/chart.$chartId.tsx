import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { GanttChart } from "@/components/GanttChart";
import { ActivityPie } from "@/components/ActivityPie";
import { CollaboratorsPanel } from "@/components/CollaboratorsPanel";
import { TaskDialog, type TaskFormValue } from "@/components/TaskDialog";
import {
  getChartData,
  createTask,
  updateTask,
  deleteTask,
  toggleTask,
  type TaskRow,
} from "@/lib/projects.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";

const chartQuery = (chartId: string) =>
  queryOptions({
    queryKey: ["chart", chartId],
    queryFn: () => getChartData({ data: { chartId } }),
  });

export const Route = createFileRoute("/_authenticated/chart/$chartId")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(chartQuery(params.chartId)),
  component: ChartPage,
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="space-y-3">
        <p className="text-sm text-destructive" role="alert">
          {error.message}
        </p>
        <Link to="/dashboard">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to charts
          </Button>
        </Link>
      </div>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <p className="text-muted-foreground">Chart not found.</p>
    </AppShell>
  ),
});

function ChartPage() {
  const { chartId } = Route.useParams();
  const { data } = useQuery(chartQuery(chartId));
  const queryClient = useQueryClient();

  const createFn = useServerFn(createTask);
  const updateFn = useServerFn(updateTask);
  const deleteFn = useServerFn(deleteTask);
  const toggleFn = useServerFn(toggleTask);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<TaskRow | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["chart", chartId] });

  const create = useMutation({
    mutationFn: (v: TaskFormValue) => createFn({ data: { chartId, ...v } }),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      toast.success("Task added");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const update = useMutation({
    mutationFn: (v: TaskFormValue & { id: string }) => updateFn({ data: { chartId, ...v } }),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      setEditTask(null);
      toast.success("Task updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Task deleted");
    },
  });

  const toggle = useMutation({
    mutationFn: (t: TaskRow) => toggleFn({ data: { id: t.id, is_complete: !t.is_complete } }),
    onSuccess: invalidate,
  });

  if (!data) return null;
  const { chart, tasks, collaborators } = data;

  const openNew = () => {
    setEditTask(null);
    setDialogOpen(true);
  };
  const openEdit = (t: TaskRow) => {
    setEditTask(t);
    setDialogOpen(true);
  };

  const handleSubmit = (v: TaskFormValue) => {
    if (editTask) update.mutate({ ...v, id: editTask.id });
    else create.mutate(v);
  };

  return (
    <AppShell>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" aria-label="Back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{chart.name}</h1>
            <p className="text-sm text-muted-foreground">
              {tasks.length} {tasks.length === 1 ? "task" : "tasks"} ·{" "}
              {collaborators.length} {collaborators.length === 1 ? "person" : "people"}
            </p>
          </div>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-1 h-4 w-4" /> Add task
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Timeline</h2>
          <GanttChart
            tasks={tasks}
            collaborators={collaborators}
            onToggle={(t) => toggle.mutate(t)}
            onEdit={openEdit}
            onDelete={(t) => remove.mutate(t.id)}
          />
        </Card>

        <Card className="p-5">
          <h2 className="mb-2 text-lg font-semibold text-foreground">Time per activity</h2>
          <p className="mb-2 text-xs text-muted-foreground">By planned duration</p>
          <ActivityPie tasks={tasks} />
        </Card>
      </div>

      <Card className="mt-5 p-5">
        <CollaboratorsPanel chartId={chartId} collaborators={collaborators} tasks={tasks} />
      </Card>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditTask(null);
        }}
        initial={editTask}
        collaborators={collaborators}
        onSubmit={handleSubmit}
        pending={create.isPending || update.isPending}
      />
    </AppShell>
  );
}
