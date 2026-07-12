import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Cabutan Bertuah Kenduri", template: "%s · Cabutan Bertuah Kenduri" },
  description: "Sistem cabutan bertuah kenduri yang selamat dan mudah digunakan.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ms"><body>{children}</body></html>;
}
