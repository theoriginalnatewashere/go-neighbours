import { createFileRoute, redirect } from "@tanstack/react-router";
import { LocationPermission, LOCATION_SKIPPED_KEY } from "@/app/components/LocationPermission";
import { guardSignedIn } from "@/lib/authGuard";

export const Route = createFileRoute("/location")({
  ssr: false,
  beforeLoad: async (ctx) => {
    await guardSignedIn(ctx);
    if (typeof window !== "undefined" && sessionStorage.getItem(LOCATION_SKIPPED_KEY) === "1") {
      throw redirect({ to: "/profile-setup" });
    }
  },
  head: () => ({
    meta: [
      { title: "Allow location — Go Neighbours" },
      { name: "description", content: "Allow location access to find neighbours and local help nearby." },
    ],
  }),
  component: LocationPermission,
});

