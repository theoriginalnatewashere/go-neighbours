import { createFileRoute } from "@tanstack/react-router";
import { ClusterAssigned } from "@/app/components/ClusterAssigned";

export const Route = createFileRoute("/location/cluster")({
  head: () => ({
    meta: [
      { title: "Your cluster — Go Neighbours" },
      { name: "description", content: "Your assigned neighbourhood cluster." },
    ],
  }),
  component: ClusterAssigned,
});
