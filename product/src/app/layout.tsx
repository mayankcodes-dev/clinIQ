import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { LangSync } from "@/components/LangSync";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://app.ClinIQ.mayankcodes.dev"
  ),
  title: "ClinIQ — AI Clinical History Kiosk",
  description:
    "AI-powered multilingual clinical history-taking kiosk for Indian hospitals and AYUSH clinics. Speaks 13 Indian languages. PS 26047 | Ministry of AYUSH | SIH 2026",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ClinIQ",
  },
  keywords: [
    "ClinIQ", "ABHA", "ABDM", "clinical history",
    "AYUSH", "multilingual healthcare", "SIH 2026",
    "Bhashini", "voice kiosk",
  ],
  openGraph: {
    title: "ClinIQ — AI Clinical History Kiosk",
    description: "AI voice agent takes patient history in 13 Indian languages before doctor consultation.",
    url: "https://app.ClinIQ.mayankcodes.dev",
    siteName: "ClinIQ",
    type: "website",
    images: [
      {
        url: "/logo.jpg",
        width: 512,
        height: 512,
        alt: "ClinIQ Logo",
      },
    ],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
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
