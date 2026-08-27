"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/error";
import { betikAnswerSchema, betikGuessCountSchema, betikGuessSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

type GuessInput = {
  participant_id: string;
  guessed_count: number;
};

type ParsedGuess =
  | { ok: false; error: string }
  | { ok: true; data: { participant_id: string; guessed_count: number } };

function parseGuess(input: GuessInput): ParsedGuess {
  const parsed = betikGuessSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Maklumat tekaan tidak sah" };
  return {
    ok: true,
    data: {
      participant_id: parsed.data.participant_id,
      guessed_count: parsed.data.guessed_count,
    },
  };
}

export async function addBetikGuess(input: GuessInput): Promise<ActionResult> {
  const parsed = parseGuess(input);
  if (!parsed.ok) return { ok: false, message: parsed.error };
  const supabase = await createClient();
  const { data: participant, error: participantError } = await supabase.from("participants").select("name,status").eq("id", parsed.data.participant_id).single();
  if (participantError || !participant) return { ok: false, message: "Peserta berdaftar tidak ditemui." };
  if (!(participant.status === "eligible" || participant.status === "won")) return { ok: false, message: "Peserta ini tidak layak menyertai permainan." };
  const { error } = await supabase.from("betik_guesses").insert(parsed.data);
  if (error) return { ok: false, message: error.code === "23505" ? "Peserta ini sudah mempunyai tekaan." : friendlyError(error) };
  revalidatePath("/teka-biji-betik");
  return { ok: true, message: `Tekaan ${participant.name} berjaya direkodkan.` };
}

export async function updateBetikGuess(id: string, guessedCount: number): Promise<ActionResult> {
  const parsed = betikGuessCountSchema.safeParse(guessedCount);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Tekaan tidak sah" };
  const supabase = await createClient();
  const { error } = await supabase.from("betik_guesses").update({ guessed_count: parsed.data }).eq("id", id);
  if (error) return { ok: false, message: friendlyError(error) };
  revalidatePath("/teka-biji-betik");
  return { ok: true, message: "Penyertaan berjaya dikemas kini." };
}

export async function deleteBetikGuess(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("betik_guesses").delete().eq("id", id);
  if (error) return { ok: false, message: friendlyError(error) };
  revalidatePath("/teka-biji-betik");
  return { ok: true, message: "Penyertaan telah dipadam." };
}

export async function revealBetikAnswer(actualSeedCount: number): Promise<ActionResult> {
  const parsed = betikAnswerSchema.safeParse(actualSeedCount);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Jumlah sebenar tidak sah" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("reveal_betik_answer", { p_actual_seed_count: parsed.data });
  if (error) return { ok: false, message: friendlyError(error) };
  revalidatePath("/teka-biji-betik");
  return { ok: true, message: "Jawapan diumumkan dan keputusan telah dikira." };
}

export async function reopenBetikGame(): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("reopen_betik_game");
  if (error) return { ok: false, message: friendlyError(error) };
  revalidatePath("/teka-biji-betik");
  return { ok: true, message: "Penyertaan dibuka semula. Semua tekaan lama dikekalkan." };
}
