import type { Participant } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { ParticipantManager } from "./participant-manager";

export const metadata = { title: "Senarai Peserta" };
export default async function ParticipantsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("participants").select("*").order("towel_number");
  if (error) throw error;
  return <div className="page"><header className="page-header"><div><span className="eyebrow">Pengurusan peserta</span><h1>Senarai Peserta</h1><p>Daftar dan tentukan kelayakan peserta cabutan.</p></div></header><ParticipantManager participants={(data ?? []) as Participant[]} /></div>;
}
