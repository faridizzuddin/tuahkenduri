import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Cabutan Bertuah Kenduri", template: "%s · Cabutan Bertuah Kenduri" },
  description: "Sistem cabutan bertuah kenduri yang selamat dan mudah digunakan.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ms"><body className={`${jakarta.variable} ${playfair.variable} antialiased`}>{children}</body></html>;
}
