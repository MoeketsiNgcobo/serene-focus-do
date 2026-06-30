import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail } from "lucide-react";
import { useWorkforce } from "@/lib/workforce-context";
import { runEmail, type EmailOutput } from "@/lib/workforce-ai";
import { OutputActions, Guardrail, Spinner } from "@/components/workforce/OutputActions";

export const Route = createFileRoute("/_authenticated/workforce/email")({
  head: () => ({ meta: [{ title: "Smart Email Generator — WorkforceAI" }] }),
  component: EmailPage,
});

const TONES = ["Formal", "Persuasive", "Assertive"] as const;

function EmailPage() {
  const { engine, globalContext } = useWorkforce();
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("Client");
  const [tone, setTone] = useState<string>("Formal");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmailOutput | null>(null);

  const generate = async () => {
    if (!topic.trim()) {
      toast.error("Enter a topic first");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const out = await runEmail(engine, globalContext, { topic, audience, tone });
      setResult(out);
      toast.success("Email generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Mail className="h-6 w-6 text-primary" /> Smart Email Generator
        </h1>
        <p className="text-sm text-muted-foreground">
          Draft polished emails tailored to your audience, tone, and global context.
        </p>
      </header>

      <Card className="bg-card/70 backdrop-blur">
        <CardContent className="space-y-4 pt-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Topic</label>
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Request a project deadline extension due to scope changes"
              className="min-h-[90px]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Target Audience</label>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Client">Client</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Team">Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tone</label>
              <div className="flex gap-2">
                {TONES.map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant={tone === t ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTone(t)}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Button onClick={generate} disabled={loading}>
            {loading ? "Generating…" : "Generate Email"}
          </Button>
        </CardContent>
      </Card>

      {loading && <Spinner label="Drafting your email…" />}

      {result && (
        <Card className="bg-card/70 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Generated Email</CardTitle>
            <OutputActions
              text={`Subject: ${result.subject}\n\n${result.body}`}
              filename="email-draft"
            />
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Subject</p>
              <p className="font-medium">{result.subject}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Body</p>
              <pre className="whitespace-pre-wrap font-sans text-sm">{result.body}</pre>
            </div>
            <Guardrail />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
