"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="grid min-h-dvh place-items-center p-6"><div className="card card-pad max-w-[500px] text-center"><span className="eyebrow">Ralat sistem</span><h1 className="my-3 font-display text-4xl font-semibold tracking-tight text-maroon">Sesuatu tidak berjaya</h1><p className="mb-6 leading-6 text-muted">Sila semak sambungan dan cuba semula. Data cabutan yang telah disahkan kekal tersimpan.</p><button className="button primary" onClick={reset}>Cuba Semula</button></div></main>;
}
