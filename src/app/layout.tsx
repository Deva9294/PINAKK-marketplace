import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pinakk.online";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PINAKK — Shop Smart, Live Better",
    template: "%s | PINAKK",
  },
  description:
    "Shop stationery, school books, notebooks, office supplies, printing paper, school bags, tarpaulin, nets and everyday essentials at PINAKK, Rehti.",
  applicationName: "PINAKK",
  keywords: [
    "PINAKK",
    "stationery online",
    "school books",
    "school supplies",
    "A4 copy paper",
    "glossy paper",
    "office supplies",
    "Rehti shopping",
    "Ashish Stationery",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "PINAKK",
    title: "PINAKK — Shop Smart, Live Better",
    description:
      "Your destination for stationery, school books, printing supplies and everyday essentials.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "PINAKK — Shop Smart, Live Better",
    description:
      "Shop stationery, school books, printing supplies and everyday essentials.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
