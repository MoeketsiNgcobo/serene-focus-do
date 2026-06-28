import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ChartRow = {
  id: string;
  name: string;
  created_at: string;
};

export type CollaboratorRow = {
  id: string;
  chart_id: string;
  name: string;
  experience: string;
  hourly_cost: number;
};

export type TaskRow = {
  id: string;
  chart_id: string;
  name: string;
  category: string;
  start_date: string;
  end_date: string;
  notes: string;
  is_complete: boolean;
  assignee_ids: string[];
};

export type ChartData = {
  chart: ChartRow;
  tasks: TaskRow[];
  collaborators: CollaboratorRow[];
};

export const listCharts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<(ChartRow & { taskCount: number })[]> => {
    const { supabase } = context;
    const { data: charts, error } = await supabase
      .from("charts")
      .select("id, name, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const { data: tasks } = await supabase.from("tasks").select("chart_id");
    const counts = new Map<string, number>();
    (tasks ?? []).forEach((t: { chart_id: string }) => {
      counts.set(t.chart_id, (counts.get(t.chart_id) ?? 0) + 1);
    });

    return (charts ?? []).map((c) => ({ ...c, taskCount: counts.get(c.id) ?? 0 }));
  });

export const createChart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ name: z.string().trim().min(1).max(120) }).parse(d))
  .handler(async ({ data, context }): Promise<ChartRow> => {
    const { supabase, userId } = context;
    const { data: chart, error } = await supabase
      .from("charts")
      .insert({ name: data.name, owner_id: userId })
      .select("id, name, created_at")
      .single();
    if (error) throw new Error(error.message);
    return chart;
  });

export const renameChart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), name: z.string().trim().min(1).max(120) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("charts")
      .update({ name: data.name })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteChart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("charts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getChartData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ chartId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<ChartData> => {
    const { supabase } = context;
    const { data: chart, error: chartErr } = await supabase
      .from("charts")
      .select("id, name, created_at")
      .eq("id", data.chartId)
      .maybeSingle();
    if (chartErr) throw new Error(chartErr.message);
    if (!chart) throw new Error("Chart not found");

    const [{ data: tasks }, { data: collaborators }] = await Promise.all([
      supabase
        .from("tasks")
        .select("id, chart_id, name, category, start_date, end_date, notes, is_complete")
        .eq("chart_id", data.chartId)
        .order("start_date", { ascending: true }),
      supabase
        .from("collaborators")
        .select("id, chart_id, name, experience, hourly_cost")
        .eq("chart_id", data.chartId)
        .order("created_at", { ascending: true }),
    ]);

    const taskIds = (tasks ?? []).map((t) => t.id);
    let assignMap = new Map<string, string[]>();
    if (taskIds.length) {
      const { data: assigns } = await supabase
        .from("task_assignees")
        .select("task_id, collaborator_id")
        .in("task_id", taskIds);
      (assigns ?? []).forEach((a: { task_id: string; collaborator_id: string }) => {
        const arr = assignMap.get(a.task_id) ?? [];
        arr.push(a.collaborator_id);
        assignMap.set(a.task_id, arr);
      });
    }

    return {
      chart,
      collaborators: (collaborators ?? []).map((c) => ({
        ...c,
        hourly_cost: Number(c.hourly_cost),
      })),
      tasks: (tasks ?? []).map((t) => ({ ...t, assignee_ids: assignMap.get(t.id) ?? [] })),
    };
  });

const taskInput = z.object({
  chartId: z.string().uuid(),
  name: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(60),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  notes: z.string().max(4000).default(""),
  assignee_ids: z.array(z.string().uuid()).default([]),
});

export const createTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => taskInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        chart_id: data.chartId,
        name: data.name,
        category: data.category,
        start_date: data.start_date,
        end_date: data.end_date,
        notes: data.notes,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    if (data.assignee_ids.length) {
      const { error: aErr } = await supabase
        .from("task_assignees")
        .insert(data.assignee_ids.map((cid) => ({ task_id: task.id, collaborator_id: cid })));
      if (aErr) throw new Error(aErr.message);
    }
    return { id: task.id };
  });

export const updateTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => taskInput.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("tasks")
      .update({
        name: data.name,
        category: data.category,
        start_date: data.start_date,
        end_date: data.end_date,
        notes: data.notes,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    await supabase.from("task_assignees").delete().eq("task_id", data.id);
    if (data.assignee_ids.length) {
      const { error: aErr } = await supabase
        .from("task_assignees")
        .insert(data.assignee_ids.map((cid) => ({ task_id: data.id, collaborator_id: cid })));
      if (aErr) throw new Error(aErr.message);
    }
    return { ok: true };
  });

export const toggleTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), is_complete: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("tasks")
      .update({ is_complete: data.is_complete })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("tasks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const collabInput = z.object({
  chartId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  experience: z.string().trim().min(1).max(40),
  hourly_cost: z.number().min(0).max(100000),
});

export const createCollaborator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => collabInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("collaborators").insert({
      chart_id: data.chartId,
      name: data.name,
      experience: data.experience,
      hourly_cost: data.hourly_cost,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateCollaborator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => collabInput.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("collaborators")
      .update({ name: data.name, experience: data.experience, hourly_cost: data.hourly_cost })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCollaborator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("collaborators").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
