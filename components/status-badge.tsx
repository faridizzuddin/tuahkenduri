const labels: Record<string, string> = {
  eligible: "Layak", won: "Menang", absent: "Tidak hadir", disabled: "Dilumpuhkan",
  available: "Tersedia", claimed: "Dituntut", participant_selected: "Dipilih",
  winner_confirmed: "Disahkan", completed: "Selesai", cancelled: "Dibatalkan",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge badge-${status}`}>{labels[status] ?? status}</span>;
}
