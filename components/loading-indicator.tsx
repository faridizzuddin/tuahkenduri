import { LoaderCircle, Sparkles } from "lucide-react";

export function NavigationProgress({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <div className="route-progress" role="status" aria-live="polite">
      <span className="route-progress-bar" aria-hidden="true" />
      <span className="sr-only">Memuatkan halaman…</span>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="page loading-page" aria-busy="true" aria-label="Memuatkan kandungan">
      <header className="loading-header">
        <div>
          <span className="skeleton-block skeleton-eyebrow" />
          <span className="skeleton-block skeleton-title" />
          <span className="skeleton-block skeleton-copy" />
        </div>
        <span className="skeleton-block skeleton-button" />
      </header>
      <section className="loading-card-grid" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => <span className="skeleton-block skeleton-card" key={index} />)}
      </section>
      <section className="loading-panel" aria-hidden="true">
        <span className="skeleton-block skeleton-panel-title" />
        <span className="skeleton-block skeleton-panel-row" />
        <span className="skeleton-block skeleton-panel-row" />
        <span className="skeleton-block skeleton-panel-row short" />
      </section>
      <span className="sr-only">Sila tunggu sebentar.</span>
    </div>
  );
}

export function FullPageLoading({ draw = false }: { draw?: boolean }) {
  return (
    <main className={draw ? "draw-loading" : "full-page-loading"} aria-busy="true" aria-label="Memuatkan halaman">
      <div className="loading-emblem" aria-hidden="true">
        <LoaderCircle className="loading-ring" />
        <Sparkles className="loading-sparkle" />
      </div>
      <p>{draw ? "Menyiapkan pentas cabutan…" : "Menyiapkan kenduri…"}</p>
      <small>Sila tunggu sebentar</small>
    </main>
  );
}
