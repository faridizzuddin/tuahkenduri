"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Gift, History, LayoutDashboard, LogOut, Menu, Settings, TicketCheck, Users, X } from "lucide-react";
import { useState } from "react";
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
  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }
  if (path === "/draw") return <>{children}</>;
  return (
    <div className="app-frame">
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-top"><Logo /><button className="icon-button mobile-only" onClick={() => setOpen(false)} aria-label="Tutup menu"><X /></button></div>
        <nav aria-label="Navigasi utama">
          {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} className={path === href ? "active" : ""}><Icon /><span>{label}</span></Link>)}
        </nav>
        <div className="sidebar-user"><div><small>Log masuk sebagai</small><span title={email}>{email}</span></div><button className="icon-button" onClick={signOut} aria-label="Log keluar" title="Log keluar"><LogOut /></button></div>
      </aside>
      {open && <button className="sidebar-scrim" onClick={() => setOpen(false)} aria-label="Tutup menu" />}
      <main className="main-content"><button className="icon-button menu-button mobile-only" onClick={() => setOpen(true)} aria-label="Buka menu"><Menu /></button>{children}</main>
    </div>
  );
}
