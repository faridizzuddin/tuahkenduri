import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-art"><Logo /><blockquote>Raikan mereka yang menjayakan hari istimewa.</blockquote><p>Cabutan yang adil, mudah dan penuh debaran.</p></section>
      <section className="auth-form-wrap"><div className="auth-card"><span className="eyebrow">Selamat datang</span><h1>Log Masuk</h1><p>Masukkan akaun hos untuk mengurus peserta, hadiah dan cabutan.</p><LoginForm /></div></section>
    </main>
  );
}
