import { describe, expect, it } from "vitest";
import { cleanSpaces, escapeCsv, generateGiftNumbers, participantSchema } from "../lib/validation";

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

  it("normalises unnecessary spaces", () => {
    expect(cleanSpaces("  Pak   Long Ahmad  ")).toBe("Pak Long Ahmad");
  });
});

describe("CSV output", () => {
  it("quotes commas and doubles embedded quotes", () => {
    expect(escapeCsv('Puan "Minah", Johor')).toBe('"Puan ""Minah"", Johor"');
  });
});
