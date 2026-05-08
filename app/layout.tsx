import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Desafio CFO – Simulador Empresarial Contábil",
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
