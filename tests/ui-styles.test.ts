import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
const layout = readFileSync(join(process.cwd(), "app/layout.tsx"), "utf8");
const participants = readFileSync(join(process.cwd(), "app/(app)/participants/participant-manager.tsx"), "utf8");
const gifts = readFileSync(join(process.cwd(), "app/(app)/gifts/gift-manager.tsx"), "utf8");
const history = readFileSync(join(process.cwd(), "app/(app)/history/history-table.tsx"), "utf8");
const betik = readFileSync(join(process.cwd(), "app/(app)/teka-biji-betik/betik-game-manager.tsx"), "utf8");

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
    for (const source of [participants, gifts, history, betik]) {
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

  it("aligns participant inputs on desktop and resets the action offset when stacked", () => {
    expect(css).toMatch(/\.form-row\s*\{[\s\S]*?items-start/);
    expect(css).toContain(".form-row > .button { @apply mt-[27px]; }");
    expect(css).toContain(".form-row > .button { @apply mt-0; }");
  });

  it("provides a responsive game layout and numeric keypads for both counts", () => {
    expect(css).toContain(".betik-hero");
    expect(css).toContain(".betik-entry-form");
    expect(betik.match(/inputMode="numeric"/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("selects registered Betik participants instead of accepting free-text names", () => {
    expect(betik).toContain('list="betik-participant-options"');
    expect(betik).toContain("selectedParticipantId");
    expect(betik).toContain("participant.towel_number");
    expect(betik).not.toContain('name="participant_name"');
  });
});
