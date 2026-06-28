import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { TaskRow } from "@/lib/projects.functions";
import { categoryColorVar, daysBetween } from "@/lib/project-utils";

export function ActivityPie({ tasks }: { tasks: TaskRow[] }) {
  if (tasks.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Add tasks to see time distribution.
      </p>
    );
  }

  const data = tasks.map((t) => ({
    name: t.name,
    value: daysBetween(t.start_date, t.end_date),
    color: categoryColorVar(t.category),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={90} paddingAngle={2}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number) => [`${v} day${v === 1 ? "" : "s"}`, "Planned"]}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--popover-foreground)",
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
