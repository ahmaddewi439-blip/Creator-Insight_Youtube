import Script from 'next/script';
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Creator Insight YouTube Analyzer",
  description: "YouTube Analyzer and Roblox Shorts Creator for personal workflow"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      {/* Kunci Lapis 1: Body */}
      <body style={{ margin: 0, padding: 0, overflowX: "hidden", width: "100%", maxWidth: "100vw" }}>
        
        {/* Kunci Lapis 2: WADAH BAJA ANTI-BOCOR (MENGUNCI LAYAR HP 100%) */}
        <div style={{ width: "100%", maxWidth: "100vw", overflowX: "hidden", position: "relative" }}>
          <Providers>
            {children}
          </Providers>
        </div>

        {/* ================= AUTO TRANSLATE GLOBAL ================= */}
        <div id="google_translate_element" style={{ display: 'none' }}></div>
        
        <Script id="google-translate-config" strategy="afterInteractive">
          {`
            function googleTranslateElementInit() {
              new google.translate.TranslateElement({
                pageLanguage: 'id',
                autoDisplay: false
              }, 'google_translate_element');
              
              setTimeout(function() {
                  var lang = navigator.language || navigator.userLanguage; 
                  if (lang.indexOf('id') === -1) {
                     var selectField = document.querySelector("select.goog-te-combo");
                     if (selectField) {
                         selectField.value = lang.split('-')[0];
                         selectField.dispatchEvent(new Event('change'));
                     }
                  }
              }, 1000);
            }
          `}
        </Script>
        
        <Script 
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" 
          strategy="afterInteractive" 
        />
        {/* ========================================================= */}

      </body>
    </html>
  );
}