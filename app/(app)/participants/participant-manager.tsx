"use client";

import { ChangeEvent, FormEvent, useMemo, useRef, useState, useTransition } from "react";
import { FileUp, Pencil, Search, Trash2, Users } from "lucide-react";
import type { Participant, ParticipantStatus } from "@/lib/types";
import { addParticipant, deleteParticipant, importParticipants, setParticipantStatus, updateParticipant } from "./actions";
import { StatusBadge } from "@/components/status-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";

function parseCsv(text: string) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const header = lines.shift()?.split(",").map((v) => v.trim().toLowerCase());
  if (!header || header[0] !== "towel_number" || header[1] !== "name") throw new Error("Tajuk CSV mestilah towel_number,name");
  return lines.map((line) => {
    const match = line.match(/^\s*(?:"((?:[^"]|"")*)"|([^,]*))\s*,\s*(?:"((?:[^"]|"")*)"|(.*))\s*$/);
    return { towel_number: (match?.[1] ?? match?.[2] ?? "").replace(/""/g, '"'), name: (match?.[3] ?? match?.[4] ?? "").replace(/""/g, '"') };
  });
}

export function ParticipantManager({ participants }: { participants: Participant[] }) {
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<{ kind: "success" | "error" | "info"; text: string } | null>(null);
  const [editing, setEditing] = useState<Participant | null>(null);
  const [deleting, setDeleting] = useState<Participant | null>(null);
  const [pending, startTransition] = useTransition();
  const towelRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => participants.filter((p) => `${p.towel_number} ${p.name}`.toLowerCase().includes(query.toLowerCase())), [participants, query]);

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    startTransition(async () => {
      const result = await addParticipant({ towel_number: String(data.get("towel_number")), name: String(data.get("name")) });
      setMessage({ kind: result.ok ? "success" : "error", text: result.message });
      if (result.ok) { form.reset(); towelRef.current?.focus(); }
    });
  }
  function changeStatus(id: string, status: ParticipantStatus) {
    startTransition(async () => { const result = await setParticipantStatus(id, status); setMessage({ kind: result.ok ? "success" : "error", text: result.message }); });
  }
  async function readCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      const rows = parseCsv(await file.text());
      startTransition(async () => {
        const result = await importParticipants(rows);
        const detail = result.data ? ` Dicipta: ${result.data.created.length}. Duplikat: ${result.data.skipped.length}. Tidak sah: ${result.data.invalid.length}.` : "";
        setMessage({ kind: result.ok ? "info" : "error", text: result.message + detail });
      });
    } catch (error) { setMessage({ kind: "error", text: error instanceof Error ? error.message : "CSV tidak sah" }); }
    event.target.value = "";
  }
  return (
    <>
      <section className="card card-pad">
        <div className="section-title"><div><h2>Tambah Peserta</h2><p>Tekan Enter untuk simpan dan teruskan kepada peserta seterusnya.</p></div><button className="button secondary" onClick={() => fileRef.current?.click()} disabled={pending}><FileUp /> Import CSV</button><input hidden ref={fileRef} type="file" accept=".csv,text/csv" onChange={readCsv} /></div>
        <form className="form-row" onSubmit={add}>
          <div className="field"><label htmlFor="towel_number">Nombor Tuala</label><input ref={towelRef} className="input" id="towel_number" name="towel_number" maxLength={40} autoComplete="off" required autoFocus placeholder="cth. 001" /></div>
          <div className="field"><label htmlFor="name">Nama Peserta</label><input className="input" id="name" name="name" maxLength={120} required placeholder="Nama penuh peserta" /></div>
          <button className="button primary" type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Tambah Peserta"}</button>
        </form>
        {message && <div className={`notice ${message.kind}`} role="status">{message.text}</div>}
      </section>
      <div className="toolbar"><div className="search-wrap"><Search /><input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nombor tuala atau nama…" aria-label="Cari peserta" /></div><span className="eyebrow">{participants.length} peserta</span></div>
      <section className="table-wrap">
        {filtered.length ? <table><thead><tr><th>Nombor Tuala</th><th>Nama Peserta</th><th>Status</th><th style={{ textAlign: "right" }}>Tindakan</th></tr></thead><tbody>{filtered.map((p) => <tr key={p.id}><td className="number-cell">{p.towel_number}</td><td>{p.name}</td><td><StatusBadge status={p.status} /></td><td><div className="actions">{p.status !== "won" && <select className="select compact-select" aria-label={`Status ${p.name}`} value={p.status} onChange={(e) => changeStatus(p.id, e.target.value as ParticipantStatus)} disabled={pending}><option value="eligible">Layak</option><option value="absent">Tidak hadir</option><option value="disabled">Dilumpuhkan</option></select>}<button className="icon-button" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}><Pencil /></button><button className="icon-button" onClick={() => setDeleting(p)} aria-label={`Padam ${p.name}`}><Trash2 /></button></div></td></tr>)}</tbody></table> : <div className="empty-state"><Users /><h3>Tiada peserta ditemui</h3><p>Tambah peserta atau ubah kata carian.</p></div>}
      </section>
      {editing && <div className="dialog-backdrop" role="presentation"><form className="dialog" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(async () => { const r = await updateParticipant(editing.id, { towel_number: String(fd.get("towel_number")), name: String(fd.get("name")) }); setMessage({ kind: r.ok ? "success" : "error", text: r.message }); if (r.ok) setEditing(null); }); }}><span className="eyebrow">Kemaskini maklumat</span><h2>Edit Peserta</h2><div className="field"><label htmlFor="edit-towel">Nombor Tuala</label><input className="input" id="edit-towel" name="towel_number" defaultValue={editing.towel_number} required autoFocus /></div><div className="field" style={{ marginTop: 14 }}><label htmlFor="edit-name">Nama Peserta</label><input className="input" id="edit-name" name="name" defaultValue={editing.name} required /></div><div className="dialog-actions"><button type="button" className="button secondary" onClick={() => setEditing(null)}>Batal</button><button className="button primary" disabled={pending}>Simpan</button></div></form></div>}
      <ConfirmDialog open={!!deleting} title="Padam peserta?" description={deleting ? `${deleting.towel_number} — ${deleting.name} akan dipadam. Peserta yang mempunyai sejarah cabutan tidak boleh dipadam.` : ""} confirmLabel="Padam Peserta" onClose={() => setDeleting(null)} onConfirm={() => deleting && startTransition(async () => { const r = await deleteParticipant(deleting.id); setMessage({ kind: r.ok ? "success" : "error", text: r.message }); setDeleting(null); })} />
    </>
  );
}
