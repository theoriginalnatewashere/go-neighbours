import { createFileRoute } from "@tanstack/react-router";
import { ClusterAssigned } from "@/app/components/ClusterAssigned";
import { guardSignedIn } from "@/lib/authGuard";

export const Route = createFileRoute("/location/cluster")({
  ssr: false,
  beforeLoad: guardSignedIn,
  head: () => ({
    meta: [
      { title: "Your cluster — Go Neighbours" },
      { name: "description", content: "Your assigned neighbourhood cluster." },
    ],
  }),
  component: ClusterAssigned,
});
