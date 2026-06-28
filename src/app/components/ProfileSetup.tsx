import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Camera, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const skills = [
  "Cooking",
  "Moving Help",
  "Tech Support",
  "Plant Care",
  "Repair",
  "Tutoring",
  "Pet Care",
  "Errands",
];
const tenures = ["New here", "0-6 months", "1-3 years", "3+ years"];
const interests = [
  "Local events",
  "Community clean-up",
  "Learning & tutoring",
  "Bike help",
  "Brunch",
  "Book swap",
];

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition " +
        (active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-foreground hover:bg-secondary")
      }
    >
      {label}
    </button>
  );
}

export function ProfileSetup() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [alreadyOnboarded, setAlreadyOnboarded] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [tenure, setTenure] = useState(tenures[1]);
  const [tags, setTags] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setUserId(u.user.id);
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.user.id)
        .maybeSingle();
      if (p) {
        setAvatarUrl(p.avatar_url ?? null);
        setFullName(p.full_name ?? "");
        setDisplayName(p.display_name ?? "");
        setBio(p.bio ?? "");
        setTenure(p.tenure ?? tenures[1]);
        setPicked(new Set(p.skills ?? []));
        setTags(new Set(p.interests ?? []));
        setAlreadyOnboarded(!!p.onboarding_completed);
      }
      setLoading(false);
    })();
  }, []);

  const toggle = (set: Set<string>, val: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    setter(next);
  };

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      setAvatarUrl(signed?.signedUrl ?? path);
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || saving) return;
    if (!fullName.trim() || !displayName.trim()) {
      toast.error("Please enter your full name and display name.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          display_name: displayName.trim(),
          bio: bio.trim() || null,
          avatar_url: avatarUrl,
          tenure,
          skills: Array.from(picked),
          interests: Array.from(tags),
        })
        .eq("id", userId);
      if (error) throw error;
      toast.success("Profile saved");
      navigate({ to: alreadyOnboarded ? "/profile" : "/verify-address" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile");
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
      <form onSubmit={handleSave} className="w-full max-w-md px-5 pt-6 pb-8 flex flex-col">
        <div className="flex items-center gap-3 mb-5">
          <button
            type="button"
            onClick={() => navigate({ to: alreadyOnboarded ? "/profile" : "/location/cluster" })}
            aria-label="Go back"
            className="h-10 w-10 -ml-2 flex items-center justify-center rounded-full hover:bg-secondary active:scale-95 transition"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" strokeWidth={2.2} />
          </button>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {alreadyOnboarded ? "Edit profile" : "Profile Setup"}
          </h1>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-3 mb-5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative h-16 w-16 rounded-full bg-secondary overflow-hidden flex items-center justify-center"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <Camera className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : "+"}
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhoto}
          />
          <div>
            <p className="text-[14px] font-semibold text-foreground">Profile photo</p>
            <p className="text-[12.5px] text-muted-foreground">Tap to add</p>
          </div>
        </div>

        {/* Full name */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">Full name</label>
          <div className="flex items-center rounded-2xl border border-border bg-card px-3.5 h-12 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
            <input
              type="text"
              required
              maxLength={80}
              placeholder="e.g. Sam Rivera"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="flex-1 bg-transparent outline-none text-[15px] text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Display name */}
        <div className="mt-4 space-y-1.5">
          <label className="text-sm font-semibold text-foreground">Display name</label>
          <div className="flex items-center rounded-2xl border border-border bg-card px-3.5 h-12 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
            <input
              type="text"
              required
              maxLength={40}
              placeholder="What neighbours will see"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 bg-transparent outline-none text-[15px] text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Bio */}
        <div className="mt-4 space-y-1.5">
          <label className="text-sm font-semibold text-foreground">About me</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={280}
            placeholder="A short, friendly intro for neighbours"
            rows={3}
            className="w-full rounded-2xl border border-border bg-card px-3.5 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-none"
          />
        </div>

        {/* Skills */}
        <div className="mt-5">
          <p className="text-sm font-semibold text-foreground">
            Skills I bring to the neighbourhood
          </p>
          <p className="text-[12.5px] text-muted-foreground">
            Select what you're comfortable helping with.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.map((s) => (
              <Chip
                key={s}
                label={s}
                active={picked.has(s)}
                onClick={() => toggle(picked, s, setPicked)}
              />
            ))}
          </div>
        </div>

        {/* Tenure */}
        <div className="mt-5">
          <p className="text-sm font-semibold text-foreground">
            How long have you been in the neighbourhood?
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {tenures.map((t) => (
              <Chip key={t} label={t} active={tenure === t} onClick={() => setTenure(t)} />
            ))}
          </div>
        </div>

        {/* Interest tags */}
        <div className="mt-5">
          <p className="text-sm font-semibold text-foreground">Interest tags</p>
          <p className="text-[12.5px] text-muted-foreground">
            Optional — helps others find you.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {interests.map((t) => (
              <Chip key={t} label={t} active={tags.has(t)} onClick={() => toggle(tags, t, setTags)} />
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-7 w-full h-13 py-3.5 rounded-2xl bg-foreground text-background font-medium text-[15px] flex items-center justify-center gap-2 active:scale-[0.99] transition shadow-sm disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={2.2} />
          )}
          {alreadyOnboarded ? "Save changes" : "Continue to verification"}
        </button>
        <p className="mt-3 text-center text-[12px] text-muted-foreground">
          We'll confirm your neighbourhood so you can connect locally.
        </p>
      </form>
    </main>
  );
}
