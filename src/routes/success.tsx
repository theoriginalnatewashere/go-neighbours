import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import Success from "@/app/components/Success";

const search = z.object({ kind: z.string().optional() });

export const Route = createFileRoute("/success")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "All done — Go Neighbours" },
      { name: "description", content: "Confirmation of your action." },
    ],
  }),
  component: SuccessRoute,
});

function SuccessRoute() {
  const { kind } = Route.useSearch();
  return <Success kind={kind ?? "default"} />;
}
