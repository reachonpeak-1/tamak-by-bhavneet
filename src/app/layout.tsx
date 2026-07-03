import type { Metadata } from "next";
import { Cormorant_Garamond, EB_Garamond, Noto_Serif_Devanagari } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/components/StoreProvider";
import { AuthProvider } from "@/components/AuthProvider";
import Toast from "@/components/Toast";
import Sprite from "@/components/Sprite";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});
const ebGaramond = EB_Garamond({
  variable: "--font-ebgaramond",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});
const deva = Noto_Serif_Devanagari({
  variable: "--font-deva",
  weight: ["400", "500", "600", "700"],
  subsets: ["devanagari"],
  display: "swap",
});

const SITE = "https://tamak.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "तमक — By Bhavneet · Handwoven Suits, Sarees & Ethnic Wear",
    template: "%s · तमक by Bhavneet",
  },
  description:
    "तमक by Bhavneet — handwoven suits, sarees, lehengas and dupattas, crafted to order by artisans whose craft has passed through generations.",
  keywords: ["handwoven suits", "sarees", "lehengas", "dupattas", "ethnic wear", "Bathinda", "made to measure"],
  openGraph: {
    title: "तमक — By Bhavneet · Handwoven Ethnic Wear",
    description: "Handwoven suits, sarees and lehengas — crafted to order.",
    url: SITE,
    siteName: "तमक by Bhavneet",
    locale: "en_IN",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport = { themeColor: "#231a12" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${ebGaramond.variable} ${deva.variable}`}>
      <body>
        <AuthProvider>
        <StoreProvider>
          <Sprite />
          {children}
          <Toast />
        </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
