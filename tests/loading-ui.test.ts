import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("loading feedback", () => {
  it("provides root, protected-page, and draw loading boundaries", () => {
    expect(read("app/loading.tsx")).toContain("FullPageLoading");
    expect(read("app/(app)/loading.tsx")).toContain("PageSkeleton");
    expect(read("app/(app)/draw/loading.tsx")).toContain("draw");
  });

  it("announces loading state without relying only on animation", () => {
    const indicator = read("components/loading-indicator.tsx");
    expect(indicator).toContain('role="status"');
    expect(indicator).toContain('aria-busy="true"');
    expect(indicator).toContain("Memuatkan halaman");
  });

  it("shows progress for internal navigation and submission", () => {
    expect(read("components/app-shell.tsx")).toContain("NavigationProgress");
    expect(read("components/submit-button.tsx")).toContain("inline-spinner");
  });

  it("respects the existing reduced-motion rule", () => {
    const css = read("app/globals.css");
    expect(css).toContain("@keyframes route-progress");
    expect(css).toContain("@keyframes skeleton-shimmer");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
