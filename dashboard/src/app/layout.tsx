import { LanguageDocument, SkipLink } from "@/components/i18n/Language";
import type { Metadata } from "next";
import { TourLayout, ContactCta } from "@/components/shared/DemoGuide";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { DemoProvider } from "@/components/shared/DemoProvider";
import { demoSnapshots, revenueHistory } from "@/lib/demo-data";
import "./globals.css";

export const metadata: Metadata = {
  title: "CFO Dashboard · Stricker Interim",
  description: "Unternehmenssteuerung, Performance und Liquidität – interaktive Dashboard-Demo.",
};
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var p=matchMedia('(prefers-color-scheme:light)').matches?'light':'dark';document.documentElement.dataset.theme=(t==='light'||t==='dark')?t:p}catch(e){document.documentElement.dataset.theme='dark'}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <LanguageDocument />
        <SkipLink />
        <DemoProvider snapshots={demoSnapshots} history={revenueHistory}>
          <Header />
          <div className="app-shell">
            <Sidebar />
            <main id="main-content" className="main-content">
              <TourLayout>
                {children}
                <ContactCta />
              </TourLayout>
            </main>
          </div>
        </DemoProvider>
      </body>
    </html>
  );
}
