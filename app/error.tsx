"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}><div className="card card-pad" style={{ maxWidth: 500, textAlign: "center" }}><span className="eyebrow">Ralat sistem</span><h1 style={{ fontFamily: "Georgia,serif", color: "var(--maroon)" }}>Sesuatu tidak berjaya</h1><p style={{ color: "var(--muted)" }}>Sila semak sambungan dan cuba semula. Data cabutan yang telah disahkan kekal tersimpan.</p><button className="button primary" onClick={reset}>Cuba Semula</button></div></main>;
}
