import { describe, expect, it } from "vitest";
import { betikAnswerSchema, betikGuessSchema, cleanSpaces, escapeCsv, generateGiftNumbers, normalizeTowelNumber, participantSchema, rankBetikGuesses } from "../lib/validation";

describe("gift range generation", () => {
  it("preserves the requested leading-zero padding", () => {
    expect(generateGiftNumbers(1, 5, 2)).toEqual(["01", "02", "03", "04", "05"]);
  });

  it("rejects reversed and unsafe ranges", () => {
    expect(() => generateGiftNumbers(5, 1, 2)).toThrow();
    expect(() => generateGiftNumbers(1, 10001, 2)).toThrow();
  });
});

describe("participant input", () => {
  it("allows duplicate names at validation level and preserves towel text", () => {
    const first = participantSchema.parse({ towel_number: "001", name: "Puan Aminah" });
    const second = participantSchema.parse({ towel_number: "002", name: "Puan Aminah" });
    expect(first.towel_number).toBe("001");
    expect(second.name).toBe(first.name);
  });

  it("accepts digits with leading zeroes and rejects non-numeric towel values", () => {
    expect(participantSchema.safeParse({ towel_number: "001", name: "Puan Aminah" }).success).toBe(true);
    expect(participantSchema.safeParse({ towel_number: "A01", name: "Puan Aminah" }).success).toBe(false);
    expect(participantSchema.safeParse({ towel_number: "01-2", name: "Puan Aminah" }).success).toBe(false);
  });

  it("normalises towel numbers to a canonical three-digit format", () => {
    expect(normalizeTowelNumber("2")).toBe("002");
    expect(normalizeTowelNumber("02")).toBe("002");
    expect(normalizeTowelNumber("002")).toBe("002");
    expect(normalizeTowelNumber("0002")).toBe("002");
    expect(normalizeTowelNumber("1234")).toBe("1234");
    expect(participantSchema.parse({ towel_number: "2", name: "Puan Aminah" }).towel_number).toBe("002");
    expect(participantSchema.safeParse({ towel_number: "1000", name: "Puan Aminah" }).success).toBe(false);
  });

  it("normalises unnecessary spaces", () => {
    expect(cleanSpaces("  Pak   Long Ahmad  ")).toBe("Pak Long Ahmad");
  });
});

describe("CSV output", () => {
  it("quotes commas and doubles embedded quotes", () => {
    expect(escapeCsv('Puan "Minah", Johor')).toBe('"Puan ""Minah"", Johor"');
  });
});

describe("teka biji betik", () => {
  it("accepts a whole-number guess and optional reference", () => {
    const entry = betikGuessSchema.parse({ participant_name: "Kak Siti", entry_reference: "Meja 6", guessed_count: "438" });
    expect(entry.guessed_count).toBe(438);
    expect(betikGuessSchema.safeParse({ participant_name: "Kak Siti", entry_reference: "", guessed_count: 0 }).success).toBe(false);
    expect(betikAnswerSchema.safeParse(1000001).success).toBe(false);
  });

  it("shares a rank between equally close guesses and skips the following rank", () => {
    const ranked = rankBetikGuesses([
      { id: "a", guessed_count: 490, created_at: "2026-08-25T10:00:00Z" },
      { id: "b", guessed_count: 510, created_at: "2026-08-25T10:01:00Z" },
      { id: "c", guessed_count: 480, created_at: "2026-08-25T10:02:00Z" },
    ], 500);
    expect(ranked.map(({ id, difference, rank }) => ({ id, difference, rank }))).toEqual([
      { id: "a", difference: 10, rank: 1 },
      { id: "b", difference: 10, rank: 1 },
      { id: "c", difference: 20, rank: 3 },
    ]);
  });

  it("puts an exact guess first", () => {
    const ranked = rankBetikGuesses([
      { id: "near", guessed_count: 499, created_at: "2026-08-25T10:00:00Z" },
      { id: "exact", guessed_count: 500, created_at: "2026-08-25T10:01:00Z" },
    ], 500);
    expect(ranked[0]).toMatchObject({ id: "exact", difference: 0, rank: 1 });
  });
});
