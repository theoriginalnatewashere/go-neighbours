import { createFileRoute } from "@tanstack/react-router";
import { VerificationSubmitted } from "@/app/components/VerificationSubmitted";

export const Route = createFileRoute("/verify-address/submitted")({
  head: () => ({
    meta: [
      { title: "Verification submitted — Go Neighbours" },
      { name: "description", content: "Your verification request was submitted." },
    ],
  }),
  component: VerificationSubmitted,
});
