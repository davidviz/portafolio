import type { Metadata } from "next";
import "./globals.css";
import { temaComoVariablesCss } from "@/config/tema";
import { perfil } from "@/config/perfil";

export const metadata: Metadata = {
  title: `${perfil.nombre} — Portafolio profesional`,
  description: perfil.propuestaValor.slice(0, 155),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Hanken+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: `:root{${temaComoVariablesCss()}}` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
