import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import "./globals.css";

// "--font-inter" is injected by next/font. globals.css @theme maps it to --font-sans.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CFO Dashboard",
  description: "AI-powered financial analysis for CFOs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" data-theme="dark" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg text-ink flex flex-col">

        <Header />

        <div className="flex flex-1">
          <Sidebar />

          {/* Main content — scrollable, takes remaining width */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>

      </body>
    </html>
  );
}
