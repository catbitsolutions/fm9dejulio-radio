import type { Metadata, Viewport } from "next";
import "./globals.css";

const BASE_URL = "https://app.fm9dejulio.com.ar";
const LOGO_URL = `${BASE_URL}/imagenes/Logo-9-de-julio.png`;

export const metadata: Metadata = {
  title: "FM 9 de Julio 102.3 MHz - Radio en Vivo",
  description:
    "Escucha FM 9 de Julio 102.3 MHz en vivo. La radio verdad, la radio solidaria. Tres Isletas, Chaco, Argentina. Transmisión online 24 horas.",
  keywords: [
    "FM 9 de Julio",
    "radio",
    "Tres Isletas",
    "Chaco",
    "Argentina",
    "102.3 MHz",
    "radio en vivo",
    "streaming",
  ],
  authors: [{ name: "CatBit" }],
  creator: "CatBit",
  publisher: "FM 9 de Julio",
  metadataBase: new URL(BASE_URL),
  alternates: { canonical: BASE_URL },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FM 9 de Julio",
  },
  formatDetection: { telephone: true, email: false, address: false, date: false },
  openGraph: {
    type: "website",
    url: BASE_URL,
    title: "FM 9 de Julio 102.3 MHz - Radio en Vivo",
    description:
      "Escucha FM 9 de Julio 102.3 MHz en vivo. La radio verdad, la radio solidaria. Tres Isletas, Chaco, Argentina.",
    siteName: "FM 9 de Julio",
    locale: "es_AR",
    images: [
      {
        url: "/imagenes/Logo-9-de-julio.png",
        width: 512,
        height: 512,
        alt: "FM 9 de Julio - Logo",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@fm9dejulio",
    creator: "@fm9dejulio",
    title: "FM 9 de Julio 102.3 MHz - Radio en Vivo",
    description:
      "Escucha FM 9 de Julio 102.3 MHz en vivo. La radio verdad, la radio solidaria. Tres Isletas, Chaco, Argentina.",
    images: ["/imagenes/Logo-9-de-julio.png"],
  },
  applicationName: "FM 9 de Julio",
  category: "Entertainment",
  language: "es",
  bookmarks: [BASE_URL],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#DAA520" },
    { media: "(prefers-color-scheme: dark)", color: "#DAA520" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        {/* Favicon local */}
        <link rel="icon" href="/imagenes/favicon.ico" sizes="any" />
        <link rel="icon" href="/imagenes/Logo-9-de-julio.png" type="image/png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/imagenes/Logo-9-de-julio.png" />

        {/* Preconnect para mejorar rendimiento */}
        <link rel="preconnect" href="https://streaming01.radiosenlinea.com.ar" />
        <link rel="preconnect" href="https://api.open-meteo.com" />

        {/* Meta tags adicionales */}
        <meta property="og:site_name" content="FM 9 de Julio" />
        <meta property="og:see_also" content="https://fm9dejulio.com.ar" />

        {/* Schema.org */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "RadioStation",
              name: "FM 9 de Julio",
              frequency: "102.3 MHz",
              description:
                "La radio verdad, la radio solidaria. Transmitiendo desde Tres Isletas, Chaco, Argentina.",
              url: BASE_URL,
              logo: "/imagenes/Logo-9-de-julio.png",
              image: "/imagenes/Logo-9-de-julio.png",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Tres Isletas",
                addressRegion: "Chaco",
                addressCountry: "AR",
              },
              sameAs: [
                "https://www.facebook.com/fm9dejuliotresisletas",
                "https://fm9dejulio.com.ar",
              ],
              broadcastDisplayName: "FM 9 de Julio 102.3 MHz",
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
