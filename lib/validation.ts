import { z } from "zod";

export function normalizeTowelNumber(value: string, width = 3) {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return trimmed;
  const significantDigits = trimmed.replace(/^0+(?=\d)/, "");
  return significantDigits.padStart(width, "0");
}

export const participantSchema = z.object({
  towel_number: z.string().trim().min(1, "Nombor tuala diperlukan").max(3, "Nombor tuala maksimum 3 digit").regex(/^\d+$/, "Nombor tuala hanya boleh mengandungi angka").transform((value) => normalizeTowelNumber(value)),
  name: z.string().trim().min(1, "Nama peserta diperlukan").max(120),
});

export const giftSchema = z.object({
  gift_number: z.string().trim().min(1, "Nombor hadiah diperlukan").max(40),
});

export const betikGuessSchema = z.object({
  participant_name: z.string().trim().min(1, "Nama peserta diperlukan").max(120, "Nama peserta terlalu panjang"),
  entry_reference: z.string().trim().max(60, "Rujukan maksimum 60 aksara"),
  guessed_count: z.coerce.number().int("Tekaan mestilah nombor bulat").min(1, "Tekaan mestilah sekurang-kurangnya 1").max(1000000, "Tekaan maksimum ialah 1,000,000"),
});

export const betikAnswerSchema = z.coerce.number().int("Jumlah sebenar mestilah nombor bulat").min(1, "Jumlah sebenar mestilah sekurang-kurangnya 1").max(1000000, "Jumlah sebenar maksimum ialah 1,000,000");

export function cleanSpaces(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function generateGiftNumbers(start: number, end: number, padding: number) {
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || end - start > 9999) {
    throw new Error("Julat nombor tidak sah atau terlalu besar");
  }
  if (!Number.isSafeInteger(padding) || padding < 1 || padding > 12) {
    throw new Error("Padding mestilah antara 1 hingga 12");
  }
  return Array.from({ length: end - start + 1 }, (_, index) => String(start + index).padStart(padding, "0"));
}

export function rankBetikGuesses<T extends { id: string; guessed_count: number; created_at: string }>(entries: readonly T[], actualCount: number) {
  const sorted = entries
    .map((entry) => ({ ...entry, difference: Math.abs(entry.guessed_count - actualCount) }))
    .sort((a, b) => a.difference - b.difference || a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));

  let previousDifference: number | null = null;
  let rank = 0;
  return sorted.map((entry, index) => {
    if (entry.difference !== previousDifference) rank = index + 1;
    previousDifference = entry.difference;
    return { ...entry, rank };
  });
}

export function escapeCsv(value: string | number | null) {
  const text = value === null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
