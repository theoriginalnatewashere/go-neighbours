import { createFileRoute } from "@tanstack/react-router";
import NeighborProfile from "@/app/components/NeighborProfile";

export const Route = createFileRoute("/neighbor/$id")({
  head: () => ({
    meta: [
      { title: "Neighbour — Go Neighbours" },
      { name: "description", content: "Get to know a neighbour in your cluster." },
    ],
  }),
  component: NeighborProfile,
});
