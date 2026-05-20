import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Arena Contábil – Business Accounting Simulator",
  description:
    "Simulador empresarial gamificado para Ciências Contábeis. Grupos competem como empresas, tomando decisões financeiras em rodadas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full bg-slate-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
