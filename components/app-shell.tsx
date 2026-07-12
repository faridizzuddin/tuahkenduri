"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Gift, History, LayoutDashboard, LogOut, Menu, Settings, TicketCheck, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "./logo";

const links = [
  { href: "/", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/participants", label: "Senarai Peserta", icon: Users },
  { href: "/gifts", label: "Senarai Hadiah", icon: Gift },
  { href: "/draw", label: "Mula Cabutan", icon: TicketCheck },
  { href: "/history", label: "Sejarah Cabutan", icon: History },
  { href: "/settings", label: "Tetapan", icon: Settings },
];

export function AppShell({ children, email }: { children: React.ReactNode; email: string }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function closeMenu(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => menuButtonRef.current?.focus());
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }
  if (path === "/draw") return <>{children}</>;
  return (
    <div className="app-frame">
      <aside id="app-navigation" className={`sidebar ${open ? "sidebar-open" : ""}`} aria-label="Menu aplikasi">
        <div className="sidebar-top"><Logo /><button className="icon-button mobile-only" onClick={() => closeMenu(true)} aria-label="Tutup menu"><X /></button></div>
        <nav aria-label="Navigasi utama">
          {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => closeMenu()} className={path === href ? "active" : ""}><Icon /><span>{label}</span></Link>)}
        </nav>
        <div className="sidebar-user"><div><small>Log masuk sebagai</small><span title={email}>{email}</span></div><button className="icon-button" onClick={signOut} aria-label="Log keluar" title="Log keluar"><LogOut /></button></div>
      </aside>
      {open && <button className="sidebar-scrim" onClick={() => closeMenu(true)} aria-label="Tutup menu" />}
      <main className="main-content">
        <header className="tablet-header mobile-only">
          <button ref={menuButtonRef} className="icon-button menu-button" onClick={() => setOpen(true)} aria-label="Buka menu" aria-controls="app-navigation" aria-expanded={open}><Menu /></button>
          <Logo />
          <span className="tablet-header-spacer" aria-hidden="true" />
        </header>
        {children}
      </main>
    </div>
  );
}
