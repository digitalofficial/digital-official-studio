import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

// Absolute base for OG/Twitter images and canonical URLs. Set NEXT_PUBLIC_SITE_URL
// to the production domain once recorded; Vercel exposes VERCEL_URL on every deploy
// as a fallback so relative image paths (e.g. /api/og) resolve during previews too.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Digital Official Studio | Photography & Videography",
  description: "Every moment, beautifully captured. Professional photography and videography for Sweet 16s, Quinceañeras, parties, and special events.",
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'Digital Official Studio',
    description: 'Every moment, beautifully captured. Professional photography and videography for Sweet 16s, Quinceañeras, parties, and special events.',
    siteName: 'Digital Official Studio',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Digital Official Studio',
    description: 'Every moment, beautifully captured. Professional photography and videography for Sweet 16s, Quinceañeras, parties, and special events.',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover' as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable}`}>
      <body className="font-[family-name:var(--font-dm-sans)] antialiased min-h-screen bg-navy text-text">
        {children}
      </body>
    </html>
  );
}
