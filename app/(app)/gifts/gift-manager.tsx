"use client";

import { FormEvent, useMemo, useRef, useState, useTransition } from "react";
import { Boxes, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { Gift, GiftStatus } from "@/lib/types";
import { generateGiftNumbers } from "@/lib/validation";
import { addGift, createGiftRange, deleteGift, setGiftStatus, updateGift } from "./actions";
import { StatusBadge } from "@/components/status-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function GiftManager({ gifts }: { gifts: Gift[] }) {
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<{ kind: "success" | "error" | "info"; text: string } | null>(null);
  const [preview, setPreview] = useState<string[] | null>(null);
  const [editing, setEditing] = useState<Gift | null>(null);
  const [deleting, setDeleting] = useState<Gift | null>(null);
  const [pending, startTransition] = useTransition();
  const numberRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => gifts.filter((g) => g.gift_number.toLowerCase().includes(query.toLowerCase())), [gifts, query]);
  const available = gifts.filter((g) => g.status === "available").length;
  const claimed = gifts.filter((g) => g.status === "claimed").length;
  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const fd = new FormData(form);
    startTransition(async () => { const r = await addGift(String(fd.get("gift_number"))); setMessage({ kind: r.ok ? "success" : "error", text: r.message }); if (r.ok) { form.reset(); numberRef.current?.focus(); } });
  }
  function buildPreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const fd = new FormData(event.currentTarget);
    try { setPreview(generateGiftNumbers(Number(fd.get("start")), Number(fd.get("end")), Number(fd.get("padding")))); setMessage(null); }
    catch (error) { setMessage({ kind: "error", text: error instanceof Error ? error.message : "Julat tidak sah" }); }
  }
  return (
    <>
      <div className="gift-summary"><div><span>Jumlah Hadiah</span><strong>{gifts.length}</strong></div><div><span>Hadiah Tersedia</span><strong>{available}</strong></div><div><span>Telah Dituntut</span><strong>{claimed}</strong></div></div>
      <div className="manager-grid">
        <section className="card card-pad"><div className="section-title"><div><h2>Tambah Satu Hadiah</h2><p>Daftar nombor pada label hadiah.</p></div></div><form onSubmit={add} className="inline-form"><div className="field"><label htmlFor="gift_number">Nombor Hadiah</label><input ref={numberRef} className="input" id="gift_number" name="gift_number" required placeholder="cth. 01" /></div><button className="button primary" disabled={pending}><Plus /> Tambah</button></form></section>
        <section className="card card-pad"><div className="section-title"><div><h2>Jana Nombor Pukal</h2><p>Pratonton julat sebelum mencipta.</p></div></div><form onSubmit={buildPreview} className="generator-form"><div className="field"><label htmlFor="start">Mula</label><input className="input" id="start" name="start" type="number" min="0" defaultValue="1" required /></div><div className="field"><label htmlFor="end">Akhir</label><input className="input" id="end" name="end" type="number" min="0" defaultValue="30" required /></div><div className="field"><label htmlFor="padding">Padding</label><input className="input" id="padding" name="padding" type="number" min="1" max="12" defaultValue="2" required /></div><button className="button secondary"><Eye /> Pratonton</button></form></section>
      </div>
      {message && <div className={`notice ${message.kind}`} role="status">{message.text}</div>}
      <div className="toolbar"><div className="search-wrap"><Search /><input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nombor hadiah…" aria-label="Cari hadiah" /></div><span className="eyebrow">{gifts.length} hadiah</span></div>
      <section className="table-wrap">{filtered.length ? <table><thead><tr><th>Nombor Hadiah</th><th>Status</th><th className="text-right">Tindakan</th></tr></thead><tbody>{filtered.map((g) => <tr key={g.id}><td className="number-cell" data-label="Nombor Hadiah">{g.gift_number}</td><td data-label="Status"><StatusBadge status={g.status} /></td><td className="table-actions-cell" data-label="Tindakan"><div className="actions">{g.status !== "claimed" && <select className="select compact-select" value={g.status} aria-label={`Status hadiah ${g.gift_number}`} onChange={(e) => startTransition(async () => { const r = await setGiftStatus(g.id, e.target.value as GiftStatus); setMessage({ kind: r.ok ? "success" : "error", text: r.message }); })} disabled={pending}><option value="available">Tersedia</option><option value="disabled">Dilumpuhkan</option></select>}<button className="icon-button" onClick={() => setEditing(g)} aria-label={`Edit hadiah ${g.gift_number}`}><Pencil /></button><button className="icon-button" onClick={() => setDeleting(g)} aria-label={`Padam hadiah ${g.gift_number}`}><Trash2 /></button></div></td></tr>)}</tbody></table> : <div className="empty-state"><Boxes /><h3>Tiada hadiah ditemui</h3><p>Tambah hadiah atau ubah kata carian.</p></div>}</section>
      {preview && <div className="dialog-backdrop" role="presentation"><section className="dialog wide-dialog" role="dialog" aria-modal="true" aria-labelledby="preview-title"><span className="eyebrow">Semak sebelum cipta</span><h2 id="preview-title">Pratonton {preview.length} Nombor</h2><div className="number-preview">{preview.map((n) => <span key={n} className={gifts.some((g) => g.gift_number === n) ? "exists" : ""}>{n}</span>)}</div><p>Nombor berwarna pudar sudah wujud dan akan dilangkau.</p><div className="dialog-actions"><button className="button secondary" onClick={() => setPreview(null)}>Batal</button><button className="button primary" disabled={pending} onClick={() => startTransition(async () => { const r = await createGiftRange(preview); const detail = r.data ? ` Dicipta: ${r.data.created.join(", ") || "tiada"}. Dilangkau: ${r.data.skipped.join(", ") || "tiada"}.` : ""; setMessage({ kind: r.ok ? "info" : "error", text: r.message + detail }); if (r.ok) setPreview(null); })}>Cipta Nombor</button></div></section></div>}
      {editing && <div className="dialog-backdrop"><form className="dialog" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(async () => { const r = await updateGift(editing.id, String(fd.get("gift_number"))); setMessage({ kind: r.ok ? "success" : "error", text: r.message }); if (r.ok) setEditing(null); }); }}><span className="eyebrow">Kemaskini label</span><h2>Edit Nombor Hadiah</h2><div className="field"><label htmlFor="edit-gift">Nombor Hadiah</label><input className="input" id="edit-gift" name="gift_number" defaultValue={editing.gift_number} autoFocus required /></div><div className="dialog-actions"><button type="button" className="button secondary" onClick={() => setEditing(null)}>Batal</button><button className="button primary" disabled={pending}>Simpan</button></div></form></div>}
      <ConfirmDialog open={!!deleting} title="Padam hadiah?" description={deleting ? `Hadiah nombor ${deleting.gift_number} akan dipadam. Hadiah yang mempunyai sejarah cabutan tidak boleh dipadam.` : ""} confirmLabel="Padam Hadiah" onClose={() => setDeleting(null)} onConfirm={() => deleting && startTransition(async () => { const r = await deleteGift(deleting.id); setMessage({ kind: r.ok ? "success" : "error", text: r.message }); setDeleting(null); })} />
    </>
  );
}
