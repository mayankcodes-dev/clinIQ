import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClinIQ — Pre-consultation AI that interviews patients",
  description:
    "Pre-consultation AI that interviews patients before the doctor does. ABDM certified. 22 Indian languages.",
  metadataBase: new URL("https://cliniq.mayankcodes.dev"),
  icons: {
    icon: "/favicon.jpg",
    apple: "/favicon.jpg",
  },
  openGraph: {
    title: "ClinIQ — Pre-consultation AI that interviews patients",
    description: "Pre-consultation AI that interviews patients before the doctor does. ABDM certified. 22 Indian languages.",
    url: "https://cliniq.mayankcodes.dev",
    siteName: "ClinIQ",
    images: [{ url: "/favicon.jpg", width: 256, height: 256, alt: "ClinIQ" }],
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* suppressHydrationWarning prevents false mismatch from browser extensions */}
      <body suppressHydrationWarning style={{ fontFamily: "'Manrope', system-ui, sans-serif", margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}

