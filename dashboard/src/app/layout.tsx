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
const themeScript = `(function(){var q=new URLSearchParams(location.search).get('theme');var t;try{t=localStorage.getItem('theme')}catch(e){}var v=(q==='light'||q==='dark')?q:(t==='light'||t==='dark')?t:matchMedia('(prefers-color-scheme:light)').matches?'light':'dark';document.documentElement.dataset.theme=v;if(q==='light'||q==='dark'){try{localStorage.setItem('theme',v)}catch(e){}try{var u=new URL(location.href);u.searchParams.delete('theme');history.replaceState(history.state,'',u.href)}catch(e){}}})();`;

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
