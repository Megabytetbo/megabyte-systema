import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://megabyte-systema-vp1y.vercel.app"),
  title: {
    default: "MegaTallerPro — Software de gestión para talleres de reparación",
    template: "%s | MegaTallerPro",
  },
  description:
    "Sistema de gestión para talleres técnicos de reparación de celulares, notebooks y PC. Controlá órdenes de trabajo, clientes, finanzas, punto de venta y tickets. Probalo gratis 10 días.",
  keywords: [
    "software para taller de reparación",
    "sistema de gestión de reparaciones",
    "gestión de taller de celulares",
    "punto de venta taller técnico",
    "órdenes de trabajo reparación",
    "software taller Uruguay",
    "programa para reparación de celulares",
    "gestión de clientes taller",
    "MegaTallerPro",
  ],
  authors: [{ name: "MegaTallerPro" }],
  creator: "MegaTallerPro",
  publisher: "MegaTallerPro",
  category: "business software",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_UY",
    url: "https://megabyte-systema-vp1y.vercel.app",
    siteName: "MegaTallerPro",
    title: "MegaTallerPro — Software de gestión para talleres de reparación",
    description:
      "Controlá órdenes de trabajo, clientes, finanzas y punto de venta en un solo lugar. La herramienta ideal para tu taller técnico. Probalo gratis 10 días.",
    images: [
      {
        url: "/apple-touch-icon.png",
        width: 180,
        height: 180,
        alt: "MegaTallerPro",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MegaTallerPro — Software de gestión para talleres de reparación",
    description:
      "Controlá órdenes de trabajo, clientes, finanzas y punto de venta en un solo lugar. Probalo gratis 10 días.",
    images: ["/apple-touch-icon.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "MegaTallerPro",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Sistema de gestión para talleres técnicos de reparación: órdenes de trabajo, clientes, finanzas, punto de venta y tickets.",
    offers: [
      {
        "@type": "Offer",
        name: "Plan Basic",
        price: "15",
        priceCurrency: "USD",
      },
      {
        "@type": "Offer",
        name: "Plan Pro",
        price: "22",
        priceCurrency: "USD",
      },
    ],
  };

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
