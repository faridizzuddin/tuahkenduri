import { Sparkles } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="logo-lockup">
      <span className="logo-mark"><Sparkles aria-hidden="true" /></span>
      {!compact && <span><strong>Cabutan Bertuah</strong><small>Kenduri</small></span>}
    </div>
  );
}
