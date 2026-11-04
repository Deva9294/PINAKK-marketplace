import Storefront from "@/components/Storefront";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pinakk-marketplace.onrender.com";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "OnlineStore",
      "@id": siteUrl + "/#store",
      name: "PINAKK",
      alternateName: "PINAKK – Shop Smart, Live Better",
      url: siteUrl,
      image: siteUrl + "/pinakk-logo.svg",
      description: "Online destination for stationery, school books, printing paper, school bags and everyday essentials.",
      telephone: "+919685535343",
      priceRange: "₹₹",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Rehti",
        addressRegion: "Madhya Pradesh",
        addressCountry: "IN"
      },
      areaServed: ["Rehti", "Sehore", "Madhya Pradesh", "India"],
    },
    {
      "@type": "WebSite",
      "@id": siteUrl + "/#website",
      url: siteUrl,
      name: "PINAKK",
      publisher: { "@id": siteUrl + "/#store" },
      inLanguage: ["en-IN", "hi-IN"]
    }
  ]
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <Storefront />
    </>
  );
}
