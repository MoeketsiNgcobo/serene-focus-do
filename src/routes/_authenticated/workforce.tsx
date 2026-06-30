import { createFileRoute, Outlet } from "@tanstack/react-router";
import { WorkforceProvider } from "@/lib/workforce-context";
import { WorkforceSidebar } from "@/components/WorkforceSidebar";

export const Route = createFileRoute("/_authenticated/workforce")({
  component: WorkforceLayout,
});

function WorkforceLayout() {
  return (
    <WorkforceProvider>
      <div className="flex min-h-screen bg-background">
        <WorkforceSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </WorkforceProvider>
  );
}
