"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/error";
import type { ActionResult } from "@/lib/types";

const functions = { reset: "reset_draw_data", participants: "clear_participants", gifts: "clear_gifts" } as const;
export async function runReset(kind: keyof typeof functions, confirmation: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc(functions[kind], { p_confirmation: confirmation });
  if (error) return { ok: false, message: friendlyError(error) };
  revalidatePath("/", "layout");
  return { ok: true, message: kind === "reset" ? "Semua keputusan cabutan telah diset semula." : kind === "participants" ? "Semua peserta dan sejarah cabutan telah dipadam." : "Semua hadiah dan sejarah cabutan telah dipadam." };
}
