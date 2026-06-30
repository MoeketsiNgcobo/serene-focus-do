import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Coffee } from "lucide-react";
import { useWorkforce } from "@/lib/workforce-context";
import {
  runPlanner,
  type PlannerOutput,
  type CognitiveLoad,
} from "@/lib/workforce-ai";
import { OutputActions, Guardrail, Spinner } from "@/components/workforce/OutputActions";

export const Route = createFileRoute("/_authenticated/workforce/planner")({
  head: () => ({ meta: [{ title: "Energy-Aware Task Planner — WorkforceAI" }] }),
  component: PlannerPage,
});

function loadVariant(load?: CognitiveLoad): "destructive" | "default" | "secondary" {
  if (load === "High") return "destructive";
  if (load === "Medium") return "default";
  return "secondary";
}

function PlannerPage() {
  const { engine, globalContext } = useWorkforce();
  const [tasks, setTasks] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlannerOutput | null>(null);

  const generate = async () => {
    if (!tasks.trim()) {
      toast.error("Enter some tasks first");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const out = await runPlanner(engine, globalContext, { tasks });
      setResult(out);
      toast.success("Plan generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Planning failed");
    } finally {
      setLoading(false);
    }
  };

  const exportText = (r: PlannerOutput) =>
    r.items
      .map((i) =>
        i.type === "break"
          ? `${i.time}  ☕ ${i.name}`
          : `${i.time}  ${i.name} [${i.cognitiveLoad} load · ${i.quadrant}]`,
      )
      .join("\n");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <CalendarClock className="h-6 w-6 text-primary" /> Energy-Aware Task Planner
        </h1>
        <p className="text-sm text-muted-foreground">
          Prioritizes via the Eisenhower matrix, rates cognitive load, and inserts
          screen-free breaks between deep-focus tasks.
        </p>
      </header>

      <Card className="bg-card/70 backdrop-blur">
        <CardContent className="space-y-4 pt-6">
          <Textarea
            value={tasks}
            onChange={(e) => setTasks(e.target.value)}
            placeholder={"One task per line, e.g.\nFinish API integration code\nReview pull requests\nDesign system architecture\nReply to client emails"}
            className="min-h-[160px]"
          />
          <Button onClick={generate} disabled={loading}>
            {loading ? "Planning…" : "Generate Plan"}
          </Button>
        </CardContent>
      </Card>

      {loading && <Spinner label="Mapping cognitive load…" />}

      {result && (
        <Card className="bg-card/70 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Daily Timeline</CardTitle>
            <OutputActions text={exportText(result)} filename="task-plan" />
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-3 border-l border-border pl-6">
              {result.items.map((item, i) => (
                <li key={i} className="relative">
                  <span
                    className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-background ${
                      item.type === "break" ? "bg-accent" : "bg-primary"
                    }`}
                  />
                  {item.type === "break" ? (
                    <div className="flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm">
                      <Coffee className="h-4 w-4 text-accent-foreground" />
                      <span className="font-medium">{item.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{item.time}</span>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border bg-card/60 px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{item.time}</span>
                        <span className="font-medium">{item.name}</span>
                        <Badge variant={loadVariant(item.cognitiveLoad)} className="ml-auto">
                          {item.cognitiveLoad} load
                        </Badge>
                      </div>
                      {item.quadrant && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Priority: {item.quadrant}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ol>
            <Guardrail />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
