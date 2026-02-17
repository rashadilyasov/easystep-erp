import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "Easy Step ERP | Müştəri Portalı",
  description:
    "Easy Step ERP – təchizatçı şirkətləri üçün alış, satış, anbar, pul uçotu. Qeydiyyat, paket seçimi, ödəniş və yükləmə.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az">
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  );
}
