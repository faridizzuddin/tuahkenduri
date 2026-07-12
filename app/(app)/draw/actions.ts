"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/error";
import type { ActionResult } from "@/lib/types";

export interface ParticipantDrawResult { draw_result_id: string; participant_id: string; towel_number: string; participant_name: string; draw_status: string }
export interface GiftDrawResult { draw_result_id: string; gift_id: string; gift_number: string; draw_status: string; completed_at: string }

export async function drawParticipant(): Promise<ActionResult<ParticipantDrawResult>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("draw_random_participant");
  if (error) return { ok: false, message: friendlyError(error) };
  const result = Array.isArray(data) ? data[0] : data;
  if (!result) return { ok: false, message: "Tiada peserta yang layak." };
  revalidatePath("/draw");
  return { ok: true, message: "Peserta dipilih.", data: result as ParticipantDrawResult };
}

export async function confirmWinner(drawId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("confirm_participant_winner", { p_draw_result_id: drawId });
  if (error) return { ok: false, message: friendlyError(error) };
  revalidatePath("/draw"); revalidatePath("/"); revalidatePath("/participants");
  return { ok: true, message: "Pemenang disahkan." };
}

export async function markAbsent(drawId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_selected_participant_absent", { p_draw_result_id: drawId });
  if (error) return { ok: false, message: friendlyError(error) };
  revalidatePath("/draw"); revalidatePath("/"); revalidatePath("/participants");
  return { ok: true, message: "Peserta ditandakan tidak hadir." };
}

export async function drawGift(drawId: string): Promise<ActionResult<GiftDrawResult>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("draw_random_gift", { p_draw_result_id: drawId });
  if (error) return { ok: false, message: friendlyError(error) };
  const result = Array.isArray(data) ? data[0] : data;
  if (!result) return { ok: false, message: "Tiada hadiah tersedia." };
  revalidatePath("/draw"); revalidatePath("/"); revalidatePath("/gifts"); revalidatePath("/history");
  return { ok: true, message: "Hadiah dipilih.", data: result as GiftDrawResult };
}
