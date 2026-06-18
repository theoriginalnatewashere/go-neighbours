import { createFileRoute } from "@tanstack/react-router";
import { ClusterScanning } from "@/app/components/ClusterScanning";

export const Route = createFileRoute("/location/scanning")({
  head: () => ({
    meta: [
      { title: "Finding cluster — Go Neighbours" },
      { name: "description", content: "Searching nearby neighbourhood clusters." },
    ],
  }),
  component: ClusterScanning,
});
