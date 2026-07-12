import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
const layout = readFileSync(join(process.cwd(), "app/layout.tsx"), "utf8");
const participants = readFileSync(join(process.cwd(), "app/(app)/participants/participant-manager.tsx"), "utf8");
const gifts = readFileSync(join(process.cwd(), "app/(app)/gifts/gift-manager.tsx"), "utf8");
const history = readFileSync(join(process.cwd(), "app/(app)/history/history-table.tsx"), "utf8");

describe("responsive UI contract", () => {
  it("loads the wedding display and readable interface fonts through next/font", () => {
    expect(layout).toContain("Plus_Jakarta_Sans");
    expect(layout).toContain("Playfair_Display");
    expect(css).toContain("--font-sans: var(--font-jakarta)");
    expect(css).toContain("--font-display: var(--font-playfair)");
  });

  it("includes tablet drawer, portrait-card, and landscape-height breakpoints", () => {
    expect(css).toContain("@media (max-width: 1100px)");
    expect(css).toContain("@media (max-width: 900px)");
    expect(css).toContain("@media (max-height: 820px) and (orientation: landscape)");
  });

  it("uses dynamic viewport units and touch-sized controls", () => {
    expect(css).toContain("min-h-dvh");
    expect(css).toMatch(/\.icon-button\s*\{[\s\S]*?size-11/);
    expect(css).toMatch(/\.input,[\s\S]*?min-h-12/);
  });

  it("provides labels for portrait card rows", () => {
    for (const source of [participants, gifts, history]) {
      expect(source).toContain("data-label=");
    }
  });

  it("requests a numeric keypad for towel-number entry", () => {
    expect(participants).toContain('inputMode="numeric"');
    expect(participants).toContain('pattern="[0-9]*"');
    expect(participants).toContain("keepOnlyDigits");
  });

  it("asks the host to verify a participant before saving", () => {
    expect(participants).toContain('title="Sahkan maklumat peserta"');
    expect(participants).toContain("confirmingAddition.towel_number");
    expect(participants).toContain("confirmingAddition.name");
    expect(participants).toContain("<strong>{confirmingAddition.towel_number}</strong>");
    expect(participants).toContain("<strong>{confirmingAddition.name}</strong>");
    expect(participants).toContain('confirmLabel="Ya, Tambah Peserta"');
  });
});
