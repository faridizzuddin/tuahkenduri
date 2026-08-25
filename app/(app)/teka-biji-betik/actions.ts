"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/error";
import { betikAnswerSchema, betikGuessSchema, cleanSpaces } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

type GuessInput = {
  participant_name: string;
  entry_reference: string;
  guessed_count: number;
};

type ParsedGuess =
  | { ok: false; error: string }
  | { ok: true; data: { participant_name: string; entry_reference: string | null; guessed_count: number } };

function parseGuess(input: GuessInput): ParsedGuess {
  const parsed = betikGuessSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Maklumat tekaan tidak sah" };
  return {
    ok: true,
    data: {
      participant_name: cleanSpaces(parsed.data.participant_name),
      entry_reference: cleanSpaces(parsed.data.entry_reference) || null,
      guessed_count: parsed.data.guessed_count,
    },
  };
}

export async function addBetikGuess(input: GuessInput): Promise<ActionResult> {
  const parsed = parseGuess(input);
  if (!parsed.ok) return { ok: false, message: parsed.error };
  const supabase = await createClient();
  const { error } = await supabase.from("betik_guesses").insert(parsed.data);
  if (error) return { ok: false, message: friendlyError(error) };
  revalidatePath("/teka-biji-betik");
  return { ok: true, message: `Tekaan ${parsed.data.guessed_count.toLocaleString("ms-MY")} berjaya direkodkan.` };
}

export async function updateBetikGuess(id: string, input: GuessInput): Promise<ActionResult> {
  const parsed = parseGuess(input);
  if (!parsed.ok) return { ok: false, message: parsed.error };
  const supabase = await createClient();
  const { error } = await supabase.from("betik_guesses").update(parsed.data).eq("id", id);
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
