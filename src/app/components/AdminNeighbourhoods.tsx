import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

type DirectoryRow = {
  neighbourhood_key: string;
  display_name: string;
  city: string | null;
  country: string | null;
  is_active: boolean;
};

export function AdminNeighbourhoods() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rows, setRows] = useState<DirectoryRow[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      const admin = (roles ?? []).some((r) => r.role === "admin");
      if (!active) return;
      setIsAdmin(admin);
      if (admin) {
        const { data, error } = await supabase
          .from("neighbourhood_directory")
          .select("neighbourhood_key, display_name, city, country, is_active")
          .order("display_name");
        if (error) toast.error("Could not load neighbourhoods");
        if (active) setRows(data ?? []);
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  function update(key: string, patch: Partial<DirectoryRow>) {
    setRows((prev) => prev.map((r) => (r.neighbourhood_key === key ? { ...r, ...patch } : r)));
  }

  async function save(row: DirectoryRow) {
    const displayName = row.display_name.trim();
    const city = row.city?.trim() || null;
    const country = row.country?.trim() || null;
    if (!displayName) {
      toast.error("Neighbourhood name is required");
      return;
    }
    if (row.is_active && (!city || !country)) {
      toast.error("Add a city and country before making it active");
      return;
    }
    setSavingKey(row.neighbourhood_key);
    const { error } = await supabase
      .from("neighbourhood_directory")
      .update({ display_name: displayName, city, country, is_active: row.is_active })
      .eq("neighbourhood_key", row.neighbourhood_key);
    setSavingKey(null);
    if (error) toast.error("Could not save changes");
    else toast.success(`${displayName} saved`);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-5">
        <div className="text-center">
          <p className="text-base font-medium">Only admins can manage the neighbourhood directory.</p>
          <Link to="/app/home" className="mt-4 inline-block text-sm text-primary underline">
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen justify-center bg-background">
      <div className="w-full max-w-2xl px-5 pb-12 pt-6">
        <div className="mb-2 flex items-center gap-3">
          <Link
            to="/app/profile"
            aria-label="Back"
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">Neighbourhood directory</h1>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">
          Active neighbourhoods with at least one member appear on the public landing page. Only the name, city and
          country are shown.
        </p>

        {rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No neighbourhoods yet.</p>
        ) : (
          <ul className="space-y-4">
            {rows.map((row) => (
              <li key={row.neighbourhood_key} className="space-y-3 rounded-2xl border border-border bg-card p-4">
                <div className="space-y-1">
                  <label htmlFor={`name-${row.neighbourhood_key}`} className="text-xs font-medium text-muted-foreground">
                    Neighbourhood name
                  </label>
                  <Input
                    id={`name-${row.neighbourhood_key}`}
                    value={row.display_name}
                    maxLength={80}
                    onChange={(e) => update(row.neighbourhood_key, { display_name: e.target.value })}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label htmlFor={`city-${row.neighbourhood_key}`} className="text-xs font-medium text-muted-foreground">
                      City
                    </label>
                    <Input
                      id={`city-${row.neighbourhood_key}`}
                      value={row.city ?? ""}
                      maxLength={80}
                      placeholder="e.g. Delft"
                      onChange={(e) => update(row.neighbourhood_key, { city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor={`country-${row.neighbourhood_key}`} className="text-xs font-medium text-muted-foreground">
                      Country
                    </label>
                    <Input
                      id={`country-${row.neighbourhood_key}`}
                      value={row.country ?? ""}
                      maxLength={80}
                      placeholder="e.g. Netherlands"
                      onChange={(e) => update(row.neighbourhood_key, { country: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Switch
                      checked={row.is_active}
                      onCheckedChange={(checked) => update(row.neighbourhood_key, { is_active: checked })}
                    />
                    Show on landing page
                  </label>
                  <Button size="sm" onClick={() => save(row)} disabled={savingKey === row.neighbourhood_key}>
                    {savingKey === row.neighbourhood_key ? "Saving…" : "Save"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
