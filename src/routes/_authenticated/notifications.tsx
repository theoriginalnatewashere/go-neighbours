import { createFileRoute } from "@tanstack/react-router";
import Notifications from "@/app/components/Notifications";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Go Neighbours" },
      { name: "description", content: "Manage your address verification status and notification settings." },
    ],
  }),
  component: Notifications,
});
