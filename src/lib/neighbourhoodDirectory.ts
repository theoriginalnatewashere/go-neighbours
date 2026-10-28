// Public neighbourhood directory shown on the landing page.
// Only country, city and neighbourhood name ever leave the backend.

export interface DirectoryEntry {
  country: string;
  city: string;
  name: string;
}

export interface DirectoryCity {
  city: string;
  neighbourhoods: string[];
}

export interface DirectoryCountry {
  country: string;
  cities: DirectoryCity[];
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Keeps only the public fields and drops incomplete rows. */
export function toDirectoryEntries(rows: unknown): DirectoryEntry[] {
  if (!Array.isArray(rows)) return [];
  const entries: DirectoryEntry[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const record = row as Record<string, unknown>;
    const country = cleanText(record.country);
    const city = cleanText(record.city);
    const name = cleanText(record.name);
    if (!country || !city || !name) continue;
    entries.push({ country, city, name });
  }
  return entries;
}

const byText = (a: string, b: string) => a.localeCompare(b, "en", { sensitivity: "base" });

/** Groups entries as Country > City > Neighbourhood, alphabetically. */
export function groupDirectory(entries: DirectoryEntry[]): DirectoryCountry[] {
  const countries = new Map<string, Map<string, Set<string>>>();
  for (const { country, city, name } of entries) {
    const cities = countries.get(country) ?? new Map<string, Set<string>>();
    const names = cities.get(city) ?? new Set<string>();
    names.add(name);
    cities.set(city, names);
    countries.set(country, cities);
  }
  return [...countries.entries()]
    .sort(([a], [b]) => byText(a, b))
    .map(([country, cities]) => ({
      country,
      cities: [...cities.entries()]
        .sort(([a], [b]) => byText(a, b))
        .map(([city, names]) => ({ city, neighbourhoods: [...names].sort(byText) })),
    }));
}

/** Applies the visitor's country and city filters ("" means all). */
export function filterDirectory(
  entries: DirectoryEntry[],
  country: string,
  city: string,
): DirectoryEntry[] {
  return entries.filter(
    (entry) => (!country || entry.country === country) && (!city || entry.city === city),
  );
}
