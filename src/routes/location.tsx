import { createFileRoute } from "@tanstack/react-router";
import { LocationPermission } from "@/app/components/LocationPermission";

export const Route = createFileRoute("/location")({
  head: () => ({
    meta: [
      { title: "Allow location — Go Neighbours" },
      { name: "description", content: "Allow location access to find neighbours and local help nearby." },
    ],
  }),
  component: LocationPermission,
});
