import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GanttChartSquare, Users, PieChart, ListChecks } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ProjectFlow — Gantt charts for project managers" },
      {
        name: "description",
        content:
          "Plan projects with interactive Gantt charts, assign collaborators, track progress, and visualize time allocation — all in one calm workspace.",
      },
      { property: "og:title", content: "ProjectFlow — Gantt charts for project managers" },
      {
        property: "og:description",
        content: "Interactive Gantt charts, collaborator tracking, and time analytics.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const features = [
    { icon: GanttChartSquare, title: "Gantt timelines", desc: "Visualize tasks across dates, color-coded by activity." },
    { icon: ListChecks, title: "Full task control", desc: "Create, edit, complete, and delete with notes." },
    { icon: Users, title: "Collaborators", desc: "Assign people, track auto-calculated progress and cost." },
    { icon: PieChart, title: "Time analytics", desc: "See how planned duration splits across activities." },
  ];
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2 text-foreground">
          <GanttChartSquare className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">ProjectFlow</span>
        </div>
        <Link to="/auth">
          <Button variant="secondary" size="sm">Sign in</Button>
        </Link>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:py-28">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Plan projects with clarity.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          ProjectFlow turns your plans into clean, interactive Gantt charts — with collaborators,
          progress tracking, and time analytics in a calm, focused workspace.
        </p>
        <div className="mt-8 flex justify-center">
          <Link to="/auth">
            <Button size="lg">Get started — it's free</Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6">
              <f.icon className="h-7 w-7 text-primary" />
              <h3 className="mt-3 font-semibold text-card-foreground">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
