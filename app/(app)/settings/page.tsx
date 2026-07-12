import { ShieldCheck } from "lucide-react";
import { ResetCard } from "./reset-card";

export const metadata = { title: "Tetapan" };
export default function SettingsPage() {
  return <div className="page settings-page"><header className="page-header"><div><span className="eyebrow">Kawalan sistem</span><h1>Tetapan</h1><p>Gunakan tindakan ini dengan berhati-hati.</p></div></header><div className="settings-note"><ShieldCheck /><div><strong>Dilindungi dengan frasa pengesahan</strong><p>Semua tindakan di bawah dijalankan sebagai transaksi pangkalan data. Tindakan yang selesai tidak boleh dibuat asal.</p></div></div><section className="reset-list"><ResetCard kind="reset" title="Set Semula Data Cabutan" description="Padam semua sejarah cabutan, pulihkan pemenang dan peserta tidak hadir kepada layak, serta pulihkan hadiah dituntut kepada tersedia." phrase="SET SEMULA CABUTAN" /><ResetCard kind="participants" title="Padam Semua Peserta" description="Padam semua peserta dan sejarah cabutan. Hadiah yang pernah dituntut akan dipulihkan." phrase="PADAM SEMUA PESERTA" /><ResetCard kind="gifts" title="Padam Semua Hadiah" description="Padam semua hadiah dan sejarah cabutan. Status pemenang akan dipulihkan kepada layak." phrase="PADAM SEMUA HADIAH" /></section></div>;
}
