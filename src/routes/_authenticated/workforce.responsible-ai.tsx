import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Lock, EyeOff, ServerOff, AlertTriangle } from "lucide-react";
import { GUARDRAIL } from "@/lib/workforce-ai";

export const Route = createFileRoute("/_authenticated/workforce/responsible-ai")({
  head: () => ({ meta: [{ title: "Responsible AI — WorkforceAI" }] }),
  component: ResponsibleAIPage,
});

const privacy = [
  {
    icon: Lock,
    title: "Bring-Your-Own-Key, client-side only",
    body: "Live API keys (Google Gemini / OpenAI) are stored exclusively in your browser's localStorage and are sent directly from your browser to the provider. They are never transmitted to or stored on our backend.",
  },
  {
    icon: ServerOff,
    title: "No persistent telemetry storage",
    body: "We do not log or persist your generated content, transcripts, or prompts for analytics. Only your Global Context and engine preference are synced to your private account so the assistant feels consistent across devices.",
  },
  {
    icon: EyeOff,
    title: "Your data stays yours",
    body: "Row-level security ensures only you can read or write your own settings. Module outputs live in your session and the files you choose to download.",
  },
];

function ResponsibleAIPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <ShieldCheck className="h-6 w-6 text-primary" /> Responsible AI &amp; Ethics
        </h1>
        <p className="text-sm text-muted-foreground">
          How WorkforceAI handles your data and the guardrails on every output.
        </p>
      </header>

      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-semibold">Universal Guardrail</p>
            <p className="text-sm text-muted-foreground">{GUARDRAIL}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {privacy.map((p) => (
          <Card key={p.title} className="bg-card/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <p.icon className="h-5 w-5 text-primary" /> {p.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{p.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base">Architectural transparency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Mock Demonstration Mode</strong> runs entirely
            in your browser using deterministic local logic — no network calls leave your device.
          </p>
          <p>
            <strong className="text-foreground">Lovable AI</strong> routes requests through a
            secure server function so no key management is required of you.
          </p>
          <p>
            <strong className="text-foreground">Live Gemini / OpenAI</strong> calls are made
            directly from your browser to the provider with your own key.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
