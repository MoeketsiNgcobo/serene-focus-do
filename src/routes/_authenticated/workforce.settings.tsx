import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings as SettingsIcon, KeyRound } from "lucide-react";
import { useWorkforce } from "@/lib/workforce-context";
import {
  ENGINE_LABELS,
  getApiKey,
  setApiKey,
  type Engine,
} from "@/lib/workforce-ai";

export const Route = createFileRoute("/_authenticated/workforce/settings")({
  head: () => ({ meta: [{ title: "Settings — WorkforceAI" }] }),
  component: SettingsPage,
});

const BYOK: Record<Engine, boolean> = {
  mock: false,
  lovable: false,
  gemini: true,
  openai: true,
};

function SettingsPage() {
  const { engine, setEngine } = useWorkforce();
  const [keyValue, setKeyValue] = useState("");

  useEffect(() => {
    setKeyValue(getApiKey(engine));
  }, [engine]);

  const saveKey = () => {
    setApiKey(engine, keyValue.trim());
    toast.success(keyValue.trim() ? "API key saved locally" : "API key cleared");
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <SettingsIcon className="h-6 w-6 text-primary" /> Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure which AI engine powers every module.
        </p>
      </header>

      <Card className="bg-card/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base">Select AI Engine</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Select value={engine} onValueChange={(v) => setEngine(v as Engine)}>
            <SelectTrigger className="max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ENGINE_LABELS) as Engine[]).map((e) => (
                <SelectItem key={e} value={e}>
                  {ENGINE_LABELS[e]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            {engine === "mock" &&
              "Runs locally with a 1.5s simulated load and intelligent mock data. No key required."}
            {engine === "lovable" &&
              "Uses Lovable AI through a secure server function. No key required."}
            {engine === "gemini" &&
              "Calls Google Gemini directly from your browser using your own key (gemini-1.5-flash)."}
            {engine === "openai" &&
              "Calls OpenAI directly from your browser using your own key (gpt-4o-mini)."}
          </div>

          {BYOK[engine] && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <KeyRound className="h-4 w-4" /> Enter API Key
              </label>
              <div className="flex max-w-md gap-2">
                <Input
                  type="password"
                  value={keyValue}
                  onChange={(e) => setKeyValue(e.target.value)}
                  placeholder="Paste your API key"
                  autoComplete="off"
                />
                <Button onClick={saveKey}>Save</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Stored only in your browser (localStorage). Never sent to our servers.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
