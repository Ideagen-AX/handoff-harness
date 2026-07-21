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
      {/* suppressHydrationWarning: the pre-paint themeInit script and some browser
          extensions (e.g. ColorZilla's cz-shortcut-listen) mutate <body>'s own
          attributes before React hydrates. This suppresses ONLY the body element's
          attribute diff, not its subtree — real mismatches in children still warn. */}
      <body data-variant="nexus" data-theme="light" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <RunProvider>{children}</RunProvider>
      </body>
    </html>
  );
}
