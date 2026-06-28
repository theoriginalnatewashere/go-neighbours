import { createFileRoute } from "@tanstack/react-router";
import { ClusterScanning } from "@/app/components/ClusterScanning";
import { guardSignedIn } from "@/lib/authGuard";

export const Route = createFileRoute("/location/scanning")({
  ssr: false,
  beforeLoad: guardSignedIn,
  head: () => ({
    meta: [
      { title: "Finding cluster — Go Neighbours" },
      { name: "description", content: "Searching nearby neighbourhood clusters." },
    ],
  }),
  component: ClusterScanning,
});
