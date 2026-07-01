import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  DoorOpen,
  Loader2,
  MapPin,
  ShieldCheck,
  Clock,
  Lock,
  Users,
  Info,
  type LucideIcon,
  Home,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface FieldProps {
  label: string;
  optional?: boolean;
  icon: LucideIcon;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}

function Field({ label, optional, icon: Icon, placeholder, value, onChange, required }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-foreground">
        {label}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(optional)</span>}
      </label>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3.5 h-12 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={2} />
        <input
          type="text"
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent outline-none text-[15px] text-foreground placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  return (
    <div className="flex gap-3 items-start py-3">
      <div className="h-10 w-10 shrink-0 rounded-full bg-secondary flex items-center justify-center">
        <Icon className="h-[18px] w-[18px] text-primary" strokeWidth={2.2} />
      </div>
      <div className="flex-1 pt-0.5">
        <h3 className="text-[14px] font-semibold text-foreground leading-snug">{title}</h3>
        <p className="mt-0.5 text-[13px] text-muted-foreground leading-snug">{desc}</p>
      </div>
    </div>
  );
}

export function AddressVerification() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [building, setBuilding] = useState("");
  const [room, setRoom] = useState("");
  const [address, setAddress] = useState("");
  const [neighbourhood, setNeighbourhood] = useState("");
  const [status, setStatus] = useState<"unverified" | "pending" | "approved" | "rejected">("unverified");
  const [reviewerNote, setReviewerNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSubmittedModal, setShowSubmittedModal] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setUserId(u.user.id);
      const { data: p } = await supabase
        .from("profiles")
        .select("building, room, address, neighbourhood, verification_status")
        .eq("id", u.user.id)
        .maybeSingle();
      if (p) {
        setBuilding(p.building ?? "");
        setRoom(p.room ?? "");
        setAddress(p.address ?? "");
        setNeighbourhood(p.neighbourhood ?? "");
        setStatus((p.verification_status as typeof status) ?? "unverified");
      }
      // Fetch latest request to surface reviewer note when rejected
      const { data: latest } = await supabase
        .from("verification_requests")
        .select("status, reviewer_note")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latest?.status === "rejected") {
        setReviewerNote(latest.reviewer_note ?? null);
      }
      setLoading(false);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || saving) return;
    if (status === "pending") {
      toast.info("Your verification is already under review.");
      setShowSubmittedModal(true);
      return;
    }
    if (status === "approved") {
      toast.success("You're already verified.");
      navigate({ to: "/home" });
      return;
    }
    if (!address.trim() || !neighbourhood.trim()) {
      toast.error("Neighbourhood and address are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        building: building.trim() || null,
        room: room.trim() || null,
        address: address.trim(),
        neighbourhood: neighbourhood.trim(),
      };

      // Update safe profile fields first (address/onboarding). verification_status
      // and verification_submitted_at are managed by a database trigger.
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ ...payload, onboarding_completed: true })
        .eq("id", userId);
      if (profileError) throw profileError;

      const { error: reqError } = await supabase.from("verification_requests").insert({
        user_id: userId,
        status: "pending",
        ...payload,
      });
      if (reqError) {
        if (reqError.code === "23505") {
          toast.info("You already have a verification request under review.");
          setShowSubmittedModal(true);
          return;
        }
        throw reqError;
      }

      setShowSubmittedModal(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit");
    } finally {
      setSaving(false);
    }
  }


  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md px-5 pt-6 pb-8 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/profile-setup"
            aria-label="Go back"
            className="h-10 w-10 -ml-2 flex items-center justify-center rounded-full hover:bg-secondary active:scale-95 transition"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" strokeWidth={2.2} />
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Location Details
          </h1>
        </div>

        <div className="space-y-4">
          <Field
            label="Neighbourhood"
            icon={MapPin}
            placeholder="e.g. Greenview Heights area"
            value={neighbourhood}
            onChange={setNeighbourhood}
            required
          />
          <Field
            label="Building name"
            optional
            icon={Building2}
            placeholder="e.g. Greenview Heights"
            value={building}
            onChange={setBuilding}
          />
          <Field
            label="Room / apartment number"
            optional
            icon={DoorOpen}
            placeholder="e.g. 5B"
            value={room}
            onChange={setRoom}
          />
          <Field
            label="Address"
            icon={MapPin}
            placeholder="Start typing your street address"
            value={address}
            onChange={setAddress}
            required
          />
        </div>

        <section className="mt-6 rounded-3xl bg-card border border-border p-4 divide-y divide-border">
          <InfoRow
            icon={ShieldCheck}
            title="Verify Your Address"
            desc="We'll verify your address to help build trust in the neighbourhood."
          />
          <InfoRow
            icon={Clock}
            title="Verification usually takes up to 24 hours."
            desc="We'll notify you as soon as it's complete."
          />
          <InfoRow
            icon={Lock}
            title="Your information is secure."
            desc="We only share the minimum required information for verification."
          />
          <InfoRow
            icon={Users}
            title="Once verified, you can get started!"
            desc="Enjoy full access to connect and contribute in your neighbourhood."
          />
        </section>

        {status === "pending" && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-primary/10 text-primary px-3.5 py-2.5">
            <Clock className="h-4 w-4 shrink-0" strokeWidth={2} />
            <p className="text-[12.5px] font-medium">
              Your verification request is under review.
            </p>
          </div>
        )}
        {status === "rejected" && (
          <div className="mt-4 rounded-2xl bg-destructive/10 text-destructive px-3.5 py-2.5">
            <p className="text-[12.5px] font-semibold">Your previous request was rejected.</p>
            {reviewerNote && (
              <p className="mt-1 text-[12.5px] leading-snug">Reviewer note: {reviewerNote}</p>
            )}
            <p className="mt-1 text-[12.5px]">Update the details below and resubmit.</p>
          </div>
        )}
        {status === "approved" && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-primary/10 text-primary px-3.5 py-2.5">
            <ShieldCheck className="h-4 w-4 shrink-0" strokeWidth={2} />
            <p className="text-[12.5px] font-medium">You're verified.</p>
          </div>
        )}
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-secondary/60 px-3.5 py-2.5">
          <Info className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={2} />
          <p className="text-[12.5px] text-muted-foreground">
            Building and room are optional but help speed up verification.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving || status === "pending" || status === "approved"}
          className="mt-5 w-full h-13 py-3.5 rounded-2xl bg-foreground text-background font-medium text-[15px] flex items-center justify-center gap-2 active:scale-[0.99] transition shadow-sm disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={2.2} />}
          {status === "pending"
            ? "Verification pending"
            : status === "approved"
              ? "Already verified"
              : status === "rejected"
                ? "Resubmit for verification"
                : "Apply for verification"}
        </button>


        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" strokeWidth={2.2} />
          Secure &amp; private
        </p>
      </form>
    </main>
  );
}
