import { Copy, Download, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GUARDRAIL } from "@/lib/workforce-ai";

export function OutputActions({
  text,
  filename,
}: {
  text: string;
  filename: string;
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy");
    }
  };

  const download = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".txt") ? filename : `${filename}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Downloaded .txt");
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={copy}>
        <Copy className="mr-1 h-4 w-4" /> Copy
      </Button>
      <Button variant="outline" size="sm" onClick={download}>
        <Download className="mr-1 h-4 w-4" /> Download .txt
      </Button>
    </div>
  );
}

export function Guardrail() {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-muted-foreground">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <span>{GUARDRAIL}</span>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      {label ?? "Generating…"}
    </div>
  );
}
