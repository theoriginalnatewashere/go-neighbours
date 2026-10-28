import { createFileRoute } from "@tanstack/react-router";
import { redirectToAppPath } from "@/lib/legacyRedirect";

// Legacy address — the page now lives under /app.
export const Route = createFileRoute("/patterns")({
  beforeLoad: redirectToAppPath,
});
