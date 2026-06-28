import { createFileRoute } from "@tanstack/react-router";
import { VerificationSubmitted } from "@/app/components/VerificationSubmitted";
import { guardSignedIn } from "@/lib/authGuard";

export const Route = createFileRoute("/verify-address/submitted")({
  ssr: false,
  beforeLoad: guardSignedIn,
  head: () => ({
    meta: [
      { title: "Verification submitted — Go Neighbours" },
      { name: "description", content: "Your verification request was submitted." },
    ],
  }),
  component: VerificationSubmitted,
});
