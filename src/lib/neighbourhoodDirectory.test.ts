import { describe, expect, it } from "vitest";
import { filterDirectory, groupDirectory, toDirectoryEntries } from "./neighbourhoodDirectory";

describe("public neighbourhood directory", () => {
  it("passes on only country, city and name — never member data or counts", () => {
    const entries = toDirectoryEntries([
      { country: "Netherlands", city: "Delft", name: "Antonia Veerstraat", member_count: 9, address: "x", user_id: "u" },
    ]);
    expect(entries).toEqual([{ country: "Netherlands", city: "Delft", name: "Antonia Veerstraat" }]);
    expect(Object.keys(entries[0]).sort()).toEqual(["city", "country", "name"]);
  });

  it("drops entries missing a country or city", () => {
    expect(toDirectoryEntries([{ country: "", city: "Delft", name: "A" }, { country: "NL", city: null, name: "B" }])).toEqual([]);
  });

  it("groups by country, then city, then neighbourhood", () => {
    const grouped = groupDirectory([
      { country: "Netherlands", city: "Leiden", name: "Lammenschans" },
      { country: "Netherlands", city: "Delft", name: "Antonia Veerstraat" },
      { country: "Belgium", city: "Gent", name: "Muide" },
    ]);
    expect(grouped.map((g) => g.country)).toEqual(["Belgium", "Netherlands"]);
    expect(grouped[1].cities.map((c) => c.city)).toEqual(["Delft", "Leiden"]);
  });

  it("filters by country and city", () => {
    const all = [
      { country: "Netherlands", city: "Delft", name: "A" },
      { country: "Netherlands", city: "Leiden", name: "B" },
      { country: "Belgium", city: "Gent", name: "C" },
    ];
    expect(filterDirectory(all, "Netherlands", "").map((e) => e.name)).toEqual(["A", "B"]);
    expect(filterDirectory(all, "Netherlands", "Leiden").map((e) => e.name)).toEqual(["B"]);
  });
});
