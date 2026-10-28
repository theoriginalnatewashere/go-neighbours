import { describe, expect, it } from "vitest";
import { redirectToAppPath } from "./legacyRedirect";

function target(href: string): unknown {
  try {
    redirectToAppPath({ location: { href } });
  } catch (e) {
    return (e as { options?: { href?: string } }).options?.href;
  }
  return undefined;
}

describe("old addresses move under /app", () => {
  it("keeps the path", () => expect(target("/request/abc")).toBe("/app/request/abc"));
  it("keeps search params", () => expect(target("/chat/u1?post=p1")).toBe("/app/chat/u1?post=p1"));
  it("keeps the sign-in return address", () =>
    expect(target("/auth?next=%2F.lovable%2Foauth%2Fconsent")).toBe("/app/auth?next=%2F.lovable%2Foauth%2Fconsent"));
});
