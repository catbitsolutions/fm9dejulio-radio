import type { Metadata, Viewport } from "next";
import "./globals.css";

// URL base de tu app
const BASE_URL = "https://app.fm9dejulio.com.ar";
const LOGO_URL = "https://i0.wp.com/fm9dejulio.com.ar/wp-content/uploads/2019/06/cropped-Favicon-9-de-julio.png";

export const metadata: Metadata = {
  // Título y descripción básica
  title: "FM 9 de Julio 102.3 MHz - Radio en Vivo",
  description: "Escucha FM 9 de Julio 102.3 MHz en vivo. La radio verdad, la radio solidaria. Tres Isletas, Chaco, Argentina. Transmisión online 24 horas.",
  keywords: ["FM 9 de Julio", "radio", "Tres Isletas", "Chaco", "Argentina", "102.3 MHz", "radio en vivo", "streaming"],
  authors: [{ name: "Davincho" }],
  creator: "Davincho",
  publisher: "FM 9 de Julio",
  
  // URL canónica
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: BASE_URL,
  },
  
  // Robots
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
  
  // Manifest para PWA
  manifest: "/manifest.json",
  
  // Configuración para iOS/Apple
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FM 9 de Julio",
  },
  
  // Formato de detección
  formatDetection: {
    telephone: true,
    email: false,
    address: false,
    date: false,
  },
  
  // Open Graph - Para Facebook, WhatsApp, LinkedIn, etc.
  openGraph: {
    type: "website",
    url: BASE_URL,
    title: "FM 9 de Julio 102.3 MHz - Radio en Vivo",
    description: "Escucha FM 9 de Julio 102.3 MHz en vivo. La radio verdad, la radio solidaria. Tres Isletas, Chaco, Argentina.",
    siteName: "FM 9 de Julio",
    locale: "es_AR",
    images: [
      {
        url: `${LOGO_URL}?w=1200&ssl=1`,
        width: 1200,
        height: 1200,
        alt: "FM 9 de Julio - Logo",
        type: "image/png",
      },
      {
        url: `${LOGO_URL}?w=512&ssl=1`,
        width: 512,
        height: 512,
        alt: "FM 9 de Julio - Logo",
        type: "image/png",
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    site: "@fm9dejulio",
    creator: "@fm9dejulio",
    title: "FM 9 de Julio 102.3 MHz - Radio en Vivo",
    description: "Escucha FM 9 de Julio 102.3 MHz en vivo. La radio verdad, la radio solidaria. Tres Isletas, Chaco, Argentina.",
    images: [`${LOGO_URL}?w=1200&ssl=1`],
  },
  
  // Aplicación
  applicationName: "FM 9 de Julio",
  category: "Music",
  
  // Idioma
  language: "es",
  
  // Otros
  bookmarks: [BASE_URL],
  category: "Entertainment",
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/* Favicon */}
        <link rel="icon" href={`${LOGO_URL}?w=32&ssl=1`} sizes="32x32" />
        <link rel="icon" href={`${LOGO_URL}?w=192&ssl=1`} sizes="192x192" />
        <link rel="apple-touch-icon" href={`${LOGO_URL}?w=180&ssl=1`} />
        
        {/* Preconnect para mejorar rendimiento */}
        <link rel="preconnect" href="https://i0.wp.com" />
        <link rel="preconnect" href="https://streaming01.radiosenlinea.com.ar" />
        
        {/* Meta tags adicionales para redes sociales */}
        <meta property="og:site_name" content="FM 9 de Julio" />
        <meta property="og:see_also" content="https://fm9dejulio.com.ar" />
        
        {/* Schema.org para SEO */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RadioStation",
            "name": "FM 9 de Julio",
            "frequency": "102.3 MHz",
            "description": "La radio verdad, la radio solidaria. Transmitiendo desde Tres Isletas, Chaco, Argentina.",
            "url": BASE_URL,
            "logo": `${LOGO_URL}?w=512&ssl=1`,
            "image": `${LOGO_URL}?w=1200&ssl=1`,
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Tres Isletas",
              "addressRegion": "Chaco",
              "addressCountry": "AR"
            },
            "sameAs": [
              "https://www.facebook.com/fm9dejuliotresisletas",
              "https://fm9dejulio.com.ar"
            ],
            "broadcastDisplayName": "FM 9 de Julio 102.3 MHz"
          })
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
