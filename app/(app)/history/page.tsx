import { createClient } from "@/lib/supabase/server";
import { HistoryTable, type HistoryRow } from "./history-table";

export const metadata = { title: "Sejarah Cabutan" };
export default async function HistoryPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("draw_results").select("id,sequence_number,status,participant_drawn_at,completed_at,participants(towel_number,name),gifts(gift_number)").order("sequence_number", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []).map((row) => ({ ...row, participant: row.participants, gift: row.gifts })) as unknown as HistoryRow[];
  return <div className="page"><header className="page-header"><div><span className="eyebrow">Rekod keputusan</span><h1>Sejarah Cabutan</h1><p>Semak dan eksport keputusan yang telah disimpan.</p></div></header><HistoryTable rows={rows} /></div>;
}
