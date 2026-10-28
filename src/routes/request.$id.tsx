import { createFileRoute } from "@tanstack/react-router";
import { redirectToAppPath } from "@/lib/legacyRedirect";

// Legacy address — the page now lives under /app.
export const Route = createFileRoute("/request/$id")({
  beforeLoad: redirectToAppPath,
});
