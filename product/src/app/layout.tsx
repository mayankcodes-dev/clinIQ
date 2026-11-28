import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { LangSync } from "@/components/LangSync";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Noto Sans Devanagari covers hi, mr, ne, sa, doi, mai, kok via next/font.
// Bengali, Tamil, Telugu, Gujarati, Kannada, Malayalam, Gurmukhi, Odia, Arabic
// are loaded via Google Fonts @import in globals.css (no next/font type issues).
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  variable: "--font-noto-dev",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://app.ClinIQ.mayankcodes.dev"
  ),
  title: "ClinIQ — AI Clinical History Kiosk",
  description:
    "AI-powered multilingual clinical history-taking kiosk for Indian hospitals. Supports 23 Indian languages. PS 26047 | SIH 2026",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ClinIQ",
  },
  keywords: [
    "ClinIQ", "clinical history", "AI kiosk",
    "multilingual healthcare", "SIH 2026", "23 Indian languages",
    "voice kiosk", "pre-consultation", "Bhashini",
  ],
  openGraph: {
    title: "ClinIQ — AI Clinical History Kiosk",
    description: "AI voice agent takes patient history in 13 Indian languages before doctor consultation.",
    url: "https://app.ClinIQ.mayankcodes.dev",
    siteName: "ClinIQ",
    type: "website",
    images: [
      {
        url: "/cliniq-logo.svg",
        width: 512,
        height: 512,
        alt: "ClinIQ Logo",
      },
    ],
  },
  icons: {
    icon: "/cliniq-logo.svg",
    shortcut: "/cliniq-logo.svg",
    apple: "/cliniq-logo.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0d9488",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${notoDevanagari.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/cliniq-logo.svg" />
        <link rel="apple-touch-icon" href="/cliniq-logo.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-white antialiased">
        <ServiceWorkerRegistrar />
        <LangSync />
        {children}
      </body>
    </html>
  );
}
