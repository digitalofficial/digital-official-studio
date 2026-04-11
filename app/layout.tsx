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

export const metadata: Metadata = {
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
