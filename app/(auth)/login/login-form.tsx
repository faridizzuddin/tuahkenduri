"use client";

import { useActionState } from "react";
import { LockKeyhole, Mail } from "lucide-react";
import { login } from "./actions";
import { SubmitButton } from "@/components/submit-button";

export function LoginForm() {
  const [state, action] = useActionState(login, { error: "" });
  return (
    <form action={action}>
      <div className="field"><label htmlFor="email">E-mel hos</label><div className="login-input"><Mail /><input className="input" id="email" name="email" type="email" autoComplete="email" autoFocus required placeholder="hos@contoh.com" /></div></div>
      <div className="field"><label htmlFor="password">Kata laluan</label><div className="login-input"><LockKeyhole /><input className="input" id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" /></div></div>
      {state.error && <div className="notice error" role="alert">{state.error}</div>}
      <SubmitButton pendingText="Sedang log masuk…">Log Masuk</SubmitButton>
      <small style={{ color: "var(--muted)", textAlign: "center" }}>Akses untuk hos kenduri yang diluluskan sahaja.</small>
    </form>
  );
}
