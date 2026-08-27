"use client";

import { FormEvent, useMemo, useRef, useState, useTransition } from "react";
import { CircleHelp, Hash, LockKeyhole, Medal, Pencil, Plus, RotateCcw, Search, Sprout, Trash2, Trophy, UserCheck } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { BetikGame, BetikGuess, Participant, RankedBetikGuess } from "@/lib/types";
import { rankBetikGuesses } from "@/lib/validation";
import { addBetikGuess, deleteBetikGuess, reopenBetikGame, revealBetikAnswer, updateBetikGuess } from "./actions";

type Notice = { kind: "success" | "error" | "info"; text: string };
type BetikParticipant = Pick<Participant, "id" | "towel_number" | "name" | "status">;
type DisplayGuess = BetikGuess | RankedBetikGuess;

function formatNumber(value: number) {
  return value.toLocaleString("ms-MY");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ms-MY", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function participantLabel(participant: BetikParticipant) {
  return `${participant.towel_number} — ${participant.name}`;
}

function isQualified(entry: BetikGuess) {
  return entry.participant.status === "eligible" || entry.participant.status === "won";
}

export function BetikGameManager({ game, guesses, participants }: {
  game: BetikGame;
  guesses: BetikGuess[];
  participants: BetikParticipant[];
}) {
  const [query, setQuery] = useState("");
  const [participantInput, setParticipantInput] = useState("");
  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const [message, setMessage] = useState<Notice | null>(null);
  const [editing, setEditing] = useState<BetikGuess | null>(null);
  const [deleting, setDeleting] = useState<BetikGuess | null>(null);
  const [pendingAnswer, setPendingAnswer] = useState<number | null>(null);
  const [confirmReopen, setConfirmReopen] = useState(false);
  const [pending, startTransition] = useTransition();
  const participantInputRef = useRef<HTMLInputElement>(null);
  const isRevealed = game.actual_seed_count !== null;

  const usedParticipantIds = useMemo(() => new Set(guesses.map((entry) => entry.participant_id)), [guesses]);
  const availableParticipants = useMemo(
    () => participants.filter((participant) => !usedParticipantIds.has(participant.id)),
    [participants, usedParticipantIds],
  );
  const selectedParticipant = participants.find((participant) => participant.id === selectedParticipantId) ?? null;
  const qualifiedGuesses = useMemo(() => guesses.filter(isQualified), [guesses]);
  const excludedGuesses = useMemo(() => guesses.filter((entry) => !isQualified(entry)), [guesses]);
  const ranked = useMemo(
    () => game.actual_seed_count === null ? [] : rankBetikGuesses(qualifiedGuesses, game.actual_seed_count) as RankedBetikGuess[],
    [game.actual_seed_count, qualifiedGuesses],
  );
  const winners = ranked.filter((entry) => entry.rank === 1);
  const orderedEntries: DisplayGuess[] = isRevealed ? [...ranked, ...excludedGuesses] : guesses;
  const filtered = orderedEntries.filter((entry) =>
    `${entry.participant.towel_number} ${entry.participant.name} ${entry.guessed_count}`.toLowerCase().includes(query.toLowerCase()),
  );
  const lowest = qualifiedGuesses.length ? Math.min(...qualifiedGuesses.map((entry) => entry.guessed_count)) : null;
  const highest = qualifiedGuesses.length ? Math.max(...qualifiedGuesses.map((entry) => entry.guessed_count)) : null;

  function selectParticipant(value: string) {
    setParticipantInput(value);
    const normalized = value.trim().toLowerCase();
    const participant = availableParticipants.find((candidate) =>
      participantLabel(candidate).toLowerCase() === normalized || candidate.towel_number.toLowerCase() === normalized,
    );
    setSelectedParticipantId(participant?.id ?? "");
  }

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (!selectedParticipantId) {
      setMessage({ kind: "error", text: "Pilih peserta berdaftar daripada senarai cadangan." });
      participantInputRef.current?.focus();
      return;
    }
    startTransition(async () => {
      const result = await addBetikGuess({ participant_id: selectedParticipantId, guessed_count: Number(data.get("guessed_count")) });
      setMessage({ kind: result.ok ? "success" : "error", text: result.message });
      if (result.ok) {
        form.reset();
        setParticipantInput("");
        setSelectedParticipantId("");
        participantInputRef.current?.focus();
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
          <p>{isRevealed ? "Semua tekaan dikunci dan disusun mengikut beza paling kecil." : "Setiap peserta berdaftar mendapat satu tekaan. Jawapan kekal rahsia sehingga permainan ditutup."}</p>
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
              <button className="button gold" disabled={pending || qualifiedGuesses.length === 0}><Trophy /> Tutup & Kira</button>
            </form>
          )}
        </div>
      </section>

      <section className="betik-stats" aria-label="Ringkasan permainan">
        <div><CircleHelp /><span>Penyertaan Layak<strong>{formatNumber(qualifiedGuesses.length)}</strong></span></div>
        <div><Hash /><span>Tekaan Terendah<strong>{lowest === null ? "—" : formatNumber(lowest)}</strong></span></div>
        <div><Sprout /><span>Tekaan Tertinggi<strong>{highest === null ? "—" : formatNumber(highest)}</strong></span></div>
      </section>

      {excludedGuesses.length > 0 && <div className="notice warning" role="status">{excludedGuesses.length} tekaan dikecualikan kerana peserta kini berstatus tidak hadir atau dilumpuhkan.</div>}

      {isRevealed && winners.length > 0 && (
        <section className="winner-board" aria-labelledby="winner-title">
          <div className="winner-board-heading"><Medal /><div><span className="eyebrow">Paling hampir</span><h2 id="winner-title">{winners.length > 1 ? `${winners.length} Pemenang Seri` : "Pemenang Teka Biji Betik"}</h2></div></div>
          <div className="winner-cards">
            {winners.map((winner) => (
              <article key={winner.id}>
                <Trophy />
                <div><strong>{winner.participant.name}</strong><span>Nombor tuala {winner.participant.towel_number}</span></div>
                <div className="winner-guess"><small>Tekaan</small><b>{formatNumber(winner.guessed_count)}</b></div>
                <span className={winner.difference === 0 ? "exact" : "closest"}>{winner.difference === 0 ? "Tepat!" : `Beza ${formatNumber(winner.difference)}`}</span>
              </article>
            ))}
          </div>
        </section>
      )}

      {!isRevealed && (
        <section className="card card-pad betik-entry-card">
          <div className="section-title"><div><h2>Daftar Tekaan</h2><p>Cari peserta melalui nombor tuala atau nama. Peserta yang sudah meneka tidak akan ditawarkan lagi.</p></div></div>
          <form className="betik-entry-form" onSubmit={add}>
            <div className="field participant-picker">
              <label htmlFor="betik_participant">Peserta Berdaftar</label>
              <input ref={participantInputRef} className="input" id="betik_participant" list="betik-participant-options" value={participantInput} onChange={(event) => selectParticipant(event.target.value)} onBlur={() => selectedParticipant && setParticipantInput(participantLabel(selectedParticipant))} autoComplete="off" required autoFocus disabled={availableParticipants.length === 0} placeholder={availableParticipants.length ? "Cari nombor tuala atau nama…" : "Semua peserta sudah meneka"} />
              <datalist id="betik-participant-options">{availableParticipants.map((participant) => <option key={participant.id} value={participantLabel(participant)} />)}</datalist>
              {selectedParticipant && <span className="participant-preview"><UserCheck /><b>{selectedParticipant.towel_number}</b><span>{selectedParticipant.name}</span></span>}
            </div>
            <div className="field"><label htmlFor="guessed_count">Bilangan Tekaan</label><input className="input" id="guessed_count" name="guessed_count" type="number" inputMode="numeric" min="1" max="1000000" required placeholder="cth. 438" /></div>
            <button className="button primary" disabled={pending || !selectedParticipantId}><Plus /> {pending ? "Menyimpan…" : "Tambah Tekaan"}</button>
          </form>
        </section>
      )}

      {message && <div className={`notice ${message.kind}`} role="status">{message.text}</div>}

      <div className="toolbar">
        <div className="search-wrap"><Search /><input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nombor tuala, nama, atau tekaan…" aria-label="Cari penyertaan" /></div>
        <span className="eyebrow">{isRevealed ? "Kedudukan akhir" : `${qualifiedGuesses.length} tekaan layak`}</span>
      </div>

      <section className="table-wrap betik-table">
        {filtered.length ? (
          <table>
            <thead><tr>{isRevealed && <th>Kedudukan</th>}<th>Nombor Tuala</th><th>Nama Peserta</th><th>Tekaan</th>{isRevealed ? <><th>Beza</th><th>Keputusan</th></> : <><th>Direkodkan</th><th className="text-right">Tindakan</th></>}</tr></thead>
            <tbody>
              {filtered.map((entry) => {
                const qualified = isQualified(entry);
                const result = isRevealed && qualified ? entry as RankedBetikGuess : null;
                return <tr key={entry.id} className={result?.rank === 1 ? "winning-row" : !qualified ? "ineligible-row" : ""}>
                  {isRevealed && <td className="rank-cell" data-label="Kedudukan">{result ? `#${result.rank}` : "—"}</td>}
                  <td className="number-cell" data-label="Nombor Tuala">{entry.participant.towel_number}</td>
                  <td data-label="Nama Peserta"><strong>{entry.participant.name}</strong>{!qualified && <span className="result-pill ineligible">Tidak layak</span>}</td>
                  <td className="number-cell betik-count" data-label="Tekaan">{formatNumber(entry.guessed_count)}</td>
                  {isRevealed ? <><td data-label="Beza">{result ? formatNumber(result.difference) : "—"}</td><td data-label="Keputusan">{result ? <span className={`result-pill ${result.difference === 0 ? "exact" : result.rank === 1 ? "closest" : ""}`}>{result.difference === 0 ? "Tepat" : result.rank === 1 ? "Paling hampir" : `Tempat #${result.rank}`}</span> : <span className="result-pill ineligible">Dikecualikan</span>}</td></> : <><td data-label="Direkodkan">{formatDate(entry.created_at)}</td><td className="table-actions-cell" data-label="Tindakan"><div className="actions"><button className="icon-button" onClick={() => setEditing(entry)} aria-label={`Edit tekaan ${entry.participant.name}`}><Pencil /></button><button className="icon-button" onClick={() => setDeleting(entry)} aria-label={`Padam tekaan ${entry.participant.name}`}><Trash2 /></button></div></td></>}
                </tr>;
              })}
            </tbody>
          </table>
        ) : <div className="empty-state"><Sprout /><h3>{guesses.length ? "Tiada penyertaan ditemui" : "Belum ada tekaan"}</h3><p>{guesses.length ? "Cuba kata carian yang lain." : "Pilih peserta berdaftar untuk merekodkan tekaan pertama."}</p></div>}
      </section>

      {editing && <div className="dialog-backdrop" role="presentation"><form className="dialog" onSubmit={(event) => { event.preventDefault(); const count = Number(new FormData(event.currentTarget).get("guessed_count")); startTransition(async () => { const result = await updateBetikGuess(editing.id, count); setMessage({ kind: result.ok ? "success" : "error", text: result.message }); if (result.ok) setEditing(null); }); }}><span className="eyebrow">Betulkan penyertaan</span><h2>Edit Tekaan</h2><div className="participant-dialog-summary"><span>{editing.participant.towel_number}</span><div><strong>{editing.participant.name}</strong><small>Peserta berdaftar</small></div></div><div className="field mt-3.5"><label htmlFor="edit-betik-count">Bilangan Tekaan</label><input className="input" id="edit-betik-count" name="guessed_count" type="number" inputMode="numeric" min="1" max="1000000" defaultValue={editing.guessed_count} required autoFocus /></div><div className="dialog-actions"><button type="button" className="button secondary" onClick={() => setEditing(null)}>Batal</button><button className="button primary" disabled={pending}>Simpan</button></div></form></div>}

      <ConfirmDialog open={pendingAnswer !== null} title="Umumkan jawapan sekarang?" description={pendingAnswer === null ? "" : <>Jumlah sebenar ialah <strong>{formatNumber(pendingAnswer)} biji</strong>. Penyertaan akan ditutup dan semua rekod dikunci sementara keputusan dipaparkan.</>} confirmLabel="Ya, Kira Keputusan" danger={false} onClose={() => setPendingAnswer(null)} onConfirm={confirmReveal} />
      <ConfirmDialog open={confirmReopen} title="Buka semula penyertaan?" description="Keputusan akan disembunyikan supaya tekaan boleh dibetulkan. Semua penyertaan berdaftar akan dikekalkan." confirmLabel="Buka Semula" danger={false} onClose={() => setConfirmReopen(false)} onConfirm={() => { setConfirmReopen(false); startTransition(async () => { const result = await reopenBetikGame(); setMessage({ kind: result.ok ? "info" : "error", text: result.message }); }); }} />
      <ConfirmDialog open={!!deleting} title="Padam penyertaan?" description={deleting ? <>Tekaan <strong>{formatNumber(deleting.guessed_count)}</strong> oleh <strong>{deleting.participant.name}</strong> ({deleting.participant.towel_number}) akan dipadam.</> : ""} confirmLabel="Padam Tekaan" onClose={() => setDeleting(null)} onConfirm={() => deleting && startTransition(async () => { const result = await deleteBetikGuess(deleting.id); setMessage({ kind: result.ok ? "success" : "error", text: result.message }); setDeleting(null); })} />
    </>
  );
}
