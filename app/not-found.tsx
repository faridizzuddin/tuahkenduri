import Link from "next/link";
export default function NotFound() { return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}><div style={{ textAlign: "center" }}><span className="eyebrow">404</span><h1>Halaman tidak ditemui</h1><Link className="button primary" href="/">Kembali ke Ringkasan</Link></div></main>; }
