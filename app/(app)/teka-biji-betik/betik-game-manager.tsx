"use client";

import { FormEvent, useMemo, useRef, useState, useTransition } from "react";
import { CircleHelp, Hash, LockKeyhole, Medal, Pencil, Plus, RotateCcw, Search, Sprout, Trash2, Trophy } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { BetikGame, BetikGuess, RankedBetikGuess } from "@/lib/types";
import { cleanSpaces, rankBetikGuesses } from "@/lib/validation";
import { addBetikGuess, deleteBetikGuess, reopenBetikGame, revealBetikAnswer, updateBetikGuess } from "./actions";

type Notice = { kind: "success" | "error" | "info"; text: string };

function formatNumber(value: number) {
  return value.toLocaleString("ms-MY");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ms-MY", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function guessFromForm(form: HTMLFormElement) {
  const data = new FormData(form);
  return {
    participant_name: cleanSpaces(String(data.get("participant_name"))),
    entry_reference: cleanSpaces(String(data.get("entry_reference"))),
    guessed_count: Number(data.get("guessed_count")),
  };
}

export function BetikGameManager({ game, guesses }: { game: BetikGame; guesses: BetikGuess[] }) {
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<Notice | null>(null);
  const [editing, setEditing] = useState<BetikGuess | null>(null);
  const [deleting, setDeleting] = useState<BetikGuess | null>(null);
  const [pendingAnswer, setPendingAnswer] = useState<number | null>(null);
  const [confirmReopen, setConfirmReopen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const isRevealed = game.actual_seed_count !== null;

  const ranked = useMemo(
    () => game.actual_seed_count === null ? [] : rankBetikGuesses(guesses, game.actual_seed_count) as RankedBetikGuess[],
    [game.actual_seed_count, guesses],
  );
  const winners = ranked.filter((entry) => entry.rank === 1);
  const orderedEntries: Array<BetikGuess | RankedBetikGuess> = isRevealed ? ranked : guesses;
  const filtered = orderedEntries.filter((entry) =>
    `${entry.participant_name} ${entry.entry_reference ?? ""} ${entry.guessed_count}`.toLowerCase().includes(query.toLowerCase()),
  );
  const lowest = guesses.length ? Math.min(...guesses.map((entry) => entry.guessed_count)) : null;
  const highest = guesses.length ? Math.max(...guesses.map((entry) => entry.guessed_count)) : null;

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = guessFromForm(form);
    startTransition(async () => {
      const result = await addBetikGuess(input);
      setMessage({ kind: result.ok ? "success" : "error", text: result.message });
      if (result.ok) {
        form.reset();
        nameRef.current?.focus();
      }
    });
  }

  function requestReveal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const count = Number(new FormData(event.currentTarget).get("actual_seed_count"));
    if (!Number.isSafeInteger(count) || count < 1 || count > 1000000) {
      setMessage({ kind: "error", text: "Jumlah sebenar mestilah nombor bulat antara 1 hingga 1,000,000." });
      return;
    }
    setPendingAnswer(count);
  }

  function confirmReveal() {
    if (pendingAnswer === null) return;
    const answer = pendingAnswer;
    setPendingAnswer(null);
    startTransition(async () => {
      const result = await revealBetikAnswer(answer);
      setMessage({ kind: result.ok ? "success" : "error", text: result.message });
    });
  }

  return (
    <>
      <section className={`betik-hero ${isRevealed ? "revealed" : ""}`}>
        <div className="betik-fruit" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
        <div className="betik-hero-copy">
          <span className="betik-state"><span /> {isRevealed ? "Keputusan diumumkan" : "Penyertaan dibuka"}</span>
          <h2>{isRevealed ? "Inilah jawapannya!" : "Berapa biji agaknya?"}</h2>
          <p>{isRevealed ? "Semua tekaan dikunci dan disusun mengikut beza paling kecil." : "Tambah setiap tekaan tetamu. Jawapan kekal rahsia sehingga permainan ditutup."}</p>
        </div>
        <div className="betik-answer-card">
          {isRevealed ? (
            <>
              <small>Jumlah sebenar</small>
              <strong>{formatNumber(game.actual_seed_count!)}</strong>
              <span>biji betik</span>
              <button className="button secondary small" disabled={pending} onClick={() => setConfirmReopen(true)}><RotateCcw /> Buka Semula</button>
            </>
          ) : (
            <form onSubmit={requestReveal}>
              <label htmlFor="actual_seed_count">Jumlah sebenar</label>
              <div className="secret-answer"><LockKeyhole /><span>Rahsia</span></div>
              <input className="input" id="actual_seed_count" name="actual_seed_count" type="number" inputMode="numeric" min="1" max="1000000" required placeholder="Masukkan jawapan" />
              <button className="button gold" disabled={pending || guesses.length === 0}><Trophy /> Tutup & Kira</button>
            </form>
          )}
        </div>
      </section>

      <section className="betik-stats" aria-label="Ringkasan permainan">
        <div><CircleHelp /><span>Penyertaan<strong>{formatNumber(guesses.length)}</strong></span></div>
        <div><Hash /><span>Tekaan Terendah<strong>{lowest === null ? "—" : formatNumber(lowest)}</strong></span></div>
        <div><Sprout /><span>Tekaan Tertinggi<strong>{highest === null ? "—" : formatNumber(highest)}</strong></span></div>
      </section>

      {isRevealed && winners.length > 0 && (
        <section className="winner-board" aria-labelledby="winner-title">
          <div className="winner-board-heading"><Medal /><div><span className="eyebrow">Paling hampir</span><h2 id="winner-title">{winners.length > 1 ? `${winners.length} Pemenang Seri` : "Pemenang Teka Biji Betik"}</h2></div></div>
          <div className="winner-cards">
            {winners.map((winner) => (
              <article key={winner.id}>
                <Trophy />
                <div><strong>{winner.participant_name}</strong><span>{winner.entry_reference || "Tiada rujukan"}</span></div>
                <div className="winner-guess"><small>Tekaan</small><b>{formatNumber(winner.guessed_count)}</b></div>
                <span className={winner.difference === 0 ? "exact" : "closest"}>{winner.difference === 0 ? "Tepat!" : `Beza ${formatNumber(winner.difference)}`}</span>
              </article>
            ))}
          </div>
        </section>
      )}

      {!isRevealed && (
        <section className="card card-pad betik-entry-card">
          <div className="section-title"><div><h2>Daftar Tekaan</h2><p>Rujukan boleh diisi dengan nombor tuala, meja, atau cara mudah mengenali tetamu.</p></div></div>
          <form ref={formRef} className="betik-entry-form" onSubmit={add}>
            <div className="field"><label htmlFor="participant_name">Nama Peserta</label><input ref={nameRef} className="input" id="participant_name" name="participant_name" maxLength={120} required autoFocus placeholder="Nama tetamu" /></div>
            <div className="field"><label htmlFor="entry_reference">Rujukan <span>(pilihan)</span></label><input className="input" id="entry_reference" name="entry_reference" maxLength={60} placeholder="cth. Tuala 028 / Meja 6" /></div>
            <div className="field"><label htmlFor="guessed_count">Bilangan Tekaan</label><input className="input" id="guessed_count" name="guessed_count" type="number" inputMode="numeric" min="1" max="1000000" required placeholder="cth. 438" /></div>
            <button className="button primary" disabled={pending}><Plus /> {pending ? "Menyimpan…" : "Tambah Tekaan"}</button>
          </form>
        </section>
      )}

      {message && <div className={`notice ${message.kind}`} role="status">{message.text}</div>}

      <div className="toolbar">
        <div className="search-wrap"><Search /><input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama, rujukan, atau tekaan…" aria-label="Cari penyertaan" /></div>
        <span className="eyebrow">{isRevealed ? "Kedudukan akhir" : `${guesses.length} tekaan`}</span>
      </div>

      <section className="table-wrap betik-table">
        {filtered.length ? (
          <table>
            <thead><tr>{isRevealed && <th>Kedudukan</th>}<th>Nama Peserta</th><th>Rujukan</th><th>Tekaan</th>{isRevealed ? <><th>Beza</th><th>Keputusan</th></> : <><th>Direkodkan</th><th className="text-right">Tindakan</th></>}</tr></thead>
            <tbody>
              {filtered.map((entry) => {
                const result = isRevealed ? entry as RankedBetikGuess : null;
                return <tr key={entry.id} className={result?.rank === 1 ? "winning-row" : ""}>
                  {result && <td className="rank-cell" data-label="Kedudukan">#{result.rank}</td>}
                  <td data-label="Nama Peserta"><strong>{entry.participant_name}</strong></td>
                  <td data-label="Rujukan">{entry.entry_reference || "—"}</td>
                  <td className="number-cell betik-count" data-label="Tekaan">{formatNumber(entry.guessed_count)}</td>
                  {result ? <><td data-label="Beza">{formatNumber(result.difference)}</td><td data-label="Keputusan"><span className={`result-pill ${result.difference === 0 ? "exact" : result.rank === 1 ? "closest" : ""}`}>{result.difference === 0 ? "Tepat" : result.rank === 1 ? "Paling hampir" : `Tempat #${result.rank}`}</span></td></> : <><td data-label="Direkodkan">{formatDate(entry.created_at)}</td><td className="table-actions-cell" data-label="Tindakan"><div className="actions"><button className="icon-button" onClick={() => setEditing(entry)} aria-label={`Edit tekaan ${entry.participant_name}`}><Pencil /></button><button className="icon-button" onClick={() => setDeleting(entry)} aria-label={`Padam tekaan ${entry.participant_name}`}><Trash2 /></button></div></td></>}
                </tr>;
              })}
            </tbody>
          </table>
        ) : <div className="empty-state"><Sprout /><h3>{guesses.length ? "Tiada penyertaan ditemui" : "Belum ada tekaan"}</h3><p>{guesses.length ? "Cuba kata carian yang lain." : "Daftar tekaan pertama untuk memulakan permainan."}</p></div>}
      </section>

      {editing && <div className="dialog-backdrop" role="presentation"><form className="dialog" onSubmit={(event) => { event.preventDefault(); const input = guessFromForm(event.currentTarget); startTransition(async () => { const result = await updateBetikGuess(editing.id, input); setMessage({ kind: result.ok ? "success" : "error", text: result.message }); if (result.ok) setEditing(null); }); }}><span className="eyebrow">Betulkan penyertaan</span><h2>Edit Tekaan</h2><div className="field"><label htmlFor="edit-betik-name">Nama Peserta</label><input className="input" id="edit-betik-name" name="participant_name" defaultValue={editing.participant_name} maxLength={120} required autoFocus /></div><div className="field mt-3.5"><label htmlFor="edit-betik-reference">Rujukan</label><input className="input" id="edit-betik-reference" name="entry_reference" defaultValue={editing.entry_reference ?? ""} maxLength={60} /></div><div className="field mt-3.5"><label htmlFor="edit-betik-count">Bilangan Tekaan</label><input className="input" id="edit-betik-count" name="guessed_count" type="number" inputMode="numeric" min="1" max="1000000" defaultValue={editing.guessed_count} required /></div><div className="dialog-actions"><button type="button" className="button secondary" onClick={() => setEditing(null)}>Batal</button><button className="button primary" disabled={pending}>Simpan</button></div></form></div>}

      <ConfirmDialog open={pendingAnswer !== null} title="Umumkan jawapan sekarang?" description={pendingAnswer === null ? "" : <>Jumlah sebenar ialah <strong>{formatNumber(pendingAnswer)} biji</strong>. Penyertaan akan ditutup dan semua rekod dikunci sementara keputusan dipaparkan.</>} confirmLabel="Ya, Kira Keputusan" danger={false} onClose={() => setPendingAnswer(null)} onConfirm={confirmReveal} />
      <ConfirmDialog open={confirmReopen} title="Buka semula penyertaan?" description="Keputusan akan disembunyikan supaya rekod boleh ditambah atau dibetulkan. Semua tekaan sedia ada akan dikekalkan." confirmLabel="Buka Semula" danger={false} onClose={() => setConfirmReopen(false)} onConfirm={() => { setConfirmReopen(false); startTransition(async () => { const result = await reopenBetikGame(); setMessage({ kind: result.ok ? "info" : "error", text: result.message }); }); }} />
      <ConfirmDialog open={!!deleting} title="Padam penyertaan?" description={deleting ? <>Tekaan <strong>{formatNumber(deleting.guessed_count)}</strong> oleh <strong>{deleting.participant_name}</strong> akan dipadam.</> : ""} confirmLabel="Padam Tekaan" onClose={() => setDeleting(null)} onConfirm={() => deleting && startTransition(async () => { const result = await deleteBetikGuess(deleting.id); setMessage({ kind: result.ok ? "success" : "error", text: result.message }); setDeleting(null); })} />
    </>
  );
}
