import { createFileRoute } from "@tanstack/react-router";
import { LocationPermission } from "@/app/components/LocationPermission";
import { guardSignedIn } from "@/lib/authGuard";

export const Route = createFileRoute("/location")({
  ssr: false,
  beforeLoad: guardSignedIn,
  head: () => ({
    meta: [
      { title: "Allow location — Go Neighbours" },
      { name: "description", content: "Allow location access to find neighbours and local help nearby." },
    ],
  }),
  component: LocationPermission,
});
