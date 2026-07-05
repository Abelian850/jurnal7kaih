import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Self-host Inter lewat next/font (lebih cepat & tanpa request ke Google
// Fonts tiap load) — sesuai catatan di globals.css.
const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Jurnal 7 KAIH — SMP Negeri 30 Semarang",
  description: "Aplikasi Pengisian Jurnal 7 Kebiasaan Anak Indonesia Hebat",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <head>
        {/* Material Symbols belum ada paket next/font resminya — tetap
            dimuat lewat link CDN. Untuk produksi skala besar, pertimbangkan
            self-host file font-nya sendiri di /public/fonts. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
