import type { Metadata } from "next";
import "./globals.css";
import { RunProvider } from "./RunProvider";

export const metadata: Metadata = {
  title: "Handoff Harness",
  description:
    "Turn a completed design change into audience-tailored handoff communications, reviewed by a human before they go out.",
};

// Apply the saved theme before first paint so there's no light→dark flash.
// Defaults to light to match the Nexus prototype.
const themeInit = `(function(){try{var t=localStorage.getItem('handoff-theme');document.body.dataset.theme=(t==='dark'?'dark':'light');}catch(e){document.body.dataset.theme='light';}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/*
        suppressHydrationWarning: the themeInit script above mutates body's
        data-theme before React hydrates (to avoid a theme flash), and browser
        extensions (e.g. ColorZilla's cz-shortcut-listen) inject their own body
        attributes pre-hydration. Both make the server/client body attributes
        differ benignly. This suppresses warnings for body's OWN attributes only
        — genuine mismatches in children still surface.
      */}
      <body data-variant="nexus" data-theme="light" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <RunProvider>{children}</RunProvider>
      </body>
    </html>
  );
}
