import Link from "next/link";
import { AlertTriangle, ArrowRight, Gift, History, Sparkles, Sprout, TicketCheck, UserRoundCheck, UserRoundX, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

async function count(table: "participants" | "gifts" | "draw_results", status?: string) {
  const supabase = await createClient();
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (status) query = query.eq("status", status);
  const { count: result } = await query;
  return result ?? 0;
}

export default async function DashboardPage() {
  const [participants, eligible, won, absent, gifts, available, claimed, completed] = await Promise.all([
    count("participants"), count("participants", "eligible"), count("participants", "won"), count("participants", "absent"),
    count("gifts"), count("gifts", "available"), count("gifts", "claimed"), count("draw_results", "completed"),
  ]);
  const warnings: string[] = [];
  if (!participants) warnings.push("Belum ada peserta didaftarkan.");
  if (!gifts) warnings.push("Belum ada hadiah didaftarkan.");
  if (participants && !eligible) warnings.push("Semua peserta telah menang atau tidak tersedia.");
  if (gifts && !available) warnings.push("Semua hadiah telah dituntut atau tidak tersedia.");
  if (eligible > available) warnings.push(`Hadiah kurang daripada peserta layak (${available} hadiah untuk ${eligible} peserta).`);
  if (available > eligible && eligible > 0) warnings.push(`Hadiah lebih daripada peserta layak (${available} hadiah untuk ${eligible} peserta).`);
  const stats = [
    ["Jumlah Peserta", participants, Users], ["Peserta Layak", eligible, UserRoundCheck], ["Pemenang", won, Sparkles], ["Tidak Hadir", absent, UserRoundX],
    ["Jumlah Hadiah", gifts, Gift], ["Hadiah Tersedia", available, Gift], ["Telah Dituntut", claimed, TicketCheck], ["Cabutan Selesai", completed, History],
  ] as const;
  return <div className="page dashboard"><header className="page-header"><div><span className="eyebrow">Selamat datang, hos</span><h1>Ringkasan Kenduri</h1><p>Semua yang anda perlukan untuk cabutan yang lancar.</p></div><Link className="button primary" href="/draw"><Sparkles /> Mula Cabutan</Link></header>
    {warnings.length > 0 && <section className="warning-strip"><AlertTriangle /><div><strong>Semakan kesediaan</strong>{warnings.map((warning) => <p key={warning}>{warning}</p>)}</div></section>}
    <section className="stats-grid">{stats.map(([label, value, Icon], i) => <article className="stat-card" key={label}><div className={`stat-icon tone-${i % 4}`}><Icon /></div><div><span>{label}</span><strong>{value}</strong></div></article>)}</section>
    <section className="quick-section"><div className="section-title"><div><h2>Tindakan Pantas</h2><p>Pilih bahagian untuk diteruskan.</p></div></div><div className="quick-grid"><Link href="/participants"><Users /><span><b>Urus Peserta</b><small>Daftar dan semak kelayakan</small></span><ArrowRight /></Link><Link href="/gifts"><Gift /><span><b>Urus Hadiah</b><small>Tambah dan jana nombor hadiah</small></span><ArrowRight /></Link><Link href="/teka-biji-betik" className="game"><Sprout /><span><b>Teka Biji Betik</b><small>Rekod tekaan dan cari pemenang</small></span><ArrowRight /></Link><Link href="/draw" className="featured"><Sparkles /><span><b>Mula Cabutan</b><small>Paparan penuh untuk majlis</small></span><ArrowRight /></Link><Link href="/history"><History /><span><b>Sejarah Cabutan</b><small>Lihat dan eksport keputusan</small></span><ArrowRight /></Link></div></section>
  </div>;
}
