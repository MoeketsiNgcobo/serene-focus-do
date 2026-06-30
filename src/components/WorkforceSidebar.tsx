import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/lib/theme";
import { useWorkforce } from "@/lib/workforce-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot,
  Mail,
  FileText,
  CalendarClock,
  ShieldCheck,
  Settings,
  Moon,
  Sun,
  LogOut,
  LayoutGrid,
} from "lucide-react";

const links = [
  { to: "/workforce/email", label: "Email Generator", icon: Mail },
  { to: "/workforce/meetings", label: "Meeting Summarizer", icon: FileText },
  { to: "/workforce/planner", label: "Task Planner", icon: CalendarClock },
] as const;

export function WorkforceSidebar() {
  const { theme, toggle } = useTheme();
  const { globalContext, setGlobalContext } = useWorkforce();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const isActive = (to: string) => pathname === to;

  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl">
      <div className="flex items-center gap-2 px-5 py-4">
        <Bot className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold text-sidebar-foreground">WorkforceAI</span>
      </div>

      <div className="px-4 pb-3">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Global Context
        </label>
        <Textarea
          aria-label="Current Role & Focus"
          value={globalContext}
          onChange={(e) => setGlobalContext(e.target.value)}
          placeholder="Role: Information Technology Student / Python Developer. Current Focus: Enterprise system integration and API development."
          className="min-h-[110px] resize-none bg-card/60 text-xs"
        />
        <p className="mt-1 text-[11px] text-muted-foreground">
          Appended to every AI request.
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive(l.to)
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60"
            }`}
          >
            <l.icon className="h-4 w-4" />
            {l.label}
          </Link>
        ))}

        <div className="my-2 border-t border-sidebar-border" />

        <Link
          to="/workforce/responsible-ai"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isActive("/workforce/responsible-ai")
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/60"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Responsible AI
        </Link>
      </nav>

      <div className="space-y-1 border-t border-sidebar-border px-3 py-3">
        <Link
          to="/workforce/settings"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isActive("/workforce/settings")
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/60"
          }`}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <Link
          to="/dashboard"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60"
        >
          <LayoutGrid className="h-4 w-4" />
          ProjectFlow
        </Link>
        <div className="flex items-center gap-1 px-1 pt-1">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
