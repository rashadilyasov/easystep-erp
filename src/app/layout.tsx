import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-geist",
});

const baseUrl = "https://www.easysteperp.com";

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Easy Step ERP | Təchizat, Satış və Anbar İdarəetmə Proqramı",
    template: "%s | Easy Step ERP",
  },
  description:
    "Easy Step ERP – təchizatçı şirkətləri üçün alış, satış, anbar, pul uçotu. Azərbaycanda təchizat və pərakəndə satış idarəetməsi. Qeydiyyat, paket seçimi və ödəniş.",
  keywords: ["Easy Step ERP", "ERP Azərbaycan", "anbar proqramı", "təchizat idarəetməsi", "satış proqramı", "easysteperp", "easysteperp.com"],
  authors: [{ name: "Easy Step ERP", url: baseUrl }],
  creator: "Easy Step ERP",
  publisher: "Easy Step ERP",
  openGraph: {
    type: "website",
    locale: "az_AZ",
    url: baseUrl,
    siteName: "Easy Step ERP",
    title: "Easy Step ERP | Təchizat, Satış və Anbar İdarəetmə",
    description: "Təchizatçı şirkətləri üçün alış, satış, anbar və pul uçotu. Azərbaycanda professional ERP həlli.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  verification: {
    google: "HdkwS2DIa8vI3DXe7dJsUjTCRwy_HUHZfyTgegfF2LU",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Easy Step ERP",
  applicationCategory: "BusinessApplication",
  description: "Təchizatçı şirkətləri üçün alış, satış, anbar və pul uçotu proqramı. Azərbaycanda professional ERP həlli.",
  url: "https://www.easysteperp.com",
  operatingSystem: "Windows",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "AZN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az">
      <body className={`${inter.variable} font-sans`} data-build="deploy-2025-02-20">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
