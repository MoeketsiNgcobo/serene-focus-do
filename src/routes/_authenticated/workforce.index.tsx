import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/workforce/")({
  beforeLoad: () => {
    throw redirect({ to: "/workforce/email" });
  },
});
