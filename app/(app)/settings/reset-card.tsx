"use client";

import { useState, useTransition } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { runReset } from "./actions";

export function ResetCard({ kind, title, description, phrase }: { kind: "reset" | "participants" | "gifts"; title: string; description: string; phrase: string }) {
  const [open, setOpen] = useState(false); const [value, setValue] = useState(""); const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null); const [pending, startTransition] = useTransition();
  return <><article className={`reset-card ${kind !== "reset" ? "destructive" : ""}`}><span className="reset-icon">{kind === "reset" ? <RotateCcw /> : <Trash2 />}</span><div><h2>{title}</h2><p>{description}</p></div><button className={`button ${kind === "reset" ? "secondary" : "danger"}`} onClick={() => { setValue(""); setMessage(null); setOpen(true); }}>{kind === "reset" ? "Set Semula" : "Padam Semua"}</button></article>
    {open && <div className="dialog-backdrop"><section className="dialog" role="dialog" aria-modal="true" aria-labelledby={`reset-${kind}`}><span className="eyebrow">Tindakan sensitif</span><h2 id={`reset-${kind}`}>{title}</h2><p>{description}</p><div className="field"><label htmlFor={`phrase-${kind}`}>Taip <strong>{phrase}</strong> untuk mengesahkan</label><input className="input" id={`phrase-${kind}`} value={value} onChange={(e) => setValue(e.target.value)} autoFocus autoComplete="off" /></div>{message && <div className={`notice ${message.ok ? "success" : "error"}`}>{message.text}</div>}<div className="dialog-actions"><button className="button secondary" onClick={() => setOpen(false)} disabled={pending}>Batal</button><button className="button danger" disabled={pending || value !== phrase} onClick={() => startTransition(async () => { const result = await runReset(kind, value); setMessage({ ok: result.ok, text: result.message }); if (result.ok) { setTimeout(() => setOpen(false), 800); } })}>{pending ? "Memproses…" : "Sahkan Tindakan"}</button></div></section></div>}</>;
}
