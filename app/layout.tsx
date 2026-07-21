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
  title: "Warframe Painel",
  description: "Gerenciador de Alertas e Ciclos do Warframe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0b101d] text-white">
        <main className="flex-1">
          {children}
        </main>

      
        <footer className="w-full py-4 text-center border-t border-gray-800/60 bg-[#0e1422]/50 backdrop-blur-md">
          <p className="text-xs text-gray-500 font-mono">
            Produzido e desenvolvido por{' '}
            <a 
              href="https://github.com/RuanBernardino" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 font-semibold hover:underline transition"
            >
              Ruan Bernardino
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}