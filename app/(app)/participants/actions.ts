"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { cleanSpaces, normalizeTowelNumber, participantSchema } from "@/lib/validation";
import { friendlyError } from "@/lib/error";
import type { ActionResult, ParticipantStatus } from "@/lib/types";

export async function addParticipant(input: { towel_number: string; name: string }): Promise<ActionResult> {
  const parsed = participantSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Maklumat tidak sah" };
  const supabase = await createClient();
  const { error } = await supabase.from("participants").insert({ towel_number: parsed.data.towel_number, name: cleanSpaces(parsed.data.name) });
  if (error) return { ok: false, message: friendlyError(error) };
  revalidatePath("/participants"); revalidatePath("/");
  return { ok: true, message: "Peserta berjaya didaftarkan." };
}

export async function updateParticipant(id: string, input: { towel_number: string; name: string }): Promise<ActionResult> {
  const parsed = participantSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Maklumat tidak sah" };
  const supabase = await createClient();
  const { error } = await supabase.from("participants").update({ towel_number: parsed.data.towel_number, name: cleanSpaces(parsed.data.name) }).eq("id", id);
  if (error) return { ok: false, message: friendlyError(error) };
  revalidatePath("/participants"); revalidatePath("/history");
  return { ok: true, message: "Maklumat peserta dikemas kini." };
}

export async function setParticipantStatus(id: string, status: ParticipantStatus): Promise<ActionResult> {
  if (!(["eligible", "absent", "disabled"] as const).includes(status as "eligible" | "absent" | "disabled")) return { ok: false, message: "Status tidak dibenarkan." };
  const supabase = await createClient();
  const { data: participant } = await supabase.from("participants").select("status").eq("id", id).single();
  if (participant?.status === "won") return { ok: false, message: "Pemenang tidak boleh ditukar melalui senarai peserta." };
  const { error } = await supabase.from("participants").update({ status }).eq("id", id);
  if (error) return { ok: false, message: friendlyError(error) };
  revalidatePath("/participants"); revalidatePath("/"); revalidatePath("/draw");
  return { ok: true, message: "Status peserta dikemas kini." };
}

export async function deleteParticipant(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("participants").delete().eq("id", id);
  if (error) return { ok: false, message: error.code === "23503" ? "Peserta ini mempunyai sejarah cabutan dan tidak boleh dipadam." : friendlyError(error) };
  revalidatePath("/participants"); revalidatePath("/");
  return { ok: true, message: "Peserta telah dipadam." };
}

export async function importParticipants(rows: Array<{ towel_number: string; name: string }>): Promise<ActionResult<{ created: string[]; skipped: string[]; invalid: string[] }>> {
  if (rows.length > 2000) return { ok: false, message: "Import dihadkan kepada 2,000 rekod sekali gus." };
  const invalid: string[] = [];
  const seen = new Set<string>();
  const clean: Array<{ towel_number: string; name: string }> = [];
  rows.forEach((row, i) => {
    const parsed = participantSchema.safeParse(row);
    const rawNumber = cleanSpaces(row.towel_number ?? "");
    const number = parsed.success ? parsed.data.towel_number : normalizeTowelNumber(rawNumber);
    if (!parsed.success || seen.has(number)) { invalid.push(`Baris ${i + 2}: ${rawNumber || "tanpa nombor"}`); return; }
    seen.add(number); clean.push({ towel_number: number, name: cleanSpaces(parsed.data.name) });
  });
  const supabase = await createClient();
  const { data: existing, error: readError } = await supabase.from("participants").select("towel_number").in("towel_number", clean.map((r) => r.towel_number));
  if (readError) return { ok: false, message: friendlyError(readError) };
  const existingSet = new Set((existing ?? []).map((r) => r.towel_number));
  const insertable = clean.filter((r) => !existingSet.has(r.towel_number));
  const skipped = clean.filter((r) => existingSet.has(r.towel_number)).map((r) => r.towel_number);
  if (insertable.length) {
    const { error } = await supabase.from("participants").insert(insertable);
    if (error) return { ok: false, message: friendlyError(error) };
  }
  revalidatePath("/participants"); revalidatePath("/");
  return { ok: true, message: `${insertable.length} peserta diimport.`, data: { created: insertable.map((r) => r.towel_number), skipped, invalid } };
}
