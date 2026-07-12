"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { giftSchema } from "@/lib/validation";
import { friendlyError } from "@/lib/error";
import type { ActionResult, GiftStatus } from "@/lib/types";

export async function addGift(gift_number: string): Promise<ActionResult> {
  const parsed = giftSchema.safeParse({ gift_number });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Nombor tidak sah" };
  const supabase = await createClient();
  const { error } = await supabase.from("gifts").insert({ gift_number: parsed.data.gift_number.trim() });
  if (error) return { ok: false, message: friendlyError(error) };
  revalidatePath("/gifts"); revalidatePath("/");
  return { ok: true, message: "Hadiah berjaya ditambah." };
}

export async function updateGift(id: string, gift_number: string): Promise<ActionResult> {
  const parsed = giftSchema.safeParse({ gift_number });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Nombor tidak sah" };
  const supabase = await createClient();
  const { error } = await supabase.from("gifts").update({ gift_number: parsed.data.gift_number.trim() }).eq("id", id);
  if (error) return { ok: false, message: friendlyError(error) };
  revalidatePath("/gifts"); revalidatePath("/history");
  return { ok: true, message: "Nombor hadiah dikemas kini." };
}

export async function setGiftStatus(id: string, status: GiftStatus): Promise<ActionResult> {
  if (!(["available", "disabled"] as const).includes(status as "available" | "disabled")) return { ok: false, message: "Status tidak dibenarkan." };
  const supabase = await createClient();
  const { data: gift } = await supabase.from("gifts").select("status").eq("id", id).single();
  if (gift?.status === "claimed") return { ok: false, message: "Hadiah yang dituntut tidak boleh ditukar di sini." };
  const { error } = await supabase.from("gifts").update({ status }).eq("id", id);
  if (error) return { ok: false, message: friendlyError(error) };
  revalidatePath("/gifts"); revalidatePath("/"); revalidatePath("/draw");
  return { ok: true, message: "Status hadiah dikemas kini." };
}

export async function deleteGift(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("gifts").delete().eq("id", id);
  if (error) return { ok: false, message: error.code === "23503" ? "Hadiah ini mempunyai sejarah cabutan dan tidak boleh dipadam." : friendlyError(error) };
  revalidatePath("/gifts"); revalidatePath("/");
  return { ok: true, message: "Hadiah telah dipadam." };
}

export async function createGiftRange(numbers: string[]): Promise<ActionResult<{ created: string[]; skipped: string[] }>> {
  const unique = [...new Set(numbers.map((n) => n.trim()))];
  if (!unique.length || unique.length > 10000 || unique.some((n) => !giftSchema.safeParse({ gift_number: n }).success)) return { ok: false, message: "Senarai hadiah tidak sah." };
  const supabase = await createClient();
  const { data: existing, error: readError } = await supabase.from("gifts").select("gift_number").in("gift_number", unique);
  if (readError) return { ok: false, message: friendlyError(readError) };
  const existingSet = new Set((existing ?? []).map((g) => g.gift_number));
  const created = unique.filter((n) => !existingSet.has(n));
  const skipped = unique.filter((n) => existingSet.has(n));
  if (created.length) {
    const { error } = await supabase.from("gifts").insert(created.map((gift_number) => ({ gift_number })));
    if (error) return { ok: false, message: friendlyError(error) };
  }
  revalidatePath("/gifts"); revalidatePath("/");
  return { ok: true, message: `${created.length} hadiah dicipta.`, data: { created, skipped } };
}
