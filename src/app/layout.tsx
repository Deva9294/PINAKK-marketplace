import type { Metadata, Viewport } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pinakk-marketplace.onrender.com";
const siteName = "PINAKK";

export const viewport: Viewport = {
  themeColor: "#1E40AF",
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PINAKK – Stationery, School Books, Paper & Everyday Essentials",
    template: "%s | PINAKK",
  },
  description:
    "Shop stationery, school books and courses, A4 copy paper, glossy paper, school bags, perfumes, belts, tarpaulin, nets and daily-use essentials at PINAKK. Serving Rehti, Sehore and nearby areas.",
  applicationName: siteName,
  category: "shopping",
  alternates: {
    canonical: "/",
    languages: { "en-IN": "/", "hi-IN": "/" },
  },
  icons: {
    icon: "/pinakk-logo.svg",
    shortcut: "/pinakk-logo.svg",
    apple: "/pinakk-logo.svg",
  },
  keywords: [
    "PINAKK",
    "buy stationery online",
    "school books online",
    "school course books",
    "Pariksha Bodh books",
    "A4 copy paper",
    "glossy photo paper",
    "school bags",
    "tarpaulin and green net",
    "stationery shop Rehti",
    "online shopping Rehti",
    "office supplies Sehore",
    "Ashish Stationery and Photocopy",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName,
    title: "PINAKK – Shop Smart, Live Better",
    description:
      "Discover stationery, school books, printing paper, bags and everyday essentials at PINAKK.",
    url: siteUrl,
    images: [{ url: "/pinakk-logo.svg", alt: "PINAKK – Shop Smart, Live Better" }],
  },
  twitter: {
    card: "summary",
    title: "PINAKK – Shop Smart, Live Better",
    description: "Shop stationery, school books, printing supplies and everyday essentials.",
    images: ["/pinakk-logo.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
