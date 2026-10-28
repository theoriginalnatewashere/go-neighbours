import { createFileRoute } from "@tanstack/react-router";
import { AdminNeighbourhoods } from "@/app/components/AdminNeighbourhoods";

export const Route = createFileRoute("/app/_authenticated/admin/neighbourhoods")({
  head: () => ({
    meta: [
      { title: "Neighbourhood directory — Go Neighbours" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminNeighbourhoods,
});
