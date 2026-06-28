import { createFileRoute } from "@tanstack/react-router";
import { AddressVerification } from "@/app/components/AddressVerification";
import { guardSignedIn } from "@/lib/authGuard";

export const Route = createFileRoute("/verify-address")({
  ssr: false,
  beforeLoad: guardSignedIn,
  component: AddressVerification,
  head: () => ({
    meta: [
      { title: "Verify your address — Go Neighbours" },
      { name: "description", content: "Add your building, apartment, and street address." },
    ],
  }),
});
