import { createClient } from "@/lib/supabase/server";
import { DrawStage } from "./draw-stage";

export const metadata = { title: "Cabutan Bertuah" };
export default async function DrawPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: latest }, { data: samples }, { count: eligibleCount }, { count: availableGiftCount }] = await Promise.all([
    supabase.from("draw_results").select("id,status,participants(id,towel_number,name),gifts(id,gift_number)").eq("drawn_by", user!.id).neq("status", "cancelled").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("participants").select("towel_number").eq("status", "eligible").limit(100),
    supabase.from("participants").select("id", { count: "exact", head: true }).eq("status", "eligible"),
    supabase.from("gifts").select("id", { count: "exact", head: true }).eq("status", "available"),
  ]);
  type Joined = { id: string; status: string; participants: { id: string; towel_number: string; name: string } | null; gifts: { id: string; gift_number: string } | null };
  const row = latest as unknown as Joined | null;
  const current = row?.participants ? { id: row.id, towelNumber: row.participants.towel_number, name: row.participants.name, giftNumber: row.gifts?.gift_number } : null;
  const stage = row?.status === "participant_selected" ? "participant-reveal" : row?.status === "winner_confirmed" ? "gift-ready" : row?.status === "completed" ? "complete" : "idle";
  return <DrawStage initial={{ stage, draw: current }} sampleNumbers={(samples ?? []).map((p) => p.towel_number)} eligibleCount={eligibleCount ?? 0} availableGiftCount={availableGiftCount ?? 0} />;
}
