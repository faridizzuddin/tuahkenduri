"use client";

import { useMemo, useState } from "react";
import { Download, History, Search } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { escapeCsv } from "@/lib/validation";

export interface HistoryRow { id: string; sequence_number: number; status: string; participant_drawn_at: string; completed_at: string | null; participant: { towel_number: string; name: string }; gift: { gift_number: string } | null }

export function HistoryTable({ rows }: { rows: HistoryRow[] }) {
  const [query, setQuery] = useState(""); const [order, setOrder] = useState<"latest" | "earliest">("latest");
  const filtered = useMemo(() => rows.filter((r) => `${r.participant.towel_number} ${r.participant.name} ${r.gift?.gift_number ?? ""}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => order === "latest" ? b.sequence_number - a.sequence_number : a.sequence_number - b.sequence_number), [rows, query, order]);
  function exportCsv() {
    const completed = filtered.filter((r) => r.status === "completed");
    const content = ["sequence,towel_number,name,gift_number,drawn_at", ...completed.map((r) => [r.sequence_number, r.participant.towel_number, r.participant.name, r.gift?.gift_number ?? "", r.completed_at].map(escapeCsv).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `keputusan-cabutan-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }
  return <><div className="toolbar history-toolbar"><div className="search-wrap"><Search /><input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama, tuala atau hadiah…" aria-label="Cari sejarah" /></div><select className="select" value={order} onChange={(e) => setOrder(e.target.value as "latest" | "earliest")} aria-label="Susunan"><option value="latest">Terbaharu dahulu</option><option value="earliest">Terdahulu dahulu</option></select><button className="button secondary" onClick={exportCsv} disabled={!rows.some((r) => r.status === "completed")}><Download /> Eksport CSV</button></div>
    <section className="table-wrap">{filtered.length ? <table><thead><tr><th>Turutan</th><th>Nombor Tuala</th><th>Nama Peserta</th><th>Nombor Hadiah</th><th>Tarikh & Masa</th><th>Status</th></tr></thead><tbody>{filtered.map((r) => <tr key={r.id}><td data-label="Turutan">#{r.sequence_number}</td><td className="number-cell" data-label="Nombor Tuala">{r.participant.towel_number}</td><td data-label="Nama Peserta">{r.participant.name}</td><td className="number-cell" data-label="Nombor Hadiah">{r.gift?.gift_number ?? "—"}</td><td data-label="Tarikh & Masa">{new Intl.DateTimeFormat("ms-MY", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kuala_Lumpur" }).format(new Date(r.completed_at ?? r.participant_drawn_at))}</td><td data-label="Status"><StatusBadge status={r.status} /></td></tr>)}</tbody></table> : <div className="empty-state"><History /><h3>Tiada rekod cabutan</h3><p>Keputusan cabutan akan dipaparkan di sini.</p></div>}</section></>;
}
