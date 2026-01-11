import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { OrganizationSchema, WebsiteSchema } from "@/components/seo";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Marie Lou Coffee | Frisch geröstet, direkt bezogen",
    template: "%s | Marie Lou Coffee",
  },
  description: "Wir rösten erst nach deiner Bestellung, beziehen direkt von Bauern und liefern innerhalb weniger Tage nach dem Rösten. Premium Specialty Kaffee aus Deutschland.",
  keywords: ["Kaffee", "Specialty Coffee", "frisch geröstet", "direct trade", "Kaffeebohnen", "online kaufen", "Deutschland"],
  authors: [{ name: "Marcel", url: "https://marieloucoffee.com" }],
  creator: "Marie Lou Coffee",
  publisher: "Marie Lou Coffee",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://marieloucoffee.com'),
  alternates: {
    canonical: '/',
    languages: {
      'de': '/de',
      'en': '/en',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    alternateLocale: 'en_US',
    url: '/',
    siteName: 'Marie Lou Coffee',
    title: 'Marie Lou Coffee | Frisch geröstet, direkt bezogen',
    description: 'Wir rösten erst nach deiner Bestellung, beziehen direkt von Bauern und liefern innerhalb weniger Tage nach dem Rösten.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Marie Lou Coffee - Frisch gerösteter Specialty Kaffee',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marie Lou Coffee | Frisch geröstet, direkt bezogen',
    description: 'Wir rösten erst nach deiner Bestellung, beziehen direkt von Bauern und liefern innerhalb weniger Tage nach dem Rösten.',
    images: ['/images/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add these once you have the verification codes
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <OrganizationSchema />
        <WebsiteSchema />
      </head>
      <body className={`${cormorant.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}
