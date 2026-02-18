import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#DAA520" },
    { media: "(prefers-color-scheme: dark)", color: "#DAA520" },
  ],
};

export const metadata: Metadata = {
  title: "FM 9 de Julio 102.3 MHz - Tres Isletas, Chaco",
  description: "Escucha FM 9 de Julio 102.3 MHz en vivo. La radio verdad, la radio solidaria. Desde Tres Isletas, Chaco, Argentina.",
  keywords: ["FM 9 de Julio", "radio", "Tres Isletas", "Chaco", "Argentina", "102.3 MHz", "radio en vivo"],
  authors: [{ name: "FM 9 de Julio" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "https://i0.wp.com/fm9dejulio.com.ar/wp-content/uploads/2019/06/cropped-Favicon-9-de-julio.png?w=32&ssl=1", sizes: "32x32", type: "image/png" },
      { url: "https://i0.wp.com/fm9dejulio.com.ar/wp-content/uploads/2019/06/cropped-Favicon-9-de-julio.png?w=16&ssl=1", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "https://i0.wp.com/fm9dejulio.com.ar/wp-content/uploads/2019/06/cropped-Favicon-9-de-julio.png?w=180&ssl=1", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FM 9 de Julio",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "FM 9 de Julio 102.3 MHz - Tres Isletas, Chaco",
    description: "Escucha FM 9 de Julio 102.3 MHz en vivo. La radio verdad, la radio solidaria.",
    url: "https://fm9dejulio.com.ar",
    siteName: "FM 9 de Julio",
    type: "website",
    images: [
      {
        url: "https://i0.wp.com/fm9dejulio.com.ar/wp-content/uploads/2019/06/cropped-Favicon-9-de-julio.png",
        width: 512,
        height: 512,
        alt: "FM 9 de Julio Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FM 9 de Julio 102.3 MHz",
    description: "Escucha FM 9 de Julio en vivo desde Tres Isletas, Chaco",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Audiowide&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FM 9 de Julio" />
        <meta name="application-name" content="FM 9 de Julio" />
        <meta name="msapplication-TileColor" content="#DAA520" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ margin: 0, padding: 0, width: '100%', minHeight: '100vh', minHeight: '100dvh' }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
