import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Soninkara Facture | Facturation simplifiée pour entrepreneurs africains",
  description: "Gérez vos factures en FCFA, calculez la TVA à 18% automatiquement, suivez vos paiements et pilotez votre trésorerie en toute simplicité.",
  keywords: ["facture", "SaaS", "Afrique", "FCFA", "TVA 18%", "Sénégal", "Côte d'Ivoire", "Mali", "entrepreneur"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full scroll-smooth">
      <body
        className={`${outfit.variable} font-sans h-full bg-slate-50 text-slate-900 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
