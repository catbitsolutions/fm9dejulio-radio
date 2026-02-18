import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FM 9 de Julio 102.3 MHz",
  description: "Escucha FM 9 de Julio en vivo - La radio verdad, la radio solidaria. Tres Isletas, Chaco, Argentina",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FM 9 de Julio",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "FM 9 de Julio",
    title: "FM 9 de Julio 102.3 MHz",
    description: "Escucha FM 9 de Julio en vivo - La radio verdad, la radio solidaria",
    images: [
      {
        url: "https://i0.wp.com/fm9dejulio.com.ar/wp-content/uploads/2019/06/cropped-Favicon-9-de-julio.png?w=512&ssl=1",
        width: 512,
        height: 512,
        alt: "FM 9 de Julio Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FM 9 de Julio 102.3 MHz",
    description: "Escucha FM 9 de Julio en vivo",
    images: ["https://i0.wp.com/fm9dejulio.com.ar/wp-content/uploads/2019/06/cropped-Favicon-9-de-julio.png?w=512&ssl=1"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#DAA520",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="https://i0.wp.com/fm9dejulio.com.ar/wp-content/uploads/2019/06/cropped-Favicon-9-de-julio.png?w=96&ssl=1" />
        <link rel="apple-touch-icon" href="https://i0.wp.com/fm9dejulio.com.ar/wp-content/uploads/2019/06/cropped-Favicon-9-de-julio.png?w=192&ssl=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
