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
  title: "Notificarte - El escudo legal para PyMEs argentinas",
  description: "Sistema de notificacion laboral fehaciente con validez legal. Construye expedientes probatorios blindados para tus sanciones. Validado por abogados. Acordada 31/2011 CSJN.",
  keywords: ["notificacion laboral", "sanciones", "PyME", "derecho laboral", "Argentina", "Ley 27.742"],
  authors: [{ name: "Notificarte" }],
  openGraph: {
    title: "Notificarte - El escudo legal para PyMEs argentinas",
    description: "El 73% de las PyMEs pierde juicios laborales por falta de prueba. Notificarte construye expedientes probatorios blindados.",
    type: "website",
    locale: "es_AR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
