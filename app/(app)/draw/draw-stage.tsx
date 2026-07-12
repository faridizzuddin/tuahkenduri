"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Gift, Maximize, Sparkles, UserCheck, UserX } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { confirmWinner, drawGift, drawParticipant, markAbsent } from "./actions";

type Stage = "idle" | "participant-shuffle" | "participant-reveal" | "gift-ready" | "gift-shuffle" | "complete";
interface CurrentDraw { id: string; towelNumber: string; name: string; giftNumber?: string }

function secureVisualPick(values: string[]) {
  if (!values.length) return "—";
  const random = new Uint32Array(1); crypto.getRandomValues(random);
  return values[random[0] % values.length];
}

export function DrawStage({ initial, sampleNumbers, eligibleCount, availableGiftCount }: {
  initial: { stage: Stage; draw: CurrentDraw | null };
  sampleNumbers: string[];
  eligibleCount: number;
  availableGiftCount: number;
}) {
  const [stage, setStage] = useState(initial.stage);
  const [current, setCurrent] = useState<CurrentDraw | null>(initial.draw);
  const [display, setDisplay] = useState("000");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [absentDialog, setAbsentDialog] = useState(false);
  const resultRef = useRef<CurrentDraw | null>(null);

  useEffect(() => {
    if (stage !== "participant-shuffle" && stage !== "gift-shuffle") return;
    const values = stage === "participant-shuffle" ? sampleNumbers : Array.from({ length: 30 }, (_, i) => String(i + 1).padStart(2, "0"));
    const interval = window.setInterval(() => setDisplay(secureVisualPick(values)), 70);
    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      const result = resultRef.current;
      if (result) { setDisplay(stage === "participant-shuffle" ? result.towelNumber : result.giftNumber ?? "—"); setCurrent(result); setStage(stage === "participant-shuffle" ? "participant-reveal" : "complete"); setBusy(false); }
    }, 1800);
    return () => { window.clearInterval(interval); window.clearTimeout(timeout); };
  }, [stage, sampleNumbers]);

  async function pickParticipant() {
    if (busy) return; setBusy(true); setError("");
    const result = await drawParticipant();
    if (!result.ok || !result.data) { setError(result.message); setBusy(false); return; }
    resultRef.current = { id: result.data.draw_result_id, towelNumber: result.data.towel_number, name: result.data.participant_name };
    setStage("participant-shuffle");
  }
  async function confirm() {
    if (!current || busy) return; setBusy(true); setError("");
    const result = await confirmWinner(current.id);
    if (!result.ok) { setError(result.message); setBusy(false); return; }
    setStage("gift-ready"); setBusy(false);
  }
  async function absent() {
    if (!current || busy) return; setBusy(true); setError(""); setAbsentDialog(false);
    const result = await markAbsent(current.id);
    if (!result.ok) { setError(result.message); setBusy(false); return; }
    setCurrent(null); setStage("idle"); setBusy(false);
  }
  async function pickGift() {
    if (!current || busy) return; setBusy(true); setError("");
    const result = await drawGift(current.id);
    if (!result.ok || !result.data) { setError(result.message); setBusy(false); return; }
    resultRef.current = { ...current, giftNumber: result.data.gift_number };
    setStage("gift-shuffle");
  }
  function next() { resultRef.current = null; setCurrent(null); setDisplay("000"); setError(""); setStage("idle"); }
  function fullscreen() { document.documentElement.requestFullscreen?.(); }

  const canStart = eligibleCount > 0 && availableGiftCount > 0;
  return (
    <main className={`draw-screen ${stage === "complete" ? "celebrating" : ""}`}>
      <header className="draw-header"><Link href="/" className="draw-back"><ArrowLeft /> Kembali</Link><div className="draw-brand"><Sparkles /> Cabutan Bertuah <span>Kenduri</span></div><button className="draw-back" onClick={fullscreen}><Maximize /> Skrin Penuh</button></header>
      <section className="draw-center" aria-live="polite">
        {stage === "idle" && <div className="draw-idle"><span className="draw-ornament">✦</span><p className="draw-kicker">Dengan penuh debaran</p><h1>Siapakah yang<br />bertuah?</h1><p>{eligibleCount} peserta layak · {availableGiftCount} hadiah tersedia</p>{!canStart && <div className="draw-error">{eligibleCount === 0 ? "Tiada peserta yang layak untuk cabutan." : "Tiada hadiah tersedia. Tambah atau pulihkan hadiah dahulu."}</div>}<button className="draw-main-button" onClick={pickParticipant} disabled={busy || !canStart}><Sparkles /> {busy ? "SEDANG MEMILIH…" : "CABUT PEMENANG"}</button></div>}
        {stage === "participant-shuffle" && <div className="shuffle-panel"><p>Mencari peserta bertuah…</p><strong>{display}</strong><div className="shuffle-line" /></div>}
        {stage === "participant-reveal" && current && <div className="winner-panel"><p className="draw-kicker">Tahniah!</p><h1>Nombor Tuala</h1><strong className="hero-number">{current.towelNumber}</strong><h2>{current.name}</h2><div className="draw-actions"><button className="draw-secondary danger-outline" onClick={() => setAbsentDialog(true)} disabled={busy}><UserX /> TIDAK HADIR / CABUT SEMULA</button><button className="draw-main-button compact" onClick={confirm} disabled={busy}><UserCheck /> {busy ? "MENGESAHKAN…" : "SAHKAN PEMENANG"}</button></div></div>}
        {stage === "gift-ready" && current && <div className="winner-panel"><p className="draw-kicker">Pemenang disahkan</p><h2 className="confirmed-name">{current.towelNumber} · {current.name}</h2><Gift className="gift-icon" /><h1>Hadiah menanti anda</h1><button className="draw-main-button" onClick={pickGift} disabled={busy}><Gift /> {busy ? "SEDANG MEMILIH…" : "CABUT NOMBOR HADIAH"}</button></div>}
        {stage === "gift-shuffle" && <div className="shuffle-panel"><p>Memilih hadiah…</p><strong>{display}</strong><div className="shuffle-line" /></div>}
        {stage === "complete" && current && <div className="winner-panel complete-panel"><div className="confetti" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <i key={i} />)}</div><p className="draw-kicker">Hadiah Anda</p><h1>Nombor</h1><strong className="hero-number gift-number">{current.giftNumber}</strong><div className="winner-summary"><span><small>Nombor Tuala</small><b>{current.towelNumber}</b></span><span><small>Pemenang</small><b>{current.name}</b></span><span><small>Hadiah</small><b>{current.giftNumber}</b></span></div><button className="draw-main-button compact" onClick={next}>CABUTAN SETERUSNYA <Sparkles /></button></div>}
        {error && <div className="draw-error" role="alert">{error}</div>}
      </section>
      <ConfirmDialog open={absentDialog} title="Peserta tidak hadir?" description={current ? `${current.towelNumber} — ${current.name} akan ditandakan tidak hadir dan dikecualikan daripada cabutan seterusnya. Tiada hadiah akan diberikan.` : ""} confirmLabel="Ya, Tandakan Tidak Hadir" onClose={() => setAbsentDialog(false)} onConfirm={absent} />
    </main>
  );
}
