import { createFileRoute } from "@tanstack/react-router";
import { AdminVerifications } from "@/app/components/AdminVerifications";

export const Route = createFileRoute("/_authenticated/admin/verifications")({
  head: () => ({
    meta: [
      { title: "Verification review — Go Neighbours" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminVerifications,
});
