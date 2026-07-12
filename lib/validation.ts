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

export function escapeCsv(value: string | number | null) {
  const text = value === null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
