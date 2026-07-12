"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children, pendingText = "Menyimpan…", className = "button primary" }: { children: React.ReactNode; pendingText?: string; className?: string }) {
  const { pending } = useFormStatus();
  return <button className={className} type="submit" disabled={pending} aria-busy={pending}>{pending ? <><LoaderCircle className="inline-spinner" aria-hidden="true" />{pendingText}</> : children}</button>;
}
