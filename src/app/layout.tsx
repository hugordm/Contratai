import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Providers from "@/components/ui/Provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Contratai",
  description: "Contrate melhor com psicometria e inteligência artificial",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={cn("h-full antialiased", geistSans.variable, geistMono.variable, inter.variable, "font-sans")}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
        <footer className="mt-auto border-t border-gray-200 bg-white py-4 px-4">
          <p className="text-center text-[11px] text-gray-400 leading-relaxed max-w-3xl mx-auto">
            Os testes disponibilizados nesta plataforma são ferramentas de autoconhecimento e suporte a processos de RH,
            não constituindo avaliações psicológicas clínicas oficiais. Não substituem avaliações realizadas por
            psicólogos habilitados conforme normas do CFP/SATEPSI.
          </p>
        </footer>
      </body>
    </html>
  );
}
