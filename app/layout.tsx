import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Handoff Harness",
  description:
    "Turn a completed design change into audience-tailored handoff communications, reviewed by a human before they go out.",
};

// Apply the saved theme before first paint so there's no light→dark flash.
// Defaults to light to match the Praxis prototype.
const themeInit = `(function(){try{var t=localStorage.getItem('handoff-theme');document.body.dataset.theme=(t==='dark'?'dark':'light');}catch(e){document.body.dataset.theme='light';}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body data-variant="praxis" data-theme="light">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {children}
      </body>
    </html>
  );
}
