import { createFileRoute } from "@tanstack/react-router";
import { AddressVerification } from "@/app/components/AddressVerification";

export const Route = createFileRoute("/verify-address")({
  component: AddressVerification,
  head: () => ({
    meta: [
      { title: "Verify your address — Go Neighbours" },
      {
        name: "description",
        content:
          "Add your building, apartment, and street address to get verified and join your neighbourhood on Go Neighbours.",
      },
    ],
  }),
});
