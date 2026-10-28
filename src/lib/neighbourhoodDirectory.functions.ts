import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { queryOptions } from "@tanstack/react-query";
import { toDirectoryEntries, type DirectoryEntry } from "@/lib/neighbourhoodDirectory";

// Public read: anonymous client calling a security-definer function that
// returns only country, city and neighbourhood name.
export const getActiveNeighbourhoods = createServerFn({ method: "GET" }).handler(
  async (): Promise<DirectoryEntry[]> => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return [];
    const client = createClient(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
            headers.delete("Authorization");
          }
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });
    const { data, error } = await client.rpc("get_active_neighbourhoods");
    if (error) throw new Error("Could not load neighbourhoods");
    return toDirectoryEntries(data);
  },
);

export const activeNeighbourhoodsQuery = queryOptions({
  queryKey: ["public", "active-neighbourhoods"],
  queryFn: () => getActiveNeighbourhoods(),
  staleTime: 5 * 60 * 1000,
});
