import { z } from "zod";

export const participantSchema = z.object({
  towel_number: z.string().trim().min(1, "Nombor tuala diperlukan").max(40),
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
