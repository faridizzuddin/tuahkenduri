import type { Gift } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { GiftManager } from "./gift-manager";

export const metadata = { title: "Senarai Hadiah" };
export default async function GiftsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("gifts").select("*").order("gift_number");
  if (error) throw error;
  return <div className="page"><header className="page-header"><div><span className="eyebrow">Pengurusan hadiah</span><h1>Senarai Hadiah</h1><p>Daftar nombor hadiah dan pantau ketersediaannya.</p></div></header><GiftManager gifts={(data ?? []) as Gift[]} /></div>;
}
