import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText } from "lucide-react";
import { useWorkforce } from "@/lib/workforce-context";
import { runMeetings, type MeetingOutput } from "@/lib/workforce-ai";
import { OutputActions, Guardrail, Spinner } from "@/components/workforce/OutputActions";

export const Route = createFileRoute("/_authenticated/workforce/meetings")({
  head: () => ({ meta: [{ title: "Meeting Notes Summarizer — WorkforceAI" }] }),
  component: MeetingsPage,
});

function MeetingsPage() {
  const { engine, globalContext } = useWorkforce();
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MeetingOutput | null>(null);

  const generate = async () => {
    if (!transcript.trim()) {
      toast.error("Paste a transcript first");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const out = await runMeetings(engine, globalContext, { transcript });
      setResult(out);
      toast.success("Notes summarized");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Summarization failed");
    } finally {
      setLoading(false);
    }
  };

  const exportText = (r: MeetingOutput) =>
    `EXECUTIVE SUMMARY\n${r.summary}\n\nDECISIONS MADE\n${r.decisions
      .map((d) => `- ${d}`)
      .join("\n")}\n\nACTION ITEMS\n${r.actionItems
      .map((a) => `- ${a.task} | ${a.assignedTo} | ${a.deadline}`)
      .join("\n")}`;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <FileText className="h-6 w-6 text-primary" /> Meeting Notes Summarizer
        </h1>
        <p className="text-sm text-muted-foreground">
          Turn raw transcripts into an executive summary, decisions, and action items.
        </p>
      </header>

      <Card className="bg-card/70 backdrop-blur">
        <CardContent className="space-y-4 pt-6">
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste the raw meeting transcript here…"
            className="min-h-[180px]"
          />
          <Button onClick={generate} disabled={loading}>
            {loading ? "Summarizing…" : "Summarize Notes"}
          </Button>
        </CardContent>
      </Card>

      {loading && <Spinner label="Analyzing transcript…" />}

      {result && (
        <Card className="bg-card/70 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Summary</CardTitle>
            <OutputActions text={exportText(result)} filename="meeting-summary" />
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary">
              <TabsList>
                <TabsTrigger value="summary">Executive Summary</TabsTrigger>
                <TabsTrigger value="decisions">Decisions Made</TabsTrigger>
                <TabsTrigger value="actions">Action Items</TabsTrigger>
              </TabsList>
              <TabsContent value="summary" className="pt-3">
                <p className="text-sm leading-relaxed">{result.summary}</p>
              </TabsContent>
              <TabsContent value="decisions" className="pt-3">
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {result.decisions.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </TabsContent>
              <TabsContent value="actions" className="pt-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Deadline</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.actionItems.map((a, i) => (
                      <TableRow key={i}>
                        <TableCell>{a.task}</TableCell>
                        <TableCell>{a.assignedTo}</TableCell>
                        <TableCell>{a.deadline}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
            <Guardrail />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
