import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CFO Dashboard",
  description: "AI-powered financial analysis for CFOs",
};

// Runs before React hydrates — prevents white flash when user has saved a theme.
// Reads localStorage, falls back to system preference, falls back to dark.
const themeScript = `
  (function() {
    try {
      var stored = localStorage.getItem('theme');
      var preferred = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', stored || preferred);
    } catch(e) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  })();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" data-theme="dark" className={`${inter.variable} h-full antialiased`}>
      <head>
        {/* dangerouslySetInnerHTML is safe here — no user input, static string */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full bg-bg text-ink flex flex-col">

        <Header />

        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>

      </body>
    </html>
  );
}
