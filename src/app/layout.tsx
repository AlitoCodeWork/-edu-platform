import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aprendé Informática",
  description: "Plataforma educativa gratuita de informática — recursos libres y legales.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <header className="nav">
          <Link href="/" className="nav-brand">📚 EduInfo</Link>
          <nav className="nav-links">
            <Link href="/buscar">Buscar</Link>
            <Link href="/examenes">Exámenes</Link>
            <Link href="/ranking">Ranking</Link>
            <Link href="/perfil">Perfil</Link>
            <Link href="/login" className="nav-cta">Entrar</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
